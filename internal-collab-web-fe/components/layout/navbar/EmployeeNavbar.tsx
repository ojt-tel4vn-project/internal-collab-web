import RoleNavbar from "@/components/layout/navbar/RoleNavbar";

export default function EmployeeNavbar() {
  return (
    <RoleNavbar
      homeHref="/employee/home"
      notificationHref="/employee/notification"
      profileHref="/employee/myprofile"
      changePasswordHref="/employee/change-password"
      defaultName="Employee"
      roleLabel="Employee"
    />
  );
}
