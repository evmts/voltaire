import * as Bytes from "../../../primitives/Bytes/index.js";

// Decode bytes to UTF-8 string
const bytes = Bytes.fromHex("0x48656c6c6f2c20457468657265756d21");
const text = Bytes.toString(bytes);
console.log("Decoded text:", text);

// Roundtrip conversion
const original = "Ethereum is awesome!";
const encoded = Bytes.fromString(original);
const decoded = Bytes.toString(encoded);
console.log("Original:", original);
console.log("Roundtrip:", decoded);
console.log("Match:", original === decoded);

// Emoji roundtrip
const emojiText = "🔥 Gas fees";
const emojiBytes = Bytes.fromString(emojiText);
const emojiDecoded = Bytes.toString(emojiBytes);
console.log("Emoji roundtrip:", emojiDecoded);
