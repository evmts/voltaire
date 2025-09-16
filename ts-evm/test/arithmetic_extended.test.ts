import { test, expect } from 'bun:test';
import { createStack } from '../src/stack/stack';
import { createMemory } from '../src/memory/memory';
import type { Frame } from '../src/frame/frame';
import { ConcreteEvm } from '../src/evm';
import { compile } from '../src/preprocessor/dispatch';
import { execute } from '../src/interpreter';
import { OPCODES } from '../src/opcodes/opcodes';

// Helper to create a test frame
function createTestFrame(): Frame {
  const evm = new ConcreteEvm({
    number: 100n,
    timestamp: 1000n,
    gasLimit: 10000000n,
    coinbase: new Uint8Array(20),
    difficulty: 0n,
    chainId: 1n,
    baseFee: 10n,
  }, {
    origin: new Uint8Array(20),
    gasPrice: 20n,
  });
  
  const schedule = compile(new Uint8Array([]));
  
  return {
    evm,
    stack: createStack(),
    memory: createMemory(),
    schedule,
    contractAddress: new Uint8Array(20),
    caller: new Uint8Array(20),
    value: 0n,
    calldata: new Uint8Array([]),
    code: new Uint8Array([]),
    returndata: undefined,
    isStatic: false,
    depth: 0,
    gas: 1000000n,
  };
}

test('EXP: basic exponentiation', () => {
  const bytecode = new Uint8Array([
    0x60, 0x02,  // PUSH1 2 (base)
    0x60, 0x08,  // PUSH1 8 (exponent)
    OPCODES.EXP, // 2^8 = 256
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
  expect(frame.stack.items).toEqual([256n]);
});

test('EXP: zero base', () => {
  const bytecode = new Uint8Array([
    0x60, 0x00,  // PUSH1 0 (base)
    0x60, 0x05,  // PUSH1 5 (exponent)
    OPCODES.EXP, // 0^5 = 0
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

test('EXP: zero exponent', () => {
  const bytecode = new Uint8Array([
    0x60, 0x10,  // PUSH1 16 (base)
    0x60, 0x00,  // PUSH1 0 (exponent)
    OPCODES.EXP, // 16^0 = 1
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
  expect(frame.stack.items).toEqual([1n]);
});

test('SIGNEXTEND: extend positive byte', () => {
  const bytecode = new Uint8Array([
    0x60, 0x7F,  // PUSH1 0x7F (positive value, MSB=0)
    0x60, 0x00,  // PUSH1 0 (extend from byte 0)
    OPCODES.SIGNEXTEND, // Sign extend
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
  expect(frame.stack.items).toEqual([0x7Fn]); // Stays positive
});

test('SIGNEXTEND: extend negative byte', () => {
  const bytecode = new Uint8Array([
    0x60, 0xFF,  // PUSH1 0xFF (negative value, MSB=1)
    0x60, 0x00,  // PUSH1 0 (extend from byte 0)
    OPCODES.SIGNEXTEND, // Sign extend
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
  // 0xFF sign extended should have all upper bits set
  const expected = (1n << 256n) - 1n; // All bits set (0xFFFF...FFFF)
  expect(frame.stack.items).toEqual([expected]);
});

test('PUSH0: pushes zero', () => {
  const bytecode = new Uint8Array([
    OPCODES.PUSH0,  // PUSH0
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

test('PUSH0: multiple pushes', () => {
  const bytecode = new Uint8Array([
    OPCODES.PUSH0,  // PUSH0
    OPCODES.PUSH0,  // PUSH0
    OPCODES.PUSH0,  // PUSH0
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
  expect(frame.stack.items).toEqual([0n, 0n, 0n]);
});