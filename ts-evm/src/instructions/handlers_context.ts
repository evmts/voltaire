import { Word, u256, bytesToWord } from '../types';
import { addressToWord, wordToAddress } from '../types_blockchain';
import { stackPop, stackPush } from '../stack/stack';
import { next } from '../interpreter';
import type { Frame } from '../frame/frame';
import type { Tail } from '../types_runtime';
import { setDataEvm } from '../memory/memory';

// ADDRESS (0x30) - Get address of current executing contract
export function ADDRESS(f: Frame, cursor: number): Tail {
  const addr = addressToWord(f.contractAddress);
  const err = stackPush(f.stack, addr);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// BALANCE (0x31) - Get balance of account
export function BALANCE(f: Frame, cursor: number): Tail {
  const addr = stackPop(f.stack);
  if (addr instanceof Error) return addr;
  
  const address = wordToAddress(addr as Word);
  const balance = f.evm.getBalance ? f.evm.getBalance(address) : 0n;
  
  const err = stackPush(f.stack, balance);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// ORIGIN (0x32) - Get transaction origin
export function ORIGIN(f: Frame, cursor: number): Tail {
  const origin = f.evm.getTxOrigin ? addressToWord(f.evm.getTxOrigin()) : 0n;
  const err = stackPush(f.stack, origin);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// CALLER (0x33) - Get caller address
export function CALLER(f: Frame, cursor: number): Tail {
  const caller = addressToWord(f.caller);
  const err = stackPush(f.stack, caller);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// CALLVALUE (0x34) - Get deposited value
export function CALLVALUE(f: Frame, cursor: number): Tail {
  const err = stackPush(f.stack, f.value);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// CALLDATALOAD (0x35) - Load calldata
export function CALLDATALOAD(f: Frame, cursor: number): Tail {
  const offset = stackPop(f.stack);
  if (offset instanceof Error) return offset;
  
  const offsetNum = Number(offset);
  const calldata = f.calldata;
  
  // Read 32 bytes from calldata with zero padding
  let value = 0n;
  for (let i = 0; i < 32; i++) {
    const byteIdx = offsetNum + i;
    const byte = byteIdx < calldata.length ? calldata[byteIdx] : 0;
    value = (value << 8n) | BigInt(byte);
  }
  
  const err = stackPush(f.stack, value);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// CALLDATASIZE (0x36) - Get calldata size
export function CALLDATASIZE(f: Frame, cursor: number): Tail {
  const size = BigInt(f.calldata.length);
  const err = stackPush(f.stack, size);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// CALLDATACOPY (0x37) - Copy calldata to memory
// Implemented in handlers_memory.ts

// CODESIZE (0x38) - Get code size
export function CODESIZE(f: Frame, cursor: number): Tail {
  const size = BigInt(f.code.length);
  const err = stackPush(f.stack, size);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// CODECOPY (0x39) - Copy code to memory
// Implemented in handlers_memory.ts

// GASPRICE (0x3A) - Get gas price
export function GASPRICE(f: Frame, cursor: number): Tail {
  const gasPrice = f.evm.getGasPrice ? f.evm.getGasPrice() : 0n;
  const err = stackPush(f.stack, gasPrice);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// EXTCODESIZE (0x3B) - Get external code size
export function EXTCODESIZE(f: Frame, cursor: number): Tail {
  const addr = stackPop(f.stack);
  if (addr instanceof Error) return addr;
  
  const address = wordToAddress(addr as Word);
  const code = f.evm.getCode ? f.evm.getCode(address) : new Uint8Array();
  
  const err = stackPush(f.stack, BigInt(code.length));
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// EXTCODECOPY (0x3C) - Copy external code to memory
export function EXTCODECOPY(f: Frame, cursor: number): Tail {
  const addr = stackPop(f.stack);
  if (addr instanceof Error) return addr;
  
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
  
  const address = wordToAddress(addr as Word);
  const code = f.evm.getCode ? f.evm.getCode(address) : new Uint8Array();
  
  const codeOffsetNum = Number(codeOffset);
  const lengthNum = Number(length);
  
  // Get slice of code with zero padding if needed
  let data: Uint8Array;
  if (codeOffsetNum >= code.length) {
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

// RETURNDATASIZE (0x3D) - Get return data size
export function RETURNDATASIZE(f: Frame, cursor: number): Tail {
  const size = BigInt(f.returnData.length);
  const err = stackPush(f.stack, size);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// RETURNDATACOPY (0x3E) - Copy return data to memory
// Implemented in handlers_memory.ts

// EXTCODEHASH (0x3F) - Get external code hash
export function EXTCODEHASH(f: Frame, cursor: number): Tail {
  const addr = stackPop(f.stack);
  if (addr instanceof Error) return addr;
  
  const address = wordToAddress(addr as Word);
  const hash = f.evm.getCodeHash ? f.evm.getCodeHash(address) : 0n;
  
  const err = stackPush(f.stack, hash);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// BLOCKHASH (0x40) - Get block hash
export function BLOCKHASH(f: Frame, cursor: number): Tail {
  const blockNumber = stackPop(f.stack);
  if (blockNumber instanceof Error) return blockNumber;
  
  const hash = f.evm.getBlockHash ? f.evm.getBlockHash(blockNumber as Word) : 0n;
  
  const err = stackPush(f.stack, hash);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// COINBASE (0x41) - Get block coinbase
export function COINBASE(f: Frame, cursor: number): Tail {
  const coinbase = f.evm.getBlockCoinbase ? addressToWord(f.evm.getBlockCoinbase()) : 0n;
  const err = stackPush(f.stack, coinbase);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// TIMESTAMP (0x42) - Get block timestamp
export function TIMESTAMP(f: Frame, cursor: number): Tail {
  const timestamp = f.evm.getBlockTimestamp ? f.evm.getBlockTimestamp() : 0n;
  const err = stackPush(f.stack, timestamp);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// NUMBER (0x43) - Get block number
export function NUMBER(f: Frame, cursor: number): Tail {
  const number = f.evm.getBlockNumber ? f.evm.getBlockNumber() : 0n;
  const err = stackPush(f.stack, number);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// DIFFICULTY (0x44) - Get block difficulty (PREVRANDAO post-merge)
export function DIFFICULTY(f: Frame, cursor: number): Tail {
  const difficulty = f.evm.getBlockDifficulty ? f.evm.getBlockDifficulty() : 0n;
  const err = stackPush(f.stack, difficulty);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// PREVRANDAO - Alias for DIFFICULTY post-merge
export const PREVRANDAO = DIFFICULTY;

// GASLIMIT (0x45) - Get block gas limit
export function GASLIMIT(f: Frame, cursor: number): Tail {
  const gasLimit = f.evm.getBlockGasLimit ? f.evm.getBlockGasLimit() : 0n;
  const err = stackPush(f.stack, gasLimit);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// CHAINID (0x46) - Get chain ID
export function CHAINID(f: Frame, cursor: number): Tail {
  const chainId = f.evm.getChainId ? f.evm.getChainId() : 1n;
  const err = stackPush(f.stack, chainId);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// SELFBALANCE (0x47) - Get balance of current contract
export function SELFBALANCE(f: Frame, cursor: number): Tail {
  const balance = f.evm.getBalance ? f.evm.getBalance(f.contractAddress) : 0n;
  const err = stackPush(f.stack, balance);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// BASEFEE (0x48) - Get block base fee
export function BASEFEE(f: Frame, cursor: number): Tail {
  const baseFee = f.evm.getBlockBaseFee ? f.evm.getBlockBaseFee() : 0n;
  const err = stackPush(f.stack, baseFee);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// BLOBHASH (0x49) - Get blob versioned hash
export function BLOBHASH(f: Frame, cursor: number): Tail {
  const index = stackPop(f.stack);
  if (index instanceof Error) return index;
  
  if (index > BigInt(Number.MAX_SAFE_INTEGER)) {
    const err = stackPush(f.stack, 0n);
    if (err instanceof Error) return err;
    return next(f, cursor);
  }
  
  const hash = f.evm.getBlobHash ? f.evm.getBlobHash(Number(index)) : 0n;
  const err = stackPush(f.stack, hash);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// BLOBBASEFEE (0x4A) - Get blob base fee
export function BLOBBASEFEE(f: Frame, cursor: number): Tail {
  const blobBaseFee = f.evm.getBlobBaseFee ? f.evm.getBlobBaseFee() : 0n;
  const err = stackPush(f.stack, blobBaseFee);
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// PC (0x58) - Get program counter
export function PC(f: Frame, cursor: number): Tail {
  // Get PC from dispatch metadata
  const item = f.schedule.items[cursor];
  const pc = (item as any).pc || 0;
  
  const err = stackPush(f.stack, BigInt(pc));
  if (err instanceof Error) return err;
  return next(f, cursor);
}

// GAS (0x5A) - Get remaining gas
export function GAS(f: Frame, cursor: number): Tail {
  const err = stackPush(f.stack, f.gasRemaining);
  if (err instanceof Error) return err;
  return next(f, cursor);
}