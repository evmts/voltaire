import { INT16_MIN, INT16_MAX } from "./BrandedInt16.ts";

/**
 * Add two BrandedInt16 values
 * @param {import('./BrandedInt16.ts').BrandedInt16} a
 * @param {import('./BrandedInt16.ts').BrandedInt16} b
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function plus(a, b) {
	const result = a + b;
	if (result < INT16_MIN || result > INT16_MAX) {
		throw new Error(`Int16: overflow in addition ${a} + ${b} = ${result}`);
	}
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (result);
}

/**
 * Subtract two BrandedInt16 values
 * @param {import('./BrandedInt16.ts').BrandedInt16} a
 * @param {import('./BrandedInt16.ts').BrandedInt16} b
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function minus(a, b) {
	const result = a - b;
	if (result < INT16_MIN || result > INT16_MAX) {
		throw new Error(`Int16: overflow in subtraction ${a} - ${b} = ${result}`);
	}
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (result);
}

/**
 * Multiply two BrandedInt16 values
 * @param {import('./BrandedInt16.ts').BrandedInt16} a
 * @param {import('./BrandedInt16.ts').BrandedInt16} b
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function times(a, b) {
	const result = a * b;
	if (result < INT16_MIN || result > INT16_MAX) {
		throw new Error(
			`Int16: overflow in multiplication ${a} * ${b} = ${result}`,
		);
	}
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (result);
}

/**
 * Divide two BrandedInt16 values (EVM SDIV semantics - truncate toward zero)
 * @param {import('./BrandedInt16.ts').BrandedInt16} a
 * @param {import('./BrandedInt16.ts').BrandedInt16} b
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function dividedBy(a, b) {
	if (b === 0) {
		throw new Error("Int16: division by zero");
	}
	// Special case: INT16_MIN / -1 overflows
	if (a === INT16_MIN && b === -1) {
		throw new Error(
			`Int16: overflow in division ${INT16_MIN} / -1 = ${-INT16_MIN}`,
		);
	}
	// JavaScript division truncates toward zero for integers
	const result = Math.trunc(a / b);
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (result);
}

/**
 * Modulo operation (EVM SMOD semantics - sign follows dividend)
 * @param {import('./BrandedInt16.ts').BrandedInt16} a
 * @param {import('./BrandedInt16.ts').BrandedInt16} b
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function modulo(a, b) {
	if (b === 0) {
		throw new Error("Int16: modulo by zero");
	}
	// EVM SMOD: sign(a mod b) = sign(a)
	const result = a % b;
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (result);
}

/**
 * Absolute value
 * @param {import('./BrandedInt16.ts').BrandedInt16} value
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function abs(value) {
	// Special case: abs(INT16_MIN) overflows
	if (value === INT16_MIN) {
		throw new Error(`Int16: overflow in abs(${INT16_MIN}) = ${-INT16_MIN}`);
	}
	const result = Math.abs(value);
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (result);
}

/**
 * Negate value
 * @param {import('./BrandedInt16.ts').BrandedInt16} value
 * @returns {import('./BrandedInt16.ts').BrandedInt16}
 */
export function negate(value) {
	// Special case: -INT16_MIN overflows
	if (value === INT16_MIN) {
		throw new Error(`Int16: overflow in negation -${INT16_MIN} = ${-INT16_MIN}`);
	}
	const result = -value;
	return /** @type {import('./BrandedInt16.ts').BrandedInt16} */ (result);
}
