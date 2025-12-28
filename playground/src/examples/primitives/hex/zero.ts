import { Hex } from "voltaire";
// Create zero-filled hex values
const zero4 = Hex.zero(4);

const zero32 = Hex.zero(32);

// Zero address
const zeroAddress = Hex.zero(20);

// Zero hash
const zeroHash = Hex.zero(32);

// Compare with empty
const empty = Hex.from("0x");
const zero0 = Hex.zero(0);
