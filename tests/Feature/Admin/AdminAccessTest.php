<?php

use App\Models\User;
use App\Role;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
});

test('users without the admin role can not access the admin area', function (Role $role) {
    $this->actingAs(User::factory()->withRole($role)->create())
        ->get(route('admin.dashboard'))
        ->assertForbidden();
})->with([
    'guru' => Role::Guru,
    'siswa' => Role::Siswa,
]);

test('users without any role can not access the admin area', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('non admin users can not access the user management page', function () {
    $this->actingAs(User::factory()->guru()->create())
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

test('admin users can visit the admin dashboard', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/dashboard'));
});

test('admin users can visit every admin menu page', function (string $routeName) {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route($routeName))
        ->assertOk();
})->with([
    'admin.users.index',
    'admin.classes.index',
    'admin.subjects.index',
    'admin.people.index',
    'admin.exam-monitoring.index',
    'admin.audit-logs.index',
    'admin.reports.index',
]);
