import { isHex } from "viem";

const validHash =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const invalidHash = "0x1234"; // Too short
const notHex = "not a hash";

export function main(): void {
	// Viem's isHex with size parameter (32 bytes)
	isHex(validHash, { size: 32 });
	isHex(invalidHash, { size: 32 });
	isHex(notHex, { size: 32 });

	// Test again for bytes32 alias
	isHex(validHash, { size: 32 });
	isHex(invalidHash, { size: 32 });
}
