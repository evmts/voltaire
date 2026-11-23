/** Largest exponent magnitude accepted, bounding the expanded string length. */
const MAX_EXPONENT = 1000;

/**
 * Expand a decimal string, including scientific notation, to plain decimal
 * notation exactly (no floating-point rounding).
 *
 * `Number#toString` yields scientific notation below `1e-6` and from `1e21`
 * (`(1e-9).toString() === "1e-9"`), which decimal parsers built on
 * `split(".")` + `BigInt` cannot read. This rewrites the digits only.
 *
 * Leading integer zeros and trailing fraction zeros are removed from expanded
 * values. Strings without an exponent are returned trimmed and unchanged.
 *
 * @since 0.0.0
 * @param {string | number} value - Decimal value, e.g. `"1e-9"`, `"1.5E+3"`, `1e21`
 * @returns {string} Plain decimal string, e.g. `"0.000000001"`, `"1500"`
 * @throws {Error} If the exponent magnitude exceeds 1000 or the mantissa has no digits
 * @example
 * ```javascript
 * normalizeDecimal(1e-9); // "0.000000001"
 * normalizeDecimal("1.5e3"); // "1500"
 * normalizeDecimal("2.5"); // "2.5"
 * ```
 */
export function normalizeDecimal(value) {
	const str = String(value).trim();
	const match = /^([+-]?)(\d*)(?:\.(\d*))?[eE]([+-]?\d+)$/.exec(str);
	if (match === null) return str;

	const [, sign = "", intDigits = "", fracDigits = "", expText = "0"] = match;
	if (intDigits === "" && fracDigits === "") {
		throw new Error(`Invalid decimal value: ${str}`);
	}
	const exponent = Number(expText);
	if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > MAX_EXPONENT) {
		throw new Error(
			`Decimal exponent out of range (max ${MAX_EXPONENT}): ${str}`,
		);
	}

	const digits = intDigits + fracDigits;
	const point = intDigits.length + exponent;
	/** @type {string} */
	let intPart;
	/** @type {string} */
	let fracPart;
	if (point <= 0) {
		intPart = "0";
		fracPart = "0".repeat(-point) + digits;
	} else if (point >= digits.length) {
		intPart = digits + "0".repeat(point - digits.length);
		fracPart = "";
	} else {
		intPart = digits.slice(0, point);
		fracPart = digits.slice(point);
	}

	intPart = intPart.replace(/^0+/, "") || "0";
	fracPart = fracPart.replace(/0+$/, "");
	const plain = fracPart === "" ? intPart : `${intPart}.${fracPart}`;
	return sign === "-" && plain !== "0" ? `-${plain}` : plain;
}
