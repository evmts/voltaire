import { encodeUint } from "../../../native/primitives/rlp.js";

// Test data: various uint values
const testZero = 0;
const testSmall = 127;
const testMedium = 1024;
const testLarge = 0xfffffffffn;
const testBigInt = 123456789012345678901234567890n;

export function main(): void {
	encodeUint(testZero);
	encodeUint(testSmall);
	encodeUint(testMedium);
	encodeUint(testLarge);
	encodeUint(testBigInt);
}
