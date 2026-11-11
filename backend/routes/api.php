<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

// Spec 7.5, Auth. Session cookies and CSRF, so these routes run the web middleware group.
Route::middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:web')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});
