import { hexToU256 } from "../../../wasm/primitives/hex.js";

const testHex = "0x1234567890abcdef";

export function main(): void {
	hexToU256(testHex);
}
