import { Form } from "@inertiajs/react";
import type { RouteFormDefinition } from "@/wayfinder";
import { useState } from "react";
import Heading from "@/components/heading";
import InputError from "@/components/input-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    QUESTION_TYPE_LABELS,
    type QuestionType,
} from "@/components/admin/question-form-fields";

export type Option = { value: number; label: string };
type BankQuestion = {
    id: number;
    content: string;
    type: QuestionType;
    difficulty: string | null;
    weight: number;
};
export type BankOption = {
    id: number;
    name: string;
    subject_id: number;
    subject: string;
    material: string | null;
    questions: BankQuestion[];
};
type ExamValues = {
    name: string;
    description: string | null;
    subject_id: number | null;
    school_class_id: number | null;
    started_at: string;
    duration_minutes: number;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    show_result_immediately: boolean;
    question_ids: number[];
};

/**
 * Shared create/edit form for teacher exams, including picking questions
 * from the teacher's own banks by subject. `bare` renders only the form so it
 * can live inside a dialog; otherwise a heading and card are drawn around it.
 */
export function ExamForm({
    action,
    headingTitle,
    headingDescription,
    exam,
    subjects,
    classes,
    banks,
    backHref,
    bare = false,
    onCancel,
}: {
    action: RouteFormDefinition<"post" | "put" | "patch">;
    headingTitle: string;
    headingDescription: string;
    exam: ExamValues | null;
    subjects: Option[];
    classes: Option[];
    banks: BankOption[];
    backHref?: string;
    bare?: boolean;
    onCancel?: () => void;
}) {
    const [subjectId, setSubjectId] = useState(
        exam?.subject_id ? String(exam.subject_id) : "",
    );
    const [selected, setSelected] = useState<Set<number>>(
        () => new Set(exam?.question_ids ?? []),
    );
    const visibleBanks = banks.filter(
        (bank) => subjectId !== "" && bank.subject_id === Number(subjectId),
    );

    const toggleQuestion = (id: number) => {
        setSelected((current) => {
            const next = new Set(current);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleBank = (bank: BankOption) => {
        const ids = bank.questions.map((question) => question.id);
        const allSelected = ids.every((id) => selected.has(id));
        setSelected((current) => {
            const next = new Set(current);
            ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
            return next;
        });
    };

    const form = (
        <Form
            {...action}
            options={{ preserveScroll: true }}
            className="space-y-5"
        >
            {({ processing, errors }) => (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama ujian</Label>
                        <Input
                            id="name"
                            name="name"
                            required
                            defaultValue={exam?.name ?? ""}
                            placeholder="cth: PAS Ganjil Matematika"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="subject_id">Mata pelajaran</Label>
                            <select
                                id="subject_id"
                                name="subject_id"
                                required
                                value={subjectId}
                                onChange={(event) => {
                                    setSubjectId(event.target.value);
                                    setSelected(new Set());
                                }}
                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                            >
                                <option value="">-</option>
                                {subjects.map((subject) => (
                                    <option
                                        key={subject.value}
                                        value={subject.value}
                                    >
                                        {subject.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.subject_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="school_class_id">
                                Kelas peserta
                            </Label>
                            <select
                                id="school_class_id"
                                name="school_class_id"
                                required
                                defaultValue={exam?.school_class_id ?? ""}
                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                            >
                                <option value="">-</option>
                                {classes.map((klass) => (
                                    <option
                                        key={klass.value}
                                        value={klass.value}
                                    >
                                        {klass.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.school_class_id} />
                            <p className="text-xs text-muted-foreground">
                                Seluruh siswa di kelas ini menjadi peserta
                                ujian.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="started_at">
                                Tanggal &amp; jam mulai
                            </Label>
                            <Input
                                id="started_at"
                                name="started_at"
                                type="datetime-local"
                                required
                                defaultValue={exam?.started_at ?? ""}
                            />
                            <InputError message={errors.started_at} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="duration_minutes">
                                Durasi (menit)
                            </Label>
                            <Input
                                id="duration_minutes"
                                name="duration_minutes"
                                type="number"
                                min="5"
                                max="300"
                                required
                                defaultValue={exam?.duration_minutes ?? 60}
                            />
                            <InputError message={errors.duration_minutes} />
                            <p className="text-xs text-muted-foreground">
                                Timer ujian dihitung dari waktu server saat
                                siswa memulai.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">
                            Deskripsi (opsional)
                        </Label>
                        <textarea
                            id="description"
                            name="description"
                            rows={2}
                            defaultValue={exam?.description ?? ""}
                            placeholder="Keterangan singkat untuk peserta"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-2">
                        <Label>Pengaturan ujian</Label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="hidden"
                                name="shuffle_questions"
                                value="0"
                            />
                            <input
                                type="checkbox"
                                name="shuffle_questions"
                                value="1"
                                defaultChecked={
                                    exam?.shuffle_questions ?? false
                                }
                                className="size-4 accent-primary"
                            />
                            Acak urutan soal untuk tiap siswa
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="hidden"
                                name="shuffle_options"
                                value="0"
                            />
                            <input
                                type="checkbox"
                                name="shuffle_options"
                                value="1"
                                defaultChecked={exam?.shuffle_options ?? false}
                                className="size-4 accent-primary"
                            />
                            Acak urutan pilihan jawaban
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="hidden"
                                name="show_result_immediately"
                                value="0"
                            />
                            <input
                                type="checkbox"
                                name="show_result_immediately"
                                value="1"
                                defaultChecked={
                                    exam?.show_result_immediately ?? false
                                }
                                className="size-4 accent-primary"
                            />
                            Tampilkan nilai langsung setelah submit
                        </label>
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Label>Pilih soal dari bank</Label>
                            <Badge
                                variant={
                                    selected.size > 0 ? "default" : "secondary"
                                }
                            >
                                {selected.size} soal dipilih
                            </Badge>
                        </div>
                        <input type="hidden" name="question_ids" value="" />
                        {[...selected].map((id) => (
                            <input
                                key={id}
                                type="hidden"
                                name="question_ids[]"
                                value={id}
                            />
                        ))}

                        {subjectId === "" ? (
                            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                                Pilih mata pelajaran terlebih dahulu untuk
                                melihat bank soal Anda.
                            </p>
                        ) : visibleBanks.length === 0 ? (
                            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                                Belum ada bank soal untuk mata pelajaran ini.
                            </p>
                        ) : (
                            visibleBanks.map((bank) => (
                                <div
                                    key={bank.id}
                                    className="rounded-md border"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 p-3">
                                        <div>
                                            <p className="text-sm font-medium">
                                                {bank.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {bank.subject}
                                                {bank.material
                                                    ? ` · ${bank.material}`
                                                    : ""}{" "}
                                                · {bank.questions.length} soal
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggleBank(bank)}
                                        >
                                            {bank.questions.every((question) =>
                                                selected.has(question.id),
                                            )
                                                ? "Hapus Semua"
                                                : "Pakai Semua"}
                                        </Button>
                                    </div>
                                    <div className="divide-y">
                                        {bank.questions.map((question) => (
                                            <label
                                                key={question.id}
                                                className="flex cursor-pointer items-start gap-3 p-3 text-sm hover:bg-muted/40"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(
                                                        question.id,
                                                    )}
                                                    onChange={() =>
                                                        toggleQuestion(
                                                            question.id,
                                                        )
                                                    }
                                                    className="mt-0.5 size-4 accent-primary"
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="line-clamp-2">
                                                        {question.content}
                                                    </span>
                                                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
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
                                                            Bobot{" "}
                                                            {question.weight}
                                                        </span>
                                                    </span>
                                                </span>
                                            </label>
                                        ))}
                                        {bank.questions.length === 0 && (
                                            <p className="p-3 text-sm text-muted-foreground">
                                                Bank ini masih kosong.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        <InputError
                            message={
                                errors.question_ids ?? errors["question_ids.0"]
                            }
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button disabled={processing}>Simpan Ujian</Button>
                        {onCancel ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                Batal
                            </Button>
                        ) : (
                            <Button type="button" variant="outline" asChild>
                                <a href={backHref}>Batal</a>
                            </Button>
                        )}
                    </div>
                </>
            )}
        </Form>
    );

    if (bare) {
        return form;
    }

    return (
        <>
            <Heading title={headingTitle} description={headingDescription} />
            <Card className="max-w-3xl">
                <CardContent className="pt-6">{form}</CardContent>
            </Card>
        </>
    );
}
