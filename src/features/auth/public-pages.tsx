"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck,
  LockKeyhole,
  Scan,
  ShieldCheck,
} from "lucide-react";
import { LandingPage } from "@/features/auth/landing-page";
import { Badge, Field, ErrorState } from "@/components/common/ui";
import { HelpCenter } from "@/features/common/help/help-center";
import {
  activateAccount,
  getAccounts,
  login,
  passwordChecks,
  requestPasswordReset,
  resetPassword,
} from "@/lib/api/auth.service";
import { requestEnterpriseAccess } from "@/lib/api/tenant.service";
import { roleHome } from "@/lib/permissions";
import { useResource } from "@/features/common/hooks/use-resource";

export function PublicPage({ page }: { page: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { data: accounts } = useResource(getAccounts, "public");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activation, setActivation] = useState(params.get("user") ?? "");
  const titles: Record<string, string> = {
    login: "Welcome back",
    welcome: "Welcome!",
    "request-access": "Register your enterprise",
    activate: "Activate your account",
    "forgot-password": "Forgot your password?",
    "reset-password": "Create a new password",
    help: "Help & support",
  };
  const selected = accounts?.find((a) => a.id === activation);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      if (page === "login") {
        const user = await login(email, password);
        router.push(
          `/welcome?name=${encodeURIComponent(user.name)}&home=${encodeURIComponent(roleHome(user.role))}`,
        );
      } else if (page === "request-access") {
        await requestEnterpriseAccess({
          company: String(f.get("company")),
          registration: String(f.get("registration")),
          contact: String(f.get("contact")),
          email: String(f.get("email")),
          phone: String(f.get("phone")),
          accounts: Number(f.get("accounts")),
          employees: [],
          notes: String(f.get("notes")),
        });
        setSuccess(
          "Enterprise access request submitted. Your request is awaiting SAIC approval.",
        );
      } else if (page === "activate") {
        await activateAccount(
          activation,
          password,
          String(f.get("confirm")),
        );
        setSuccess(
          "Account activated successfully. You can now sign in using your company email.",
        );
      } else if (page === "forgot-password") {
        await requestPasswordReset(String(f.get("email")));
        setSuccess(
          "Reset request recorded. Continue below to set a new password.",
        );
      } else {
        await resetPassword(
          password,
          String(f.get("confirm")),
        );
        setSuccess(
          "Password reset completed successfully. You can now sign in with your new password.",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (page === "help")
    return (
      <div className="home-wash auth-wash help-wash">
        <header className="hp-header">
          <Link href="/" className="hp-brand">
            Accounting
            <span>Intelligence.</span>
          </Link>
          <nav>
            <Link href="/request-access" className="hp-register">
              Register enterprise
            </Link>
            <Link href="/login" className="hp-login">
              Log in
            </Link>
          </nav>
        </header>
        <main className="help-page-main">
          <div className="help-page-copy">
            <p className="hp-eyebrow">Support</p>
            <h1>
              Tutorial and <span>enterprise helpline.</span>
            </h1>
            <p className="hp-lead">
              Learn the workflow, or ask SAIC for help. The same guide opens inside the workspace.
            </p>
          </div>
          <div className="help-page-panel">
            <HelpCenter />
          </div>
        </main>
      </div>
    );

  if (!page) return <LandingPage />;
  const accessPage = page === "login" || page === "forgot-password";
  return (
    <div className="home-wash auth-wash">
      <header className="hp-header">
        <Link href="/" className="hp-brand">
          Accounting
          <span>Intelligence.</span>
        </Link>
        <nav>
          <Link href="/help">Help</Link>
          <Link href="/request-access" className="hp-register">
            Register enterprise
          </Link>
          <Link href="/login" className="hp-login">
            Log in
          </Link>
        </nav>
      </header>
      <main
        className={
          page === "request-access"
            ? "register-split"
            : accessPage
              ? "hp-hero auth-hero"
              : "auth-stage"
        }
      >
        {page === "request-access" && (
          <section className="register-story">
            <p className="hp-eyebrow">Enterprise registration</p>
            <h1>
              Register your enterprise and turn invoices into{" "}
              <span>trusted records.</span>
            </h1>
            <p className="hp-lead">
              Request a company workspace. SAIC reviews it before anyone can sign in.
            </p>
            <p className="register-how">What the workspace is for</p>
            <ul className="register-points">
              <li>
                <Check size={16} strokeWidth={2.6} aria-hidden="true" />
                <span>Extract supplier, date, line items, and total from invoices, bills, and receipts.</span>
              </li>
              <li>
                <Check size={16} strokeWidth={2.6} aria-hidden="true" />
                <span>Send every mismatch to a person. Nothing questionable becomes a record on its own.</span>
              </li>
              <li>
                <Check size={16} strokeWidth={2.6} aria-hidden="true" />
                <span>Write one standard record shape, ready to export.</span>
              </li>
            </ul>
            <p className="register-note">
              No live ledger, tax filing, or payment. This request only opens a company workspace.
            </p>
            <div className="register-preview">
              <p className="record-chip">
                <span className="record-chip-mark" aria-hidden="true">
                  <Check size={13} strokeWidth={2.6} />
                </span>
                From document to decision
              </p>
              <article className="record-sheet">
                <div className="record-row">
                  <span className="record-mark" aria-hidden="true">
                    <FileCheck size={20} strokeWidth={2.2} />
                  </span>
                  <span className="record-status">
                    <i />
                    Validated
                  </span>
                </div>
                <p className="record-kicker">Standardised accounting record</p>
                <h2>Everything in its right place.</h2>
                <dl className="record-meta">
                  <div>
                    <dt>Supplier</dt>
                    <dd>Atlas Office Supplies</dd>
                  </div>
                  <div>
                    <dt>Invoice</dt>
                    <dd>INV-2026-00821</dd>
                  </div>
                </dl>
                <div className="record-lines">
                  <p>
                    <span>Office supplies</span>
                    <strong>RM 800.00</strong>
                  </p>
                  <p>
                    <span>Delivery</span>
                    <strong>RM 48.00</strong>
                  </p>
                  <p className="total">
                    <span>Total amount</span>
                    <strong>RM 848.00</strong>
                  </p>
                </div>
                <p className="record-ready">
                  <Scan size={16} strokeWidth={2.2} aria-hidden="true" />
                  Extracted. Validated. Ready to export.
                </p>
              </article>
            </div>
          </section>
        )}
        {accessPage && (
          <div>
            <p className="hp-eyebrow">Enterprise accounting intelligence</p>
            <p className="hp-quiet">
              {page === "login"
                ? "SAIC secure · company email opens the workspace"
                : "Reset stays inside this workspace"}
            </p>
            <h1>
              {page === "login" ? (
                <>
                  Sign in to the <span>workspace.</span>
                </>
              ) : (
                <>
                  Forgot your <span>password?</span>
                </>
              )}
            </h1>
            <p className="hp-lead">
              {page === "login"
                ? "From invoice to trusted record."
                : "Use the company email on the account."}
            </p>
            <p className="hp-copy">
              {page === "login"
                ? "Enter the company email you were issued. That address opens the right workspace. People are invited; there is no public self-signup."
                : "Enter the company email. This preview records the reset here, then you choose a new password on the next screen. A real email is not sent."}
            </p>
          </div>
        )}
        <div
          className={`auth-card${page === "request-access" ? " register-card" : ""}${page === "login" ? " login-card" : ""}`}
        >
          {!accessPage && page !== "request-access" && (
            <>
              <span className="auth-icon">
                <LockKeyhole size={20} />
              </span>
              <p className="hp-eyebrow">
                {page === "request-access"
                  ? "Enterprise registration"
                  : page === "reset-password"
                    ? "Account access"
                    : "Workspace sign in"}
              </p>
              <h1>{titles[page] ?? "Page not found"}</h1>
              <p>
                {page === "welcome"
                  ? "Your identity has been verified successfully."
                  : page === "request-access"
                    ? "Submit your company details to register for enterprise access. SAIC will review your request."
                    : page === "reset-password"
                      ? "Choose a strong password to keep your workspace secure."
                      : "Secure access starts with your company email."}
              </p>
            </>
          )}
          {page === "request-access" && !success && (
            <>
              <p className="hp-eyebrow">Company details</p>
              <h2>Register your enterprise</h2>
              <p>Complete the form. SAIC reviews the request before the workspace opens.</p>
            </>
          )}
          {accessPage && !success && (
            <>
              <span className="auth-icon">
                <LockKeyhole size={20} />
              </span>
              <p className="hp-eyebrow">
                {page === "login" ? "Workspace sign in" : "Account access"}
              </p>
              <h2>{page === "login" ? "Company credentials" : "Request a reset"}</h2>
            </>
          )}
          {page === "welcome" ? (
            <div className="success-state">
              <CheckCircle2 size={40} />
              <h2>Successful and welcome!</h2>
              <p>
                Welcome{params.get("name") ? `, ${params.get("name")}` : ""}.
                Your secure workspace is ready.
              </p>
              <Link
                className="btn primary"
                href={params.get("home")?.startsWith("/") ? params.get("home")! : "/login"}
              >
                Continue to dashboard <ArrowRight size={16} />
              </Link>
            </div>
          ) : success ? (
            <div className="success-state">
              <CheckCircle2 size={40} />
              <h2>
                {page === "request-access"
                  ? "Request received"
                  : "You’re all set"}
              </h2>
              <p>{success}</p>
              {page === "request-access" && <Badge>PENDING</Badge>}
              <Link
                className="btn primary"
                href={page === "forgot-password" ? "/reset-password" : "/login"}
              >
                {page === "forgot-password"
                  ? "Continue password reset"
                  : "Continue to login"}
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              {error && <ErrorState message={error} />}
              {page === "login" && (
                <>
                  <Field label="Company email *">
                    <input
                      type="email"
                      autoComplete="username"
                      placeholder="you@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Password *"
                    hint="Enter your account password to continue."
                  >
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                </>
              )}
              {page === "request-access" && (
                <>
                  <div className="form-grid">
                    <Field label="Company name *">
                      <input
                        name="company"
                        required
                        placeholder="Your company Sdn Bhd"
                      />
                    </Field>
                    <Field label="Registration number *">
                      <input
                        name="registration"
                        required
                        placeholder="202601234567"
                      />
                    </Field>
                    <Field label="Contact person / manager *">
                      <input name="contact" required />
                    </Field>
                    <Field label="Company email *">
                      <input
                        name="email"
                        type="email"
                        required
                        defaultValue={params.get("email") ?? ""}
                      />
                    </Field>
                    <Field label="Phone number">
                      <input name="phone" type="tel" />
                    </Field>
                    <Field label="Accounts required *">
                      <input
                        name="accounts"
                        type="number"
                        min="1"
                        max="1000"
                        defaultValue="10"
                        required
                      />
                    </Field>
                  </div>
                  <Field label="Reason / notes">
                    <textarea name="notes" rows={2} />
                  </Field>
                </>
              )}
              {page === "activate" && (
                <>
                  <Field label="Pending invitation">
                    <select
                      required
                      value={activation}
                      onChange={(e) => setActivation(e.target.value)}
                    >
                      <option value="">Select an invitation</option>
                      {accounts
                        ?.filter((a) =>
                          ["INVITED", "INVITATION_EXPIRED"].includes(a.status),
                        )
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} · {a.email}
                          </option>
                        ))}
                    </select>
                  </Field>
                  {selected && (
                    <div className="info-box">
                      <strong>{selected.email}</strong>
                      <span>Company: {selected.tenantId}</span>
                      <Badge>{selected.role}</Badge>
                    </div>
                  )}
                </>
              )}
              {page === "forgot-password" && (
                <Field label="Company email *">
                  <input name="email" type="email" required />
                </Field>
              )}
              {["activate", "reset-password"].includes(page) && (
                <div className="password-setup">
                  <div className="password-setup-heading">
                    <strong>Set your password</strong>
                    <span>Use a password only you can guess.</span>
                  </div>
                  <Field label="Create password *">
                    <input
                      required
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                  <Field label="Confirm password *">
                    <input
                      required
                      name="confirm"
                      type="password"
                      autoComplete="new-password"
                    />
                  </Field>
                  <div className="password-checks" aria-live="polite">
                    <span className="password-checks-title">
                      Password requirements
                    </span>
                    {[
                      "At least 8 characters",
                      "Uppercase letter",
                      "Lowercase letter",
                      "Number",
                      "Special character",
                    ].map((text, i) => (
                      <span
                        className={passwordChecks(password)[i] ? "passed" : ""}
                        key={text}
                      >
                        <Check size={13} />
                        {text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button className="btn primary full" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : page === "login"
                    ? "Continue with email"
                    : page === "request-access"
                      ? "Submit enterprise registration"
                      : page === "activate"
                        ? "Activate account"
                        : page === "forgot-password"
                          ? "Request reset"
                          : "Reset password"}
                <ArrowRight size={16} />
              </button>
              {page === "login" && (
                <>
                  <Link href="/forgot-password" className="form-link">
                    Forgot password?
                  </Link>
                  <p className="form-bottom">
                    New to Accounting Intelligence?{" "}
                    <Link href="/request-access">Register enterprise</Link>
                    {" · "}
                    <Link href="/help">Need help?</Link>
                  </p>
                </>
              )}
              {page === "forgot-password" && (
                <p className="form-bottom">
                  Remembered it? <Link href="/login">Back to sign in</Link>
                </p>
              )}
              {page === "request-access" && (
                <p className="form-bottom">
                  Already registered? <Link href="/login">Sign in</Link>
                  {" · "}
                  <Link href="/help">Help & tutorial</Link>
                </p>
              )}
            </form>
          )}
          <div className="secure-note">
            <ShieldCheck size={15} />
            <span>
              {page === "request-access"
                ? "Enterprise registration is reviewed by SAIC before workspace activation."
                : "Your account access is protected by your company credentials."}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
