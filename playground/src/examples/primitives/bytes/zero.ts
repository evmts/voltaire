import * as Bytes from "../../../primitives/Bytes/index.js";

// Create zero-filled byte arrays
const zeros8 = Bytes.zero(8);

// Different sizes
const zeros32 = Bytes.zero(32);

const zeros1 = Bytes.zero(1);

// Empty (0 bytes)
const empty = Bytes.zero(0);

// Use for padding or initialization
const data = Bytes.fromHex("0x1234");
const padded = Bytes.concat(Bytes.zero(2), data);
