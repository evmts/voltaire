// Hex: Decode hex to UTF-8 string
import * as Hex from "../../../../src/primitives/Hex/index.js";

const hex = "0x48656c6c6f2c20457468657265756d21";
const decoded = Hex.toString(hex);

// Round-trip encoding
const original = "Voltaire primitives";
const encoded = Hex.fromString(original);
const roundtrip = Hex.toString(encoded);

// Emoji round-trip
const emojiOriginal = "🔥 Fast crypto";
const emojiEncoded = Hex.fromString(emojiOriginal);
const emojiDecoded = Hex.toString(emojiEncoded);
