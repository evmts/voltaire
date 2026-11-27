import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
} from "../errors/index.js";

const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;

/**
 * Create Int32 from bigint
 *
 * @param {bigint} value - BigInt to convert
 * @returns {import('./Int32Type.js').BrandedInt32} Int32 value
 * @throws {InvalidFormatError} If value is not a bigint
 * @throws {IntegerOverflowError} If value exceeds INT32_MAX
 * @throws {IntegerUnderflowError} If value is below INT32_MIN
 */
export function fromBigInt(value) {
	if (typeof value !== "bigint") {
		throw new InvalidFormatError(
			`Int32.fromBigInt requires bigint, got ${typeof value}`,
			{ value, expected: "bigint", docsPath: "/primitives/int32#from-bigint" },
		);
	}
	if (value > BigInt(INT32_MAX)) {
		throw new IntegerOverflowError(`Int32 value exceeds maximum: ${value}`, {
			value,
			max: INT32_MAX,
			type: "int32",
		});
	}
	if (value < BigInt(INT32_MIN)) {
		throw new IntegerUnderflowError(`Int32 value is below minimum: ${value}`, {
			value,
			min: INT32_MIN,
			type: "int32",
		});
	}

	return /** @type {import('./Int32Type.js').BrandedInt32} */ (Number(value));
}
