import { hexToU256 } from "../../../native/primitives/hex.js";

const testHex = "0x1234567890abcdef";

export function main(): void {
	hexToU256(testHex);
}
