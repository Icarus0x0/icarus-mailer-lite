<?php

namespace App\Services;

use App\Models\Smtp;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;

class SmtpTransportFactory
{
    public static function build(Smtp $smtp): EsmtpTransport
    {
        // EsmtpTransport's $tls constructor param: true = implicit TLS/SSL
        // (port 465 style), null = auto-negotiate STARTTLS if the server
        // advertises it (port 587 style — this is what "tls" encryption
        // means here), false = disable TLS/STARTTLS entirely for "none".
        // Passing false for the STARTTLS case would call disableTls()
        // internally, which — despite the name only mentioning TLS/SSL —
        // also disables STARTTLS negotiation, silently downgrading every
        // "tls"-encryption SMTP account to a plaintext connection.
        $tls = match ($smtp->encryption) {
            'ssl' => true,
            'tls' => null,
            default => false,
        };

        $transport = new EsmtpTransport($smtp->host, $smtp->port, $tls);

        // Self-hosted relays (e.g. Postal, PowerMTA) commonly present a
        // self-signed or otherwise unverifiable certificate.
        $transport->getStream()->setStreamOptions([
            'ssl' => ['allow_self_signed' => true, 'verify_peer' => false],
        ]);

        $transport->setUsername($smtp->username);
        $transport->setPassword($smtp->password);

        return $transport;
    }
}
