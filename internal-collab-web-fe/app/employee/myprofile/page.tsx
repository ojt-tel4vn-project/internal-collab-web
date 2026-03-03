"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmployeeSideNav } from "@/components/navigation/EmployeeSideNav";
import type { EmployeeProfile, UpdateEmployeeProfilePayload } from "@/types/employee";

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

function formatDate(value?: string | null) {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return dateFormatter.format(parsed);
}

function formatDateTime(value?: string | null) {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return dateTimeFormatter.format(parsed);
}

export default function MyProfilePage() {
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const [formPhone, setFormPhone] = useState("");
    const [formAddress, setFormAddress] = useState("");
    const [formAvatar, setFormAvatar] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const initials = useMemo(() => {
        const name = profile?.full_name?.trim();
        if (!name) return "?";
        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("")
            .padEnd(2, "");
    }, [profile?.full_name]);

    const displayName = profile?.full_name || "Employee";
    const departmentName = profile?.department?.name || "—";
    const managerName = profile?.manager?.full_name || "—";
    const statusLabel = profile?.status ? profile.status.replace(/_/g, " ") : "Unknown";

    const personalFields = useMemo(
        () => [
            { label: "Employee Code", value: profile?.employee_code || "—" },
            { label: "Email", value: profile?.email || "—" },
            { label: "Department", value: departmentName },
            { label: "Position", value: profile?.position || "—" },
            { label: "Joined", value: formatDate(profile?.join_date) },
            { label: "Birthday", value: formatDate(profile?.date_of_birth) },
        ],
        [profile?.employee_code, profile?.email, departmentName, profile?.position, profile?.join_date, profile?.date_of_birth],
    );

    const activityFields = useMemo(
        () => [
            { label: "Status", value: statusLabel },
            { label: "Last Login", value: formatDateTime(profile?.last_login_at) },
            { label: "Created At", value: formatDateTime(profile?.created_at) },
            { label: "Updated At", value: formatDateTime(profile?.updated_at) },
        ],
        [statusLabel, profile?.last_login_at, profile?.created_at, profile?.updated_at],
    );

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/employees/me", { cache: "no-store" });
            if (!res.ok) {
                throw new Error("Unable to load profile");
            }

            const data = (await res.json()) as EmployeeProfile;
            setProfile(data);
            setFormPhone(data.phone || "");
            setFormAddress(data.address || "");
            setFormAvatar(data.avatar_url || "");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    async function handleSave(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!profile) return;

        setSaving(true);
        setSaveMessage(null);
        setError(null);

        const payload: UpdateEmployeeProfilePayload = {
            phone: formPhone.trim() || undefined,
            address: formAddress.trim() || undefined,
            avatar_url: formAvatar.trim() || undefined,
        };

        try {
            const res = await fetch("/api/employees/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                const message = body?.message || "Không thể lưu thay đổi";
                throw new Error(message);
            }

            setSaveMessage("Đã lưu thay đổi");
            setEditing(false);
            await loadProfile();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            setError(message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <EmployeeSideNav />

                <section className="flex-1 space-y-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold">My Profile</h1>
                        <p className="text-sm text-slate-500">Manage your personal info and account settings.</p>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
                        <div className="space-y-4">
                            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col items-center gap-3">
                                        <div
                                            className={`relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-50 text-3xl font-bold text-slate-900 shadow-inner ${editing ? "cursor-pointer" : "cursor-default"}`}
                                            onClick={() => {
                                                if (!editing) return;
                                                fileInputRef.current?.click();
                                            }}
                                            title={editing ? "Choose a photo" : undefined}
                                        >
                                            {formAvatar || profile?.avatar_url ? (
                                                <img
                                                    src={formAvatar || profile?.avatar_url || ""}
                                                    alt="Avatar"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                initials
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        const result = reader.result?.toString() || "";
                                                        setFormAvatar(result);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }}
                                            />
                                            {editing && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs font-semibold">Change photo</div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-semibold text-slate-900">{displayName}</p>
                                            <p className="text-sm font-semibold text-blue-600">{profile?.position || "—"}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{departmentName}</span>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${statusLabel.toLowerCase() === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-700"}`}>
                                                <span className={`h-2 w-2 rounded-full ${statusLabel.toLowerCase() === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                {statusLabel}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 text-xs font-semibold text-slate-500">
                                        {!editing ? (
                                            <button
                                                type="button"
                                                onClick={() => setEditing(true)}
                                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                                                disabled={loading || !profile}
                                            >
                                                <span>✎</span> Edit profile
                                            </button>
                                        ) : (
                                            <span>Editing</span>
                                        )}
                                        {saveMessage && <span className="text-emerald-600">{saveMessage}</span>}
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3 text-sm text-slate-700">
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400">✶</span>
                                        <span className="font-semibold">Email</span>
                                        <span className="text-slate-500">{profile?.email || "—"}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400">✶</span>
                                        <span className="font-semibold">Join date</span>
                                        <span className="text-slate-500">{formatDate(profile?.join_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400">✶</span>
                                        <span className="font-semibold">Manager</span>
                                        <span className="text-slate-500">{managerName}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400">✶</span>
                                        <span className="font-semibold">Birthday</span>
                                        <span className="text-slate-500">{formatDate(profile?.date_of_birth)}</span>
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-slate-100 pt-4">
                                    {editing && (
                                        <form className="space-y-4" onSubmit={handleSave}>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Phone</p>
                                                <input
                                                    required
                                                    value={formPhone}
                                                    onChange={(e) => setFormPhone(e.target.value)}
                                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500"
                                                    placeholder="e.g. +84 912 345 678"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Address</p>
                                                <input
                                                    required
                                                    value={formAddress}
                                                    onChange={(e) => setFormAddress(e.target.value)}
                                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500"
                                                    placeholder="Current address"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Avatar (upload or URL)</p>
                                                <input
                                                    value={formAvatar}
                                                    onChange={(e) => setFormAvatar(e.target.value)}
                                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500"
                                                    placeholder="Paste image URL"
                                                />
                                                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="rounded-full border border-slate-200 px-3 py-1 hover:border-blue-300 hover:text-blue-600"
                                                    >
                                                        Upload from device
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditing(false);
                                                            setSaveMessage(null);
                                                            setFormAddress(profile?.address || "");
                                                            setFormPhone(profile?.phone || "");
                                                            setFormAvatar(profile?.avatar_url || "");
                                                        }}
                                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={saving}
                                                        className={`rounded-xl px-5 py-3 text-sm font-semibold text-white shadow ${saving ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"}`}
                                                    >
                                                        {saving ? "Saving..." : "Save"}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-slate-900">Personal information</h2>
                                    <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">Read-only</span>
                                </div>

                                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                                    {personalFields.map((field) => (
                                        <div key={field.label} className="space-y-1">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{field.label}</p>
                                            <p className="text-sm font-semibold text-slate-900">{field.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    <span className="text-slate-500">ⓘ</span>
                                    <p>
                                        To change employment or contract details, please contact HR or submit a Help Desk ticket.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-slate-900">Account activity</h2>
                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    {activityFields.map((field) => (
                                        <div key={field.label} className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{field.label}</p>
                                            <p className="text-sm font-semibold text-slate-900">{field.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading && (
                        <div className="text-sm text-slate-500">Loading profile...</div>
                    )}
                </section>
            </div>
        </main>
    );
}
