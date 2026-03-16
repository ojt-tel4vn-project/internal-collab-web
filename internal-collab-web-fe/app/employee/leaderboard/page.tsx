import { EmployeeSideNav } from "@/components/layout/navigation/EmployeeSideNav";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";

export default function LeaderboardPage() {
    return <LeaderboardClient sideNav={<EmployeeSideNav />} />;
}
