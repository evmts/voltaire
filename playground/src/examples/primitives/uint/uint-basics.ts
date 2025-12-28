import { Uint, Uint128, Uint16, Uint32, Uint64, Uint8 } from "@tevm/voltaire";
const u8a = Uint8.fromNumber(42);
const u8b = Uint8.fromHex("0xff");
const u8c = Uint8.from("200");
const u16a = Uint16.fromNumber(1024);
const u16b = Uint16.fromHex("0xabcd");
const u16c = Uint16.from("50000");
const u32a = Uint32.fromNumber(1234567890);
const u32b = Uint32.fromHex("0xdeadbeef");
const u32c = Uint32.from("4000000000");
const u64a = Uint64.fromNumber(9999999999);
const u64b = Uint64.fromBigInt(18446744073709551615n);
const u64c = Uint64.from("12345678901234567890");
const u128a = Uint128.fromBigInt(123456789012345678901234567890n);
const u128b = Uint128.fromHex("0xffffffffffffffffffffffffffffffff");
const u128c = Uint128.from("999999999999999999999999");
const u256a =
	Uint.fromBigInt(
		123456789012345678901234567890123456789012345678901234567890n,
	);
const u256b = Uint.fromHex(
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
);
const u256c = Uint("999999999999999999999999999999999999999999");
