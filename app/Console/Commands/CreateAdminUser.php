<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Used by deploy/install.sh to provision the owner's login on a fresh
 * install. Generates a random password rather than accepting one on the
 * command line, so it never ends up in shell history or process listings.
 */
class CreateAdminUser extends Command
{
    protected $signature = 'app:create-admin {email} {--name=Admin}';

    protected $description = 'Create the first user account with a random password, printed once to stdout';

    public function handle(): int
    {
        $email = $this->argument('email');

        if (User::where('email', $email)->exists()) {
            $this->error("A user with email {$email} already exists.");

            return self::FAILURE;
        }

        $password = Str::password(20);

        User::create([
            'name' => $this->option('name'),
            'email' => $email,
            'password' => Hash::make($password),
        ]);

        // Machine-readable line the install script greps for — keep this
        // exact prefix stable.
        $this->line("ADMIN_CREDENTIALS|{$email}|{$password}");

        return self::SUCCESS;
    }
}
