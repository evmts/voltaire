import type { Handler } from '../types_runtime';
import { InvalidOpcodeError } from '../errors';
import { OPCODES, isPush, getPushSize, isDup, getDupN, isSwap, getSwapN } from '../opcodes/opcodes';
import { bytesToWord } from '../types';
import * as arith from '../instructions/handlers_arithmetic';
import * as bitwise from '../instructions/handlers_bitwise';
import * as comparison from '../instructions/handlers_comparison';
import * as stack from '../instructions/handlers_stack';
import * as memory from '../instructions/handlers_memory';
import * as context from '../instructions/handlers_context';

export type Item =
  | { kind: 'meta'; gas?: number }
  | { kind: 'handler'; handler: Handler; nextCursor: number; opcode?: number; pc?: number }
  | { kind: 'inline'; data: any };

export interface Schedule {
  items: Item[];
  entry: { handler: Handler; cursor: number };
}

function getHandler(opcode: number): Handler | null {
  switch (opcode) {
    // System
    case OPCODES.STOP: return stack.STOP;
    
    // Arithmetic
    case OPCODES.ADD: return arith.ADD;
    case OPCODES.MUL: return arith.MUL;
    case OPCODES.SUB: return arith.SUB;
    case OPCODES.DIV: return arith.DIV;
    case OPCODES.SDIV: return arith.SDIV;
    case OPCODES.MOD: return arith.MOD;
    case OPCODES.SMOD: return arith.SMOD;
    case OPCODES.ADDMOD: return arith.ADDMOD;
    case OPCODES.MULMOD: return arith.MULMOD;
    
    // Comparison
    case OPCODES.LT: return comparison.LT;
    case OPCODES.GT: return comparison.GT;
    case OPCODES.SLT: return comparison.SLT;
    case OPCODES.SGT: return comparison.SGT;
    case OPCODES.EQ: return comparison.EQ;
    case OPCODES.ISZERO: return comparison.ISZERO;
    
    // Bitwise
    case OPCODES.AND: return bitwise.AND;
    case OPCODES.OR: return bitwise.OR;
    case OPCODES.XOR: return bitwise.XOR;
    case OPCODES.NOT: return bitwise.NOT;
    case OPCODES.BYTE: return bitwise.BYTE;
    case OPCODES.SHL: return bitwise.SHL;
    case OPCODES.SHR: return bitwise.SHR;
    case OPCODES.SAR: return bitwise.SAR;
    
    // Context
    case OPCODES.ADDRESS: return context.ADDRESS;
    case OPCODES.BALANCE: return context.BALANCE;
    case OPCODES.ORIGIN: return context.ORIGIN;
    case OPCODES.CALLER: return context.CALLER;
    case OPCODES.CALLVALUE: return context.CALLVALUE;
    case OPCODES.CALLDATALOAD: return context.CALLDATALOAD;
    case OPCODES.CALLDATASIZE: return context.CALLDATASIZE;
    case OPCODES.CALLDATACOPY: return memory.CALLDATACOPY;
    case OPCODES.CODESIZE: return context.CODESIZE;
    case OPCODES.CODECOPY: return memory.CODECOPY;
    case OPCODES.GASPRICE: return context.GASPRICE;
    case OPCODES.EXTCODESIZE: return context.EXTCODESIZE;
    case OPCODES.EXTCODECOPY: return context.EXTCODECOPY;
    case OPCODES.RETURNDATASIZE: return context.RETURNDATASIZE;
    case OPCODES.RETURNDATACOPY: return memory.RETURNDATACOPY;
    case OPCODES.EXTCODEHASH: return context.EXTCODEHASH;
    case OPCODES.BLOCKHASH: return context.BLOCKHASH;
    case OPCODES.COINBASE: return context.COINBASE;
    case OPCODES.TIMESTAMP: return context.TIMESTAMP;
    case OPCODES.NUMBER: return context.NUMBER;
    case OPCODES.DIFFICULTY: return context.DIFFICULTY;
    case OPCODES.GASLIMIT: return context.GASLIMIT;
    case OPCODES.CHAINID: return context.CHAINID;
    case OPCODES.SELFBALANCE: return context.SELFBALANCE;
    case OPCODES.BASEFEE: return context.BASEFEE;
    case OPCODES.BLOBHASH: return context.BLOBHASH;
    case OPCODES.BLOBBASEFEE: return context.BLOBBASEFEE;
    
    // Stack
    case OPCODES.POP: return stack.POP;
    
    // Memory
    case OPCODES.MLOAD: return memory.MLOAD;
    case OPCODES.MSTORE: return memory.MSTORE;
    case OPCODES.MSTORE8: return memory.MSTORE8;
    case OPCODES.MSIZE: return memory.MSIZE;
    case OPCODES.MCOPY: return memory.MCOPY;
    
    // PC/GAS
    case OPCODES.PC: return context.PC;
    case OPCODES.GAS: return context.GAS;
    
    // System
    case OPCODES.RETURN: return stack.RETURN;
    
    default:
      if (isPush(opcode)) return stack.PUSH;
      if (isDup(opcode)) return stack.DUP;
      if (isSwap(opcode)) return stack.SWAP;
      return null;
  }
}

