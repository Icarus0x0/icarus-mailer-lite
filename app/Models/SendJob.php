<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SendJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'campaign_id',
        'smtp_id',
        'recipient_email',
        'recipient_name',
        'subject',
        'body_html',
        'body_text',
        'status',
        'error_message',
        'attempts',
    ];

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    public function smtp()
    {
        return $this->belongsTo(Smtp::class);
    }
}
