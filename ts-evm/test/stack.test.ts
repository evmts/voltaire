import { describe, it, expect } from 'bun:test';
import { 
  createStack, 
  stackPush, 
  stackPop, 
  stackPeek, 
  stackSetTop, 
  stackDup, 
  stackSwap,
  stackSize 
} from '../src/stack/stack';
import { StackOverflowError, StackUnderflowError } from '../src/errors';

describe('Stack', () => {
  it('push/pop basics', () => {
    const s = createStack();
    expect(stackPush(s, 1n)).toBeUndefined();
    expect(stackPush(s, 2n)).toBeUndefined();
    expect(stackSize(s)).toBe(2);
    expect(stackPop(s)).toBe(2n);
    expect(stackPop(s)).toBe(1n);
    expect(stackSize(s)).toBe(0);
  });

  it('underflow on empty stack', () => {
    const s = createStack();
    expect(stackPop(s)).toBeInstanceOf(StackUnderflowError);
    expect(stackPeek(s)).toBeInstanceOf(StackUnderflowError);
    expect(stackSetTop(s, 100n)).toBeInstanceOf(StackUnderflowError);
  });

  it('overflow at limit', () => {
    const s = createStack(2);
    expect(stackPush(s, 1n)).toBeUndefined();
    expect(stackPush(s, 2n)).toBeUndefined();
    expect(stackPush(s, 3n)).toBeInstanceOf(StackOverflowError);
  });

  it('peek at various depths', () => {
    const s = createStack();
    stackPush(s, 10n);
    stackPush(s, 20n);
    stackPush(s, 30n);
    expect(stackPeek(s, 0)).toBe(30n); // top
    expect(stackPeek(s, 1)).toBe(20n); // second from top
    expect(stackPeek(s, 2)).toBe(10n); // third from top
    expect(stackPeek(s, 3)).toBeInstanceOf(StackUnderflowError);
  });

  it('setTop modifies top of stack', () => {
    const s = createStack();
    stackPush(s, 10n);
    stackPush(s, 20n);
    expect(stackSetTop(s, 99n)).toBeUndefined();
    expect(stackPeek(s, 0)).toBe(99n);
    expect(stackPeek(s, 1)).toBe(10n);
  });

  it('dup duplicates nth item from top', () => {
    const s = createStack();
    stackPush(s, 10n);
    stackPush(s, 20n);
    stackPush(s, 30n);
    // DUP1 duplicates top (30n)
    expect(stackDup(s, 1)).toBeUndefined();
    expect(stackSize(s)).toBe(4);
    expect(stackPeek(s, 0)).toBe(30n);
    expect(stackPeek(s, 1)).toBe(30n);
    // DUP3 duplicates third from top (10n)
    expect(stackDup(s, 3)).toBeUndefined();
    expect(stackSize(s)).toBe(5);
    expect(stackPeek(s, 0)).toBe(20n); // pushed 20n (was second from top)
  });

  it('dup underflow when accessing beyond stack', () => {
    const s = createStack();
    stackPush(s, 10n);
    expect(stackDup(s, 2)).toBeInstanceOf(StackUnderflowError); // trying to dup item that doesn't exist
  });

  it('dup overflow when stack is full', () => {
    const s = createStack(2);
    stackPush(s, 10n);
    stackPush(s, 20n);
    expect(stackDup(s, 1)).toBeInstanceOf(StackOverflowError);
  });

  it('swap swaps top with nth from top', () => {
    const s = createStack();
    stackPush(s, 10n);
    stackPush(s, 20n);
    stackPush(s, 30n);
    stackPush(s, 40n);
    // SWAP1 swaps top(40) with second(30)
    expect(stackSwap(s, 1)).toBeUndefined();
    expect(stackPeek(s, 0)).toBe(30n);
    expect(stackPeek(s, 1)).toBe(40n);
    expect(stackPeek(s, 2)).toBe(20n);
    // SWAP3 swaps top(30) with fourth(10)
    expect(stackSwap(s, 3)).toBeUndefined();
    expect(stackPeek(s, 0)).toBe(10n);
    expect(stackPeek(s, 3)).toBe(30n);
  });

  it('swap underflow when accessing beyond stack', () => {
    const s = createStack();
    stackPush(s, 10n);
    expect(stackSwap(s, 1)).toBeInstanceOf(StackUnderflowError); // trying to swap with item that doesn't exist
    expect(stackSwap(s, 2)).toBeInstanceOf(StackUnderflowError);
  });

  it('handles 256-bit values correctly', () => {
    const s = createStack();
    const max256 = (1n << 256n) - 1n;
    const large = 0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678n;
    
    expect(stackPush(s, max256)).toBeUndefined();
    expect(stackPush(s, large)).toBeUndefined();
    expect(stackPop(s)).toBe(large);
    expect(stackPop(s)).toBe(max256);
  });

  it('DUP1 through DUP16 bounds', () => {
    const s = createStack(20);
    // Push 16 items
    for (let i = 1; i <= 16; i++) {
      stackPush(s, BigInt(i));
    }
    // DUP16 should duplicate the bottom item (1)
    expect(stackDup(s, 16)).toBeUndefined();
    expect(stackPeek(s, 0)).toBe(1n);
    expect(stackSize(s)).toBe(17);
  });

  it('SWAP1 through SWAP16 bounds', () => {
    const s = createStack(20);
    // Push 17 items (need n+1 for SWAPn)
    for (let i = 1; i <= 17; i++) {
      stackPush(s, BigInt(i));
    }
    // SWAP16 should swap top (17) with 16th from top (1)
    expect(stackSwap(s, 16)).toBeUndefined();
    expect(stackPeek(s, 0)).toBe(1n);
    expect(stackPeek(s, 16)).toBe(17n);
  });
});