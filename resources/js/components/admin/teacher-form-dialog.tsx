import { Form } from '@inertiajs/react';
import TeacherController from '@/actions/App/Http/Controllers/Admin/TeacherController';
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

type Teacher = {
    id: number;
    user_id: number | null;
    nip: string | null;
    full_name: string;
    phone: string | null;
};
type User = { value: number; label: string };

export function TeacherFormDialog({
    open,
    onOpenChange,
    teacher,
    users,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teacher: Teacher | null;
    users: User[];
}) {
    const isEditing = teacher !== null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Ubah Guru' : 'Tambah Guru'}
                    </DialogTitle>
                    <DialogDescription>
                        Hubungkan akun Guru bila akun login sudah dibuat.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...(isEditing
                        ? TeacherController.update.form(teacher.id)
                        : TeacherController.store.form())}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field
                                id="teacher-name"
                                label="Nama lengkap"
                                name="full_name"
                                required
                                defaultValue={teacher?.full_name ?? ''}
                                error={errors.full_name}
                            />
                            <Field
                                id="teacher-nip"
                                label="NIP"
                                name="nip"
                                defaultValue={teacher?.nip ?? ''}
                                error={errors.nip}
                            />
                            <Field
                                id="teacher-phone"
                                label="Nomor telepon"
                                name="phone"
                                defaultValue={teacher?.phone ?? ''}
                                error={errors.phone}
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="teacher-user">Akun Guru</Label>
                                <select
                                    id="teacher-user"
                                    name="user_id"
                                    defaultValue={teacher?.user_id ?? ''}
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                >
                                    <option value="">Belum dihubungkan</option>
                                    {users.map((user) => (
                                        <option
                                            key={user.value}
                                            value={user.value}
                                        >
                                            {user.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.user_id} />
                            </div>
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

function Field({
    id,
    label,
    name,
    required = false,
    defaultValue,
    error,
}: {
    id: string;
    label: string;
    name: string;
    required?: boolean;
    defaultValue: string;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                name={name}
                required={required}
                maxLength={50}
                defaultValue={defaultValue}
            />
            <InputError message={error} />
        </div>
    );
}
