import { Hex, precompiles } from "@tevm/voltaire";

// Execute SHA256 precompile
const sha256Input = Hex.toBytes("0x48656c6c6f"); // "Hello"
const sha256Result = precompiles.sha256(sha256Input, 10000n);

// Execute IDENTITY precompile (returns input unchanged)
const identityInput = Hex.toBytes("0xdeadbeef");
const identityResult = precompiles.identity(identityInput, 10000n);

// Execute RIPEMD160 precompile
const ripemdInput = Hex.toBytes("0x48656c6c6f"); // "Hello"
const ripemdResult = precompiles.ripemd160(ripemdInput, 10000n);

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
