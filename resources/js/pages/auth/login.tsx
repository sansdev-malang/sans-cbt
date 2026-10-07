import { Form, Head } from '@inertiajs/react';
import { LogIn } from 'lucide-react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Masuk" />

            <div className="[&_button]:border-slate-200 [&_button]:bg-white [&_button]:text-slate-700 [&_button:hover]:bg-slate-50 [&_.bg-background]:bg-white [&_.text-muted-foreground]:text-slate-400">
                <PasskeyVerify
                    label="Masuk dengan passkey"
                    loadingLabel="Mengautentikasi..."
                    separator="Atau masuk dengan email"
                />
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="email"
                                    className="text-slate-700"
                                >
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="nama@sekolahanaksaleh.sch.id"
                                    className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-violet-500 focus-visible:ring-violet-500/20"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label
                                        htmlFor="password"
                                        className="text-slate-700"
                                    >
                                        Kata sandi
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm text-violet-700 decoration-violet-300 hover:text-violet-900"
                                            tabIndex={5}
                                        >
                                            Lupa kata sandi?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Masukkan kata sandi"
                                    className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 [&+button]:text-slate-400 [&+button:hover]:text-slate-700"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3 text-slate-600">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="border-slate-400 data-[state=checked]:border-violet-600 data-[state=checked]:bg-violet-600"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-slate-600"
                                >
                                    Ingat saya
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full bg-slate-900 text-white hover:bg-violet-700"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing ? (
                                    <Spinner />
                                ) : (
                                    <LogIn className="size-4" />
                                )}
                                Masuk
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-4 text-center text-sm font-medium text-violet-700">
                    {status}
                </div>
            )}

            <p className="mt-8 text-center text-sm leading-5 text-slate-500">
                Belum punya akun? Akun dibuat oleh admin sekolah — silakan
                hubungi operator atau wali kelas Anda.
            </p>
        </>
    );
}

Login.layout = {
    title: 'Masuk ke akun Anda',
    description:
        'Gunakan email dan kata sandi yang diberikan sekolah untuk mengakses CBT.',
};
