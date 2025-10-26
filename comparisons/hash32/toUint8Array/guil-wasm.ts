import {
	Hash32,
	hash32ToUint8Array,
} from "../../../wasm/primitives/branded-types/hash.js";

const testHash = Hash32(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`,
);

export function main(): void {
	hash32ToUint8Array(testHash);
}
