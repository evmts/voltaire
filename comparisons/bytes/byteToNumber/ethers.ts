import { getNumber } from "ethers";

// Test data: various byte values
const byte0 = "0x00";
const byte127 = "0x7f";
const byte128 = "0x80";
const byte255 = "0xff";

export function main(): void {
	getNumber(byte0);
	getNumber(byte127);
	getNumber(byte128);
	getNumber(byte255);
}
