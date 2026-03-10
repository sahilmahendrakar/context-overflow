interface Config {
    token?: string;
    apiUrl: string;
}
export declare function loadConfig(): Config;
export declare function saveConfig(config: Partial<Config>): void;
export declare function requireToken(): string;
export {};
