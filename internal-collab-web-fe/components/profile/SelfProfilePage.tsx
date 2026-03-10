"use client";

import type React from "react";
import { type ReactNode, type SubmitEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InfoSectionCard, ProfileSummaryCard } from "@/components/profile/ProfileSections";
import type { EmployeeProfile, UpdateEmployeeProfilePayload } from "@/types/employee";

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

type SelfProfilePageProps = {
    sideNav: ReactNode;
    defaultName: string;
    noteText: string;
};

type ApiMessagePayload = {
    detail?: unknown;
    message?: unknown;
    title?: unknown;
    error?: unknown;
    avatar_url?: unknown;
};

const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PROCESSED_AVATAR_SIZE = 5 * 1024 * 1024;
const MAX_SOURCE_AVATAR_SIZE = 12 * 1024 * 1024;
const TARGET_AVATAR_SIZE = 512;

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

function extractApiMessage(payload: unknown) {
    if (!payload || typeof payload !== "object") {
        return null;
    }

    const data = payload as ApiMessagePayload;
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    if (typeof data.detail === "string" && data.detail.trim()) return data.detail;
    if (typeof data.title === "string" && data.title.trim()) return data.title;
    if (typeof data.error === "string" && data.error.trim()) return data.error;

    return null;
}

async function readErrorMessage(response: Response, fallback: string) {
    const raw = await response.text().catch(() => "");
    if (!raw) {
        return fallback;
    }

    try {
        const payload = JSON.parse(raw) as unknown;
        return extractApiMessage(payload) ?? fallback;
    } catch {
        return raw.slice(0, 200);
    }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new window.Image();
        const objectUrl = URL.createObjectURL(file);

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Selected image could not be processed."));
        };

        image.src = objectUrl;
    });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Unable to prepare avatar image."));
                return;
            }

            resolve(blob);
        }, mimeType, quality);
    });
}

async function processAvatarFile(file: File) {
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
        throw new Error("Avatar must be a JPG, PNG, or WEBP image.");
    }

    if (file.size > MAX_SOURCE_AVATAR_SIZE) {
        throw new Error("Avatar source file must be under 12 MB.");
    }

    const image = await loadImageFromFile(file);
    const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
    const offsetX = Math.max(0, (image.naturalWidth - cropSize) / 2);
    const offsetY = Math.max(0, (image.naturalHeight - cropSize) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = TARGET_AVATAR_SIZE;
    canvas.height = TARGET_AVATAR_SIZE;

    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Your browser does not support avatar processing.");
    }

    context.drawImage(
        image,
        offsetX,
        offsetY,
        cropSize,
        cropSize,
        0,
        0,
        TARGET_AVATAR_SIZE,
        TARGET_AVATAR_SIZE,
    );

    const mimeType = file.type;
    let blob = await canvasToBlob(canvas, mimeType, mimeType === "image/png" ? undefined : 0.9);
    if (blob.size > MAX_PROCESSED_AVATAR_SIZE && mimeType !== "image/png") {
        blob = await canvasToBlob(canvas, mimeType, 0.78);
    }

    if (blob.size > MAX_PROCESSED_AVATAR_SIZE) {
        throw new Error("Processed avatar must be under 5 MB.");
    }

    const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
    const normalizedFile = new File([blob], `avatar.${extension}`, { type: mimeType });
    const previewSrc = canvas.toDataURL(mimeType, mimeType === "image/png" ? undefined : 0.92);

    return {
        file: normalizedFile,
        previewSrc,
    };
}

