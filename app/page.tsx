"use client";

import { useState, useEffect } from "react";
import { initMlKem1024 } from "./crypto/mlkem1024";
import { encryptFile, decryptFile } from "./crypto/stream-crypto";
import { bytesToHex, base64ToBytes } from "./crypto/utils";
import { Lock, Unlock, Key, RefreshCw, Download, AlertCircle, CheckCircle } from "lucide-react";

export default function Home() {
	const [publicKey, setPublicKey] = useState<Uint8Array | null>(null);
	const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [operation, setOperation] = useState<"encrypt" | "decrypt">("encrypt");
	const [isProcessing, setIsProcessing] = useState(false);
	const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Hardcoded keys from sample_keypair.txt
	const MOCK_PUBLIC_KEY =
		"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";
	const MOCK_PRIVATE_KEY =
		"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";

	useEffect(() => {
		// Initialize WASM on mount
		initMlKem1024().catch((err) => {
			console.error("Failed to initialize ML-KEM WASM:", err);
			setError("Failed to initialize encryption subsystem.");
		});
	}, []);

	function handleFetchKeys() {
		// Mock fetching 1024-bit keys depending on server
		// Note: The sample keys provided seem to be 1632/3232 bytes, but WASM expects 1568/3168.
		// We trim them to the expected size.
		const rawPriv = base64ToBytes(MOCK_PRIVATE_KEY);
		console.log(`Debug: Raw Private Key Length (Before Split): ${rawPriv.length}`);

		const pub = base64ToBytes(MOCK_PUBLIC_KEY).slice(0, 1568);
		const priv = rawPriv.slice(0, 3168);

		console.log("🔑 [Step 1] Keys Fetched & Trimmed:");
		console.log("  -> Public Key Length:", pub.length);
		console.log("  -> Private Key Length:", priv.length);
		console.log("  -> Public Key:", bytesToHex(pub));
		console.log("  -> Private Key:", bytesToHex(priv));

		setPublicKey(pub);
		setPrivateKey(priv);
		setError(null);
	}

	function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0] || null;
		setSelectedFile(file);
		setResult(null);
		setError(null);
	}

	async function handleEncrypt() {
		if (!selectedFile || !publicKey) return;

		setIsProcessing(true);
		setError(null);

		try {
			console.log(`Debug: Public Key Length: ${publicKey.length}`);
			const encryptedBlob = await encryptFile(selectedFile, publicKey);
			setResult({
				blob: encryptedBlob,
				filename: `${selectedFile.name}.v`,
			});
		} catch (err) {
			setError(`Encryption failed: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			setIsProcessing(false);
		}
	}

	async function handleDecrypt() {
		if (!selectedFile || !privateKey) return;

		setIsProcessing(true);
		setError(null);

		try {
			const decryptedBlob = await decryptFile(selectedFile, privateKey);
			const filename = selectedFile.name.replace(/\.v$/, "");
			setResult({
				blob: decryptedBlob,
				filename,
			});
		} catch (err) {
			setError(`Decryption failed: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			setIsProcessing(false);
		}
	}

	function handleDownload() {
		if (!result) return;

		const url = URL.createObjectURL(result.blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = result.filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
			<div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
				{/* Header */}
				<div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
					<div className="flex items-center gap-3">
						<Lock size={32} />
						<div>
							<h1 className="text-2xl font-bold">ClientSideEncryptor</h1>
							<p className="text-sm text-blue-100">Post-Quantum File Encryption</p>
						</div>
					</div>
				</div>

				<div className="p-6 space-y-6">
					{/* Warning Banner */}
					<div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg">
						<div className="flex gap-2 text-amber-800 dark:text-amber-400 text-sm">
							<AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
							<p>
								<strong>Demo Mode:</strong> Keys are displayed for educational purposes only. In production, private keys must never be displayed and should be stored securely.
							</p>
						</div>
					</div>

					{/* Key Generation */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<label className="text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">ML-KEM-1024 Keypair</label>
							<button onClick={handleFetchKeys} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors">
								<Key size={16} />
								Fetch Keys
							</button>
						</div>

						{publicKey && (
							<div className="space-y-2">
								<div className="space-y-1">
									<label className="text-xs text-neutral-500">Public Key (1568 bytes)</label>
									<div className="font-mono text-xs bg-neutral-50 dark:bg-neutral-800 p-2 rounded text-neutral-600 dark:text-neutral-400 break-all max-h-20 overflow-auto">{bytesToHex(publicKey)}</div>
								</div>
								<div className="space-y-1">
									<label className="text-xs text-neutral-500">Private Key (3168 bytes)</label>
									<div className="font-mono text-xs bg-red-50 dark:bg-red-900/10 p-2 rounded text-red-600 dark:text-red-400 break-all max-h-20 overflow-auto">{bytesToHex(privateKey!)}</div>
								</div>
							</div>
						)}
					</div>

					{/* Operation Mode */}
					<div className="space-y-2">
						<label className="text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">Operation</label>
						<div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
							<button
								onClick={() => setOperation("encrypt")}
								className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
									operation === "encrypt" ? "bg-white dark:bg-neutral-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-neutral-500 hover:text-neutral-700"
								}`}>
								<Lock size={16} /> Encrypt File
							</button>
							<button
								onClick={() => setOperation("decrypt")}
								className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
									operation === "decrypt" ? "bg-white dark:bg-neutral-700 shadow-sm text-green-600 dark:text-green-400" : "text-neutral-500 hover:text-neutral-700"
								}`}>
								<Unlock size={16} /> Decrypt File
							</button>
						</div>
					</div>

					{/* File Input */}
					<div className="space-y-2">
						<label className="text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">Select File</label>
						<div className="relative">
							<input
								type="file"
								onChange={handleFileSelect}
								className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
							/>
						</div>
						{selectedFile && (
							<p className="text-xs text-neutral-500">
								Selected: <span className="font-mono">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(2)} KB)
							</p>
						)}
					</div>

					{/* Action Button */}
					<button
						onClick={operation === "encrypt" ? handleEncrypt : handleDecrypt}
						disabled={isProcessing || !selectedFile || (operation === "encrypt" && !publicKey) || (operation === "decrypt" && !privateKey)}
						className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2 ${
							operation === "encrypt"
								? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
								: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
						} disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}>
						{isProcessing ? (
							<>
								<RefreshCw className="animate-spin" size={20} />
								Processing...
							</>
						) : operation === "encrypt" ? (
							<>
								<Lock size={20} />
								Encrypt File
							</>
						) : (
							<>
								<Unlock size={20} />
								Decrypt File
							</>
						)}
					</button>

					{/* Error Message */}
					{error && (
						<div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg">
							<div className="flex gap-2 text-red-800 dark:text-red-400 text-sm">
								<AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
								<p>{error}</p>
							</div>
						</div>
					)}

					{/* Success Result */}
					{result && (
						<div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg space-y-3">
							<div className="flex gap-2 text-green-800 dark:text-green-400">
								<CheckCircle size={20} className="flex-shrink-0" />
								<div className="flex-1">
									<p className="font-semibold">{operation === "encrypt" ? "Encryption" : "Decryption"} Successful!</p>
									<p className="text-sm">{operation === "encrypt" ? "File encrypted using ML-KEM-1024 + AES-256-GCM" : "File decrypted successfully"}</p>
								</div>
							</div>
							<button onClick={handleDownload} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors">
								<Download size={18} />
								Download {result.filename}
							</button>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
