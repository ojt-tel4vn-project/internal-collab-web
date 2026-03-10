import SelfProfilePage from "@/components/profile/SelfProfilePage";

export default function AdminMyProfilePage() {
  return (
    <SelfProfilePage
      sideNav={null}
      defaultName="Admin"
      noteText="Core account permissions and system-level assignments are managed separately from this profile page."
    />
  );
}

