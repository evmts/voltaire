import { test, expect } from 'bun:test';
import { createStack } from '../src/stack/stack';
import { createMemory } from '../src/memory/memory';
import type { Frame } from '../src/frame/frame';
import { ConcreteEvm } from '../src/evm';
import { compile } from '../src/preprocessor/dispatch';
import { execute } from '../src/interpreter';
import { OPCODES } from '../src/opcodes/opcodes';

test('JUMP: simple forward jump', () => {
  const bytecode = new Uint8Array([
    0x60, 0x04,       // PUSH1 4 (jump destination)
    OPCODES.JUMP,     // JUMP
    0x00,             // Should be skipped
    OPCODES.JUMPDEST, // PC=4: Jump destination
    0x60, 0x42,       // PUSH1 0x42
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
  expect(frame.stack.items).toEqual([0x42n]);
});

test('JUMPI: conditional jump taken', () => {
  const bytecode = new Uint8Array([
    0x60, 0x06,       // PUSH1 6 (jump destination)  
    0x60, 0x01,       // PUSH1 1 (condition: true)
    OPCODES.JUMPI,    // JUMPI
    0x00,             // Should be skipped
    OPCODES.JUMPDEST, // PC=6: Jump destination
    0x60, 0x42,       // PUSH1 0x42
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
  expect(frame.stack.items).toEqual([0x42n]);
});

test('JUMPI: conditional jump not taken', () => {
  const bytecode = new Uint8Array([
    0x60, 0x08,       // PUSH1 8 (jump destination)
    0x60, 0x00,       // PUSH1 0 (condition: false)
    OPCODES.JUMPI,    // JUMPI
    0x60, 0x99,       // PUSH1 0x99 (should execute)
    OPCODES.STOP,     // STOP
    0x00,             // Padding
    0x00,             // Padding
    0x00,             // Padding
    OPCODES.JUMPDEST, // PC=8: Jump destination (should not reach)
    0x60, 0x42,       // PUSH1 0x42
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
  expect(frame.stack.items).toEqual([0x99n]); // Should have 0x99, not 0x42
});

test('JUMP: invalid jump destination (no JUMPDEST)', () => {
  const bytecode = new Uint8Array([
    0x60, 0x03,       // PUSH1 3 (invalid jump destination - not a JUMPDEST)
    OPCODES.JUMP,     // JUMP
    0x60, 0x42,       // PUSH1 0x42 (not a JUMPDEST)
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
  expect(result).toBeInstanceOf(Error);
  expect(result._tag).toBe('InvalidJumpError');
});

test('JUMPDEST: acts as no-op', () => {
  const bytecode = new Uint8Array([
    0x60, 0x11,       // PUSH1 0x11
    OPCODES.JUMPDEST, // JUMPDEST (no-op)
    0x60, 0x22,       // PUSH1 0x22
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