import { Head, Link, router } from "@inertiajs/react";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Eye,
    FileText,
    RotateCcw,
    XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { start as previewStart } from "@/routes/teacher/exams/preview";
import { show as examShow } from "@/routes/teacher/exams";

type QuestionType =
    | "multiple_choice"
    | "multiple_answers"
    | "true_false"
    | "statement_true_false"
    | "matching"
    | "essay";

type ResultDetail = {
    question_id: number;
    content: string;
    type: QuestionType;
    weight: number;
    image_url?: string | null;
    earned: number;
    max: number;
    is_correct: boolean | null;
    student_answer: unknown;
    correct_answer: unknown;
};

type ResultData = {
    score: number | null;
    earned_score: number;
    max_score: number;
    correct_count: number;
    question_count: number;
    has_essay_pending: boolean;
    details: ResultDetail[];
};

type SessionInfo = {
    id: number;
    exam_name: string;
    subject: string;
    submitted_at_label: string;
    status: string;
};

type ExamInfo = { id: number; name: string };

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    multiple_choice: "PG",
    multiple_answers: "Multi-jawab",
    true_false: "Benar/Salah",
    statement_true_false: "Pernyataan B/S",
    matching: "Menjodohkan",
    essay: "Esai",
};

function formatAnswer(type: QuestionType, answer: unknown): string {
    if (answer === null || answer === undefined) return "—";
    const a = answer as Record<string, unknown>;
    if ("option_id" in a) return `Pilihan #${a.option_id}`;
    if ("option_ids" in a) {
        const ids = a.option_ids as number[];
        return ids.length ? `Pilihan #${ids.join(", #")}` : "—";
    }
    if ("text" in a) return String(a.text) || "—";
    if ("judgments" in a) {
        const j = a.judgments as Record<string, boolean>;
        return Object.entries(j)
            .map(([k, v]) => `${k}: ${v ? "Benar" : "Salah"}`)
            .join(", ");
    }
    if ("matches" in a) {
        const m = a.matches as Record<string, string>;
        return Object.entries(m)
            .map(([k, v]) => `${k}→${v}`)
            .join(", ");
    }
    return JSON.stringify(answer);
}

export default function TeacherExamPreviewResult({
    exam,
    session,
    result,
}: {
    exam: ExamInfo;
    session: SessionInfo;
    result: ResultData | null;
}) {
    const restart = () => {
        router.get(previewStart.url(exam.id));
    };

    const scorePercent =
        result && result.max_score > 0
            ? Math.round((result.earned_score / result.max_score) * 100)
            : 0;

    return (
        <>
            <Head title={`[Uji Coba] Hasil — ${session.exam_name}`} />

            {/* Preview banner */}
            <div className="flex items-center justify-center gap-2 bg-amber-500 dark:bg-amber-600 px-4 py-2 text-white text-sm font-semibold">
                <Eye className="size-4 shrink-0" />
                Mode Uji Coba Guru — hasil ini tidak tercatat ke data siswa
            </div>

            <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold">{session.exam_name}</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {session.subject} · Diselesaikan {session.submitted_at_label}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={restart}>
                            <RotateCcw className="size-4 mr-1.5" />
                            Uji Coba Lagi
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={examShow.url(exam.id)}>
                                <ArrowLeft className="size-4 mr-1.5" />
                                Kembali ke Ujian
                            </Link>
                        </Button>
                    </div>
                </div>

                {result === null ? (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            Hasil penilaian belum tersedia.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Score summary */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Card className="sm:col-span-1 flex flex-col items-center justify-center py-8">
                                <p className="text-5xl font-bold tabular-nums">
                                    {result.score !== null ? result.score.toFixed(1) : "—"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">Nilai akhir (0–100)</p>
                                <div className="mt-3 h-2 w-32 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${scorePercent}%` }}
                                    />
                                </div>
                            </Card>
                            <Card className="sm:col-span-2">
                                <CardContent className="pt-6 grid grid-cols-2 gap-4 text-sm">
                                    {[
                                        { label: "Total soal", value: result.question_count },
                                        { label: "Benar", value: result.correct_count },
                                        {
                                            label: "Skor mentah",
                                            value: `${result.earned_score.toFixed(1)} / ${result.max_score.toFixed(1)}`,
                                        },
                                        {
                                            label: "Status esai",
                                            value: result.has_essay_pending
                                                ? "Menunggu koreksi"
                                                : "Tidak ada / sudah dinilai",
                                        },
                                    ].map(({ label, value }) => (
                                        <div key={label}>
                                            <p className="text-muted-foreground text-xs">{label}</p>
                                            <p className="font-semibold mt-0.5">{value}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Detail per question */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <FileText className="size-4" />
                                    Detail Jawaban ({result.details.length} soal)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {result.details.map((detail, index) => (
                                        <div key={detail.question_id} className="p-4 space-y-2">
                                            <div className="flex items-start gap-3">
                                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground mt-0.5">
                                                    {index + 1}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {QUESTION_TYPE_LABELS[detail.type]}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            Bobot {detail.weight}
                                                        </span>
                                                        {detail.is_correct === true && (
                                                            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                                <CheckCircle2 className="size-3.5" />
                                                                Benar ({detail.earned.toFixed(1)}/{detail.max.toFixed(1)})
                                                            </span>
                                                        )}
                                                        {detail.is_correct === false && (
                                                            <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                                                                <XCircle className="size-3.5" />
                                                                Salah ({detail.earned.toFixed(1)}/{detail.max.toFixed(1)})
                                                            </span>
                                                        )}
                                                        {detail.is_correct === null && (
                                                            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                                <AlertCircle className="size-3.5" />
                                                                Perlu koreksi manual
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm line-clamp-3">{detail.content}</p>
                                                    {detail.image_url && (
                                                        <img
                                                            src={detail.image_url}
                                                            alt="Gambar soal"
                                                            className="mt-2 max-h-32 rounded border object-contain"
                                                        />
                                                    )}
                                                    <div className="mt-2 grid sm:grid-cols-2 gap-2 text-xs">
                                                        <div className="rounded-md bg-muted/50 border px-2.5 py-1.5">
                                                            <p className="text-muted-foreground mb-0.5">Jawaban Anda</p>
                                                            <p className="font-medium break-words">
                                                                {formatAnswer(detail.type, detail.student_answer)}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1.5">
                                                            <p className="text-muted-foreground mb-0.5">Kunci Jawaban</p>
                                                            <p className="font-medium break-words text-emerald-700 dark:text-emerald-300">
                                                                {formatAnswer(detail.type, detail.correct_answer)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </>
    );
}

