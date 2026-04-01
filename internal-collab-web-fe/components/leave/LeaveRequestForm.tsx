"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { logErrorToConsole, parseApiErrorMessage, toUserFriendlyError } from "@/lib/api/errors";
import type {
    CreateLeaveRequestPayload,
    GetLeaveTypesResponse,
    LeaveType,
} from "@/types/leave";

interface LeaveRequestFormProps {
    defaultLeaveTypeId?: string;
}

const TOAST_DURATION_MS = 1500;
const SUCCESS_REFRESH_DELAY_MS = 800;

function getTomorrowDateInputValue() {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function LeaveRequestForm({ defaultLeaveTypeId }: LeaveRequestFormProps) {
    const router = useRouter();
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [form, setForm] = useState<CreateLeaveRequestPayload>({
        leave_type_id: defaultLeaveTypeId || "",
        from_date: "",
        to_date: "",
        reason: "",
        contact_during_leave: "",
    });
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
    const minLeaveDate = useMemo(() => getTomorrowDateInputValue(), []);

    function showToast(message: string, tone: "success" | "error") {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        setToast({ message, tone });
        toastTimeoutRef.current = setTimeout(() => {
            setToast(null);
            toastTimeoutRef.current = null;
        }, TOAST_DURATION_MS);
    }

    function update<K extends keyof CreateLeaveRequestPayload>(key: K, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    useEffect(() => {
        let mounted = true;
        const loadTypes = async () => {
            setLoadingTypes(true);
            setError(null);
            try {
                const res = await fetch("/api/employee/leave-types", { cache: "no-store" });
                if (!res.ok) {
                    throw new Error("Unable to load leave types");
                }
                const data = (await res.json()) as GetLeaveTypesResponse;
                if (!mounted) return;
                setLeaveTypes(data?.data ?? []);
                const preferredLeaveTypeId =
                    data?.data?.find((type) => type.id === defaultLeaveTypeId)?.id ?? data?.data?.[0]?.id ?? "";

                if (preferredLeaveTypeId) {
                    setForm((prev) => (prev.leave_type_id ? prev : { ...prev, leave_type_id: preferredLeaveTypeId }));
                }
            } catch (err) {
                if (!mounted) return;
                logErrorToConsole("LeaveRequestForm.loadTypes", err);
                const message = toUserFriendlyError(err, "We couldn't load leave types right now.");
                setError(message);
            } finally {
                if (mounted) setLoadingTypes(false);
            }
        };
        loadTypes();
        return () => {
            mounted = false;
        };
    }, [defaultLeaveTypeId]);

    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }

            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setToast(null);

        const payload: CreateLeaveRequestPayload = {
            leave_type_id: form.leave_type_id.trim(),
            from_date: form.from_date.trim(),
            to_date: form.to_date.trim(),
            reason: form.reason.trim(),
            contact_during_leave: form.contact_during_leave.trim(),
        };

        if (payload.from_date < minLeaveDate) {
            const message = "Leave requests must start from tomorrow onward.";
            setError(message);
            showToast(message, "error");
            setSubmitting(false);
            return;
        }

        if (payload.to_date < minLeaveDate) {
            const message = "Leave requests must end on or after tomorrow.";
            setError(message);
            showToast(message, "error");
            setSubmitting(false);
            return;
        }

        if (payload.to_date < payload.from_date) {
            const message = "To Date must be after From Date.";
            setError(message);
            showToast(message, "error");
            setSubmitting(false);
            return;
        }

        try {
            const res = await fetch("/api/employee/leave-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const raw = await res.text().catch(() => "");
                const message = parseApiErrorMessage(raw, "Unable to submit leave request");
                setError(message);
                showToast(message, "error");
                return;
            }

            showToast("Leave request submitted", "success");
            setForm({ leave_type_id: defaultLeaveTypeId || "", from_date: "", to_date: "", reason: "", contact_during_leave: "" });
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
            refreshTimeoutRef.current = setTimeout(() => {
                router.refresh();
                refreshTimeoutRef.current = null;
            }, SUCCESS_REFRESH_DELAY_MS);
        } catch (err) {
            logErrorToConsole("LeaveRequestForm.handleSubmit", err);
            const message = toUserFriendlyError(err, "We couldn't submit the leave request right now.");
            setError(message);
            showToast(message, "error");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            )}
            {toast && toast.tone === "success" && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{toast.message}</div>
            )}

            <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Leave Type</label>
                <select
                    required
                    value={form.leave_type_id}
                    onChange={(e) => update("leave_type_id", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                >
                    {loadingTypes && <option value="">Loading...</option>}
                    {!loadingTypes && leaveTypes.length === 0 && <option value="">No leave types</option>}
                    {leaveTypes.map((lt) => (
                        <option key={lt.id} value={lt.id}>
                            {lt.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">From Date</label>
                    <input
                        type="date"
                        required
                        min={minLeaveDate}
                        value={form.from_date}
                        onChange={(e) => update("from_date", e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                    />
                    {form.from_date && form.from_date < minLeaveDate ? (
                        <p className="text-[11px] font-semibold text-rose-600">Start date must be after today.</p>
                    ) : null}
                </div>
                <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">To Date</label>
                    <input
                        type="date"
                        required
                        min={form.from_date && form.from_date >= minLeaveDate ? form.from_date : minLeaveDate}
                        value={form.to_date}
                        onChange={(e) => update("to_date", e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                    />
                    {form.from_date && form.to_date && form.to_date < form.from_date ? (
                        <p className="text-[11px] font-semibold text-rose-600">To Date must be after From Date.</p>
                    ) : null}
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reason</label>
                <textarea
                    required
                    value={form.reason}
                    onChange={(e) => update("reason", e.target.value)}
                    className="min-h-25 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Briefly explain your leave request..."
                />
            </div>

            <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Contact During Leave</label>
                <input
                    required
                    value={form.contact_during_leave}
                    onChange={(e) => update("contact_during_leave", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Phone/email while you’re away"
                />
            </div>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow ${submitting ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                    <span>{submitting ? "Submitting..." : "Submit Leave Request"}</span>
                </button>
            </div>

            {toast && (
                <div
                    className={`fixed bottom-6 right-6 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${toast.tone === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                        }`}
                >
                    {toast.message}
                </div>
            )}
        </form>
    );
}
