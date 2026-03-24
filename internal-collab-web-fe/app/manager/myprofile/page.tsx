import SelfProfilePage from "@/components/profile/SelfProfilePage";

export default function ManagerProfilePage() {
    return (
        <SelfProfilePage
            defaultName="Manager User"
            fallbackPosition="Manager"
        />
    );
}
