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

        $users = User::query()
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->orderBy('id')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
                'role_label' => $user->role?->label() ?? 'Belum ditetapkan',
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => Role::options(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(ManagedUserRequest $request): RedirectResponse
    {
        User::query()->create($request->safe()->only(['name', 'email', 'role', 'password']));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Akun pengguna berhasil ditambahkan.']);

        return to_route('admin.users.index');
    }

    public function update(ManagedUserRequest $request, User $user): RedirectResponse
    {
        abort_if($request->user()?->is($user), 403);

        $attributes = $request->safe()->only(['name', 'email', 'role']);

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
