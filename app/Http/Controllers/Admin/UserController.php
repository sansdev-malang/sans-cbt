<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ManagedUserRequest;
use App\Models\User;
use App\Role;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of the application users.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();
        $unit = $request->string('unit')->trim()->value() ?: 'all';

        $users = User::query()
            ->when($unit !== 'all', fn (Builder $query) => $query->where('unit', $unit))
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->orderBy('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'unit' => $user->unit ?? 'sd',
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
                'role_label' => $user->role?->label() ?? 'Belum ditetapkan',
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        $unitCounts = [
            'all' => User::count(),
            'sd' => User::where('unit', 'sd')->count(),
            'smp' => User::where('unit', 'smp')->count(),
        ];

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => Role::options(),
            'unitCounts' => $unitCounts,
            'filters' => [
                'search' => $search,
                'unit' => $unit,
            ],
        ]);
    }

    public function store(ManagedUserRequest $request): RedirectResponse
    {
        $payload = $request->safe()->only(['name', 'email', 'role', 'password']);
        $payload['unit'] = $request->input('unit', 'sd');

        User::query()->create($payload);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Akun pengguna berhasil ditambahkan.']);

        return to_route('admin.users.index');
    }

    public function update(ManagedUserRequest $request, User $user): RedirectResponse
    {
        abort_if($request->user()?->is($user), 403);

        $attributes = $request->safe()->only(['name', 'email', 'role']);
        if ($request->filled('unit')) {
            $attributes['unit'] = $request->input('unit');
        }

        if ($request->filled('password')) {
            $attributes['password'] = $request->string('password')->value();
        }

        $user->update($attributes);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Akun pengguna berhasil diperbarui.']);

        return to_route('admin.users.index');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_if($request->user()?->is($user), 403);

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Akun pengguna berhasil dihapus.']);

        return to_route('admin.users.index');
    }
}
