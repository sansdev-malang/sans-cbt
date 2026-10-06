import { Head } from '@inertiajs/react';
import TeacherQuestionController from '@/actions/App/Http/Controllers/Teacher/QuestionController';
import QuestionBankDetailPage, {
    type QuestionBankDetailPageProps,
} from '@/components/admin/question-bank-detail-page';
import { dashboard as teacherDashboard } from '@/routes/teacher';
import { index as questionsIndex } from '@/routes/teacher/questions';

export default function Bank(
    props: Omit<
        QuestionBankDetailPageProps,
        'variant' | 'controller' | 'indexUrl'
    >,
) {
    return (
        <>
            <Head title={`${props.bank.name} — Bank Soal`} />
            <QuestionBankDetailPage
                variant="teacher"
                controller={TeacherQuestionController}
                indexUrl={questionsIndex().url}
                {...props}
            />
        </>
    );
}

Bank.layout = {
    breadcrumbs: [
        { title: 'Dashboard Guru', href: teacherDashboard() },
        { title: 'Bank Soal', href: questionsIndex() },
        { title: 'Detail Bank' },
    ],
};
