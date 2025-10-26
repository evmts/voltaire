import { generateDocs } from "../shared/docs-generator.js";

export async function generateSignatureUtilsDocs(): Promise<string> {
	const sections = await Promise.all([
		// isCanonicalSignature
		generateDocs({
			category: "Signature Utils - isCanonicalSignature",
			description:
				"Check if a signature is canonical (low-s value, non-malleable). " +
				"Non-canonical signatures with high s-values are vulnerable to signature malleability attacks (EIP-2). " +
				"A canonical signature has s <= n/2 where n is the secp256k1 curve order.",
			implementationFiles: {
				guil: "./comparisons/signature-utils/isCanonicalSignature/guil.ts",
				ethers: "./comparisons/signature-utils/isCanonicalSignature/ethers.ts",
				viem: "./comparisons/signature-utils/isCanonicalSignature/viem.ts",
			},
			benchmarkResultsPath:
				"./comparisons/signature-utils/isCanonicalSignature.bench.ts",
			includeBundle: true,
		}),

		// normalizeSignature
		generateDocs({
			category: "Signature Utils - normalizeSignature",
			description:
				"Normalize a signature to canonical form by converting high s-values to low s-values. " +
				"This prevents signature malleability attacks where the same message can have two valid signatures. " +
				"The normalization flips the s value (s' = n - s) and adjusts the recovery id accordingly.",
			implementationFiles: {
				guil: "./comparisons/signature-utils/normalizeSignature/guil.ts",
				ethers: "./comparisons/signature-utils/normalizeSignature/ethers.ts",
				viem: "./comparisons/signature-utils/normalizeSignature/viem.ts",
			},
			benchmarkResultsPath:
				"./comparisons/signature-utils/normalizeSignature.bench.ts",
			includeBundle: true,
		}),

		// parseSignature
		generateDocs({
			category: "Signature Utils - parseSignature",
			description:
				"Parse a compact signature (65 bytes) into its r, s, and v components. " +
				"Supports both hex string (with or without 0x prefix) and Uint8Array inputs. " +
				"The signature format is: r (32 bytes) + s (32 bytes) + v (1 byte).",
			implementationFiles: {
				guil: "./comparisons/signature-utils/parseSignature/guil.ts",
				ethers: "./comparisons/signature-utils/parseSignature/ethers.ts",
				viem: "./comparisons/signature-utils/parseSignature/viem.ts",
			},
			benchmarkResultsPath:
				"./comparisons/signature-utils/parseSignature.bench.ts",
			includeBundle: true,
		}),

		// serializeSignature
		generateDocs({
			category: "Signature Utils - serializeSignature",
			description:
				"Serialize signature components (r, s, v) into a compact 65-byte format. " +
				"Accepts r and s as either hex strings or Uint8Array (both must be 32 bytes). " +
				"Returns a hex string in the format: 0x + r + s + v.",
			implementationFiles: {
				guil: "./comparisons/signature-utils/serializeSignature/guil.ts",
				ethers: "./comparisons/signature-utils/serializeSignature/ethers.ts",
				viem: "./comparisons/signature-utils/serializeSignature/viem.ts",
			},
			benchmarkResultsPath:
				"./comparisons/signature-utils/serializeSignature.bench.ts",
			includeBundle: true,
		}),
	]);

	const header = `# Signature Utilities Comparison

This document compares signature utility implementations across guil, ethers, and viem.

## Security Considerations

### Signature Malleability (EIP-2)
ECDSA signatures over secp256k1 have an inherent malleability property. For any valid signature (r, s),
there exists another valid signature (r, n - s) for the same message, where n is the curve order.
This is because the secp256k1 curve is symmetric.

**Security Impact:**
- Two different signatures can be valid for the same message
- Attackers can modify signatures in transit without invalidating them
- Can lead to transaction replay attacks or double-spending in some scenarios

**Mitigation:**
- Only accept canonical signatures where s <= n/2
- Always normalize signatures before storage or transmission
- EIP-2 standardizes this requirement for Ethereum

### Why Canonicalization Matters

1. **Prevents replay attacks**: Without canonicalization, an attacker could see a transaction with signature (r, s),
   create a new transaction with signature (r, n - s), and both would be valid.

2. **Consistent storage**: Ensuring all signatures are canonical means you only need to store/check one form.

3. **Standard compliance**: Modern Ethereum implementations require canonical signatures (EIP-2).

### Best Practices

- Always check \`isCanonicalSignature\` before accepting a signature
- Use \`normalizeSignature\` to convert non-canonical signatures
- Store signatures in canonical form
- Validate signature components (r, s, v) are within valid ranges

## Test Data

All benchmarks use the following test cases:

- **Canonical signature**: s <= n/2 (non-malleable, secure)
- **Non-canonical signature**: s > n/2 (malleable, needs normalization)
- **Various v values**: 0, 1, 27, 28 (compact and legacy formats)
- **Different input formats**: hex strings and Uint8Array

---

`;

	return header + sections.join("\n\n---\n\n");
}

// Allow running directly to generate docs
if (import.meta.url === `file://${process.argv[1]}`) {
	const docs = await generateSignatureUtilsDocs();
	console.log(docs);
}
