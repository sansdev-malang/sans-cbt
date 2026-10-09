<?php

namespace App\Services;

use App\Models\Master\AcademicYear;
use App\Models\Master\Classroom;
use App\Models\Master\Semester;
use App\Models\Master\Student;
use App\Models\Master\Teacher;
use App\Support\UnitContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DatabaseIntegrationService
{
    /**
     * Get health status, metrics, and details for a single unit database.
     */
    public function getUnitStatus(string $unit): array
    {
        $info = UnitContext::getUnitInfo($unit);
        $connName = UnitContext::getConnection($unit);

        $startTime = microtime(true);
        $isConnected = false;
        $errorMessage = null;
        $stats = [
            'students_count' => 0,
            'active_students_count' => 0,
            'classrooms_count' => 0,
            'teachers_count' => 0,
            'active_academic_year' => null,
            'active_semester' => null,
        ];

        try {
            DB::connection($connName)->getPdo();
            $isConnected = true;
            $latencyMs = round((microtime(true) - $startTime) * 1000, 2);

            UnitContext::setUnit($unit);

            $stats['students_count'] = Student::count();
            $stats['active_students_count'] = Student::where('status', 'aktif')->orWhereNull('status')->count();
            $stats['classrooms_count'] = Classroom::count();
            $stats['teachers_count'] = Teacher::count();

            try {
                $activeAy = AcademicYear::where('is_active', true)->first();
                $stats['active_academic_year'] = $activeAy ? [
                    'id' => $activeAy->id,
                    'name' => $activeAy->name,
                    'is_active' => true,
                ] : null;
            } catch (\Throwable) {
                $stats['active_academic_year'] = null;
            }

            try {
                $activeSem = Semester::where('is_active', true)->first();
                $stats['active_semester'] = $activeSem ? [
                    'id' => $activeSem->id,
                    'name' => $activeSem->name,
                    'type' => $activeSem->semester_type ?? $activeSem->name,
                ] : null;
            } catch (\Throwable) {
                $stats['active_semester'] = null;
            }

        } catch (\Throwable $e) {
            $isConnected = false;
            $latencyMs = 0;
            $errorMessage = $e->getMessage();
            Log::warning("[Database Integration] Connection failed for unit {$unit}: " . $e->getMessage());
        }

        $config = config("database.connections.{$connName}", []);

        return [
            'unit' => $unit,
            'info' => $info,
            'connection' => $connName,
            'is_connected' => $isConnected,
            'latency_ms' => $latencyMs,
            'error_message' => $errorMessage,
            'database_name' => $config['database'] ?? $info['database'],
            'host' => $config['host'] ?? '127.0.0.1',
            'port' => $config['port'] ?? '3306',
            'stats' => $stats,
            'checked_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Get statuses for all available units.
     */
    public function getAllUnitsStatus(): array
    {
        $units = UnitContext::getAllUnits();
        $statuses = [];

        foreach ($units as $key => $unitData) {
            $statuses[$key] = $this->getUnitStatus($key);
        }

        return $statuses;
    }

    /**
     * Test single unit connection dynamically.
     */
    public function testConnection(string $unit): array
    {
        $startTime = microtime(true);
        $connName = UnitContext::getConnection($unit);

        try {
            DB::connection($connName)->getPdo();
            $latencyMs = round((microtime(true) - $startTime) * 1000, 2);
            $info = UnitContext::getUnitInfo($unit);

            UnitContext::setUnit($unit);
            $studentCount = Student::count();
            $classroomCount = Classroom::count();

            return [
                'success' => true,
                'unit' => $unit,
                'message' => "Koneksi ke Database [{$info['full_name']}] Berhasil! ({$latencyMs} ms). Ditemukan {$studentCount} siswa dan {$classroomCount} rombel.",
                'latency_ms' => $latencyMs,
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'unit' => $unit,
                'message' => "Gagal terhubung ke database unit {$unit}: " . $e->getMessage(),
                'latency_ms' => 0,
            ];
        }
    }

    /**
     * Preview Master Data from unit database.
     */
    public function previewMasterData(string $unit, string $type = 'students', int $limit = 15): array
    {
        UnitContext::setUnit($unit);

        return match ($type) {
            'classrooms' => [
                'type' => 'classrooms',
                'title' => 'Rombongan Belajar (Kelas)',
                'data' => Classroom::with(['classLevel', 'academicYear', 'homeroomTeacher'])
                    ->orderBy('class_level_id')
                    ->orderBy('code')
                    ->orderBy('name')
                    ->take($limit)
                    ->get()
                    ->map(fn($c) => [
                        'id' => $c->id,
                        'name' => $c->full_name,
                        'code' => $c->code,
                        'level' => $c->classLevel?->name ?? '-',
                        'academic_year' => $c->academicYear?->name ?? '-',
                        'homeroom_teacher' => $c->homeroomTeacher?->name ?? '-',
                        'is_active' => $c->is_active ?? true,
                    ]),
            ],
            'teachers' => [
                'type' => 'teachers',
                'title' => 'Guru & Tenaga Pendidik',
                'data' => Teacher::orderBy('name')
                    ->take($limit)
                    ->get()
                    ->map(fn($t) => [
                        'id' => $t->id,
                        'nip' => $t->nip ?? '-',
                        'name' => $t->name,
                        'email' => $t->email ?? '-',
                        'phone' => $t->phone ?? '-',
                        'position' => $t->position ?? 'Guru',
                        'is_active' => $t->is_active ?? true,
                    ]),
            ],
            'academic_years' => [
                'type' => 'academic_years',
                'title' => 'Tahun Pelajaran & Semester',
                'data' => AcademicYear::with('semesters')
                    ->orderBy('name', 'desc')
                    ->take($limit)
                    ->get()
                    ->map(fn($ay) => [
                        'id' => $ay->id,
                        'name' => $ay->name,
                        'is_active' => $ay->is_active,
                        'semesters' => $ay->semesters->map(fn($s) => $s->name . ($s->is_active ? ' (Aktif)' : ''))->join(', '),
                    ]),
            ],
            default => [
                'type' => 'students',
                'title' => 'Daftar Siswa Aktif',
                'data' => Student::with(['classroom', 'classLevel'])
                    ->orderBy('classroom_id')
                    ->orderBy('full_name')
                    ->take($limit)
                    ->get()
                    ->map(fn($s) => [
                        'id' => $s->id,
                        'nis' => $s->nis ?? '-',
                        'nisn' => $s->nisn ?? '-',
                        'name' => $s->full_name ?? ($s->name ?? '-'),
                        'gender' => $s->gender === 'P' || $s->gender === 'female' ? 'Perempuan' : 'Laki-laki',
                        'classroom' => $s->classroom?->full_name ?? ($s->classroom?->name ?? '-'),
                        'level' => $s->classLevel?->name ?? '-',
                        'status' => $s->status ?? 'aktif',
                    ]),
            ],
        };
    }

    /**
     * Synchronize master data from SD / SMP databases into CBT local database.
     */
    public function syncMasterData(string $targetUnit = 'all'): array
    {
        $units = $targetUnit === 'all' ? ['sd', 'smp'] : [$targetUnit];
        $summary = [
            'teachers_synced' => 0,
            'classes_synced' => 0,
            'students_synced' => 0,
            'users_synced' => 0,
            'units_processed' => [],
            'errors' => [],
        ];

        $defaultPassword = \Illuminate\Support\Facades\Hash::make('sans12345');

        DB::beginTransaction();
        try {
            $usersLookup = \App\Models\User::pluck('id', 'email')->all();
            $teachersLookup = \App\Models\Teacher::pluck('id', 'nip')->all();
            $teachersByName = \App\Models\Teacher::pluck('id', 'full_name')->all();
            $classesLookup = \App\Models\SchoolClass::get()->keyBy(fn($c) => "{$c->name}_{$c->academic_year}")->all();
            $studentsLookup = \App\Models\Student::pluck('id', 'nis')->all();

            foreach ($units as $unit) {
                $conn = UnitContext::getConnection($unit);
                $info = UnitContext::getUnitInfo($unit);

                // A. Teachers (Hanya Pegawai dengan peran Guru / Tenaga Pendidik / Wali Kelas)
                $teacherType = DB::connection($conn)->table('employee_types')
                    ->where('code', 'teacher')
                    ->orWhere('name', 'like', '%Guru%')
                    ->first();
                $teacherTypeId = $teacherType?->id ?? 1;

                $homeroomTeacherIds = DB::connection($conn)->table('classrooms')
                    ->whereNotNull('homeroom_teacher_id')
                    ->pluck('homeroom_teacher_id')
                    ->unique()
                    ->toArray();

                $masterEmployees = DB::connection($conn)->table('employees')
                    ->where(function ($q) use ($teacherTypeId, $homeroomTeacherIds) {
                        $q->where('employee_type_id', $teacherTypeId);
                        if (!empty($homeroomTeacherIds)) {
                            $q->orWhereIn('id', $homeroomTeacherIds);
                        }
                        $q->orWhere('position', 'like', '%Guru%')
                          ->orWhere('position', 'like', '%GPK%')
                          ->orWhere('position', 'like', '%GPQ%')
                          ->orWhere('position', 'like', '%Pengajar%')
                          ->orWhere('position', 'like', '%Pendidik%');
                    })
                    ->where(fn($q) => $q->where('status', 'Active')->orWhere('status', 'aktif')->orWhereNull('status'))
                    ->get();

                $validTeacherIds = [];
                $validUserIds = [];
                $employeeToTeacherId = [];

                foreach ($masterEmployees as $emp) {
                    $email = !empty($emp->email)
                        ? strtolower(trim($emp->email))
                        : (strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $emp->name)) . "_{$unit}@sans.test");

                    $nip = !empty($emp->nip) ? trim($emp->nip) : (!empty($emp->nik) ? trim($emp->nik) : "EMP_{$unit}_{$emp->id}");

                    // User account
                    if (!isset($usersLookup[$email])) {
                        $userId = DB::table('users')->insertGetId([
                            'name' => $emp->name,
                            'email' => $email,
                            'password' => $defaultPassword,
                            'role' => \App\Role::Guru->value,
                            'unit' => $unit,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $usersLookup[$email] = $userId;
                        $summary['users_synced']++;
                    } else {
                        $userId = $usersLookup[$email];
                        DB::table('users')->where('id', $userId)->update(['unit' => $unit]);
                    }

                    // Teacher record
                    $teacherId = $teachersLookup[$nip] ?? ($teachersByName[$emp->name] ?? null);
                    if (!$teacherId) {
                        $teacherId = DB::table('teachers')->insertGetId([
                            'unit' => $unit,
                            'user_id' => $userId,
                            'nip' => $nip,
                            'full_name' => $emp->name,
                            'phone' => $emp->phone ?? null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $teachersLookup[$nip] = $teacherId;
                        $teachersByName[$emp->name] = $teacherId;
                        $summary['teachers_synced']++;
                    } else {
                        DB::table('teachers')->where('id', $teacherId)->update([
                            'unit' => $unit,
                            'user_id' => $userId,
                            'full_name' => $emp->name,
                            'phone' => $emp->phone ?? null,
                            'updated_at' => now(),
                        ]);
                    }

                    $validTeacherIds[] = $teacherId;
                    $validUserIds[] = $userId;
                    $employeeToTeacherId[$emp->id] = $teacherId;
                }

                // Bersihkan pegawai non-guru yang sebelumnya ter-sync di unit ini
                $staleTeachers = DB::table('teachers')
                    ->where('unit', $unit)
                    ->whereNotIn('id', $validTeacherIds)
                    ->where(function ($q) {
                        $q->where('nip', 'like', 'EMP_%')
                          ->orWhere('nip', 'like', '35%')
                          ->orWhere('nip', 'like', '31%')
                          ->orWhere('nip', 'like', '32%')
                          ->orWhere('nip', 'like', '33%')
                          ->orWhere('nip', 'like', '36%')
                          ->orWhere('nip', 'like', '62%');
                    })
                    ->get();

                foreach ($staleTeachers as $stale) {
                    // Cek apakah tidak dipakai di relasi kelas/ujian
                    $hasClasses = DB::table('classes')->where('homeroom_teacher_id', $stale->id)->exists();
                    $hasExams = DB::table('exams')->where('teacher_id', $stale->id)->exists();
                    $hasBanks = DB::table('question_banks')->where('teacher_id', $stale->id)->exists();

                    if (!$hasClasses && !$hasExams && !$hasBanks) {
                        DB::table('teachers')->where('id', $stale->id)->delete();
                        if ($stale->user_id && !in_array($stale->user_id, $validUserIds)) {
                            DB::table('users')->where('id', $stale->user_id)->where('role', \App\Role::Guru->value)->delete();
                        }
                    }
                }

                // B. Academic Year
                $activeAy = DB::connection($conn)->table('academic_years')->where('is_active', 1)->first()
                    ?? DB::connection($conn)->table('academic_years')->orderBy('id', 'desc')->first();
                $academicYearName = $activeAy->name ?? '2026/2027';

                // C. Classrooms
                $masterClassrooms = DB::connection($conn)->table('classrooms')->get();
                $classroomMap = [];

                foreach ($masterClassrooms as $mc) {
                    $classLevel = DB::connection($conn)->table('class_levels')->where('id', $mc->class_level_id)->first();
                    $levelName = $classLevel->name ?? (strtoupper($unit) . ' ' . substr($mc->name, 0, 1));

                    $className = $mc->name;
                    if (!empty($mc->code) && !empty($mc->name)) {
                        if (!str_starts_with(strtoupper($mc->name), strtoupper($mc->code))) {
                            $className = "{$mc->code} {$mc->name}";
                        }
                    } elseif (!empty($mc->code)) {
                        $className = $mc->code;
                    }

                    $key = "{$className}_{$academicYearName}";
                    $oldKey = "{$mc->name}_{$academicYearName}";
                    $homeroomId = isset($employeeToTeacherId[$mc->teacher_id ?? $mc->homeroom_teacher_id ?? null])
                        ? $employeeToTeacherId[$mc->teacher_id ?? $mc->homeroom_teacher_id]
                        : null;

                    $existingClass = $classesLookup[$key] ?? ($classesLookup[$oldKey] ?? null);

                    if (!$existingClass) {
                        $classId = DB::table('classes')->insertGetId([
                            'unit' => $unit,
                            'name' => $className,
                            'level' => $levelName,
                            'academic_year' => $academicYearName,
                            'homeroom_teacher_id' => $homeroomId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $classesLookup[$key] = (object)['id' => $classId];
                        $summary['classes_synced']++;
                    } else {
                        $classId = $existingClass->id;
                        DB::table('classes')->where('id', $classId)->update([
                            'unit' => $unit,
                            'name' => $className,
                            'level' => $levelName,
                            'homeroom_teacher_id' => $homeroomId,
                            'updated_at' => now(),
                        ]);
                        $classesLookup[$key] = (object)['id' => $classId];
                    }

                    $classroomMap[$mc->id] = $classId;
                }

                // Bersihkan data kelas dummy seeder jika rombel asli telah tersinkronisasi
                $dummyClasses = DB::table('classes')
                    ->where('unit', $unit)
                    ->whereIn('name', ['1A', '2A', '3A'])
                    ->whereIn('level', ['1', '2', '3'])
                    ->get();

                if ($dummyClasses->isNotEmpty() && !empty($classroomMap)) {
                    $firstRealClassId = reset($classroomMap);
                    foreach ($dummyClasses as $dummy) {
                        DB::table('exams')->where('school_class_id', $dummy->id)->update(['school_class_id' => $firstRealClassId]);
                        DB::table('question_banks')->where('school_class_id', $dummy->id)->update(['school_class_id' => $firstRealClassId]);
                        DB::table('class_students')->where('class_id', $dummy->id)->delete();
                        DB::table('classes')->where('id', $dummy->id)->delete();
                    }
                }

                // D. Students
                $masterStudents = DB::connection($conn)->table('students')
                    ->where(fn($q) => $q->where('status', 'aktif')->orWhereNull('status'))
                    ->get();

                $studentClassPivot = [];

                foreach ($masterStudents as $ms) {
                    $studentEmail = !empty($ms->nisn)
                        ? "{$ms->nisn}@siswa.sans.test"
                        : "siswa_{$unit}_{$ms->id}@sans.test";

                    $studentName = !empty($ms->full_name) ? $ms->full_name : (!empty($ms->name) ? $ms->name : "Siswa {$ms->nis}");
                    $nis = !empty($ms->nis) ? trim($ms->nis) : "NIS_{$unit}_{$ms->id}";

                    // User account for student
                    if (!isset($usersLookup[$studentEmail])) {
                        $userId = DB::table('users')->insertGetId([
                            'name' => $studentName,
                            'email' => $studentEmail,
                            'password' => $defaultPassword,
                            'role' => \App\Role::Siswa->value,
                            'unit' => $unit,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $usersLookup[$studentEmail] = $userId;
                        $summary['users_synced']++;
                    } else {
                        $userId = $usersLookup[$studentEmail];
                        DB::table('users')->where('id', $userId)->update(['unit' => $unit]);
                    }

                    // Student record
                    $gender = in_array(strtoupper((string)($ms->gender ?? '')), ['P', 'FEMALE']) ? 'P' : 'L';

                    if (!isset($studentsLookup[$nis])) {
                        $studentId = DB::table('students')->insertGetId([
                            'unit' => $unit,
                            'user_id' => $userId,
                            'nis' => $nis,
                            'nisn' => $ms->nisn ?? null,
                            'full_name' => $studentName,
                            'gender' => $gender,
                            'birth_date' => $ms->birth_date ?? null,
                            'phone' => $ms->phone ?? ($ms->parent_phone ?? null),
                            'address' => $ms->address ?? null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $studentsLookup[$nis] = $studentId;
                        $summary['students_synced']++;
                    } else {
                        $studentId = $studentsLookup[$nis];
                        DB::table('students')->where('id', $studentId)->update([
                            'unit' => $unit,
                            'user_id' => $userId,
                            'nisn' => $ms->nisn ?? null,
                            'full_name' => $studentName,
                            'gender' => $gender,
                            'birth_date' => $ms->birth_date ?? null,
                            'phone' => $ms->phone ?? ($ms->parent_phone ?? null),
                            'address' => $ms->address ?? null,
                            'updated_at' => now(),
                        ]);
                    }

                    if (!empty($ms->classroom_id) && isset($classroomMap[$ms->classroom_id])) {
                        $targetClassId = $classroomMap[$ms->classroom_id];
                        $studentClassPivot[] = [
                            'class_id' => $targetClassId,
                            'student_id' => $studentId,
                        ];
                    }
                }

                // Batch sync pivots
                if (!empty($studentClassPivot)) {
                    foreach (array_chunk($studentClassPivot, 200) as $chunk) {
                        DB::table('class_students')->insertOrIgnore($chunk);
                    }
                }

                $summary['units_processed'][] = $info['name'];
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("[Database Integration] Error syncing master data: " . $e->getMessage());
            $summary['errors'][] = $e->getMessage();
        }

        return $summary;
    }
}
