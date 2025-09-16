import { describe, it, expect } from 'bun:test';
import { createFrame } from '../src/frame/frame';
import { createAddress } from '../src/types_blockchain';
import { createStack, stackPush, stackPop } from '../src/stack/stack';
import * as bitwise from '../src/instructions/handlers_bitwise';
import { u256, Word } from '../src/types';

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

describe('Bitwise Handlers', () => {
  it('AND/OR/XOR/NOT basic behavior', () => {
    const f = setupFrame();
    // AND
    stackPush(f.stack, 0xffn);
    stackPush(f.stack, 0x0fn);
    expect(bitwise.AND(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(0x0fn);

    // OR
    stackPush(f.stack, 0xf0n);
    stackPush(f.stack, 0x0fn);
    expect(bitwise.OR(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(0xffn);

    // XOR
    stackPush(f.stack, 0xf0n);
    stackPush(f.stack, 0x0fn);
    expect(bitwise.XOR(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(0xffn);

    // NOT
    stackPush(f.stack, 0n);
    expect(bitwise.NOT(f, 0)).toHaveProperty('next');
    const not0 = stackPop(f.stack) as Word;
    expect(not0).toBe(u256(-1n));
  });

  it('BYTE indexing and bounds', () => {
    const f = setupFrame();
    // Value: 0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f
    let v: Word = 0n;
    for (let i = 1; i <= 32; i++) v = (v << 8n) | BigInt(i);
    // BYTE 0 => most significant (0x01)
    stackPush(f.stack, v);
    stackPush(f.stack, 0n);
    expect(bitwise.BYTE(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(0x01n);
    // BYTE 31 => least significant (0x20)
    stackPush(f.stack, v);
    stackPush(f.stack, 31n);
    expect(bitwise.BYTE(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(32n);
    // BYTE >= 32 => 0
    stackPush(f.stack, v);
    stackPush(f.stack, 32n);
    expect(bitwise.BYTE(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(0n);
  });

  it('SHL/SHR with large shift counts', () => {
    const f = setupFrame();
    // SHL >=256 => 0
    stackPush(f.stack, 1n);
    stackPush(f.stack, 256n);
    expect(bitwise.SHL(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(0n);
    // SHR >=256 => 0
    stackPush(f.stack, 0xffffn);
    stackPush(f.stack, 512n);
    expect(bitwise.SHR(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(0n);
  });

  it('SAR sign-propagating shift and >=256 behavior', () => {
    const f = setupFrame();
    // Negative value (sign bit set): 1 << 255
    const neg = 1n << 255n;
    // SAR >=256 => all ones if negative, else 0
    stackPush(f.stack, neg);
    stackPush(f.stack, 300n);
    expect(bitwise.SAR(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(u256(-1n));
    // Positive value => 0
    stackPush(f.stack, 123n);
    stackPush(f.stack, 300n);
    expect(bitwise.SAR(f, 0)).toHaveProperty('next');
    expect(stackPop(f.stack)).toBe(0n);
    // Regular SAR small shift
    stackPush(f.stack, neg);
    stackPush(f.stack, 1n);
    expect(bitwise.SAR(f, 0)).toHaveProperty('next');
    const res = stackPop(f.stack) as Word;
    // Should remain negative after shifting
    expect((res & (1n << 255n)) !== 0n).toBeTrue();
  });
});

