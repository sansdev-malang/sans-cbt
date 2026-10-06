<?php

namespace App\Providers;

use App\Services\ExamAuditLogger;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
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
