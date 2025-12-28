import { Address } from "@tevm/voltaire";
// Example: Validating Ethereum addresses
const validAddr = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
const invalidAddr = "0x123"; // Too short

// Check if valid checksum
const checksummed = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const notChecksummed = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

// Type guard
if (Address.is(validAddr)) {
}
