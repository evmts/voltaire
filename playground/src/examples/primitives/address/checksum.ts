import * as Address from "../../../primitives/Address/index.js";
import * as Keccak256 from "../../../crypto/Keccak256/index.js";

// Example: Checksumming an Ethereum address
const address = Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
const checksummed = Address.toChecksummed(address);
console.log("Original:", Address.toHex(address));
console.log("Checksummed:", checksummed);

// Validate checksum
const isValid = Address.isValidChecksum(checksummed);
console.log("Valid checksum:", isValid);

// Using with crypto dependency
const crypto = { keccak256: Keccak256.hash };
const addrWithCrypto = Address.Address(
	"0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	crypto,
);
console.log("Via instance method:", addrWithCrypto.toChecksummed());
