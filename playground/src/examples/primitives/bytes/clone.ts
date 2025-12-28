import { Bytes } from "@tevm/voltaire";
// Create independent copy
const original = Bytes.fromHex("0x1234");
const copy = Bytes.clone(original);

// Modify original - copy unaffected
original[0] = 0xff;

// Clone for safe mutations
const base = Bytes.fromString("Hello");
const mutation1 = Bytes.clone(base);
const mutation2 = Bytes.clone(base);
