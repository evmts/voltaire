import * as Hex from "../../../primitives/Hex/index.js";

// XOR two hex values (bitwise exclusive OR)
const hex1 = Hex.from("0xff00ff00");
const hex2 = Hex.from("0x00ff00ff");
const result = hex1.xor(hex2);
console.log("Hex 1:", hex1.toString());
console.log("Hex 2:", hex2.toString());
console.log("XOR result:", result.toString());

// XOR with all zeros (identity)
const data = Hex.from("0xdeadbeef");
const zeros = Hex.from("0x00000000");
const identity = data.xor(zeros);
console.log("\nData:", data.toString());
console.log("XOR with zeros:", identity.toString());
console.log("Unchanged:", data.toString() === identity.toString());

// XOR with all ones (bitwise NOT)
const ones = Hex.from("0xffffffff");
const inverted = data.xor(ones);
console.log("\nXOR with all ones:", inverted.toString());

// XOR twice (returns original)
const encrypted = data.xor(hex1);
const decrypted = encrypted.xor(hex1);
console.log("\nOriginal:", data.toString());
console.log("XOR with key:", encrypted.toString());
console.log("XOR again:", decrypted.toString());
console.log("Match:", data.toString() === decrypted.toString());

// Masking bits
const mask = Hex.from("0x0000ffff"); // Keep lower 16 bits
const val = Hex.from("0xdeadbeef");
const intermediate = Hex.from("0xdead0000").xor(Hex.from("0xdead0000"));
const masked = val.xor(intermediate);
console.log("\nMask example:", mask.toString());
console.log("Result:", masked.toString());
