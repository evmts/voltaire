import { Address, Bytes } from "@tevm/voltaire";

// === Address Creation ===
// From hex string (with or without checksum)
const addr1 = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const addr2 = Address.fromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
console.log("Created address:", addr1.toHex());

// From bytes array
const addrFromBytes = Address.fromBytes(
  Bytes([0x5a, 0xae, 0xd5, 0x93, 0x20, 0xb9, 0xeb, 0x3c, 0xd4, 0x62,
              0xdd, 0xba, 0xef, 0xa2, 0x1d, 0xa7, 0x57, 0xf3, 0x0f, 0xbd])
);
console.log("From bytes:", addrFromBytes.toHex());

// Zero address (contract creation)
const zeroAddr = Address.zero();
console.log("Zero address:", zeroAddr.toHex());

// === Validation ===
console.log("Is valid:", Address.isValid("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"));
console.log("Is valid checksum:", Address.isValidChecksum("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"));
console.log("Is zero:", zeroAddr.isZero());

// === Checksumming (EIP-55) ===
const checksummed = addr1.toChecksummed();
console.log("Checksummed:", checksummed);
console.log("Lowercase:", addr1.toLowercase());
console.log("Uppercase:", addr1.toUppercase());

// === Comparison ===
const sameAddr = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
console.log("Equals:", addr1.equals(sameAddr));
console.log("Compare:", addr1.compare(addr2)); // -1, 0, or 1
console.log("Less than:", addr1.lessThan(addr2));
console.log("Greater than:", addr1.greaterThan(addr2));

// === Utility ===
const shortened = addr1.toShortHex(6, 4);
console.log("Short form:", shortened); // 0x742d35...f44e

const cloned = addr1.clone();
console.log("Cloned:", cloned.toHex());
