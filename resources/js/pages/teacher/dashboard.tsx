import { Head, Link } from '@inertiajs/react';
import {
    BookOpen,
    ClipboardList,
    GraduationCap,
    ListChecks,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard as teacherDashboard } from '@/routes/teacher';
import { index as examsIndex, show as examShow } from '@/routes/teacher/exams';
import { index as questionsIndex } from '@/routes/teacher/questions';

type UpcomingExam = {
    id: number;
    name: string;
    subject: string;
    class: string;
    started_at_label: string;
    duration_minutes: number;
    questions_count: number;
};

export default function TeacherDashboard({
    teacher_name,
    stats,
    upcomingExams,
}: {
    teacher_name: string;
    stats: { label: string; value: number }[];
    upcomingExams: UpcomingExam[];
}) {
    const icons = [ClipboardList, ListChecks, BookOpen, GraduationCap];

    return (
        <>
            <Head title="Dashboard Guru" />
            <div className="flex h-full flex-1 flex-col gap-5 p-4">
                <Heading
                    title={`Assalamu'alaikum, ${teacher_name}`}
                    description="Kelola bank soal dan ujian kelas Anda dari sini."
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat, index) => {
                        const Icon = icons[index % icons.length];
                        return (
                            <Card key={stat.label}>
                                <CardContent className="flex items-center gap-3 pt-5">
                                    <span className="rounded-lg bg-primary/10 p-2.5 text-primary">
                                        <Icon className="size-5" />
                                    </span>
                                    <div>
                                        <p className="text-2xl font-semibold">
                                            {stat.value}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {stat.label}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-medium">
                            Ujian Terjadwal
                        </CardTitle>
                        <Button asChild size="sm" variant="outline">
                            <Link href={examsIndex()}>Buat Ujian</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {upcomingExams.length ? (
                            <div className="divide-y rounded-md border">
                                {upcomingExams.map((exam) => (
                                    <Link
                                        key={exam.id}
                                        href={examShow.url(exam.id)}
                                        className="flex flex-wrap items-center justify-between gap-2 p-3 transition-colors hover:bg-muted/50"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {exam.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {exam.subject} · {exam.class} ·{' '}
                                                {exam.started_at_label} ·{' '}
                                                {exam.duration_minutes} menit
                                            </p>
                                        </div>
                                        <Badge variant="secondary">
                                            {exam.questions_count} soal
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Belum ada ujian terpublikasi yang akan datang.
                                Buat ujian baru dari menu Ujian.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium">
                            Alur Mengajar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                            <li>
                                Susun soal di{' '}
                                <Link
                                    className="font-medium text-foreground underline"
                                    href={questionsIndex()}
                                >
                                    Bank Soal
                                </Link>{' '}
                                — pilihan ganda, benar/salah, atau esai.
                            </li>
                            <li>
                                Buat ujian, pilih soal dari bank, tentukan kelas
                                peserta dan jadwalnya.
                            </li>
                            <li>
                                Publikasikan ujian supaya peserta dapat
                                mengerjakannya sesuai jadwal.
                            </li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

TeacherDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard Guru', href: teacherDashboard() }],
};
