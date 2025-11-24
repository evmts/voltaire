import * as Uint8 from "../../../primitives/Uint8/index.js";
import * as Uint16 from "../../../primitives/Uint16/index.js";
import * as Uint32 from "../../../primitives/Uint32/index.js";
import * as Uint64 from "../../../primitives/Uint64/index.js";
const u8Max = Uint8.MAX;
try {
	const overflow = Uint8.plus(u8Max, Uint8.fromNumber(1));
} catch (e) {}
const u8Min = Uint8.MIN;
try {
	const underflow = Uint8.minus(u8Min, Uint8.fromNumber(1));
} catch (e) {}
const u8a = Uint8.fromNumber(200);
const u8b = Uint8.fromNumber(2);
try {
	const result = Uint8.times(u8a, u8b);
} catch (e) {}
const u16Max = Uint16.MAX;
try {
	const overflow = Uint16.plus(u16Max, Uint16.fromNumber(1));
} catch (e) {}
const u32a = Uint32.fromNumber(100000);
const u32b = Uint32.fromNumber(100000);
try {
	const result = Uint32.times(u32a, u32b);
} catch (e) {}
const u32Near = Uint32.fromNumber(4294967290); // MAX - 5
try {
	const plus1 = Uint32.plus(u32Near, Uint32.fromNumber(1));
	const plus10 = Uint32.plus(u32Near, Uint32.fromNumber(10));
} catch (e) {}
const u64Near = Uint64.fromBigInt(18446744073709551610n); // MAX - 5
const value = Uint32.fromNumber(100);
const zero = Uint32.ZERO;
try {
	const result = Uint32.dividedBy(value, zero);
} catch (e) {}
function safeAdd32(
	a: ReturnType<typeof Uint32.from>,
	b: ReturnType<typeof Uint32.from>,
): boolean {
	const sum = Uint32.plus(a, b);
	// Check if wrapped (result < either operand)
	return !Uint32.lessThan(sum, a) && !Uint32.lessThan(sum, b);
}

const val1 = Uint32.fromNumber(4000000000);
const val2 = Uint32.fromNumber(400000000);
const result = Uint32.plus(val1, val2);
const bigNum = Uint32.fromNumber(300);
const mod256 = Uint32.fromNumber(256);
