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

console.log("\n=== Uint Arithmetic Operations Example ===\n");

// 1. Basic arithmetic
console.log("1. Basic Arithmetic");
console.log("   ---------------");

const a = Uint.from(100n);
const b = Uint.from(50n);

console.log(`   a = ${a.toString()}, b = ${b.toString()}\n`);
console.log(`   a + b = ${a.plus(b).toString()}`);
console.log(`   a - b = ${a.minus(b).toString()}`);
console.log(`   a * b = ${a.times(b).toString()}`);
console.log(`   a / b = ${a.dividedBy(b).toString()}`);
console.log(`   a % b = ${a.modulo(b).toString()}\n`);

// 2. Division with remainder
console.log("2. Division with Remainder");
console.log("   ----------------------");

const dividend = Uint.from(17n);
const divisor = Uint.from(5n);

const quotient = dividend.dividedBy(divisor);
const remainder = dividend.modulo(divisor);

console.log(
	`   ${dividend.toString()} / ${divisor.toString()} = ${quotient.toString()} remainder ${remainder.toString()}`,
);
console.log(
	`   Verification: ${quotient.toString()} * ${divisor.toString()} + ${remainder.toString()} = ${quotient.times(divisor).plus(remainder).toString()}\n`,
);

// 3. Exponentiation
console.log("3. Exponentiation");
console.log("   -------------");

const base = Uint.from(2n);
const powers = [0n, 1n, 8n, 16n, 32n];

console.log(`   Powers of ${base.toString()}:`);
for (const exp of powers) {
	const result = base.toPower(Uint.from(exp));
	console.log(`   2^${exp} = ${result.toString()}`);
}
console.log();

// 4. Overflow behavior
console.log("4. Overflow Behavior (Wrapping)");
console.log("   ---------------------------");

const max = Uint.MAX;
console.log(`   MAX value: ${max.toString().slice(0, 50)}...`);
console.log(`   MAX + 1 = ${max.plus(Uint.ONE).toString()} (wraps to 0)`);
console.log(`   MAX + 2 = ${max.plus(Uint.from(2n)).toString()} (wraps to 1)`);
console.log(
	`   MAX + 100 = ${max.plus(Uint.from(100n)).toString()} (wraps to 99)\n`,
);

// 5. Underflow behavior
console.log("5. Underflow Behavior (Wrapping)");
console.log("   ----------------------------");

const zero = Uint.ZERO;
console.log(
	`   ZERO - 1 = ${zero.minus(Uint.ONE).toString().slice(0, 50)}... (wraps to MAX)`,
);
console.log(
	`   ZERO - 5 = ${zero.minus(Uint.from(5n)).toString().slice(0, 50)}... (wraps to MAX - 4)\n`,
);

// 6. Large number multiplication
console.log("6. Large Number Multiplication");
console.log("   --------------------------");

const large = Uint.from(2n ** 200n);
console.log(`   Value: 2^200`);
console.log(
	`   Value * Value (wraps): ${large.times(large).toString().slice(0, 50)}...`,
);
console.log(`   (Result is (2^400) mod 2^256)\n`);

// 7. Chaining operations
console.log("7. Chaining Operations");
console.log("   ------------------");

const x = Uint.from(10n);
const y = Uint.from(20n);
const z = Uint.from(5n);

// Calculate: (x + y) * z - 25
const result = x.plus(y).times(z).minus(Uint.from(25n));

console.log(`   x = ${x.toString()}, y = ${y.toString()}, z = ${z.toString()}`);
console.log(`   (x + y) * z - 25:`);
console.log(`   = (${x.toString()} + ${y.toString()}) * ${z.toString()} - 25`);
console.log(`   = ${x.plus(y).toString()} * ${z.toString()} - 25`);
console.log(`   = ${x.plus(y).times(z).toString()} - 25`);
console.log(`   = ${result.toString()}\n`);

// 8. Detecting overflow
console.log("8. Detecting Overflow");
console.log("   -----------------");

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

console.log(
	`   ${test1.toString()} + ${test2.toString()}: overflow = ${detectAdditionOverflow(test1, test2)}`,
);
console.log(
	`   MAX + ${test4.toString()}: overflow = ${detectAdditionOverflow(test3, test4)}\n`,
);

// 9. Fixed-point arithmetic (18 decimals, like Solidity)
console.log("9. Fixed-Point Arithmetic (WAD)");
console.log("   ---------------------------");

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

console.log(
	`   2.5 * 1.5 = ${(Number(product.toBigInt()) / Number(WAD.toBigInt())).toFixed(2)}`,
);

// 10 / 4 = 2.5
const val3 = Uint.from(10n * 10n ** 18n); // 10 WAD
const val4 = Uint.from(4n * 10n ** 18n); // 4 WAD
const division = wadDiv(val3, val4); // 2.5 WAD

console.log(
	`   10 / 4 = ${(Number(division.toBigInt()) / Number(WAD.toBigInt())).toFixed(2)}\n`,
);

console.log("=== Example Complete ===\n");
