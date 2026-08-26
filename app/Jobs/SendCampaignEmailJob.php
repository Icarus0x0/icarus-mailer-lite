<?php

namespace App\Jobs;

use App\Models\SendJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * Lite Version — sends a single campaign email via a plain SMTP connection.
 *
 * No proxy IP masking, no DKIM self-signing, no VERP bounce tracking, no
 * deliverability scoring — see Icarus Mailer Pro Enterprise for those.
 */
class SendCampaignEmailJob implements ShouldQueue
{
    use Queueable;

    public $tries = 3;
    public $backoff = 60;

    public function __construct(public int $sendJobId)
    {
    }

    public function handle(): void
    {
        $job = SendJob::with(['smtp', 'campaign'])->find($this->sendJobId);

        if (!$job || $job->status !== 'pending') {
            return;
        }

        // Stop cleanly if the campaign was paused/deleted since this job was queued.
        if (!$job->campaign || $job->campaign->status === 'paused') {
            return;
        }

        $smtp = $job->smtp;
        if (!$smtp || !$smtp->active) {
            $job->update(['status' => 'failed', 'error_message' => 'No active SMTP assigned']);
            $this->bumpFailed($job);
            return;
        }

        $job->update(['status' => 'processing', 'attempts' => $job->attempts + 1]);

        try {
            $transport = new EsmtpTransport($smtp->host, $smtp->port, $smtp->encryption === 'ssl');
            if ($smtp->encryption === 'tls') {
                $transport->setStreamOptions(array_merge_recursive(
                    $transport->getStream()->getStreamOptions() ?? [],
                    ['ssl' => ['allow_self_signed' => true, 'verify_peer' => false]]
                ));
            }
            $transport->setUsername($smtp->username);
            $transport->setPassword($smtp->password);

            $mailer = new Mailer($transport);

            $email = (new Email())
                ->from(new Address($job->campaign->from_email ?: $smtp->from_email, $job->campaign->from_name ?: $smtp->from_name ?? ''))
                ->to(new Address($job->recipient_email, $job->recipient_name ?? ''))
                ->subject($job->subject);

            if ($job->body_html) {
                $email->html($job->body_html);
            }
            if ($job->body_text) {
                $email->text($job->body_text);
            }
            if (!$job->body_html && !$job->body_text) {
                $email->text(' ');
            }

            $mailer->send($email);

            $job->update(['status' => 'sent', 'error_message' => null]);
            $job->campaign->increment('sent_count');
        } catch (\Throwable $e) {
            Log::warning("SendCampaignEmailJob failed for send_job {$job->id}: {$e->getMessage()}");
            $job->update(['status' => 'failed', 'error_message' => substr($e->getMessage(), 0, 250)]);
            $this->bumpFailed($job);
        }

        $this->maybeCompleteCampaign($job);
    }

    private function bumpFailed(SendJob $job): void
    {
        $job->campaign?->increment('failed_count');
    }

    private function maybeCompleteCampaign(SendJob $job): void
    {
        $campaign = $job->campaign;
        if (!$campaign) {
            return;
        }

        $remaining = SendJob::where('campaign_id', $campaign->id)
            ->whereIn('status', ['pending', 'processing'])
            ->exists();

        if (!$remaining && $campaign->status !== 'completed') {
            $campaign->update(['status' => 'completed', 'completed_at' => now()]);
        }
    }
}
