import { Int256 } from "@tevm/voltaire";
const sol_pos = Int256.fromBigInt(123456789012345678901234567890123456789n);
const sol_neg = Int256.fromBigInt(-123456789012345678901234567890123456789n);
const sol_one = Int256.ONE;
const sol_neg_one = Int256.NEG_ONE;
const from_hex = Int256.fromHex(
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
);
const neg_small = Int256.fromBigInt(-1n);
const neg_large = Int256.fromBigInt(-1000000000000000000000000n);
const a = Int256.fromBigInt(1000000000000000000n);
const b = Int256.fromBigInt(-500000000000000000n);
const bits = Int256.fromBigInt(0xffn);
