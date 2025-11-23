import * as Bytes from "../../../primitives/Bytes/index.js";

// Convert UTF-8 string to bytes
const hello = Bytes.fromString("Hello, Ethereum!");
console.log("String as bytes:", hello);
console.log("Length:", hello.length, "bytes");

// Special characters and emoji
const emoji = Bytes.fromString("🚀 To the moon!");
console.log("Emoji bytes:", emoji);
console.log("Length:", emoji.length, "bytes");

// Empty string
const empty = Bytes.fromString("");
console.log("Empty bytes:", empty);
console.log("Is empty:", Bytes.isEmpty(empty));
