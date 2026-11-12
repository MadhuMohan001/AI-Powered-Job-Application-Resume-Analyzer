import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Button, Field, inputClass } from "../components/ui/ui";

function AuthShell({ title, children, footer }: { title: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xl font-bold text-brand-700">ResumeIQ</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">{title}</h1>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
      </div>
    </div>
  );
}

interface LoginForm { email: string; password: string }

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>();

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (d: LoginForm) => {
    setError(null);
    try { await login(d.email, d.password); navigate("/"); } catch (e) { setError(errorMessage(e)); }
  };

  return (
    <AuthShell title="Welcome back" footer={<>No account? <Link className="font-medium text-brand-600" to="/register">Create one</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className={inputClass}
                 {...register("email", { required: "Email is required" })} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <input id="password" type="password" autoComplete="current-password" className={inputClass}
                 {...register("password", { required: "Password is required" })} />
        </Field>
        <Button type="submit" loading={isSubmitting} className="w-full">Log in</Button>
      </form>
    </AuthShell>
  );
}

interface RegisterForm { full_name: string; email: string; password: string }

export function RegisterPage() {
  const { user, register: signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>();

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (d: RegisterForm) => {
    setError(null);
    try { await signUp(d.email, d.full_name, d.password); navigate("/"); } catch (e) { setError(errorMessage(e)); }
  };

  return (
    <AuthShell title="Create your account" footer={<>Already registered? <Link className="font-medium text-brand-600" to="/login">Log in</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
          <input id="full_name" autoComplete="name" className={inputClass}
                 {...register("full_name", { required: "Name is required", maxLength: { value: 120, message: "Too long" } })} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className={inputClass}
                 {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" } })} />
        </Field>
        <Field label="Password (min 8 characters)" htmlFor="password" error={errors.password?.message}>
          <input id="password" type="password" autoComplete="new-password" className={inputClass}
                 {...register("password", { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" }, maxLength: { value: 72, message: "At most 72 characters" } })} />
        </Field>
        <Button type="submit" loading={isSubmitting} className="w-full">Create account</Button>
      </form>
    </AuthShell>
  );
}
