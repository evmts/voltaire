import { Word, u256, wordToBytes32 } from '../types';
import { stackPop, stackPush } from '../stack/stack';
import { next } from '../interpreter';
import type { Frame } from '../frame/frame';
import type { Tail } from '../types_runtime';
import { 
  getU256Evm, 
  setU256, 
  setByte, 
  memorySize,
  memoryCopy,
  getSlice,
  setDataEvm
} from '../memory/memory';

// MLOAD (0x51) - Load word from memory
export function MLOAD(f: Frame, cursor: number): Tail {
  const offset = stackPop(f.stack);
  if (offset instanceof Error) return offset;
  
  if (offset > BigInt(Number.MAX_SAFE_INTEGER)) {
    return new Error('Memory offset too large');
  }
  
  const value = getU256Evm(f.memory, Number(offset));
  if (value instanceof Error) return value;
  
  const err = stackPush(f.stack, value as Word);
  if (err instanceof Error) return err;
  
  return next(f, cursor);
}

// MSTORE (0x52) - Store word to memory
export function MSTORE(f: Frame, cursor: number): Tail {
  const offset = stackPop(f.stack);
  if (offset instanceof Error) return offset;
  
  const value = stackPop(f.stack);
  if (value instanceof Error) return value;
  
  if (offset > BigInt(Number.MAX_SAFE_INTEGER)) {
    return new Error('Memory offset too large');
  }
  
  const err = setU256(f.memory, Number(offset), value as Word);
  if (err instanceof Error) return err;
  
  return next(f, cursor);
}

// MSTORE8 (0x53) - Store byte to memory
export function MSTORE8(f: Frame, cursor: number): Tail {
  const offset = stackPop(f.stack);
  if (offset instanceof Error) return offset;
  
  const value = stackPop(f.stack);
  if (value instanceof Error) return value;
  
  if (offset > BigInt(Number.MAX_SAFE_INTEGER)) {
    return new Error('Memory offset too large');
  }
  
  // Take least significant byte
  const byteValue = Number(value & 0xFFn);
  
  const err = setByte(f.memory, Number(offset), byteValue);
  if (err instanceof Error) return err;
  
  return next(f, cursor);
}

// MSIZE (0x59) - Get memory size
export function MSIZE(f: Frame, cursor: number): Tail {
  const size = BigInt(memorySize(f.memory));
  
  const err = stackPush(f.stack, size);
  if (err instanceof Error) return err;
  
  return next(f, cursor);
}

// MCOPY (0x5E) - Copy memory to memory
export function MCOPY(f: Frame, cursor: number): Tail {
  const destOffset = stackPop(f.stack);
  if (destOffset instanceof Error) return destOffset;
  
  const srcOffset = stackPop(f.stack);
  if (srcOffset instanceof Error) return srcOffset;
  
  const length = stackPop(f.stack);
  if (length instanceof Error) return length;
  
  if (destOffset > BigInt(Number.MAX_SAFE_INTEGER) ||
      srcOffset > BigInt(Number.MAX_SAFE_INTEGER) ||
      length > BigInt(Number.MAX_SAFE_INTEGER)) {
    return new Error('Memory parameters too large');
  }
  
  const err = memoryCopy(
    f.memory,
    Number(destOffset),
    Number(srcOffset),
    Number(length)
  );
  if (err instanceof Error) return err;
  
  return next(f, cursor);
}

// CALLDATACOPY (0x37) - Copy calldata to memory
export function CALLDATACOPY(f: Frame, cursor: number): Tail {
  const destOffset = stackPop(f.stack);
  if (destOffset instanceof Error) return destOffset;
  
  const dataOffset = stackPop(f.stack);
  if (dataOffset instanceof Error) return dataOffset;
  
  const length = stackPop(f.stack);
  if (length instanceof Error) return length;
  
  if (destOffset > BigInt(Number.MAX_SAFE_INTEGER) ||
      dataOffset > BigInt(Number.MAX_SAFE_INTEGER) ||
      length > BigInt(Number.MAX_SAFE_INTEGER)) {
    return new Error('Memory parameters too large');
  }
  
  const calldata = f.calldata || new Uint8Array(0);
  const dataOffsetNum = Number(dataOffset);
  const lengthNum = Number(length);
  
  // Get slice of calldata with zero padding if needed
  let data: Uint8Array;
  if (dataOffsetNum >= calldata.length) {
    // All zeros
    data = new Uint8Array(lengthNum);
  } else {
    const availableLength = Math.min(lengthNum, calldata.length - dataOffsetNum);
    data = new Uint8Array(lengthNum);
    if (availableLength > 0) {
      data.set(calldata.subarray(dataOffsetNum, dataOffsetNum + availableLength));
    }
  }
  
  const err = setDataEvm(f.memory, Number(destOffset), data);
  if (err instanceof Error) return err;
  
  return next(f, cursor);
}

// CODECOPY (0x39) - Copy code to memory
export function CODECOPY(f: Frame, cursor: number): Tail {
  const destOffset = stackPop(f.stack);
  if (destOffset instanceof Error) return destOffset;
  
  const codeOffset = stackPop(f.stack);
  if (codeOffset instanceof Error) return codeOffset;
  
  const length = stackPop(f.stack);
  if (length instanceof Error) return length;
  
  if (destOffset > BigInt(Number.MAX_SAFE_INTEGER) ||
      codeOffset > BigInt(Number.MAX_SAFE_INTEGER) ||
      length > BigInt(Number.MAX_SAFE_INTEGER)) {
    return new Error('Memory parameters too large');
  }
  
  const code = f.code || new Uint8Array(0);
  const codeOffsetNum = Number(codeOffset);
  const lengthNum = Number(length);
  
  // Get slice of code with zero padding if needed
  let data: Uint8Array;
  if (codeOffsetNum >= code.length) {
    // All zeros
    data = new Uint8Array(lengthNum);
  } else {
    const availableLength = Math.min(lengthNum, code.length - codeOffsetNum);
    data = new Uint8Array(lengthNum);
    if (availableLength > 0) {
      data.set(code.subarray(codeOffsetNum, codeOffsetNum + availableLength));
    }
  }
  
  const err = setDataEvm(f.memory, Number(destOffset), data);
  if (err instanceof Error) return err;
  
  return next(f, cursor);
}

// RETURNDATACOPY (0x3E) - Copy return data to memory
export function RETURNDATACOPY(f: Frame, cursor: number): Tail {
  const destOffset = stackPop(f.stack);
  if (destOffset instanceof Error) return destOffset;
  
  const dataOffset = stackPop(f.stack);
  if (dataOffset instanceof Error) return dataOffset;
  
  const length = stackPop(f.stack);
  if (length instanceof Error) return length;
  
  if (destOffset > BigInt(Number.MAX_SAFE_INTEGER) ||
      dataOffset > BigInt(Number.MAX_SAFE_INTEGER) ||
      length > BigInt(Number.MAX_SAFE_INTEGER)) {
    return new Error('Memory parameters too large');
  }
  
  const returnData = f.returnData || new Uint8Array(0);
  const dataOffsetNum = Number(dataOffset);
  const lengthNum = Number(length);
  
  // Check for out-of-bounds access (unlike calldata/code, this reverts)
  if (dataOffsetNum + lengthNum > returnData.length) {
    return new Error('Return data out of bounds');
  }
  
  const data = returnData.subarray(dataOffsetNum, dataOffsetNum + lengthNum);
  
  const err = setDataEvm(f.memory, Number(destOffset), data);
  if (err instanceof Error) return err;
  
  return next(f, cursor);
}