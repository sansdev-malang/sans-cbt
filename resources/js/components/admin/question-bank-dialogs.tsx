import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
import QuestionFormFields from '@/components/admin/question-form-fields';
import {
    type BankOption,
    type QuestionBank,
    type QuestionBankControllerApi,
} from '@/components/admin/question-bank-types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Create/edit dialog for a question bank itself. */
export function BankDialog({
    open,
    onOpenChange,
    bank,
    controller,
    isAdmin,
    subjects,
    classes,
    teachers,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bank: QuestionBank | null;
    controller: QuestionBankControllerApi;
    isAdmin: boolean;
    subjects: BankOption[];
    classes: BankOption[];
    teachers: BankOption[];
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {bank ? 'Edit Bank Soal' : 'Buat Bank Soal'}
                    </DialogTitle>
                    <DialogDescription>
                        Bank soal mengelompokkan soal berdasarkan mata
                        pelajaran, kelas, dan materi agar mudah ditemukan saat
                        menyusun ujian.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...(bank
                        ? controller.updateBank.form(bank.id)
                        : controller.storeBank.form())}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field
                                name="name"
                                label="Nama bank"
                                required
                                placeholder="cth: Penilaian Harian — Bab 3"
                                defaultValue={bank?.name}
                                error={errors.name}
                            />
                            <SelectField
                                name="subject_id"
                                label="Mata pelajaran"
                                options={subjects}
                                required
                                defaultValue={bank?.subject_id}
                                error={errors.subject_id}
                            />
                            <SelectField
                                name="school_class_id"
                                label="Kelas (opsional)"
                                options={classes}
                                defaultValue={
                                    bank?.school_class_id ?? undefined
                                }
                                error={errors.school_class_id}
                                hint="Kosongkan jika bank berlaku untuk semua kelas."
                            />
                            {isAdmin && (
                                <SelectField
                                    name="teacher_id"
                                    label="Guru (opsional)"
                                    options={teachers}
                                    defaultValue={bank?.teacher_id ?? undefined}
                                    error={errors.teacher_id}
                                    hint="Kosongkan jika bank tidak dimiliki guru tertentu."
                                />
                            )}
                            <Field
                                name="material"
                                label="Materi (opsional)"
                                placeholder="cth: Sistem Persamaan Linear Dua Variabel"
                                defaultValue={bank?.material ?? ''}
                                error={errors.material}
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Batal
                                </Button>
                                <Button disabled={processing}>
                                    {bank ? 'Simpan Perubahan' : 'Simpan Bank'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

/** Add-question dialog scoped to one bank. */
export function AddQuestionDialog({
    onOpenChange,
    bank,
    controller,
}: {
    onOpenChange: (open: boolean) => void;
    bank: QuestionBank;
    controller: QuestionBankControllerApi;
}) {
    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Tambah Soal — {bank.name}</DialogTitle>
                    <DialogDescription>
                        Lengkapi detail soal di bawah. Soal tersimpan ke bank
                        ini dan bisa langsung dipakai saat menyusun ujian.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...controller.store.form()}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="question_bank_id"
                                value={bank.id}
                            />
                            <QuestionFormFields
                                errors={errors}
                                idPrefix="create"
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Batal
                                </Button>
                                <Button disabled={processing}>
                                    Simpan Soal
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    name,
    label,
    required = false,
    placeholder,
    defaultValue = '',
    error,
    hint,
}: {
    name: string;
    label: string;
    required?: boolean;
    placeholder?: string;
    defaultValue?: string;
    error?: string;
    hint?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <Input
                id={name}
                name={name}
                required={required}
                placeholder={placeholder}
                defaultValue={defaultValue}
            />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            <InputError message={error} />
        </div>
    );
}

function SelectField({
    name,
    label,
    options,
    required = false,
    defaultValue,
    error,
    hint,
}: {
    name: string;
    label: string;
    options: BankOption[];
    required?: boolean;
    defaultValue?: number;
    error?: string;
    hint?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <select
                id={name}
                name={name}
                required={required}
                defaultValue={defaultValue ?? ''}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
                <option value="">-</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            <InputError message={error} />
        </div>
    );
}
