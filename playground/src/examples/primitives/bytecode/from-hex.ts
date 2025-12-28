import { Bytecode, Bytes } from "@tevm/voltaire";
const code1 = Bytecode.fromHex("0x600100");

const code2 = Bytecode.fromHex("600100");

// Simple storage contract: PUSH1 0x01, PUSH1 0x00, SSTORE, STOP
const storageContract = Bytecode.fromHex("0x6001600055");

// Minimal proxy (EIP-1167) - just the first part for demo
const proxyStart = Bytecode.fromHex("0x363d3d373d3d3d363d73");

// Simple constructor that returns runtime code
// Constructor: PUSH1 0x0a, PUSH1 0x0c, PUSH1 0x00, CODECOPY, PUSH1 0x0a, PUSH1 0x00, RETURN
const constructorCode = Bytecode.fromHex("0x600a600c60003960096000f3");
const bytes = Bytes([0x60, 0x01, 0x00]);
const fromBytes = Bytecode(bytes);
const valid = Bytecode.fromHex("0x600100");

const invalid = Bytecode.fromHex("0x60"); // PUSH1 with no data
