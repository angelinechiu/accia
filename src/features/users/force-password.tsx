"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import type { User } from "@/types";
import {
  changeOwnPassword,
  logout,
  passwordChecks,
} from "@/lib/api/auth.service";
import { ErrorState, Field } from "@/components/common/ui";

const REQUIREMENTS = [
  "At least 8 characters",
  "Uppercase letter",
  "Lowercase letter",
  "Number",
  "Special character",
];

export function ForcePasswordChange({ user }: { user: User }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFailure("");
    try {
      await changeOwnPassword(
        user,
        password,
        String(new FormData(event.currentTarget).get("confirmation")),
      );
    } catch (error) {
      setFailure((error as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="force-password">
      <form className="force-password-card" onSubmit={submit}>
        <p className="kicker">First sign-in</p>
        <h1>Choose a new password</h1>
        <p>
          {user.name.split(" ")[0]}, this is required only the first time you
          sign in. After you save it, you go straight to the workspace.
        </p>
        {failure && <ErrorState message={failure} />}
        <Field
          label="New password *"
          hint="Use 8+ characters with uppercase, lowercase, a number, and a symbol."
        >
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="Confirm new password *">
          <input
            name="confirmation"
            type="password"
            required
            autoComplete="new-password"
          />
        </Field>
        <div className="password-checks" aria-live="polite">
          <span className="password-checks-title">Password requirements</span>
          {REQUIREMENTS.map((text, index) => (
            <span
              className={passwordChecks(password)[index] ? "passed" : ""}
              key={text}
            >
              <Check size={13} />
              {text}
            </span>
          ))}
        </div>
        <button className="btn primary" disabled={busy}>
          {busy ? "Saving…" : "Save password"}
        </button>
        <button
          className="text-link"
          type="button"
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
        >
          Switch account
        </button>
      </form>
    </main>
  );
}
