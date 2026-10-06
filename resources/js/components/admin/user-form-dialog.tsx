import { Form } from '@inertiajs/react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
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

type User = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    role_label: string;
};
type Role = { value: string; label: string };

export function UserFormDialog({
    open,
    onOpenChange,
    user,
    roles,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    roles: Role[];
}) {
    const isEditing = user !== null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Ubah Pengguna' : 'Tambah Pengguna'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Kosongkan kata sandi bila tidak ingin mengubahnya.'
                            : 'Buat akun dan pilih peran pengguna.'}
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...(isEditing
                        ? UserController.update.form(user.id)
                        : UserController.store.form())}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field
                                id="user-name"
                                label="Nama"
                                name="name"
                                required
                                defaultValue={user?.name ?? ''}
                                error={errors.name}
                            />
                            <Field
                                id="user-email"
                                label="Email"
                                name="email"
                                type="email"
                                required
                                defaultValue={user?.email ?? ''}
                                error={errors.email}
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="user-role">Peran</Label>
                                <select
                                    id="user-role"
                                    name="role"
                                    required
                                    defaultValue={user?.role ?? ''}
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                >
                                    <option value="" disabled>
                                        Pilih peran
                                    </option>
                                    {roles.map((role) => (
                                        <option
                                            key={role.value}
                                            value={role.value}
                                        >
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.role} />
                            </div>
                            <Field
                                id="user-password"
                                label={
                                    isEditing ? 'Kata sandi baru' : 'Kata sandi'
                                }
                                name="password"
                                type="password"
                                required={!isEditing}
                                defaultValue=""
                                error={errors.password}
                            />
                            <Field
                                id="user-password-confirmation"
                                label="Konfirmasi kata sandi"
                                name="password_confirmation"
                                type="password"
                                required={!isEditing}
                                defaultValue=""
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
    type = 'text',
    required = false,
    defaultValue,
    error,
}: {
    id: string;
    label: string;
    name: string;
    type?: string;
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
                type={type}
                required={required}
                defaultValue={defaultValue}
            />
            <InputError message={error} />
        </div>
    );
}
