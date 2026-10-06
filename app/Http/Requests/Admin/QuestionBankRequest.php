<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuestionBankRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:255'], 'subject_id' => ['required', 'integer', Rule::exists('subjects', 'id')], 'school_class_id' => ['nullable', 'integer', Rule::exists('classes', 'id')], 'teacher_id' => ['nullable', 'integer', Rule::exists('teachers', 'id')], 'material' => ['nullable', 'string', 'max:255']];
    }
}
