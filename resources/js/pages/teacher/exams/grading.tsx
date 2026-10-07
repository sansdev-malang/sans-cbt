import { Form, Head, Link } from "@inertiajs/react";
import TeacherExamController from "@/actions/App/Http/Controllers/Teacher/ExamController";
import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dashboard as teacherDashboard } from "@/routes/teacher";
import {
    grading as examGrading,
    index as examsIndex,
    show as examShow,
} from "@/routes/teacher/exams";

type EssayAnswer = {
    question_id: number;
    content: string;
    weight: number;
    student_text: string;
    earned: number;
    graded: boolean;
};
type GradingSession = {
    id: number;
    student_name: string;
    status: string;
    submitted_at_label: string;
    pending_essays: number;
    essays: EssayAnswer[];
    score: number | null;
    earned_score: number;
    max_score: number;
};

const STATUS_LABELS: Record<string, string> = {
    ongoing: "Sedang Ujian",
    submitted: "Dikumpulkan",
    expired: "Waktu Habis",
};

export default function TeacherExamGrading({
    exam,
    sessions,
}: {
    exam: { id: number; name: string; subject: string; class: string };
    sessions: GradingSession[];
}) {
    const totalPending = sessions.reduce(
        (sum, session) => sum + session.pending_essays,
        0,
    );

    return (
        <>
            <Head title="Nilai Esai" />
            <div className="flex h-full flex-1 flex-col gap-5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Nilai Esai"
                        description={`${exam.name} · ${exam.subject} · ${exam.class}`}
                    />
                    <div className="flex items-center gap-2">
                        {totalPending > 0 && (
                            <Badge variant="destructive">
                                {totalPending} esai menunggu
                            </Badge>
                        )}
                        <Button asChild variant="outline">
                            <Link href={examShow.url(exam.id)}>
                                Kembali ke Detail
                            </Link>
                        </Button>
                    </div>
                </div>

                {sessions.length === 0 && (
                    <Card>
                        <CardContent className="pt-6 text-sm text-muted-foreground">
                            Belum ada peserta yang mengumpulkan ujian ini.
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    {sessions.map((session) => (
                        <Card key={session.id}>
                            <CardContent className="space-y-4 pt-5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h2 className="font-semibold">
                                            {session.student_name}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            Dikumpulkan{" "}
                                            {session.submitted_at_label}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">
                                            {STATUS_LABELS[session.status] ??
                                                session.status}
                                        </Badge>
                                        <Badge variant="outline">
                                            Skor: {session.earned_score}/
                                            {session.max_score}
                                            {session.score !== null
                                                ? ` · nilai ${session.score}`
                                                : session.pending_essays > 0
                                                  ? " · menunggu esai"
                                                  : ""}
                                        </Badge>
                                    </div>
                                </div>

                                {session.essays.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Sesi ini tidak memiliki soal esai —
                                        sudah dinilai otomatis.
                                    </p>
                                ) : (
                                    <Form
                                        {...TeacherExamController.grade.form({
                                            exam: exam.id,
                                            session: session.id,
                                        })}
                                        options={{ preserveScroll: true }}
                                        className="space-y-3"
                                    >
                                        {({ processing }) => (
                                            <>
                                                {session.essays.map(
                                                    (essay, index) => (
                                                        <div
                                                            key={
                                                                essay.question_id
                                                            }
                                                            className="rounded-md border p-3"
                                                        >
                                                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                                                <p className="text-sm font-medium">
                                                                    Soal{" "}
                                                                    {index + 1}:{" "}
                                                                    {
                                                                        essay.content
                                                                    }
                                                                </p>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    {essay.graded ? (
                                                                        <Badge variant="secondary">
                                                                            Sudah
                                                                            dinilai
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="destructive">
                                                                            Menunggu
                                                                        </Badge>
                                                                    )}
                                                                    <span>
                                                                        Maks{" "}
                                                                        {
                                                                            essay.weight
                                                                        }{" "}
                                                                        poin
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="mb-2 max-h-40 overflow-y-auto rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                                                                <span
                                                                    dir="auto"
                                                                    className="font-content"
                                                                >
                                                                    {essay.student_text || (
                                                                        <span className="text-muted-foreground italic">
                                                                            (tidak
                                                                            menjawab)
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Label
                                                                    className="text-sm"
                                                                    htmlFor={`score-${session.id}-${essay.question_id}`}
                                                                >
                                                                    Nilai
                                                                </Label>
                                                                <Input
                                                                    id={`score-${session.id}-${essay.question_id}`}
                                                                    name={`scores[${essay.question_id}]`}
                                                                    type="number"
                                                                    min="0"
                                                                    max={
                                                                        essay.weight
                                                                    }
                                                                    step="0.5"
                                                                    defaultValue={
                                                                        essay.earned
                                                                    }
                                                                    className="w-24"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                                <Button disabled={processing}>
                                                    Simpan Nilai Esai
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}

TeacherExamGrading.layout = {
    breadcrumbs: [
        { title: "Dashboard Guru", href: teacherDashboard() },
        { title: "Ujian", href: examsIndex() },
        { title: "Nilai Esai", href: window.location.href },
    ],
};
