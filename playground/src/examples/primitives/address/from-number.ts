import * as Address from "../../../primitives/Address/index.js";

// Example: Create address from number
// Numbers are zero-padded to 20 bytes
const addr1 = Address.fromNumber(1);
console.log("From number 1:", addr1.toHex());

const addr2 = Address.fromNumber(255);
console.log("From number 255:", addr2.toHex());

const addr3 = Address.fromNumber(0x1234);
console.log("From hex number:", addr3.toHex());

// BigInt also works
const addr4 = Address.fromNumber(1n);
console.log("From bigint:", addr4.toHex());

const bigValue = 0xdeadbeefn;
const addr5 = Address.fromNumber(bigValue);
console.log("From large bigint:", addr5.toHex());

// Zero address
const zero = Address.fromNumber(0);
console.log("Zero address:", zero.toHex());
console.log("Is zero:", Address.isZero(zero));
