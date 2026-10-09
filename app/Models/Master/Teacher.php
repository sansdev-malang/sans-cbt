<?php

namespace App\Models\Master;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Teacher extends MasterModel
{
    protected $table = 'employees';
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Scope query to only include employees that are teachers (Tenaga Pendidik / Guru / Homeroom).
     */
    protected static function booted(): void
    {
        static::addGlobalScope('onlyTeachers', function (Builder $query): void {
            $query->where(function (Builder $q): void {
                $q->where('employee_type_id', 1)
                    ->orWhere('position', 'like', '%Guru%')
                    ->orWhere('position', 'like', '%GPK%')
                    ->orWhere('position', 'like', '%GPQ%')
                    ->orWhere('position', 'like', '%Pengajar%')
                    ->orWhere('position', 'like', '%Pendidik%')
                    ->orWhereExists(function ($subQuery) {
                        $subQuery->selectRaw(1)
                            ->from('classrooms')
                            ->whereColumn('classrooms.homeroom_teacher_id', 'employees.id');
                    });
            });
        });
    }

    public function homeroomClassrooms(): HasMany
    {
        return $this->hasMany(Classroom::class, 'homeroom_teacher_id');
    }
}

