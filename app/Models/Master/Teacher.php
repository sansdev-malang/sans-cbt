<?php

namespace App\Models\Master;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Teacher extends MasterModel
{
    protected $table = 'employees';
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function homeroomClassrooms(): HasMany
    {
        return $this->hasMany(Classroom::class, 'teacher_id');
    }
}
