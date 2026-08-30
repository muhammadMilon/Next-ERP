"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Field";
import { COMPANY } from "@/lib/data/reference";
import { LEAF_COUNT } from "@/lib/nav/registry";
import { useStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";

/** Demo credentials — pre-filled so the workspace is one click away. */
const DEMO = { email: COMPANY.email, password: "Admin@12345" };

export default function LoginPage() {
  const router = useRouter();
  const { hydrated, user, dispatch, logActivity } = useStore();

  const [email, setEmail] = useState<string>(DEMO.email);
  const [password, setPassword] = useState<string>(DEMO.password);
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && user) router.replace("/dashboard");
  }, [hydrated, user, router]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address";
    if (!password) next.password = "Password is required";
    else if (password.length < 6) next.password = "Password must be at least 6 characters";

    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("Please correct the highlighted fields");
      return;
    }

    if (email.trim().toLowerCase() !== DEMO.email || password !== DEMO.password) {
      setErrors({ password: "These credentials do not match our records" });
      toast.error("Invalid credentials — use the pre-filled admin login");
      return;
    }

    setBusy(true);
    toast.promise(
      new Promise<void>((resolve) =>
        window.setTimeout(() => {
          dispatch({
            type: "signIn",
            user: {
              name: COMPANY.director,
              email: DEMO.email,
              role: "Super-Admin",
              director: COMPANY.director,
              mobile: COMPANY.mobile,
            },
          });
          logActivity({ action: "signed-in", entity: "Session", ref: DEMO.email });
          resolve();
          router.replace("/dashboard");
        }, 850),
      ),
      {
        loading: "Verifying your credentials…",
        success: `Welcome back, ${COMPANY.director.split(" ")[0]}`,
        error: "Sign-in failed",
      },
    ).finally(() => setBusy(false));
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_minmax(0,520px)]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-50 via-white to-amber-50 p-10 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-brand-200/40 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 size-[380px] rounded-full bg-amber-200/40 blur-3xl"
          aria-hidden
        />

        <Logo size={40} className="relative" />

        <div className="relative max-w-lg">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-brand-600 ring-1 ring-brand-200">
            <BadgeCheck className="size-3.5" aria-hidden />
            Enterprise Edition
          </p>
          <h1 className="text-[36px] font-bold leading-[1.12] tracking-tight text-ink-900">
            Procurement and inventory,
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-amber-500 bg-clip-text text-transparent">
              under one control tower.
            </span>
          </h1>
          <p className="mt-4 text-[14.5px] leading-relaxed text-ink-600">
            From requisition to RFQ, TCO evaluation and supplier award — through receiving, GRN, incoming quality
            and a clean three-way match before a single payment is released.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { icon: ShoppingCart, title: "Purchase Management", body: "13 sub-modules from PR to payment control" },
              { icon: Boxes, title: "Inventory Management", body: "8 sub-modules from gate to stock ledger" },
              { icon: ShieldCheck, title: "Approval & DOA", body: "Four-stage matrix with full audit trail" },
              { icon: BadgeCheck, title: "Quality Gate", body: "MTR and IQC block what should not ship" },
            ].map((f) => (
              <li key={f.title} className="flex gap-3 rounded-xl border border-white bg-white/70 p-3 backdrop-blur-sm">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <f.icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-ink-900">{f.title}</span>
                  <span className="block text-[12px] leading-relaxed text-ink-500">{f.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] text-ink-500">
          {COMPANY.product} · <span className="font-semibold text-brand-600">{COMPANY.name}</span> · Director:{" "}
          {COMPANY.director} · {COMPANY.mobile}
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col items-center justify-center bg-white px-5 py-10 sm:px-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size={40} />
          </div>

          <header className="mb-7 text-center">
            <h2 className="text-[26px] font-bold tracking-tight text-ink-900">Welcome back</h2>
            <p className="mt-1.5 text-[13.5px] text-ink-500">
              Sign in to continue to your {COMPANY.product} workspace
            </p>
          </header>

          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[12.5px] font-medium text-ink-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((x) => ({ ...x, email: undefined }));
                  }}
                  className={cn(
                    "focus-brand h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-[14px] text-ink-900 transition-colors placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-400",
                    errors.email ? "border-red-400" : "border-ink-200",
                  )}
                  placeholder="you@company.com"
                />
              </div>
              {errors.email && <p className="text-[11.5px] font-medium text-red-600">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className="block text-[12.5px] font-medium text-ink-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => toast("A reset link would be emailed to your registered address", { icon: "🔑" })}
                  className="text-[12px] font-medium text-brand-600 transition-colors hover:text-brand-700 hover:underline"
                >
                  Reset password
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((x) => ({ ...x, password: undefined }));
                  }}
                  className={cn(
                    "focus-brand h-11 w-full rounded-lg border bg-white pl-10 pr-10 text-[14px] text-ink-900 transition-colors hover:border-ink-300 focus:border-brand-400",
                    errors.password ? "border-red-400" : "border-ink-200",
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="focus-brand absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11.5px] font-medium text-red-600">{errors.password}</p>}
            </div>

            <Checkbox
              label="Remember me for 30 days"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={busy}
              className="h-11 w-full text-[14.5px]"
              iconRight={<ArrowRight className="size-4" />}
            >
              Continue
            </Button>
          </form>

          <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/70 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-700">
              <ShieldCheck className="size-3.5" aria-hidden /> Demo credentials — pre-filled
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[11.5px] text-ink-600">
              <dt className="text-ink-400">email</dt>
              <dd className="truncate font-medium text-ink-800">{DEMO.email}</dd>
              <dt className="text-ink-400">password</dt>
              <dd className="font-medium text-ink-800">{DEMO.password}</dd>
            </dl>
          </div>

          <p className="mt-6 text-center text-[13px] text-ink-500">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => toast("Registration is handled by your Smart Global IT account manager", { icon: "📝" })}
              className="font-semibold text-brand-600 transition-colors hover:text-brand-700 hover:underline"
            >
              Register
            </button>
          </p>

          <p className="mt-8 text-center text-[11px] text-ink-400">
            {LEAF_COUNT} screens · 2 modules · 21 sub-modules · frontend demo build
          </p>
        </div>
      </main>
    </div>
  );
}
