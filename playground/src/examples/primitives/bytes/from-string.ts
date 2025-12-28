import { Bytes } from "voltaire";
// Convert UTF-8 string to bytes
const hello = Bytes.fromString("Hello, Ethereum!");

// Special characters and emoji
const emoji = Bytes.fromString("🚀 To the moon!");

// Empty string
const empty = Bytes.fromString("");
