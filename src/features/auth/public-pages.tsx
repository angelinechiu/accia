"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck2,
  Gauge,
  LockKeyhole,
  ScanLine,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { Brand } from "@/components/common/layout/app-shell";
import { PublicHeader } from "@/components/common/layout/public-header";
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

const MODULES = [
  {
    id: "platform",
    kicker: "SAIC",
    title: "Companies and account limits.",
    stats: [
      ["Companies", "2"],
      ["Seats", "12"],
      ["Pending", "1"],
    ],
    lines: ["ABC Sdn Bhd approved", "XYZ Sdn Bhd pending", "Seat limit set"],
  },
  {
    id: "documents",
    kicker: "Intake",
    title: "Invoices, bills, and receipts.",
    stats: [
      ["Uploaded", "18"],
      ["Extracting", "3"],
      ["Ready", "15"],
    ],
    lines: ["INV-2026-00821 extracted", "Receipt batch uploaded", "Supplier field checked"],
  },
  {
    id: "exceptions",
    kicker: "Review",
    title: "Items that need a person.",
    stats: [
      ["Open", "7"],
      ["Today", "2"],
      ["Rate", "8%"],
    ],
    lines: ["Total does not match", "Tax line missing", "Sent to the owner"],
  },
  {
    id: "records",
    kicker: "Ledger",
    title: "Records in one standard shape.",
    stats: [
      ["Ready", "31"],
      ["Exported", "20"],
      ["Currency", "MYR"],
    ],
    lines: ["Office supplies standardised", "Ready to export", "Change kept on the record"],
  },
  {
    id: "reports",
    kicker: "Performance",
    title: "How processing is going.",
    stats: [
      ["Accuracy", "96%"],
      ["Time", "12s"],
      ["Volume", "42"],
    ],
    lines: ["Pilot accuracy holding", "Under 20 seconds", "Concurrent uploads ok"],
  },
] as const;

const NAV = ["Platform", "Documents", "Exceptions", "Records", "Reports"] as const;

