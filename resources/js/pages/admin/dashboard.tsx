import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    BookOpen,
    CalendarCheck,
    CheckCircle2,
    Clock,
    FileQuestion,
    GraduationCap,
    Layers,
    PieChart,
    ShieldCheck,
    UserCheck,
    Users,
} from 'lucide-react';
import BarChart from '@/components/bar-chart';
import DonutChart from '@/components/donut-chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes/admin';
import { index as questionsIndex } from '@/routes/admin/questions';

type Stats = {
    total_students: number;
    total_teachers: number;
    total_classes: number;
    total_exams: number;
    ongoing_exams: number;
    scheduled_exams: number;
    total_questions: number;
    total_question_banks: number;
    total_sessions: number;
};

type BarItem = {
    label: string;
    sublabel?: string;
    value: number;
};

type DonutItem = {
    label: string;
    value: number;
    color: string;
};

type RecentExam = {
    id: number;
    name: string;
    subject: string;
    school_class: string;
    teacher: string;
    started_at: string;
    duration_minutes: number;
    status: string;
    is_published: boolean;
    sessions_count: number;
};

type RecentSession = {
    id: number;
    student_name: string;
    nis: string;
    exam_name: string;
    subject: string;
    school_class: string;
    status: string;
    started_at: string;
    submitted_at?: string | null;
};

type RecentUser = {
    id: number;
    name: string;
    email: string;
    role_label: string;
    created_at: string;
};

type Props = {
    stats: Stats;
    studentsPerClass: BarItem[];
    questionsPerSubject: BarItem[];
    roleDonut: DonutItem[];
    questionTypeDonut: DonutItem[];
    recentExams: RecentExam[];
    recentSessions: RecentSession[];
    recentUsers: RecentUser[];
};

