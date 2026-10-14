<?php

namespace App\Providers;

use App\Services\ExamAuditLogger;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureExamRateLimiting();
        $this->listenForAuthAuditEvents();
    }

    /**
     * Record LOGIN and LOGOUT into the audit trail (spec 17).
     */
    protected function listenForAuthAuditEvents(): void
    {
        $logger = app(ExamAuditLogger::class);

        Event::listen(fn (Login $event) => $logger->authEvent($event->user, 'LOGIN'));
        Event::listen(fn (Logout $event) => $logger->authEvent($event->user, 'LOGOUT'));
    }

    protected function configureExamRateLimiting(): void
    {
        RateLimiter::for('exam-answer', function (Request $request): Limit {
            $identity = $request->user()?->getAuthIdentifier() ?? $request->ip();

            return Limit::perMinute(180)->by("exam-answer:{$identity}");
        });

        RateLimiter::for('exam-security', function (Request $request): Limit {
            $identity = $request->user()?->getAuthIdentifier() ?? $request->ip();

            return Limit::perMinute(30)->by("exam-security:{$identity}");
        });

        RateLimiter::for('exam-status', function (Request $request): Limit {
            $identity = $request->user()?->getAuthIdentifier() ?? $request->ip();

            return Limit::perMinute(45)->by("exam-status:{$identity}");
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
