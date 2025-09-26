#!/usr/bin/env bun
/**
 * LLL (Low-Level Lisp) compiler for Ethereum assembly
 * Compiles LLL assembly syntax to EVM bytecode
 */

// EVM Opcodes mapping
const OPCODES: Record<string, number> = {
  // Stop and Arithmetic Operations
  STOP: 0x00,
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
  
  // Comparison & Bitwise Logic Operations
  LT: 0x10,
  GT: 0x11,
  SLT: 0x12,
  SGT: 0x13,
  EQ: 0x14,
  ISZERO: 0x15,
  AND: 0x16,
  OR: 0x17,
  XOR: 0x18,
  NOT: 0x19,
  BYTE: 0x1a,
  SHL: 0x1b,
  SHR: 0x1c,
  SAR: 0x1d,
  
  // SHA3
  SHA3: 0x20,
  KECCAK256: 0x20,
  
  // Environmental Information
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
  
  // Block Information
  BLOCKHASH: 0x40,
  COINBASE: 0x41,
  TIMESTAMP: 0x42,
  NUMBER: 0x43,
  DIFFICULTY: 0x44,
  PREVRANDAO: 0x44, // Same as DIFFICULTY after merge
  GASLIMIT: 0x45,
  CHAINID: 0x46,
  SELFBALANCE: 0x47,
  BASEFEE: 0x48,
  BLOBHASH: 0x49,
  BLOBBASEFEE: 0x4a,
  
  // Stack, Memory, Storage and Flow Operations
  POP: 0x50,
  MLOAD: 0x51,
  MSTORE: 0x52,
  MSTORE8: 0x53,
  SLOAD: 0x54,
  SSTORE: 0x55,
  JUMP: 0x56,
  JUMPI: 0x57,
  PC: 0x58,
  MSIZE: 0x59,
  GAS: 0x5a,
  JUMPDEST: 0x5b,
  TLOAD: 0x5c,
  TSTORE: 0x5d,
  MCOPY: 0x5e,
  
  // Push operations (PUSH0 to PUSH32)
  PUSH0: 0x5f,
  PUSH1: 0x60,
  PUSH2: 0x61,
  PUSH3: 0x62,
  PUSH4: 0x63,
  PUSH5: 0x64,
  PUSH6: 0x65,
  PUSH7: 0x66,
  PUSH8: 0x67,
  PUSH9: 0x68,
  PUSH10: 0x69,
  PUSH11: 0x6a,
  PUSH12: 0x6b,
  PUSH13: 0x6c,
  PUSH14: 0x6d,
  PUSH15: 0x6e,
  PUSH16: 0x6f,
  PUSH17: 0x70,
  PUSH18: 0x71,
  PUSH19: 0x72,
  PUSH20: 0x73,
  PUSH21: 0x74,
  PUSH22: 0x75,
  PUSH23: 0x76,
  PUSH24: 0x77,
  PUSH25: 0x78,
  PUSH26: 0x79,
  PUSH27: 0x7a,
  PUSH28: 0x7b,
  PUSH29: 0x7c,
  PUSH30: 0x7d,
  PUSH31: 0x7e,
  PUSH32: 0x7f,
  
  // Duplication Operations (DUP1 to DUP16)
  DUP1: 0x80,
  DUP2: 0x81,
  DUP3: 0x82,
  DUP4: 0x83,
  DUP5: 0x84,
  DUP6: 0x85,
  DUP7: 0x86,
  DUP8: 0x87,
  DUP9: 0x88,
  DUP10: 0x89,
  DUP11: 0x8a,
  DUP12: 0x8b,
  DUP13: 0x8c,
  DUP14: 0x8d,
  DUP15: 0x8e,
  DUP16: 0x8f,
  
  // Exchange Operations (SWAP1 to SWAP16)
  SWAP1: 0x90,
  SWAP2: 0x91,
  SWAP3: 0x92,
  SWAP4: 0x93,
  SWAP5: 0x94,
  SWAP6: 0x95,
  SWAP7: 0x96,
  SWAP8: 0x97,
  SWAP9: 0x98,
  SWAP10: 0x99,
  SWAP11: 0x9a,
  SWAP12: 0x9b,
  SWAP13: 0x9c,
  SWAP14: 0x9d,
  SWAP15: 0x9e,
  SWAP16: 0x9f,
  
  // Logging Operations
  LOG0: 0xa0,
  LOG1: 0xa1,
  LOG2: 0xa2,
  LOG3: 0xa3,
  LOG4: 0xa4,
  
  // System operations
  CREATE: 0xf0,
  CALL: 0xf1,
  CALLCODE: 0xf2,
  RETURN: 0xf3,
  DELEGATECALL: 0xf4,
  CREATE2: 0xf5,
  STATICCALL: 0xfa,
  REVERT: 0xfd,
  INVALID: 0xfe,
  SELFDESTRUCT: 0xff,
};

