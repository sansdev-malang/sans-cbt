import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QUESTION_TYPE_LABELS } from '@/components/admin/question-form-fields';
import { index as studentExamsIndex } from '@/routes/student/exams';

type Detail = {
    question_id: number;
    content: string;
    type: string;
    weight: number;
    image_url?: string | null;
    earned: number;
    max: number;
    is_correct: boolean | null;
    student_answer: Record<string, unknown> | null;
    correct_answer: Record<string, unknown> | null;
};

export default function StudentExamResult({
    session,
    show_score,
    result,
}: {
    session: {
        id: number;
        exam_name: string;
        subject: string;
        submitted_at_label: string;
        status: string;
    };
    show_score: boolean;
    result: {
        score: number | null;
        earned_score: number;
        max_score: number;
        correct_count: number;
        question_count: number;
        has_essay_pending: boolean;
        details: Detail[];
    } | null;
}) {
    return (
        <>
            <Head title="Hasil Ujian" />
            <div className="flex h-full flex-1 flex-col gap-5 p-4">
                <Heading
                    title="Hasil Ujian"
                    description={`${session.exam_name} · ${session.subject}`}
                />

                {result === null ? (
                    <Card>
                        <CardContent className="pt-6 text-sm text-muted-foreground">
                            Sesi ujian masih berjalan — kumpulkan ujian terlebih
                            dahulu untuk melihat hasil.
                        </CardContent>
                    </Card>
                ) : !show_score ? (
                    <Card>
                        <CardContent className="space-y-2 pt-6">
                            <p className="text-sm font-medium">
                                Ujian berhasil dikumpulkan pada{' '}
                                {session.submitted_at_label}.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Nilai akan diumumkan oleh guru/pembina setelah
                                semua peserta selesai. Terima kasih sudah
                                mengerjakan dengan jujur!
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card>
                            <CardContent className="flex flex-wrap items-center gap-6 pt-6">
                                <div className="text-center">
                                    <p className="text-5xl font-bold">
                                        {result.score !== null
                                            ? result.score
                                            : '—'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Nilai (0–100)
                                    </p>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p>
                                        Skor: {result.earned_score} dari{' '}
                                        {result.max_score}
                                    </p>
                                    <p>
                                        Benar: {result.correct_count} dari{' '}
                                        {result.question_count} soal
                                    </p>
                                    {result.has_essay_pending && (
                                        <p className="text-amber-600 dark:text-amber-400">
                                            Soal esai menunggu penilaian guru —
                                            nilai akhir bisa berubah setelah
                                            dinilai.
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Dikumpulkan {session.submitted_at_label}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-5">
                                <h2 className="mb-3 text-base font-semibold">
                                    Rincian Jawaban
                                </h2>
                                <div className="divide-y rounded-md border">
                                    {result.details.map((detail, index) => (
                                        <div
                                            key={detail.question_id}
                                            className="space-y-2 p-3"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm">
                                                        {index + 1}.{' '}
                                                        {detail.content}
                                                    </p>
                                                    {detail.image_url && (
                                                        <img
                                                            src={detail.image_url}
                                                            alt="Gambar soal"
                                                            className="mt-2 max-h-32 rounded border object-contain"
                                                        />
                                                    )}
                                                </div>
                                                {detail.is_correct === null ? (
                                                    <Badge variant="outline">
                                                        Esai
                                                    </Badge>
                                                ) : detail.is_correct ? (
                                                    <Badge className="bg-emerald-600">
                                                        Benar
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        Salah
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {QUESTION_TYPE_LABELS[
                                                    detail.type as keyof typeof QUESTION_TYPE_LABELS
                                                ] ?? detail.type}{' '}
                                                · skor {detail.earned}/
                                                {detail.max}
                                            </p>
                                        </div>
                                    ))}
                                    {result.details.length === 0 && (
                                        <p className="p-3 text-sm text-muted-foreground">
                                            Tidak ada rincian.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href={studentExamsIndex().url}>
                            Kembali ke Daftar Ujian
                        </Link>
                    </Button>
                </div>
            </div>
        </>
    );
}
