<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Smtp;
use App\Services\SmtpTransportFactory;
use Illuminate\Http\Request;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

class SmtpController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Smtp::where('user_id', $request->user()->id)->orderByDesc('id')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'host' => 'required|string|max:255',
            'port' => 'required|integer|min:1|max:65535',
            'username' => 'required|string|max:255',
            'password' => 'required|string',
            'encryption' => 'required|in:none,tls,ssl',
            'from_email' => 'required|email|max:255',
            'from_name' => 'nullable|string|max:255',
        ]);

        $smtp = Smtp::create([...$validated, 'user_id' => $request->user()->id, 'active' => true]);

        return response()->json($smtp, 201);
    }

    public function update(Request $request, Smtp $smtp)
    {
        if ($smtp->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'host' => 'sometimes|required|string|max:255',
            'port' => 'sometimes|required|integer|min:1|max:65535',
            'username' => 'sometimes|required|string|max:255',
            'password' => 'sometimes|nullable|string',
            'encryption' => 'sometimes|required|in:none,tls,ssl',
            'from_email' => 'sometimes|required|email|max:255',
            'from_name' => 'nullable|string|max:255',
            'active' => 'sometimes|boolean',
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']); // keep existing password when left blank
        }

        $smtp->update($validated);

        return response()->json($smtp);
    }

    public function destroy(Request $request, Smtp $smtp)
    {
        if ($smtp->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $smtp->delete();

        return response()->json(['message' => 'Deleted']);
    }

    /**
     * Send a real test email to verify the SMTP credentials work.
     */
    public function test(Request $request, Smtp $smtp)
    {
        if ($smtp->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'recipient_email' => 'required|email',
        ]);

        try {
            $mailer = new Mailer(SmtpTransportFactory::build($smtp));

            $email = (new Email())
                ->from(new Address($smtp->from_email, $smtp->from_name ?? ''))
                ->to(new Address($validated['recipient_email']))
                ->subject('SMTP Test Email — Icarus Mailer Lite')
                ->text("This is a test email confirming your SMTP configuration works.\n\nHost: {$smtp->host}\nPort: {$smtp->port}");

            $mailer->send($email);

            return response()->json(['success' => true, 'message' => 'Test email sent successfully']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
