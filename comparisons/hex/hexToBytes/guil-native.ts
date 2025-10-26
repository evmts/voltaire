import { hexToBytes } from "../../../native/primitives/hex.js";

const testHex = "0x1234567890abcdef";

export function main(): void {
	hexToBytes(testHex);
}
