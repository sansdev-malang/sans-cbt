<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the dashboard for the authenticated user.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user instanceof User && $user->hasRole(Role::Admin)) {
            return to_route('admin.dashboard');
        }

        if ($user instanceof User && $user->hasRole(Role::Guru)) {
            return to_route('teacher.dashboard');
        }

        if ($user instanceof User && $user->hasRole(Role::Siswa)) {
            return to_route('student.exams.index');
        }

        return Inertia::render('dashboard');
    }
}
