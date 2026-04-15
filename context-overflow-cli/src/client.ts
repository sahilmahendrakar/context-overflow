import { loadConfig, loadProjectConfig } from "./config.js";

export class ApiClient {
  private baseUrl: string;
  private token?: string;
  private projectId?: string;

  constructor(token?: string, baseUrl?: string) {
    const config = loadConfig();
    const projectConfig = loadProjectConfig();
    this.baseUrl = baseUrl ?? config.apiUrl;
    this.token = token ?? config.token;
    this.projectId = projectConfig?.projectId;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) {
      h["Authorization"] = `Bearer ${this.token}`;
    }
    return h;
  }

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (this.projectId) {
      url.searchParams.set("projectId", this.projectId);
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, v);
      }
    }
    const res = await fetch(url.toString(), { headers: this.headers() });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const merged =
      this.projectId && body && typeof body === "object"
        ? { projectId: this.projectId, ...body }
        : body;
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: this.headers(),
      body: merged !== undefined ? JSON.stringify(merged) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const res = await fetch(url.toString(), {
      method: "PATCH",
      headers: this.headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }
}
