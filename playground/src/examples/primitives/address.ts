import { Address, Bytes } from "@tevm/voltaire";

// === Address Creation ===
// From hex string (with or without checksum)
const addr1 = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const addr2 = Address.fromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
console.log("Created address:", Address.toHex(addr1));

// From bytes array
const addrFromBytes = Address.fromBytes(
  Bytes([0x5a, 0xae, 0xd5, 0x93, 0x20, 0xb9, 0xeb, 0x3c, 0xd4, 0x62,
              0xdd, 0xba, 0xef, 0xa2, 0x1d, 0xa7, 0x57, 0xf3, 0x0f, 0xbd])
);
console.log("From bytes:", Address.toHex(addrFromBytes));

// Zero address (contract creation)
const zeroAddr = Address.zero();
console.log("Zero address:", Address.toHex(zeroAddr));

// === Validation ===
console.log("Is valid:", Address.isValid("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"));
console.log("Is valid checksum:", Address.isValidChecksum("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"));
console.log("Is zero:", Address.isZero(zeroAddr));

// === Checksumming (EIP-55) ===
const checksummed = Address.toChecksummed(addr1);
console.log("Checksummed:", checksummed);
console.log("Lowercase:", Address.toLowercase(addr1));
console.log("Uppercase:", Address.toUppercase(addr1));

// === Comparison ===
const sameAddr = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
console.log("Equals:", Address.equals(addr1, sameAddr));
console.log("Compare:", Address.compare(addr1, addr2)); // -1, 0, or 1
console.log("Less than:", Address.lessThan(addr1, addr2));
console.log("Greater than:", Address.greaterThan(addr1, addr2));

// === Utility ===
const shortened = Address.toShortHex(addr1, 6, 4);
console.log("Short form:", shortened); // 0x742d35...f44e

const cloned = Address.clone(addr1);
console.log("Cloned:", Address.toHex(cloned));
