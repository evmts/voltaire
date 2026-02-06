import { Hex } from "@tevm/voltaire";
// XOR two hex values (bitwise exclusive OR)
const hex1 = Hex("0xff00ff00");
const hex2 = Hex("0x00ff00ff");
const result = hex1.xor(hex2);

// XOR with all zeros (identity)
const data = Hex("0xdeadbeef");
const zeros = Hex("0x00000000");
const identity = data.xor(zeros);

// XOR with all ones (bitwise NOT)
const ones = Hex("0xffffffff");
const inverted = data.xor(ones);

// XOR twice (returns original)
const encrypted = data.xor(hex1);
const decrypted = encrypted.xor(hex1);

// Masking bits
const mask = Hex("0x0000ffff"); // Keep lower 16 bits
const val = Hex("0xdeadbeef");
const intermediate = Hex("0xdead0000").xor(Hex("0xdead0000"));
const masked = val.xor(intermediate);
