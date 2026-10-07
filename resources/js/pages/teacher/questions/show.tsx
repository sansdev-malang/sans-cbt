import { Form, Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import TeacherQuestionController from "@/actions/App/Http/Controllers/Teacher/QuestionController";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";
import QuestionFormFields, {
    QUESTION_TYPE_LABELS,
} from "@/components/admin/question-form-fields";
import Heading from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dashboard as teacherDashboard } from "@/routes/teacher";
import { index as questionsIndex } from "@/routes/teacher/questions";

type QuestionType = "multiple_choice" | "true_false" | "essay";
type Option = {
    id: number;
    label: string;
    content: string;
    is_correct: boolean;
    image_path: string | null;
    image_url: string | null;
};
type Question = {
    id: number;
    question_bank_id: number;
    question_bank: { id: number; name: string };
    content: string;
    stimulus?: string | null;
    type: QuestionType;
    difficulty: string | null;
    weight: number;
    image_path: string | null;
    image_url: string | null;
    options: Option[];
};

export default function TeacherQuestionShow({
    question,
}: {
    question: Question;
}) {
    const [deleteOpen, setDeleteOpen] = useState(false);

    const destroy = () => {
        router.delete(TeacherQuestionController.destroy.url(question.id), {
            onSuccess: () => router.visit(questionsIndex().url),
        });
    };

    return (
        <>
            <Head title="Edit Soal" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Edit Soal"
                        description={`Bank: ${question.question_bank.name}`}
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline">
                            {QUESTION_TYPE_LABELS[question.type] ??
                                question.type}
                        </Badge>
                        {question.difficulty && (
                            <Badge variant="secondary">
                                {question.difficulty}
                            </Badge>
                        )}
                        <Badge variant="secondary">
                            Bobot {question.weight}
                        </Badge>
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <Form
                            {...TeacherQuestionController.update.form(
                                question.id,
                            )}
                            options={{ preserveScroll: true }}
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <QuestionFormFields
                                        question={question}
                                        errors={errors}
                                        idPrefix="edit"
                                        paletteStickyClass="top-16"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <Button disabled={processing}>
                                            Simpan Perubahan
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link href={questionsIndex().url}>
                                                Kembali
                                            </Link>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => setDeleteOpen(true)}
                                        >
                                            Hapus Soal
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                <DeleteConfirmationDialog
                    open={deleteOpen}
                    onOpenChange={(open) => !open && setDeleteOpen(false)}
                    itemName={
                        question.content.length > 80
                            ? `${question.content.slice(0, 80)}...`
                            : question.content
                    }
                    onConfirm={destroy}
                />
            </div>
        </>
    );
}

TeacherQuestionShow.layout = {
    breadcrumbs: [
        { title: "Dashboard Guru", href: teacherDashboard() },
        { title: "Bank Soal", href: questionsIndex() },
        { title: "Edit Soal", href: window.location.href },
    ],
};
