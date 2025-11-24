import * as Address from "../../../primitives/Address/index.js";

// Example: Convert address to byte array
const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Get raw bytes
const bytes = addr.toBytes();

// Instance method
const instance = Address.Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const bytes2 = instance.toBytes();