export default function SelfProfilePage({
    sideNav,
    defaultName,
    noteText,
}: SelfProfilePageProps) {
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const [formPhone, setFormPhone] = useState("");
    const [formAddress, setFormAddress] = useState("");
    const [formAvatar, setFormAvatar] = useState("");
    const [avatarPreviewSrc, setAvatarPreviewSrc] = useState("");
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const initials = useMemo(() => {
        const name = profile?.full_name?.trim();
        if (!name) return defaultName.slice(0, 1).toUpperCase();
        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("")
            .padEnd(2, "");
    }, [defaultName, profile?.full_name]);

    const displayName = profile?.full_name || defaultName;
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

    const resetForm = useCallback((nextProfile: EmployeeProfile | null) => {
        setFormPhone(nextProfile?.phone || "");
        setFormAddress(nextProfile?.address || "");
        setFormAvatar(nextProfile?.avatar_url || "");
        setAvatarPreviewSrc("");
        setPendingAvatarFile(null);
    }, []);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/employee/me", { cache: "no-store" });
            if (!res.ok) {
                throw new Error(await readErrorMessage(res, "Unable to load profile."));
            }

            const data = (await res.json()) as EmployeeProfile;
            setProfile(data);
            resetForm(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [resetForm]);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    const handleAvatarFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);
        setSaveMessage(null);

        void (async () => {
            try {
                const processed = await processAvatarFile(file);
                setPendingAvatarFile(processed.file);
                setAvatarPreviewSrc(processed.previewSrc);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unable to process avatar.";
                setPendingAvatarFile(null);
                setAvatarPreviewSrc("");
                setError(message);
            } finally {
                if (event.target) {
                    event.target.value = "";
                }
            }
        })();
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
        const directAvatarChanged = !pendingAvatarFile && trimmedAvatar !== currentAvatar;

        const noChanges =
            trimmedPhone === currentPhone &&
            trimmedAddress === currentAddress &&
            !directAvatarChanged &&
            !pendingAvatarFile;

        if (noChanges) {
            setEditing(false);
            setSaving(false);
            return;
        }

        if (pendingAvatarFile && pendingAvatarFile.size > MAX_PROCESSED_AVATAR_SIZE) {
            setError("Avatar file must be under 5 MB.");
            setSaving(false);
            return;
        }

        if (directAvatarChanged && trimmedAvatar) {
            try {
                new URL(trimmedAvatar);
            } catch {
                setError("Avatar URL must be a valid URL.");
                setSaving(false);
                return;
            }

            if (trimmedAvatar.length > 500) {
                setError("Avatar URL is too long (max 500 characters).");
                setSaving(false);
                return;
            }
        }

        try {
            let nextAvatarUrl = currentAvatar;
            let statusMessage = "Changes saved.";

            if (pendingAvatarFile) {
                const uploadFormData = new FormData();
                uploadFormData.append("avatar", pendingAvatarFile);

                const uploadResponse = await fetch("/api/employee/me", {
                    method: "POST",
                    body: uploadFormData,
                });

                if (!uploadResponse.ok) {
                    throw new Error(await readErrorMessage(uploadResponse, "Unable to upload avatar."));
                }

                const uploadPayload = (await uploadResponse.json()) as ApiMessagePayload;
                if (typeof uploadPayload.avatar_url !== "string" || !uploadPayload.avatar_url.trim()) {
                    throw new Error("Avatar upload succeeded but no avatar URL was returned.");
                }

                nextAvatarUrl = uploadPayload.avatar_url.trim();
                statusMessage = extractApiMessage(uploadPayload) ?? statusMessage;

                setProfile((prev) => (prev ? { ...prev, avatar_url: nextAvatarUrl } : prev));
                setFormAvatar(nextAvatarUrl);
                setAvatarPreviewSrc("");
                setPendingAvatarFile(null);
            }

            const payload: UpdateEmployeeProfilePayload = {};
            if (trimmedPhone !== currentPhone) payload.phone = trimmedPhone;
            if (trimmedAddress !== currentAddress) payload.address = trimmedAddress;
            if (directAvatarChanged) payload.avatar_url = trimmedAvatar;

            if (Object.keys(payload).length > 0) {
                const res = await fetch("/api/employee/me", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    throw new Error(await readErrorMessage(res, "Unable to update profile."));
                }

                const updatePayload = (await res.json().catch(() => null)) as unknown;
                statusMessage = extractApiMessage(updatePayload) ?? statusMessage;
                if (directAvatarChanged) {
                    nextAvatarUrl = trimmedAvatar;
                }
            }

            setProfile((prev) =>
                prev
                    ? {
                        ...prev,
                        phone: trimmedPhone,
                        address: trimmedAddress,
                        avatar_url: nextAvatarUrl || null,
                    }
                    : prev,
            );
            setFormPhone(trimmedPhone);
            setFormAddress(trimmedAddress);
            setFormAvatar(nextAvatarUrl);
            setAvatarPreviewSrc("");
            setPendingAvatarFile(null);
            setSaveMessage(statusMessage);
            setEditing(false);
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
                {sideNav}

                <section className="flex-1 space-y-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold">My Profile</h1>
                        <p className="text-sm text-slate-500">Manage your personal info, contact details, and profile photo.</p>
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
                                avatarPreviewSrc={avatarPreviewSrc}
                                formAvatar={formAvatar}
                                formPhone={formPhone}
                                formAddress={formAddress}
                                saveMessage={saveMessage}
                                fileInputRef={fileInputRef}
                                onStartEdit={() => setEditing(true)}
                                onCancelEdit={() => {
                                    setEditing(false);
                                    setSaveMessage(null);
                                    resetForm(profile);
                                }}
                                onSubmit={handleSave}
                                onPhoneChange={setFormPhone}
                                onAddressChange={setFormAddress}
                                onAvatarChange={(value) => {
                                    setPendingAvatarFile(null);
                                    setAvatarPreviewSrc("");
                                    setFormAvatar(value);
                                }}
                                onAvatarFileChange={handleAvatarFileChange}
                                formatDate={formatDate}
                            />
                        </div>

                        <div className="space-y-4">
                            <InfoSectionCard title="Personal information" badge="Read-only" fields={personalFields} />

                            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    <span className="text-slate-500">i</span>
                                    <p>{noteText}</p>
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
