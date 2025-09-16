import { describe, it, expect } from 'bun:test';
import { createStack, stackPush, stackPop } from '../src/stack/stack';
import { createFrame } from '../src/frame/frame';
import { createAddress } from '../src/types_blockchain';
import { u256 } from '../src/types';
import * as arith from '../src/instructions/handlers_arithmetic';

describe('Arithmetic Handlers', () => {
  function setupFrame() {
    const evm = {};
    const stopHandler = () => ({ data: new Uint8Array(0) });
    const schedule = { 
      items: [
        { kind: 'handler' as const, handler: stopHandler, nextCursor: 1 },
        { kind: 'handler' as const, handler: stopHandler, nextCursor: -1 }
      ], 
      entry: { handler: stopHandler, cursor: 0 } 
    };
    const frame = createFrame(
      evm, 
      schedule,
      createAddress(),
      createAddress(),
      0n,
      new Uint8Array(),
      new Uint8Array(),
      30_000_000n
    );
    return frame;
  }

  it('ADD wraps on overflow', () => {
    const f = setupFrame();
    const max = (1n << 256n) - 1n;
    stackPush(f.stack, max);
    stackPush(f.stack, 2n);
    
    const result = arith.ADD(f, 0);
    expect(result).toHaveProperty('next');
    
    expect(stackPop(f.stack)).toBe(1n); // max + 2 wraps to 1
  });

  it('SUB wraps on underflow', () => {
    const f = setupFrame();
    stackPush(f.stack, 3n);
    stackPush(f.stack, 5n);
    
    const result = arith.SUB(f, 0);
    expect(result).toHaveProperty('next');
    
    const val = stackPop(f.stack);
    expect(val).toBe(u256(-2n)); // 3 - 5 = -2 wrapped
  });

  it('MUL handles multiplication', () => {
    const f = setupFrame();
    stackPush(f.stack, 7n);
    stackPush(f.stack, 9n);
    
    const result = arith.MUL(f, 0);
    expect(result).toHaveProperty('next');
    
    expect(stackPop(f.stack)).toBe(63n);
  });

  it('DIV handles division by zero', () => {
    const f = setupFrame();
    stackPush(f.stack, 10n);
    stackPush(f.stack, 0n);
    
    const result = arith.DIV(f, 0);
    expect(result).toHaveProperty('next');
    
    expect(stackPop(f.stack)).toBe(0n); // EVM spec: x/0 = 0
  });

  it('DIV performs integer division', () => {
    const f = setupFrame();
    stackPush(f.stack, 10n);
    stackPush(f.stack, 3n);
    
    const result = arith.DIV(f, 0);
    expect(result).toHaveProperty('next');
    
    expect(stackPop(f.stack)).toBe(3n); // 10/3 = 3 (truncated)
  });

  it('SDIV handles signed division', () => {
    const f = setupFrame();
    const neg10 = u256(-10n);
    stackPush(f.stack, neg10);
    stackPush(f.stack, 3n);
    
    const result = arith.SDIV(f, 0);
    expect(result).toHaveProperty('next');
    
    const res = stackPop(f.stack);
    expect(res).toBe(u256(-3n)); // -10/3 = -3
  });

  it('SDIV handles division by zero', () => {
    const f = setupFrame();
    stackPush(f.stack, u256(-10n));
    stackPush(f.stack, 0n);
    
    const result = arith.SDIV(f, 0);
    expect(result).toHaveProperty('next');
    
    expect(stackPop(f.stack)).toBe(0n);
  });

  it('MOD handles modulo', () => {
    const f = setupFrame();
    stackPush(f.stack, 10n);
    stackPush(f.stack, 3n);
    
    const result = arith.MOD(f, 0);
    expect(result).toHaveProperty('next');
    
    expect(stackPop(f.stack)).toBe(1n); // 10 % 3 = 1
  });

  it('MOD handles modulo by zero', () => {
    const f = setupFrame();
    stackPush(f.stack, 10n);
    stackPush(f.stack, 0n);
    
    const result = arith.MOD(f, 0);
    expect(result).toHaveProperty('next');
    
    expect(stackPop(f.stack)).toBe(0n); // x % 0 = 0
  });

  it('SMOD handles signed modulo', () => {
    const f = setupFrame();
    stackPush(f.stack, u256(-10n));
    stackPush(f.stack, 3n);
    
    const result = arith.SMOD(f, 0);
    expect(result).toHaveProperty('next');
    
    const res = stackPop(f.stack);
    expect(res).toBe(u256(-1n)); // -10 % 3 = -1 (sign follows dividend)
  });

  it('ADDMOD handles modular addition', () => {
    const f = setupFrame();
    stackPush(f.stack, 10n);
    stackPush(f.stack, 15n);
    stackPush(f.stack, 8n);
    
    const result = arith.ADDMOD(f, 0);
    expect(result).toHaveProperty('next');
    
    expect(stackPop(f.stack)).toBe(1n); // (10 + 15) % 8 = 25 % 8 = 1
  });

  it('ADDMOD handles modulo by zero', () => {
    const f = setupFrame();
    stackPush(f.stack, 10n);
    stackPush(f.stack, 15n);
    stackPush(f.stack, 0n);
    
    const result = arith.ADDMOD(f, 0);
    expect(result).toHaveProperty('next');
    
    expect(stackPop(f.stack)).toBe(0n);
  });

  it('MULMOD handles modular multiplication', () => {
    const f = setupFrame();
    stackPush(f.stack, 10n);
    stackPush(f.stack, 3n);
    stackPush(f.stack, 7n);
    
    const result = arith.MULMOD(f, 0);
    expect(result).toHaveProperty('next');
    
    expect(stackPop(f.stack)).toBe(2n); // (10 * 3) % 7 = 30 % 7 = 2
  });

  it('MULMOD handles large numbers without overflow', () => {
    const f = setupFrame();
    const large = (1n << 255n);
    stackPush(f.stack, large);
    stackPush(f.stack, 2n);
    stackPush(f.stack, 10n);
    
    const result = arith.MULMOD(f, 0);
    expect(result).toHaveProperty('next');
    
    const res = stackPop(f.stack);
    expect(res).toBe((large * 2n) % 10n); // Should handle without overflow
  });
});