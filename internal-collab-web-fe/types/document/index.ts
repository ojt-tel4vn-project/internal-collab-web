export interface DocumentRecord {
    id: string;
    title: string;
    category_id: string;
    roles: string;
    file_path: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    description?: string;
    is_read?: boolean;
    created_at: string;
    uploaded_by?: string;
}

export interface DocumentApiItem {
    id?: string;
    title?: string;
    description?: string;
    category_id?: string;
    roles?: string;
    file_name?: string;
    file_path?: string;
    file_size?: number;
    mime_type?: string;
    is_read?: boolean;
    uploaded_by?: string;
    created_at?: string;
    ID?: string;
    Title?: string;
    Description?: string;
    CategoryID?: string;
    Roles?: string;
    FileName?: string;
    FilePath?: string;
    FileSize?: number;
    MimeType?: string;
    IsRead?: boolean;
    UploadedBy?: string;
}

export type DocumentsApiResponse =
    | DocumentApiItem[]
    | {
        data?: DocumentApiItem[];
        body?: DocumentApiItem[] | { data?: DocumentApiItem[] };
    };

export interface MarkReadResponse {
    $schema?: string;
    message?: string;
}

function asText(value: unknown) {
    return typeof value === "string" ? value : "";
}

function asNumber(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
}

function asBoolean(value: unknown) {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return undefined;
}

export function normalizeDocument(item: DocumentApiItem): DocumentRecord {
    return {
        id: asText(item.id ?? item.ID),
        title: asText(item.title ?? item.Title),
        description: asText(item.description ?? item.Description),
        category_id: asText(item.category_id ?? item.CategoryID),
        roles: asText(item.roles ?? item.Roles),
        file_name: asText(item.file_name ?? item.FileName),
        file_path: asText(item.file_path ?? item.FilePath),
        file_size: asNumber(item.file_size ?? item.FileSize),
        mime_type: asText(item.mime_type ?? item.MimeType),
        is_read: asBoolean(item.is_read ?? item.IsRead),
        uploaded_by: asText(item.uploaded_by ?? item.UploadedBy),
        created_at: asText(item.created_at),
    };
}
