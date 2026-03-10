import SelfProfilePage from "@/components/profile/SelfProfilePage";
import { HRSideNav } from "@/components/layout/navigation/HRSideNav";

export default function HrMyProfilePage() {
  return (
    <SelfProfilePage
      sideNav={<HRSideNav />}
      defaultName="HR User"
      noteText="Employment, department, and role changes are managed by system administration."
    />
  );
}
