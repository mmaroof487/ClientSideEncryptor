# XenKrypt - Post-Quantum File Encryption

A browser-based, client-side file encryption application using **ML-KEM-768** (post-quantum cryptography) combined with **AES-256-GCM** for quantum-resistant file security.

## 🔐 Features

- **Post-Quantum Security**: Uses ML-KEM-768 (Module-Lattice-Based Key Encapsulation) - NIST standardized quantum-resistant cryptography
- **Hybrid Encryption**: Combines ML-KEM for key exchange with AES-256-GCM for fast symmetric encryption
- **Client-Side Only**: All encryption/decryption happens in your browser - no data sent to servers
- **Streaming**: Efficiently handles large files using 1MB chunk processing
- **Authenticated Encryption**: AES-GCM provides both confidentiality and integrity verification
- **Modern Cryptography**: Uses SHA3-256 for key derivation via HKDF

## 🚀 Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Bundler**: Webpack (preserves native BigInt operations)
- **Cryptography**:
  - `@noble/post-quantum` - ML-KEM-768 implementation
  - `@noble/hashes` - SHA3-256, HKDF
  - Web Crypto API - AES-256-GCM
- **UI**: Tailwind CSS, Lucide Icons

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/mmaroof487/ClientSideEncryptor.git
cd ClientSideEncryptor

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 How It Works

### Encryption Process

1. **Key Generation**: Generate ML-KEM-768 keypair

   - Public Key: 1184 bytes
   - Private Key: 2400 bytes

2. **Encapsulation**: Sender uses recipient's public key

   - Generates 32-byte shared secret
   - Creates 1088-byte KEM ciphertext

3. **Key Derivation**: HKDF-SHA3-256 derives AES-256 key from shared secret

4. **File Encryption**: Stream encrypt file in 1MB chunks using AES-256-GCM

   - Each chunk gets random 12-byte IV
   - Authentication tag ensures data integrity

5. **Output**: Encrypted file with `.v` extension

### Decryption Process

1. **Parse Header**: Extract KEM ciphertext from file
2. **Decapsulation**: Recover shared secret using private key
3. **Key Derivation**: Re-derive same AES-256 key
4. **File Decryption**: Decrypt all chunks and verify authentication
5. **Output**: Original file restored

## 📖 Usage

### Basic Workflow

1. **Generate Keys**

   - Click "Generate New" to create a keypair
   - Public key can be shared with anyone
   - Keep private key secret

2. **Encrypt a File**

   - Select "Encrypt File" mode
   - Choose file to encrypt
   - Paste recipient's public key
   - Click "Encrypt File"
   - Download the `.v` file

3. **Decrypt a File**
   - Select "Decrypt File" mode
   - Choose the `.v` file
   - Use your private key
   - Click "Decrypt File"
   - Download the original file

## 🔒 Security Features

### Quantum Resistance

- **ML-KEM-768**: NIST-standardized lattice-based cryptography
- Resistant to attacks from both classical and quantum computers
- ~128-bit post-quantum security level

### Cryptographic Guarantees

- **Confidentiality**: AES-256-GCM encryption
- **Integrity**: Authentication tags prevent tampering
- **Forward Secrecy**: Each encryption uses new ephemeral secret
- **Memory Safety**: Sensitive data zeroed after use

### Modern Standards

- SHA3-256 (Keccak) for key derivation
- HKDF with domain separation
- Random IVs for each chunk
- Authenticated encryption (AEAD)

## 📊 File Format

Encrypted files use a custom `.v` format:

```
┌─────────────────────────────────┐
│ Header (1100 bytes)             │
│  - Magic: "XKEM"                │
│  - Version: 1                   │
│  - KEM Ciphertext (1088 bytes)  │
├─────────────────────────────────┤
│ Encrypted Chunks                │
│  [Length][IV][Ciphertext+Tag]   │
│  Repeated for each 1MB chunk    │
└─────────────────────────────────┘
```

**Overhead**: ~1100 bytes + 32 bytes per 1MB

- 1MB file → 1.001 MB encrypted (~0.1% overhead)
- 100MB file → 100.103 MB encrypted (~0.1% overhead)

## 🏗️ Project Structure

```
password/
├── app/
│   ├── page.tsx              # Main UI component
│   └── crypto/               # Cryptographic modules
│       ├── mlkem.ts          # ML-KEM-768 key operations
│       ├── kdf.ts            # HKDF-SHA3 key derivation
│       ├── aes.ts            # AES-256-GCM encryption
│       ├── stream-crypto.ts  # File encryption orchestration
│       ├── utils.ts          # Data conversion utilities
│       └── buffer.ts         # Buffer type conversion
├── package.json
└── next.config.ts            # Webpack configuration
```

## ⚙️ Configuration

### Webpack Requirement

This project uses Webpack instead of Turbopack because:

- Preserves native BigInt operations required by cryptographic libraries
- Turbopack transpiles BigInt `**` to `Math.pow()` which is incompatible

Configuration in `package.json`:

```json
"dev": "next dev --webpack"
```

## 🔧 Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🛡️ Security Considerations

### Best Practices

- ✅ Keys displayed in demo mode for educational purposes
- ✅ In production, private keys should NEVER be displayed
- ✅ Store private keys securely (hardware tokens, encrypted storage)
- ✅ Verify recipient's public key through secure channel

### Limitations

- Client-side only - relies on browser's security model
- No built-in key management system
- User responsible for key storage and distribution

## 📝 Technical Details

### Cryptographic Algorithms

- **Key Exchange**: ML-KEM-768 (Kyber standardized)
- **Symmetric**: AES-256-GCM
- **Hash**: SHA3-256
- **KDF**: HKDF (HMAC-based Key Derivation Function)

### Key Sizes

- ML-KEM Public Key: 1184 bytes
- ML-KEM Private Key: 2400 bytes
- Shared Secret: 32 bytes
- AES Key: 32 bytes (256 bits)
- IV: 12 bytes
- Auth Tag: 16 bytes

### Performance

- Chunk Size: 1MB (configurable)
- Memory Efficient: Streams large files
- Hardware Accelerated: AES via Web Crypto API

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🔗 Resources

- [NIST ML-KEM Standard](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [@noble/post-quantum](https://github.com/paulmillr/noble-post-quantum)
- [@noble/hashes](https://github.com/paulmillr/noble-hashes)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

## ⚠️ Disclaimer

This software is provided for educational and research purposes. While it implements industry-standard cryptographic algorithms, you should:

- Conduct your own security audit before production use
- Keep private keys secure
- Understand the limitations of client-side cryptography
- Stay informed about cryptographic best practices

---

**Built with ❤️ for a quantum-secure future**
