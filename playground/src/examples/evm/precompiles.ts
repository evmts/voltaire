import { Hex, precompiles } from "@tevm/voltaire";

// Show available precompile addresses
console.log("Precompile addresses:");
console.log("  BLAKE2F:", precompiles.PrecompileAddress.BLAKE2F);
console.log("  SHA256:", precompiles.PrecompileAddress.SHA256);
console.log("  IDENTITY:", precompiles.PrecompileAddress.IDENTITY);

// Execute SHA256 precompile
const sha256Input = Hex.toBytes("0x48656c6c6f"); // "Hello"
const sha256Result = precompiles.sha256(sha256Input, 10000n);
console.log("\nSHA256 precompile:");
console.log("  Input: 'Hello'");
console.log("  Success:", sha256Result.success);
console.log("  Gas used:", sha256Result.gasUsed.toString());
console.log("  Output:", Hex.fromBytes(sha256Result.output));

// Execute IDENTITY precompile (returns input unchanged)
const identityInput = Hex.toBytes("0xdeadbeef");
const identityResult = precompiles.identity(identityInput, 10000n);
console.log("\nIDENTITY precompile:");
console.log("  Input:", Hex.fromBytes(identityInput));
console.log("  Success:", identityResult.success);
console.log("  Gas used:", identityResult.gasUsed.toString());
console.log("  Output:", Hex.fromBytes(identityResult.output));

// Execute RIPEMD160 precompile
const ripemdInput = Hex.toBytes("0x48656c6c6f"); // "Hello"
const ripemdResult = precompiles.ripemd160(ripemdInput, 10000n);
console.log("\nRIPEMD160 precompile:");
console.log("  Input: 'Hello'");
console.log("  Success:", ripemdResult.success);
console.log("  Gas used:", ripemdResult.gasUsed.toString());
console.log("  Output:", Hex.fromBytes(ripemdResult.output));

// Execute MODEXP precompile (modular exponentiation)
// Input format: base_len (32) | exp_len (32) | mod_len (32) | base | exp | mod
const modexpInput = new Uint8Array(96 + 3);
modexpInput[31] = 1; // base_len = 1
modexpInput[63] = 1; // exp_len = 1
modexpInput[95] = 1; // mod_len = 1
modexpInput[96] = 2; // base = 2
modexpInput[97] = 3; // exp = 3
modexpInput[98] = 5; // mod = 5 (2^3 mod 5 = 3)
const modexpResult = precompiles.modexp(modexpInput, 10000n);
console.log("\nMODEXP precompile (2^3 mod 5):");
console.log("  Success:", modexpResult.success);
console.log("  Gas used:", modexpResult.gasUsed.toString());
console.log("  Result:", modexpResult.output[0], "(expected: 3)");
