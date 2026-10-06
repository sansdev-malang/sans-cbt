<?php

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;

test('admin can create a student and assign classes', function () {
    $admin = User::factory()->admin()->create();
    $class = SchoolClass::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.students.store'), [
            'nis' => '20260001',
            'nisn' => '0012345678',
            'full_name' => 'Aisyah Rahman',
            'gender' => 'P',
            'birth_date' => '2016-05-12',
            'class_ids' => [$class->id],
        ])
        ->assertRedirect(route('admin.students.index'));

    $student = Student::query()->where('nis', '20260001')->firstOrFail();

    $this->assertDatabaseHas('students', ['id' => $student->id, 'full_name' => 'Aisyah Rahman']);
    $this->assertDatabaseHas('class_students', ['class_id' => $class->id, 'student_id' => $student->id]);
});

test('admin can update a student class assignment', function () {
    $admin = User::factory()->admin()->create();
    $previousClass = SchoolClass::factory()->create(['name' => '4A']);
    $newClass = SchoolClass::factory()->create(['name' => '5A']);
    $student = Student::factory()->create(['nis' => '20260002']);
    $student->classes()->attach($previousClass);

    $this->actingAs($admin)
        ->patch(route('admin.students.update', $student), [
            'nis' => '20260002',
            'full_name' => 'Bima Pratama',
            'class_ids' => [$newClass->id],
        ])
        ->assertRedirect(route('admin.students.index'));

    $this->assertDatabaseHas('class_students', ['class_id' => $newClass->id, 'student_id' => $student->id]);
    $this->assertDatabaseMissing('class_students', ['class_id' => $previousClass->id, 'student_id' => $student->id]);
});

test('student creation rejects a duplicate NIS', function () {
    $admin = User::factory()->admin()->create();
    Student::factory()->create(['nis' => '20260003']);

    $this->actingAs($admin)
        ->from(route('admin.students.create'))
        ->post(route('admin.students.store'), ['nis' => '20260003', 'full_name' => 'Citra Lestari'])
        ->assertRedirect(route('admin.students.create'))
        ->assertSessionHasErrors('nis');
});
