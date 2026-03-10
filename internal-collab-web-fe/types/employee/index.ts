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
