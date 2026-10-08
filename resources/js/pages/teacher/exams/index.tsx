import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import TeacherExamController from '@/actions/App/Http/Controllers/Teacher/ExamController';
import { DeleteConfirmationDialog } from '@/components/admin/delete-confirmation-dialog';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { dashboard as teacherDashboard } from '@/routes/teacher';
import {
    index as examsIndex,
    publish as examPublish,
    show as examShow,
    unpublish as examUnpublish,
} from '@/routes/teacher/exams';
import { ExamForm, type BankOption, type Option } from './form';

type Exam = {
    id: number;
    name: string;
    subject: string;
    class: string;
    started_at_label: string;
    duration_minutes: number;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    show_result_immediately: boolean;
    is_published: boolean;
    status: 'draft' | 'scheduled' | 'ongoing' | 'finished';
    questions_count: number;
};

const STATUS_LABELS: Record<Exam['status'], string> = {
    draft: 'Draft',
    scheduled: 'Terjadwal',
    ongoing: 'Berlangsung',
    finished: 'Selesai',
};

const STATUS_VARIANT: Record<
    Exam['status'],
    'secondary' | 'default' | 'destructive' | 'outline'
> = {
    draft: 'secondary',
    scheduled: 'default',
    ongoing: 'destructive',
    finished: 'outline',
};

export default function TeacherExams({
    exams,
    subjects,
    classes,
    banks,
}: {
    exams: Exam[];
    subjects: Option[];
    classes: Option[];
    banks: BankOption[];
}) {
    const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    const destroy = () => {
        if (!examToDelete) return;
        router.delete(TeacherExamController.destroy.url(examToDelete.id), {
            preserveScroll: true,
            onSuccess: () => setExamToDelete(null),
        });
    };

    const togglePublish = (exam: Exam) => {
        const action = exam.is_published
            ? TeacherExamController.unpublish
            : TeacherExamController.publish;
        router.patch(action.url(exam.id), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Ujian" />
            <div className="flex h-full flex-1 flex-col gap-5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Heading
                        title="Ujian"
                        description="Buat ujian dari bank soal, atur jadwal, dan publikasikan untuk peserta."
                    />
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus />
                        Buat Ujian
                    </Button>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    {exams.map((exam) => (
                        <Card key={exam.id}>
                            <CardContent className="space-y-4 pt-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="font-semibold">
                                            {exam.name}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {exam.subject} · {exam.class}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {exam.started_at_label} ·{' '}
                                            {exam.duration_minutes} menit
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <Badge
                                            variant={
                                                STATUS_VARIANT[exam.status]
                                            }
                                        >
                                            {STATUS_LABELS[exam.status]}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {exam.questions_count} soal
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                    {exam.shuffle_questions && (
                                        <Badge variant="outline">
                                            Acak soal
                                        </Badge>
                                    )}
                                    {exam.shuffle_options && (
                                        <Badge variant="outline">
                                            Acak jawaban
                                        </Badge>
                                    )}
                                    {exam.show_result_immediately && (
                                        <Badge variant="outline">
                                            Hasil langsung
                                        </Badge>
                                    )}
                                    {!exam.is_published && (
                                        <Badge variant="secondary">
                                            Belum dipublikasi
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button asChild size="sm">
                                        <Link href={examShow.url(exam.id)}>
                                            Detail
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" variant="outline">
                                        <Link
                                            href={TeacherExamController.edit.url(
                                                exam.id,
                                            )}
                                        >
                                            Edit
                                        </Link>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={
                                            exam.is_published
                                                ? 'outline'
                                                : 'default'
                                        }
                                        onClick={() => togglePublish(exam)}
                                    >
                                        {exam.is_published
                                            ? 'Tarik ke Draft'
                                            : 'Publikasikan'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => setExamToDelete(exam)}
                                    >
                                        Hapus
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {exams.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Belum ada ujian. Klik “Buat Ujian” untuk mulai
                            menyusun ujian pertama Anda.
                        </p>
                    )}
                </div>

                {createOpen && (
                    <Dialog open onOpenChange={setCreateOpen}>
                        <DialogContent className="flex h-[min(90dvh,56rem)] max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
                            <DialogHeader className="shrink-0 border-b px-6 py-5 pr-12">
                                <DialogTitle>Buat Ujian</DialogTitle>
                                <DialogDescription>
                                    Pilih soal dari bank soal Anda, tentukan
                                    kelas peserta, jadwal, dan pengaturan acak.
                                </DialogDescription>
                            </DialogHeader>
                            <ExamForm
                                bare
                                action={TeacherExamController.store.form()}
                                headingTitle="Buat Ujian"
                                headingDescription=""
                                exam={null}
                                subjects={subjects}
                                classes={classes}
                                banks={banks}
                                onCancel={() => setCreateOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                )}

                <DeleteConfirmationDialog
                    open={examToDelete !== null}
                    onOpenChange={(open) => !open && setExamToDelete(null)}
                    itemName={
                        examToDelete
                            ? `${examToDelete.name} (${examToDelete.class})`
                            : null
                    }
                    onConfirm={destroy}
                />
            </div>
        </>
    );
}

TeacherExams.layout = {
    breadcrumbs: [
        { title: 'Dashboard Guru', href: teacherDashboard() },
        { title: 'Ujian', href: examsIndex() },
    ],
};
