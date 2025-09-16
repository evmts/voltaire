import { describe, it, expect } from 'bun:test';
import { createEvm, call } from '../src/evm';
import { createAddress, wordToAddress } from '../src/types_blockchain';
import { u256, bytesToWord } from '../src/types';
import type { ReturnData } from '../src/frame/call_result';

function hex(b: Uint8Array): string {
  return [...b].map(x => x.toString(16).padStart(2,'0')).join('');
}

describe('E2E: Memory Operations', () => {
  it('MSTORE and MLOAD work correctly', () => {
    // PUSH 0x42, PUSH 0x00, MSTORE, PUSH 0x00, MLOAD, RETURN
    const bytecode = new Uint8Array([
      0x60, 0x42,  // PUSH1 0x42 (value to store)
      0x60, 0x00,  // PUSH1 0x00 (memory offset)
      0x52,        // MSTORE
      0x60, 0x00,  // PUSH1 0x00 (memory offset)
      0x51,        // MLOAD
      0xf3         // RETURN
    ]);
    
    const evm = createEvm();
    const res = call(evm, { bytecode });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    expect(data.length).toBe(32);
    expect(data[31]).toBe(0x42);
  });

  it('MSTORE8 stores a single byte', () => {
    // PUSH 0x1234, PUSH 0x05, MSTORE8, PUSH 0x00, MLOAD, RETURN
    const bytecode = new Uint8Array([
      0x61, 0x12, 0x34,  // PUSH2 0x1234
      0x60, 0x05,        // PUSH1 0x05 (offset)
      0x53,              // MSTORE8 (stores 0x34)
      0x60, 0x00,        // PUSH1 0x00 (load from start)
      0x51,              // MLOAD
      0xf3               // RETURN
    ]);
    
    const evm = createEvm();
    const res = call(evm, { bytecode });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    // MSTORE8 at offset 5 stores byte 0x34
    // When we MLOAD from 0, byte at index 5 should be 0x34
    expect(data[5]).toBe(0x34);
  });

  it('MSIZE returns memory size', () => {
    // PUSH 0x42, PUSH 0x20, MSTORE, MSIZE, RETURN
    const bytecode = new Uint8Array([
      0x60, 0x42,  // PUSH1 0x42
      0x60, 0x20,  // PUSH1 0x20 (offset 32)
      0x52,        // MSTORE (expands to 64 bytes)
      0x59,        // MSIZE
      0xf3         // RETURN
    ]);
    
    const evm = createEvm();
    const res = call(evm, { bytecode });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    expect(data[31]).toBe(64); // Memory expanded to 64 bytes
  });

  it('MCOPY copies memory correctly', () => {
    // Store 0x42 at offset 0, copy to offset 32, load from offset 32
    const bytecode = new Uint8Array([
      0x60, 0x42,  // PUSH1 0x42
      0x60, 0x00,  // PUSH1 0x00
      0x52,        // MSTORE
      0x60, 0x20,  // PUSH1 0x20 (length)
      0x60, 0x00,  // PUSH1 0x00 (source)
      0x60, 0x20,  // PUSH1 0x20 (dest)
      0x5e,        // MCOPY
      0x60, 0x20,  // PUSH1 0x20
      0x51,        // MLOAD
      0xf3         // RETURN
    ]);
    
    const evm = createEvm();
    const res = call(evm, { bytecode });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    expect(data[31]).toBe(0x42);
  });
});

