import { EmployeeSideNav } from "@/components/navigation/EmployeeSideNav";

const personalInfo = [
    { label: "Full Name", value: "Alex Johnson" },
    { label: "Email Address", value: "alex.j@collabhub.com" },
    { label: "Department", value: "Engineering" },
    { label: "Job Title", value: "Product Designer" },
    { label: "Date of Birth", value: "July 14, 1995" },
    { label: "Start Date", value: "October 12, 2021" },
];

export default function MyProfilePage() {
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
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-blue-50 text-3xl font-bold text-slate-900 shadow-inner">
                                        AJ
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-slate-900">Alex Johnson</p>
                                        <p className="text-sm font-semibold text-blue-600">Product Designer</p>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Engineering</span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3 text-sm text-slate-700">
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400">✉️</span>
                                        <span className="font-semibold">Email</span>
                                        <span className="text-slate-500">alex.j@collabhub.com</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400">🗓️</span>
                                        <span className="font-semibold">Joined</span>
                                        <span className="text-slate-500">Oct 12, 2021</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400">👤</span>
                                        <span className="font-semibold">Manager</span>
                                        <span className="text-slate-500">Sarah Connor</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400">🎂</span>
                                        <span className="font-semibold">Birthday</span>
                                        <span className="text-slate-500">July 14</span>
                                    </div>
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
                                    {personalInfo.map((field) => (
                                        <div key={field.label} className="space-y-1">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{field.label}</p>
                                            <p className="text-sm font-semibold text-slate-900">{field.value}</p>
                                        </div>
                                    ))}
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Reporting To</p>
                                        <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">SC</span>
                                            Sarah Connor
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Employment Status</p>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Full-Time Active
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    <span className="text-blue-500">ℹ️</span>
                                    <p>
                                        To update your personal details or employment information, please contact the HR Department directly or submit a ticket via the Help Desk.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-slate-900">Security Settings</h2>

                                <div className="mt-6 grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-[1.2fr_1fr]">
                                    <div className="space-y-4">
                                        {[
                                            { label: "Current Password", placeholder: "password123" },
                                            { label: "New Password", placeholder: "newpassword" },
                                            { label: "Confirm New Password", placeholder: "newpassword" },
                                        ].map((field) => (
                                            <div key={field.label} className="space-y-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{field.label}</p>
                                                <input
                                                    type="password"
                                                    placeholder={field.placeholder}
                                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 h-full">
                                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                                            <span className="text-slate-500">🔒</span>
                                            <span>Password Requirements</span>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <label className="flex items-center gap-2">
                                                <input type="radio" checked readOnly className="h-4 w-4 text-emerald-500" />
                                                <span>Minimum 8 characters long</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input type="radio" checked readOnly className="h-4 w-4 text-emerald-500" />
                                                <span>At least one uppercase letter</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input type="radio" checked readOnly className="h-4 w-4 text-emerald-500" />
                                                <span>At least one special character (!@#$%)</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input type="radio" checked readOnly className="h-4 w-4 text-emerald-500" />
                                                <span>At least one number</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700">Update Password</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
