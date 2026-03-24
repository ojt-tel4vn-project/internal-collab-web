import type { ReactNode } from "react";

type RoleWorkspaceShellProps = {
    children: ReactNode;
    sideNav: ReactNode;
    maxWidthClassName?: string;
};

export function RoleWorkspaceShell({
    children,
    sideNav,
    maxWidthClassName = "max-w-7xl",
}: RoleWorkspaceShellProps) {
    return (
        <main className="min-h-[calc(100vh-4rem)] bg-[#f6f8fb] text-slate-900">
            <div className={`mx-auto flex w-full flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start lg:py-8 ${maxWidthClassName}`}>
                <aside className="w-full lg:sticky lg:top-8 lg:w-[230px] lg:flex-none">
                    {sideNav}
                </aside>

                <div className="min-w-0 flex-1">
                    {children}
                </div>
            </div>
        </main>
    );
}
