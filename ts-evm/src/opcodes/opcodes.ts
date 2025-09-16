// Opcode constants
// Opcode constants (numeric values)
export const OPCODES = {
  // System
  STOP: 0x00,
  
  // Arithmetic
  ADD: 0x01,
  MUL: 0x02,
  SUB: 0x03,
  DIV: 0x04,
  SDIV: 0x05,
  MOD: 0x06,
  SMOD: 0x07,
  ADDMOD: 0x08,
  MULMOD: 0x09,
  EXP: 0x0a,
  SIGNEXTEND: 0x0b,
  
  // Comparison
  LT: 0x10,
  GT: 0x11,
  SLT: 0x12,
  SGT: 0x13,
  EQ: 0x14,
  ISZERO: 0x15,
  
  // Crypto
  KECCAK256: 0x20,
  
  // Bitwise
  AND: 0x16,
  OR: 0x17,
  XOR: 0x18,
  NOT: 0x19,
  BYTE: 0x1a,
  SHL: 0x1b,
  SHR: 0x1c,
  SAR: 0x1d,
  
  // Context
  ADDRESS: 0x30,
  BALANCE: 0x31,
  ORIGIN: 0x32,
  CALLER: 0x33,
  CALLVALUE: 0x34,
  CALLDATALOAD: 0x35,
  CALLDATASIZE: 0x36,
  CALLDATACOPY: 0x37,
  CODESIZE: 0x38,
  CODECOPY: 0x39,
  GASPRICE: 0x3a,
  EXTCODESIZE: 0x3b,
  EXTCODECOPY: 0x3c,
  RETURNDATASIZE: 0x3d,
  RETURNDATACOPY: 0x3e,
  EXTCODEHASH: 0x3f,
  BLOCKHASH: 0x40,
  COINBASE: 0x41,
  TIMESTAMP: 0x42,
  NUMBER: 0x43,
  DIFFICULTY: 0x44,
  GASLIMIT: 0x45,
  CHAINID: 0x46,
  SELFBALANCE: 0x47,
  BASEFEE: 0x48,
  BLOBHASH: 0x49,
  BLOBBASEFEE: 0x4a,
  
  // Stack
  POP: 0x50,
  
  // Memory
  MLOAD: 0x51,
  MSTORE: 0x52,
  MSTORE8: 0x53,
  
  // Storage
  SLOAD: 0x54,
  SSTORE: 0x55,
  
  MSIZE: 0x59,
  
  // Jump
  JUMP: 0x56,
  JUMPI: 0x57,
  JUMPDEST: 0x5b,
  
  // PC/GAS
  PC: 0x58,
  GAS: 0x5a,
  
  // PUSH0 (EIP-3855)
  PUSH0: 0x5f,
  
  // MCOPY (EIP-5656)
  MCOPY: 0x5e,
  
  // Logs
  LOG0: 0xa0,
  LOG1: 0xa1,
  LOG2: 0xa2,
  LOG3: 0xa3,
  LOG4: 0xa4,
  
  // System
  RETURN: 0xf3,
  INVALID: 0xfe,
} as const;

// Basic opcode metadata used by analysis and (optionally) cost modeling.
// Note: Gas values here are indicative and incomplete; callers should not
// rely on exact costs. The Zig devtool charges gas per-basic-block; this
// table provides stack arity and a coarse gas baseline to enable analysis
// and scheduling.
export interface OpcodeInfo {
  name: string;
  gas: number;      // static base cost only (no dynamic memory expansion)
  stackIn: number;
  stackOut: number;
}

