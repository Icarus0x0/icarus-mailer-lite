<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendCampaignEmailJob;
use App\Models\Campaign;
use App\Models\RecipientList;
use App\Models\SendJob;
use App\Services\SmtpRoundRobinSelector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Lite Version — single-threaded launch, no batch pacing/stagger delays,
 * no per-SMTP hourly caps, no pause-mid-batch handling beyond a simple
 * status flag. See Icarus Mailer Pro Enterprise for production-scale
 * campaign throughput controls.
 */
class CampaignController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Campaign::where('user_id', $request->user()->id)->orderByDesc('id')->get()
        );
    }

    public function store(Request $request)
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'from_email' => 'nullable|email|max:255',
            'from_name' => 'nullable|string|max:255',
            'template_id' => ['required', Rule::exists('email_templates', 'id')->where('user_id', $userId)],
            'recipient_list_id' => ['required', Rule::exists('recipient_lists', 'id')->where('user_id', $userId)],
        ]);

        $recipientList = RecipientList::where('user_id', $userId)->findOrFail($validated['recipient_list_id']);

        $campaign = Campaign::create([
            ...$validated,
            'user_id' => $userId,
            'total_recipients' => $recipientList->total_count,
            'status' => 'draft',
        ]);

        return response()->json($campaign, 201);
    }

    public function show(Request $request, Campaign $campaign)
    {
        if ($campaign->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($campaign->load('sendJobs'));
    }

    public function destroy(Request $request, Campaign $campaign)
    {
        if ($campaign->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $campaign->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function launch(Request $request, Campaign $campaign)
    {
        if ($campaign->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (!in_array($campaign->status, ['draft'], true)) {
            return response()->json(['message' => 'Campaign must be in draft status to launch'], 422);
        }

        $template = $campaign->template;
        $recipientList = $campaign->recipientList()->first(['id', 'recipients']);
        $recipients = $recipientList->recipients ?? [];

        if (empty($recipients)) {
            return response()->json(['message' => 'Recipient list is empty'], 422);
        }

        $selector = new SmtpRoundRobinSelector();
        $sendJobIds = [];

        DB::transaction(function () use ($campaign, $template, $recipients, $selector, &$sendJobIds) {
            $now = now();
            $index = 0;
            $rows = [];

            foreach ($recipients as $recipient) {
                $email = $recipient['recipient_email'] ?? null;
                if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    continue;
                }

                $smtp = $selector->pick($campaign->user_id, $index++);

                $rows[] = [
                    'user_id' => $campaign->user_id,
                    'campaign_id' => $campaign->id,
                    'smtp_id' => $smtp?->id,
                    'recipient_email' => $email,
                    'recipient_name' => $recipient['recipient_name'] ?? null,
                    'subject' => $campaign->subject,
                    'body_html' => $template->html_body,
                    'body_text' => $template->text_body,
                    'status' => 'pending',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (empty($rows)) {
                return;
            }

            DB::table('send_jobs')->insert($rows);
            $sendJobIds = SendJob::where('campaign_id', $campaign->id)->pluck('id')->all();

            $campaign->update([
                'status' => 'sending',
                'total_recipients' => count($rows),
                'started_at' => $now,
            ]);
        });

        if (empty($sendJobIds)) {
            $campaign->update(['status' => 'draft']);
            return response()->json(['message' => 'No valid recipients found'], 422);
        }

        foreach ($sendJobIds as $id) {
            SendCampaignEmailJob::dispatch($id);
        }

        return response()->json([
            'message' => 'Campaign launched',
            'data' => $campaign->fresh(),
        ]);
    }

    public function pause(Request $request, Campaign $campaign)
    {
        if ($campaign->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($campaign->status !== 'sending') {
            return response()->json(['message' => 'Campaign must be sending to pause'], 422);
        }

        $campaign->update(['status' => 'paused']);

        return response()->json(['message' => 'Campaign paused', 'data' => $campaign]);
    }

    public function resume(Request $request, Campaign $campaign)
    {
        if ($campaign->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($campaign->status !== 'paused') {
            return response()->json(['message' => 'Campaign must be paused to resume'], 422);
        }

        $campaign->update(['status' => 'sending']);

        $pendingIds = SendJob::where('campaign_id', $campaign->id)
            ->where('status', 'pending')
            ->pluck('id');

        foreach ($pendingIds as $id) {
            SendCampaignEmailJob::dispatch($id);
        }

        return response()->json(['message' => 'Campaign resumed', 'data' => $campaign]);
    }
}
