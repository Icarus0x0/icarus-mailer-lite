<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\EmailTemplateController;
use App\Http\Controllers\Api\RecipientListController;
use App\Http\Controllers\Api\SmtpController;
use Illuminate\Support\Facades\Route;

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);

    Route::apiResource('smtps', SmtpController::class)->except(['show']);
    Route::post('smtps/{smtp}/test', [SmtpController::class, 'test']);

    Route::apiResource('templates', EmailTemplateController::class)->except(['show']);

    Route::apiResource('recipient-lists', RecipientListController::class)->only(['index', 'store', 'show', 'destroy']);

    Route::apiResource('campaigns', CampaignController::class)->except(['update']);
    Route::post('campaigns/{campaign}/launch', [CampaignController::class, 'launch']);
    Route::post('campaigns/{campaign}/pause', [CampaignController::class, 'pause']);
    Route::post('campaigns/{campaign}/resume', [CampaignController::class, 'resume']);
});
