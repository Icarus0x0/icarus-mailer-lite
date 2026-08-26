<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('smtps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('host');
            $table->unsignedInteger('port')->default(587);
            $table->string('username');
            $table->text('password'); // encrypted at rest via model cast
            $table->enum('encryption', ['none', 'tls', 'ssl'])->default('tls');
            $table->string('from_email');
            $table->string('from_name')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('smtps');
    }
};
