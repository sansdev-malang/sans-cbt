import { useRef, useState } from "react";
import { ImagePlus, RotateCcw, Trash2, X } from "lucide-react";
import InputError from "@/components/input-error";

const ACCEPT = "image/png,image/jpeg,image/webp";

/**
 * Field upload gambar yang jelas terlihat: zona tombol bergaris saat kosong,
 * pratinjau + tombol Ganti/Hapus saat terisi. Nama input mengikuti kontrak
 * form yang sudah ada (fileField / pathField / removeField).
 */
export default function ImageUploadField({
    fileField,
    pathField,
    removeField,
    existingPath,
    existingUrl,
    error,
    label = "Tambahkan gambar",
    compact = false,
}: {
    fileField: string;
    pathField?: string;
    removeField?: string;
    existingPath: string | null;
    existingUrl: string | null;
    error?: string;
    label?: string;
    compact?: boolean;
}) {
    const [preview, setPreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [removed, setRemoved] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const showsExisting =
        existingPath !== null && existingUrl !== null && !removed && !preview;
    const showsNew = preview !== null;
    const hasImage = showsExisting || showsNew;

    const pick = () => inputRef.current?.click();

    const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        if (preview) URL.revokeObjectURL(preview);
        setPreview(file ? URL.createObjectURL(file) : null);
        setFileName(file?.name ?? null);
        setRemoved(false);
    };

    const undoPick = () => {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        setFileName(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const markRemoved = () => {
        setPreview(null);
        setFileName(null);
        if (inputRef.current) inputRef.current.value = "";
        setRemoved(true);
    };

    const keep = () => setRemoved(false);

    return (
        <div className="w-full">
            {/* Input file asli — tetap terkirim ke server, hanya disembunyikan dari tampilan */}
            <input
                ref={inputRef}
                id={fileField}
                type="file"
                name={fileField}
                accept={ACCEPT}
                className="hidden"
                onChange={onPick}
            />

            {hasImage ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2.5">
                    <img
                        src={(showsNew ? preview : existingUrl) ?? undefined}
                        alt="Pratinjau gambar"
                        className={
                            compact
                                ? "size-12 rounded-md border object-cover"
                                : "h-20 max-w-32 rounded-md border object-contain"
                        }
                    />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                            {showsNew
                                ? (fileName ?? "Gambar baru")
                                : "Gambar tersimpan"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {compact ? "Gambar pilihan jawaban" : "Gambar soal"}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={pick}
                                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
                            >
                                <ImagePlus className="size-3.5" />
                                Ganti
                            </button>
                            {showsNew && (
                                <button
                                    type="button"
                                    onClick={undoPick}
                                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
                                >
                                    <RotateCcw className="size-3.5" />
                                    Batalkan
                                </button>
                            )}
                            {showsExisting && removeField && (
                                <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10">
                                    <Trash2 className="size-3.5" />
                                    Hapus
                                    <input
                                        type="checkbox"
                                        name={removeField}
                                        value="1"
                                        checked={removed}
                                        onChange={(event) =>
                                            event.target.checked
                                                ? markRemoved()
                                                : keep()
                                        }
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={removed ? keep : pick}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 text-sm transition-colors hover:border-primary/60 hover:bg-primary/5 ${compact ? "py-2" : "py-4"} ${removed ? "border-destructive/60 text-destructive" : "border-border text-muted-foreground"}`}
                >
                    <ImagePlus className="size-4 shrink-0" />
                    <span className="font-medium">
                        {removed
                            ? "Gambar dihapus saat disimpan — klik untuk memilih ulang"
                            : label}
                    </span>
                    <span className="hidden text-xs sm:inline">
                        PNG/JPG/WebP · maks 2 MB
                    </span>
                </button>
            )}

            {/* Path gambar lama tetap dikirim agar server tahu file mana yang dipertahankan/diganti */}
            {existingPath && !removed && (
                <input
                    type="hidden"
                    name={pathField ?? ""}
                    value={existingPath}
                />
            )}

            <InputError message={error} />
        </div>
    );
}
