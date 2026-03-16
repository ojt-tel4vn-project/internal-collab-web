import { ManagerSideNav } from "@/components/layout/navigation/ManagerSideNav";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";

export default function ManagerLeaderboardPage() {
    return <LeaderboardClient sideNav={<ManagerSideNav />} />;
}
