import { hexToNumber } from "viem";

// Test data: various byte values
const byte0 = "0x00";
const byte127 = "0x7f";
const byte128 = "0x80";
const byte255 = "0xff";

export function main(): void {
	hexToNumber(byte0);
	hexToNumber(byte127);
	hexToNumber(byte128);
	hexToNumber(byte255);
}
