import { useForm } from "@inertiajs/react";
import { Download, Upload } from "lucide-react";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function QuestionBankImportDialog({
    open,
    onOpenChange,
    importUrl,
    templateUrl,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    importUrl: string;
    templateUrl: string;
}) {
    const form = useForm<{ file: File | null }>({ file: null });

    const close = (nextOpen: boolean) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
            form.reset();
            form.clearErrors();
        }
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Upload Soal</DialogTitle>
                    <DialogDescription>
                        Impor soal ke bank ini menggunakan file CSV. Soal baru
                        akan ditambahkan tanpa menghapus soal yang sudah ada.
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(importUrl, {
                            forceFormData: true,
                            onSuccess: () => close(false),
                        });
                    }}
                    className="grid gap-4"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="question-bank-csv">File CSV</Label>
                        <Input
                            id="question-bank-csv"
                            type="file"
                            accept=".csv,text/csv"
                            required
                            onChange={(event) =>
                                form.setData("file", event.target.files?.[0] ?? null)
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Maksimal 10 MB dan 500 soal per upload. Format kolom
                            harus mengikuti template. Pilihan ganda memakai
                            jawaban A–E; pasangan ditulis kiri=kanan dan
                            dipisahkan titik koma.
                        </p>
                        <InputError message={form.errors.file} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <a
                            href={templateUrl}
                            download
                            className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                        >
                            <Download className="size-4" />
                            Unduh template CSV
                        </a>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => close(false)}
                            >
                                Batal
                            </Button>
                            <Button disabled={form.processing || !form.data.file}>
                                <Upload />
                                {form.processing ? "Mengimpor..." : "Impor Soal"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
