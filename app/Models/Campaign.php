<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'subject',
        'from_email',
        'from_name',
        'template_id',
        'recipient_list_id',
        'status',
        'total_recipients',
        'sent_count',
        'failed_count',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function template()
    {
        return $this->belongsTo(EmailTemplate::class, 'template_id');
    }

    public function recipientList()
    {
        return $this->belongsTo(RecipientList::class, 'recipient_list_id');
    }

    public function sendJobs()
    {
        return $this->hasMany(SendJob::class);
    }
}
