<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('exam_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->dateTime('started_at');
            $table->dateTime('submitted_at')->nullable();
            $table->enum('status', ['ongoing', 'submitted', 'expired'])->default('ongoing');
            $table->unsignedInteger('random_seed');
            $table->json('question_order');
            $table->timestamps();

            $table->unique(['exam_id', 'student_id']);
        });

        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->json('value')->nullable();
            $table->timestamps();

            $table->unique(['exam_session_id', 'question_id']);
        });

        Schema::create('results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')->constrained()->cascadeOnDelete();
            $table->decimal('score', 5, 2)->nullable()->comment('null while manual grading is pending');
            $table->decimal('earned_score', 7, 2)->default(0);
            $table->decimal('max_score', 7, 2)->default(0);
            $table->unsignedInteger('correct_count')->default(0);
            $table->unsignedInteger('question_count')->default(0);
            $table->boolean('has_essay_pending')->default(false);
            $table->dateTime('submitted_at');
            $table->timestamps();

            $table->unique('exam_session_id');
        });

        Schema::create('result_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('result_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->decimal('earned', 6, 2)->default(0);
            $table->decimal('max', 6, 2)->default(0);
            $table->boolean('is_correct')->nullable();
            $table->json('student_answer')->nullable();
            $table->json('correct_answer')->nullable();
            $table->timestamps();

            $table->unique(['result_id', 'question_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('result_details');
        Schema::dropIfExists('results');
        Schema::dropIfExists('answers');
        Schema::dropIfExists('exam_sessions');
    }
};
