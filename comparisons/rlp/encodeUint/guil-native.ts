import { encodeUintFromBigInt } from "../../../src/typescript/native/primitives/rlp.native.js";

// Test data: various uint values as bigint
const testZero = 0n;
const testSmall = 127n;
const testMedium = 1024n;
const testLarge = 0xfffffffffn;
const testBigInt = 123456789012345678901234567890n;

export function main(): void {
	encodeUintFromBigInt(testZero);
	encodeUintFromBigInt(testSmall);
	encodeUintFromBigInt(testMedium);
	encodeUintFromBigInt(testLarge);
	encodeUintFromBigInt(testBigInt);
}
