import { Bytes } from "@tevm/voltaire";
// Convert bytes to hex string
const data = Bytes([0x12, 0x34, 0x56, 0x78]);
const hex = data.toHex();

// String to hex (via bytes)
const message = "Hello";
const messageBytes = Bytes.fromString(message);
const messageHex = messageBytes.toHex();

// Zero bytes
const zeros = Bytes.zero(4);
const zerosHex = zeros.toHex();
