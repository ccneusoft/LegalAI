// Manual TypeScript declarations for the Claude Agent SDK
// The upstream package currently ships no .d.ts files so we provide a
// minimal set of types used throughout the codebase.

declare module '@anthropic-ai/claude-agent-sdk' {
  // permission responses that the SDK expects when a tool requests user
  // approval.  the runtime uses only the fields below, but other values
  // may also be present in the real SDK.
  export type PermissionResult = {
    behavior: 'allow' | 'deny';
    /**
     * When the tool request carries input that can be modified (e.g. AskUserQuestion)
     * the SDK will merge this object back into the request before continuing.
     */
    updatedInput?: Record<string, unknown>;
    /** optional human-readable message associated with a denial. */
    message?: string;
  };

  // result objects returned by various CLI/SDK helper functions such as
  // `unstable_v2_prompt`.  Currently we only consume `subtype` and `result`
  // but we allow arbitrary additional properties so callers can inspect
  // anything else if necessary.
  export interface SDKResultMessage {
    subtype: string;
    result: string;
    [key: string]: unknown;
  }

  // helpers we call directly; the signatures are intentionally loose since
  // the SDK itself is untyped and may change between releases.
  export function unstable_v2_prompt(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<SDKResultMessage>;

  export function load(...args: any[]): any;
  export function createClient(...args: any[]): any;

  // export a catch‑all so that importing the module without named bindings
  // still works.
  const _default: any;
  export default _default;
}
