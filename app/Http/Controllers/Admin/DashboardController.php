<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Role;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the admin dashboard with user statistics.
     */
    public function __invoke(): Response
    {
        $userCounts = User::query()
            ->selectRaw('role, count(*) as total')
            ->whereNotNull('role')
            ->groupBy('role')
            ->pluck('total', 'role');

        $stats = [
            ['label' => 'Total Pengguna', 'value' => User::query()->count()],
            ...array_map(
                fn (Role $role): array => [
                    'label' => $role->label(),
                    'value' => (int) $userCounts->get($role->value, 0),
                ],
                Role::cases(),
            ),
        ];

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recentUsers' => User::query()
                ->latest('id')
                ->limit(5)
                ->get()
                ->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_label' => $user->role?->label() ?? 'Belum ditetapkan',
                ])
                ->all(),
        ]);
    }
}
