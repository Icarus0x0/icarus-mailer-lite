<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecipientList extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'name', 'recipients', 'total_count'];

    protected $casts = ['recipients' => 'array'];

    protected $hidden = ['recipients']; // can be huge — never dump into a JSON response by default

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
