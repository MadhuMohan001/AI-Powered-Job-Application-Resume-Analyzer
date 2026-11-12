import { useForm } from "react-hook-form";
import { authApi } from "../api";
import { errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button, Card, Field, PageHeader, inputClass } from "../components/ui/ui";

interface Values { full_name: string; password: string }

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    defaultValues: { full_name: user?.full_name ?? "", password: "" },
  });

  const save = async (v: Values) => {
    try {
      const updated = await authApi.update({ full_name: v.full_name, ...(v.password ? { password: v.password } : {}) });
      setUser(updated);
      reset({ full_name: updated.full_name, password: "" });
      toast.success("Profile updated.");
    } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader title="Profile Settings" />
      <Card className="max-w-lg">
        <form onSubmit={handleSubmit(save)} className="space-y-4" noValidate>
          <Field label="Email" htmlFor="p-email"><input id="p-email" className={`${inputClass} bg-slate-50`} value={user?.email ?? ""} disabled readOnly /></Field>
          <Field label="Full name" htmlFor="p-name" error={errors.full_name?.message}>
            <input id="p-name" className={inputClass} {...register("full_name", { required: "Name is required", maxLength: 120 })} />
          </Field>
          <Field label="New password (leave blank to keep current)" htmlFor="p-pass" error={errors.password?.message}>
            <input id="p-pass" type="password" autoComplete="new-password" className={inputClass}
                   {...register("password", { minLength: { value: 8, message: "At least 8 characters" }, maxLength: { value: 72, message: "At most 72 characters" } })} />
          </Field>
          <Button type="submit" loading={isSubmitting}>Save changes</Button>
        </form>
      </Card>
    </>
  );
}
