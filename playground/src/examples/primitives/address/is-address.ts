import { Address } from "voltaire";
// Example: Type guard usage
const validAddr = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
const invalidAddr = "0x123";
const number = 42;

// Type guard narrows the type
if (Address.is(validAddr)) {
}

if (!Address.is(invalidAddr)) {
}

if (!Address.is(number)) {
}

// Use in type narrowing
function processAddress(input: unknown) {
	if (Address.is(input)) {
		// TypeScript knows input is AddressType here
		return input.toHex();
	}
	throw new Error("Not an address");
}

const addr = Address.from(validAddr);