export default function AdminDashboard({
    stats,
    studentsPerClass,
    questionsPerSubject,
    roleDonut,
    questionTypeDonut,
    recentExams,
    recentSessions,
    recentUsers,
}: Props) {
    const [barTab, setBarTab] = useState<'classes' | 'subjects'>('classes');
    const [donutTab, setDonutTab] = useState<'roles' | 'questionTypes'>('roles');
    const [tableTab, setTableTab] = useState<'sessions' | 'exams' | 'users'>(
        'sessions',
    );

    const getExamStatusBadge = (status: string) => {
        switch (status) {
            case 'ongoing':
                return (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Berlangsung
                    </Badge>
                );
            case 'scheduled':
                return (
                    <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">
                        <Clock className="mr-1 size-3" />
                        Terjadwal
                    </Badge>
                );
            case 'finished':
                return (
                    <Badge variant="secondary">
                        <CheckCircle2 className="mr-1 size-3" />
                        Selesai
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="text-muted-foreground">
                        Draf
                    </Badge>
                );
        }
    };

    const getSessionStatusBadge = (status: string) => {
        switch (status) {
            case 'ongoing':
                return (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Mengerjakan
                    </Badge>
                );
            case 'submitted':
                return (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                        <CheckCircle2 className="mr-1 size-3" />
                        Selesai
                    </Badge>
                );
            case 'locked':
                return (
                    <Badge variant="destructive">
                        Terkunci
                    </Badge>
                );
            case 'expired':
                return (
                    <Badge variant="outline" className="text-muted-foreground">
                        Habis Waktu
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return (
                    <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30">
                        Admin
                    </Badge>
                );
            case 'guru':
                return (
                    <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">
                        Guru
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                        Siswa
                    </Badge>
                );
        }
    };

    return (
        <>
            <Head title="Dashboard Admin" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                                Dashboard Administrator
                            </h1>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                CBT Aktif
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Pusat pemantauan analitik, ujian, dan manajemen pengguna CBT.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href="/admin/exam-monitoring">
                                <Activity className="mr-1.5 size-4 text-primary" />
                                Monitoring Ujian
                            </Link>
                        </Button>
                        <Button asChild size="sm">
                            <Link href={questionsIndex()}>
                                <FileQuestion className="mr-1.5 size-4" />
                                Bank Soal
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* KPI Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Siswa */}
                    <Card className="relative overflow-hidden border transition-shadow hover:shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Siswa Terdaftar
                            </CardTitle>
                            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                                <GraduationCap className="size-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tabular-nums text-foreground">
                                {stats.total_students}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    {stats.total_classes}
                                </span>
                                <span>Rombongan Kelas Aktif</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Guru */}
                    <Card className="relative overflow-hidden border transition-shadow hover:shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Tenaga Pendidik
                            </CardTitle>
                            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                                <UserCheck className="size-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tabular-nums text-foreground">
                                {stats.total_teachers}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <ShieldCheck className="size-3.5 text-blue-500" />
                                <span>Pengampu & Pembuat Soal</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3: Ujian */}
                    <Card className="relative overflow-hidden border transition-shadow hover:shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pelaksanaan Ujian
                            </CardTitle>
                            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
                                <CalendarCheck className="size-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold tabular-nums text-foreground">
                                    {stats.total_exams}
                                </span>
                                {stats.ongoing_exams > 0 && (
                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                        ({stats.ongoing_exams} berlangsung)
                                    </span>
                                )}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="size-3.5 text-purple-500" />
                                <span>{stats.scheduled_exams} Ujian Terjadwal</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 4: Bank & Soal */}
                    <Card className="relative overflow-hidden border transition-shadow hover:shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Bank & Butir Soal
                            </CardTitle>
                            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                                <Layers className="size-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tabular-nums text-foreground">
                                {stats.total_questions}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <BookOpen className="size-3.5 text-amber-500" />
                                <span>{stats.total_question_banks} Bank Soal Tersimpan</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section: Grafik Batang & Grafik Donat */}
                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Left: Grafik Batang (Bar Chart) */}
                    <Card className="lg:col-span-7">
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <BarChartIcon className="size-4 text-primary" />
                                    {barTab === 'classes'
                                        ? 'Distribusi Siswa per Rombel Kelas'
                                        : 'Bank Soal per Mata Pelajaran'}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {barTab === 'classes'
                                        ? 'Jumlah siswa terdaftar di setiap rombongan belajar aktif.'
                                        : 'Ketersediaan paket bank soal per bidang studi.'}
                                </CardDescription>
                            </div>

                            <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setBarTab('classes')}
                                    className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                                        barTab === 'classes'
                                            ? 'bg-background text-foreground shadow-xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Per Kelas
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBarTab('subjects')}
                                    className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                                        barTab === 'subjects'
                                            ? 'bg-background text-foreground shadow-xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Per Mapel
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {barTab === 'classes' ? (
                                <BarChart
                                    items={studentsPerClass}
                                    unit="Siswa"
                                    height={240}
                                    emptyText="Belum ada data rombongan kelas."
                                />
                            ) : (
                                <BarChart
                                    items={questionsPerSubject}
                                    unit="Paket"
                                    height={240}
                                    emptyText="Belum ada bank soal terdaftar."
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Right: Grafik Donat (Donut Chart) */}
                    <Card className="lg:col-span-5">
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <PieChart className="size-4 text-primary" />
                                    {donutTab === 'roles'
                                        ? 'Komposisi Akun Pengguna'
                                        : 'Distribusi Tipe Soal'}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {donutTab === 'roles'
                                        ? 'Perbandingan jumlah akun berdasarkan peran di sistem.'
                                        : 'Sebaran ragam format soal ujian yang tersimpan.'}
                                </CardDescription>
                            </div>

                            <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setDonutTab('roles')}
                                    className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                                        donutTab === 'roles'
                                            ? 'bg-background text-foreground shadow-xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Peran
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDonutTab('questionTypes')}
                                    className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                                        donutTab === 'questionTypes'
                                            ? 'bg-background text-foreground shadow-xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Tipe Soal
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center pt-2">
                            {donutTab === 'roles' ? (
                                <DonutChart
                                    items={roleDonut}
                                    centerLabel="Pengguna"
                                    size={190}
                                    emptyText="Belum ada data pengguna."
                                />
                            ) : (
                                <DonutChart
                                    items={questionTypeDonut}
                                    centerLabel="Butir Soal"
                                    size={190}
                                    emptyText="Belum ada data butir soal."
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Professional Tables Section */}
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                        <div>
                            <CardTitle className="text-base font-semibold">
                                Aktivitas & Log Sistem CBT
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Pantau aktivitas ujian yang sedang berlangsung dan pengguna terbaru.
                            </CardDescription>
                        </div>

                        {/* Table Tab Selector */}
                        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
                            <button
                                type="button"
                                onClick={() => setTableTab('sessions')}
                                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                                    tableTab === 'sessions'
                                        ? 'bg-background text-foreground shadow-xs font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Sesi Ujian Siswa ({recentSessions.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTableTab('exams')}
                                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                                    tableTab === 'exams'
                                        ? 'bg-background text-foreground shadow-xs font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Jadwal Ujian ({recentExams.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTableTab('users')}
                                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                                    tableTab === 'users'
                                        ? 'bg-background text-foreground shadow-xs font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Pengguna Baru ({recentUsers.length})
                            </button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {/* Table 1: Recent Sessions */}
                        {tableTab === 'sessions' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b bg-muted/30 text-xs font-semibold uppercase text-muted-foreground">
                                        <tr>
                                            <th className="py-3 pl-6 pr-4">Siswa</th>
                                            <th className="py-3 pr-4">Ujian & Mapel</th>
                                            <th className="py-3 pr-4">Kelas</th>
                                            <th className="py-3 pr-4">Mulai Pengerjaan</th>
                                            <th className="py-3 pr-6 text-right">Status Sesi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {recentSessions.map((session) => (
                                            <tr
                                                key={session.id}
                                                className="transition-colors hover:bg-muted/40"
                                            >
                                                <td className="py-3.5 pl-6 pr-4">
                                                    <div className="font-medium text-foreground">
                                                        {session.student_name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        NIS: {session.nis}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    <div className="font-medium text-foreground">
                                                        {session.exam_name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {session.subject}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    <span className="inline-flex items-center rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-medium">
                                                        {session.school_class}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 pr-4 text-xs text-muted-foreground">
                                                    {session.started_at}
                                                </td>
                                                <td className="py-3.5 pr-6 text-right">
                                                    {getSessionStatusBadge(
                                                        session.status,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}

                                        {recentSessions.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="py-8 text-center text-sm text-muted-foreground"
                                                >
                                                    Belum ada aktivitas sesi ujian yang tercatat.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Table 2: Recent Exams */}
                        {tableTab === 'exams' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b bg-muted/30 text-xs font-semibold uppercase text-muted-foreground">
                                        <tr>
                                            <th className="py-3 pl-6 pr-4">Nama Ujian</th>
                                            <th className="py-3 pr-4">Mata Pelajaran</th>
                                            <th className="py-3 pr-4">Kelas</th>
                                            <th className="py-3 pr-4">Guru Pengampu</th>
                                            <th className="py-3 pr-4">Jadwal & Durasi</th>
                                            <th className="py-3 pr-6 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {recentExams.map((exam) => (
                                            <tr
                                                key={exam.id}
                                                className="transition-colors hover:bg-muted/40"
                                            >
                                                <td className="py-3.5 pl-6 pr-4">
                                                    <div className="font-medium text-foreground">
                                                        {exam.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {exam.sessions_count} siswa telah mengerjakan
                                                    </div>
                                                </td>
                                                <td className="py-3.5 pr-4 text-foreground font-medium">
                                                    {exam.subject}
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    <span className="inline-flex items-center rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-medium">
                                                        {exam.school_class}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 pr-4 text-xs text-muted-foreground">
                                                    {exam.teacher}
                                                </td>
                                                <td className="py-3.5 pr-4 text-xs text-muted-foreground">
                                                    <div>{exam.started_at}</div>
                                                    <div className="font-medium text-foreground">
                                                        {exam.duration_minutes} Menit
                                                    </div>
                                                </td>
                                                <td className="py-3.5 pr-6 text-right">
                                                    {getExamStatusBadge(
                                                        exam.status,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}

                                        {recentExams.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="py-8 text-center text-sm text-muted-foreground"
                                                >
                                                    Belum ada jadwal ujian yang dibuat.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Table 3: Recent Users */}
                        {tableTab === 'users' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b bg-muted/30 text-xs font-semibold uppercase text-muted-foreground">
                                        <tr>
                                            <th className="py-3 pl-6 pr-4">Pengguna</th>
                                            <th className="py-3 pr-4">Email</th>
                                            <th className="py-3 pr-4">Peran</th>
                                            <th className="py-3 pr-6 text-right">Terdaftar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {recentUsers.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="transition-colors hover:bg-muted/40"
                                            >
                                                <td className="py-3.5 pl-6 pr-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="font-medium text-foreground">
                                                            {user.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 pr-4 text-xs text-muted-foreground">
                                                    {user.email}
                                                </td>
                                                <td className="py-3.5 pr-4">
                                                    {getRoleBadge(user.role_label)}
                                                </td>
                                                <td className="py-3.5 pr-6 text-right text-xs text-muted-foreground">
                                                    {user.created_at}
                                                </td>
                                            </tr>
                                        ))}

                                        {recentUsers.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="py-8 text-center text-sm text-muted-foreground"
                                                >
                                                    Belum ada akun pengguna.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>

                    {/* Table Footer with Navigation Link */}
                    <div className="flex items-center justify-between border-t px-6 py-3 text-xs text-muted-foreground bg-muted/10">
                        <span>Menampilkan aktivitas sistem terkini</span>
                        {tableTab === 'sessions' && (
                            <Link
                                href="/admin/exam-monitoring"
                                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                            >
                                Buka Monitoring Ujian Lengkap
                                <ArrowRight className="size-3" />
                            </Link>
                        )}
                        {tableTab === 'exams' && (
                            <Link
                                href="/admin/exam-monitoring"
                                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                            >
                                Kelola Jadwal Ujian
                                <ArrowRight className="size-3" />
                            </Link>
                        )}
                        {tableTab === 'users' && (
                            <Link
                                href="/admin/users"
                                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                            >
                                Kelola Semua Pengguna
                                <ArrowRight className="size-3" />
                            </Link>
                        )}
                    </div>
                </Card>
            </div>
        </>
    );
}

function BarChartIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="18" x2="18" y1="20" y2="10" />
            <line x1="12" x2="12" y1="20" y2="4" />
            <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Admin',
            href: dashboard(),
        },
    ],
};
