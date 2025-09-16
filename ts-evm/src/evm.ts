import { CallParams } from './call_params';
import { ReturnData } from './frame/call_result';
import { ErrorUnion } from './errors';
import { compile } from './preprocessor/dispatch';
import { createFrame, Evm as EvmInterface } from './frame/frame';
import { interpret } from './interpreter';
import { Address, BlockInfo, createAddress } from './types_blockchain';
import { Word } from './types';
import { Storage, InMemoryStorage } from './storage/storage';
import * as crypto from 'crypto';

export class ConcreteEvm implements EvmInterface {
  private blockInfo: BlockInfo;
  private txOrigin: Address;
  private gasPrice: Word;
  private chainId: Word;
  private storage: Storage;
  private balances: Map<string, Word>;
  private codes: Map<string, Uint8Array>;
  
  constructor(config?: {
    blockInfo?: BlockInfo;
    txOrigin?: Address;
    gasPrice?: Word;
    chainId?: Word;
  }) {
    this.blockInfo = config?.blockInfo || {
      number: 1n,
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
      gasLimit: 30_000_000n,
      difficulty: 0n,
      baseFee: 1_000_000_000n,
      coinbase: createAddress()
    };
    this.txOrigin = config?.txOrigin || createAddress();
    this.gasPrice = config?.gasPrice || 1_000_000_000n;
    this.chainId = config?.chainId || 1n;
    this.storage = new InMemoryStorage();
    this.balances = new Map();
    this.codes = new Map();
  }
  
  // Block context
  getBlockHash(blockNumber: Word): Word {
    // Simplified: just hash the block number
    const hash = crypto.createHash('sha256');
    hash.update(blockNumber.toString());
    const bytes = hash.digest();
    let word = 0n;
    for (let i = 0; i < 32; i++) {
      word = (word << 8n) | BigInt(bytes[i]);
    }
    return word;
  }
  
  getBlockNumber(): Word { return this.blockInfo.number; }
  getBlockTimestamp(): Word { return this.blockInfo.timestamp; }
  getBlockGasLimit(): Word { return this.blockInfo.gasLimit; }
  getBlockDifficulty(): Word { return this.blockInfo.difficulty; }
  getBlockBaseFee(): Word { return this.blockInfo.baseFee; }
  getBlockCoinbase(): Address { return this.blockInfo.coinbase; }
  getBlobBaseFee(): Word { return this.blockInfo.blobBaseFee || 0n; }
  
  getBlobHash(index: number): Word {
    const hashes = this.blockInfo.blobVersionedHashes || [];
    return index < hashes.length ? hashes[index] : 0n;
  }
  
  // Transaction context
  getTxOrigin(): Address { return this.txOrigin; }
  getGasPrice(): Word { return this.gasPrice; }
  
  // Chain context
  getChainId(): Word { return this.chainId; }
  
  // Account state
  getBalance(address: Address): Word {
    const key = address.toString();
    return this.balances.get(key) || 0n;
  }
  
  setBalance(address: Address, balance: Word): void {
    const key = address.toString();
    this.balances.set(key, balance);
  }
  
  getCode(address: Address): Uint8Array {
    const key = address.toString();
    return this.codes.get(key) || new Uint8Array();
  }
  
  setCode(address: Address, code: Uint8Array): void {
    const key = address.toString();
    this.codes.set(key, code);
  }
  
  getCodeHash(address: Address): Word {
    const code = this.getCode(address);
    if (code.length === 0) return 0n;
    
    // Keccak256 hash - using SHA256 as placeholder
    const hash = crypto.createHash('sha256');
    hash.update(code);
    const bytes = hash.digest();
    let word = 0n;
    for (let i = 0; i < 32; i++) {
      word = (word << 8n) | BigInt(bytes[i]);
    }
    return word;
  }
  
  // Storage operations
  getStorageAt(address: Address, slot: Word): Word {
    return this.storage.get(address, slot);
  }
  
  setStorageAt(address: Address, slot: Word, value: Word): void {
    this.storage.set(address, slot, value);
  }
}

export function createEvm(config?: Parameters<typeof ConcreteEvm['constructor']>[0]): ConcreteEvm {
  return new ConcreteEvm(config);
}

export function call(evm: ConcreteEvm, params: CallParams): ReturnData | ErrorUnion {
  const schedule = compile(params.bytecode || new Uint8Array());
  if (schedule instanceof Error) return schedule;
  
  const frame = createFrame(
    evm,
    schedule,
    params.to || createAddress(),
    params.caller || createAddress(),
    params.value || 0n,
    params.calldata || new Uint8Array(),
    params.bytecode || new Uint8Array(),
    params.gasLimit || 30_000_000n,
    params.safetyLimit ?? 300_000_000
  );
  
  return interpret(frame, schedule.entry);
}