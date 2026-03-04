export interface LeaveQuota {
    id: string;
    employee_id: string;
    leave_type_id: string;
    remaining_days: number;
    total_days: number;
    used_days: number;
    year: number;
}

export interface GetLeaveQuotasResponse {
    $schema?: string;
    data: LeaveQuota[];
}

export interface CreateLeaveRequestPayload {
    contact_during_leave: string;
    from_date: string;
    leave_type_id: string;
    reason: string;
    to_date: string;
}

export interface CreateLeaveRequestResponse {
    $schema?: string;
    message?: string;
    id?: string;
}

export interface LeaveRequestItem {
    id: string;
    leave_type_id: string;
    from_date: string;
    to_date: string;
    status: string;
    reason?: string;
    contact_during_leave?: string;
    manager_comment?: string;
    approval_comment?: string;
    rejection_comment?: string;
    created_at?: string;
    updated_at?: string;
    total_days?: number;
}

export interface GetLeaveRequestsResponse {
    $schema?: string;
    data: LeaveRequestItem[];
}

export interface LeaveType {
    id: string;
    name: string;
}

export interface GetLeaveTypesResponse {
    $schema?: string;
    data: LeaveType[];
}

export interface LeaveStatusMeta {
    label: string;
    tone: string;
}

export interface LeaveHistoryItem {
    id: string;
    title: string;
    range: string;
    duration: string;
    managerComment?: string;
    status: LeaveStatusMeta;
}
