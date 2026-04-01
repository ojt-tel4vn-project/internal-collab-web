"use client";

import { type ReactNode, type SubmitEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logErrorToConsole, toUserFriendlyError, toUserFriendlyErrorMessage } from "@/lib/api/errors";
import type {
    DepartmentOption,
    HrCreateEmployeePayload,
    HrEmployeeDetail,
    HrEmployeeListResponse,
    HrEmployeeSummary,
    HrUpdateEmployeePayload,
} from "@/types/employee";

type ManagementMode = "hr" | "admin";

type EmployeeFormState = {
    email: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    phone: string;
    address: string;
    department_id: string;
    position: string;
    manager_id: string;
    role_id: string;
    status: string;
    join_date: string;
};

type DepartmentFormState = {
    description: string;
    name: string;
};

type ToastState = {
    message: string;
    tone: "success" | "error";
};

const EMPTY_FORM: EmployeeFormState = {
    email: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    phone: "",
    address: "",
    department_id: "",
    position: "",
    manager_id: "",
    role_id: "",
    status: "active",
    join_date: "",
};

const EMPTY_DEPARTMENT_FORM: DepartmentFormState = {
    description: "",
    name: "",
};

const STATUS_FILTER_OPTIONS = ["pending", "active", "offboard"] as const;
const STATUS_UPDATE_OPTIONS = ["pending", "active", "offboard"] as const;
const PAGE_SIZE = 10;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SIMPLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value: unknown) {
    if (typeof value !== "string") {
        return "";
    }

    const normalized = value.trim();
    if (!normalized) {
        return "";
    }

    const lowered = normalized.toLowerCase();
    if (lowered === "string" || lowered === "null" || lowered === "undefined") {
        return "";
    }

    return normalized;
}

