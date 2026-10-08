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

            $activeAy = AcademicYear::where('is_active', true)->first();
            $stats['active_academic_year'] = $activeAy ? [
                'id' => $activeAy->id,
                'name' => $activeAy->name,
                'is_active' => true,
            ] : null;

            $activeSem = Semester::where('is_active', true)->first();
            $stats['active_semester'] = $activeSem ? [
                'id' => $activeSem->id,
                'name' => $activeSem->name,
                'type' => $activeSem->semester_type ?? $activeSem->name,
            ] : null;

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
                    ->orderBy('name')
                    ->take($limit)
                    ->get()
                    ->map(fn($c) => [
                        'id' => $c->id,
                        'name' => $c->name,
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
                        'classroom' => $s->classroom?->name ?? '-',
                        'level' => $s->classLevel?->name ?? '-',
                        'status' => $s->status ?? 'aktif',
                    ]),
            ],
        };
    }
}
