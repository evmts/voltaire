import { Int16, Int32, Int8 } from "@tevm/voltaire";
const i8_pos = Int8.fromNumber(5);
const i8_neg = Int8.fromNumber(-5);
const i8_neg_one = Int8.fromNumber(-1);
const i8_min = Int8.fromNumber(Int8.INT8_MIN);
const i16_pos = Int16.fromNumber(100);
const i16_neg = Int16.fromNumber(-100);
const i16_neg_one = Int16.fromNumber(-1);
const i32_pos = Int32.fromNumber(1000);
const i32_neg = Int32.fromNumber(-1000);
const i32_neg_one = Int32.fromNumber(-1);
const test_values = [-128, -1, 0, 1, 127];
for (const val of test_values) {
	const i8 = Int8.fromNumber(val);
	const bytes = Int8.toBytes(i8);
	const sign_bit = bytes[0] & 0x80 ? 1 : 0;
}
const original = Int8.fromNumber(42);
const negated = Int8.negate(original);
const back = Int8.negate(negated);
const num = Int8.fromNumber(5);
const bitwise_not = Int8.not(num);
const arithmetic_neg = Int8.negate(num);
const max = Int8.fromNumber(Int8.INT8_MAX);
