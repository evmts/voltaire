import { generateDocs } from "../shared/docs-generator.js";

export async function generateWalletGenerationDocs(): Promise<string> {
	let markdown = "# Wallet/Key Generation Utility Functions Benchmark\n\n";
	markdown +=
		"Comprehensive comparison of Ethereum wallet and key generation operations across guil (@tevm/primitives), ethers, and viem.\n\n";

	markdown += "## Security Notice\n\n";
	markdown +=
		"⚠️ **CRITICAL SECURITY WARNINGS**: These are cryptographic operations that directly affect wallet security.\n\n";
	markdown += "### Production Usage Requirements\n\n";
	markdown +=
		"1. **Random Number Generation**: Use cryptographically secure random number generators (CSPRNG)\n";
	markdown +=
		"2. **Private Key Storage**: NEVER store private keys in plain text or version control\n";
	markdown +=
		"3. **Key Derivation**: Follow BIP-32/BIP-39/BIP-44 standards for hierarchical deterministic wallets\n";
	markdown +=
		"4. **Test Keys**: The test private key used in these benchmarks is PUBLIC and must NEVER be used in production\n";
	markdown +=
		"5. **Side-Channel Attacks**: Be aware of timing attacks when performing cryptographic operations\n\n";

	markdown += "### Test Data\n\n";
	markdown +=
		"These benchmarks use a known test private key for deterministic testing:\n\n";
	markdown += "```\n";
	markdown +=
		"Private Key: 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\n";
	markdown += "⚠️ DO NOT USE IN PRODUCTION - This is a public test key!\n";
	markdown += "```\n\n";

	markdown += "## Overview\n\n";
	markdown +=
		"This benchmark suite tests all major wallet/key generation functions including:\n";
	markdown += "- Private key generation (using secure randomness)\n";
	markdown +=
		"- Public key derivation from private keys (secp256k1 elliptic curve)\n";
	markdown += "- Ethereum address derivation (keccak256 hash of public key)\n";
	markdown += "- Combined private key to address conversion (optimized path)\n";
	markdown +=
		"- Public key compression (converting 65-byte uncompressed to 33-byte compressed format)\n\n";

	// generatePrivateKey
	markdown += "## generatePrivateKey(): string\n\n";
	markdown +=
		"Generate a cryptographically secure random 32-byte private key. This operation uses platform-specific CSPRNG.\n\n";
	markdown += "**Implementation Notes:**\n";
	markdown +=
		"- **Guil**: Uses `@noble/curves` - `secp256k1.utils.randomPrivateKey()`\n";
	markdown +=
		"- **Ethers**: Uses `Wallet.createRandom()` with platform crypto APIs\n";
	markdown +=
		"- **Viem**: Uses `generatePrivateKey()` from `viem/accounts`\n\n";
	markdown +=
		"⚠️ **Special Benchmark Consideration**: This function uses randomness, so timing variations are expected and normal.\n\n";
	markdown += await generateDocs({
		category: "generatePrivateKey",
		description: "Generate random 32-byte private key",
		implementationFiles: {
			guil: "./comparisons/wallet-generation/generatePrivateKey/guil.ts",
			ethers: "./comparisons/wallet-generation/generatePrivateKey/ethers.ts",
			viem: "./comparisons/wallet-generation/generatePrivateKey/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/wallet-generation/generatePrivateKey.bench.ts",
		includeBundle: false,
	});

	// privateKeyToPublicKey
	markdown += "\n## privateKeyToPublicKey(privateKey: string): string\n\n";
	markdown +=
		"Derive the uncompressed 65-byte public key from a 32-byte private key using secp256k1 elliptic curve multiplication.\n\n";
	markdown += "**Cryptographic Operation:**\n";
	markdown +=
		"- Performs elliptic curve point multiplication: `PublicKey = PrivateKey × G`\n";
	markdown +=
		"- Returns uncompressed format: `0x04 + x-coordinate (32 bytes) + y-coordinate (32 bytes)`\n";
	markdown +=
		"- This is a deterministic operation (same input = same output)\n\n";
	markdown += "**Implementation Notes:**\n";
	markdown +=
		"- **Guil**: Uses `@noble/curves` - `secp256k1.getPublicKey(privateKey, false)`\n";
	markdown += "- **Ethers**: Uses `SigningKey(privateKey).publicKey`\n";
	markdown +=
		"- **Viem**: Not directly exposed, uses `@noble/curves` internally\n\n";
	markdown += await generateDocs({
		category: "privateKeyToPublicKey",
		description: "Derive uncompressed public key from private key",
		implementationFiles: {
			guil: "./comparisons/wallet-generation/privateKeyToPublicKey/guil.ts",
			ethers: "./comparisons/wallet-generation/privateKeyToPublicKey/ethers.ts",
			viem: "./comparisons/wallet-generation/privateKeyToPublicKey/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/wallet-generation/privateKeyToPublicKey.bench.ts",
		includeBundle: false,
	});

	// publicKeyToAddress
	markdown += "\n## publicKeyToAddress(publicKey: string): string\n\n";
	markdown +=
		"Derive Ethereum address from an uncompressed public key using keccak256 hash.\n\n";
	markdown += "**Derivation Algorithm:**\n";
	markdown +=
		"1. Remove the `0x04` prefix from uncompressed public key (65 bytes → 64 bytes)\n";
	markdown += "2. Compute keccak256 hash of the 64-byte public key\n";
	markdown += "3. Take the last 20 bytes of the hash\n";
	markdown += "4. Prepend `0x` to create checksummed address\n\n";
	markdown += "**Implementation Notes:**\n";
	markdown +=
		"- **Guil**: Manual implementation - `keccak256(publicKey.slice(1)).slice(-20)`\n";
	markdown += "- **Ethers**: Uses `computeAddress(publicKey)`\n";
	markdown += "- **Viem**: Uses `publicKeyToAddress(publicKey)` from utils\n\n";
	markdown += await generateDocs({
		category: "publicKeyToAddress",
		description: "Derive Ethereum address from public key",
		implementationFiles: {
			guil: "./comparisons/wallet-generation/publicKeyToAddress/guil.ts",
			ethers: "./comparisons/wallet-generation/publicKeyToAddress/ethers.ts",
			viem: "./comparisons/wallet-generation/publicKeyToAddress/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/wallet-generation/publicKeyToAddress.bench.ts",
		includeBundle: false,
	});

	// privateKeyToAddress
	markdown += "\n## privateKeyToAddress(privateKey: string): string\n\n";
	markdown +=
		"Derive Ethereum address directly from private key. This combines public key derivation and address generation.\n\n";
	markdown += "**Combined Operation:**\n";
	markdown +=
		"1. Derive uncompressed public key from private key (secp256k1 multiplication)\n";
	markdown +=
		"2. Hash the public key with keccak256 and take last 20 bytes\n\n";
	markdown += "**Performance Consideration:**\n";
	markdown +=
		"This is the most commonly used operation in wallet applications. Libraries may optimize this path differently.\n\n";
	markdown += "**Implementation Notes:**\n";
	markdown +=
		"- **Guil**: Combines `secp256k1.getPublicKey()` + manual keccak256 + slice\n";
	markdown += "- **Ethers**: Uses `new Wallet(privateKey).address`\n";
	markdown +=
		"- **Viem**: Uses `privateKeyToAccount(privateKey).address` from accounts\n\n";
	markdown += await generateDocs({
		category: "privateKeyToAddress",
		description: "Derive address directly from private key",
		implementationFiles: {
			guil: "./comparisons/wallet-generation/privateKeyToAddress/guil.ts",
			ethers: "./comparisons/wallet-generation/privateKeyToAddress/ethers.ts",
			viem: "./comparisons/wallet-generation/privateKeyToAddress/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/wallet-generation/privateKeyToAddress.bench.ts",
		includeBundle: false,
	});

	// compressPublicKey
	markdown += "\n## compressPublicKey(publicKey: string): string\n\n";
	markdown +=
		"Convert uncompressed 65-byte public key to compressed 33-byte format.\n\n";
	markdown += "**Compression Algorithm:**\n";
	markdown +=
		"- **Uncompressed**: `0x04 + x-coordinate (32 bytes) + y-coordinate (32 bytes)` = 65 bytes\n";
	markdown +=
		"- **Compressed**: `(0x02 or 0x03) + x-coordinate (32 bytes)` = 33 bytes\n";
	markdown +=
		"- The prefix `0x02` (even y) or `0x03` (odd y) allows reconstruction of the y-coordinate\n\n";
	markdown += "**Use Cases:**\n";
	markdown += "- Reducing transaction size (Bitcoin-style addresses)\n";
	markdown += "- Network bandwidth optimization\n";
	markdown += "- Storage efficiency\n\n";
	markdown +=
		"⚠️ **Note**: Ethereum addresses always use uncompressed public keys, but compression is useful for signatures and other protocols.\n\n";
	markdown += "**Implementation Notes:**\n";
	markdown +=
		"- **Guil**: Uses `@noble/curves` - `ProjectivePoint.fromHex().toHex(true)`\n";
	markdown +=
		"- **Ethers**: Uses `SigningKey.computePublicKey(publicKey, true)`\n";
	markdown += "- **Viem**: Not exposed, uses `@noble/curves` internally\n\n";
	markdown += await generateDocs({
		category: "compressPublicKey",
		description: "Convert uncompressed to compressed public key",
		implementationFiles: {
			guil: "./comparisons/wallet-generation/compressPublicKey/guil.ts",
			ethers: "./comparisons/wallet-generation/compressPublicKey/ethers.ts",
			viem: "./comparisons/wallet-generation/compressPublicKey/viem.ts",
		},
		benchmarkResultsPath:
			"./comparisons/wallet-generation/compressPublicKey.bench.ts",
		includeBundle: false,
	});

	markdown += "\n## Summary\n\n";
	markdown +=
		"These benchmarks provide comprehensive performance metrics for wallet/key generation operations that form the foundation of Ethereum wallet applications.\n\n";

	markdown += "### Key Insights\n\n";
	markdown +=
		"- **generatePrivateKey**: Measures CSPRNG performance (expect variability)\n";
	markdown +=
		"- **privateKeyToPublicKey**: Tests secp256k1 elliptic curve multiplication performance\n";
	markdown +=
		"- **publicKeyToAddress**: Compares keccak256 hashing and slicing strategies\n";
	markdown +=
		"- **privateKeyToAddress**: Combined operation - most common in wallet apps, shows optimization potential\n";
	markdown +=
		"- **compressPublicKey**: Tests elliptic curve point manipulation\n\n";

	markdown += "### Cryptographic Dependencies\n\n";
	markdown +=
		"All implementations ultimately depend on well-audited cryptographic libraries:\n\n";
	markdown +=
		"- **@noble/curves**: Pure TypeScript secp256k1 implementation (used by guil and viem)\n";
	markdown += "- **@noble/hashes**: Pure TypeScript keccak256 implementation\n";
	markdown +=
		"- **Ethers**: Uses platform-specific crypto APIs when available, with fallbacks\n\n";

	markdown += "### Security Best Practices\n\n";
	markdown +=
		"1. **Never roll your own crypto**: Use well-audited libraries like those tested here\n";
	markdown +=
		"2. **Validate inputs**: Always validate private keys are 32 bytes and public keys are valid curve points\n";
	markdown +=
		"3. **Secure key storage**: Use hardware wallets, encrypted keystores, or secure enclaves in production\n";
	markdown +=
		"4. **Key derivation**: Follow BIP-32/39/44 standards for hierarchical deterministic wallets\n";
	markdown +=
		"5. **Test vectors**: Always validate implementations against known test vectors\n\n";

	return markdown;
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateWalletGenerationDocs();
}
