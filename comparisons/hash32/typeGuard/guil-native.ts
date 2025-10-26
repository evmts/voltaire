import {
	isHash32,
	isBytes32,
} from "../../../native/primitives/branded-types/hash.js";

const validHash =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const invalidHash = "0x1234"; // Too short
const notHex = "not a hash";

export function main(): void {
	// Test with valid and invalid values
	isHash32(validHash);
	isHash32(invalidHash);
	isHash32(notHex);

	// Test alias
	isBytes32(validHash);
	isBytes32(invalidHash);
}
