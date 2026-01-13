import { encryptData, decryptData } from "./aes";
import { encapsulate, decapsulate } from "./mlkem";
import { deriveFileKey, zeroize } from "./kdf";
import { utf8ToBytes, bytesToHex } from "./utils";
import { toArrayBuffer } from "./buffer";

const MAGIC = "XKEM";
const VERSION = 1;
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

/**
 * Encrypt a file using ML-KEM + AES-256-GCM streaming
 * @param file - File to encrypt
 * @param publicKey - ML-KEM-768 public key
 * @returns Encrypted file as Blob
 */
export async function encryptFile(file: File, publicKey: Uint8Array): Promise<Blob> {
	// 1. Encapsulate: Generate shared secret
	const { sharedSecret, ciphertext: kemCiphertext } = encapsulate(publicKey);

	// 2. Derive file key from shared secret
	const fileKey = deriveFileKey(sharedSecret);

	// 3. Import as WebCrypto key
	const cryptoKey = await crypto.subtle.importKey("raw", fileKey, { name: "AES-GCM" }, false, ["encrypt"]);

	// 4. Build header
	const header = buildHeader(kemCiphertext);

	// 5. Encrypt file in chunks
	const encryptedChunks: Uint8Array[] = [header];

	const reader = file.stream().getReader();
	let done = false;

	while (!done) {
		const { value, done: streamDone } = await reader.read();
		done = streamDone;

		if (value) {
			// Encrypt chunk
			const { iv, ciphertext } = await encryptData(cryptoKey, value);

			// Build chunk: [length (4)] [iv (12)] [ciphertext]
			const chunkHeader = new Uint8Array(4 + 12);
			const view = new DataView(chunkHeader.buffer);
			view.setUint32(0, value.length, false); // Big-endian
			chunkHeader.set(iv, 4);

			encryptedChunks.push(chunkHeader);
			encryptedChunks.push(ciphertext);
		}
	}

	// 6. Zeroize sensitive data
	zeroize(sharedSecret);
	zeroize(fileKey);

	// 7. Create blob
	return new Blob(encryptedChunks, { type: "application/octet-stream" });
}

/**
 * Decrypt a file using ML-KEM + AES-256-GCM
 * @param encryptedBlob - Encrypted file blob
 * @param privateKey - ML-KEM-768 private key
 * @returns Decrypted file as Blob
 */
export async function decryptFile(encryptedBlob: Blob, privateKey: Uint8Array): Promise<Blob> {
	const buffer = await encryptedBlob.arrayBuffer();
	const data = new Uint8Array(buffer);

	// 1. Parse header
	const { kemCiphertext, dataStart } = parseHeader(data);

	// 2. Decapsulate: Recover shared secret
	const sharedSecret = decapsulate(kemCiphertext, privateKey);

	// 3. Derive file key
	const fileKey = deriveFileKey(sharedSecret);

	// 4. Import as WebCrypto key
	const cryptoKey = await crypto.subtle.importKey("raw", fileKey, { name: "AES-GCM" }, false, ["decrypt"]);

	// 5. Decrypt chunks
	const decryptedChunks: Uint8Array[] = [];
	let offset = dataStart;

	while (offset < data.length) {
		// Read chunk header
		const view = new DataView(data.buffer, offset);
		const chunkLength = view.getUint32(0, false); // Big-endian
		const iv = data.slice(offset + 4, offset + 16);

		offset += 16;

		// Read ciphertext (chunk + 16-byte auth tag)
		const ciphertextLength = chunkLength + 16;
		const ciphertext = data.slice(offset, offset + ciphertextLength);

		offset += ciphertextLength;

		// Decrypt chunk
		const decrypted = await decryptData(cryptoKey, iv, ciphertext);
		decryptedChunks.push(decrypted);
	}

	// 6. Zeroize sensitive data
	zeroize(sharedSecret);
	zeroize(fileKey);

	// 7. Create blob
	return new Blob(decryptedChunks, { type: "application/octet-stream" });
}

/**
 * Build file header
 */
function buildHeader(kemCiphertext: Uint8Array): Uint8Array {
	const header = new Uint8Array(4 + 4 + 4 + kemCiphertext.length);
	const view = new DataView(header.buffer);

	// Magic
	header.set(new TextEncoder().encode(MAGIC), 0);

	// Version
	view.setUint32(4, VERSION, false);

	// KEM ciphertext length
	view.setUint32(8, kemCiphertext.length, false);

	// KEM ciphertext
	header.set(kemCiphertext, 12);

	return header;
}

/**
 * Parse file header
 */
function parseHeader(data: Uint8Array): { kemCiphertext: Uint8Array; dataStart: number } {
	const view = new DataView(data.buffer);

	// Verify magic
	const magic = new TextDecoder().decode(data.slice(0, 4));
	if (magic !== MAGIC) {
		throw new Error("Invalid file format: magic mismatch");
	}

	// Verify version
	const version = view.getUint32(4, false);
	if (version !== VERSION) {
		throw new Error(`Unsupported version: ${version}`);
	}

	// Read KEM ciphertext
	const kemLength = view.getUint32(8, false);
	const kemCiphertext = data.slice(12, 12 + kemLength);

	return {
		kemCiphertext,
		dataStart: 12 + kemLength,
	};
}
