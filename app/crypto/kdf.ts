import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";

/**
 * Derive a 32-byte AES-256 key from ML-KEM shared secret using HKDF
 * @param sharedSecret - 32-byte shared secret from ML-KEM
 * @returns fileKey - 32-byte AES-256-GCM key
 */
export function deriveFileKey(sharedSecret: Uint8Array): Uint8Array {
	const info = new TextEncoder().encode("XKEM file encryption v1");

	// HKDF with SHA-256
	// salt = null (extract from shared secret directly)
	// info = domain separator
	// length = 32 bytes (256 bits for AES-256)
	const fileKey = hkdf(sha256, sharedSecret, undefined, info, 32);

	return fileKey;
}

/**
 * Zeroize sensitive data from memory (best practice)
 */
export function zeroize(data: Uint8Array): void {
	data.fill(0);
}
