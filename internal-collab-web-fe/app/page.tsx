"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { validateLoginPayload } from "@/app/schemas/shcema.login";

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  require_password_change: boolean;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    employee_code: string;
    status: string;
  };
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

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("token_type", data.token_type);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/employee/myprofile");
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
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-200 text-white shadow-lg">
              <Image src="/Logo.webp" alt="Logo" width={90} height={90} />
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
                  error ? "!border-red-500 focus:!border-red-500" : ""
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
                  error ? "!border-red-500 focus:!border-red-500" : ""
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error ? (
                <p
                  className="text-sm font-semibold !text-red-500"
                  style={{ color: "#ef4444" }}
                  aria-live="polite"
                >
                  {error}
                </p>
              ) : null}

              <a href="#" className="text-sm text-blue-600 hover:underline">
                Forgot Password?
              </a>
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
            © 2026 CollabHub Inc. · Privacy Policy · Terms
          </div>
        </div>
      </div>
    </>
  );
}
