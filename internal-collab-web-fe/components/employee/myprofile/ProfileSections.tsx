"use client";

import Image from "next/image";
import type React from "react";
import type { RefObject } from "react";
import type { EmployeeProfile } from "@/types/employee";

type ProfileSummaryCardProps = {
    editing: boolean;
    loading: boolean;
    saving: boolean;
    profile: EmployeeProfile | null;
    displayName: string;
    departmentName: string;
    statusLabel: string;
    initials: string;
    managerDisplay: string;
    formAvatar: string;
    formPhone: string;
    formAddress: string;
    saveMessage: string | null;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onPhoneChange: (value: string) => void;
    onAddressChange: (value: string) => void;
    onAvatarChange: (value: string) => void;
    onAvatarFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    formatDate: (value?: string | null) => string;
};

type DisplayField = {
    label: string;
    value: string;
};

type InfoSectionCardProps = {
    title: string;
    badge?: string;
    fields: DisplayField[];
    compact?: boolean;
};

export function ProfileSummaryCard({
    editing,
    loading,
    saving,
    profile,
    displayName,
    departmentName,
    statusLabel,
    initials,
    managerDisplay,
    formAvatar,
    formPhone,
    formAddress,
    saveMessage,
    fileInputRef,
    onStartEdit,
    onCancelEdit,
    onSubmit,
    onPhoneChange,
    onAddressChange,
    onAvatarChange,
    onAvatarFileChange,
    formatDate,
}: ProfileSummaryCardProps) {
    const showAvatar = formAvatar || profile?.avatar_url || "";

    return (
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
                        {showAvatar ? (
                            <Image
                                src={showAvatar}
                                alt="Avatar"
                                width={112}
                                height={112}
                                unoptimized
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
                            onChange={onAvatarFileChange}
                        />
                        {editing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-semibold text-white">Change photo</div>
                        )}
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-semibold text-slate-900">{displayName}</p>
                        <p className="text-sm font-semibold text-blue-600">{profile?.position || "-"}</p>
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
                            onClick={onStartEdit}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                            disabled={loading || !profile}
                        >
                            <span>&#9998;</span> Edit profile
                        </button>
                    ) : (
                        <span>Editing</span>
                    )}
                    {saveMessage && <span className="text-emerald-600">{saveMessage}</span>}
                </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-700">
                <DetailRow label="Email" value={profile?.email || "-"} />
                <DetailRow label="Phone" value={profile?.phone || "-"} />
                <DetailRow label="Address" value={profile?.address || "-"} alignStart />
                <DetailRow label="Join date" value={formatDate(profile?.join_date)} />
                <DetailRow label="Manager" value={managerDisplay} />
                <DetailRow label="Birthday" value={formatDate(profile?.date_of_birth)} />
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
                {editing && (
                    <ProfileEditForm
                        saving={saving}
                        formPhone={formPhone}
                        formAddress={formAddress}
                        formAvatar={formAvatar}
                        fileInputRef={fileInputRef}
                        onSubmit={onSubmit}
                        onCancel={onCancelEdit}
                        onPhoneChange={onPhoneChange}
                        onAddressChange={onAddressChange}
                        onAvatarChange={onAvatarChange}
                    />
                )}
            </div>
        </div>
    );
}

function ProfileEditForm({
    saving,
    formPhone,
    formAddress,
    formAvatar,
    fileInputRef,
    onSubmit,
    onCancel,
    onPhoneChange,
    onAddressChange,
    onAvatarChange,
}: {
    saving: boolean;
    formPhone: string;
    formAddress: string;
    formAvatar: string;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
    onPhoneChange: (value: string) => void;
    onAddressChange: (value: string) => void;
    onAvatarChange: (value: string) => void;
}) {
    return (
        <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Phone</p>
                <input
                    required
                    value={formPhone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500"
                    placeholder="e.g. +84 912 345 678"
                />
            </div>
            <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Address</p>
                <input
                    required
                    value={formAddress}
                    onChange={(e) => onAddressChange(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500"
                    placeholder="Current address"
                />
            </div>
            <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Avatar URL</p>
                <input
                    value={formAvatar}
                    onChange={(e) => onAvatarChange(e.target.value)}
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
                        onClick={onCancel}
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
    );
}

function DetailRow({ label, value, alignStart = false }: { label: string; value: string; alignStart?: boolean }) {
    return (
        <div className={`flex gap-3 ${alignStart ? "items-start" : "items-center"}`}>
            <span className="text-slate-400">*</span>
            <span className="font-semibold">{label}</span>
            <span className="text-slate-500">{value}</span>
        </div>
    );
}

export function InfoSectionCard({ title, badge, fields, compact = false }: InfoSectionCardProps) {
    return (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                {badge && <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">{badge}</span>}
            </div>
            <div className={compact ? "mt-6 grid gap-4 sm:grid-cols-2" : "mt-6 grid gap-6 sm:grid-cols-2"}>
                {fields.map((field) => (
                    <div
                        key={field.label}
                        className={compact ? "space-y-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3" : "space-y-1"}
                    >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{field.label}</p>
                        <p className="text-sm font-semibold text-slate-900">{field.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