function formatDate(value: string | null | undefined) {
    if (!value) {
        return "--";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function toDateInputValue(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return "";
    }

    return trimmed.slice(0, 10);
}

function titleizeStatus(status: string) {
    const normalized = normalizeText(status).toLowerCase();
    if (!normalized) {
        return "Unknown";
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getEmployeeStatusValue(status: string) {
    const normalized = normalizeText(status).toLowerCase();
    if (normalized === "inactive" || normalized === "offboard") {
        return "offboard";
    }

    return normalized;
}

function getBackendStatusValue(status: string) {
    const normalized = normalizeText(status).toLowerCase();
    if (!normalized) {
        return "active";
    }

    if (normalized === "offboard" || normalized === "inactive") {
        return "inactive";
    }

    return normalized;
}

function getEditableStatusValue(status: string) {
    const normalized = getEmployeeStatusValue(status);
    if (normalized === "pending") {
        return "pending";
    }

    return normalized === "offboard" ? "offboard" : "active";
}

function statusBadgeClassName(status: string) {
    switch (getEmployeeStatusValue(status)) {
        case "active":
            return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
        case "offboard":
            return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
        case "pending":
            return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
        default:
            return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
    }
}

async function parseErrorMessage(response: Response, fallback: string) {
    const payload = (await response.json().catch(() => null)) as
        | {
              message?: string;
              detail?: string;
              errors?: Array<{ message?: string }>;
          }
        | null;

    if (payload?.errors?.length) {
        const messages = payload.errors
            .map((error) => normalizeText(error.message))
            .filter(Boolean);
        if (messages.length) {
            return messages.join(". ");
        }
    }

    return toUserFriendlyErrorMessage(payload?.message ?? payload?.detail ?? fallback, fallback);
}

function normalizeDepartmentsPayload(payload: unknown): DepartmentOption[] {
    const asRecord = payload as { data?: unknown[]; departments?: unknown[] } | null;
    const rawItems = Array.isArray(payload)
        ? payload
        : Array.isArray(asRecord?.data)
          ? asRecord?.data ?? []
          : Array.isArray(asRecord?.departments)
            ? asRecord?.departments ?? []
            : [];

    const seen = new Set<string>();
    const normalized = rawItems
        .map((item) => {
            const raw = item as { id?: unknown; name?: unknown } | null;
            const id = normalizeText(raw?.id);
            const name = normalizeText(raw?.name);

            if (!id || !name || seen.has(id)) {
                return null;
            }

            seen.add(id);
            return { id, name };
        })
        .filter((item): item is DepartmentOption => item !== null);

    return normalized.sort((left, right) => left.name.localeCompare(right.name));
}

function getDepartmentName(department: HrEmployeeSummary["department"]) {
    if (!department) {
        return "";
    }

    if (typeof department === "string") {
        return normalizeText(department);
    }

    return normalizeText(department.name);
}

function getRoleName(role: HrEmployeeSummary["role"] | HrEmployeeDetail["role"] | null | undefined) {
    if (!role) {
        return "";
    }

    return normalizeText(role.name).toLowerCase();
}

function getRoleId(role: HrEmployeeSummary["role"] | HrEmployeeDetail["role"] | null | undefined) {
    if (!role) {
        return "";
    }

    return normalizeText(role.id);
}

function isUuid(value: string | null | undefined) {
    const normalized = normalizeText(value);
    return normalized ? UUID_PATTERN.test(normalized) : false;
}

function isIsoDate(value: string | null | undefined) {
    const normalized = normalizeText(value);
    if (!normalized || !ISO_DATE_PATTERN.test(normalized)) {
        return false;
    }

    const date = new Date(`${normalized}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return date.toISOString().slice(0, 10) === normalized;
}

function formatRoleLabel(roleName: string) {
    const normalized = normalizeText(roleName).toLowerCase();
    if (!normalized) {
        return "--";
    }

    if (normalized === "hr") {
        return "HR";
    }

    return normalized
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function canRoleSkipManager(roleName: string) {
    return roleName === "hr" || roleName === "manager";
}

function canDeleteRole(roleName: string, mode: ManagementMode) {
    if (mode === "admin") {
        return roleName === "employee" || roleName === "hr" || roleName === "manager";
    }

    return roleName === "employee";
}

function resolveEmployeeRoleName(detail: HrEmployeeDetail | null, summary: HrEmployeeSummary | null) {
    return getRoleName(detail?.role) || getRoleName(summary?.role);
}

function resolveEmployeeRoleId(detail: HrEmployeeDetail | null, summary: HrEmployeeSummary | null) {
    return normalizeText(detail?.role_id) || getRoleId(detail?.role) || getRoleId(summary?.role);
}

function mapDetailToForm(detail: HrEmployeeDetail): EmployeeFormState {
    return {
        email: normalizeText(detail.email),
        first_name: normalizeText(detail.first_name),
        last_name: normalizeText(detail.last_name),
        date_of_birth: toDateInputValue(detail.date_of_birth),
        phone: normalizeText(detail.phone),
        address: normalizeText(detail.address),
        department_id: normalizeText(detail.department_id),
        position: normalizeText(detail.position),
        manager_id: normalizeText(detail.manager_id),
        role_id: normalizeText(detail.role_id) || normalizeText(detail.role?.id),
        status: getEditableStatusValue(detail.status),
        join_date: toDateInputValue(detail.join_date),
    };
}

function buildCreatePayload(form: EmployeeFormState): HrCreateEmployeePayload {
    const payload: HrCreateEmployeePayload = {
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        date_of_birth: form.date_of_birth,
        position: form.position.trim(),
    };

    const phone = form.phone.trim();
    const address = form.address.trim();
    const departmentId = form.department_id.trim();
    const managerId = form.manager_id.trim();
    const roleId = form.role_id.trim();
    const joinDate = form.join_date.trim();

    if (phone) {
        payload.phone = phone;
    }
    if (address) {
        payload.address = address;
    }
    if (departmentId) {
        payload.department_id = departmentId;
    }
    if (managerId) {
        payload.manager_id = managerId;
    }
    if (roleId) {
        payload.role_id = roleId;
    }
    if (joinDate) {
        payload.join_date = joinDate;
    }

    return payload;
}

function buildUpdatePayload(
    form: EmployeeFormState,
    detail: HrEmployeeDetail,
    roleIdOverride?: string,
): HrUpdateEmployeePayload {
    const roleId = normalizeText(roleIdOverride) || normalizeText(detail.role_id) || normalizeText(detail.role?.id);
    const departmentId = form.department_id.trim() || normalizeText(detail.department_id);
    const managerId = form.manager_id.trim();

    const payload: HrUpdateEmployeePayload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        date_of_birth: form.date_of_birth,
        phone: form.phone.trim(),
        address: form.address.trim(),
        position: form.position.trim(),
        manager_id: managerId || null,
        status: getBackendStatusValue(form.status || detail.status),
    };

    if (departmentId) {
        payload.department_id = departmentId;
    }
    if (roleId) {
        payload.role_id = roleId;
    }

    return payload;
}

function FieldShell({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <label className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {label}
                {required ? " *" : ""}
            </div>
            {children}
        </label>
    );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const { className = "", ...rest } = props;

    return (
        <input
            {...rest}
            className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white ${className}`}
        />
    );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    const { className = "", ...rest } = props;

    return (
        <select
            {...rest}
            className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white ${className}`}
        />
    );
}

function ModalShell({
    title,
    description,
    onClose,
    children,
    widthClassName = "max-w-3xl",
}: {
    title: string;
    description?: string;
    onClose: () => void;
    children: ReactNode;
    widthClassName?: string;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 px-4 py-10">
            <div className={`w-full ${widthClassName} overflow-hidden rounded-3xl bg-white shadow-2xl`}>
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
                        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50"
                        aria-label="Close dialog"
                    >
                        x
                    </button>
                </div>
                <div className="max-h-[calc(100vh-120px)] overflow-y-auto px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

export default function EmployeeManagementPage({ mode = "hr" }: { mode?: ManagementMode }) {
    const [employees, setEmployees] = useState<HrEmployeeSummary[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [toast, setToast] = useState<ToastState | null>(null);
    const toastTimeoutRef = useRef<number | null>(null);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDepartmentCreateOpen, setIsDepartmentCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDepartmentSubmitting, setIsDepartmentSubmitting] = useState(false);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
    const [employeePendingDelete, setEmployeePendingDelete] = useState<HrEmployeeSummary | null>(null);

    const [selectedEmployee, setSelectedEmployee] = useState<HrEmployeeSummary | null>(null);
    const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<HrEmployeeDetail | null>(null);
    const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(EMPTY_FORM);
    const [formError, setFormError] = useState<string | null>(null);
    const [departmentForm, setDepartmentForm] = useState<DepartmentFormState>(EMPTY_DEPARTMENT_FORM);
    const [departmentFormError, setDepartmentFormError] = useState<string | null>(null);

    const isAdminMode = mode === "admin";
    const managementListView = isAdminMode ? "admin-management" : "hr-management";
    const employeeDetailView = isAdminMode ? "admin-employee-detail" : "hr-employee-detail";
    const employeeMutationView = isAdminMode ? "admin-employee" : "hr-employee";

    const showToast = useCallback((message: string, tone: "success" | "error") => {
        if (toastTimeoutRef.current) {
            window.clearTimeout(toastTimeoutRef.current);
        }

        setToast({ message, tone });
        toastTimeoutRef.current = window.setTimeout(() => {
            setToast(null);
            toastTimeoutRef.current = null;
        }, 3500);
    }, []);

    const loadEmployees = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);

        try {
            const response = await fetch(`/api/employee?view=${managementListView}`, {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(await parseErrorMessage(response, "Unable to load employees."));
            }

            const payload = (await response.json()) as HrEmployeeListResponse;
            setEmployees(payload.employees ?? []);
        } catch (error) {
            setEmployees([]);
            logErrorToConsole("EmployeeManagementPage.loadEmployees", error, { managementListView });
            setLoadError(toUserFriendlyError(error, "We couldn't load the employee list right now."));
        } finally {
            setIsLoading(false);
        }
    }, [managementListView]);

    const loadDepartments = useCallback(async () => {
        try {
            const response = await fetch("/api/hr/departments", {
                cache: "no-store",
            });

            if (!response.ok) {
                setDepartments([]);
                return;
            }

            const payload = (await response.json()) as unknown;
            setDepartments(normalizeDepartmentsPayload(payload));
        } catch {
            setDepartments([]);
        }
    }, []);

    useEffect(() => {
        void loadEmployees();
        void loadDepartments();

        return () => {
            if (toastTimeoutRef.current) {
                window.clearTimeout(toastTimeoutRef.current);
            }
        };
    }, [loadDepartments, loadEmployees]);

    const manageableEmployees = useMemo(
        () => employees.filter((employee) => getRoleName(employee.role) !== "admin"),
        [employees],
    );

    const departmentFilterOptions = useMemo(() => {
        const names = Array.from(
            new Set(
                manageableEmployees
                    .map((employee) => getDepartmentName(employee.department))
                    .filter(Boolean),
            ),
        );

        return names.sort((left, right) => left.localeCompare(right));
    }, [manageableEmployees]);

    const editableDepartments = useMemo(() => {
        const sourceDepartments: DepartmentOption[] = [...departments];

        for (const employee of manageableEmployees) {
            if (!employee.department || typeof employee.department === "string") {
                continue;
            }

            const id = normalizeText(employee.department.id);
            const name = normalizeText(employee.department.name);
            if (!id || !name) {
                continue;
            }

            sourceDepartments.push({ id, name });
        }

        const departmentById = new Map<string, DepartmentOption>();
        for (const department of sourceDepartments) {
            const id = normalizeText(department.id);
            const name = normalizeText(department.name);
            if (!id || !name || departmentById.has(id)) {
                continue;
            }

            departmentById.set(id, {
                id,
                name,
            });
        }

        return Array.from(departmentById.values()).sort((left, right) => left.name.localeCompare(right.name));
    }, [departments, manageableEmployees]);

    const editDepartmentFallback = useMemo(() => {
        const id = normalizeText(selectedEmployeeDetail?.department_id);
        const name = normalizeText(selectedEmployeeDetail?.department?.name);
        if (!id || !name) {
            return null;
        }

        if (editableDepartments.some((department) => department.id === id)) {
            return null;
        }

        return { id, name };
    }, [editableDepartments, selectedEmployeeDetail?.department?.name, selectedEmployeeDetail?.department_id]);

    const filteredEmployees = useMemo(() => {
        const query = search.trim().toLowerCase();

        return manageableEmployees
            .filter((employee) => {
                const matchesName = !query || normalizeText(employee.full_name).toLowerCase().includes(query);
                const matchesStatus = statusFilter === "all" || getEmployeeStatusValue(employee.status) === statusFilter;
                const matchesDepartment = departmentFilter === "all" || getDepartmentName(employee.department) === departmentFilter;

                return matchesName && matchesStatus && matchesDepartment;
            })
            .sort((left, right) =>
                normalizeText(left.full_name).localeCompare(normalizeText(right.full_name), undefined, { sensitivity: "base" }),
            );
    }, [departmentFilter, manageableEmployees, search, statusFilter]);

    const summary = useMemo(() => {
        const pending = manageableEmployees.filter((employee) => getEmployeeStatusValue(employee.status) === "pending").length;
        const active = manageableEmployees.filter((employee) => getEmployeeStatusValue(employee.status) === "active").length;
        const offboard = manageableEmployees.filter((employee) => getEmployeeStatusValue(employee.status) === "offboard").length;

        return {
            total: manageableEmployees.length,
            pending,
            active,
            offboard,
        };
    }, [manageableEmployees]);

    useEffect(() => {
        setCurrentPage(1);
    }, [departmentFilter, search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        return filteredEmployees.slice(startIndex, startIndex + PAGE_SIZE);
    }, [currentPage, filteredEmployees]);

    const pageStart = filteredEmployees.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const pageEnd = filteredEmployees.length === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, filteredEmployees.length);

    const managerOptions = useMemo(() => {
        return manageableEmployees
            .filter((employee) => getRoleName(employee.role) === "manager")
            .map((employee) => ({
                id: normalizeText(employee.id),
                full_name: normalizeText(employee.full_name),
            }))
            .filter((employee) => employee.id && employee.full_name)
            .sort((left, right) => left.full_name.localeCompare(right.full_name));
    }, [manageableEmployees]);

    const roleOptions = useMemo(() => {
        const roleByName = new Map<string, { id: string; name: string }>();
        for (const employee of manageableEmployees) {
            const roleName = getRoleName(employee.role);
            const roleId = getRoleId(employee.role);
            if (!roleName || !roleId || roleName === "admin" || roleByName.has(roleName)) {
                continue;
            }

            roleByName.set(roleName, { id: roleId, name: roleName });
        }

        const preferredOrder = ["employee", "manager", "hr"];
        return preferredOrder
            .filter((roleName) => roleByName.has(roleName))
            .map((roleName) => roleByName.get(roleName) as { id: string; name: string });
    }, [manageableEmployees]);

    const defaultCreateRoleId = useMemo(() => {
        const employeeRole = roleOptions.find((role) => role.name === "employee");
        return employeeRole?.id ?? roleOptions[0]?.id ?? "";
    }, [roleOptions]);

    const selectedCreateRoleName = useMemo(() => {
        if (!isAdminMode) {
            return "employee";
        }

        const selectedRole = roleOptions.find((role) => role.id === employeeForm.role_id);
        return selectedRole?.name ?? "";
    }, [employeeForm.role_id, isAdminMode, roleOptions]);

    const createRequiresManager = useMemo(() => {
        if (!selectedCreateRoleName) {
            return false;
        }

        return !canRoleSkipManager(selectedCreateRoleName);
    }, [selectedCreateRoleName]);

    const openCreateModal = useCallback(() => {
        setFormError(null);
        setSelectedEmployee(null);
        setSelectedEmployeeDetail(null);
        setEmployeeForm({
            ...EMPTY_FORM,
            role_id: isAdminMode ? defaultCreateRoleId : "",
            join_date: new Date().toISOString().slice(0, 10),
        });
        setIsCreateOpen(true);
    }, [defaultCreateRoleId, isAdminMode]);

    const openDepartmentCreateModal = useCallback(() => {
        setDepartmentForm(EMPTY_DEPARTMENT_FORM);
        setDepartmentFormError(null);
        setIsDepartmentCreateOpen(true);
    }, []);

    const openEditModal = useCallback(
        async (employee: HrEmployeeSummary) => {
            setFormError(null);
            setSelectedEmployee(employee);
            setSelectedEmployeeDetail(null);
            setIsEditOpen(true);
            setIsDetailLoading(true);

            try {
                const response = await fetch(`/api/employee?view=${employeeDetailView}&id=${employee.id}`, {
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error(await parseErrorMessage(response, "Unable to load employee details."));
                }

                const payload = (await response.json()) as HrEmployeeDetail;
                setSelectedEmployeeDetail(payload);
                setEmployeeForm(mapDetailToForm(payload));
            } catch (error) {
                setIsEditOpen(false);
                logErrorToConsole("EmployeeManagementPage.openEditModal", error, { employeeId: employee.id });
                showToast(toUserFriendlyError(error, "We couldn't load employee details right now."), "error");
            } finally {
                setIsDetailLoading(false);
            }
        },
        [employeeDetailView, showToast],
    );

    const closeDepartmentCreateModal = useCallback(() => {
        if (isDepartmentSubmitting) {
            return;
        }

        setIsDepartmentCreateOpen(false);
        setDepartmentFormError(null);
    }, [isDepartmentSubmitting]);

    const resetModals = useCallback(() => {
        setIsCreateOpen(false);
        setIsEditOpen(false);
        setIsDetailLoading(false);
        setIsSubmitting(false);
        setEmployeePendingDelete(null);
        setFormError(null);
    }, []);

    const handleDepartmentCreateSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();

        if (isDepartmentSubmitting) {
            return;
        }

        const name = departmentForm.name.trim();
        const description = departmentForm.description.trim();
        if (!name) {
            setDepartmentFormError("Department name is required.");
            return;
        }
        if (!description) {
            setDepartmentFormError("Department description is required.");
            return;
        }

        setDepartmentFormError(null);
        setIsDepartmentSubmitting(true);

        try {
            const response = await fetch("/api/hr/departments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, description }),
            });

            if (!response.ok) {
                throw new Error(await parseErrorMessage(response, "Unable to create department."));
            }

            await loadDepartments();
            setIsDepartmentCreateOpen(false);
            setDepartmentForm(EMPTY_DEPARTMENT_FORM);
            setDepartmentFormError(null);
            showToast("Department added successfully.", "success");
        } catch (error) {
            logErrorToConsole("EmployeeManagementPage.handleDepartmentCreateSubmit", error, { name });
            setDepartmentFormError(toUserFriendlyError(error, "We couldn't create the department right now."));
        } finally {
            setIsDepartmentSubmitting(false);
        }
    };

    const handleCreateSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        setFormError(null);
        setIsSubmitting(true);

        try {
            const payload = buildCreatePayload(employeeForm);
            const selectedRoleNameForCreate = isAdminMode ? selectedCreateRoleName : "employee";

            if (
                !payload.email ||
                !payload.first_name ||
                !payload.last_name ||
                !payload.date_of_birth ||
                !payload.position ||
                !payload.department_id
            ) {
                throw new Error("Please fill all required fields.");
            }
            if (isAdminMode && !payload.role_id) {
                throw new Error("Please choose an account role.");
            }
            if (createRequiresManager && !payload.manager_id) {
                throw new Error("This role must have a manager.");
            }
            if (!SIMPLE_EMAIL_PATTERN.test(payload.email)) {
                throw new Error("Invalid email format.");
            }
            if (!isIsoDate(payload.date_of_birth)) {
                throw new Error("Date of birth must use YYYY-MM-DD format.");
            }
            if (payload.join_date && !isIsoDate(payload.join_date)) {
                throw new Error("Join date must use YYYY-MM-DD format.");
            }
            if (!isUuid(payload.department_id)) {
                throw new Error("Invalid department value. Please choose again.");
            }
            if (payload.role_id && !isUuid(payload.role_id)) {
                throw new Error("Invalid role value. Please choose again.");
            }
            if (payload.manager_id && !isUuid(payload.manager_id)) {
                throw new Error("Invalid manager value. Please choose again.");
            }
            if (!selectedRoleNameForCreate) {
                throw new Error("Unable to determine selected role. Please try again.");
            }

            const response = await fetch(`/api/employee?view=${managementListView}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(await parseErrorMessage(response, isAdminMode ? "Unable to create account." : "Unable to create employee."));
            }

            await loadEmployees();
            resetModals();
            setEmployeeForm(EMPTY_FORM);
            showToast(isAdminMode ? "Account created successfully." : "Employee created successfully.", "success");
        } catch (error) {
            logErrorToConsole("EmployeeManagementPage.handleCreateSubmit", error, { mode, managementListView });
            setFormError(
                toUserFriendlyError(error, isAdminMode ? "We couldn't create the account right now." : "We couldn't create the employee right now."),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        if (!selectedEmployee || !selectedEmployeeDetail) {
            return;
        }

        setFormError(null);
        setIsSubmitting(true);

        try {
            const resolvedRoleName = resolveEmployeeRoleName(selectedEmployeeDetail, selectedEmployee);
            const resolvedRoleId = resolveEmployeeRoleId(selectedEmployeeDetail, selectedEmployee);
            const roleCanSkipManager = canRoleSkipManager(resolvedRoleName);
            const payload = buildUpdatePayload(employeeForm, selectedEmployeeDetail, resolvedRoleId);
            if (!payload.first_name || !payload.last_name || !payload.date_of_birth || !payload.position || !payload.department_id) {
                throw new Error("Please fill all required fields.");
            }
            if (!payload.role_id) {
                throw new Error("Unable to determine employee role. Please reload and try again.");
            }
            if (!roleCanSkipManager && !payload.manager_id) {
                throw new Error("This role must have a manager.");
            }

            const response = await fetch(`/api/employee?view=${employeeMutationView}&id=${selectedEmployee.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(await parseErrorMessage(response, isAdminMode ? "Unable to update account." : "Unable to update employee."));
            }

            await loadEmployees();
            resetModals();
            showToast(isAdminMode ? "Account updated successfully." : "Employee updated successfully.", "success");
        } catch (error) {
            logErrorToConsole("EmployeeManagementPage.handleEditSubmit", error, { employeeId: selectedEmployee.id, mode });
            setFormError(
                toUserFriendlyError(error, isAdminMode ? "We couldn't update the account right now." : "We couldn't update the employee right now."),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteConfirmation = useCallback(
        (employee: HrEmployeeSummary) => {
            const roleName = getRoleName(employee.role);
            if (!canDeleteRole(roleName, mode)) {
                showToast(
                    isAdminMode ? "Only employee, HR, or manager accounts can be deleted." : "Only employee role can be deleted.",
                    "error",
                );
                return;
            }

            setEmployeePendingDelete(employee);
        },
        [isAdminMode, mode, showToast],
    );

    const handleDeleteEmployee = useCallback(async () => {
        if (!employeePendingDelete) {
            return;
        }

        setDeletingEmployeeId(employeePendingDelete.id);
        try {
            const response = await fetch(`/api/employee?view=${employeeMutationView}&id=${employeePendingDelete.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(await parseErrorMessage(response, isAdminMode ? "Unable to delete account." : "Unable to delete employee."));
            }

            await loadEmployees();
            if (selectedEmployee?.id === employeePendingDelete.id) {
                resetModals();
            } else {
                setEmployeePendingDelete(null);
            }
            showToast(isAdminMode ? "Account deleted successfully." : "Employee deleted successfully.", "success");
        } catch (error) {
            logErrorToConsole("EmployeeManagementPage.handleDeleteEmployee", error, { employeeId: employeePendingDelete.id, mode });
            showToast(
                toUserFriendlyError(error, isAdminMode ? "We couldn't delete the account right now." : "We couldn't delete the employee right now."),
                "error",
            );
        } finally {
            setDeletingEmployeeId(null);
        }
    }, [employeeMutationView, employeePendingDelete, isAdminMode, loadEmployees, mode, resetModals, selectedEmployee?.id, showToast]);

    const stats = [
        { label: isAdminMode ? "Total accounts" : "Total employees", value: summary.total.toString() },
        { label: "Pending", value: summary.pending.toString() },
        { label: "Active", value: summary.active.toString() },
        { label: "Offboard", value: summary.offboard.toString() },
    ];

    const editManagerOptions = selectedEmployee
        ? managerOptions.filter((manager) => manager.id !== selectedEmployee.id)
        : managerOptions;
    const selectedRoleName = resolveEmployeeRoleName(selectedEmployeeDetail, selectedEmployee);
    const isManagerOptional = canRoleSkipManager(selectedRoleName);
    const requiresManager = !isManagerOptional;
    const pendingDeleteLabel = employeePendingDelete
        ? normalizeText(employeePendingDelete.full_name) || normalizeText(employeePendingDelete.email) || (isAdminMode ? "this account" : "this employee")
        : "";
    const isDeletingPendingEmployee = Boolean(employeePendingDelete && deletingEmployeeId === employeePendingDelete.id);

    return (
        <>
            <section className="w-full space-y-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                            {isAdminMode ? "Account Management" : "Employee Management"}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {isAdminMode
                                ? "Search, filter, onboard, and maintain accounts for employee, HR, and manager roles."
                                : "Search, filter, onboard, and maintain employee records from one place."}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={openDepartmentCreateModal}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            Add department
                        </button>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            {isAdminMode ? "Add account" : "Add employee"}
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</div>
                            <div className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</div>
                        </div>
                    ))}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
                            <div className="min-w-[240px] flex-1">
                                <TextInput
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={isAdminMode ? "Search by account name" : "Search by employee name"}
                                    aria-label={isAdminMode ? "Search accounts by name" : "Search employees by name"}
                                />
                            </div>

                            <div className="min-w-[180px]">
                                <SelectInput
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    aria-label="Filter by status"
                                >
                                    <option value="all">All status</option>
                                    {STATUS_FILTER_OPTIONS.map((status) => (
                                        <option key={status} value={status}>
                                            {titleizeStatus(status)}
                                        </option>
                                    ))}
                                </SelectInput>
                            </div>

                            <div className="min-w-[220px]">
                                <SelectInput
                                    value={departmentFilter}
                                    onChange={(event) => setDepartmentFilter(event.target.value)}
                                    aria-label="Filter by department"
                                >
                                    <option value="all">All departments</option>
                                    {departmentFilterOptions.map((departmentName) => (
                                        <option key={departmentName} value={departmentName}>
                                            {departmentName}
                                        </option>
                                    ))}
                                </SelectInput>
                            </div>
                        </div>

                        <div className="text-sm text-slate-500">
                            Showing <span className="font-semibold text-slate-900">{pageStart}</span>-
                            <span className="font-semibold text-slate-900">{pageEnd}</span> of{" "}
                            <span className="font-semibold text-slate-900">{filteredEmployees.length}</span> filtered,{" "}
                            <span className="font-semibold text-slate-900">{manageableEmployees.length}</span>{" "}
                            {isAdminMode ? "accounts" : "employees"}
                        </div>
                    </div>

                    {loadError ? (
                        <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-600">{loadError}</div>
                    ) : null}

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                    <th className="px-5 py-4">{isAdminMode ? "Account" : "Employee"}</th>
                                    <th className="px-5 py-4">Code</th>
                                    <th className="px-5 py-4">Department</th>
                                    <th className="px-5 py-4">Role</th>
                                    <th className="px-5 py-4">Position</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                                            {isAdminMode ? "Loading accounts..." : "Loading employees..."}
                                        </td>
                                    </tr>
                                ) : filteredEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                                            {isAdminMode ? "No accounts match the current filters." : "No employees match the current filters."}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedEmployees.map((employee) => {
                                        const employeeRoleName = getRoleName(employee.role);
                                        const canDeleteEmployee = canDeleteRole(employeeRoleName, mode);
                                        const isDeletingThisEmployee = deletingEmployeeId === employee.id;

                                        return (
                                            <tr key={employee.id} className="align-top hover:bg-slate-50/70">
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1">
                                                        <div className="font-semibold text-slate-950">{employee.full_name}</div>
                                                        <div className="text-sm text-slate-500">{employee.email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{employee.employee_code}</td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{getDepartmentName(employee.department) || "--"}</td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{formatRoleLabel(employeeRoleName)}</td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{normalizeText(employee.position) || "--"}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClassName(employee.status)}`}>
                                                        {titleizeStatus(getEmployeeStatusValue(employee.status))}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => void openEditModal(employee)}
                                                            disabled={isDeletingThisEmployee}
                                                            className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openDeleteConfirmation(employee)}
                                                            disabled={!canDeleteEmployee || isDeletingThisEmployee}
                                                            title={
                                                                canDeleteEmployee
                                                                    ? isAdminMode
                                                                        ? "Delete account"
                                                                        : "Delete employee"
                                                                    : isAdminMode
                                                                      ? "Only employee, HR, or manager accounts can be deleted"
                                                                      : "Only employee role can be deleted"
                                                            }
                                                            className="inline-flex items-center rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {isDeletingThisEmployee ? "Deleting..." : "Delete"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!isLoading && filteredEmployees.length > 0 ? (
                        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                Page <span className="font-semibold text-slate-900">{currentPage}</span> of{" "}
                                <span className="font-semibold text-slate-900">{totalPages}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={currentPage === 1}
                                    className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

            </section>

            {employeePendingDelete ? (
                <ModalShell
                    title={isAdminMode ? "Delete account" : "Delete employee"}
                    description="This action is permanent. Please confirm before deleting."
                    onClose={() => {
                        if (!isDeletingPendingEmployee) {
                            setEmployeePendingDelete(null);
                        }
                    }}
                    widthClassName="max-w-xl"
                >
                    <div className="space-y-5">
                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            Are you sure you want to delete <span className="font-semibold">{pendingDeleteLabel}</span>?
                        </div>

                        <div className="text-sm text-slate-500">
                            {isAdminMode
                                ? "Only accounts with role employee, HR, or manager can be deleted."
                                : "Only employees with role employee can be deleted."}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                            <button
                                type="button"
                                onClick={() => setEmployeePendingDelete(null)}
                                disabled={isDeletingPendingEmployee}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleDeleteEmployee()}
                                disabled={isDeletingPendingEmployee}
                                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isDeletingPendingEmployee ? "Deleting..." : isAdminMode ? "Delete account" : "Delete employee"}
                            </button>
                        </div>
                    </div>
                </ModalShell>
            ) : null}

            {isCreateOpen ? (
                <ModalShell
                    title={isAdminMode ? "Add account" : "Add employee"}
                    description={
                        isAdminMode
                            ? "Create a new account for employee, HR, or manager and trigger the onboarding flow."
                            : "Create a new employee profile and trigger the onboarding flow."
                    }
                    onClose={resetModals}
                >
                    <form className="space-y-5" onSubmit={handleCreateSubmit}>
                        {formError ? (
                            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">{formError}</div>
                        ) : null}

                        <div className="grid gap-4 md:grid-cols-2">
                            <FieldShell label="First name" required>
                                <TextInput
                                    value={employeeForm.first_name}
                                    onChange={(event) => setEmployeeForm((current) => ({ ...current, first_name: event.target.value }))}
                                    placeholder="Nguyen"
                                />
                            </FieldShell>
                            <FieldShell label="Last name" required>
                                <TextInput
                                    value={employeeForm.last_name}
                                    onChange={(event) => setEmployeeForm((current) => ({ ...current, last_name: event.target.value }))}
                                    placeholder="Van A"
                                />
                            </FieldShell>
                            <FieldShell label="Email" required>
                                <TextInput
                                    type="email"
                                    value={employeeForm.email}
                                    onChange={(event) => setEmployeeForm((current) => ({ ...current, email: event.target.value }))}
                                    placeholder={isAdminMode ? "account@company.com" : "employee@company.com"}
                                />
                            </FieldShell>
                            <FieldShell label="Position" required>
                                <TextInput
                                    value={employeeForm.position}
                                    onChange={(event) => setEmployeeForm((current) => ({ ...current, position: event.target.value }))}
                                    placeholder="Frontend Developer"
                                />
                            </FieldShell>
                            <FieldShell label="Date of birth" required>
                                <TextInput
                                    type="date"
                                    value={employeeForm.date_of_birth}
                                    onChange={(event) => setEmployeeForm((current) => ({ ...current, date_of_birth: event.target.value }))}
                                />
                            </FieldShell>
                            <FieldShell label="Join date">
                                <TextInput
                                    type="date"
                                    value={employeeForm.join_date}
                                    onChange={(event) => setEmployeeForm((current) => ({ ...current, join_date: event.target.value }))}
                                />
                            </FieldShell>
                            <FieldShell label="Phone">
                                <TextInput
                                    value={employeeForm.phone}
                                    onChange={(event) => setEmployeeForm((current) => ({ ...current, phone: event.target.value }))}
                                    placeholder="0946..."
                                />
                            </FieldShell>
                            <FieldShell label="Address">
                                <TextInput
                                    value={employeeForm.address}
                                    onChange={(event) => setEmployeeForm((current) => ({ ...current, address: event.target.value }))}
                                    placeholder="Ho Chi Minh City"
                                />
                            </FieldShell>
                            <FieldShell label="Department">
                                <SelectInput
                                    value={employeeForm.department_id}
                                    disabled={editableDepartments.length === 0}
                                    onChange={(event) => setEmployeeForm((current) => ({ ...current, department_id: event.target.value }))}
                                >
                                    <option value="" disabled>
                                        Select department
                                    </option>
                                    {editableDepartments.map((department) => (
                                        <option key={department.id} value={department.id}>
                                            {department.name}
                                        </option>
                                    ))}
                                </SelectInput>
                            </FieldShell>
                            {isAdminMode ? (
                                <FieldShell label="Role" required>
                                    <SelectInput
                                        value={employeeForm.role_id}
                                        disabled={roleOptions.length === 0}
                                        onChange={(event) =>
                                            setEmployeeForm((current) => ({ ...current, role_id: event.target.value }))
                                        }
                                    >
                                        {roleOptions.length === 0 ? (
                                            <option value="">No role available</option>
                                        ) : (
                                            <>
                                                <option value="" disabled>
                                                    Select role
                                                </option>
                                                {roleOptions.map((role) => (
                                                    <option key={role.id} value={role.id}>
                                                        {formatRoleLabel(role.name)}
                                                    </option>
                                                ))}
                                            </>
                                        )}
                                    </SelectInput>
                                </FieldShell>
                            ) : null}
                            <FieldShell label="Manager" required={createRequiresManager}>
                                <SelectInput
                                    value={employeeForm.manager_id}
                                    disabled={createRequiresManager && managerOptions.length === 0}
                                    onChange={(event) => setEmployeeForm((current) => ({ ...current, manager_id: event.target.value }))}
                                >
                                    {createRequiresManager ? (
                                        <option value="" disabled>
                                            Select manager
                                        </option>
                                    ) : (
                                        <option value="">No manager</option>
                                    )}
                                    {managerOptions.map((manager) => (
                                        <option key={manager.id} value={manager.id}>
                                            {manager.full_name}
                                        </option>
                                    ))}
                                </SelectInput>
                            </FieldShell>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                            <button
                                type="button"
                                onClick={resetModals}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? "Creating..." : isAdminMode ? "Create account" : "Create employee"}
                            </button>
                        </div>
                    </form>
                </ModalShell>
            ) : null}

            {isDepartmentCreateOpen ? (
                <ModalShell
                    title="Add department"
                    description="Create a new department for employee assignment."
                    onClose={closeDepartmentCreateModal}
                    widthClassName="max-w-xl"
                >
                    <form className="space-y-5" onSubmit={handleDepartmentCreateSubmit}>
                        {departmentFormError ? (
                            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                                {departmentFormError}
                            </div>
                        ) : null}

                        <FieldShell label="Department name" required>
                            <TextInput
                                value={departmentForm.name}
                                onChange={(event) =>
                                    setDepartmentForm((current) => ({ ...current, name: event.target.value }))
                                }
                                placeholder="Ex: Finance"
                                maxLength={120}
                            />
                        </FieldShell>
                        <FieldShell label="Description" required>
                            <TextInput
                                value={departmentForm.description}
                                onChange={(event) =>
                                    setDepartmentForm((current) => ({ ...current, description: event.target.value }))
                                }
                                placeholder="Ex: Handles payroll and people operations"
                                maxLength={255}
                            />
                        </FieldShell>

                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                            <button
                                type="button"
                                onClick={closeDepartmentCreateModal}
                                disabled={isDepartmentSubmitting}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isDepartmentSubmitting}
                                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isDepartmentSubmitting ? "Creating..." : "Create department"}
                            </button>
                        </div>
                    </form>
                </ModalShell>
            ) : null}

            {isEditOpen ? (
                <ModalShell
                    title={isAdminMode ? "Edit account" : "Edit employee"}
                    description={
                        isAdminMode
                            ? "Update account information and status in one place."
                            : "Update employee information and status in one place."
                    }
                    onClose={resetModals}
                >
                    {isDetailLoading ? (
                        <div className="py-12 text-center text-sm text-slate-500">
                            {isAdminMode ? "Loading account details..." : "Loading employee details..."}
                        </div>
                    ) : selectedEmployeeDetail ? (
                        <form className="space-y-5" onSubmit={handleEditSubmit}>
                            {formError ? (
                                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">{formError}</div>
                            ) : null}

                            <div className="grid gap-4 md:grid-cols-2">
                                <FieldShell label="Email">
                                    <TextInput value={employeeForm.email} disabled className="cursor-not-allowed opacity-70" />
                                </FieldShell>
                                <FieldShell label="Employee code">
                                    <TextInput
                                        value={normalizeText(selectedEmployeeDetail.employee_code)}
                                        disabled
                                        className="cursor-not-allowed opacity-70"
                                    />
                                </FieldShell>
                                <FieldShell label="First name" required>
                                    <TextInput
                                        value={employeeForm.first_name}
                                        onChange={(event) => setEmployeeForm((current) => ({ ...current, first_name: event.target.value }))}
                                    />
                                </FieldShell>
                                <FieldShell label="Last name" required>
                                    <TextInput
                                        value={employeeForm.last_name}
                                        onChange={(event) => setEmployeeForm((current) => ({ ...current, last_name: event.target.value }))}
                                    />
                                </FieldShell>
                                <FieldShell label="Date of birth" required>
                                    <TextInput
                                        type="date"
                                        value={employeeForm.date_of_birth}
                                        onChange={(event) => setEmployeeForm((current) => ({ ...current, date_of_birth: event.target.value }))}
                                    />
                                </FieldShell>
                                <FieldShell label="Join date">
                                    <TextInput
                                        value={formatDate(selectedEmployeeDetail.join_date)}
                                        disabled
                                        className="cursor-not-allowed opacity-70"
                                    />
                                </FieldShell>
                                <FieldShell label="Phone">
                                    <TextInput
                                        value={employeeForm.phone}
                                        onChange={(event) => setEmployeeForm((current) => ({ ...current, phone: event.target.value }))}
                                    />
                                </FieldShell>
                                <FieldShell label="Address">
                                    <TextInput
                                        value={employeeForm.address}
                                        onChange={(event) => setEmployeeForm((current) => ({ ...current, address: event.target.value }))}
                                    />
                                </FieldShell>
                                <FieldShell label="Department">
                                    <SelectInput
                                        value={employeeForm.department_id}
                                        disabled={editableDepartments.length === 0 && !editDepartmentFallback}
                                        onChange={(event) => setEmployeeForm((current) => ({ ...current, department_id: event.target.value }))}
                                    >
                                        <option value="" disabled>
                                            Select department
                                        </option>
                                        {editDepartmentFallback ? (
                                            <option value={editDepartmentFallback.id}>{editDepartmentFallback.name}</option>
                                        ) : null}
                                        {editableDepartments.map((department) => (
                                            <option key={department.id} value={department.id}>
                                                {department.name}
                                            </option>
                                        ))}
                                    </SelectInput>
                                </FieldShell>
                                <FieldShell label="Manager" required={requiresManager}>
                                    <SelectInput
                                        value={employeeForm.manager_id}
                                        disabled={requiresManager && editManagerOptions.length === 0}
                                        onChange={(event) => setEmployeeForm((current) => ({ ...current, manager_id: event.target.value }))}
                                    >
                                        {requiresManager ? (
                                            <option value="" disabled>
                                                Select manager
                                            </option>
                                        ) : (
                                            <option value="">No manager</option>
                                        )}
                                        {editManagerOptions.map((manager) => (
                                            <option key={manager.id} value={manager.id}>
                                                {manager.full_name}
                                            </option>
                                        ))}
                                    </SelectInput>
                                </FieldShell>
                                <FieldShell label="Position" required>
                                    <TextInput
                                        value={employeeForm.position}
                                        onChange={(event) => setEmployeeForm((current) => ({ ...current, position: event.target.value }))}
                                    />
                                </FieldShell>
                                <FieldShell label="Status" required>
                                    <SelectInput
                                        value={employeeForm.status}
                                        onChange={(event) => setEmployeeForm((current) => ({ ...current, status: event.target.value }))}
                                    >
                                        {STATUS_UPDATE_OPTIONS.map((status) => (
                                            <option key={status} value={status}>
                                                {titleizeStatus(status)}
                                            </option>
                                        ))}
                                    </SelectInput>
                                </FieldShell>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                                <button
                                    type="button"
                                    onClick={resetModals}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                        </form>
                    ) : null}
                </ModalShell>
            ) : null}

            {toast ? (
                <div
                    className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
                        toast.tone === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                    }`}
                >
                    {toast.message}
                </div>
            ) : null}
        </>
    );
}
