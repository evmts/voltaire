import { Bytes } from "@tevm/voltaire";
// Convert hex string to bytes
const data = Bytes.fromHex("0x48656c6c6f");

// Even-length hex required
const padded = Bytes.fromHex("0x0123");

// Multi-byte values
const address = Bytes.fromHex("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
