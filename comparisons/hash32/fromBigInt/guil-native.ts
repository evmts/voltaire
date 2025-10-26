import { bigIntToHash32 } from "../../../native/primitives/branded-types/hash.js";

const testBigInt =
	0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn;

export function main(): void {
	bigIntToHash32(testBigInt);
}
