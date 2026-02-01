import { ECDSA_SIZE, ECDSA_WITH_V_SIZE, ED25519_SIZE } from "./constants.js";
import { InvalidSignatureFormatError, InvalidSignatureLengthError, } from "./errors.js";
import { fromCompact } from "./fromCompact.js";
/**
 * Create Signature from hex string
 *
 * Formats supported:
 * - 128 hex chars (64 bytes): ECDSA r+s or Ed25519 signature
 * - 130 hex chars (65 bytes): ECDSA r+s+v
 *
 * @param {string} value - Hex string (with or without 0x prefix)
 * @param {import('./SignatureType.js').SignatureAlgorithm} [algorithm='secp256k1'] - Signature algorithm
 * @returns {import('./SignatureType.js').SignatureType} Signature
 * @throws {InvalidSignatureFormatError} If value is not a string
 * @throws {InvalidSignatureLengthError} If hex length is invalid
 *
 * @example
 * ```typescript
 * // 128 hex chars (64 bytes) - defaults to secp256k1
 * const sig1 = Signature.fromHex("0x1234...");
 *
 * // 130 hex chars (65 bytes) - includes v
 * const sig2 = Signature.fromHex("0x1234...ab");
 *
 * // Ed25519 (128 hex chars)
 * const sig3 = Signature.fromHex("0x1234...", "ed25519");
 *
 * // P256 (128 hex chars)
 * const sig4 = Signature.fromHex("0x1234...", "p256");
 * ```
 */
export function fromHex(value, algorithm = "secp256k1") {
    if (typeof value !== "string") {
        throw new InvalidSignatureFormatError("Value must be a string", {
            value: typeof value,
            expected: "string",
            docsPath: "/primitives/signature/from-hex#error-handling",
        });
    }
    const hex = value.startsWith("0x") ? value.slice(2) : value;
    const hexChars = hex.length;
    // Validate hex length
    if (hexChars !== ECDSA_SIZE * 2 &&
        hexChars !== ECDSA_WITH_V_SIZE * 2 &&
        hexChars !== ED25519_SIZE * 2) {
        throw new InvalidSignatureLengthError(`Invalid hex length: expected ${ECDSA_SIZE * 2} or ${ECDSA_WITH_V_SIZE * 2} characters, got ${hexChars}`, {
            value: hexChars,
            expected: `${ECDSA_SIZE * 2} or ${ECDSA_WITH_V_SIZE * 2} hex characters`,
            context: { algorithm },
            docsPath: "/primitives/signature/from-hex#error-handling",
        });
    }
    // Convert hex to bytes
    const byteLength = hexChars / 2;
    const bytes = new Uint8Array(byteLength);
    for (let i = 0; i < hexChars; i += 2) {
        const byte = Number.parseInt(hex.slice(i, i + 2), 16);
        if (Number.isNaN(byte)) {
            throw new InvalidSignatureFormatError("Invalid hex character", {
                value: hex.slice(i, i + 2),
                expected: "valid hex digits (0-9, a-f, A-F)",
                docsPath: "/primitives/signature/from-hex#error-handling",
            });
        }
        bytes[i / 2] = byte;
    }
    // Use fromCompact to create signature
    return fromCompact(bytes, algorithm);
}
