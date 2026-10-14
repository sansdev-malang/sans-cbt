import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    index as confirmOptions,
    store as confirmStore,
} from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyConfirmationController';
import { store } from '@/routes/password/confirm';

function returnToPreviousPage() {
    window.history.back();
}

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirm password" />

            <Dialog
                open
                onOpenChange={(open) => !open && returnToPreviousPage()}
            >
                <DialogContent
                    className="sm:max-w-md"
                    overlayClassName="bg-slate-950/40 backdrop-blur-sm"
                >
                    <DialogHeader>
                        <DialogTitle>Confirm your identity</DialogTitle>
                        <DialogDescription>
                            Konfirmasi kata sandi atau gunakan passkey untuk
                            melanjutkan ke pengaturan keamanan.
                        </DialogDescription>
                    </DialogHeader>

                    <PasskeyVerify
                        routes={{
                            options: confirmOptions(),
                            submit: confirmStore(),
                        }}
                        label="Confirm with passkey"
                        loadingLabel="Confirming..."
                        separator="Or confirm with password"
                    />

                    <Form {...store.form()} resetOnSuccess={['password']}>
                        {({ processing, errors }) => (
                            <div className="space-y-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        placeholder="Password"
                                        autoComplete="current-password"
                                        autoFocus
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={returnToPreviousPage}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        disabled={processing}
                                        data-test="confirm-password-button"
                                    >
                                        {processing && <Spinner />}
                                        Confirm password
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}

ConfirmPassword.layout = {
    title: '',
    description: '',
};
