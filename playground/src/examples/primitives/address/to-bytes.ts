import * as Address from "../../../primitives/Address/index.js";

// Example: Convert address to byte array
const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Get raw bytes
const bytes = Address.toBytes(addr);
console.log("Bytes:", bytes);
console.log("Length:", bytes.length);
console.log("First byte:", "0x" + bytes[0].toString(16).padStart(2, "0"));
console.log("Last byte:", "0x" + bytes[19].toString(16).padStart(2, "0"));

// Instance method
const instance = Address.Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const bytes2 = instance.toBytes();
console.log("Via instance:", bytes2);

// Addresses are already Uint8Arrays under the hood
console.log("Is Uint8Array:", addr instanceof Uint8Array);
