import { Head, Link, router } from '@inertiajs/react';
import { CalendarCheck, ClipboardList } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    index as studentExamsIndex,
    result as sessionResult,
    start as examStart,
} from '@/routes/student/exams';

type ExamStatus = 'scheduled' | 'ongoing' | 'finished';
type SessionInfo = { id: number; status: 'ongoing' | 'submitted' | 'expired' };
type Exam = {
    id: number;
    name: string;
    subject: string;
    class: string;
    started_at_label: string;
    ends_at_label: string;
    starts_at: number;
    ends_at: number;
    duration_minutes: number;
    questions_count: number;
    status: ExamStatus;
    session: SessionInfo | null;
};

const STATUS_LABELS: Record<ExamStatus, string> = {
    scheduled: 'Akan Datang',
    ongoing: 'Sedang Berlangsung',
    finished: 'Selesai',
};

const STATUS_VARIANT: Record<
    ExamStatus,
    'secondary' | 'default' | 'destructive' | 'outline'
> = {
    scheduled: 'secondary',
    ongoing: 'destructive',
    finished: 'outline',
};

const SECTION_ORDER: { status: ExamStatus; label: string; hint: string }[] = [
    {
        status: 'ongoing',
        label: 'Sedang Berlangsung',
        hint: 'Kerjakan sebelum waktu tutup.',
    },
    {
        status: 'scheduled',
        label: 'Akan Datang',
        hint: 'Belum bisa dikerjakan sebelum jadwal mulai.',
    },
    {
        status: 'finished',
        label: 'Sudah Selesai',
        hint: 'Lihat hasil ujian yang sudah kamu kerjakan.',
    },
];

function useCountdown(target: number, serverTime: number) {
    const [offset] = useState(() => serverTime - Date.now());
    const [remaining, setRemaining] = useState(
        () => target - (Date.now() + offset),
    );

    useEffect(() => {
        const timer = setInterval(
            () => setRemaining(target - (Date.now() + offset)),
            1000,
        );
        return () => clearInterval(timer);
    }, [target, offset]);

    return Math.max(0, remaining);
}

function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? `${hours} j ` : ''}${minutes} mnt ${seconds.toString().padStart(2, '0')} dtk`;
}

export default function StudentExams({
    exams,
    server_time,
}: {
    exams: Exam[];
    server_time: number;
}) {
    const groups = useMemo(() => {
        return SECTION_ORDER.map((section) => ({
            ...section,
            exams: exams.filter((exam) => exam.status === section.status),
        })).filter((section) => section.exams.length > 0);
    }, [exams]);

    return (
        <>
            <Head title="Ujian Saya" />
            <div className="flex h-full flex-1 flex-col gap-5 p-4">
                <Heading
                    title="Ujian Saya"
                    description="Daftar ujian untuk kelas Anda. Ujian yang sedang berlangsung selalu tampil paling atas."
                />

                {exams.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                                <CalendarCheck className="size-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">
                                Belum ada ujian yang dijadwalkan
                            </h3>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Ujian dari guru Anda akan muncul di sini begitu
                                dipublikasikan. Pastikan kamu tetap dicek
                                sebelum hari ujian.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    groups.map((section) => (
                        <section
                            key={section.status}
                            className="flex flex-col gap-3"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-sm font-semibold tracking-wide uppercase">
                                    {section.label}
                                </h2>
                                <Badge
                                    variant="secondary"
                                    className="font-normal"
                                >
                                    {section.exams.length} ujian
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {section.hint}
                                </span>
                            </div>
                            <div className="grid gap-4 xl:grid-cols-2">
                                {section.exams.map((exam) => (
                                    <ExamCard
                                        key={exam.id}
                                        exam={exam}
                                        serverTime={server_time}
                                    />
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </>
    );
}

function ExamCard({ exam, serverTime }: { exam: Exam; serverTime: number }) {
    const untilStart = useCountdown(exam.starts_at, serverTime);
    const untilEnd = useCountdown(exam.ends_at, serverTime);

    const sessionOngoing = exam.session?.status === 'ongoing';
    const sessionDone =
        exam.session !== null && exam.session.status !== 'ongoing';

    let action = null;
    if (sessionDone) {
        action = (
            <Button asChild>
                <Link href={sessionResult.url(exam.session!.id)}>
                    Lihat Hasil
                </Link>
            </Button>
        );
    } else if (sessionOngoing) {
        action = (
            <Button onClick={() => router.post(examStart.url(exam.id))}>
                Lanjutkan Ujian
            </Button>
        );
    } else if (exam.status === 'scheduled') {
        action = (
            <div className="text-right">
                <Button disabled>Mulai Ujian</Button>
                <p className="mt-1 text-xs text-muted-foreground">
                    Dimulai{' '}
                    {untilStart > 0
                        ? formatDuration(untilStart)
                        : 'sebentar lagi'}{' '}
                    lagi
                </p>
            </div>
        );
    } else if (exam.status === 'ongoing') {
        action = (
            <div className="text-right">
                <Button onClick={() => router.post(examStart.url(exam.id))}>
                    Mulai Ujian
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                    Ditutup {formatDuration(untilEnd)} lagi
                </p>
            </div>
        );
    } else {
        action = <Badge variant="secondary">Tidak diikuti</Badge>;
    }

    return (
        <Card
            className={
                exam.status === 'ongoing' && !sessionDone
                    ? 'border-primary/40 ring-2 ring-primary/15'
                    : undefined
            }
        >
            <CardContent className="space-y-3 pt-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate font-semibold">{exam.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            {exam.subject} · {exam.class}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {exam.started_at_label} – {exam.ends_at_label} ·{' '}
                            {exam.duration_minutes} menit
                        </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[exam.status]}>
                        {STATUS_LABELS[exam.status]}
                    </Badge>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ClipboardList className="size-3.5" />
                        {exam.questions_count} soal
                    </span>
                    {action}
                </div>
            </CardContent>
        </Card>
    );
}

StudentExams.layout = {
    breadcrumbs: [{ title: 'Ujian Saya', href: studentExamsIndex() }],
};
