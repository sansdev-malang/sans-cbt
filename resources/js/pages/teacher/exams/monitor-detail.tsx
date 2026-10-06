import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import TeacherExamController from "@/actions/App/Http/Controllers/Teacher/ExamController";
import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    QUESTION_TYPE_LABELS,
    type QuestionType,
} from "@/components/admin/question-form-fields";
import { dashboard as teacherDashboard } from "@/routes/teacher";
import {
    index as examsIndex,
    monitor as examMonitor,
    monitorSession as monitorSessionRoute,
} from "@/routes/teacher/exams";

type SessionDetail = {
    id: number;
    student_name: string;
    status: "ongoing" | "submitted" | "expired";
    locked: boolean;
    locked_reason: string | null;
    started_at_label: string;
    remaining_seconds: number;
    server_time: number;
    deadline: number;
    answered_count: number;
    questions_count: number;
    violations_count: number;
    warnings_count: number;
    questions: {
        number: number;
        id: number;
        content: string;
        type: QuestionType;
        weight: number;
        answered: boolean;
        summary: string | null;
    }[];
    logs: {
        id: number;
        event_type: string;
        level: string;
        metadata: Record<string, unknown> | null;
        created_at_label: string;
    }[];
};

const STATUS_LABELS: Record<SessionDetail["status"], string> = {
    ongoing: "Sedang Ujian",
    submitted: "Dikumpulkan",
    expired: "Waktu Habis",
};

const STATUS_VARIANT: Record<
    SessionDetail["status"],
    "destructive" | "default" | "secondary"
> = {
    ongoing: "destructive",
    submitted: "default",
    expired: "secondary",
};

const LEVEL_VARIANT: Record<
    string,
    "secondary" | "default" | "destructive" | "outline"
> = {
    info: "secondary",
    warning: "default",
    violation: "destructive",
    critical: "destructive",
};

function formatClock(totalSeconds: number): string {
    const total = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function RemainingTime({
    seconds,
    serverTime,
    deadline,
}: {
    seconds: number;
    serverTime: number;
    deadline: number;
}) {
    const [offset] = useState(() => serverTime - Date.now());
    const [left, setLeft] = useState(seconds);

    useEffect(() => setLeft(seconds), [seconds]);
    useEffect(() => {
        const timer = setInterval(
            () =>
                setLeft(
                    Math.max(
                        0,
                        Math.round((deadline - (Date.now() + offset)) / 1000),
                    ),
                ),
            1000,
        );
        return () => clearInterval(timer);
    }, [deadline, offset]);

    return <span className="font-mono font-semibold">{formatClock(left)}</span>;
}

export default function TeacherMonitorDetail({
    exam,
    session,
}: {
    exam: { id: number; name: string; subject: string; class: string };
    session: SessionDetail;
}) {
    // Detail siswa diperbarui otomatis setiap 5 detik selama halaman terbuka.
    useEffect(() => {
        const timer = setInterval(() => {
            router.reload({ only: ["session"] });
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <Head title={`Awasi ${session.student_name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title={session.student_name}
                        description={`${exam.name} · ${exam.subject} · ${exam.class}`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        {session.locked && (
                            <Button
                                onClick={() =>
                                    router.post(
                                        TeacherExamController.unlockSession.url(
                                            {
                                                exam: exam.id,
                                                session: session.id,
                                            },
                                        ),
                                    )
                                }
                            >
                                🔓 Buka Kunci
                            </Button>
                        )}
                        <Button asChild variant="outline">
                            <Link href={examMonitor.url(exam.id)}>
                                Kembali ke Pantauan
                            </Link>
                        </Button>
                    </div>
                </div>

                {session.locked && (
                    <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4">
                        <p className="font-semibold text-destructive">
                            🔒 Ujian siswa ini TERKUNCI karena pelanggaran
                            keamanan.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {session.locked_reason ??
                                "Sistem mendeteksi pelanggaran berulang."}{" "}
                            Siswa tidak bisa melanjutkan sampai Anda membuka
                            kuncinya.
                        </p>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="pt-5 text-center">
                            <Badge variant={STATUS_VARIANT[session.status]}>
                                {STATUS_LABELS[session.status]}
                            </Badge>
                            {session.locked && (
                                <Badge variant="destructive" className="ml-1.5">
                                    Terkunci
                                </Badge>
                            )}
                            <p className="mt-2 text-xs text-muted-foreground">
                                Mulai {session.started_at_label}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5 text-center">
                            <p className="text-3xl font-bold">
                                {session.answered_count}/
                                {session.questions_count}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Soal terjawab
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5 text-center">
                            {session.status === "ongoing" ? (
                                <p className="text-3xl font-bold font-mono">
                                    <RemainingTime
                                        seconds={session.remaining_seconds}
                                        serverTime={session.server_time}
                                        deadline={session.deadline}
                                    />
                                </p>
                            ) : (
                                <p className="text-3xl font-bold text-muted-foreground">
                                    —
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Sisa waktu
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                                {session.violations_count > 0 && (
                                    <Badge variant="destructive">
                                        {session.violations_count} pelanggaran
                                    </Badge>
                                )}
                                {session.warnings_count > 0 && (
                                    <Badge variant="secondary">
                                        {session.warnings_count} peringatan
                                    </Badge>
                                )}
                                {session.violations_count === 0 &&
                                    session.warnings_count === 0 && (
                                        <Badge variant="outline">Bersih</Badge>
                                    )}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Catatan keamanan
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-5">
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="text-base font-medium">
                                Jawaban Siswa (live)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y rounded-md border">
                                {session.questions.map((question) => (
                                    <div
                                        key={question.id}
                                        className="flex items-start gap-3 p-3"
                                    >
                                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                            {question.number}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 text-sm">
                                                {question.content}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                <Badge variant="outline">
                                                    {QUESTION_TYPE_LABELS[
                                                        question.type
                                                    ] ?? question.type}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    Bobot {question.weight}
                                                </span>
                                            </div>
                                            {question.answered ? (
                                                <p className="mt-2 rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-sm text-emerald-700 dark:text-emerald-300">
                                                    {question.summary}
                                                </p>
                                            ) : (
                                                <p className="mt-2 text-xs italic text-muted-foreground">
                                                    Belum dijawab
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {session.questions.length === 0 && (
                                    <p className="p-3 text-sm text-muted-foreground">
                                        Tidak ada soal.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between text-base font-medium">
                                <span>Log Aktivitas &amp; Pelanggaran</span>
                                <span className="text-xs font-normal text-muted-foreground">
                                    Live · 5 dtk
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[32rem] space-y-1.5 overflow-y-auto">
                                {session.logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    LEVEL_VARIANT[log.level] ??
                                                    "secondary"
                                                }
                                            >
                                                {log.event_type}
                                            </Badge>
                                            {log.metadata &&
                                                Object.keys(log.metadata)
                                                    .length > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {JSON.stringify(
                                                            log.metadata,
                                                        )}
                                                    </span>
                                                )}
                                        </div>
                                        <span className="shrink-0 text-xs text-muted-foreground">
                                            {log.created_at_label}
                                        </span>
                                    </div>
                                ))}
                                {session.logs.length === 0 && (
                                    <p className="p-3 text-sm text-muted-foreground">
                                        Belum ada aktivitas tercatat.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

TeacherMonitorDetail.layout = {
    breadcrumbs: [
        { title: "Dashboard Guru", href: teacherDashboard() },
        { title: "Ujian", href: examsIndex() },
        { title: "Awasi Siswa", href: window.location.href },
    ],
};
