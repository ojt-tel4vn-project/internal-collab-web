import RoleNavbar from "@/components/layout/navbar/RoleNavbar";

export default function AdminNavbar() {
  return (
    <RoleNavbar
      homeHref="/admin/home"
      notificationHref="/admin/notification"
      profileHref="/admin/myprofile"
      changePasswordHref="/admin/change-password"
      defaultName="Admin"
      roleLabel="Administrator"
    />
  );
}
