import * as Int8 from "../../../primitives/Int8/index.js";
import * as Int16 from "../../../primitives/Int16/index.js";
import * as Int32 from "../../../primitives/Int32/index.js";
import * as Int64 from "../../../primitives/Int64/index.js";
import * as Int128 from "../../../primitives/Int128/index.js";
import * as Int256 from "../../../primitives/Int256/index.js";
const i8_pos = Int8.fromNumber(42);
const i8_neg = Int8.fromNumber(-42);
const i8_min = Int8.fromNumber(Int8.INT8_MIN);
const i8_max = Int8.fromNumber(Int8.INT8_MAX);
const i16_pos = Int16.fromNumber(1000);
const i16_neg = Int16.fromNumber(-1000);
const i16_min = Int16.fromNumber(Int16.INT16_MIN);
const i16_max = Int16.fromNumber(Int16.INT16_MAX);
const i32_pos = Int32.fromNumber(1000000);
const i32_neg = Int32.fromNumber(-1000000);
const i64_pos = Int64.fromBigInt(9223372036854775000n);
const i64_neg = Int64.fromBigInt(-9223372036854775000n);
const i128_pos = Int128.fromBigInt(170141183460469231731687303715884105727n);
const i128_neg = Int128.fromBigInt(-170141183460469231731687303715884105728n);
const i256_pos = Int256.fromHex(
	"0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
);
const i256_neg = Int256.fromBigInt(-1n);
