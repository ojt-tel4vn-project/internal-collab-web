import SelfProfilePage from "@/components/profile/SelfProfilePage";
import { EmployeeSideNav } from "@/components/layout/navigation/EmployeeSideNav";

export default function MyProfilePage() {
    return (
        <SelfProfilePage
            sideNav={<EmployeeSideNav />}
            defaultName="Employee"
            noteText="To change employment or contract details, please contact HR."
        />
    );
}


