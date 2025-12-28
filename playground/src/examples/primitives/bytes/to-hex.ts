import { Bytes } from "voltaire";
// Convert bytes to hex string
const data = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
const branded = Bytes.from(data);
const hex = branded.toHex();

// String to hex (via bytes)
const message = "Hello";
const messageBytes = Bytes.fromString(message);
const messageHex = messageBytes.toHex();

// Zero bytes
const zeros = Bytes.zero(4);
const zerosHex = zeros.toHex();