/**
 * Tokenize LLL expression
 */
function tokenize(lll: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inString = false;
  
  for (let i = 0; i < lll.length; i++) {
    const char = lll[i];
    
    if (!inString) {
      if (char === '(' || char === ')' || char === '{' || char === '}') {
        if (current) {
          tokens.push(current);
          current = '';
        }
        tokens.push(char);
      } else if (char === ' ' || char === '\n' || char === '\t') {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else if (char === '"') {
        inString = true;
        current += char;
      } else {
        current += char;
      }
    } else {
      current += char;
      if (char === '"' && lll[i - 1] !== '\\') {
        inString = false;
        tokens.push(current);
        current = '';
      }
    }
  }
  
  if (current) {
    tokens.push(current);
  }
  
  return tokens;
}

/**
 * Parse tokens into AST
 */
type ASTNode = string | ASTNode[];

function parseAST(tokens: string[]): ASTNode {
  const stack: ASTNode[][] = [[]];
  
  for (const token of tokens) {
    if (token === '(' || token === '{') {
      const newLevel: ASTNode[] = [];
      stack[stack.length - 1].push(newLevel);
      stack.push(newLevel);
    } else if (token === ')' || token === '}') {
      if (stack.length > 1) {
        stack.pop();
      }
    } else {
      stack[stack.length - 1].push(token);
    }
  }
  
  return stack[0];
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith('0x')) {
    hex = hex.substring(2);
  }
  
  // Pad with leading zero if odd length
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Determine the minimal PUSH opcode needed for a value
 */
function getPushOpcode(value: bigint | string): number {
  let val: bigint;
  
  if (typeof value === 'string') {
    if (value.startsWith('0x')) {
      val = BigInt(value);
    } else if (value.startsWith('<') && value.endsWith('>')) {
      // Handle contract placeholders - use 20 bytes for addresses
      return OPCODES.PUSH20;
    } else {
      val = BigInt('0x' + value);
    }
  } else {
    val = value;
  }
  
  if (val === 0n) return OPCODES.PUSH0;
  
  // Calculate bytes needed
  let bytes = 0;
  let temp = val;
  while (temp > 0n) {
    bytes++;
    temp = temp >> 8n;
  }
  
  if (bytes === 0) return OPCODES.PUSH0;
  if (bytes > 32) throw new Error(`Value too large for PUSH: ${value}`);
  
  return OPCODES.PUSH1 + bytes - 1;
}

/**
 * Compile AST node to bytecode
 */
function compileNode(node: ASTNode, bytecode: number[] = []): number[] {
  if (typeof node === 'string') {
    // Check if it's an opcode
    const upperNode = node.toUpperCase();
    if (OPCODES.hasOwnProperty(upperNode)) {
      bytecode.push(OPCODES[upperNode]);
    } else if (node.startsWith('0x') || node.match(/^[0-9a-fA-F]+$/)) {
      // It's a hex value - push it
      const val = node.startsWith('0x') ? node : '0x' + node;
      const pushOp = getPushOpcode(val);
      bytecode.push(pushOp);
      
      if (pushOp !== OPCODES.PUSH0) {
        // Add the value bytes
        const bytes = hexToBytes(val);
        const numBytes = pushOp - OPCODES.PUSH1 + 1;
        
        // Pad with leading zeros if necessary
        for (let i = bytes.length; i < numBytes; i++) {
          bytecode.push(0);
        }
        
        // Add the actual bytes
        for (const byte of bytes) {
          bytecode.push(byte);
        }
      }
    } else if (node.startsWith('<') && node.endsWith('>')) {
      // Contract placeholder - use dummy address
      const pushOp = OPCODES.PUSH20;
      bytecode.push(pushOp);
      
      // Generate a deterministic dummy address from the placeholder name
      const placeholder = node.substring(1, node.length - 1);
      const hash = placeholder.split('').reduce((acc, char) => {
        return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff;
      }, 0);
      
      // Create 20 bytes for address
      for (let i = 0; i < 16; i++) {
        bytecode.push(0xee); // Use 0xee as placeholder byte
      }
      // Last 4 bytes from hash for uniqueness
      bytecode.push((hash >> 24) & 0xff);
      bytecode.push((hash >> 16) & 0xff);
      bytecode.push((hash >> 8) & 0xff);
      bytecode.push(hash & 0xff);
    }
  } else if (Array.isArray(node)) {
    for (const child of node) {
      compileNode(child, bytecode);
    }
  }
  
  return bytecode;
}

/**
 * Compile LLL to EVM bytecode
 */
export function compileLLL(lll: string): string {
  // Remove comments
  lll = lll.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/gm, '');
  
  // Tokenize
  const tokens = tokenize(lll);
  
  // Parse to AST
  const ast = parseAST(tokens);
  
  // Compile to bytecode
  const bytecode = compileNode(ast);
  
  // Convert to hex string
  return '0x' + bytecode.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compile Yul to EVM bytecode (simplified - only handles basic operations)
 */
export function compileYul(yul: string): string {
  // This is a very simplified Yul compiler that only handles basic operations
  // For production, you'd want to use the actual solc compiler
  
  // Extract the Yul code body
  const match = yul.match(/\{([^}]+)\}/);
  if (!match) {
    throw new Error('Invalid Yul format');
  }
  
  const body = match[1].trim();
  const bytecode: number[] = [];
  
  // Parse each statement
  const statements = body.split(/(?<=\))/).filter(s => s.trim());
  
  for (const stmt of statements) {
    const trimmed = stmt.trim();
    
    // Handle mstore(offset, value)
    if (trimmed.startsWith('mstore(')) {
      const args = trimmed.match(/mstore\(([^,]+),\s*([^)]+)\)/);
      if (args) {
        // Push value first, then offset for MSTORE
        compileYulValue(args[2], bytecode);
        compileYulValue(args[1], bytecode);
        bytecode.push(OPCODES.MSTORE);
      }
    }
    // Handle pop(call(...))
    else if (trimmed.startsWith('pop(call(')) {
      const args = trimmed.match(/call\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
      if (args) {
        // CALL expects: gas, address, value, argsOffset, argsSize, retOffset, retSize
        compileYulValue(args[7], bytecode); // retSize
        compileYulValue(args[6], bytecode); // retOffset
        compileYulValue(args[5], bytecode); // argsSize
        compileYulValue(args[4], bytecode); // argsOffset
        compileYulValue(args[3], bytecode); // value
        compileYulValue(args[2], bytecode); // address
        compileYulValue(args[1], bytecode); // gas
        bytecode.push(OPCODES.CALL);
        bytecode.push(OPCODES.POP);
      }
    }
    // Handle sstore(slot, value)
    else if (trimmed.startsWith('sstore(')) {
      const args = trimmed.match(/sstore\(([^,]+),\s*([^)]+)\)/);
      if (args) {
        compileYulValue(args[2], bytecode);
        compileYulValue(args[1], bytecode);
        bytecode.push(OPCODES.SSTORE);
      }
    }
  }
  
  return '0x' + bytecode.map(b => b.toString(16).padStart(2, '0')).join('');
}