// Map opcode byte → metadata
export const OPCODE_INFO: Record<number, OpcodeInfo | undefined> = {
  [OPCODES.STOP]:         { name: 'STOP', gas: 0, stackIn: 0, stackOut: 0 },

  [OPCODES.ADD]:          { name: 'ADD', gas: 3, stackIn: 2, stackOut: 1 },
  [OPCODES.MUL]:          { name: 'MUL', gas: 5, stackIn: 2, stackOut: 1 },
  [OPCODES.SUB]:          { name: 'SUB', gas: 3, stackIn: 2, stackOut: 1 },
  [OPCODES.DIV]:          { name: 'DIV', gas: 5, stackIn: 2, stackOut: 1 },
  [OPCODES.SDIV]:         { name: 'SDIV', gas: 5, stackIn: 2, stackOut: 1 },
  [OPCODES.MOD]:          { name: 'MOD', gas: 5, stackIn: 2, stackOut: 1 },
  [OPCODES.SMOD]:         { name: 'SMOD', gas: 5, stackIn: 2, stackOut: 1 },
  [OPCODES.ADDMOD]:       { name: 'ADDMOD', gas: 8, stackIn: 3, stackOut: 1 },
  [OPCODES.MULMOD]:       { name: 'MULMOD', gas: 8, stackIn: 3, stackOut: 1 },
  [OPCODES.EXP]:          { name: 'EXP', gas: 10, stackIn: 2, stackOut: 1 },
  [OPCODES.SIGNEXTEND]:   { name: 'SIGNEXTEND', gas: 5, stackIn: 2, stackOut: 1 },

  [OPCODES.LT]:           { name: 'LT', gas: 3, stackIn: 2, stackOut: 1 },
  [OPCODES.GT]:           { name: 'GT', gas: 3, stackIn: 2, stackOut: 1 },
  [OPCODES.SLT]:          { name: 'SLT', gas: 3, stackIn: 2, stackOut: 1 },
  [OPCODES.SGT]:          { name: 'SGT', gas: 3, stackIn: 2, stackOut: 1 },
  [OPCODES.EQ]:           { name: 'EQ', gas: 3, stackIn: 2, stackOut: 1 },
  [OPCODES.ISZERO]:       { name: 'ISZERO', gas: 3, stackIn: 1, stackOut: 1 },

  [OPCODES.KECCAK256]:    { name: 'KECCAK256', gas: 30, stackIn: 2, stackOut: 1 },

  [OPCODES.AND]:          { name: 'AND', gas: 3, stackIn: 2, stackOut: 1 },
  [OPCODES.OR]:           { name: 'OR', gas: 3, stackIn: 2, stackOut: 1 },
  [OPCODES.XOR]:          { name: 'XOR', gas: 3, stackIn: 2, stackOut: 1 },
  [OPCODES.NOT]:          { name: 'NOT', gas: 3, stackIn: 1, stackOut: 1 },
  [OPCODES.BYTE]:         { name: 'BYTE', gas: 3, stackIn: 2, stackOut: 1 },
  [OPCODES.SHL]:          { name: 'SHL', gas: 3, stackIn: 2, stackOut: 1 },
  [OPCODES.SHR]:          { name: 'SHR', gas: 3, stackIn: 2, stackOut: 1 },
  [OPCODES.SAR]:          { name: 'SAR', gas: 3, stackIn: 2, stackOut: 1 },

  [OPCODES.ADDRESS]:      { name: 'ADDRESS', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.BALANCE]:      { name: 'BALANCE', gas: 100, stackIn: 1, stackOut: 1 },
  [OPCODES.ORIGIN]:       { name: 'ORIGIN', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.CALLER]:       { name: 'CALLER', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.CALLVALUE]:    { name: 'CALLVALUE', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.CALLDATALOAD]: { name: 'CALLDATALOAD', gas: 3, stackIn: 1, stackOut: 1 },
  [OPCODES.CALLDATASIZE]: { name: 'CALLDATASIZE', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.CALLDATACOPY]: { name: 'CALLDATACOPY', gas: 3, stackIn: 3, stackOut: 0 },
  [OPCODES.CODESIZE]:     { name: 'CODESIZE', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.CODECOPY]:     { name: 'CODECOPY', gas: 3, stackIn: 3, stackOut: 0 },
  [OPCODES.GASPRICE]:     { name: 'GASPRICE', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.EXTCODESIZE]:  { name: 'EXTCODESIZE', gas: 100, stackIn: 1, stackOut: 1 },
  [OPCODES.EXTCODECOPY]:  { name: 'EXTCODECOPY', gas: 100, stackIn: 4, stackOut: 0 },
  [OPCODES.RETURNDATASIZE]: { name: 'RETURNDATASIZE', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.RETURNDATACOPY]: { name: 'RETURNDATACOPY', gas: 3, stackIn: 3, stackOut: 0 },
  [OPCODES.EXTCODEHASH]:  { name: 'EXTCODEHASH', gas: 100, stackIn: 1, stackOut: 1 },
  [OPCODES.BLOCKHASH]:    { name: 'BLOCKHASH', gas: 20, stackIn: 1, stackOut: 1 },
  [OPCODES.COINBASE]:     { name: 'COINBASE', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.TIMESTAMP]:    { name: 'TIMESTAMP', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.NUMBER]:       { name: 'NUMBER', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.DIFFICULTY]:   { name: 'DIFFICULTY', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.GASLIMIT]:     { name: 'GASLIMIT', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.CHAINID]:      { name: 'CHAINID', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.SELFBALANCE]:  { name: 'SELFBALANCE', gas: 5, stackIn: 0, stackOut: 1 },
  [OPCODES.BASEFEE]:      { name: 'BASEFEE', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.BLOBHASH]:     { name: 'BLOBHASH', gas: 3, stackIn: 1, stackOut: 1 },
  [OPCODES.BLOBBASEFEE]:  { name: 'BLOBBASEFEE', gas: 2, stackIn: 0, stackOut: 1 },

  [OPCODES.POP]:          { name: 'POP', gas: 2, stackIn: 1, stackOut: 0 },
  [OPCODES.PUSH0]:        { name: 'PUSH0', gas: 2, stackIn: 0, stackOut: 1 },

  [OPCODES.MLOAD]:        { name: 'MLOAD', gas: 3, stackIn: 1, stackOut: 1 },
  [OPCODES.MSTORE]:       { name: 'MSTORE', gas: 3, stackIn: 2, stackOut: 0 },
  [OPCODES.MSTORE8]:      { name: 'MSTORE8', gas: 3, stackIn: 2, stackOut: 0 },
  [OPCODES.MSIZE]:        { name: 'MSIZE', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.MCOPY]:        { name: 'MCOPY', gas: 3, stackIn: 3, stackOut: 0 },

  [OPCODES.SLOAD]:        { name: 'SLOAD', gas: 100, stackIn: 1, stackOut: 1 },
  [OPCODES.SSTORE]:       { name: 'SSTORE', gas: 100, stackIn: 2, stackOut: 0 },

  [OPCODES.JUMP]:         { name: 'JUMP', gas: 8, stackIn: 1, stackOut: 0 },
  [OPCODES.JUMPI]:        { name: 'JUMPI', gas: 10, stackIn: 2, stackOut: 0 },
  [OPCODES.JUMPDEST]:     { name: 'JUMPDEST', gas: 1, stackIn: 0, stackOut: 0 },

  [OPCODES.PC]:           { name: 'PC', gas: 2, stackIn: 0, stackOut: 1 },
  [OPCODES.GAS]:          { name: 'GAS', gas: 2, stackIn: 0, stackOut: 1 },

  [OPCODES.LOG0]:         { name: 'LOG0', gas: 375, stackIn: 2, stackOut: 0 },
  [OPCODES.LOG1]:         { name: 'LOG1', gas: 750, stackIn: 3, stackOut: 0 },
  [OPCODES.LOG2]:         { name: 'LOG2', gas: 1125, stackIn: 4, stackOut: 0 },
  [OPCODES.LOG3]:         { name: 'LOG3', gas: 1500, stackIn: 5, stackOut: 0 },
  [OPCODES.LOG4]:         { name: 'LOG4', gas: 1875, stackIn: 6, stackOut: 0 },

  [OPCODES.RETURN]:       { name: 'RETURN', gas: 0, stackIn: 2, stackOut: 0 },
  [OPCODES.INVALID]:      { name: 'INVALID', gas: 0, stackIn: 0, stackOut: 0 },
};

// PUSH opcodes (0x60 - 0x7f)
export function isPush(opcode: number): boolean {
  return opcode >= 0x60 && opcode <= 0x7f;
}

export function getPushSize(opcode: number): number {
  return opcode - 0x5f; // PUSH1 = 0x60 => 1 byte
}

// DUP opcodes (0x80 - 0x8f)
export function isDup(opcode: number): boolean {
  return opcode >= 0x80 && opcode <= 0x8f;
}

export function getDupN(opcode: number): number {
  return opcode - 0x7f; // DUP1 = 0x80 => dup 1st
}

// SWAP opcodes (0x90 - 0x9f)
export function isSwap(opcode: number): boolean {
  return opcode >= 0x90 && opcode <= 0x9f;
}

export function getSwapN(opcode: number): number {
  return opcode - 0x8f; // SWAP1 = 0x90 => swap with 1st
}
