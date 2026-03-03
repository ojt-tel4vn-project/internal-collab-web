"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateLoginPayload } from "@/app/schemas/shcema.login";
import { getChangePasswordPathForRoles, getHomePathForRoles } from "@/libs/auth";

type LoginResponse = {
  require_password_change: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    employee_code: string;
    status: string;
    roles: string[];
  } | null;
};

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const validation = validateLoginPayload({ email, password });
    if (!validation.isValid) {
      setError(validation.message ?? "Invalid login information.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          Accept: "application/json, application/problem+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Invalid email or password.");
          return;
        }

        let message = "Login failed. Please try again.";
        try {
          const errorData = await response.json();
          if (typeof errorData?.detail === "string") {
            message = errorData.detail;
          } else if (typeof errorData?.message === "string") {
            message = errorData.message;
          }
        } catch {
          // Ignore JSON parse errors and use default message.
        }

        setError(message);
        return;
      }

      const data: LoginResponse = await response.json();

      if ((data.user?.status ?? "").toLowerCase() !== "active") {
        setError("Your account is inactive. Please contact your administrator.");
        return;
      }

      const homePath = getHomePathForRoles(data.user?.roles ?? []);
      if (!homePath) {
        setError("Your account does not have a valid role.");
        return;
      }

      if (data.require_password_change) {
        const changePasswordPath = getChangePasswordPathForRoles(data.user?.roles ?? []);
        if (!changePasswordPath) {
          setError("Your account does not have a valid role.");
          return;
        }

        sessionStorage.setItem("force_change_old_password", password);
        router.push(`${changePasswordPath}?forced=1`);
        return;
      }

      router.push(homePath);
    } catch {
      setError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2">
        <div className="outline-black outline-2 h-screen relative">
          <Image
            src="https://www.betterup.com/hubfs/Happy-collegues-working-on-project-together-workplace-environments.jpg"
            alt="Workplace"
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
          <div className="absolute top-10 left-10 max-w-lg p-6">
            <h3
              className="text-3xl font-bold mb-3 tracking-tight"
              style={{ color: "blue" }}
            >
              Empowering Our People
            </h3>
            <p className="text-lg font-light leading-relaxed" style={{ color: "white" }}>
              Connect, collaborate, and grow with the tools designed to support
              your journey.
            </p>
          </div>
        </div>

        <div className="flex flex-col h-screen px-14 py-10">
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

          <div className="flex-1 flex flex-col justify-center max-w-md m-auto w-full">
            <h1 className="text-3xl font-bold mb-3">Welcome Back</h1>
            <p className="text-slate-500 mb-8">
              Access your personalized dashboard to manage leave requests, track
              time, and celebrate team achievements.
            </p>

            <form className="space-y-4" onSubmit={handleLogin} noValidate>
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

              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="********"
                className={`w-full rounded-lg border px-4 py-3 ${
                  error ? "border-red-500! focus:border-red-500!" : ""
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error ? (
                <p
                  className="text-sm font-semibold text-red-500!"
                  style={{ color: "#ef4444" }}
                  aria-live="polite"
                >
                  {error}
                </p>
              ) : null}

              <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot Password?
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-800 text-white py-3 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in to Portal"}
              </button>
            </form>
          </div>

          <div className="text-xs text-slate-400">
            (c) 2026 CollabHub Inc. · Privacy Policy · Terms
          </div>
        </div>
      </div>
    </>
  );
}