function compileYulValue(value: string, bytecode: number[]) {
  value = value.trim();
  
  if (value.startsWith('0x')) {
    const pushOp = getPushOpcode(value);
    bytecode.push(pushOp);
    if (pushOp !== OPCODES.PUSH0) {
      const bytes = hexToBytes(value);
      const numBytes = pushOp - OPCODES.PUSH1 + 1;
      for (let i = bytes.length; i < numBytes; i++) {
        bytecode.push(0);
      }
      for (const byte of bytes) {
        bytecode.push(byte);
      }
    }
  } else if (value.startsWith('<') && value.endsWith('>')) {
    // Contract placeholder
    bytecode.push(OPCODES.PUSH20);
    for (let i = 0; i < 20; i++) {
      bytecode.push(0xee);
    }
  } else if (value.match(/^\d+$/)) {
    const num = BigInt(value);
    const pushOp = getPushOpcode(num);
    bytecode.push(pushOp);
    if (pushOp !== OPCODES.PUSH0) {
      const numBytes = pushOp - OPCODES.PUSH1 + 1;
      for (let i = numBytes - 1; i >= 0; i--) {
        bytecode.push(Number((num >> BigInt(i * 8)) & 0xffn));
      }
    }
  } else {
    // Assume it's a function call like mload(x)
    if (value.startsWith('mload(')) {
      const arg = value.match(/mload\(([^)]+)\)/)?.[1];
      if (arg) {
        compileYulValue(arg, bytecode);
        bytecode.push(OPCODES.MLOAD);
      }
    }
  }
}

// Export for use in generate-specs.ts
export function compileAssembly(code: string): string {
  // Remove comments
  code = code.replace(/\/\/.*$/gm, '').trim();
  
  if (code.startsWith(':yul')) {
    // Yul assembly
    return compileYul(code.substring(4).trim());
  } else if (code.startsWith('{')) {
    // LLL assembly
    return compileLLL(code);
  } else {
    throw new Error(`Unknown assembly format: ${code.substring(0, 50)}`);
  }
}

// CLI interface for testing
if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: bun lll-compiler.ts "<LLL code>"');
    console.log('Example: bun lll-compiler.ts "{ (MSTORE 0x00 0xff) (SSTORE 0x00 (MLOAD 0x00)) }"');
    process.exit(1);
  }
  
  try {
    const lll = args[0];
    const bytecode = compileLLL(lll);
    console.log('LLL:', lll);
    console.log('Bytecode:', bytecode);
  } catch (error) {
    console.error('Compilation error:', error);
    process.exit(1);
  }
}