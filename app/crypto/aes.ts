import { toArrayBuffer } from "./buffer";

export async function encryptData(key: CryptoKey, plaintext: Uint8Array) {
	const ivBytes = crypto.getRandomValues(new Uint8Array(12));
	const iv = toArrayBuffer(ivBytes);

	const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, toArrayBuffer(plaintext));

	return {
		iv: ivBytes, // store as Uint8Array
		ciphertext: new Uint8Array(encrypted),
	};
}

export async function decryptData(key: CryptoKey, ivBytes: Uint8Array, ciphertext: Uint8Array) {
	const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(ivBytes) }, key, toArrayBuffer(ciphertext));

	return new Uint8Array(decrypted);
}
