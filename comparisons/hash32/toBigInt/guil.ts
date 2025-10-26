import {
	Hash32,
	hash32ToBigInt,
} from "../../../src/primitives/branded-types/hash.js";

const testHash = Hash32(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`,
);

export function main(): void {
	hash32ToBigInt(testHash);
}
