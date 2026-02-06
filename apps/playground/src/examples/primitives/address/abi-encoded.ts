import { Address } from "@tevm/voltaire";
// Example: ABI encoding/decoding addresses
const addr = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Encode address for ABI (32 bytes, left-padded)
const encoded = Address.toAbiEncoded(addr);

// Decode ABI-encoded address
const decoded = Address.fromAbiEncoded(encoded);
