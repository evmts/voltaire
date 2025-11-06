import { InvalidDERError } from "./errors.js";
import { fromSecp256k1 } from "./fromSecp256k1.js";
import { fromP256 } from "./fromP256.js";
import { COMPONENT_SIZE } from "./constants.js";

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
		);
	}

	// Parse DER SEQUENCE
	let pos = 0;

	// Check SEQUENCE tag
	if (der[pos++] !== 0x30) {
		throw new InvalidDERError("Expected SEQUENCE tag (0x30)");
	}

	// Get SEQUENCE length
	const seqLength = der[pos++];
	if (pos + seqLength !== der.length) {
		throw new InvalidDERError("Invalid SEQUENCE length");
	}

	// Parse r
	if (der[pos++] !== 0x02) {
		throw new InvalidDERError("Expected INTEGER tag (0x02) for r");
	}
	const rLength = der[pos++];
	const rBytes = der.slice(pos, pos + rLength);
	pos += rLength;

	// Parse s
	if (der[pos++] !== 0x02) {
		throw new InvalidDERError("Expected INTEGER tag (0x02) for s");
	}
	const sLength = der[pos++];
	const sBytes = der.slice(pos, pos + sLength);
	pos += sLength;

	if (pos !== der.length) {
		throw new InvalidDERError("Unexpected data after signature");
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
