// gltf-validator ships without types; this covers the part the tests use.
declare module 'gltf-validator' {
  export interface ValidatorMessage {
    code: string;
    message: string;
    severity: number;
    pointer?: string;
  }
  export function validateBytes(
    data: Uint8Array,
    options?: { maxIssues?: number; ignoredIssues?: string[] },
  ): Promise<{ issues: { numErrors: number; messages: ValidatorMessage[] } }>;
}
