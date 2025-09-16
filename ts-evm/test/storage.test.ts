import { test, expect } from 'bun:test';
import { createStack } from '../src/stack/stack';
import { createMemory } from '../src/memory/memory';
import type { Frame } from '../src/frame/frame';
import { ConcreteEvm } from '../src/evm';
import { compile } from '../src/preprocessor/dispatch';
import { execute } from '../src/interpreter';
import { OPCODES } from '../src/opcodes/opcodes';

test('SSTORE and SLOAD: store and load value', () => {
  const bytecode = new Uint8Array([
    0x60, 0x00,       // PUSH1 0 (storage slot)
    0x60, 0x42,       // PUSH1 0x42 (value to store)
    OPCODES.SSTORE,   // Store 0x42 at slot 0
    0x60, 0x00,       // PUSH1 0 (storage slot)
    OPCODES.SLOAD,    // Load from slot 0
  ]);
  
  const evm = new ConcreteEvm({}, {});
  const schedule = compile(bytecode);
  if (schedule instanceof Error) {
    throw schedule;
  }
  
  const frame: Frame = {
    evm,
    stack: createStack(),
    memory: createMemory(),
    schedule,
    contractAddress: new Uint8Array(20),
    caller: new Uint8Array(20),
    value: 0n,
    calldata: new Uint8Array([]),
    code: bytecode,
    returndata: undefined,
    isStatic: false,
    depth: 0,
    gas: 1000000n,
  };
  
  // Check if methods exist
  expect(frame.evm.getStorageAt).toBeDefined();
  expect(frame.evm.setStorageAt).toBeDefined();
  
  const result = execute(frame, schedule.entry);
  expect(result).not.toBeInstanceOf(Error);
  
  // Debug: check what was stored
  const storedValue = frame.evm.getStorageAt(frame.contractAddress, 0n);
  console.log('Contract address:', frame.contractAddress);
  console.log('Stored value:', storedValue);
  console.log('Stack:', frame.stack.items);
  
  // Try storing directly
  frame.evm.setStorageAt(frame.contractAddress, 0n, 99n);
  const testValue = frame.evm.getStorageAt(frame.contractAddress, 0n);
  console.log('Test direct store/load:', testValue);
  
  expect(frame.stack.items).toEqual([0x42n]);
});

test('SLOAD: load from uninitialized slot returns 0', () => {
  const bytecode = new Uint8Array([
    0x60, 0x10,       // PUSH1 0x10 (storage slot)
    OPCODES.SLOAD,    // Load from slot 0x10 (uninitialized)
  ]);
  
  const evm = new ConcreteEvm({}, {});
  const schedule = compile(bytecode);
  if (schedule instanceof Error) {
    throw schedule;
  }
  
  const frame: Frame = {
    evm,
    stack: createStack(),
    memory: createMemory(),
    schedule,
    contractAddress: new Uint8Array(20),
    caller: new Uint8Array(20),
    value: 0n,
    calldata: new Uint8Array([]),
    code: bytecode,
    returndata: undefined,
    isStatic: false,
    depth: 0,
    gas: 1000000n,
  };
  
  const result = execute(frame, schedule.entry);
  expect(result).not.toBeInstanceOf(Error);
  expect(frame.stack.items).toEqual([0n]);
});

test('SSTORE: multiple stores to different slots', () => {
  const bytecode = new Uint8Array([
    // Store 0x11 at slot 0
    0x60, 0x11,       // PUSH1 0x11
    0x60, 0x00,       // PUSH1 0
    OPCODES.SSTORE,   // SSTORE
    
    // Store 0x22 at slot 1
    0x60, 0x22,       // PUSH1 0x22
    0x60, 0x01,       // PUSH1 1
    OPCODES.SSTORE,   // SSTORE
    
    // Load from slot 0
    0x60, 0x00,       // PUSH1 0
    OPCODES.SLOAD,    // SLOAD
    
    // Load from slot 1
    0x60, 0x01,       // PUSH1 1
    OPCODES.SLOAD,    // SLOAD
  ]);
  
  const evm = new ConcreteEvm({}, {});
  const schedule = compile(bytecode);
  if (schedule instanceof Error) {
    throw schedule;
  }
  
  const frame: Frame = {
    evm,
    stack: createStack(),
    memory: createMemory(),
    schedule,
    contractAddress: new Uint8Array(20),
    caller: new Uint8Array(20),
    value: 0n,
    calldata: new Uint8Array([]),
    code: bytecode,
    returndata: undefined,
    isStatic: false,
    depth: 0,
    gas: 1000000n,
  };
  
  const result = execute(frame, schedule.entry);
  expect(result).not.toBeInstanceOf(Error);
  expect(frame.stack.items).toEqual([0x11n, 0x22n]);
});

test('SSTORE: overwrite existing value', () => {
  const bytecode = new Uint8Array([
    // Store 0xFF at slot 0
    0x60, 0xFF,       // PUSH1 0xFF
    0x60, 0x00,       // PUSH1 0
    OPCODES.SSTORE,   // SSTORE
    
    // Store 0xAA at slot 0 (overwrite)
    0x60, 0xAA,       // PUSH1 0xAA
    0x60, 0x00,       // PUSH1 0
    OPCODES.SSTORE,   // SSTORE
    
    // Load from slot 0
    0x60, 0x00,       // PUSH1 0
    OPCODES.SLOAD,    // SLOAD
  ]);
  
  const evm = new ConcreteEvm({}, {});
  const schedule = compile(bytecode);
  if (schedule instanceof Error) {
    throw schedule;
  }
  
  const frame: Frame = {
    evm,
    stack: createStack(),
    memory: createMemory(),
    schedule,
    contractAddress: new Uint8Array(20),
    caller: new Uint8Array(20),
    value: 0n,
    calldata: new Uint8Array([]),
    code: bytecode,
    returndata: undefined,
    isStatic: false,
    depth: 0,
    gas: 1000000n,
  };
  
  const result = execute(frame, schedule.entry);
  expect(result).not.toBeInstanceOf(Error);
  expect(frame.stack.items).toEqual([0xAAn]);
});

test('SSTORE: fails in static call', () => {
  const bytecode = new Uint8Array([
    0x60, 0x42,       // PUSH1 0x42 (value to store)
    0x60, 0x00,       // PUSH1 0 (storage slot)
    OPCODES.SSTORE,   // Store (should fail in static context)
  ]);
  
  const evm = new ConcreteEvm({}, {});
  const schedule = compile(bytecode);
  if (schedule instanceof Error) {
    throw schedule;
  }
  
  const frame: Frame = {
    evm,
    stack: createStack(),
    memory: createMemory(),
    schedule,
    contractAddress: new Uint8Array(20),
    caller: new Uint8Array(20),
    value: 0n,
    calldata: new Uint8Array([]),
    code: bytecode,
    returndata: undefined,
    isStatic: true,  // Static call context
    depth: 0,
    gas: 1000000n,
  };
  
  const result = execute(frame, schedule.entry);
  expect(result).toBeInstanceOf(Error);
  expect(result.message).toContain('static call');
});