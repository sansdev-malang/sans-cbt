import { Head } from '@inertiajs/react';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import QuestionBankDetailPage, {
    type QuestionBankDetailPageProps,
} from '@/components/admin/question-bank-detail-page';
import { dashboard } from '@/routes/admin';
import { index as questionsIndex } from '@/routes/admin/questions';

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
                variant="admin"
                controller={QuestionController}
                indexUrl={questionsIndex().url}
                {...props}
            />
        </>
    );
}

Bank.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Bank Soal', href: questionsIndex() },
        { title: 'Detail Bank' },
    ],
};
