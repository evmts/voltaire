import { COMPONENT_SIZE } from "./constants.js";
import { InvalidDERError } from "./errors.js";
import { fromP256 } from "./fromP256.js";
import { fromSecp256k1 } from "./fromSecp256k1.js";

/**
 * Create Signature from DER-encoded ECDSA signature
 *
 * @param {Uint8Array} der - DER-encoded signature
 * @param {import('./BrandedSignature.js').SignatureAlgorithm} algorithm - Algorithm (secp256k1 or p256)
 * @param {number} [v] - Optional recovery ID for secp256k1
 * @returns {import('./BrandedSignature.js').BrandedSignature} Signature
 * @throws {InvalidDERError} If DER encoding is invalid
 *
 * @example
 * ```typescript
 * const sig = Signature.fromDER(derBytes, 'secp256k1', 27);
 * ```
 */
export function fromDER(der, algorithm, v) {
	if (algorithm !== "secp256k1" && algorithm !== "p256") {
		throw new InvalidDERError(
			`DER decoding only supported for ECDSA signatures, got ${algorithm}`,
			{
				value: algorithm,
				expected: "secp256k1 or p256",
				docsPath: "/primitives/signature/from-der#error-handling",
			},
		);
	}

	// Parse DER SEQUENCE
	let pos = 0;

	// Check SEQUENCE tag
	const seqTag = der[pos++];
	if (seqTag !== 0x30) {
		throw new InvalidDERError("Expected SEQUENCE tag (0x30)", {
			value: `0x${seqTag?.toString(16)}`,
			expected: "0x30",
			docsPath: "/primitives/signature/from-der#error-handling",
		});
	}

	// Get SEQUENCE length
	const seqLength = der[pos++];
	if (seqLength === undefined || pos + seqLength !== der.length) {
		throw new InvalidDERError("Invalid SEQUENCE length", {
			value: seqLength,
			expected: `${der.length - pos} bytes`,
			docsPath: "/primitives/signature/from-der#error-handling",
		});
	}

	// Parse r
	const rTag = der[pos++];
	if (rTag !== 0x02) {
		throw new InvalidDERError("Expected INTEGER tag (0x02) for r", {
			value: `0x${rTag?.toString(16)}`,
			expected: "0x02",
			docsPath: "/primitives/signature/from-der#error-handling",
		});
	}
	const rLength = der[pos++];
	if (rLength === undefined) {
		throw new InvalidDERError("Missing r length", {
			docsPath: "/primitives/signature/from-der#error-handling",
		});
	}
	const rBytes = der.slice(pos, pos + rLength);
	pos += rLength;

	// Parse s
	const sTag = der[pos++];
	if (sTag !== 0x02) {
		throw new InvalidDERError("Expected INTEGER tag (0x02) for s", {
			value: `0x${sTag?.toString(16)}`,
			expected: "0x02",
			docsPath: "/primitives/signature/from-der#error-handling",
		});
	}
	const sLength = der[pos++];
	if (sLength === undefined) {
		throw new InvalidDERError("Missing s length", {
			docsPath: "/primitives/signature/from-der#error-handling",
		});
	}
	const sBytes = der.slice(pos, pos + sLength);
	pos += sLength;

	if (pos !== der.length) {
		throw new InvalidDERError("Unexpected data after signature", {
			value: `${der.length - pos} extra bytes`,
			expected: "no trailing data",
			docsPath: "/primitives/signature/from-der#error-handling",
		});
	}

	// Pad r and s to 32 bytes
	const r = new Uint8Array(COMPONENT_SIZE);
	const s = new Uint8Array(COMPONENT_SIZE);

	// Skip leading 0x00 if present (DER padding for positive integers)
	const rStart = rBytes[0] === 0x00 ? 1 : 0;
	const sStart = sBytes[0] === 0x00 ? 1 : 0;

	r.set(rBytes.slice(rStart), COMPONENT_SIZE - (rBytes.length - rStart));
	s.set(sBytes.slice(sStart), COMPONENT_SIZE - (sBytes.length - sStart));

	if (algorithm === "secp256k1") {
		return fromSecp256k1(r, s, v);
	}
	return fromP256(r, s);
}
