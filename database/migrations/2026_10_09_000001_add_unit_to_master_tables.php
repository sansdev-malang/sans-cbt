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
        if (Schema::hasTable('teachers') && !Schema::hasColumn('teachers', 'unit')) {
            Schema::table('teachers', function (Blueprint $table) {
                $table->string('unit', 10)->default('sd')->after('id')->index();
            });
        }

        if (Schema::hasTable('classes') && !Schema::hasColumn('classes', 'unit')) {
            Schema::table('classes', function (Blueprint $table) {
                $table->string('unit', 10)->default('sd')->after('id')->index();
            });
        }

        if (Schema::hasTable('students') && !Schema::hasColumn('students', 'unit')) {
            Schema::table('students', function (Blueprint $table) {
                $table->string('unit', 10)->default('sd')->after('id')->index();
            });
        }

        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'unit')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('unit', 10)->nullable()->after('role')->index();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('teachers') && Schema::hasColumn('teachers', 'unit')) {
            Schema::table('teachers', function (Blueprint $table) {
                $table->dropColumn('unit');
            });
        }

        if (Schema::hasTable('classes') && Schema::hasColumn('classes', 'unit')) {
            Schema::table('classes', function (Blueprint $table) {
                $table->dropColumn('unit');
            });
        }

        if (Schema::hasTable('students') && Schema::hasColumn('students', 'unit')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn('unit');
            });
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'unit')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('unit');
            });
        }
    }
};
