// Hex: Convert UTF-8 strings to hex encoding
import * as Hex from "../../../../src/primitives/Hex/index.js";

const message = "Hello, Ethereum!";
const hex = Hex.fromString(message);

// Emoji and Unicode support
const emoji = Hex.fromString("🚀 Voltaire");

// Empty string
const empty = Hex.fromString("");
