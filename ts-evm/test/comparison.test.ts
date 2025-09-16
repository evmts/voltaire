import { describe, it, expect } from 'bun:test';
import { createFrame } from '../src/frame/frame';
import { createAddress } from '../src/types_blockchain';
import { createStack, stackPush, stackPop } from '../src/stack/stack';
import * as cmp from '../src/instructions/handlers_comparison';
import { fromSigned, u256 } from '../src/types';

function setupFrame() {
  const evm = {};
  const stopHandler = () => ({ data: new Uint8Array(0) });
  const schedule = {
    items: [
      { kind: 'handler' as const, handler: stopHandler, nextCursor: 1 },
      { kind: 'handler' as const, handler: stopHandler, nextCursor: -1 },
    ],
    entry: { handler: stopHandler, cursor: 0 },
  };
  return createFrame(
    evm,
    schedule,
    createAddress(),
    createAddress(),
    0n,
    new Uint8Array(),
    new Uint8Array(),
    30_000_000n
  );
}

describe('Comparison Handlers', () => {
  it('LT, GT, EQ basic cases', () => {
    const f = setupFrame();
    // LT: 1 < 2 => 1
    stackPush(f.stack, 1n);
    stackPush(f.stack, 2n);
    expect(cmp.LT(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(1n);
    // GT: 2 > 1 => 1
    stackPush(f.stack, 2n);
    stackPush(f.stack, 1n);
    expect(cmp.GT(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(1n);
    // EQ: 3 == 3 => 1
    stackPush(f.stack, 3n);
    stackPush(f.stack, 3n);
    expect(cmp.EQ(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(1n);
  });

  it('ISZERO', () => {
    const f = setupFrame();
    stackPush(f.stack, 0n);
    expect(cmp.ISZERO(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(1n);
    stackPush(f.stack, 5n);
    expect(cmp.ISZERO(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(0n);
  });

  it('SLT, SGT signed behavior', () => {
    const f = setupFrame();
    const neg5 = u256(-5n);
    const pos3 = 3n;
    // SLT: -5 < 3 => 1
    stackPush(f.stack, neg5);
    stackPush(f.stack, pos3);
    expect(cmp.SLT(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(1n);
    // SGT: -5 > 3 => 0
    stackPush(f.stack, neg5);
    stackPush(f.stack, pos3);
    expect(cmp.SGT(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(0n);
    // SLT: 5 < -3 => 0
    stackPush(f.stack, 5n);
    stackPush(f.stack, u256(-3n));
    expect(cmp.SLT(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(0n);
  });
});

