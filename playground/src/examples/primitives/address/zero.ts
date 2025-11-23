import * as Address from "../../../primitives/Address/index.js";

// Example: Working with zero address
// The zero address is 0x0000000000000000000000000000000000000000
const zero = Address.zero();
console.log("Zero address:", zero.toHex());

// Check if address is zero
console.log("Is zero:", zero.isZero());

// Create zero from number
const zeroFromNumber = Address.fromNumber(0);
console.log("From number:", zeroFromNumber.toHex());
console.log("Equal to zero():", zero.equals(zeroFromNumber));

// Non-zero address
const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
console.log("Non-zero:", addr.isZero());

// Zero address is commonly used in Ethereum for:
// - Token burns (sending to 0x0)
// - Uninitialized addresses
// - Special cases in contracts
