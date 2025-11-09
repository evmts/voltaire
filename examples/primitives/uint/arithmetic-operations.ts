/**
 * Example: Uint Arithmetic Operations
 *
 * Demonstrates:
 * - Addition, subtraction, multiplication, division
 * - Modulo and exponentiation
 * - Overflow and underflow behavior
 * - Chaining operations
 */

import * as Uint from "../../../src/primitives/Uint/index.js";

const a = Uint.from(100n);
const b = Uint.from(50n);

const dividend = Uint.from(17n);
const divisor = Uint.from(5n);

const quotient = dividend.dividedBy(divisor);
const remainder = dividend.modulo(divisor);

const base = Uint.from(2n);
const powers = [0n, 1n, 8n, 16n, 32n];
for (const exp of powers) {
	const result = base.toPower(Uint.from(exp));
}

const max = Uint.MAX;

const zero = Uint.ZERO;

const large = Uint.from(2n ** 200n);

const x = Uint.from(10n);
const y = Uint.from(20n);
const z = Uint.from(5n);

// Calculate: (x + y) * z - 25
const result = x.plus(y).times(z).minus(Uint.from(25n));

function detectAdditionOverflow(
	num1: typeof Uint.prototype,
	num2: typeof Uint.prototype,
): boolean {
	const sum = num1.plus(num2);
	// If sum < num1, overflow occurred
	return sum.lessThan(num1);
}

const test1 = Uint.from(100n);
const test2 = Uint.from(200n);
const test3 = Uint.MAX;
const test4 = Uint.from(100n);

const WAD = Uint.from(10n ** 18n); // 18 decimal places

function wadMul(
	num1: typeof Uint.prototype,
	num2: typeof Uint.prototype,
): typeof Uint.prototype {
	return num1.times(num2).dividedBy(WAD);
}

function wadDiv(
	num1: typeof Uint.prototype,
	num2: typeof Uint.prototype,
): typeof Uint.prototype {
	return num1.times(WAD).dividedBy(num2);
}

// 2.5 * 1.5 = 3.75
const val1 = Uint.from(25n * 10n ** 17n); // 2.5 WAD
const val2 = Uint.from(15n * 10n ** 17n); // 1.5 WAD
const product = wadMul(val1, val2); // 3.75 WAD

// 10 / 4 = 2.5
const val3 = Uint.from(10n * 10n ** 18n); // 10 WAD
const val4 = Uint.from(4n * 10n ** 18n); // 4 WAD
const division = wadDiv(val3, val4); // 2.5 WAD
