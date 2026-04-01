import RoleNavbar from "@/components/layout/navbar/RoleNavbar";
import type { EmployeeProfile } from "@/types/employee";

type NavbarProfile = Pick<EmployeeProfile, "full_name" | "first_name" | "last_name" | "email" | "avatar_url">;

export default function EmployeeNavbar({ initialProfile }: { initialProfile?: NavbarProfile | null }) {
  return (
    <RoleNavbar
      homeHref="/employee/home"
      notificationHref="/employee/notification"
      profileHref="/employee/myprofile"
      changePasswordHref="/employee/change-password"
      defaultName="Employee"
      initialProfile={initialProfile}
      roleLabel="Employee"
    />
  );
}
