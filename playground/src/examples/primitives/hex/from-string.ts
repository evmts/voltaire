import { Hex } from "voltaire";
// Convert UTF-8 strings to hex encoding
const message = "Hello, Ethereum!";
const hex = Hex.fromString(message);

// Emoji and Unicode support
const emoji = Hex.fromString("🚀 Voltaire");

// Empty string
const empty = Hex.fromString("");
