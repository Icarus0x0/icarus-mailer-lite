<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecipientList;
use Illuminate\Http\Request;

class RecipientListController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            RecipientList::where('user_id', $request->user()->id)
                ->orderByDesc('id')
                ->get(['id', 'user_id', 'name', 'total_count', 'created_at', 'updated_at'])
        );
    }

    /**
     * Accepts either a raw pasted block of emails (one per line, optionally
     * "email,name") or a JSON array of {recipient_email, recipient_name}.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'emails' => 'required_without:recipients|nullable|string',
            'recipients' => 'required_without:emails|nullable|array',
            'recipients.*.recipient_email' => 'required_with:recipients|email',
            'recipients.*.recipient_name' => 'nullable|string',
        ]);

        $recipients = $validated['recipients'] ?? $this->parsePastedEmails($validated['emails']);

        if (empty($recipients)) {
            return response()->json(['message' => 'No valid email addresses found'], 422);
        }

        $list = RecipientList::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'recipients' => $recipients,
            'total_count' => count($recipients),
        ]);

        return response()->json($list->makeVisible('recipients'), 201);
    }

    public function show(Request $request, RecipientList $recipientList)
    {
        if ($recipientList->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($recipientList->makeVisible('recipients'));
    }

    public function destroy(Request $request, RecipientList $recipientList)
    {
        if ($recipientList->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $recipientList->delete();

        return response()->json(['message' => 'Deleted']);
    }

    private function parsePastedEmails(string $raw): array
    {
        $recipients = [];
        $seen = [];

        foreach (preg_split('/\r\n|\r|\n/', $raw) as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            [$email, $name] = array_pad(explode(',', $line, 2), 2, null);
            $email = strtolower(trim($email));

            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || isset($seen[$email])) {
                continue;
            }

            $seen[$email] = true;
            $recipients[] = ['recipient_email' => $email, 'recipient_name' => $name ? trim($name) : null];
        }

        return $recipients;
    }
}
