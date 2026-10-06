import { Head } from "@inertiajs/react";
import TeacherExamController from "@/actions/App/Http/Controllers/Teacher/ExamController";
import { ExamForm, type Option, type BankOption } from "./form";
import { dashboard as teacherDashboard } from "@/routes/teacher";
import { index as examsIndex } from "@/routes/teacher/exams";

export type ExamValues = {
    id: number;
    name: string;
    description: string | null;
    subject_id: number;
    school_class_id: number;
    started_at: string;
    duration_minutes: number;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    show_result_immediately: boolean;
    question_ids: number[];
};

export default function TeacherExamEdit({
    exam,
    subjects,
    classes,
    banks,
}: {
    exam: ExamValues;
    subjects: Option[];
    classes: Option[];
    banks: BankOption[];
}) {
    return (
        <>
            <Head title="Edit Ujian" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <ExamForm
                    action={TeacherExamController.update.form(exam.id)}
                    headingTitle="Edit Ujian"
                    headingDescription="Perbarui data, soal, atau jadwal ujian."
                    exam={exam}
                    subjects={subjects}
                    classes={classes}
                    banks={banks}
                    backHref={examsIndex().url}
                />
            </div>
        </>
    );
}

TeacherExamEdit.layout = {
    breadcrumbs: [
        { title: "Dashboard Guru", href: teacherDashboard() },
        { title: "Ujian", href: examsIndex() },
        { title: "Edit", href: window.location.href },
    ],
};
