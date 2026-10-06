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
        Schema::table('exam_sessions', function (Blueprint $table) {
            // Drop the existing NOT NULL FK so we can make it nullable
            $table->dropForeign(['student_id']);
            $table->foreignId('student_id')->nullable()->change();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();

            $table->boolean('is_preview')->default(false)->after('status');
        });

        // Remove the unique constraint that prevents multiple preview sessions per exam
        // (unique on exam_id+student_id would conflict when student_id is null anyway)
        Schema::table('exam_sessions', function (Blueprint $table) {
            // We can't easily drop the composite unique index via Blueprint on MySQL here
            // instead we handle it via DB::statement
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exam_sessions', function (Blueprint $table) {
            $table->dropColumn('is_preview');

            $table->dropForeign(['student_id']);
            $table->foreignId('student_id')->nullable(false)->change();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
        });
    }
};
