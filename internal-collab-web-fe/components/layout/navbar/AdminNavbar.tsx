import RoleNavbar from "@/components/layout/navbar/RoleNavbar";
import type { EmployeeProfile } from "@/types/employee";

type NavbarProfile = Pick<EmployeeProfile, "full_name" | "first_name" | "last_name" | "email" | "avatar_url">;

export default function AdminNavbar({ initialProfile }: { initialProfile?: NavbarProfile | null }) {
  return (
    <RoleNavbar
      homeHref="/admin/home"
      notificationHref="/admin/notification"
      profileHref="/admin/myprofile"
      changePasswordHref="/admin/change-password"
      defaultName="Admin"
      initialProfile={initialProfile}
      roleLabel="Administrator"
    />
  );
}
