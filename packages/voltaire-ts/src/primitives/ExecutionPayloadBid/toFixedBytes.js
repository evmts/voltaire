import { toBytes as hexToBytes } from "../Hex/toBytes.js";
import { InvalidExecutionPayloadBidError } from "./errors.js";

/**
 * Normalize a hex string or byte array to exactly `size` bytes.
 *
 * @param {unknown} value
 * @param {number} size
 * @param {string} field - Field name for the error message
 * @returns {Uint8Array}
 * @throws {InvalidExecutionPayloadBidError} If the value is not `size` bytes
 */
export function toFixedBytes(value, size, field) {
	/** @type {Uint8Array | undefined} */
	let bytes;
	if (value instanceof Uint8Array) {
		bytes = value;
	} else if (typeof value === "string") {
		try {
			bytes = hexToBytes(value);
		} catch (cause) {
			throw new InvalidExecutionPayloadBidError(`${field} is not valid hex`, {
				value,
				expected: `${size}-byte hex string`,
				context: { field },
				cause: /** @type {Error} */ (cause),
			});
		}
	}
	if (bytes === undefined || bytes.length !== size) {
		throw new InvalidExecutionPayloadBidError(
			`${field} must be ${size} bytes`,
			{
				value,
				expected: `${size} bytes as Uint8Array or hex string`,
				context: { field },
			},
		);
	}
	return bytes;
}
