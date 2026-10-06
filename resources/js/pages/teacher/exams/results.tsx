import { Head, Link } from "@inertiajs/react";
import { Download } from "lucide-react";
import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QUESTION_TYPE_LABELS } from "@/components/admin/question-form-fields";
import { dashboard as teacherDashboard } from "@/routes/teacher";
import {
    grading as examGrading,
    index as examsIndex,
    monitor as examMonitor,
    resultsExport as examResultsExport,
    results as examResults,
} from "@/routes/teacher/exams";

type Row = {
    id: number;
    student_name: string;
    status: string;
    score: number | null;
    earned_score: number;
    max_score: number;
    correct_count: number;
    question_count: number;
    has_essay_pending: boolean;
    submitted_at_label: string;
    violations_count: number;
};
type QuestionStat = {
    number: number;
    id: number;
    content: string;
    type: string;
    weight: number;
    avg_earned: number;
    max: number;
    correct_percent: number;
    correct_count: number;
    answered_count: number;
};

const STATUS_LABELS: Record<string, string> = {
    submitted: "Dikumpulkan",
    expired: "Waktu Habis",
};

export default function TeacherExamResults({
    exam,
    stats,
    rows,
    questionStats,
}: {
    exam: {
        id: number;
        name: string;
        subject: string;
        class: string;
        questions_count: number;
        participants_count: number;
    };
    stats: {
        submitted: number;
        scored: number;
        average: number | null;
        highest: number | null;
        lowest: number | null;
        essay_pending: number;
    };
    rows: Row[];
    questionStats: QuestionStat[];
}) {
    return (
        <>
            <Head title="Hasil Ujian" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Hasil Ujian"
                        description={`${exam.name} · ${exam.subject} · ${exam.class}`}
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <a href={examResultsExport.url(exam.id)}>
                                <Download className="size-4" /> Export CSV
                            </a>
                        </Button>
                        {stats.essay_pending > 0 && (
                            <Button asChild>
                                <Link href={examGrading.url(exam.id)}>
                                    Nilai Esai ({stats.essay_pending})
                                </Link>
                            </Button>
                        )}
                        <Button asChild variant="outline">
                            <Link href={examMonitor.url(exam.id)}>Pantau</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
                    {[
                        {
                            label: "Mengumpulkan",
                            value: `${stats.submitted}/${exam.participants_count}`,
                        },
                        { label: "Rata-rata", value: stats.average ?? "—" },
                        { label: "Tertinggi", value: stats.highest ?? "—" },
                        { label: "Terendah", value: stats.lowest ?? "—" },
                        { label: "Menunggu Esai", value: stats.essay_pending },
                        { label: "Total Soal", value: exam.questions_count },
                    ].map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="pt-5 text-center">
                                <p className="text-2xl font-bold">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {stat.label}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-5">
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="text-base font-medium">
                                Daftar Nilai Siswa
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
                                            Nilai
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Skor
                                        </th>
                                        <th className="py-2 font-medium">
                                            Waktu Kumpul
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-2.5 pr-4 font-medium">
                                                {row.student_name}
                                                {row.violations_count > 0 && (
                                                    <Badge
                                                        variant="destructive"
                                                        className="ml-2"
                                                    >
                                                        {row.violations_count}{" "}
                                                        pelanggaran
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-2.5 pr-4">
                                                <Badge variant="secondary">
                                                    {STATUS_LABELS[
                                                        row.status
                                                    ] ?? row.status}
                                                </Badge>
                                            </td>
                                            <td className="py-2.5 pr-4 text-lg font-bold">
                                                {row.score ?? (
                                                    <span className="text-sm font-normal text-amber-600 dark:text-amber-400">
                                                        Menunggu esai
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2.5 pr-4 text-muted-foreground">
                                                {row.earned_score}/
                                                {row.max_score} ·{" "}
                                                {row.correct_count}/
                                                {row.question_count} benar
                                            </td>
                                            <td className="py-2.5 text-muted-foreground">
                                                {row.submitted_at_label}
                                            </td>
                                        </tr>
                                    ))}
                                    {rows.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="py-4 text-center text-muted-foreground"
                                            >
                                                Belum ada peserta yang
                                                mengumpulkan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base font-medium">
                                Analisis Butir Soal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                                Persentase pencapaian nilai kelas per soal —
                                makin pendek, makin perlu diulang di kelas.
                            </p>
                            {questionStats.map((stat) => (
                                <div key={stat.id}>
                                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                                        <span className="min-w-0 truncate font-medium">
                                            {stat.number}. {stat.content}
                                        </span>
                                        <span className="shrink-0 text-muted-foreground">
                                            {stat.correct_count}/
                                            {stat.answered_count} benar
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={`h-full rounded-full ${stat.correct_percent >= 60 ? "bg-emerald-500" : stat.correct_percent >= 30 ? "bg-amber-500" : "bg-destructive"}`}
                                                style={{
                                                    width: `${stat.correct_percent}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                                            {stat.correct_percent}%
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                                        {QUESTION_TYPE_LABELS[
                                            stat.type as keyof typeof QUESTION_TYPE_LABELS
                                        ] ?? stat.type}{" "}
                                        · rata-rata {stat.avg_earned}/{stat.max}
                                    </p>
                                </div>
                            ))}
                            {questionStats.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada data — menunggu pengumpulan
                                    peserta.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Button asChild variant="outline">
                        <Link href={examsIndex().url}>
                            Kembali ke Daftar Ujian
                        </Link>
                    </Button>
                </div>
            </div>
        </>
    );
}

TeacherExamResults.layout = {
    breadcrumbs: [
        { title: "Dashboard Guru", href: teacherDashboard() },
        { title: "Ujian", href: examsIndex() },
        { title: "Hasil", href: window.location.href },
    ],
};
