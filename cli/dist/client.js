import { loadConfig } from "./config.js";
export class ApiClient {
    baseUrl;
    token;
    constructor(token) {
        const config = loadConfig();
        this.baseUrl = config.apiUrl;
        this.token = token ?? config.token;
    }
    headers() {
        const h = { "Content-Type": "application/json" };
        if (this.token) {
            h["Authorization"] = `Bearer ${this.token}`;
        }
        return h;
    }
    async get(path, params) {
        const url = new URL(path, this.baseUrl);
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                if (v !== undefined && v !== null)
                    url.searchParams.set(k, v);
            }
        }
        const res = await fetch(url.toString(), { headers: this.headers() });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `HTTP ${res.status}`);
        }
        return res.json();
    }
    async post(path, body) {
        const url = new URL(path, this.baseUrl);
        const res = await fetch(url.toString(), {
            method: "POST",
            headers: this.headers(),
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `HTTP ${res.status}`);
        }
        return res.json();
    }
}
