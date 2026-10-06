<?php

namespace App\Http\Requests\Admin;

use App\Models\SchoolClass;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SchoolClassRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $class = $this->route('class');
        $classId = $class instanceof SchoolClass ? $class->id : null;
        $academicYear = (string) $this->input('academic_year');

        return [
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('classes', 'name')
                    ->where('academic_year', $academicYear)
                    ->ignore($classId),
            ],
            'level' => ['nullable', 'string', 'max:20'],
            'academic_year' => ['required', 'string', 'max:20'],
            'homeroom_teacher_id' => ['nullable', 'integer', 'exists:teachers,id'],
        ];
    }
}
