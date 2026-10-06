import { Head } from '@inertiajs/react';
import TeacherQuestionController from '@/actions/App/Http/Controllers/Teacher/QuestionController';
import QuestionBanksPage, {
    type QuestionBanksPageProps,
} from '@/components/admin/question-banks-page';
import { dashboard as teacherDashboard } from '@/routes/teacher';
import { index as questionsIndex } from '@/routes/teacher/questions';

export default function TeacherQuestions(
    props: Omit<QuestionBanksPageProps, 'variant' | 'controller'>,
) {
    return (
        <>
            <Head title="Bank Soal" />
            <QuestionBanksPage
                variant="teacher"
                controller={TeacherQuestionController}
                {...props}
            />
        </>
    );
}

TeacherQuestions.layout = {
    breadcrumbs: [
        { title: 'Dashboard Guru', href: teacherDashboard() },
        { title: 'Bank Soal', href: questionsIndex() },
    ],
};
