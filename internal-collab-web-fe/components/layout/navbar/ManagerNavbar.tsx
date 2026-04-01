import RoleNavbar from "@/components/layout/navbar/RoleNavbar";
import type { EmployeeProfile } from "@/types/employee";

type NavbarProfile = Pick<EmployeeProfile, "full_name" | "first_name" | "last_name" | "email" | "avatar_url">;

export default function ManagerNavbar({ initialProfile }: { initialProfile?: NavbarProfile | null }) {
  return (
    <RoleNavbar
      homeHref="/manager/home"
      notificationHref="/manager/notification"
      profileHref="/manager/myprofile"
      changePasswordHref="/manager/change-password"
      defaultName="Manager"
      initialProfile={initialProfile}
      roleLabel="Manager"
    />
  );
}