function ModuleDeck() {
  const [index, setIndex] = useState(2);
  const [tick, setTick] = useState(0);
  const dragX = useRef(0);

  function show(next: number) {
    setIndex((next + MODULES.length) % MODULES.length);
    setTick((value) => value + 1);
  }

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % MODULES.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [tick]);

  return (
    <section className="module-deck" aria-labelledby="modules-title">
      <div className="section-heading">
        <span>MODULES</span>
        <h2 id="modules-title">A general look across the workspace.</h2>
        <p>The open card stays in the centre and moves every 4 seconds.</p>
      </div>
      <div
        className="card-stack"
        onPointerDown={(event) => {
          dragX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          const delta = event.clientX - dragX.current;
          if (delta > 48) show(index - 1);
          if (delta < -48) show(index + 1);
        }}
      >
        {MODULES.map((item, itemIndex) => {
          let slot = itemIndex - index;
          if (slot > MODULES.length / 2) slot -= MODULES.length;
          if (slot < -MODULES.length / 2) slot += MODULES.length;
          const place = slot === -1 || slot === 0 || slot === 1 ? String(slot) : "hide";
          return (
            <article key={item.id} className="module-card" data-slot={place}>
              <div className="module-top">
                <span className="window-dots"><i /><i /><i /></span>
                <span>Accounting Intelligence workspace</span>
                <Badge>Ready</Badge>
              </div>
              <div className="module-body">
                <aside>
                  <strong>Workspace</strong>
                  {NAV.map((name) => (
                    <span key={name} className={name.toLowerCase() === item.id ? "on" : ""}>{name}</span>
                  ))}
                </aside>
                <div>
                  <div className="module-head">
                    <div>
                      <small>{item.kicker}</small>
                      <h3>{item.title}</h3>
                    </div>
                    <b>AT</b>
                  </div>
                  <div className="module-stats">
                    {item.stats.map(([label, value]) => (
                      <p key={label}><span>{label}</span><strong>{value}</strong><em>Updated just now</em></p>
                    ))}
                  </div>
                  <div className="module-lower">
                    <div>
                      <p>Processing volume <span>Now</span></p>
                      <div className="module-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
                    </div>
                    <div>
                      <p>Latest <span>Live</span></p>
                      <ul>
                        {item.lines.map((line) => <li key={line}>{line}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="module-controls">
        <button type="button" aria-label="Previous module" onClick={() => show(index - 1)}>←</button>
        <div role="tablist" aria-label="Module pages">
          {MODULES.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              className={itemIndex === index ? "on" : ""}
              aria-label={item.id}
              aria-pressed={itemIndex === index}
              onClick={() => show(itemIndex)}
            />
          ))}
        </div>
        <button type="button" className="next" aria-label="Next module" onClick={() => show(index + 1)}>→</button>
      </div>
    </section>
  );
}

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
      <div className="landing help-page">
        <PublicHeader active="help" />
        <main className="help-page-main">
          <div className="section-heading help-page-heading">
            <span>SUPPORT CENTRE</span>
            <h1>Tutorial and enterprise helpline</h1>
            <p>
              Learn the Accounting Intelligence workflow, or request assistance
              from the SAIC support team when you need a human response.
            </p>
          </div>
          <div className="help-page-panel">
            <HelpCenter />
          </div>
        </main>
        <footer className="public-footer">
          <span>ACCOUNTING INTELLIGENCE · SAIC</span>
        </footer>
      </div>
    );

  if (!page)
    return (
      <div className="landing">
        <PublicHeader />
        <main className="landing-main">
          <div className="landing-copy">
            <div className="eyebrow">
              <span className="pulse-dot" /> ENTERPRISE ACCOUNTING INTELLIGENCE
            </div>
            <div className="hero-rating">
              <span>SAIC</span> secure · auditable · built for finance teams
            </div>
            <h1>
              From invoice to
              <br />
              trusted <em>record.</em>
            </h1>
            <p className="landing-subtitle">
              AI-driven invoice processing and automated record standardisation
            </p>
            <p className="landing-description">
              Invoices, bills, and receipts become checked accounting records.
              Extraction, validation, exception review, and a standard record
              shape sit in one workspace — without posting to a live ledger.
            </p>
            <div className="actions">
              <Link href="/login" className="btn primary">
                Enter your workspace <ArrowRight size={17} />
              </Link>
              <Link href="/request-access" className="btn">
                Register enterprise
              </Link>
              <a href="#workspace" className="text-link">
                Get started
              </a>
            </div>
          </div>
          <div className="landing-visual">
            <div className="floating-label">
              <CheckCircle2 size={16} /> From document to decision
            </div>
            <div className="invoice-mock">
              <div className="invoice-mock-header">
                <div className="brand-symbol">
                  <FileCheck2 size={26} />
                </div>
                <Badge>VALIDATED</Badge>
              </div>
              <small>STANDARDISED ACCOUNTING RECORD</small>
              <h2>Everything in its right place.</h2>
              <div className="invoice-grid">
                <div>
                  <small>SUPPLIER</small>
                  <strong>Atlas Office Supplies</strong>
                </div>
                <div>
                  <small>INVOICE</small>
                  <strong>INV-2026-00821</strong>
                </div>
              </div>
              <div className="invoice-lines">
                <span>Office supplies</span>
                <strong>RM 800.00</strong>
              </div>
              <div className="invoice-lines">
                <span>Tax · 6%</span>
                <strong>RM 48.00</strong>
              </div>
              <div className="invoice-total">
                <span>Total amount</span>
                <strong>RM 848.00</strong>
              </div>
              <div className="verified">
                <CheckCircle2 size={16} /> Extracted. Validated. Ready for
                what’s next.
              </div>
            </div>
            <div className="floating-metric">
              <ScanLine size={22} />
              <div>
                <strong>96.4%</strong>
                <span>Illustrative extraction accuracy</span>
              </div>
            </div>
          </div>
        </main>
        <ModuleDeck />
        <section className="landing-features" id="workspace">
          <div className="section-heading">
            <span>WHAT THE SYSTEM DOES</span>
            <h2>From a document to a record you can trust.</h2>
            <p>
              Four jobs cover the project: read the document, check it,
              standardise it, and show whether the system is fast and accurate
              enough.
            </p>
          </div>
          <div className="topic-cards">
            {[
              [ScanLine, "Field extraction", "Reads supplier, date, line items, tax, and total from invoices, bills, and receipts so the team stops typing them in.", "Target ≥ 95% on the pilot set"],
              [ShieldAlert, "Validation and exceptions", "Checks that the amounts agree, then sends every mismatch to a person. Nothing questionable becomes a record on its own.", "Exception rate under 10%"],
              [FileCheck2, "Standardised records", "Turns a checked document into one accounting record shape, ready for a downstream system without rework.", "Manual entry cut by about 70%"],
              [Gauge, "Speed and volume", "Measures how fast and how accurately the workspace handles documents, including many submitted at the same time.", "About 20 seconds a document"],
            ].map(([Icon, title, copy, mark], index) => {
              const I = Icon as typeof ScanLine;
              return (
                <article key={String(title)}>
                  <div>
                    <span>0{index + 1}</span>
                    <I size={18} />
                  </div>
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                  <strong>{String(mark)}</strong>
                </article>
              );
            })}
          </div>
        </section>
        <section className="step-board" id="process">
          <div className="section-heading">
            <span>THE SIX STEPS</span>
            <h2>What each step is for.</h2>
            <p>
              A document only becomes a standardised record after these six
              steps. The later ones exist so a bad extraction is never treated
              as finished.
            </p>
          </div>
          <ol>
            {[
              ["Upload", "The document comes in as an invoice, a bill, or a receipt. This is the only manual step before extraction starts."],
              ["Extract", "The system pulls the accounting fields: who billed you, the date, each line, the tax, and the total."],
              ["Validate", "Those fields are checked against each other. A total that does not add up, or a missing value, fails here."],
              ["Review", "Failed documents become exceptions. They go to the right person, and every correction stays on the document."],
              ["Standardise", "A document that passes is written as one record, with the same fields every time."],
              ["Export", "The standardised record can leave the workspace. Tax filing, payment, and a live ledger are out of scope."],
            ].map(([name, detail], index) => (
              <li key={name}>
                <span>Step 0{index + 1}</span>
                <h3>{name}</h3>
                <p>{detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-final-cta">
          <div>
            <span>READY TO TRY THE WORKSPACE?</span>
            <h2>Clean extraction. Checked records. A standard you can export.</h2>
          </div>

          <div className="actions">
            <Link href="/request-access" className="btn primary">
              Register enterprise
            </Link>

            <Link href="/login" className="btn">
              Sign in
            </Link>

            <Link href="/help" className="btn">
              Help
            </Link>
          </div>
        </section>

        <footer className="landing-footer">
          <div>
            <strong>Accounting Intelligence</strong>
            <p>AI-driven invoice processing and automated record standardisation. A SAIC proof of concept for finance teams.</p>
          </div>
          <div>
            <span>ON THIS PAGE</span>
            <a href="#workspace">What the system does</a>
            <a href="#process">The six steps</a>
            <Link href="/request-access">Register an enterprise</Link>
            <Link href="/help">Help</Link>
          </div>
          <div>
            <span>IN SCOPE</span>
            <p>Ingestion, field extraction, validation, exception review, standardised records, and performance. Not tax filing, payment, or a live general ledger.</p>
          </div>
          <small>SAIC · ACCOUNTING INTELLIGENCE</small>
        </footer>
      </div>
    );
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Link href="/">
          <Brand />
        </Link>
        <div>
          <div className="eyebrow">ACCOUNTING INTELLIGENCE</div>
          <h1>
            Precision for every
            <br />
            financial document.
          </h1>
          <p>
            Enterprise-grade invoice intelligence, exception control, and
            standardised records in one workspace.
          </p>
          <div className="auth-features">
            {[
              [Upload, "Documents, organised"],
              [ScanLine, "Intelligence, applied"],
              [FileCheck2, "Records, standardised"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof Upload;
              return (
                <div key={String(text)}>
                  <I size={19} />
                  <span>{String(text)}</span>
                  <Check size={15} />
                </div>
              );
            })}
          </div>
        </div>
        <small>SAIC · Enterprise Accounting Intelligence</small>
      </aside>
      <main className="auth-content">
        <div className="auth-top-links">
          <Link href="/" className="back-link">
            ← Back to home
          </Link>
          <Link href="/help" className="back-link auth-help-link">
            Help & tutorial
          </Link>
        </div>
        <div className={`auth-form ${page === "request-access" ? "wide" : ""}`}>
          <span className="auth-icon">
            <LockKeyhole size={23} />
          </span>
          <h1>{titles[page] ?? "Page not found"}</h1>
          <p>
            {page === "login"
              ? "Sign in to your Accounting Intelligence workspace."
              : page === "welcome"
                  ? "Your identity has been verified successfully."
              : page === "request-access"
                ? "Submit your company details to register for enterprise access. SAIC will review your request."
                  : page === "reset-password"
                    ? "Choose a strong password to keep your workspace secure."
                : "Secure access starts with your company email."}
          </p>
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
