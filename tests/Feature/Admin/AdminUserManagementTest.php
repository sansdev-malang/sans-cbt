<?php

use App\Models\User;
use App\Role;
use Inertia\Testing\AssertableInertia as Assert;

test('user management page lists users with their roles', function () {
    $admin = User::factory()->admin()->create(['name' => 'Ahmad Admin']);
    User::factory()->guru()->create(['name' => 'Budi Guru']);

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->has('users.data', 2)
            ->where('users.data.0.name', 'Ahmad Admin')
            ->where('users.data.0.role', Role::Admin->value)
            ->where('users.data.0.role_label', Role::Admin->label())
            ->where('users.data.1.name', 'Budi Guru')
            ->where('users.data.1.role', Role::Guru->value)
            ->where('users.data.1.role_label', Role::Guru->label()),
        );
});

test('user management page filters users by name or email', function () {
    $admin = User::factory()->admin()->create(['name' => 'Ahmad Admin']);
    User::factory()->siswa()->create(['name' => 'Budi Santoso', 'email' => 'budi@example.com']);
    User::factory()->siswa()->create(['name' => 'Citra Dewi', 'email' => 'citra@example.com']);

    $search = 'citra';

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['search' => $search]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Citra Dewi')
            ->where('filters.search', $search),
        );
});

test('admin dashboard summarises users per role', function () {
    $admin = User::factory()->admin()->create();

    User::factory()->guru()->create();
    User::factory()->siswa()->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->where('stats.0.label', 'Total Pengguna')
            ->where('stats.0.value', 3)
            ->where('stats.1.label', Role::Admin->label())
            ->where('stats.1.value', 1)
            ->where('stats.2.label', Role::Guru->label())
            ->where('stats.2.value', 1)
            ->where('stats.3.label', Role::Siswa->label())
            ->where('stats.3.value', 1),
        );
});

test('admin can create a user account', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Siti Guru',
            'email' => 'siti@example.com',
            'role' => Role::Guru->value,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertRedirect(route('admin.users.index'));

    $this->assertDatabaseHas('users', ['name' => 'Siti Guru', 'email' => 'siti@example.com', 'role' => Role::Guru->value]);
});

test('admin can update another user account', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->siswa()->create(['email' => 'lama@example.com']);

    $this->actingAs($admin)
        ->patch(route('admin.users.update', $user), [
            'name' => 'Dimas Siswa',
            'email' => 'baru@example.com',
            'role' => Role::Guru->value,
        ])
        ->assertRedirect(route('admin.users.index'));

    $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Dimas Siswa', 'email' => 'baru@example.com', 'role' => Role::Guru->value]);
});

test('admin cannot delete their own account', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $admin))
        ->assertForbidden();

    $this->assertModelExists($admin);
});
