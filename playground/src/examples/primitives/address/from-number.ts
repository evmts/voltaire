import { Address } from "voltaire";
// Example: Create address from number
// Numbers are zero-padded to 20 bytes
const addr1 = Address.fromNumber(1);

const addr2 = Address.fromNumber(255);

const addr3 = Address.fromNumber(0x1234);

// BigInt also works
const addr4 = Address.fromNumber(1n);

const bigValue = 0xdeadbeefn;
const addr5 = Address.fromNumber(bigValue);

// Zero address
const zero = Address.fromNumber(0);
