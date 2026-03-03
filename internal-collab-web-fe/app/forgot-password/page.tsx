"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          Accept: "application/json, application/problem+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      let responseData: unknown = null;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        setError(readApiMessage(responseData) ?? "Unable to send reset email. Please try again.");
        return;
      }

      setSuccess(
        readApiMessage(responseData) ??
          "If your email exists in the system, password reset instructions have been sent.",
      );
    } catch {
      setError("Unable to connect to the server. Please try again later.");
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
          <h3 className="text-3xl font-bold mb-3 tracking-tight text-blue-600">
            Reset Access Securely
          </h3>
          <p className="text-lg font-light leading-relaxed text-white">
            Enter your company email and we will send you instructions to restore access.
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
          <h1 className="text-3xl font-bold mb-3">Forgot Password</h1>
          <p className="text-slate-500 mb-8">
            Please provide your work email address to receive password reset instructions.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="text-sm font-medium" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              className={`w-full rounded-lg border px-4 py-3 ${
                error ? "border-red-500! focus:border-red-500!" : ""
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

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
              disabled={loading}
              className="w-full bg-blue-800 text-white py-3 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send reset instructions"}
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
