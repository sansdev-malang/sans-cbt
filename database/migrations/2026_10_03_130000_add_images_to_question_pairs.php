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
        Schema::table('question_pairs', function (Blueprint $table) {
            $table->string('left_image_path')->nullable()->after('left_text');
            $table->string('right_image_path')->nullable()->after('right_text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('question_pairs', function (Blueprint $table) {
            $table->dropColumn(['left_image_path', 'right_image_path']);
        });
    }
};
