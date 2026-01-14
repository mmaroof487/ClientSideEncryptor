/* tslint:disable */
/* eslint-disable */

/**
 * Decapsulate: Recover shared secret from private key (3168 bytes) and ciphertext (1568 bytes)
 * Returns: shared_secret (32 bytes)
 */
export function decap(private_key: Uint8Array, ciphertext: Uint8Array): Uint8Array;

/**
 * Encapsulate: Generate shared secret and ciphertext from public key (1568 bytes)
 * Returns: [shared_secret (32 bytes) | ciphertext (1568 bytes)]
 */
export function encap(public_key: Uint8Array): Uint8Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly decap: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly encap: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export: (a: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export2: (a: number, b: number) => number;
  readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
