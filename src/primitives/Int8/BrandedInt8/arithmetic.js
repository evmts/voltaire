import { INT8_MIN, INT8_MAX } from "./BrandedInt8.ts";

/**
 * Add two BrandedInt8 values
 * @param {import('./BrandedInt8.ts').BrandedInt8} a
 * @param {import('./BrandedInt8.ts').BrandedInt8} b
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function plus(a, b) {
	const result = a + b;
	if (result < INT8_MIN || result > INT8_MAX) {
		throw new Error(`Int8: overflow in addition ${a} + ${b} = ${result}`);
	}
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (result);
}

/**
 * Subtract two BrandedInt8 values
 * @param {import('./BrandedInt8.ts').BrandedInt8} a
 * @param {import('./BrandedInt8.ts').BrandedInt8} b
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function minus(a, b) {
	const result = a - b;
	if (result < INT8_MIN || result > INT8_MAX) {
		throw new Error(`Int8: overflow in subtraction ${a} - ${b} = ${result}`);
	}
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (result);
}

/**
 * Multiply two BrandedInt8 values
 * @param {import('./BrandedInt8.ts').BrandedInt8} a
 * @param {import('./BrandedInt8.ts').BrandedInt8} b
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function times(a, b) {
	const result = a * b;
	if (result < INT8_MIN || result > INT8_MAX) {
		throw new Error(`Int8: overflow in multiplication ${a} * ${b} = ${result}`);
	}
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (result);
}

/**
 * Divide two BrandedInt8 values (EVM SDIV semantics - truncate toward zero)
 * @param {import('./BrandedInt8.ts').BrandedInt8} a
 * @param {import('./BrandedInt8.ts').BrandedInt8} b
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function dividedBy(a, b) {
	if (b === 0) {
		throw new Error("Int8: division by zero");
	}
	// Special case: INT8_MIN / -1 overflows
	if (a === INT8_MIN && b === -1) {
		throw new Error(
			`Int8: overflow in division ${INT8_MIN} / -1 = ${-INT8_MIN}`,
		);
	}
	// JavaScript division truncates toward zero for integers
	const result = Math.trunc(a / b);
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (result);
}

/**
 * Modulo operation (EVM SMOD semantics - sign follows dividend)
 * @param {import('./BrandedInt8.ts').BrandedInt8} a
 * @param {import('./BrandedInt8.ts').BrandedInt8} b
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function modulo(a, b) {
	if (b === 0) {
		throw new Error("Int8: modulo by zero");
	}
	// EVM SMOD: sign(a mod b) = sign(a)
	const result = a % b;
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (result);
}

/**
 * Absolute value
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function abs(value) {
	// Special case: abs(INT8_MIN) overflows
	if (value === INT8_MIN) {
		throw new Error(`Int8: overflow in abs(${INT8_MIN}) = ${-INT8_MIN}`);
	}
	const result = Math.abs(value);
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (result);
}

/**
 * Negate value
 * @param {import('./BrandedInt8.ts').BrandedInt8} value
 * @returns {import('./BrandedInt8.ts').BrandedInt8}
 */
export function negate(value) {
	// Special case: -INT8_MIN overflows
	if (value === INT8_MIN) {
		throw new Error(`Int8: overflow in negation -${INT8_MIN} = ${-INT8_MIN}`);
	}
	// Special case: avoid -0
	if (value === 0) {
		return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (0);
	}
	const result = -value;
	return /** @type {import('./BrandedInt8.ts').BrandedInt8} */ (result);
}
