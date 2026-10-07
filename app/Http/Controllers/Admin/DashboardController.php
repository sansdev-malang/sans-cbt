<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use App\Role;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the comprehensive admin dashboard with statistics, charts, and activity tables.
     */
    public function __invoke(): Response
    {
        $userCounts = User::query()
            ->selectRaw('role, count(*) as total')
            ->whereNotNull('role')
            ->groupBy('role')
            ->pluck('total', 'role');

        $totalExams = Exam::query()->count();
        $allExams = Exam::query()->with(['subject', 'schoolClass'])->get();
        $ongoingExamsCount = $allExams->filter(fn (Exam $e) => $e->status === 'ongoing')->count();
        $scheduledExamsCount = $allExams->filter(fn (Exam $e) => $e->status === 'scheduled')->count();

        $stats = [
            ['label' => 'Total Pengguna', 'value' => User::query()->count()],
            ...array_map(
                fn (Role $role): array => [
                    'label' => $role->label(),
                    'value' => (int) $userCounts->get($role->value, 0),
                ],
                Role::cases(),
            ),
        ];

        $metrics = [
            'total_students' => Student::query()->count(),
            'total_teachers' => Teacher::query()->count(),
            'total_classes' => SchoolClass::query()->count(),
            'total_exams' => $totalExams,
            'ongoing_exams' => $ongoingExamsCount,
            'scheduled_exams' => $scheduledExamsCount,
            'total_questions' => Question::query()->count(),
            'total_question_banks' => QuestionBank::query()->count(),
            'total_sessions' => ExamSession::query()->where('is_preview', false)->count(),
        ];

        // 1. Data Grafik Batang: Siswa per Kelas
        $studentsPerClass = SchoolClass::query()
            ->withCount('students')
            ->orderBy('name')
            ->get()
            ->map(fn (SchoolClass $class): array => [
                'label' => $class->name,
                'sublabel' => $class->academic_year ?? 'Aktif',
                'value' => (int) $class->students_count,
            ])
            ->values()
            ->all();

        // 2. Data Grafik Batang: Bank Soal per Mapel
        $questionsPerSubject = Subject::query()
            ->withCount('questionBanks')
            ->orderByDesc('question_banks_count')
            ->limit(6)
            ->get()
            ->map(fn (Subject $subject): array => [
                'label' => $subject->code ?: $subject->name,
                'sublabel' => $subject->name,
                'value' => (int) $subject->question_banks_count,
            ])
            ->values()
            ->all();

        // 3. Data Grafik Donat: Distribusi Pengguna berdasarkan Peran
        $roleDonut = [
            [
                'label' => 'Siswa',
                'value' => (int) $userCounts->get(Role::Siswa->value, 0),
                'color' => '#10b981',
            ],
            [
                'label' => 'Guru',
                'value' => (int) $userCounts->get(Role::Guru->value, 0),
                'color' => '#3b82f6',
            ],
            [
                'label' => 'Admin',
                'value' => (int) $userCounts->get(Role::Admin->value, 0),
                'color' => '#8b5cf6',
            ],
        ];

        // 4. Data Grafik Donat: Distribusi Tipe Soal
        $typeLabels = [
            'multiple_choice' => 'Pilihan Ganda',
            'multiple_answers' => 'Pilihan Kompleks',
            'true_false' => 'Benar / Salah',
            'statement_true_false' => 'Pernyataan B/S',
            'matching' => 'Menjodohkan',
            'essay' => 'Uraian / Esai',
        ];
        $typeColors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
        $i = 0;
        $questionTypeDonut = Question::query()
            ->selectRaw('type, count(*) as total')
            ->groupBy('type')
            ->orderByDesc('total')
            ->pluck('total', 'type')
            ->map(function ($total, $type) use ($typeLabels, $typeColors, &$i): array {
                $color = $typeColors[$i % count($typeColors)];
                $i++;

                return [
                    'label' => $typeLabels[$type] ?? ucfirst((string) $type),
                    'value' => (int) $total,
                    'color' => $color,
                ];
            })
            ->values()
            ->all();

        // 5. Tabel: Ujian Terkini
        $recentExams = Exam::query()
            ->with(['subject', 'schoolClass', 'teacher.user'])
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn (Exam $exam): array => [
                'id' => $exam->id,
                'name' => $exam->name,
                'subject' => $exam->subject?->name ?? '-',
                'school_class' => $exam->schoolClass?->name ?? '-',
                'teacher' => $exam->teacher?->full_name ?? $exam->teacher?->user?->name ?? 'Admin',
                'started_at' => $exam->started_at?->format('d M Y, H:i') ?? '-',
                'duration_minutes' => $exam->duration_minutes,
                'status' => $exam->status,
                'is_published' => $exam->is_published,
                'sessions_count' => $exam->realSessions()->count(),
            ])
            ->all();

        // 6. Tabel: Sesi Pengerjaan Siswa Terkini
        $recentSessions = ExamSession::query()
            ->with(['student.user', 'exam.subject', 'exam.schoolClass'])
            ->where('is_preview', false)
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn (ExamSession $session): array => [
                'id' => $session->id,
                'student_name' => $session->student?->full_name ?? $session->student?->user?->name ?? 'Siswa',
                'nis' => $session->student?->nis ?? '-',
                'exam_name' => $session->exam?->name ?? '-',
                'subject' => $session->exam?->subject?->name ?? '-',
                'school_class' => $session->exam?->schoolClass?->name ?? '-',
                'status' => $session->status,
                'started_at' => $session->started_at?->format('d M Y, H:i') ?? '-',
                'submitted_at' => $session->submitted_at?->format('d M Y, H:i'),
            ])
            ->all();

        // 7. Tabel: Pengguna Terbaru
        $recentUsers = User::query()
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role_label' => $user->role?->label() ?? 'Belum ditetapkan',
                'created_at' => $user->created_at?->format('d M Y') ?? '-',
            ])
            ->all();

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'studentsPerClass' => $studentsPerClass,
            'questionsPerSubject' => $questionsPerSubject,
            'roleDonut' => $roleDonut,
            'questionTypeDonut' => $questionTypeDonut,
            'recentExams' => $recentExams,
            'recentSessions' => $recentSessions,
            'recentUsers' => $recentUsers,
        ]);
    }
}
