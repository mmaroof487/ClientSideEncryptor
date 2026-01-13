import { ml_kem768 } from "@noble/post-quantum/ml-kem.js";

/**
 * Generate a new ML-KEM-768 keypair
 * @returns {publicKey: Uint8Array, privateKey: Uint8Array}
 */
export function generateMlKemKeypair() {
	// Generate 64 bytes of random seed for key generation
	const seed = crypto.getRandomValues(new Uint8Array(64));
	const keypair = ml_kem768.keygen(seed);

	return {
		publicKey: keypair.publicKey,
		privateKey: keypair.secretKey,
	};
}

/**
 * Encapsulate: Generate shared secret using recipient's public key
 * @param publicKey - ML-KEM-768 public key (1184 bytes)
 * @returns { sharedSecret: Uint8Array (32 bytes), ciphertext: Uint8Array (1088 bytes) }
 */
export function encapsulate(publicKey: Uint8Array) {
	const result = ml_kem768.encapsulate(publicKey);

	return {
		sharedSecret: result.sharedSecret, // 32 bytes
		ciphertext: result.cipherText, // 1088 bytes (KEM ciphertext)
	};
}

/**
 * Decapsulate: Recover shared secret using private key and ciphertext
 * @param ciphertext - ML-KEM-768 ciphertext (1088 bytes)
 * @param privateKey - ML-KEM-768 private key (2400 bytes)
 * @returns sharedSecret - 32 bytes
 */
export function decapsulate(ciphertext: Uint8Array, privateKey: Uint8Array): Uint8Array {
	const sharedSecret = ml_kem768.decapsulate(ciphertext, privateKey);
	return sharedSecret; // 32 bytes
}
