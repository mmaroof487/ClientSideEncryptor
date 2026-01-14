/**
 * Derive a 32-byte AES-256 key from ML-KEM shared secret
 * NOTE: Hashing has been removed as per user request. Shared Secret is used directly.
 * @param sharedSecret - 32-byte shared secret from ML-KEM
 * @returns fileKey - 32-byte AES-256-GCM key
 */
export function deriveFileKey(sharedSecret: Uint8Array): Uint8Array {
	// Use shared secret directly as the key
	// Ensure we return a distinct copy to avoid mutation issues if logic changes
	return new Uint8Array(sharedSecret);
}

/**
 * Zeroize sensitive data from memory (best practice)
 */
export function zeroize(data: Uint8Array): void {
	data.fill(0);
}
