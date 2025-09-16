import { test, expect } from 'bun:test';
import { createStack } from '../src/stack/stack';
import { createMemory } from '../src/memory/memory';
import type { Frame } from '../src/frame/frame';
import { ConcreteEvm } from '../src/evm';
import { compile } from '../src/preprocessor/dispatch';
import { execute } from '../src/interpreter';
import { OPCODES } from '../src/opcodes/opcodes';
import { keccak256 } from 'js-sha3';

test('KECCAK256: hash empty data', () => {
  const bytecode = new Uint8Array([
    0x60, 0x00,         // PUSH1 0 (offset)
    0x60, 0x00,         // PUSH1 0 (length)
    OPCODES.KECCAK256,  // KECCAK256
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
  
  // Expected hash of empty data
  const expectedHash = '0x' + keccak256.hex('');
  const actualHash = '0x' + frame.stack.items[0].toString(16).padStart(64, '0');
  expect(actualHash).toBe(expectedHash);
});

test('KECCAK256: hash single byte', () => {
  const bytecode = new Uint8Array([
    0x60, 0x00,         // PUSH1 0 (memory offset)
    0x60, 0x42,         // PUSH1 0x42 (value)
    OPCODES.MSTORE8,    // MSTORE8 - store 0x42 at memory[0]
    0x60, 0x00,         // PUSH1 0 (offset)
    0x60, 0x01,         // PUSH1 1 (length)
    OPCODES.KECCAK256,  // KECCAK256
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
  
  // Check memory was written
  const memData = frame.memory.buffer.slice(0, 1);
  expect(memData[0]).toBe(0x42);
  
  // Expected hash of single byte 0x42
  const expectedHash = '0x' + keccak256.hex(new Uint8Array([0x42]));
  const actualHash = '0x' + frame.stack.items[0].toString(16).padStart(64, '0');
  expect(actualHash).toBe(expectedHash);
});

test('KECCAK256: hash 32 bytes', () => {
  const bytecode = new Uint8Array([
    // Store 32 bytes of 0xFF in memory
    0x7f, // PUSH32
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0x60, 0x00,         // PUSH1 0 (memory offset)
    OPCODES.MSTORE,     // MSTORE
    0x60, 0x00,         // PUSH1 0 (offset)
    0x60, 0x20,         // PUSH1 32 (length)
    OPCODES.KECCAK256,  // KECCAK256
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
  
  // Expected hash of 32 bytes of 0xFF
  const data = new Uint8Array(32).fill(0xff);
  const expectedHash = '0x' + keccak256.hex(data);
  const actualHash = '0x' + frame.stack.items[0].toString(16).padStart(64, '0');
  expect(actualHash).toBe(expectedHash);
});