import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboard as teacherDashboard } from "@/routes/teacher";
import {
    index as examsIndex,
    monitorSession as monitorSessionRoute,
    show as examShow,
} from "@/routes/teacher/exams";

type MonitorSession = {
    id: number;
    student_name: string;
    status: "ongoing" | "submitted" | "expired";
    locked: boolean;
    locked_reason: string | null;
    started_at_label: string;
    remaining_seconds: number;
    answered_count: number;
    questions_count: number;
    last_activity_label: string;
    violations_count: number;
    warnings_count: number;
    flagged: boolean;
    last_violation_label: string | null;
};

const STATUS_LABELS: Record<MonitorSession["status"], string> = {
    ongoing: "Sedang Ujian",
    submitted: "Dikumpulkan",
    expired: "Waktu Habis",
};

const STATUS_VARIANT: Record<
    MonitorSession["status"],
    "destructive" | "default" | "secondary"
> = {
    ongoing: "destructive",
    submitted: "default",
    expired: "secondary",
};

function formatClock(totalSeconds: number): string {
    const total = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function RemainingTime({ seconds }: { seconds: number }) {
    const [left, setLeft] = useState(seconds);

    useEffect(() => setLeft(seconds), [seconds]);
    useEffect(() => {
        const timer = setInterval(
            () => setLeft((value) => Math.max(0, value - 1)),
            1000,
        );
        return () => clearInterval(timer);
    }, []);

    return <span className="font-mono">{formatClock(left)}</span>;
}

export default function TeacherExamMonitor({
    exam,
    sessions,
}: {
    exam: {
        id: number;
        name: string;
        subject: string;
        class: string;
        status: string;
        questions_count: number;
        participants_count: number;
    };
    sessions: MonitorSession[];
}) {
    // Refresh participant progress every 5 seconds while the page is open.
    useEffect(() => {
        const timer = setInterval(() => {
            router.reload({ only: ["sessions"] });
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const started = sessions.length;

    return (
        <>
            <Head title="Pantau Peserta" />
            <div className="flex h-full flex-1 flex-col gap-5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Pantau Peserta"
                        description={`${exam.name} · ${exam.subject} · ${exam.class}`}
                    />
                    <Button asChild variant="outline">
                        <Link href={examShow.url(exam.id)}>
                            Kembali ke Detail
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="pt-5 text-center">
                            <p className="text-3xl font-bold">
                                {started}/{exam.participants_count}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Peserta sudah mulai
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5 text-center">
                            <p className="text-3xl font-bold text-destructive">
                                {
                                    sessions.filter(
                                        (session) =>
                                            session.status === "ongoing",
                                    ).length
                                }
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Sedang mengerjakan
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5 text-center">
                            <p className="text-3xl font-bold">
                                {
                                    sessions.filter(
                                        (session) =>
                                            session.status !== "ongoing",
                                    ).length
                                }
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Sudah mengumpulkan
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base font-medium">
                            <span>Peserta</span>
                            <span className="text-xs font-normal text-muted-foreground">
                                Diperbarui otomatis setiap 5 detik
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase">
                                    <th className="py-2 pr-4 font-medium">
                                        Siswa
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Status
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Kemajuan
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Sisa Waktu
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Pelanggaran
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Aktivitas Terakhir
                                    </th>
                                    <th className="py-2 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((session) => (
                                    <tr
                                        key={session.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="py-3 pr-4 font-medium">
                                            {session.student_name}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <Badge
                                                variant={
                                                    STATUS_VARIANT[
                                                        session.status
                                                    ]
                                                }
                                            >
                                                {STATUS_LABELS[session.status]}
                                            </Badge>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all"
                                                        style={{
                                                            width: `${session.questions_count > 0 ? Math.min(100, (session.answered_count / session.questions_count) * 100) : 0}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {session.answered_count}/
                                                    {session.questions_count}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4">
                                            {session.status === "ongoing" ? (
                                                <RemainingTime
                                                    seconds={
                                                        session.remaining_seconds
                                                    }
                                                />
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 pr-4">
                                            {session.locked && (
                                                <Badge
                                                    variant="destructive"
                                                    className="mb-1"
                                                >
                                                    🔒 Terkunci
                                                </Badge>
                                            )}
                                            {session.flagged &&
                                                !session.locked && (
                                                    <Badge
                                                        variant="destructive"
                                                        className="mb-1"
                                                    >
                                                        ⚑ Perlu diperiksa
                                                    </Badge>
                                                )}
                                            {session.violations_count > 0 ? (
                                                <Badge variant="destructive">
                                                    {session.violations_count}{" "}
                                                    pelanggaran
                                                    {session.last_violation_label
                                                        ? ` · ${session.last_violation_label}`
                                                        : ""}
                                                </Badge>
                                            ) : session.warnings_count > 0 ? (
                                                <Badge variant="secondary">
                                                    {session.warnings_count}{" "}
                                                    peringatan
                                                    {session.last_violation_label
                                                        ? ` · ${session.last_violation_label}`
                                                        : ""}
                                                </Badge>
                                            ) : (
                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                    Bersih
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 pr-4 text-muted-foreground">
                                            {session.last_activity_label}{" "}
                                            <span className="text-xs">
                                                ({session.started_at_label}{" "}
                                                mulai)
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Link
                                                    href={monitorSessionRoute.url(
                                                        {
                                                            exam: exam.id,
                                                            session: session.id,
                                                        },
                                                    )}
                                                >
                                                    Detail
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {sessions.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-4 text-center text-muted-foreground"
                                        >
                                            Belum ada peserta yang memulai
                                            ujian.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

TeacherExamMonitor.layout = {
    breadcrumbs: [
        { title: "Dashboard Guru", href: teacherDashboard() },
        { title: "Ujian", href: examsIndex() },
        { title: "Pantau Peserta", href: window.location.href },
    ],
};
