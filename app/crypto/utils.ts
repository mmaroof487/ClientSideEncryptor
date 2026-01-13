export function utf8ToBytes(str: string): Uint8Array {
	return new TextEncoder().encode(str);
}

export function bytesToUtf8(bytes: Uint8Array): string {
	return new TextDecoder().decode(bytes);
}

export function hexToBytes(hex: string): Uint8Array {
	return new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
}

export function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}
