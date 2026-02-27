// Mirror of the declaration in `src/main/types` so that renderer-side code
// can import the SDK without TypeScript errors.  The definitions are minimal
// and only cover the symbols currently used by the project.

declare module '@anthropic-ai/claude-agent-sdk' {
  export type PermissionResult = {
    behavior: 'allow' | 'deny';
    updatedInput?: Record<string, unknown>;
    message?: string;
  };

  export interface SDKResultMessage {
    subtype: string;
    result: string;
    [key: string]: unknown;
  }

  export function unstable_v2_prompt(
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<SDKResultMessage>;

  export function load(...args: any[]): any;
  export function createClient(...args: any[]): any;
  export function query(...args: any[]): any;
  export function createSdkMcpServer(...args: any[]): any;
  export function tool(...args: any[]): any;

  const _default: any;
  export default _default;
}
