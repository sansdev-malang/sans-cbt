<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SubjectRequest;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    /**
     * Display a listing of the subjects.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();

        $subjects = Subject::query()
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Subject $subject): array => [
                'id' => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
                'description' => $subject->description,
                'is_active' => $subject->is_active,
            ]);

        return Inertia::render('admin/subjects/index', [
            'subjects' => $subjects,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Show the form for creating a new subject.
     */
    public function create(): Response
    {
        return Inertia::render('admin/subjects/create');
    }

    /**
     * Store a newly created subject in storage.
     */
    public function store(SubjectRequest $request): RedirectResponse
    {
        Subject::query()->create($this->payload($request));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Mata pelajaran berhasil ditambahkan.',
        ]);

        return to_route('admin.subjects.index');
    }

    /**
     * Show the form for editing the given subject.
     */
    public function edit(Subject $subject): Response
    {
        return Inertia::render('admin/subjects/edit', [
            'subject' => [
                'id' => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
                'description' => $subject->description,
                'is_active' => $subject->is_active,
            ],
        ]);
    }

    /**
     * Update the given subject in storage.
     */
    public function update(SubjectRequest $request, Subject $subject): RedirectResponse
    {
        $subject->update($this->payload($request));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Mata pelajaran berhasil diperbarui.',
        ]);

        return to_route('admin.subjects.index');
    }

    /**
     * Remove the given subject from storage.
     */
    public function destroy(Subject $subject): RedirectResponse
    {
        $subject->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Mata pelajaran berhasil dihapus.',
        ]);

        return to_route('admin.subjects.index');
    }

    /**
     * Normalize the validated payload before persisting.
     *
     * @return array<string, mixed>
     */
    private function payload(SubjectRequest $request): array
    {
        return [
            'code' => $request->string('code')->trim()->value(),
            'name' => $request->string('name')->trim()->value(),
            'description' => $request->filled('description')
                ? $request->string('description')->trim()->value()
                : null,
            'is_active' => $request->boolean('is_active'),
        ];
    }
}
