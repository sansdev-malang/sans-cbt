<?php

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('class management page shows the enrolled student count', function () {
    $admin = User::factory()->admin()->create();
    $class = SchoolClass::factory()->create(['name' => '6A']);
    $students = Student::factory()->count(2)->create();
    $class->students()->attach($students);

    $this->actingAs($admin)
        ->get(route('admin.classes.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/classes/index')
            ->where('classes.data.0.name', '6A')
            ->where('classes.data.0.students_count', 2),
        );
});
