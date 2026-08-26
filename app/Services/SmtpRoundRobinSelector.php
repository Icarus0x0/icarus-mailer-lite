<?php

namespace App\Services;

use App\Models\Smtp;
use App\Models\User;

/**
 * Lite Version — basic round-robin SMTP rotation only.
 *
 * No health scoring, reputation gating, or rate-limit-aware exclusion —
 * see Icarus Mailer Pro Enterprise for adaptive SMTP selection.
 */
class SmtpRoundRobinSelector
{
    /**
     * Pick the SMTP for the Nth send in a campaign by simple round-robin
     * over the user's active SMTPs, ordered by id for a stable rotation.
     */
    public function pick(int $userId, int $index): ?Smtp
    {
        $active = Smtp::where('user_id', $userId)->active()->orderBy('id')->get();

        if ($active->isEmpty()) {
            return null;
        }

        return $active[$index % $active->count()];
    }
}
