import { encryptData, decryptData } from "./aes";
import { encapsulate1024, decapsulate1024 } from "./mlkem1024";
import { deriveFileKey, zeroize } from "./kdf";
import { bytesToHex } from "./utils";

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks

/**
 * Encrypt a file using ML-KEM-1024 + AES-256-GCM streaming
 * @param file - File to encrypt
 * @param publicKey - ML-KEM-1024 public key
 * @returns Encrypted file as Blob
 */
export async function encryptFile(file: File, publicKey: Uint8Array): Promise<Blob> {
	// 1. Encapsulate: Generate shared secret
	const { sharedSecret, ciphertext: kemCiphertext } = encapsulate1024(publicKey);
	console.log("🔒 [Step 2] Encryption - Encapsulation:");
	console.log("  -> Shared Secret (32 bytes):", bytesToHex(sharedSecret));
	console.log("  -> KEM Ciphertext Length:", kemCiphertext.length);

	// 2. Derive file key from shared secret
	const fileKey = deriveFileKey(sharedSecret);
	console.log("🗝️ [Step 3] Encryption - Key Derivation:");
	console.log("  -> File Key (AES-256):", bytesToHex(fileKey)); // CAUTION: Logging actual key for debug

	// 3. Delete shared secret immediately after key derivation
	zeroize(sharedSecret);

	// 4. Import as WebCrypto key
	const cryptoKey = await crypto.subtle.importKey("raw", fileKey as unknown as ArrayBuffer, { name: "AES-GCM" }, false, ["encrypt"]);

	// 5. Build header
	const header = buildHeader(kemCiphertext);
	console.log(`📝 [Step 4] Encryption - Header Built: ${header.length} bytes (Magic + KEM Ciphertext)`);

	// 6. Encrypt file in chunks
	const encryptedChunks: Uint8Array[] = [header];

	let offset = 0;
	const fileSize = file.size;
	let chunkCount = 0;

	console.log(`🔐 [Step 5] Starting Chunk Encryption: ${file.name} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);
	console.log(`📦 Chunk size: ${CHUNK_SIZE / (1024 * 1024)} MB`);
	console.log(`📊 Expected chunks: ${Math.ceil(fileSize / CHUNK_SIZE)}`);

	while (offset < fileSize) {
		// Read chunk of specified size
		const chunkSize = Math.min(CHUNK_SIZE, fileSize - offset);
		const chunk = file.slice(offset, offset + chunkSize);
		const arrayBuffer = await chunk.arrayBuffer();
		const value = new Uint8Array(arrayBuffer as ArrayBuffer);

		chunkCount++;

		// Encrypt chunk
		const { iv, ciphertext } = await encryptData(cryptoKey, value);

		console.log(`  👉 Processing Chunk #${chunkCount}:`);
		console.log(`     - Size: ${chunkSize} bytes`);
		console.log(`     - IV: ${bytesToHex(iv)}`);
		console.log(`     - Encrypted Size: ${ciphertext.length} bytes`);

		// Build chunk: [length (4)] [iv (12)] [ciphertext]
		const chunkHeader = new Uint8Array(4 + 12);
		const view = new DataView(chunkHeader.buffer);
		view.setUint32(0, value.length, false); // Big-endian
		//check
		chunkHeader.set(iv, 4);

		encryptedChunks.push(chunkHeader);
		encryptedChunks.push(ciphertext);

		offset += chunkSize;
	}

	console.log(`✅ Encryption complete! Processed ${chunkCount} chunks`);

	// 7. Zeroize file key
	zeroize(fileKey);

	// 8. Create blob
	return new Blob(encryptedChunks as BlobPart[], { type: "application/octet-stream" });
}

/**
 * Decrypt a file using ML-KEM-1024 + AES-256-GCM
 * @param encryptedBlob - Encrypted file blob
 * @param privateKey - ML-KEM-1024 private key
 * @returns Decrypted file as Blob
 */
export async function decryptFile(encryptedBlob: Blob, privateKey: Uint8Array): Promise<Blob> {
	const buffer = await encryptedBlob.arrayBuffer();
	const data = new Uint8Array(buffer as ArrayBuffer);

	// 1. Parse header
	const { kemCiphertext, dataStart } = parseHeader(data);
	console.log(`📄 [Step 1] Decryption - Header Parsed. KEM Ciphertext Length: ${kemCiphertext.length}`);

	// 2. Decapsulate: Recover shared secret
	const sharedSecret = decapsulate1024(kemCiphertext, privateKey);

	console.log("🔓 [Step 2] Decryption - Decapsulation:");
	console.log("  -> Shared Secret (Recovered):", bytesToHex(sharedSecret));

	// 3. Derive file key
	const fileKey = deriveFileKey(sharedSecret);
	console.log("🗝️ [Step 3] Decryption - Key Derivation:");
	console.log("  -> File Key (AES-256):", bytesToHex(fileKey));

	// 4. Delete shared secret immediately after key derivation
	zeroize(sharedSecret);

	// 5. Import as WebCrypto key
	const cryptoKey = await crypto.subtle.importKey("raw", fileKey as unknown as ArrayBuffer, { name: "AES-GCM" }, false, ["decrypt"]);

	// 6. Decrypt chunks
	const decryptedChunks: Uint8Array[] = [];
	let offset = dataStart;
	let decChunkCount = 0;

	console.log(`📂 [Step 4] Starting Chunk Decryption...`);

	while (offset < data.length) {
		decChunkCount++;
		// Read chunk header
		const view = new DataView(data.buffer as ArrayBuffer, offset);
		const chunkLength = view.getUint32(0, false); // Big-endian
		const iv = data.slice(offset + 4, offset + 16);

		offset += 16;

		// Read ciphertext (chunk + 16-byte auth tag)
		const ciphertextLength = chunkLength + 16;
		const ciphertext = data.slice(offset, offset + ciphertextLength);

		offset += ciphertextLength;

		console.log(`  👈 Decrypting Chunk #${decChunkCount}:`);
		console.log(`     - Expected Plaintext Size: ${chunkLength} bytes`);
		console.log(`     - IV: ${bytesToHex(iv)}`);

		// Decrypt chunk
		const decrypted = await decryptData(cryptoKey, iv, ciphertext);
		decryptedChunks.push(decrypted);
	}

	console.log(`✅ Decryption Complete! Processed ${decChunkCount} chunks.`);

	// 7. Zeroize file key
	zeroize(fileKey);

	// 8. Create blob
	return new Blob(decryptedChunks as BlobPart[], { type: "application/octet-stream" });
}

/**
 * Build file header
 */
function buildHeader(kemCiphertext: Uint8Array): Uint8Array {
	const header = new Uint8Array(4 + kemCiphertext.length);
	const view = new DataView(header.buffer);

	// KEM ciphertext length
	view.setUint32(0, kemCiphertext.length, false);

	// KEM ciphertext
	header.set(kemCiphertext, 4);

	return header;
}

/**
 * Parse file header
 */
function parseHeader(data: Uint8Array): { kemCiphertext: Uint8Array; dataStart: number } {
	const view = new DataView(data.buffer);

	// Read KEM ciphertext length
	const kemLength = view.getUint32(0, false);
	const kemCiphertext = data.slice(4, 4 + kemLength);

	return {
		kemCiphertext,
		dataStart: 4 + kemLength,
	};
}
