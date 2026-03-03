import { DashboardNavbar } from "@/components/dashboard/Navbar";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { DocumentIcon, DownloadIcon, AlertTriangleIcon } from "@/components/dashboard/Icons";
import { navItems as baseNavItems } from "../_data";

const filters = ["All Documents", "Onboarding", "Quy định", "Hướng dẫn"];

const stats = [
    { label: "Total Documents", value: 12, tone: "text-slate-900", iconBg: "bg-blue-50", iconColor: "text-blue-500", icon: DocumentIcon },
    { label: "Read", value: 8, tone: "text-emerald-600", iconBg: "bg-emerald-50", iconColor: "text-emerald-500", icon: DocumentIcon },
    { label: "Action Required", value: 4, tone: "text-amber-500", iconBg: "bg-amber-50", iconColor: "text-amber-500", icon: AlertTriangleIcon },
];

const documents = [
    {
        title: "Employee Handbook 2024",
        status: "Unread",
        summary: "Updated policies regarding remote work, benefits, and code of conduct for...",
        size: "2.4 MB",
        date: "Oct 24, 2023",
        accent: "bg-blue-50",
        iconTone: "text-blue-500",
        action: "Mark as Read",
    },
    {
        title: "IT Security Policy v3.0",
        status: "Unread",
        summary: "Mandatory security protocols for accessing internal servers and handling...",
        size: "845 KB",
        date: "Nov 01, 2023",
        accent: "bg-purple-50",
        iconTone: "text-purple-500",
        action: "Mark as Read",
    },
    {
        title: "Q3 Financial Report",
        status: "Read",
        summary: "Quarterly financial breakdown including revenue streams,...",
        size: "5.1 MB",
        date: "Sep 30, 2023",
        accent: "bg-slate-100",
        iconTone: "text-slate-500",
        action: "View",
    },
    {
        title: "Brand Assets Kit",
        status: "Read",
        summary: "Official logos, color palettes, typography guidelines, and...",
        size: "128 MB",
        date: "Aug 15, 2023",
        accent: "bg-slate-100",
        iconTone: "text-slate-500",
        action: "View",
    },
    {
        title: "Innovation Workshop",
        status: "Read",
        summary: "Summary notes and action items from the Q3 innovation brainstorming...",
        size: "1.2 MB",
        date: "Jul 20, 2023",
        accent: "bg-slate-100",
        iconTone: "text-slate-500",
        action: "View",
    },
    {
        title: "Remote Work Guide",
        status: "Read",
        summary: "Best practices for setting up your home office and maintaining...",
        size: "3.5 MB",
        date: "Jun 10, 2023",
        accent: "bg-slate-100",
        iconTone: "text-slate-500",
        action: "View",
    },
];

function StatusPill({ status }: { status: string }) {
    const isUnread = status === "Unread";
    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isUnread ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                }`}
        >
            {status}
        </span>
    );
}

export default function DocumentsPage() {
    const navItems = baseNavItems.map((item) => ({ ...item, active: item.label === "Documents" }));

    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <DashboardNavbar user={{ initials: "AJ", name: "Alex Johnson", role: "Product Designer" }} notificationCount={1} />

            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <SidebarNav items={navItems} />

                <section className="flex-1 space-y-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="relative w-full max-w-xl">
                                <input
                                    placeholder="Search by title, author, or tag..."
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                {filters.map((label, idx) => (
                                    <button
                                        key={label}
                                        className={`rounded-full px-4 py-2 shadow-sm ${idx === 0 ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {stats.map(({ label, value, iconBg, iconColor, icon: Icon, tone }) => (
                                <div key={label} className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${iconBg}`}>
                                            <Icon className={`h-5 w-5 ${iconColor}`} />
                                        </div>
                                        {label === "Read" ? (
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">✓</span>
                                        ) : null}
                                        {label === "Action Required" ? (
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-500">!</span>
                                        ) : null}
                                        {label === "Total Documents" ? (
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-500">📄</span>
                                        ) : null}
                                    </div>
                                    <p className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                                    <p className={`text-3xl font-extrabold leading-tight ${tone}`}>{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {documents.map((doc, idx) => (
                            <article key={doc.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${doc.accent}`}>
                                        <DocumentIcon className={`h-5 w-5 ${doc.iconTone}`} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-lg font-semibold text-slate-900">{doc.title}</h3>
                                            <StatusPill status={doc.status} />
                                        </div>
                                        <p className="text-sm text-slate-600">{doc.summary}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                                    <span className="inline-flex items-center gap-2">
                                        <span className="text-slate-400">📁</span>
                                        {doc.size}
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <span className="text-slate-400">📅</span>
                                        {doc.date}
                                    </span>
                                </div>

                                <div className="mt-4 flex items-center gap-3">
                                    <button
                                        className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm ${doc.action === "Mark as Read"
                                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                            }`}
                                    >
                                        {doc.action}
                                    </button>
                                    <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-blue-200">
                                        <DownloadIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
