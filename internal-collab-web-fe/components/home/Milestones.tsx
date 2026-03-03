import type { Milestone } from "@/types/dashboard";
import { SectionCard } from "./common/SectionCard";
import { NoteIcon } from "./Icons";

interface MilestonesProps {
    milestones: Milestone[];
}

const colorMap = ["orange", "blue"] as const;

export function MilestonesCard({ milestones }: MilestonesProps) {
    return (
        <SectionCard
            title="Upcoming Events"
            icon={<NoteIcon className="h-5 w-5 text-orange-500" />}
        >
            <ul className="space-y-3">
                {milestones.map((m, idx) => {
                    const color = colorMap[idx % colorMap.length];
                    const bg = color === "orange" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600";

                    return (
                        <li key={`${m.title}-${m.day}`} className="flex items-start gap-3 rounded-2xl border border-slate-100 px-3 py-3">
                            <div className={`flex h-12 w-12 flex-col items-center justify-center rounded-2xl text-xs font-semibold ${bg}`}>
                                <span>{m.day}</span>
                                <span className="text-[10px] uppercase">{m.month}</span>
                            </div>
                            <div className="text-sm text-slate-800">
                                <p className="font-semibold text-slate-900">{m.title}</p>
                                <p className="text-xs text-slate-500">{m.subtitle}</p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </SectionCard>
    );
}
