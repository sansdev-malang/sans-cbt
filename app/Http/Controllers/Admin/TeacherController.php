<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TeacherRequest;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Models\User;
use App\Role;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeacherController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();
        $unit = $request->string('unit')->trim()->value() ?: 'all';

        $teachers = Teacher::query()
            ->with('homeroomClasses:id,name,academic_year,homeroom_teacher_id')
            ->when($unit !== 'all', fn (Builder $query) => $query->where('unit', $unit))
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(fn (Builder $query) => $query
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%"));
            })
            ->orderBy('full_name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Teacher $teacher): array => [
                'id' => $teacher->id,
                'unit' => $teacher->unit ?? 'sd',
                'user_id' => $teacher->user_id,
                'nip' => $teacher->nip,
                'full_name' => $teacher->full_name,
                'phone' => $teacher->phone,
                'homeroom_classes' => $teacher->homeroomClasses->map(fn (SchoolClass $class): string => "{$class->name} ({$class->academic_year})")->all(),
            ]);

        $unitCounts = [
            'all' => Teacher::count(),
            'sd' => Teacher::where('unit', 'sd')->count(),
            'smp' => Teacher::where('unit', 'smp')->count(),
        ];

        return Inertia::render('admin/teachers/index', [
            'teachers' => $teachers,
            'filters' => ['search' => $search, 'unit' => $unit],
            'unitCounts' => $unitCounts,
            'users' => $this->userOptions(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('admin/teachers/create', ['users' => $this->userOptions()]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TeacherRequest $request): RedirectResponse
    {
        Teacher::query()->create($this->payload($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data guru berhasil ditambahkan.']);

        return to_route('admin.teachers.index');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Teacher $teacher): Response
    {
        return Inertia::render('admin/teachers/edit', [
            'teacher' => ['id' => $teacher->id, ...$this->payload($teacher)],
            'users' => $this->userOptions(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(TeacherRequest $request, Teacher $teacher): RedirectResponse
    {
        $teacher->update($this->payload($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data guru berhasil diperbarui.']);

        return to_route('admin.teachers.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Teacher $teacher): RedirectResponse
    {
        $teacher->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data guru berhasil dihapus.']);

        return to_route('admin.teachers.index');
    }

    /** @return array<int, array{value: int, label: string}> */
    private function userOptions(): array
    {
        return User::query()->where('role', Role::Guru)->orderBy('name')->get(['id', 'name', 'email'])->map(fn (User $user): array => ['value' => $user->id, 'label' => "{$user->name} — {$user->email}"])->all();
    }

    /** @return array<string, mixed> */
    private function payload(TeacherRequest|Teacher $source): array
    {
        return [
            'unit' => $source->unit ?? 'sd',
            'user_id' => $source->user_id ?: null,
            'nip' => $source->nip ?: null,
            'full_name' => $source->full_name,
            'phone' => $source->phone ?: null,
        ];
    }
}
