import { ManagerSideNav } from "@/components/navigation/ManagerSideNav";

const profile = {
    name: "Alex Manager",
    role: "Team Lead",
    email: "alex.manager@collabhub.com",
    team: "Product Ops",
    location: "Hanoi, VN",
};

const preferences = [
    { label: "Weekly summary", value: "Email" },
    { label: "Approvals", value: "Push + Email" },
    { label: "Reminders", value: "Morning" },
];

export default function ManagerProfilePage() {
    return (
        <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
            <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-8">
                <ManagerSideNav />

                <section className="flex-1 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold">My Profile</h1>
                            <p className="text-sm text-slate-500">Keep your contact information and preferences up to date</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm">Update Photo</button>
                            <button className="rounded-full bg-blue-600 px-4 py-2 text-white shadow">Save Changes</button>
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">AM</span>
                                <div>
                                    <p className="text-xl font-bold text-slate-900">{profile.name}</p>
                                    <p className="text-sm font-semibold text-slate-500">{profile.role}</p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
                                    <p className="text-sm font-semibold text-slate-900">{profile.email}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team</p>
                                    <p className="text-sm font-semibold text-slate-900">{profile.team}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
                                    <p className="text-sm font-semibold text-slate-900">{profile.location}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Direct Reports</p>
                                    <p className="text-sm font-semibold text-slate-900">12</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-sm font-semibold text-slate-900">Notification Preferences</p>
                                <div className="mt-3 space-y-3 text-sm font-semibold text-slate-700">
                                    {preferences.map((pref) => (
                                        <div key={pref.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                                            <span>{pref.label}</span>
                                            <span className="text-slate-500">{pref.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <p className="text-sm font-semibold text-slate-900">Security</p>
                                <div className="mt-3 space-y-3 text-sm font-semibold text-slate-700">
                                    <div className="flex items-center justify-between">
                                        <span>Password</span>
                                        <button className="text-blue-600">Change</button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Two-factor</span>
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">Enabled</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
