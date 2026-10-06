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
        Schema::table('result_details', function (Blueprint $table) {
            $table->dateTime('graded_at')->nullable()->after('correct_answer')->comment('null while an essay awaits manual grading');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('result_details', function (Blueprint $table) {
            $table->dropColumn('graded_at');
        });
    }
};
