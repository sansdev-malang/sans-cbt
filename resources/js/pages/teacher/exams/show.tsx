import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import TeacherExamController from "@/actions/App/Http/Controllers/Teacher/ExamController";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";
import { QUESTION_TYPE_LABELS } from "@/components/admin/question-form-fields";
import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboard as teacherDashboard } from "@/routes/teacher";
import {
    grading as examGrading,
    index as examsIndex,
    monitor as examMonitor,
    publish as examPublish,
    results as examResults,
    unpublish as examUnpublish,
} from "@/routes/teacher/exams";
import { start as previewStart } from "@/routes/teacher/exams/preview";

type QuestionType =
    | "multiple_choice"
    | "multiple_answers"
    | "true_false"
    | "statement_true_false"
    | "matching"
    | "essay";
type ExamQuestion = {
    id: number;
    content: string;
    type: QuestionType;
    difficulty: string | null;
    weight: number;
    image_url?: string | null;
};
type Exam = {
    id: number;
    name: string;
    description: string | null;
    subject: string;
    class: string;
    started_at_label: string;
    duration_minutes: number;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    show_result_immediately: boolean;
    is_published: boolean;
    status: "draft" | "scheduled" | "ongoing" | "finished";
    questions_count: number;
    participants_count: number;
    has_essay: boolean;
    has_pending_essays: boolean;
    questions: ExamQuestion[];
};

const STATUS_LABELS: Record<Exam["status"], string> = {
    draft: "Draft",
    scheduled: "Terjadwal",
    ongoing: "Berlangsung",
    finished: "Selesai",
};

const STATUS_VARIANT: Record<
    Exam["status"],
    "secondary" | "default" | "destructive" | "outline"
> = {
    draft: "secondary",
    scheduled: "default",
    ongoing: "destructive",
    finished: "outline",
};

export default function TeacherExamShow({ exam }: { exam: Exam }) {
    const [deleteOpen, setDeleteOpen] = useState(false);

    const togglePublish = () => {
        const action = exam.is_published
            ? TeacherExamController.unpublish
            : TeacherExamController.publish;
        router.patch(action.url(exam.id), { preserveScroll: true });
    };

    const destroy = () => {
        router.delete(TeacherExamController.destroy.url(exam.id), {
            onSuccess: () => router.visit(examsIndex().url),
        });
    };

    return (
        <>
            <Head title={exam.name} />
            <div className="flex h-full flex-1 flex-col gap-5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Heading
                            title={exam.name}
                            description={`${exam.subject} · ${exam.class}`}
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge variant={STATUS_VARIANT[exam.status]}>
                                {STATUS_LABELS[exam.status]}
                            </Badge>
                            <Badge variant="outline">
                                {exam.questions_count} soal
                            </Badge>
                            <Badge variant="outline">
                                {exam.participants_count} peserta
                            </Badge>
                            {exam.shuffle_questions && (
                                <Badge variant="outline">Acak soal</Badge>
                            )}
                            {exam.shuffle_options && (
                                <Badge variant="outline">Acak jawaban</Badge>
                            )}
                            {exam.show_result_immediately && (
                                <Badge variant="outline">Hasil langsung</Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {exam.questions_count > 0 && (
                            <Button asChild variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                                <Link href={previewStart.url(exam.id)}>
                                    Uji Coba
                                </Link>
                            </Button>
                        )}
                        <Button asChild>
                            <Link href={examResults.url(exam.id)}>Hasil</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={examMonitor.url(exam.id)}>Pantau</Link>
                        </Button>
                        {exam.has_essay && (
                            <Button
                                asChild
                                variant={
                                    exam.has_pending_essays
                                        ? "default"
                                        : "outline"
                                }
                            >
                                <Link href={examGrading.url(exam.id)}>
                                    Nilai Esai
                                    {exam.has_pending_essays && " •"}
                                </Link>
                            </Button>
                        )}
                        <Button asChild variant="outline">
                            <Link
                                href={TeacherExamController.edit.url(exam.id)}
                            >
                                Edit
                            </Link>
                        </Button>
                        <Button
                            variant={exam.is_published ? "outline" : "default"}
                            onClick={togglePublish}
                        >
                            {exam.is_published
                                ? "Tarik ke Draft"
                                : "Publikasikan"}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteOpen(true)}
                        >
                            Hapus
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium">
                                Jadwal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1.5 text-sm">
                            <p>
                                <span className="text-muted-foreground">
                                    Mulai:
                                </span>{" "}
                                {exam.started_at_label}
                            </p>
                            <p>
                                <span className="text-muted-foreground">
                                    Durasi:
                                </span>{" "}
                                {exam.duration_minutes} menit
                            </p>
                            {exam.description && (
                                <p className="text-muted-foreground">
                                    {exam.description}
                                </p>
                            )}
                            {!exam.is_published && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    Ujian masih draft — peserta belum dapat
                                    melihatnya. Publikasikan agar terjadwal.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base font-medium">
                                Daftar Soal ({exam.questions.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {exam.questions.length ? (
                                <div className="divide-y rounded-md border">
                                    {exam.questions.map((question, index) => (
                                        <div
                                            key={question.id}
                                            className="flex items-start gap-3 p-3"
                                        >
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {index + 1}.
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-2 text-sm">
                                                    {question.content}
                                                </p>
                                                {question.image_url && (
                                                    <img
                                                        src={question.image_url}
                                                        alt="Gambar soal"
                                                        className="mt-2 max-h-24 rounded border object-contain"
                                                    />
                                                )}
                                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                    <Badge variant="outline">
                                                        {QUESTION_TYPE_LABELS[
                                                            question.type
                                                        ] ?? question.type}
                                                    </Badge>
                                                    {question.difficulty && (
                                                        <Badge variant="secondary">
                                                            {
                                                                question.difficulty
                                                            }
                                                        </Badge>
                                                    )}
                                                    <span className="text-xs text-muted-foreground">
                                                        Bobot {question.weight}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada soal — edit ujian untuk memilih
                                    soal dari bank.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <DeleteConfirmationDialog
                    open={deleteOpen}
                    onOpenChange={(open) => !open && setDeleteOpen(false)}
                    itemName={exam.name}
                    onConfirm={destroy}
                />
            </div>
        </>
    );
}

TeacherExamShow.layout = {
    breadcrumbs: [
        { title: "Dashboard Guru", href: teacherDashboard() },
        { title: "Ujian", href: examsIndex() },
        { title: "Detail", href: window.location.href },
    ],
};
