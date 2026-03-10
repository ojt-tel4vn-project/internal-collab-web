import RoleNavbar from "@/components/layout/navbar/RoleNavbar";

export default function ManagerNavbar() {
  return (
    <RoleNavbar
      homeHref="/manager/home"
      notificationHref="/manager/notification"
      profileHref="/manager/myprofile"
      changePasswordHref="/manager/change-password"
      defaultName="Manager"
      roleLabel="Manager"
    />
  );
}
