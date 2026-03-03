import type { SectionCardProps } from "@/types/dashboard";

export function SectionCard({ title, description, icon, footerSlot, children, className }: SectionCardProps) {
    const classes = [
        "rounded-3xl border border-slate-100 bg-white shadow-sm",
        "px-6 py-5",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={classes}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {icon}
                    <p className="text-base font-semibold text-slate-900">{title}</p>
                </div>
                {description ? <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{description}</p> : null}
            </div>
            {children}
            {footerSlot ? <div className="mt-4">{footerSlot}</div> : null}
        </div>
    );
}
