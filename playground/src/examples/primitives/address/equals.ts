import { Address } from "voltaire";
// Example: Compare addresses for equality
const addr1 = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const addr2 = Address.from("0x742d35cc6634c0532925a3b844bc454e4438f44e");
const addr3 = Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");

// All instances have .equals() method
const instance = Address.Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Checksum doesn't affect equality - only the bytes matter
const checksummed = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const lowercase = Address.from("0x742d35cc6634c0532925a3b844bc454e4438f44e");
