import * as Address from "../../../primitives/Address/index.js";

// Example: Create address from number
// Numbers are zero-padded to 20 bytes
const addr1 = Address.fromNumber(1);
console.log("From number 1:", Address.toHex(addr1));

const addr2 = Address.fromNumber(255);
console.log("From number 255:", Address.toHex(addr2));

const addr3 = Address.fromNumber(0x1234);
console.log("From hex number:", Address.toHex(addr3));

// BigInt also works
const addr4 = Address.fromNumber(1n);
console.log("From bigint:", Address.toHex(addr4));

const bigValue = 0xdeadbeefn;
const addr5 = Address.fromNumber(bigValue);
console.log("From large bigint:", Address.toHex(addr5));

// Zero address
const zero = Address.fromNumber(0);
console.log("Zero address:", Address.toHex(zero));
console.log("Is zero:", Address.isZero(zero));
