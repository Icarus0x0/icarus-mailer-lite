<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\Request;

class EmailTemplateController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            EmailTemplate::where('user_id', $request->user()->id)->orderByDesc('id')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'html_body' => 'nullable|string',
            'text_body' => 'nullable|string',
        ]);

        $template = EmailTemplate::create([...$validated, 'user_id' => $request->user()->id]);

        return response()->json($template, 201);
    }

    public function update(Request $request, EmailTemplate $template)
    {
        if ($template->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'subject' => 'sometimes|required|string|max:255',
            'html_body' => 'nullable|string',
            'text_body' => 'nullable|string',
        ]);

        $template->update($validated);

        return response()->json($template);
    }

    public function destroy(Request $request, EmailTemplate $template)
    {
        if ($template->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $template->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
