<?php

namespace Database\Seeders;

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    /**
     * Seed the master data (subjects, teachers, students, parents, and classes).
     */
    public function run(): void
    {
        $subjects = [
            ['code' => 'MTK', 'name' => 'Matematika'],
            ['code' => 'BIN', 'name' => 'Bahasa Indonesia'],
            ['code' => 'BIG', 'name' => 'Bahasa Inggris'],
            ['code' => 'IPA', 'name' => 'Ilmu Pengetahuan Alam'],
            ['code' => 'IPS', 'name' => 'Ilmu Pengetahuan Sosial'],
            ['code' => 'PPKN', 'name' => 'Pendidikan Pancasila'],
            ['code' => 'PAI', 'name' => 'Pendidikan Agama Islam'],
            ['code' => 'SBK', 'name' => 'Seni Budaya'],
            ['code' => 'PJOK', 'name' => 'Pendidikan Jasmani'],
            ['code' => 'INF', 'name' => 'Informatika'],
        ];

        foreach ($subjects as $subject) {
            Subject::query()->firstOrCreate(
                ['code' => $subject['code']],
                ['name' => $subject['name'], 'is_active' => true],
            );
        }

        $teacherUser = User::query()->where('email', 'guru@sekolahanaksaleh.sch.id')->first();

        $teacher = Teacher::query()->firstOrCreate(
            ['nip' => '198501012010011001'],
            [
                'user_id' => $teacherUser?->id,
                'full_name' => 'Budi Santoso',
                'phone' => '081200000001',
            ],
        );

        $studentUser = User::query()->where('email', 'siswa@sekolahanaksaleh.sch.id')->first();

        $student = Student::query()->firstOrCreate(
            ['nis' => '20260001'],
            [
                'user_id' => $studentUser?->id,
                'nisn' => '0012345678',
                'full_name' => 'Siti Aminah',
                'gender' => 'P',
                'birth_date' => '2016-05-12',
                'address' => 'Jl. Pendidikan No. 1',
            ],
        );

        foreach ([['1A', '1'], ['2A', '2'], ['3A', '3']] as [$name, $level]) {
            $class = SchoolClass::query()->firstOrCreate(
                ['name' => $name, 'academic_year' => '2026/2027'],
                ['level' => $level, 'homeroom_teacher_id' => $teacher->id],
            );

            $class->students()->syncWithoutDetaching([$student->id]);
        }
    }
}
