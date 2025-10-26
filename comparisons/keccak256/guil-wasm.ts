import { keccak256 } from "../../wasm/primitives/keccak.js";

const testData = new Uint8Array([1, 2, 3, 4, 5]);

export function main(): void {
	const hex = keccak256(testData);
}
