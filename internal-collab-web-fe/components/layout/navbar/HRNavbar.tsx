import RoleNavbar from "@/components/layout/navbar/RoleNavbar";
import type { EmployeeProfile } from "@/types/employee";

type NavbarProfile = Pick<EmployeeProfile, "full_name" | "first_name" | "last_name" | "email" | "avatar_url">;

export default function HRNavbar({ initialProfile }: { initialProfile?: NavbarProfile | null }) {
  return (
    <RoleNavbar
      homeHref="/hr/home"
      notificationHref="/hr/notification"
      profileHref="/hr/my-profile"
      changePasswordHref="/hr/change-password"
      defaultName="HR User"
      initialProfile={initialProfile}
      roleLabel="HR"
    />
  );
}
