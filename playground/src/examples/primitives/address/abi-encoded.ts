import * as Address from "../../../primitives/Address/index.js";

// Example: ABI encoding/decoding addresses
const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Encode address for ABI (32 bytes, left-padded)
const encoded = Address.toAbiEncoded(addr);
console.log("ABI encoded length:", encoded.length, "bytes");
console.log(
	"ABI encoded (hex):",
	"0x" +
		Array.from(encoded)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join(""),
);

// First 12 bytes are zeros (padding)
console.log(
	"First 12 bytes zero:",
	encoded.slice(0, 12).every((b) => b === 0),
);

// Last 20 bytes contain the address
console.log(
	"Last 20 bytes:",
	"0x" +
		Array.from(encoded.slice(12))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join(""),
);

// Decode ABI-encoded address
const decoded = Address.fromAbiEncoded(encoded);
console.log("Decoded:", decoded.toHex());
console.log("Round-trip success:", addr.equals(decoded));
