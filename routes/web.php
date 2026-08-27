<?php

use Illuminate\Support\Facades\Route;

/**
 * The React SPA (frontend/) is mounted at /app — not the domain root —
 * so its assets (which the build emits under /app/assets/...) never
 * collide with anything Laravel's own public/ directory might serve, and
 * so a plain "static index.html at the web root" can't ever shadow
 * Laravel's own index.php in the webserver's try_files chain. React
 * Router's basename is set to "/app" (see frontend/src/main.tsx) to
 * match, so redirect the bare root there rather than also serving the
 * SPA's index.html at "/" — visiting "/" with a basename of "/app"
 * would leave every route unmatched.
 */
Route::redirect('/', '/app');

/**
 * Serves the built SPA for every request under /app, so client-side
 * routing (login page, dashboard, etc.) works on a hard refresh or
 * direct link. The build outputs straight into public/app/ (see
 * frontend/vite.config.ts) — degrades to a clean 404 rather than a fatal
 * error when the frontend hasn't been built yet (e.g. local API-only
 * development, or before `npm run build` has been run).
 */
$serveSpa = function () {
    $indexPath = public_path('app/index.html');

    if (!file_exists($indexPath)) {
        abort(404, 'Frontend not built yet — run `npm run build` in the frontend/ directory.');
    }

    return response()->file($indexPath);
};

Route::get('/app', $serveSpa);
Route::get('/app/{any}', $serveSpa)->where('any', '.*');
