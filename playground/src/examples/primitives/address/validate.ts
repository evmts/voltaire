import * as Address from "../../../primitives/Address/index.js";

// Example: Validating Ethereum addresses
const validAddr = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
const invalidAddr = "0x123"; // Too short

// Check if valid address format
console.log("Valid address:", Address.isValid(validAddr));
console.log("Invalid address:", Address.isValid(invalidAddr));

// Check if valid checksum
const checksummed = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const notChecksummed = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
console.log("Valid checksum:", Address.isValidChecksum(checksummed));
console.log("Not checksummed:", Address.isValidChecksum(notChecksummed));

// Type guard
if (Address.is(validAddr)) {
	console.log("Type guard confirms valid:", Address.toHex(validAddr));
}
