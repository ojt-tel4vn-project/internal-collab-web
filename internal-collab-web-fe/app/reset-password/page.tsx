"use client";

import Image from "next/image";
import Link from "next/link";
import { type SubmitEventHandler, useEffect, useState } from "react";
import { logErrorToConsole, toUserFriendlyErrorMessage } from "@/lib/api/errors";

function readApiMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as { detail?: unknown; message?: unknown; title?: unknown };
  if (typeof data.detail === "string" && data.detail.trim()) {
    return toUserFriendlyErrorMessage(data.detail, "We couldn't reset the password right now.");
  }
  if (typeof data.message === "string" && data.message.trim()) {
    return toUserFriendlyErrorMessage(data.message, "We couldn't reset the password right now.");
  }
  if (typeof data.title === "string" && data.title.trim()) {
    return toUserFriendlyErrorMessage(data.title, "We couldn't reset the password right now.");
  }

  return null;
}

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setToken((new URLSearchParams(window.location.search).get("token") ?? "").trim());
  }, []);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is missing or invalid.");
      return;
    }

    if (!newPassword.trim()) {
      setError("New password is required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          Accept: "application/json, application/problem+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_password: newPassword,
          token,
        }),
      });

      let responseData: unknown = null;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        setError(readApiMessage(responseData) ?? "Unable to reset password. Please try again.");
        return;
      }

      setSuccess(readApiMessage(responseData) ?? "Password reset successful. You can sign in now.");
      setNewPassword("");
    } catch (error) {
      logErrorToConsole("ResetPasswordPage.handleSubmit", error, { hasToken: Boolean(token) });
      setError("The system is temporarily unavailable. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      <div className="relative hidden lg:block">
        <Image
          src="https://www.betterup.com/hubfs/Happy-collegues-working-on-project-together-workplace-environments.jpg"
          alt="Workplace"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute top-10 left-10 max-w-lg p-6">
          <h3 className="text-3xl font-bold mb-3 tracking-tight text-blue-600">Create New Password</h3>
          <p className="text-lg font-light leading-relaxed text-white">
            Set a new secure password to regain access to your account.
          </p>
        </div>
      </div>

      <div className="flex flex-col px-8 py-10 sm:px-14">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl ring-1 ring-blue-200 shadow-[0_0_18px_rgba(37,99,235,0.22)]">
            <Image
              src="/Logo.webp"
              alt="Logo"
              width={34}
              height={34}
              className="drop-shadow-[0_2px_8px_rgba(37,99,235,0.35)]"
            />
          </div>
          <span className="text-lg font-semibold">CollabHub</span>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-3">Reset Password</h1>
          <p className="text-slate-500 mb-8">Enter your new password and confirm reset.</p>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="text-sm font-medium" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              className={`w-full rounded-lg border px-4 py-3 ${
                error ? "border-red-500! focus:border-red-500!" : ""
              }`}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={!token || loading}
            />

            {!token ? (
              <p className="text-sm font-semibold text-red-600" aria-live="polite">
                Reset token is missing from the URL.
              </p>
            ) : null}

            {error ? (
              <p className="text-sm font-semibold text-red-600" aria-live="polite">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="text-sm font-semibold text-emerald-600" aria-live="polite">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-blue-800 text-white py-3 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>

            <Link href="/" className="inline-block text-sm text-blue-600 hover:underline">
              Back to sign in
            </Link>
          </form>
        </div>

        <div className="text-xs text-slate-400">(c) 2026 CollabHub Inc. · Privacy Policy · Terms</div>
      </div>
    </div>
  );
}
