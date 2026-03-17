import type { FormEventHandler } from "react";
import type { LeaderboardEntry } from "@/types/employee";

type StickerFormValues = {
    message: string;
    receiverName: string;
    stickerTypeId: string;
};

type StickerSendState = {
    error: string | null;
    loading: boolean;
    success: string | null;
};

type SendStickerCardProps = {
    canSend: boolean;
    form: StickerFormValues;
    isReceiverMenuOpen: boolean;
    isReceiverPendingSelection: boolean;
    isSelfReceiver: boolean;
    onMessageChange: (value: string) => void;
    onReceiverBlur: () => void;
    onReceiverFocus: () => void;
    onReceiverNameChange: (value: string) => void;
    onReceiverPick: (receiverId: string) => void;
    onStickerTypeChange: (value: string) => void;
    onSubmit: FormEventHandler<HTMLFormElement>;
    receiverError: string | null;
    receiverLoading: boolean;
    receiverMatches: LeaderboardEntry[];
    selectedReceiverName: string | null;
    sendState: StickerSendState;
};

export function SendStickerCard({
    canSend,
    form,
    isReceiverMenuOpen,
    isReceiverPendingSelection,
    isSelfReceiver,
    onMessageChange,
    onReceiverBlur,
    onReceiverFocus,
    onReceiverNameChange,
    onReceiverPick,
    onStickerTypeChange,
    onSubmit,
    receiverError,
    receiverLoading,
    receiverMatches,
    selectedReceiverName,
    sendState,
}: SendStickerCardProps) {
    return (
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
                <p className="text-sm font-semibold text-slate-900">Send Sticker</p>
                <p className="mt-1 text-xs text-slate-500">Search and choose a teammate before sending.</p>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                    <label htmlFor="leaderboard-receiver-id" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Receiver
                    </label>
                    <input
                        id="leaderboard-receiver-id"
                        value={form.receiverName}
                        onChange={(event) => onReceiverNameChange(event.target.value)}
                        onFocus={onReceiverFocus}
                        onBlur={onReceiverBlur}
                        placeholder="Search by name"
                        spellCheck={false}
                        className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    {isReceiverMenuOpen ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {receiverLoading ? (
                                <p className="px-3 py-2 text-xs text-slate-500">Loading teammates...</p>
                            ) : receiverError ? (
                                <p className="px-3 py-2 text-xs text-rose-600">{receiverError}</p>
                            ) : receiverMatches.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-slate-500">No teammate matches your search.</p>
                            ) : (
                                <div className="max-h-64 overflow-y-auto py-1">
                                    {receiverMatches.map((entry) => (
                                        <button
                                            key={entry.employeeId}
                                            type="button"
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                onReceiverPick(entry.employeeId);
                                            }}
                                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-slate-50"
                                        >
                                            <span className="truncate text-sm font-medium text-slate-700">{entry.fullName}</span>
                                            <span className="text-[11px] font-semibold text-slate-400">Received {entry.total}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}
                    {selectedReceiverName ? (
                        <p className="text-[11px] font-semibold text-emerald-600">Selected receiver: {selectedReceiverName}</p>
                    ) : isReceiverPendingSelection ? (
                        <p className="text-[11px] font-semibold text-amber-600">Choose one teammate from the suggestions to continue.</p>
                    ) : (
                        <p className="text-[11px] text-slate-400">Start typing to search teammates.</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="leaderboard-sticker-type-id" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Sticker Type ID
                    </label>
                    <input
                        id="leaderboard-sticker-type-id"
                        value={form.stickerTypeId}
                        onChange={(event) => onStickerTypeChange(event.target.value)}
                        placeholder="Sticker type ID"
                        spellCheck={false}
                        className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="text-[11px] text-slate-400">Use the ID from HR.</p>
                </div>

                <div className="space-y-2">
                    <label htmlFor="leaderboard-sticker-message" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Message
                    </label>
                    <textarea
                        id="leaderboard-sticker-message"
                        value={form.message}
                        onChange={(event) => onMessageChange(event.target.value)}
                        placeholder="Add a short thank-you message..."
                        maxLength={300}
                        className="min-h-[112px] w-full resize-none rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Optional note for the receiver.</span>
                        <span>{form.message.length}/300</span>
                    </div>
                </div>

                {isSelfReceiver ? (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                        You cannot send a sticker to yourself.
                    </div>
                ) : null}

                {sendState.error ? (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" aria-live="polite">
                        {sendState.error}
                    </div>
                ) : null}

                {sendState.success ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700" aria-live="polite">
                        {sendState.success}
                    </div>
                ) : null}

                <button
                    type="submit"
                    disabled={!canSend || sendState.loading}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {sendState.loading ? "Sending..." : "Send Sticker"}
                </button>
            </form>
        </section>
    );
}
