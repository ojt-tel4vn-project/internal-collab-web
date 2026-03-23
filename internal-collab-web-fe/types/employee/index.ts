export interface EmployeeDepartment {
    id: string;
    name: string;
}

export interface EmployeeManager {
    id: string | number;
    full_name?: string;
    name?: string;
}

export interface EmployeeProfile {
    id: string;
    employee_code: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string;
    address: string;
    avatar_url?: string | null;
    position: string;
    status: string;
    department_id: string;
    department: EmployeeDepartment;
    manager_id: string | number | null;
    manager: EmployeeManager | null;
    date_of_birth: string;
    join_date: string;
    leave_date: string | null;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface UpdateEmployeeProfilePayload {
    address?: string;
    avatar_url?: string;
    phone?: string;
}

export interface UpdateEmployeeProfileResponse {
    $schema?: string;
    message: string;
}

export interface HrEmployeeSummary {
    id: string;
    email: string;
    full_name: string;
    employee_code: string;
    position: string;
    department: string | EmployeeDepartment | null;
    role?: {
        id: string;
        name: string;
    } | null;
    avatar_url?: string | null;
    status: string;
}

export interface HrEmployeeListResponse {
    employees: HrEmployeeSummary[];
    total: number;
}

export interface HrEmployeeDetail {
    id: string;
    email: string;
    employee_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    date_of_birth: string;
    phone: string;
    address: string;
    avatar_url?: string | null;
    department_id: string | null;
    department?: {
        id: string;
        name: string;
    } | null;
    position: string;
    manager_id: string | null;
    manager?: {
        id: string;
        full_name: string;
    } | null;
    role_id?: string | null;
    role?: {
        id: string;
        name: string;
    } | null;
    join_date: string;
    leave_date: string | null;
    status: string;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface HrCreateEmployeePayload {
    email: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone?: string;
    address?: string;
    department_id?: string;
    position: string;
    manager_id?: string;
    join_date?: string;
}

export interface HrUpdateEmployeePayload {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    phone?: string;
    address?: string;
    department_id?: string;
    position?: string;
    manager_id?: string | null;
    role_id?: string;
    status?: string;
}

export interface DepartmentOption {
    id: string;
    name: string;
}

export type TimeFilter = "month" | "quarter" | "year" | "all";

export interface TimeFilterMeta {
    id: TimeFilter;
    label: string;
    summary: string;
}

export interface PointBalanceData {
    currentPoints: number;
    employeeId: string;
    initialPoints: number;
    year: number;
}

export interface LeaderboardEntry {
    employeeId: string;
    employeeCode: string;
    email: string;
    fullName: string;
    position: string;
    total: number;
}

export interface StickerTypeOption {
    id: string;
    name: string;
    description: string;
    category: string;
    iconUrl: string;
    pointCost: number;
    displayOrder: number;
    isActive: boolean;
}

export interface LeaderboardFilters {
    departmentId: string;
    timeFilter: TimeFilter;
    limit?: number;
}

export const timeFilters: TimeFilterMeta[] = [
    { id: "month", label: "This Month", summary: "Showing stickers received in the current month." },
    { id: "quarter", label: "This Quarter", summary: "Showing stickers received in the current quarter." },
    { id: "year", label: "This Year", summary: "Showing stickers received in the current year." },
    { id: "all", label: "All Time", summary: "Showing all stickers received so far." },
];
