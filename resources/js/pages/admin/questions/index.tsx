import { Head } from '@inertiajs/react';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import QuestionBanksPage, {
    type QuestionBanksPageProps,
} from '@/components/admin/question-banks-page';
import { dashboard } from '@/routes/admin';
import { index as questionsIndex } from '@/routes/admin/questions';

export default function Questions(
    props: Omit<QuestionBanksPageProps, 'variant' | 'controller'>,
) {
    return (
        <>
            <Head title="Bank Soal" />
            <QuestionBanksPage
                variant="admin"
                controller={QuestionController}
                {...props}
            />
        </>
    );
}

Questions.layout = {
    breadcrumbs: [
        { title: 'Dashboard Admin', href: dashboard() },
        { title: 'Bank Soal', href: questionsIndex() },
    ],
};
