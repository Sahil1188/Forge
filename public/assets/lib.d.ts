// Types for the console toolkit (lib.js), used by the server-side tests. Not served to browsers.
export declare class Safe {
  value: string;
  constructor(value: string);
}
export declare function esc(value: unknown): string;
export declare function html(strings: TemplateStringsArray, ...values: unknown[]): Safe;
export declare function money(n: unknown): string;
export declare function duration(ms: number | null | undefined): string;
export declare function ago(date: unknown): string;
export declare function when(date: unknown): string;
export declare function label(status: string): string;
export declare function goalFields(text: string): { title: string; description?: string };
export declare function parseSkills(text: string): Array<{ skillKey: string; level: number }>;
export declare function list(text: string): string[];
export declare function lines(text: string): string[];
