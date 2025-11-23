import * as Bytes from "../../../primitives/Bytes/index.js";

// Convert hex string to bytes
const data = Bytes.fromHex("0x48656c6c6f");
console.log("Hex as bytes:", data);
console.log("Size:", Bytes.size(data), "bytes");

// Even-length hex required
const padded = Bytes.fromHex("0x0123");
console.log("Padded hex:", padded);

// Multi-byte values
const address = Bytes.fromHex("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
console.log("Address bytes:", address);
console.log("Length:", address.length);
