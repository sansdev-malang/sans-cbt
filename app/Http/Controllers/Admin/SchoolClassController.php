<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SchoolClassRequest;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolClassController extends Controller
{
    /**
     * Display a listing of the classes.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();

        $classes = SchoolClass::query()
            ->with('homeroomTeacher:id,full_name')
            ->withCount('students')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('academic_year', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('academic_year')
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (SchoolClass $class): array => [
                'id' => $class->id,
                'name' => $class->name,
                'level' => $class->level,
                'academic_year' => $class->academic_year,
                'homeroom_teacher_id' => $class->homeroom_teacher_id,
                'homeroom_teacher' => $class->homeroomTeacher?->full_name,
                'students_count' => (int) $class->getAttribute('students_count'),
            ]);

        return Inertia::render('admin/classes/index', [
            'classes' => $classes,
            'teachers' => $this->teacherOptions(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Show the form for creating a new class.
     */
    public function create(): Response
    {
        return Inertia::render('admin/classes/create', [
            'teachers' => $this->teacherOptions(),
        ]);
    }

    /**
     * Store a newly created class in storage.
     */
    public function store(SchoolClassRequest $request): RedirectResponse
    {
        SchoolClass::query()->create($this->payload($request));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Kelas berhasil ditambahkan.',
        ]);

        return to_route('admin.classes.index');
    }

    /**
     * Show the form for editing the given class.
     */
    public function edit(SchoolClass $class): Response
    {
        return Inertia::render('admin/classes/edit', [
            'schoolClass' => [
                'id' => $class->id,
                'name' => $class->name,
                'level' => $class->level,
                'academic_year' => $class->academic_year,
                'homeroom_teacher_id' => $class->homeroom_teacher_id,
            ],
            'teachers' => $this->teacherOptions(),
        ]);
    }

    /**
     * Update the given class in storage.
     */
    public function update(SchoolClassRequest $request, SchoolClass $class): RedirectResponse
    {
        $class->update($this->payload($request));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Kelas berhasil diperbarui.',
        ]);

        return to_route('admin.classes.index');
    }

    /**
     * Remove the given class from storage.
     */
    public function destroy(SchoolClass $class): RedirectResponse
    {
        $class->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Kelas berhasil dihapus.',
        ]);

        return to_route('admin.classes.index');
    }

    /**
     * Get the homeroom teacher options for the form select.
     *
     * @return array<int, array{value: int, label: string}>
     */
    private function teacherOptions(): array
    {
        return Teacher::query()
            ->orderBy('full_name')
            ->get(['id', 'full_name'])
            ->map(fn (Teacher $teacher): array => [
                'value' => $teacher->id,
                'label' => $teacher->full_name,
            ])
            ->all();
    }

    /**
     * Normalize the validated payload before persisting.
     *
     * @return array<string, mixed>
     */
    private function payload(SchoolClassRequest $request): array
    {
        return [
            'name' => $request->string('name')->trim()->value(),
            'level' => $request->filled('level')
                ? $request->string('level')->trim()->value()
                : null,
            'academic_year' => $request->string('academic_year')->trim()->value(),
            'homeroom_teacher_id' => $request->filled('homeroom_teacher_id')
                ? $request->integer('homeroom_teacher_id')
                : null,
        ];
    }
}
