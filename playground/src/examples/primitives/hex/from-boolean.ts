import { Hex } from "voltaire";
// Convert boolean to hex (0x01 for true, 0x00 for false)
const hexTrue = Hex.fromBoolean(true);
const hexFalse = Hex.fromBoolean(false);

// Round-trip conversion
const backToTrue = Hex.toBoolean(hexTrue);
const backToFalse = Hex.toBoolean(hexFalse);

// In calldata encoding
const encodedTrue = Hex.pad(hexTrue, 32);
const encodedFalse = Hex.pad(hexFalse, 32);

// Multiple boolean flags
const flags = [true, false, true, true, false];
const hexFlags = flags.map(Hex.fromBoolean);
