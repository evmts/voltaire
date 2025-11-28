// Hex: Decode hex to UTF-8 string
import * as Hex from "../../../../src/primitives/Hex/index.js";

const hex = "0x48656c6c6f2c20457468657265756d21";
const decoded = Hex.toString(hex);
console.log("Hex:", hex);
console.log("Decoded string:", decoded);

// Round-trip encoding
const original = "Voltaire primitives";
const encoded = Hex.fromString(original);
const roundtrip = Hex.toString(encoded);
console.log("\nOriginal:", original);
console.log("Encoded:", encoded);
console.log("Round-trip:", roundtrip);
console.log("Match:", original === roundtrip);

// Emoji round-trip
const emojiOriginal = "🔥 Fast crypto";
const emojiEncoded = Hex.fromString(emojiOriginal);
const emojiDecoded = Hex.toString(emojiEncoded);
console.log("\nEmoji original:", emojiOriginal);
console.log("Emoji decoded:", emojiDecoded);
console.log("Match:", emojiOriginal === emojiDecoded);
