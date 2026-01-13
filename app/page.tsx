"use client";

import { useState } from "react";
import { generateMlKemKeypair } from "./crypto/mlkem";
import { encryptFile, decryptFile } from "./crypto/stream-crypto";
import { bytesToHex } from "./crypto/utils";
import { Lock, Unlock, Key, RefreshCw, Download, AlertCircle, CheckCircle } from "lucide-react";

export default function Home() {
	const [publicKey, setPublicKey] = useState<Uint8Array | null>(null);
	const [privateKey, setPrivateKey] = useState<Uint8Array | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [operation, setOperation] = useState<"encrypt" | "decrypt">("encrypt");
	const [isProcessing, setIsProcessing] = useState(false);
	const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
	const [error, setError] = useState<string | null>(null);

	function handleGenerateKeypair() {
		const keypair = generateMlKemKeypair();
		setPublicKey(keypair.publicKey);
		setPrivateKey(keypair.privateKey);
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
							<h1 className="text-2xl font-bold">XenKrypt ML-KEM</h1>
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
							<label className="text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">ML-KEM-768 Keypair</label>
							<button onClick={handleGenerateKeypair} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors">
								<Key size={16} />
								Generate New
							</button>
						</div>

						{publicKey && (
							<div className="space-y-2">
								<div className="space-y-1">
									<label className="text-xs text-neutral-500">Public Key (1184 bytes)</label>
									<div className="font-mono text-xs bg-neutral-50 dark:bg-neutral-800 p-2 rounded text-neutral-600 dark:text-neutral-400 break-all max-h-20 overflow-auto">{bytesToHex(publicKey)}</div>
								</div>
								<div className="space-y-1">
									<label className="text-xs text-neutral-500">Private Key (2400 bytes)</label>
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
									<p className="text-sm">{operation === "encrypt" ? "File encrypted using ML-KEM-768 + AES-256-GCM" : "File decrypted successfully"}</p>
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
