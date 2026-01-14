import init, { encap as wasmEncap, decap as wasmDecap } from "./mlkem1024-wasm";

let isInitialized = false;

/**
 * Initialize the WASM module.
 * Must be called before using encap/decap.
 */
export async function initMlKem1024() {
	if (!isInitialized) {
		// Load the WASM file from the public directory
		await init("/wasm/mlkem1024_bg.wasm");
		isInitialized = true;
	}
}

/**
 * Encapsulate: Generate shared secret and ciphertext from public key
 * @param publicKey - ML-KEM-1024 public key (1568 bytes)
 * @returns { sharedSecret: Uint8Array (32 bytes), ciphertext: Uint8Array (1568 bytes) }
 */
export function encapsulate1024(publicKey: Uint8Array) {
	if (!isInitialized) throw new Error("WASM not initialized. Call initMlKem1024() first.");

	// WASM encap returns concatenated [shared_secret (32) | ciphertext (1568)]
	const result = wasmEncap(publicKey);

	const sharedSecret = result.slice(0, 32);
	const ciphertext = result.slice(32);

	return {
		sharedSecret,
		ciphertext,
	};
}

/**
 * Decapsulate: Recover shared secret from private key and ciphertext
 * @param ciphertext - ML-KEM-1024 ciphertext (1568 bytes)
 * @param privateKey - ML-KEM-1024 private key (3168 bytes)
 * @returns sharedSecret - 32 bytes
 */
export function decapsulate1024(ciphertext: Uint8Array, privateKey: Uint8Array): Uint8Array {
	if (!isInitialized) throw new Error("WASM not initialized. Call initMlKem1024() first.");

	return wasmDecap(privateKey, ciphertext);
}
