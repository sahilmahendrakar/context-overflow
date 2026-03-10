export declare class ApiClient {
    private baseUrl;
    private token?;
    constructor(token?: string);
    private headers;
    get<T = unknown>(path: string, params?: Record<string, string>): Promise<T>;
    post<T = unknown>(path: string, body?: unknown): Promise<T>;
}
