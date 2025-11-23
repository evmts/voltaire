import * as Bytes from "../../../primitives/Bytes/index.js";

// Convert bytes to hex string
const data = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
const branded = Bytes.from(data);
const hex = Bytes.toHex(branded);
console.log("Hex string:", hex);

// String to hex (via bytes)
const message = "Hello";
const messageBytes = Bytes.fromString(message);
const messageHex = Bytes.toHex(messageBytes);
console.log("Message as hex:", messageHex);

// Zero bytes
const zeros = Bytes.zero(4);
const zerosHex = Bytes.toHex(zeros);
console.log("Zero bytes hex:", zerosHex);
