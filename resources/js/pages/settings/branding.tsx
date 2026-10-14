import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function Branding() {
    const { branding } = usePage().props;
    const { data, setData, post, processing, errors } = useForm<{
        logo: File | null;
        favicon: File | null;
    }>({ logo: null, favicon: null });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        post('/settings/branding', { forceFormData: true, preserveScroll: true });
    }

    function removeAsset(field: 'logo' | 'favicon') {
        const label = field === 'logo' ? 'logo' : 'favicon';
        if (!window.confirm(`Hapus ${label} kustom dan gunakan kembali ${label} bawaan?`)) return;

        router.post('/settings/branding', { [`remove_${field}`]: true }, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Branding" />
            <h1 className="sr-only">Branding</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Logo dan favicon"
                    description="Atur identitas visual yang digunakan di seluruh aplikasi."
                />

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-3">
                        <Label htmlFor="logo">Logo aplikasi</Label>
                        <div className="flex min-h-24 items-center gap-4 rounded-lg border p-4">
                            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted p-2">
                                {branding.logoUrl ? (
                                    <img src={branding.logoUrl} alt="Logo saat ini" className="max-h-full max-w-full object-contain" />
                                ) : (
                                    <span className="text-xs text-muted-foreground">Logo default</span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                                <input
                                    id="logo"
                                    type="file"
                                    accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                                    onChange={(event) => setData('logo', event.target.files?.[0] ?? null)}
                                    className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                                />
                                <p className="text-xs text-muted-foreground">PNG, JPG, atau WebP. Maksimal 2 MB.</p>
                                <InputError message={errors.logo} />
                            </div>
                            {branding.logoUrl && (
                                <Button type="button" variant="outline" size="sm" onClick={() => removeAsset('logo')}>
                                    Hapus logo
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="favicon">Favicon browser</Label>
                        <div className="flex min-h-24 items-center gap-4 rounded-lg border p-4">
                            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted p-2">
                                {branding.faviconUrl ? (
                                    <img src={branding.faviconUrl} alt="Favicon saat ini" className="size-8 object-contain" />
                                ) : (
                                    <span className="text-center text-xs text-muted-foreground">Favicon default</span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                                <input
                                    id="favicon"
                                    type="file"
                                    accept=".png,.ico,image/png,image/x-icon"
                                    onChange={(event) => setData('favicon', event.target.files?.[0] ?? null)}
                                    className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                                />
                                <p className="text-xs text-muted-foreground">PNG atau ICO. Maksimal 1 MB.</p>
                                <InputError message={errors.favicon} />
                            </div>
                            {branding.faviconUrl && (
                                <Button type="button" variant="outline" size="sm" onClick={() => removeAsset('favicon')}>
                                    Hapus favicon
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing || (!data.logo && !data.favicon)}>
                            {processing ? 'Menyimpan...' : 'Simpan perubahan'}
                        </Button>
                        <p className="text-sm text-muted-foreground">Logo dan favicon akan diperbarui setelah disimpan.</p>
                    </div>
                </form>
            </div>
        </>
    );
}
