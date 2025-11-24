import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Example: Checksumming an Ethereum address
const address = Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
const checksummed = address.toChecksummed();

// Validate checksum
const isValid = Address.isValidChecksum(checksummed);

// Using with crypto dependency
const crypto = { keccak256: Keccak256.hash };
const addrWithCrypto = Address.Address(
	"0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	crypto,
);
