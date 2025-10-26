import { isHexString } from "ethers";

const validHash =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const invalidHash = "0x1234"; // Too short
const notHex = "not a hash";

export function main(): void {
	// Ethers has isHexString with length parameter
	// 32 bytes = 32 in the length parameter
	isHexString(validHash, 32);
	isHexString(invalidHash, 32);
	isHexString(notHex, 32);

	// Test again for bytes32 alias
	isHexString(validHash, 32);
	isHexString(invalidHash, 32);
}
