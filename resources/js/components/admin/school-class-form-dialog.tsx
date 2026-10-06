import { Form } from '@inertiajs/react';
import SchoolClassController from '@/actions/App/Http/Controllers/Admin/SchoolClassController';
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

type SchoolClass = {
    id: number;
    name: string;
    level: string | null;
    academic_year: string;
    homeroom_teacher_id?: number | null;
};
type Teacher = { value: number; label: string };

export function SchoolClassFormDialog({
    open,
    onOpenChange,
    schoolClass,
    teachers,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    schoolClass: SchoolClass | null;
    teachers: Teacher[];
}) {
    const isEditing = schoolClass !== null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Ubah Kelas' : 'Tambah Kelas'}
                    </DialogTitle>
                    <DialogDescription>
                        Isi nama, tahun ajaran, dan wali kelas.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...(isEditing
                        ? SchoolClassController.update.form(schoolClass.id)
                        : SchoolClassController.store.form())}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field
                                id="class-name"
                                label="Nama"
                                name="name"
                                required
                                defaultValue={schoolClass?.name ?? ''}
                                error={errors.name}
                            />
                            <Field
                                id="class-level"
                                label="Tingkat"
                                name="level"
                                defaultValue={schoolClass?.level ?? ''}
                                error={errors.level}
                            />
                            <Field
                                id="class-academic-year"
                                label="Tahun Ajaran"
                                name="academic_year"
                                required
                                defaultValue={schoolClass?.academic_year ?? ''}
                                error={errors.academic_year}
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="class-teacher">
                                    Wali Kelas
                                </Label>
                                <select
                                    id="class-teacher"
                                    name="homeroom_teacher_id"
                                    defaultValue={
                                        schoolClass?.homeroom_teacher_id ?? ''
                                    }
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                >
                                    <option value="">Tanpa wali kelas</option>
                                    {teachers.map((teacher) => (
                                        <option
                                            key={teacher.value}
                                            value={teacher.value}
                                        >
                                            {teacher.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.homeroom_teacher_id}
                                />
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
                maxLength={name === 'academic_year' ? 20 : 50}
                defaultValue={defaultValue}
            />
            <InputError message={error} />
        </div>
    );
}
