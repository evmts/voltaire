import { fillHash32 } from "../../../wasm/primitives/branded-types/hash.js";

export function main(): void {
	// Fill with various bytes
	fillHash32(0x00);
	fillHash32(0xff);
	fillHash32(0x42);
}
