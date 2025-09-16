import { OPCODES, OPCODE_INFO, OpcodeInfo } from '../opcodes/opcodes';
import type { Word } from '../types';

// Bytecode analysis for validation and optimization

export interface BytecodeAnalysis {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  jumpDestinations: Set<number>;
  staticJumps: Map<number, number>;
  codeSize: number;
  dataSize: number;
  gasEstimate: bigint;
  containsInvalidOpcodes: boolean;
  containsTruncatedPush: boolean;
  maxStackDepth: number;
  hasSelfdestruct: boolean;
  hasCreate: boolean;
  hasDelegatecall: boolean;
  usedOpcodes: Set<number>;
  basicBlocks: BasicBlock[];
}

export interface BasicBlock {
  start: number;
  end: number;
  gasUsed: bigint;
  stackDelta: number;
  isJumpDest: boolean;
  jumpsTo: number[];
  fallsThrough: boolean;
}

export function analyzeBytecode(bytecode: Uint8Array): BytecodeAnalysis {
  const analysis: BytecodeAnalysis = {
    isValid: true,
    errors: [],
    warnings: [],
    jumpDestinations: new Set(),
    staticJumps: new Map(),
    codeSize: bytecode.length,
    dataSize: 0,
    gasEstimate: 0n,
    containsInvalidOpcodes: false,
    containsTruncatedPush: false,
    maxStackDepth: 0,
    hasSelfdestruct: false,
    hasCreate: false,
    hasDelegatecall: false,
    usedOpcodes: new Set(),
    basicBlocks: []
  };
  
  // First pass: identify jump destinations and validate instructions
  let i = 0;
  let currentStackDepth = 0;
  
  while (i < bytecode.length) {
    const opcode = bytecode[i];
    analysis.usedOpcodes.add(opcode);
    
    // Check for JUMPDEST
    if (opcode === 0x5b) {
      analysis.jumpDestinations.add(i);
    }
    
    // Check for special opcodes
    if (opcode === 0xff) analysis.hasSelfdestruct = true;
    if (opcode === 0xf0 || opcode === 0xf5) analysis.hasCreate = true;
    if (opcode === 0xf4) analysis.hasDelegatecall = true;
    
    // Get opcode info
    const info = OPCODE_INFO[opcode];
    if (!info) {
      analysis.containsInvalidOpcodes = true;
      analysis.errors.push(`Invalid opcode 0x${opcode.toString(16)} at position ${i}`);
      i++;
      continue;
    }
    
    // Update stack depth
    currentStackDepth = currentStackDepth - info.stackIn + info.stackOut;
    if (currentStackDepth < 0) {
      analysis.errors.push(`Stack underflow at position ${i}`);
      analysis.isValid = false;
    }
    if (currentStackDepth > 1024) {
      analysis.errors.push(`Stack overflow at position ${i}`);
      analysis.isValid = false;
    }
    analysis.maxStackDepth = Math.max(analysis.maxStackDepth, currentStackDepth);
    
    // Add gas estimate
    analysis.gasEstimate += BigInt(info.gas);
    
    // Handle PUSH opcodes
    if (opcode >= 0x60 && opcode <= 0x7f) {
      const pushSize = opcode - 0x5f;
      
      // Check for truncated PUSH
      if (i + pushSize >= bytecode.length) {
        analysis.containsTruncatedPush = true;
        analysis.errors.push(`Truncated PUSH${pushSize} at position ${i}`);
        analysis.isValid = false;
        break;
      }
      
      // Check for static jump pattern (PUSH followed by JUMP/JUMPI)
      if (i + pushSize + 1 < bytecode.length) {
        const nextOpcode = bytecode[i + pushSize + 1];
        if (nextOpcode === 0x56 || nextOpcode === 0x57) {
          // Extract jump destination
          let destination = 0;
          for (let j = 0; j < pushSize; j++) {
            destination = (destination << 8) | bytecode[i + 1 + j];
          }
          analysis.staticJumps.set(i, destination);
        }
      }
      
      // Count PUSH data as data size
      analysis.dataSize += pushSize;
      i += pushSize + 1;
    } else {
      i++;
    }
  }
  
  // Second pass: identify basic blocks
  analysis.basicBlocks = identifyBasicBlocks(bytecode, analysis.jumpDestinations);
  
  // Validate jump destinations
  for (const [from, to] of analysis.staticJumps) {
    if (!analysis.jumpDestinations.has(to)) {
      analysis.errors.push(`Invalid jump from ${from} to ${to} - not a JUMPDEST`);
      analysis.isValid = false;
    }
  }
  
  // Check bytecode size limits
  if (bytecode.length > 24576) { // 24KB limit for deployed code
    analysis.errors.push(`Bytecode size ${bytecode.length} exceeds 24KB limit`);
    analysis.isValid = false;
  }
  
  // Add warnings
  if (analysis.hasSelfdestruct) {
    analysis.warnings.push('Contract contains SELFDESTRUCT');
  }
  if (analysis.hasDelegatecall) {
    analysis.warnings.push('Contract contains DELEGATECALL - proxy pattern detected');
  }
  if (analysis.maxStackDepth > 512) {
    analysis.warnings.push(`High stack usage: ${analysis.maxStackDepth} items`);
  }
  
  return analysis;
}

