import { Form } from '@inertiajs/react';
import SubjectController from '@/actions/App/Http/Controllers/Admin/SubjectController';
import InputError from '@/components/input-error';
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

type Subject = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
};

export function SubjectFormDialog({
    open,
    onOpenChange,
    subject,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subject: Subject | null;
}) {
    const isEditing = subject !== null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing
                            ? 'Ubah Mata Pelajaran'
                            : 'Tambah Mata Pelajaran'}
                    </DialogTitle>
                    <DialogDescription>
                        Isi data mata pelajaran untuk bank soal dan ujian.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...(isEditing
                        ? SubjectController.update.form(subject.id)
                        : SubjectController.store.form())}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="subject-code">Kode</Label>
                                <Input
                                    id="subject-code"
                                    name="code"
                                    required
                                    maxLength={20}
                                    defaultValue={subject?.code ?? ''}
                                />
                                <InputError message={errors.code} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="subject-name">Nama</Label>
                                <Input
                                    id="subject-name"
                                    name="name"
                                    required
                                    maxLength={255}
                                    defaultValue={subject?.name ?? ''}
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="subject-description">
                                    Deskripsi
                                </Label>
                                <textarea
                                    id="subject-description"
                                    name="description"
                                    rows={3}
                                    defaultValue={subject?.description ?? ''}
                                    className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                                />
                                <InputError message={errors.description} />
                            </div>
                            <label
                                htmlFor="subject-active"
                                className="flex cursor-pointer items-center gap-2 text-sm"
                            >
                                <input
                                    type="hidden"
                                    name="is_active"
                                    value="0"
                                />
                                <input
                                    id="subject-active"
                                    name="is_active"
                                    type="checkbox"
                                    value="1"
                                    defaultChecked={subject?.is_active ?? true}
                                    className="size-4 accent-primary"
                                />
                                Aktif
                            </label>
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Batal
                                </Button>
                                <Button disabled={processing}>
                                    {isEditing ? 'Simpan Perubahan' : 'Simpan'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
