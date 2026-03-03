"use client";

import { useEffect, useRef, useState } from "react";
import type { EmployeeProfile, UpdateEmployeeProfileResponse } from "@/types/employee";
import { EmployeeSideNav } from "@/components/navigation/EmployeeSideNav";

function formatDate(value?: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value?: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function MyProfilePage() {
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [formAddress, setFormAddress] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formAvatar, setFormAvatar] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    async function fetchProfile() {
        try {
            const response = await fetch("/api/employees/me", {
                headers: {
                    Accept: "application/json, application/problem+json",
                },
                cache: "no-store",
                credentials: "include",
            });

            if (!response.ok) {
                setError(`Request failed (${response.status})`);
                return;
            }

            const data = (await response.json()) as EmployeeProfile;
            setProfile(data);
            setError(null);
        } catch {
            setError("Network error");
        }
    }

    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!profile) return;
        setFormAddress(profile.address || "");
        setFormPhone(profile.phone || "");
        setFormAvatar(profile.avatar_url || "");
    }, [profile]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setSaveMessage(null);

        try {
            const response = await fetch("/api/employees/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json, application/problem+json",
                },
                body: JSON.stringify({
                    address: formAddress,
                    phone: formPhone,
                    avatar_url: formAvatar,
                }),
                credentials: "include",
            });

            const data = (await response.json().catch(() => null)) as UpdateEmployeeProfileResponse | null;

            if (!response.ok) {
                setSaveMessage(data?.message || `Update failed (${response.status})`);
                return;
            }

            setSaveMessage(data?.message || "Profile updated.");
            await fetchProfile();
            setEditing(false);
        } catch {
            setSaveMessage("Network error while updating.");
        } finally {
            setSaving(false);
        }
    }

    if (!profile) {
        return (
            <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
                <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                    <EmployeeSideNav />
                    <section className="flex-1 space-y-4">
                        <h1 className="text-2xl font-bold">My Profile</h1>
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <p className="text-sm text-slate-600">
                                {error ? `Unable to load profile. ${error}` : "Loading profile..."}
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        );
    }

    const displayName = profile.full_name || `${profile.first_name} ${profile.last_name}`.trim() || "Employee";
    const initials = getInitials(displayName) || "--";
    const departmentName = profile.department?.name || "—";
    const managerName = profile.manager?.full_name || "—";
    const statusLabel = profile.status || "—";

    const personalFields = [
        { label: "Employee Code", value: profile.employee_code || "—" },
        { label: "Email Address", value: profile.email || "—" },
        { label: "Department", value: departmentName },
        { label: "Job Title", value: profile.position || "—" },
        { label: "Date of Birth", value: formatDate(profile.date_of_birth) },
        { label: "Start Date", value: formatDate(profile.join_date) },
        { label: "Manager", value: managerName },
        { label: "Employment Status", value: statusLabel },
        { label: "Phone", value: profile.phone || "—" },
        { label: "Address", value: profile.address || "—" },
    ];

    const activityFields = [
        { label: "Last Login", value: formatDateTime(profile.last_login_at) },
        { label: "Profile Created", value: formatDateTime(profile.created_at) },
        { label: "Last Updated", value: formatDateTime(profile.updated_at) },
        { label: "Leave Date", value: formatDate(profile.leave_date) },
    ];

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <EmployeeSideNav />

                <section className="flex-1 space-y-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold">My Profile</h1>
                        <p className="text-sm text-slate-500">Manage your account settings and view personal statistics.</p>
                    </div>

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
                                            title={editing ? "Chọn ảnh từ máy" : undefined}
                                        >
                                            {formAvatar || profile.avatar_url ? (
                                                <img
                                                    src={formAvatar || profile.avatar_url || ""}
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
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs font-semibold">Chọn ảnh</div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-semibold text-slate-900">{displayName}</p>
                                            <p className="text-sm font-semibold text-blue-600">{profile.position || "—"}</p>
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
                                            >
                                                <span>✎</span> Edit profile
                                            </button>
                                        ) : (
                                            <span>Edit mode</span>
                                        )}
                                        {saveMessage && <span className="text-emerald-600">{saveMessage}</span>}
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3 text-sm text-slate-700">
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400">✶</span>
                                        <span className="font-semibold">Email</span>
                                        <span className="text-slate-500">{profile.email || "—"}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400">✶</span>
                                        <span className="font-semibold">Joined</span>
                                        <span className="text-slate-500">{formatDate(profile.join_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400">✶</span>
                                        <span className="font-semibold">Manager</span>
                                        <span className="text-slate-500">{managerName}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400">✶</span>
                                        <span className="font-semibold">Birthday</span>
                                        <span className="text-slate-500">{formatDate(profile.date_of_birth)}</span>
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-slate-100 pt-4">
                                    {editing && (
                                        <form className="space-y-4" onSubmit={handleSave}>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Phone</p>
                                                <input
                                                    value={formPhone}
                                                    onChange={(e) => setFormPhone(e.target.value)}
                                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500"
                                                    placeholder="e.g. +84 912 345 678"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Address</p>
                                                <input
                                                    value={formAddress}
                                                    onChange={(e) => setFormAddress(e.target.value)}
                                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500"
                                                    placeholder="Your address"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Avatar (upload or URL)</p>
                                                <input
                                                    value={formAvatar}
                                                    onChange={(e) => setFormAvatar(e.target.value)}
                                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500"
                                                    placeholder="Paste URL or pick a file"
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
                                                            setFormAddress(profile.address || "");
                                                            setFormPhone(profile.phone || "");
                                                            setFormAvatar(profile.avatar_url || "");
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
                                    <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
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
                                        To update your personal details or employment information, please contact the HR Department directly or submit a ticket via the Help Desk.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-slate-900">Account Activity</h2>
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
                </section>
            </div>
        </main>
    );
}
