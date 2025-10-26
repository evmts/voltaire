import {
	Byte,
	byteToNumber,
} from "../../../native/primitives/branded-types/bytes.js";

// Test data: various byte values
const byte0 = Byte(0);
const byte127 = Byte(127);
const byte128 = Byte(128);
const byte255 = Byte(255);

export function main(): void {
	byteToNumber(byte0);
	byteToNumber(byte127);
	byteToNumber(byte128);
	byteToNumber(byte255);
}
