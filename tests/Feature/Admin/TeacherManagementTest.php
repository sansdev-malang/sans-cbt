<?php

use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\User;

test('admin can create a teacher linked to a teacher account', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->guru()->create();

    $this->actingAs($admin)
        ->post(route('admin.teachers.store'), [
            'user_id' => $user->id,
            'nip' => '19870001',
            'full_name' => 'Siti Aminah',
            'phone' => '081234567890',
        ])
        ->assertRedirect(route('admin.teachers.index'));

    $this->assertDatabaseHas('teachers', ['user_id' => $user->id, 'nip' => '19870001', 'full_name' => 'Siti Aminah']);
});

test('teacher management page lists homeroom classes', function () {
    $admin = User::factory()->admin()->create();
    $teacher = Teacher::factory()->create(['full_name' => 'Budi Santoso']);
    SchoolClass::factory()->create(['name' => '3A', 'homeroom_teacher_id' => $teacher->id]);

    $this->actingAs($admin)
        ->get(route('admin.teachers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/teachers/index')
            ->where('teachers.data.0.full_name', 'Budi Santoso')
            ->where('teachers.data.0.homeroom_classes.0', '3A (2026/2027)'),
        );
});

test('teacher creation rejects a duplicate NIP', function () {
    $admin = User::factory()->admin()->create();
    Teacher::factory()->create(['nip' => '19870002']);

    $this->actingAs($admin)
        ->from(route('admin.teachers.create'))
        ->post(route('admin.teachers.store'), ['nip' => '19870002', 'full_name' => 'Citra Dewi'])
        ->assertRedirect(route('admin.teachers.create'))
        ->assertSessionHasErrors('nip');
});
