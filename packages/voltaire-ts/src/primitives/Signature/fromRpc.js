import { parseHexByte } from "../Hex/parseHexByte.js";
import { InvalidSignatureFormatError } from "./errors.js";
import { fromSecp256k1 } from "./fromSecp256k1.js";

/**
 * Parse a 32-byte hex component from an RPC signature object
 * @param {unknown} hex
 * @param {string} field
 * @returns {Uint8Array}
 */
function parseComponent(hex, field) {
	if (typeof hex !== "string") {
		throw new InvalidSignatureFormatError(
			`RPC signature ${field} must be a hex string`,
			{ value: hex, expected: "hex string" },
		);
	}
	const stripped =
		hex.startsWith("0x") || hex.startsWith("0X") ? hex.slice(2) : hex;
	if (!/^[0-9a-fA-F]{1,64}$/.test(stripped)) {
		throw new InvalidSignatureFormatError(
			`Invalid RPC signature ${field} hex: ${hex}`,
			{ value: hex, expected: "1-64 hex characters" },
		);
	}
	const padded = stripped.padStart(64, "0");
	const bytes = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		bytes[i] = parseHexByte(padded, i * 2);
	}
	return bytes;
}

/**
 * Create Signature from RPC format
 *
 * @param {{ r: string, s: string, yParity?: string | number, v?: string | number }} rpc - RPC format signature
 * @returns {import('./SignatureType.js').SignatureType} Signature
 *
 * @example
 * ```javascript
 * import * as Signature from './primitives/Signature/index.js';
 * const sig = Signature.fromRpc({
 *   r: '0x...',
 *   s: '0x...',
 *   yParity: '0x0'
 * });
 * ```
 */
export function fromRpc(rpc) {
	if (!rpc || typeof rpc !== "object") {
		throw new InvalidSignatureFormatError("RPC signature must be an object", {
			value: rpc,
			expected: "{ r, s, v?, yParity? }",
		});
	}
	const { r, s, yParity, v } = rpc;
	const rBytes = parseComponent(r, "r");
	const sBytes = parseComponent(s, "s");

	// Parse v - prefer explicit v if provided, otherwise derive from yParity
	let vValue;
	if (v !== undefined) {
		vValue = typeof v === "string" ? Number.parseInt(v, 16) : v;
		if (!Number.isInteger(vValue)) {
			throw new InvalidSignatureFormatError(`Invalid RPC signature v: ${v}`, {
				value: v,
				expected: "integer or hex string",
			});
		}
	} else if (yParity !== undefined) {
		const yParityNum =
			typeof yParity === "string" ? Number.parseInt(yParity, 16) : yParity;
		if (!Number.isInteger(yParityNum)) {
			throw new InvalidSignatureFormatError(
				`Invalid RPC signature yParity: ${yParity}`,
				{ value: yParity, expected: "integer or hex string" },
			);
		}
		vValue = 27 + yParityNum;
	}

	return fromSecp256k1(rBytes, sBytes, vValue);
}
