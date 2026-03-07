"use client";

import type React from "react";
import { type SubmitEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmployeeSideNav } from "@/components/navigation/EmployeeSideNav";
import type { EmployeeProfile, UpdateEmployeeProfilePayload } from "@/types/employee";
import { InfoSectionCard, ProfileSummaryCard } from "@/components/employee/myprofile/ProfileSections";

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

function formatDate(value?: string | null) {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return dateFormatter.format(parsed);
}

function formatDateTime(value?: string | null) {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
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
    const departmentName = profile?.department?.name || "-";
    const managerName = profile?.manager?.full_name || profile?.manager?.name || "-";
    const managerId = profile?.manager?.id ?? profile?.manager_id;
    const managerDisplay = managerId && managerName !== "-" ? `${managerName} (#${managerId})` : managerName;
    const statusLabel = profile?.status ? profile.status.replace(/_/g, " ") : "Unknown";

    const personalFields = useMemo(
        () => [
            { label: "Employee Code", value: profile?.employee_code || "-" },
            { label: "Department", value: departmentName },
            { label: "Position", value: profile?.position || "-" },
            { label: "Joined", value: formatDate(profile?.join_date) },
            { label: "Birthday", value: formatDate(profile?.date_of_birth) },
        ],
        [profile?.employee_code, departmentName, profile?.position, profile?.join_date, profile?.date_of_birth],
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
            const res = await fetch("/api/employee/me", { cache: "no-store" });
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

    const handleAvatarFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result?.toString() || "";
            setFormAvatar(result);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleSave: SubmitEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        if (!profile) return;

        setSaving(true);
        setSaveMessage(null);
        setError(null);

        const trimmedPhone = formPhone.trim();
        const trimmedAddress = formAddress.trim();
        const trimmedAvatar = formAvatar.trim();
        const currentPhone = (profile.phone || "").trim();
        const currentAddress = (profile.address || "").trim();
        const currentAvatar = (profile.avatar_url || "").trim();

        const noChanges =
            trimmedPhone === currentPhone &&
            trimmedAddress === currentAddress &&
            trimmedAvatar === currentAvatar;

        if (noChanges) {
            setEditing(false);
            setSaving(false);
            return;
        }

        if (trimmedAvatar) {
            try {
                new URL(trimmedAvatar);
            } catch {
                setError("Avatar must be a valid URL.");
                setSaving(false);
                return;
            }

            if (trimmedAvatar.length > 500) {
                setError("Avatar URL is too long (max 500 characters).");
                setSaving(false);
                return;
            }
        }

        const payload: UpdateEmployeeProfilePayload = {
            phone: trimmedPhone,
            address: trimmedAddress,
            avatar_url: trimmedAvatar,
        };

        try {
            const res = await fetch("/api/employee/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const raw = await res.text().catch(() => "");
                let message = `Could not save changes (HTTP ${res.status})`;

                if (raw) {
                    try {
                        const parsed = JSON.parse(raw) as {
                            message?: string;
                            detail?: string;
                            title?: string;
                            error?: string;
                            errors?: Array<{ message?: string }>;
                        };
                        if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
                            message = parsed.errors[0]?.message || parsed.message || parsed.detail || parsed.title || parsed.error || message;
                        } else {
                            message = parsed.message || parsed.detail || parsed.title || parsed.error || message;
                        }
                    } catch {
                        message = raw.slice(0, 200);
                    }
                }

                throw new Error(message);
            }

            setSaveMessage("Changes saved");
            setEditing(false);
            setProfile((prev) =>
                prev
                    ? {
                        ...prev,
                        phone: trimmedPhone,
                        address: trimmedAddress,
                        avatar_url: trimmedAvatar || null,
                    }
                    : prev,
            );
            setFormPhone(trimmedPhone);
            setFormAddress(trimmedAddress);
            setFormAvatar(trimmedAvatar);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            setError(message);
        } finally {
            setSaving(false);
        }
    };

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
                            <ProfileSummaryCard
                                editing={editing}
                                loading={loading}
                                saving={saving}
                                profile={profile}
                                displayName={displayName}
                                departmentName={departmentName}
                                statusLabel={statusLabel}
                                initials={initials}
                                managerDisplay={managerDisplay}
                                formAvatar={formAvatar}
                                formPhone={formPhone}
                                formAddress={formAddress}
                                saveMessage={saveMessage}
                                fileInputRef={fileInputRef}
                                onStartEdit={() => setEditing(true)}
                                onCancelEdit={() => {
                                    setEditing(false);
                                    setSaveMessage(null);
                                    setFormAddress(profile?.address || "");
                                    setFormPhone(profile?.phone || "");
                                    setFormAvatar(profile?.avatar_url || "");
                                }}
                                onSubmit={handleSave}
                                onPhoneChange={setFormPhone}
                                onAddressChange={setFormAddress}
                                onAvatarChange={setFormAvatar}
                                onAvatarFileChange={handleAvatarFileChange}
                                formatDate={formatDate}
                            />
                        </div>

                        <div className="space-y-4">
                            <InfoSectionCard title="Personal information" badge="Read-only" fields={personalFields} />

                            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    <span className="text-slate-500">i</span>
                                    <p>To change employment or contract details, please contact HR.</p>
                                </div>
                            </div>

                            <InfoSectionCard title="Account activity" fields={activityFields} compact />
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