describe('E2E: Context Operations', () => {
  it('ADDRESS returns contract address', () => {
    const contractAddr = new Uint8Array(20);
    contractAddr[19] = 0x42;
    
    // ADDRESS, RETURN
    const bytecode = new Uint8Array([
      0x30,  // ADDRESS
      0xf3   // RETURN
    ]);
    
    const evm = createEvm();
    const res = call(evm, { 
      bytecode,
      to: contractAddr
    });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    expect(data[31]).toBe(0x42);
  });

  it('CALLER returns caller address', () => {
    const callerAddr = new Uint8Array(20);
    callerAddr[19] = 0x99;
    
    // CALLER, RETURN
    const bytecode = new Uint8Array([
      0x33,  // CALLER
      0xf3   // RETURN
    ]);
    
    const evm = createEvm();
    const res = call(evm, { 
      bytecode,
      caller: callerAddr
    });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    expect(data[31]).toBe(0x99);
  });

  it('CALLVALUE returns msg.value', () => {
    // CALLVALUE, RETURN
    const bytecode = new Uint8Array([
      0x34,  // CALLVALUE
      0xf3   // RETURN
    ]);
    
    const evm = createEvm();
    const res = call(evm, { 
      bytecode,
      value: 1000n
    });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    const value = bytesToWord(data);
    expect(value).toBe(1000n);
  });

  it('CALLDATALOAD loads calldata', () => {
    const calldata = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      calldata[i] = i;
    }
    
    // PUSH 0x00, CALLDATALOAD, RETURN
    const bytecode = new Uint8Array([
      0x60, 0x00,  // PUSH1 0x00
      0x35,        // CALLDATALOAD
      0xf3         // RETURN
    ]);
    
    const evm = createEvm();
    const res = call(evm, { 
      bytecode,
      calldata
    });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    for (let i = 0; i < 32; i++) {
      expect(data[i]).toBe(i);
    }
  });

  it('CALLDATASIZE returns calldata size', () => {
    const calldata = new Uint8Array(64);
    
    // CALLDATASIZE, RETURN
    const bytecode = new Uint8Array([
      0x36,  // CALLDATASIZE
      0xf3   // RETURN
    ]);
    
    const evm = createEvm();
    const res = call(evm, { 
      bytecode,
      calldata
    });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    expect(data[31]).toBe(64);
  });

  it('CODESIZE returns code size', () => {
    const code = new Uint8Array([0x38, 0xf3]); // CODESIZE, RETURN
    
    const evm = createEvm();
    const res = call(evm, { bytecode: code });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    expect(data[31]).toBe(2); // Code is 2 bytes
  });

  it('Block context opcodes work', () => {
    // NUMBER, RETURN
    const bytecode = new Uint8Array([
      0x43,  // NUMBER
      0xf3   // RETURN
    ]);
    
    const evm = createEvm({
      blockInfo: {
        number: 12345n,
        timestamp: 1000000n,
        gasLimit: 30_000_000n,
        difficulty: 0n,
        baseFee: 1_000_000_000n,
        coinbase: createAddress()
      }
    });
    
    const res = call(evm, { bytecode });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    const blockNumber = bytesToWord(data);
    expect(blockNumber).toBe(12345n);
  });

  it('CHAINID returns chain ID', () => {
    // CHAINID, RETURN
    const bytecode = new Uint8Array([
      0x46,  // CHAINID
      0xf3   // RETURN
    ]);
    
    const evm = createEvm({ chainId: 1337n });
    const res = call(evm, { bytecode });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    const chainId = bytesToWord(data);
    expect(chainId).toBe(1337n);
  });

  it('BALANCE returns account balance', () => {
    const addr = new Uint8Array(20);
    addr[19] = 0x11;
    
    // PUSH address, BALANCE, RETURN
    const bytecode = new Uint8Array([
      0x73, ...addr,  // PUSH20 address
      0x31,           // BALANCE
      0xf3            // RETURN
    ]);
    
    const evm = createEvm();
    evm.setBalance(addr, 999999n);
    
    const res = call(evm, { bytecode });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    const balance = bytesToWord(data);
    expect(balance).toBe(999999n);
  });

  it('SELFBALANCE returns contract balance', () => {
    const contractAddr = new Uint8Array(20);
    contractAddr[19] = 0x22;
    
    // SELFBALANCE, RETURN
    const bytecode = new Uint8Array([
      0x47,  // SELFBALANCE
      0xf3   // RETURN
    ]);
    
    const evm = createEvm();
    evm.setBalance(contractAddr, 777777n);
    
    const res = call(evm, { 
      bytecode,
      to: contractAddr
    });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    const balance = bytesToWord(data);
    expect(balance).toBe(777777n);
  });
});

describe('E2E: Complex Memory + Context', () => {
  it('Stores calldata in memory and returns it', () => {
    const calldata = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      calldata[i] = i + 1;
    }
    
    // CALLDATASIZE, PUSH 0, PUSH 0, CALLDATACOPY, PUSH 0, MLOAD, RETURN
    const bytecode = new Uint8Array([
      0x60, 0x20,  // PUSH1 32 (length)
      0x60, 0x00,  // PUSH1 0 (data offset)
      0x60, 0x00,  // PUSH1 0 (memory offset)
      0x37,        // CALLDATACOPY
      0x60, 0x00,  // PUSH1 0
      0x51,        // MLOAD
      0xf3         // RETURN
    ]);
    
    const evm = createEvm();
    const res = call(evm, { 
      bytecode,
      calldata
    });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    for (let i = 0; i < 32; i++) {
      expect(data[i]).toBe(i + 1);
    }
  });

  it('Copies code to memory', () => {
    // CODESIZE, PUSH 0, PUSH 0, CODECOPY, PUSH 0, MLOAD, RETURN
    const bytecode = new Uint8Array([
      0x60, 0x0c,  // PUSH1 12 (copy first 12 bytes)
      0x60, 0x00,  // PUSH1 0 (code offset)
      0x60, 0x00,  // PUSH1 0 (memory offset)
      0x39,        // CODECOPY
      0x60, 0x00,  // PUSH1 0
      0x51,        // MLOAD
      0xf3         // RETURN
    ]);
    
    const evm = createEvm();
    const res = call(evm, { bytecode });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    // Check first few bytes of code were copied
    expect(data[0]).toBe(0x60); // PUSH1
    expect(data[1]).toBe(0x0c); // 12
  });

  it('Combines multiple context values', () => {
    // ADDRESS, CALLER, ADD, CALLVALUE, ADD, RETURN
    const contractAddr = new Uint8Array(20);
    contractAddr[19] = 0x10;
    const callerAddr = new Uint8Array(20);
    callerAddr[19] = 0x20;
    
    const bytecode = new Uint8Array([
      0x30,  // ADDRESS
      0x33,  // CALLER
      0x01,  // ADD
      0x34,  // CALLVALUE
      0x01,  // ADD
      0xf3   // RETURN
    ]);
    
    const evm = createEvm();
    const res = call(evm, { 
      bytecode,
      to: contractAddr,
      caller: callerAddr,
      value: 100n
    });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const data = (res as ReturnData).data;
    const result = bytesToWord(data);
    expect(result).toBe(0x10n + 0x20n + 100n);
  });
});