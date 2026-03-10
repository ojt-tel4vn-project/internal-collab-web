export interface DocumentRecord {
    id: string;
    title: string;
    category_id: string;
    roles: string;
    file_path: string;
    created_at: string;
    uploaded_by?: string;
}

export interface DocumentApiItem {
    id?: string;
    title?: string;
    category_id?: string;
    roles?: string;
    file_path?: string;
    uploaded_by?: string;
    created_at?: string;
    ID?: string;
    Title?: string;
    CategoryID?: string;
    Roles?: string;
    FilePath?: string;
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

export function normalizeDocument(item: DocumentApiItem): DocumentRecord {
    return {
        id: asText(item.id ?? item.ID),
        title: asText(item.title ?? item.Title),
        category_id: asText(item.category_id ?? item.CategoryID),
        roles: asText(item.roles ?? item.Roles),
        file_path: asText(item.file_path ?? item.FilePath),
        uploaded_by: asText(item.uploaded_by ?? item.UploadedBy),
        created_at: asText(item.created_at),
    };
}
