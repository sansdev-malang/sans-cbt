<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StudentRequest;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use App\Role;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();

        $students = Student::query()
            ->with('classes:id,name,academic_year')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(fn (Builder $query) => $query
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%")
                    ->orWhere('nisn', 'like', "%{$search}%"));
            })
            ->orderBy('full_name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Student $student): array => [
                'id' => $student->id,
                'nis' => $student->nis,
                'nisn' => $student->nisn,
                'full_name' => $student->full_name,
                'gender' => $student->gender,
                'user_id' => $student->user_id,
                'birth_date' => $student->birth_date?->format('Y-m-d'),
                'phone' => $student->phone,
                'address' => $student->address,
                'class_ids' => $student->classes->pluck('id')->all(),
                'classes' => $student->classes->map(fn (SchoolClass $class): string => "{$class->name} ({$class->academic_year})")->all(),
            ]);

        return Inertia::render('admin/students/index', [
            'students' => $students,
            'filters' => ['search' => $search],
            ...$this->formOptions(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('admin/students/create', $this->formOptions());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StudentRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $student = Student::query()->create($this->payload($request));
            $student->classes()->sync($request->input('class_ids', []));
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data siswa berhasil ditambahkan.']);

        return to_route('admin.students.index');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Student $student): Response
    {
        return Inertia::render('admin/students/edit', [
            ...$this->formOptions(),
            'student' => [
                'id' => $student->id,
                ...$this->payload($student),
                'class_ids' => $student->classes()->pluck('classes.id')->all(),
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StudentRequest $request, Student $student): RedirectResponse
    {
        DB::transaction(function () use ($request, $student): void {
            $student->update($this->payload($request));
            $student->classes()->sync($request->input('class_ids', []));
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data siswa berhasil diperbarui.']);

        return to_route('admin.students.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Student $student): RedirectResponse
    {
        $student->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data siswa berhasil dihapus.']);

        return to_route('admin.students.index');
    }

    /** @return array{classes: array<int, array{value: int, label: string}>, users: array<int, array{value: int, label: string}>} */
    private function formOptions(): array
    {
        return [
            'classes' => SchoolClass::query()->orderByDesc('academic_year')->orderBy('name')->get(['id', 'name', 'academic_year'])->map(fn (SchoolClass $class): array => ['value' => $class->id, 'label' => "{$class->name} ({$class->academic_year})"])->all(),
            'users' => User::query()->where('role', Role::Siswa)->orderBy('name')->get(['id', 'name', 'email'])->map(fn (User $user): array => ['value' => $user->id, 'label' => "{$user->name} — {$user->email}"])->all(),
        ];
    }

    /** @return array<string, mixed> */
    private function payload(StudentRequest|Student $source): array
    {
        return [
            'user_id' => $source->user_id ?: null,
            'nis' => $source->nis,
            'nisn' => $source->nisn ?: null,
            'full_name' => $source->full_name,
            'gender' => $source->gender ?: null,
            'birth_date' => $source instanceof Student
                ? $source->birth_date?->format('Y-m-d')
                : ($source->string('birth_date')->value() ?: null),
            'phone' => $source->phone ?: null,
            'address' => $source->address ?: null,
        ];
    }
}
