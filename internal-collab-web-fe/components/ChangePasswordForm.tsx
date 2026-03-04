"use client";

import { type SubmitEventHandler, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ChangePasswordFormProps = {
  roleLabel: string;
};

function readApiMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as { detail?: unknown; message?: unknown; title?: unknown };
  if (typeof data.detail === "string" && data.detail.trim()) {
    return data.detail;
  }
  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (typeof data.title === "string" && data.title.trim()) {
    return data.title;
  }

  return null;
}

export default function ChangePasswordForm({ roleLabel }: ChangePasswordFormProps) {
  const searchParams = useSearchParams();
  const isForcedChange = searchParams.get("forced") === "1";
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isForcedChange) {
      return;
    }

    const prefetchedOldPassword = sessionStorage.getItem("force_change_old_password") ?? "";
    if (prefetchedOldPassword) {
      setOldPassword(prefetchedOldPassword);
    }
  }, [isForcedChange]);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword.trim()) {
      setError("Old password is required.");
      return;
    }

    if (!newPassword.trim()) {
      setError("New password is required.");
      return;
    }

    if (!confirmPassword.trim()) {
      setError("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          Accept: "application/json, application/problem+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      let responseData: unknown = null;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        setError(readApiMessage(responseData) ?? "Unable to change password. Please try again.");
        return;
      }

      setSuccess(readApiMessage(responseData) ?? "Password changed successfully.");
      sessionStorage.removeItem("force_change_old_password");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-xl p-6 md:p-8">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl">
        <h1 className="text-2xl font-semibold text-white">Change Password</h1>
        <p className="mt-2 text-sm text-slate-300">{roleLabel} account security settings</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate autoComplete="off">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor="old-password">
              Old password
            </label>
            <input
              id="old-password"
              name="old-password-input"
              type="password"
              autoComplete="new-password"
              className={`w-full rounded-lg border bg-slate-950 px-4 py-3 text-white ${
                error ? "border-red-500! focus:border-red-500!" : "border-slate-700"
              }`}
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              name="new-password-input"
              type="password"
              autoComplete="new-password"
              className={`w-full rounded-lg border bg-slate-950 px-4 py-3 text-white ${
                error ? "border-red-500! focus:border-red-500!" : "border-slate-700"
              }`}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor="confirm-password">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              name="confirm-password-input"
              type="password"
              autoComplete="new-password"
              className={`w-full rounded-lg border bg-slate-950 px-4 py-3 text-white ${
                error ? "border-red-500! focus:border-red-500!" : "border-slate-700"
              }`}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="text-sm font-semibold text-red-400" aria-live="polite">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="text-sm font-semibold text-emerald-400" aria-live="polite">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 py-3 font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Confirming..." : "Confirm"}
          </button>
        </form>
      </div>
    </section>
  );
}
