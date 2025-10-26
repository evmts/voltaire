import { u256ToHex } from "../../../src/primitives/hex.js";

const testValue = 0x1234567890abcdefn;

export function main(): void {
	u256ToHex(testValue);
}
