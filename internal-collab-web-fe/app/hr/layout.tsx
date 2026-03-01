import type { ReactNode } from "react";

export default function HrLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