export function compile(bytecode: Uint8Array): Schedule | InvalidOpcodeError {
  const items: Item[] = [];
  const handlerIndices: number[] = [];
  
  // Add initial metadata
  items.push({ kind: 'meta', gas: 0 });
  
  let pc = 0;
  while (pc < bytecode.length) {
    const opcode = bytecode[pc];
    const handler = getHandler(opcode);
    
    if (!handler) {
      return new InvalidOpcodeError(opcode);
    }
    
    const handlerIndex = items.length;
    handlerIndices.push(handlerIndex);
    
    items.push({
      kind: 'handler',
      handler,
      nextCursor: -1, // Will be updated
      opcode,
      pc
    });
    
    // Handle PUSH immediates
    if (isPush(opcode)) {
      const pushSize = getPushSize(opcode);
      const dataStart = pc + 1;
      const dataEnd = Math.min(dataStart + pushSize, bytecode.length);
      const immediateBytes = bytecode.slice(dataStart, dataEnd);
      
      // Pad with zeros if we run out of bytecode
      const paddedBytes = new Uint8Array(pushSize);
      paddedBytes.set(immediateBytes);
      
      const value = bytesToWord(paddedBytes);
      items.push({ kind: 'inline', data: { value, n: pushSize } });
      
      pc += pushSize + 1;
    } else if (isDup(opcode)) {
      const n = getDupN(opcode);
      items.push({ kind: 'inline', data: { n } });
      pc++;
    } else if (isSwap(opcode)) {
      const n = getSwapN(opcode);
      items.push({ kind: 'inline', data: { n } });
      pc++;
    } else {
      pc++;
    }
  }
  
  // Add terminal handler
  const terminalIndex = items.length;
  handlerIndices.push(terminalIndex);
  items.push({
    kind: 'handler',
    handler: stack.STOP,
    nextCursor: -1,
    opcode: OPCODES.STOP
  });
  
  // Update nextCursor for each handler
  for (let i = 0; i < handlerIndices.length - 1; i++) {
    const currentIdx = handlerIndices[i];
    const nextIdx = handlerIndices[i + 1];
    const item = items[currentIdx];
    if (item.kind === 'handler') {
      item.nextCursor = nextIdx;
    }
  }
  
  // Find first handler
  const firstHandlerIdx = handlerIndices[0];
  const firstHandler = items[firstHandlerIdx] as { kind: 'handler'; handler: Handler };
  
  return {
    items,
    entry: {
      handler: firstHandler.handler,
      cursor: firstHandlerIdx
    }
  };
}