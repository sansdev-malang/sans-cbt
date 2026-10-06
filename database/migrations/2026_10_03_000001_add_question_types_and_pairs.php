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
        Schema::table('questions', function (Blueprint $table) {
            $table->enum('type', ['multiple_choice', 'multiple_answers', 'true_false', 'statement_true_false', 'matching', 'essay'])->default('multiple_choice')->change();
        });

        Schema::create('question_pairs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->string('left_text');
            $table->string('right_text');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_pairs');

        Schema::table('questions', function (Blueprint $table) {
            $table->enum('type', ['multiple_choice', 'true_false', 'essay'])->default('multiple_choice')->change();
        });
    }
};