function identifyBasicBlocks(bytecode: Uint8Array, jumpDests: Set<number>): BasicBlock[] {
  const blocks: BasicBlock[] = [];
  const blockStarts = new Set<number>([0]); // Start of bytecode is always a block start
  
  // Find all block start positions
  let i = 0;
  while (i < bytecode.length) {
    const opcode = bytecode[i];
    
    // JUMPDEST starts a new block
    if (opcode === 0x5b) {
      blockStarts.add(i);
    }
    
    // Instructions after JUMP, JUMPI, STOP, RETURN, REVERT, INVALID, SELFDESTRUCT start new blocks
    if (opcode === 0x56 || opcode === 0x57 || opcode === 0x00 || 
        opcode === 0xf3 || opcode === 0xfd || opcode === 0xfe || opcode === 0xff) {
      if (i + 1 < bytecode.length) {
        blockStarts.add(i + 1);
      }
    }
    
    // Skip PUSH data
    if (opcode >= 0x60 && opcode <= 0x7f) {
      const pushSize = opcode - 0x5f;
      i += pushSize + 1;
    } else {
      i++;
    }
  }
  
  // Sort block starts
  const sortedStarts = Array.from(blockStarts).sort((a, b) => a - b);
  
  // Create basic blocks
  for (let j = 0; j < sortedStarts.length; j++) {
    const start = sortedStarts[j];
    const end = j + 1 < sortedStarts.length ? sortedStarts[j + 1] - 1 : bytecode.length - 1;
    
    const block: BasicBlock = {
      start,
      end,
      gasUsed: 0n,
      stackDelta: 0,
      isJumpDest: jumpDests.has(start),
      jumpsTo: [],
      fallsThrough: true
    };
    
    // Analyze block
    let pos = start;
    while (pos <= end && pos < bytecode.length) {
      const opcode = bytecode[pos];
      const info = OPCODE_INFO[opcode];
      
      if (info) {
        block.gasUsed += BigInt(info.gas);
        block.stackDelta += info.stackOut - info.stackIn;
      }
      
      // Check for terminating instructions
      if (opcode === 0x56 || opcode === 0x57) {
        // JUMP/JUMPI
        block.fallsThrough = opcode === 0x57; // JUMPI can fall through
      } else if (opcode === 0x00 || opcode === 0xf3 || opcode === 0xfd || 
                 opcode === 0xfe || opcode === 0xff) {
        // STOP, RETURN, REVERT, INVALID, SELFDESTRUCT
        block.fallsThrough = false;
      }
      
      // Skip PUSH data
      if (opcode >= 0x60 && opcode <= 0x7f) {
        const pushSize = opcode - 0x5f;
        pos += pushSize + 1;
      } else {
        pos++;
      }
    }
    
    blocks.push(block);
  }
  
  return blocks;
}

// Validate init code (used during contract creation)
export function validateInitCode(initCode: Uint8Array): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  let isValid = true;
  
  // Check size limit (48KB for init code)
  if (initCode.length > 49152) {
    errors.push(`Init code size ${initCode.length} exceeds 48KB limit`);
    isValid = false;
  }
  
  // Check for RETURN opcode (required to return runtime code)
  let hasReturn = false;
  for (let i = 0; i < initCode.length; i++) {
    if (initCode[i] === 0xf3) {
      hasReturn = true;
      break;
    }
    // Skip PUSH data
    if (initCode[i] >= 0x60 && initCode[i] <= 0x7f) {
      i += initCode[i] - 0x5f;
    }
  }
  
  if (!hasReturn) {
    errors.push('Init code must contain RETURN opcode to deploy runtime code');
    isValid = false;
  }
  
  return { isValid, errors };
}

// Extract metadata from bytecode (Solidity metadata)
export function extractMetadata(bytecode: Uint8Array): {
  hasMetadata: boolean;
  metadataLength: number;
  metadataHash?: Uint8Array;
  codeWithoutMetadata: Uint8Array;
} {
  // Solidity appends metadata in format: 0xa2 0x64 ... (CBOR encoded)
  if (bytecode.length < 2) {
    return {
      hasMetadata: false,
      metadataLength: 0,
      codeWithoutMetadata: bytecode
    };
  }
  
  // Check for Solidity metadata pattern
  const lastTwo = bytecode.slice(-2);
  if (lastTwo[1] === 0x33) {
    // Likely has metadata
    const metadataLength = lastTwo[0];
    
    if (bytecode.length >= metadataLength) {
      return {
        hasMetadata: true,
        metadataLength,
        metadataHash: bytecode.slice(-metadataLength),
        codeWithoutMetadata: bytecode.slice(0, -metadataLength)
      };
    }
  }
  
  return {
    hasMetadata: false,
    metadataLength: 0,
    codeWithoutMetadata: bytecode
  };
}

// Optimize bytecode by identifying patterns
export function optimizeBytecode(bytecode: Uint8Array): {
  optimized: Uint8Array;
  optimizations: string[];
} {
  const optimizations: string[] = [];
  const optimized = new Uint8Array(bytecode);
  
  // Pattern: DUP1 SWAP1 -> Could be optimized
  // Pattern: PUSH1 0x00 DUP1 -> Could use PUSH1 0x00 PUSH1 0x00
  // Pattern: NOT NOT -> Could be removed
  
  // This is a placeholder for actual optimization logic
  // Real optimization would require careful pattern matching and replacement
  
  return { optimized, optimizations };
}

// Gas estimation for bytecode execution
export function estimateGas(bytecode: Uint8Array, calldata?: Uint8Array): bigint {
  const analysis = analyzeBytecode(bytecode);
  let gasEstimate = 21000n; // Base transaction gas
  
  // Add intrinsic gas for calldata
  if (calldata) {
    for (const byte of calldata) {
      gasEstimate += byte === 0 ? 4n : 16n;
    }
  }
  
  // Add execution gas estimate
  gasEstimate += analysis.gasEstimate;
  
  // Add memory expansion costs (simplified)
  gasEstimate += 3n * BigInt(Math.ceil(bytecode.length / 32));
  
  return gasEstimate;
}
