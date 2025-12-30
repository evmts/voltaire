import { Address, Bytes, Keccak256 } from "@tevm/voltaire";

// === Address Creation ===
// From hex string (with or without checksum)
const addr1 = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e", { keccak256: Keccak256.hash });
const addr2 = Address.fromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");

// From bytes array
const addrFromBytes = Address.fromBytes(
	Bytes([
		0x5a, 0xae, 0xd5, 0x93, 0x20, 0xb9, 0xeb, 0x3c, 0xd4, 0x62, 0xdd, 0xba,
		0xef, 0xa2, 0x1d, 0xa7, 0x57, 0xf3, 0x0f, 0xbd,
	]),
);

// Zero address (contract creation)
const zeroAddr = Address.zero();

// === Checksumming (EIP-55) ===
// Pass keccak256 to enable checksum methods
const checksummed = addr1.toChecksummed();
console.log("Checksummed address:", checksummed);

// === Comparison ===
const sameAddr = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
console.log("Addresses equal:", addr1.equals(sameAddr));

// === Utility ===
const shortened = addr1.toShortHex(6, 4);
console.log("Shortened:", shortened);

const cloned = addr1.clone();
console.log("Address hex:", cloned.toHex());
