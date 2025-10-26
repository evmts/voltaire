import { encodeRlp, toBeHex } from "ethers";

// Test data: various uint values
// ethers requires hex string format
const testZero = "0x00";
const testSmall = toBeHex(127);
const testMedium = toBeHex(1024);
const testLarge = toBeHex(0xfffffffffn);
const testBigInt = toBeHex(123456789012345678901234567890n);

export function main(): void {
	encodeRlp(testZero);
	encodeRlp(testSmall);
	encodeRlp(testMedium);
	encodeRlp(testLarge);
	encodeRlp(testBigInt);
}
