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

// Devtool-style stepper mirroring src/devtool/evm.zig behavior
export interface DebugStepResult {
  gas_before: bigint;
  gas_after: bigint;
  completed: boolean;
  error_occurred: boolean;
  execution_error?: ErrorUnion;
}

export class DevtoolEvmTs {
  private evm: ConcreteEvm;
  private bytecode: Uint8Array = new Uint8Array();
  private schedule: ReturnType<typeof compile> | null = null;
  private frame: ReturnType<typeof createFrame> | null = null;
  private cursor: number = 0;
  private isInitialized = false;
  private isCompleted = false;

  constructor(evm?: ConcreteEvm) {
    this.evm = evm ?? new ConcreteEvm();
  }

  setBytecode(bytes: Uint8Array): void {
    this.bytecode = new Uint8Array(bytes);
  }

  loadBytecodeHex(hex: string): Error | void {
    if (!hex || hex.length === 0) return new Error('EmptyBytecode');
    const s = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (s.length % 2 !== 0) return new Error('InvalidHexLength');
    const out = new Uint8Array(s.length / 2);
    for (let i = 0; i < out.length; i++) {
      const b = s.slice(i * 2, i * 2 + 2);
      const n = Number.parseInt(b, 16);
      if (Number.isNaN(n)) return new Error('InvalidHexCharacter');
      out[i] = n;
    }
    this.setBytecode(out);
    return this.resetExecution();
  }

  resetExecution(): Error | void {
    if (this.bytecode.length === 0) {
      this.isInitialized = false;
      this.isCompleted = false;
      this.schedule = null;
      this.frame = null;
      this.cursor = 0;
      return;
    }
    const schedule = compile(this.bytecode);
    if (schedule instanceof Error) return schedule;
    this.schedule = schedule;
    this.frame = createFrame(
      this.evm,
      schedule,
      createAddress(), // contract address
      createAddress(), // caller
      0n,
      new Uint8Array(), // calldata
      this.bytecode,     // code
      1_000_000n,        // gas
      300_000_000
    );
    this.cursor = schedule.entry.cursor;
    this.isInitialized = true;
    this.isCompleted = false;
  }

  stepExecute(): DebugStepResult | ErrorUnion {
    if (!this.isInitialized || !this.frame || !this.schedule) {
      return new Error('NotInitialized');
    }
    if (this.isCompleted) {
      const g = this.frame.gasRemaining;
      return { gas_before: g, gas_after: g, completed: true, error_occurred: false };
    }

    const f = this.frame;
    const items = this.schedule.items as any[];
    let gasBefore = f.gasRemaining;

    // Execute exactly one handler at current cursor
    const handlerItem = items[this.cursor];
    if (!handlerItem || handlerItem.kind !== 'handler') {
      // If schedule malformed, mark completed
      this.isCompleted = true;
      return { gas_before: gasBefore, gas_after: f.gasRemaining, completed: true, error_occurred: true, execution_error: new Error('ScheduleError') as any };
    }

    const h = handlerItem.handler as any;
    const r = h(f, this.cursor);
    if ('next' in (r as any)) {
      const n = r as any;
      this.cursor = n.cursor;
    } else if ((r as any).data instanceof Uint8Array) {
      // RETURN/STOP
      this.isCompleted = true;
    } else if (r instanceof Error) {
      this.isCompleted = true;
      return { gas_before: gasBefore, gas_after: f.gasRemaining, completed: true, error_occurred: true, execution_error: r };
    } else {
      // Unknown terminal; mark completed to be safe
      this.isCompleted = true;
    }

    const gasAfter = f.gasRemaining;
    return {
      gas_before: gasBefore,
      gas_after: gasAfter,
      completed: this.isCompleted,
      error_occurred: false,
    };
  }

  // Utility: format word to 0x-prefixed 32-byte hex
  private static wordToHex(w: bigint): string {
    let s = w.toString(16);
    if (s.length > 64) s = s.slice(-64);
    while (s.length < 64) s = '0' + s;
    return '0x' + s;
  }

  serializeEvmState(): string {
    if (!this.isInitialized || !this.frame || !this.schedule) {
      const empty = {
        gasLeft: 0,
        depth: 0,
        stack: [],
        memory: '0x',
        storage: [],
        logs: [],
        returnData: '0x',
        blocks: [],
        currentInstructionIndex: 0,
        currentBlockStartIndex: 0,
      };
      return JSON.stringify(empty);
    }

    const f = this.frame;
    const stackHex = f.stack.items.map(DevtoolEvmTs.wordToHex);
    // Memory as hex dump
    const memBytes = f.memory.buffer || new Uint8Array();
    const memHex = '0x' + Array.from(memBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const state = {
      gasLeft: f.gasRemaining,
      depth: 0,
      stack: stackHex,
      memory: memHex,
      storage: [],
      logs: f.logs ?? [],
      returnData: '0x' + Array.from(f.returnData || []).map(b => b.toString(16).padStart(2, '0')).join(''),
      blocks: [],
      currentInstructionIndex: this.cursor,
      currentBlockStartIndex: 0,
    };
    return JSON.stringify(state);
  }
}
