import RoleNavbar from "@/components/layout/navbar/RoleNavbar";

export default function HRNavbar() {
  return (
    <RoleNavbar
      homeHref="/hr/home"
      notificationHref="/hr/notification"
      profileHref="/hr/my-profile"
      changePasswordHref="/hr/change-password"
      defaultName="HR User"
      roleLabel="HR"
    />
  );
}
