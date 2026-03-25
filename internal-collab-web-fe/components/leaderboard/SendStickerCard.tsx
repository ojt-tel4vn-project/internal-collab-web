import type { FormEventHandler } from "react";
import type { LeaderboardEntry, StickerTypeOption } from "@/types/employee";

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
    selectedStickerType: StickerTypeOption | null;
    sendState: StickerSendState;
    stickerTypeError: string | null;
    stickerTypeLoading: boolean;
    stickerTypes: StickerTypeOption[];
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
    selectedStickerType,
    sendState,
    stickerTypeError,
    stickerTypeLoading,
    stickerTypes,
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
                                <p className="px-3 py-2 text-xs text-slate-500">No teammates match your search.</p>
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
                        <p className="text-[11px] font-semibold text-amber-600">Please select a teammate from the suggestion list.</p>
                    ) : (
                        <p className="text-[11px] text-slate-400">Start typing to search teammates.</p>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Sticker
                    </p>
                    {stickerTypeLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }, (_, index) => (
                                <div key={`sticker-type-skeleton-${index}`} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                            ))}
                        </div>
                    ) : stickerTypeError ? (
                        <p className="text-[11px] font-semibold text-rose-600">{stickerTypeError}</p>
                    ) : stickerTypes.length === 0 ? (
                        <p className="text-[11px] text-slate-400">No stickers are available right now.</p>
                    ) : (
                        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                            {stickerTypes.map((item) => {
                                const isSelected = form.stickerTypeId === item.id;
                                const hasIcon = Boolean(item.iconUrl);
                                const iconStyle = hasIcon
                                    ? {
                                          backgroundImage: `url("${item.iconUrl}")`,
                                          backgroundPosition: "center",
                                          backgroundSize: "cover",
                                      }
                                    : undefined;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => onStickerTypeChange(item.id)}
                                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                                            isSelected
                                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${
                                                hasIcon ? "bg-slate-100 text-transparent" : "bg-slate-100 text-slate-600"
                                            }`}
                                            style={iconStyle}
                                            aria-hidden="true"
                                        >
                                            {hasIcon ? "." : item.name.slice(0, 1).toUpperCase()}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-slate-800">{item.name}</span>
                                            <span className="block text-[11px] text-slate-500">{item.pointCost} pt</span>
                                        </span>
                                        {isSelected ? (
                                            <span className="text-[11px] font-semibold text-blue-600">Selected</span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {selectedStickerType ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="flex items-center gap-3">
                                <span
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold ${
                                        selectedStickerType.iconUrl ? "bg-slate-100 text-transparent" : "bg-white text-slate-600"
                                    }`}
                                    style={
                                        selectedStickerType.iconUrl
                                            ? {
                                                  backgroundImage: `url("${selectedStickerType.iconUrl}")`,
                                                  backgroundPosition: "center",
                                                  backgroundSize: "cover",
                                              }
                                            : undefined
                                    }
                                    aria-hidden="true"
                                >
                                    {selectedStickerType.iconUrl ? "." : selectedStickerType.name.slice(0, 1).toUpperCase()}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="truncate text-xs font-semibold text-slate-700">{selectedStickerType.name}</p>
                                        <span className="shrink-0 text-[11px] font-semibold text-blue-600">
                                            {selectedStickerType.pointCost} pt
                                        </span>
                                    </div>
                                    {selectedStickerType.description ? (
                                        <p className="mt-1 text-[11px] text-slate-500">{selectedStickerType.description}</p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[11px] text-slate-400">Please select a sticker to continue.</p>
                    )}
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
                        maxLength={255}
                        className="min-h-[112px] w-full resize-none rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Optional note for the receiver.</span>
                        <span>{form.message.length}/255</span>
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
