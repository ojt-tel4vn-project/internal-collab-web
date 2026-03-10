import SelfProfilePage from "@/components/profile/SelfProfilePage";
import { ManagerSideNav } from "@/components/layout/navigation/ManagerSideNav";

export default function ManagerProfilePage() {
    return (
        <SelfProfilePage
            sideNav={<ManagerSideNav />}
            defaultName="Manager"
            noteText="Team structure, approvals, and role permissions are managed through leadership settings."
        />
    );
}
