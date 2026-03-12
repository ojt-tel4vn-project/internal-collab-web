import SelfProfilePage from "@/components/profile/SelfProfilePage";

export default function AdminMyProfilePage() {
  return (
    <SelfProfilePage
      sideNav={null}
      defaultName="Admin User"
      fallbackPosition="Admin"
    />
  );
}

