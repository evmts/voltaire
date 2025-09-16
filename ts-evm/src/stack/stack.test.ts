import { test, expect, describe } from 'bun:test';
import {
  createStack,
  stackSize,
  stackPush,
  stackPushUnsafe,
  stackPop,
  stackPopUnsafe,
  stackPeek,
  stackPeekUnsafe,
  stackSetTop,
  stackSetTopUnsafe,
  stackBinaryOpUnsafe,
  stackDupN,
  stackDupNUnsafe,
  stackDup1,
  stackDup2,
  stackDup3,
  stackDup4,
  stackDup5,
  stackDup6,
  stackDup7,
  stackDup8,
  stackDup9,
  stackDup10,
  stackDup11,
  stackDup12,
  stackDup13,
  stackDup14,
  stackDup15,
  stackDup16,
  stackSwapN,
  stackSwapNUnsafe,
  stackSwap1,
  stackSwap2,
  stackSwap3,
  stackSwap4,
  stackSwap5,
  stackSwap6,
  stackSwap7,
  stackSwap8,
  stackSwap9,
  stackSwap10,
  stackSwap11,
  stackSwap12,
  stackSwap13,
  stackSwap14,
  stackSwap15,
  stackSwap16,
  stackGetSlice,
} from './stack';
import { StackOverflowError, StackUnderflowError } from '../errors';

describe('Stack', () => {
  describe('push and push_unsafe', () => {
    test('push_unsafe adds items', () => {
      const stack = createStack();
      
      stackPushUnsafe(stack, 42n);
      expect(stackSize(stack)).toBe(1);
      expect(stackPeekUnsafe(stack)).toBe(42n);
      
      stackPushUnsafe(stack, 100n);
      expect(stackSize(stack)).toBe(2);
      expect(stackPeekUnsafe(stack)).toBe(100n);
    });

    test('push with overflow check', () => {
      const stack = createStack(3);
      
      expect(stackPush(stack, 1n)).toBeUndefined();
      expect(stackPush(stack, 2n)).toBeUndefined();
      expect(stackPush(stack, 3n)).toBeUndefined();
      expect(stackSize(stack)).toBe(3);
      
      const result = stackPush(stack, 4n);
      expect(result).toBeInstanceOf(StackOverflowError);
    });
  });

  describe('pop and pop_unsafe', () => {
    test('pop_unsafe removes and returns items', () => {
      const stack = createStack();
      
      stackPush(stack, 10n);
      stackPush(stack, 20n);
      stackPush(stack, 30n);
      expect(stackSize(stack)).toBe(3);
      
      const val1 = stackPopUnsafe(stack);
      expect(val1).toBe(30n);
      expect(stackSize(stack)).toBe(2);
      
      const val2 = stackPopUnsafe(stack);
      expect(val2).toBe(20n);
      expect(stackSize(stack)).toBe(1);
    });

    test('pop with underflow check', () => {
      const stack = createStack();
      
      stackPush(stack, 10n);
      const val = stackPop(stack);
      expect(val).toBe(10n);
      expect(stackSize(stack)).toBe(0);
      
      const result = stackPop(stack);
      expect(result).toBeInstanceOf(StackUnderflowError);
    });
  });

  describe('set_top and set_top_unsafe', () => {
    test('set_top_unsafe modifies top value', () => {
      const stack = createStack();
      
      stackPush(stack, 10n);
      stackPush(stack, 20n);
      stackPush(stack, 30n);
      expect(stackSize(stack)).toBe(3);
      
      stackSetTopUnsafe(stack, 99n);
      expect(stackPeekUnsafe(stack)).toBe(99n);
      expect(stackSize(stack)).toBe(3);
    });

    test('set_top with error check on empty stack', () => {
      const stack = createStack();
      
      const result = stackSetTop(stack, 42n);
      expect(result).toBeInstanceOf(StackUnderflowError);
      
      stackPush(stack, 100n);
      stackPush(stack, 200n);
      const setResult = stackSetTop(stack, 55n);
      expect(setResult).toBeUndefined();
      const peekResult = stackPeek(stack);
      expect(peekResult).toBe(55n);
    });
  });

  describe('peek and peek_unsafe', () => {
    test('peek_unsafe returns top value without modifying size', () => {
      const stack = createStack();
      
      stackPush(stack, 100n);
      stackPush(stack, 200n);
      stackPush(stack, 300n);
      expect(stackSize(stack)).toBe(3);
      
      const top_unsafe = stackPeekUnsafe(stack);
      expect(top_unsafe).toBe(300n);
      expect(stackSize(stack)).toBe(3);
    });

    test('peek on non-empty and empty stack', () => {
      const stack = createStack();
      
      stackPush(stack, 100n);
      stackPush(stack, 200n);
      stackPush(stack, 300n);
      
      const top = stackPeek(stack);
      expect(top).toBe(300n);
      expect(stackSize(stack)).toBe(3);
      
      stackPop(stack);
      stackPop(stack);
      stackPop(stack);
      
      const result = stackPeek(stack);
      expect(result).toBeInstanceOf(StackUnderflowError);
    });
  });

  describe('binary operations', () => {
    test('binary_op_unsafe performs operation on top two items', () => {
      const stack = createStack();
      
      stackPush(stack, 10n);
      stackPush(stack, 20n);
      
      stackBinaryOpUnsafe(stack, (a, b) => a + b);
      expect(stackSize(stack)).toBe(1);
      expect(stackPeekUnsafe(stack)).toBe(30n);
    });
  });

  describe('DUP operations', () => {
    test('dup1 duplicates top stack item', () => {
      const stack = createStack();
      
      stackPush(stack, 42n);
      expect(stackSize(stack)).toBe(1);
      
      const result = stackDup1(stack);
      expect(result).toBeUndefined();
      expect(stackSize(stack)).toBe(2);
      
      const slice = stackGetSlice(stack);
      expect(slice[0]).toBe(42n);
      expect(slice[1]).toBe(42n);
    });

    test('dup16 duplicates 16th stack item', () => {
      const stack = createStack();
      
      for (let i = 1; i <= 16; i++) {
        stackPush(stack, BigInt(i));
      }
      expect(stackSize(stack)).toBe(16);
      
      const result = stackDup16(stack);
      expect(result).toBeUndefined();
      expect(stackSize(stack)).toBe(17);
      
      const slice = stackGetSlice(stack);
      expect(slice[0]).toBe(1n);
      expect(slice[16]).toBe(1n);
    });

    test('dup_n_unsafe performs without checks', () => {
      const stack = createStack();
      
      stackPush(stack, 10n);
      stackPush(stack, 20n);
      stackPush(stack, 30n);
      
      stackDupNUnsafe(stack, 2);
      expect(stackSize(stack)).toBe(4);
      expect(stackPeekUnsafe(stack)).toBe(20n);
    });

    test('dup with underflow error', () => {
      const stack = createStack();
      
      stackPush(stack, 1n);
      stackPush(stack, 2n);
      
      const result = stackDupN(stack, 3);
      expect(result).toBeInstanceOf(StackUnderflowError);
    });

    test('dup with overflow error', () => {
      const stack = createStack(2);
      
      stackPush(stack, 1n);
      stackPush(stack, 2n);
      
      const result = stackDup1(stack);
      expect(result).toBeInstanceOf(StackOverflowError);
    });
  });

  describe('SWAP operations', () => {
    test('swap1 swaps top two stack items', () => {
      const stack = createStack();
      
      stackPush(stack, 10n);
      stackPush(stack, 20n);
      expect(stackSize(stack)).toBe(2);
      
      const result = stackSwap1(stack);
      expect(result).toBeUndefined();
      expect(stackSize(stack)).toBe(2);
      
      const slice = stackGetSlice(stack);
      expect(slice[0]).toBe(20n);
      expect(slice[1]).toBe(10n);
    });

    test('swap16 swaps top with 17th stack item', () => {
      const stack = createStack();
      
      for (let i = 1; i <= 17; i++) {
        stackPush(stack, BigInt(i));
      }
      expect(stackSize(stack)).toBe(17);
      
      const result = stackSwap16(stack);
      expect(result).toBeUndefined();
      expect(stackSize(stack)).toBe(17);
      
      const slice = stackGetSlice(stack);
      expect(slice[0]).toBe(17n);
      expect(slice[16]).toBe(1n);
    });

    test('swap_n_unsafe performs without checks', () => {
      const stack = createStack();
      
      stackPush(stack, 10n);
      stackPush(stack, 20n);
      stackPush(stack, 30n);
      stackPush(stack, 40n);
      
      stackSwapNUnsafe(stack, 2);
      
      const slice = stackGetSlice(stack);
      expect(slice[1]).toBe(40n);
      expect(slice[3]).toBe(20n);
    });

    test('swap with underflow error', () => {
      const stack = createStack();
      
      stackPush(stack, 1n);
      stackPush(stack, 2n);
      
      const result = stackSwapN(stack, 3);
      expect(result).toBeInstanceOf(StackUnderflowError);
    });
  });

  describe('All DUP operations DUP1-DUP16', () => {
    test('each DUP operation with minimum required items', () => {
      for (let dupN = 1; dupN <= 16; dupN++) {
        const stack = createStack(32);
        
        // Push exactly dupN items
        for (let i = 1; i <= dupN; i++) {
          stackPush(stack, BigInt(i * 100));
        }
        
        const initialCount = stackSize(stack);
        const result = stackDupN(stack, dupN);
        
        expect(result).toBeUndefined();
        expect(stackSize(stack)).toBe(initialCount + 1);
        
        // Top item should be the dupN'th item from before (first item pushed)
        const peekResult = stackPeek(stack);
        expect(peekResult).toBe(100n);
        
        // Test underflow
        stackPop(stack); // Remove the duplicate
        stackPop(stack); // Remove one original item
        
        const underflowResult = stackDupN(stack, dupN);
        expect(underflowResult).toBeInstanceOf(StackUnderflowError);
      }
    });
  });

  describe('All SWAP operations SWAP1-SWAP16', () => {
    test('each SWAP operation with minimum required items', () => {
      for (let swapN = 1; swapN <= 16; swapN++) {
        const stack = createStack(32);
        
        // Push exactly swapN + 1 items (SWAP needs n+1 items)
        for (let i = 1; i <= swapN + 1; i++) {
          stackPush(stack, BigInt(i * 100));
        }
        
        const topValue = stackPeek(stack) as bigint;
        const sliceBefore = stackGetSlice(stack);
        const targetValue = sliceBefore[sliceBefore.length - swapN - 1];
        
        const initialCount = stackSize(stack);
        const result = stackSwapN(stack, swapN);
        
        expect(result).toBeUndefined();
        expect(stackSize(stack)).toBe(initialCount);
        
        // Top should now have the target value
        const newTop = stackPeek(stack);
        expect(newTop).toBe(targetValue);
        
        // Target position should have the original top value
        const sliceAfter = stackGetSlice(stack);
        expect(sliceAfter[sliceAfter.length - swapN - 1]).toBe(topValue);
        
        // Test underflow
        stackPop(stack);
        const underflowResult = stackSwapN(stack, swapN);
        expect(underflowResult).toBeInstanceOf(StackUnderflowError);
      }
    });
  });

  describe('Complex operation sequences at boundaries', () => {
    test('push → dup → swap → pop at boundaries', () => {
      const stack = createStack(8);
      
      // Fill to near capacity
      stackPush(stack, 100n);
      stackPush(stack, 200n);
      stackPush(stack, 300n);
      stackPush(stack, 400n);
      stackPush(stack, 500n);
      stackPush(stack, 600n);
      stackPush(stack, 700n);
      
      // DUP1 should work (brings to 8, at capacity)
      const dupResult = stackDup1(stack);
      expect(dupResult).toBeUndefined();
      expect(stackSize(stack)).toBe(8);
      const peekResult1 = stackPeek(stack);
      expect(peekResult1).toBe(700n);
      
      // Any push should fail now
      const overflowResult1 = stackPush(stack, 999n);
      expect(overflowResult1).toBeInstanceOf(StackOverflowError);
      const overflowResult2 = stackDup1(stack);
      expect(overflowResult2).toBeInstanceOf(StackOverflowError);
      
      // SWAP should work (doesn't change count)
      const swapResult = stackSwap1(stack);
      expect(swapResult).toBeUndefined();
      expect(stackSize(stack)).toBe(8);
      const peekResult2 = stackPeek(stack);
      expect(peekResult2).toBe(700n);
      
      // Pop and continue sequence
      const val1 = stackPop(stack) as bigint;
      expect(val1).toBe(700n);
      
      const val2 = stackPop(stack) as bigint;
      expect(val2).toBe(700n);
      
      // Now we have 6 items
      const preDup = stackGetSlice(stack);
      expect(preDup.length).toBe(6);
      expect(preDup[5]).toBe(600n);
      expect(preDup[4]).toBe(500n);
      expect(preDup[3]).toBe(400n);
      
      const dup3Result = stackDupN(stack, 3);
      expect(dup3Result).toBeUndefined();
      const peekResult3 = stackPeek(stack);
      expect(peekResult3).toBe(400n);
      
      const swap2Result = stackSwapN(stack, 2);
      expect(swap2Result).toBeUndefined();
      const slice = stackGetSlice(stack);
      expect(slice[slice.length - 1]).toBe(500n);
      expect(slice[slice.length - 2]).toBe(600n);
      
      // Continue until empty
      while (stackSize(stack) > 0) {
        stackPop(stack);
      }
      
      // Test underflow after complex sequence
      const underflowResult1 = stackPop(stack);
      expect(underflowResult1).toBeInstanceOf(StackUnderflowError);
      const underflowResult2 = stackDup1(stack);
      expect(underflowResult2).toBeInstanceOf(StackUnderflowError);
      const underflowResult3 = stackSwap1(stack);
      expect(underflowResult3).toBeInstanceOf(StackUnderflowError);
    });
  });

  describe('Zero values and boundary values', () => {
    test('zero values are distinct from empty', () => {
      const stack = createStack();
      
      stackPush(stack, 0n);
      const peekResult = stackPeek(stack);
      expect(peekResult).toBe(0n);
      expect(stackSize(stack)).toBe(1);
      
      const setResult = stackSetTop(stack, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn);
      expect(setResult).toBeUndefined();
      const peekResult2 = stackPeek(stack);
      expect(peekResult2).toBe(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn);
    });

    test('minimal stack size (1 element)', () => {
      const stack = createStack(1);
      
      stackPush(stack, 42n);
      expect(stackSize(stack)).toBe(1);
      
      const overflowResult = stackPush(stack, 99n);
      expect(overflowResult).toBeInstanceOf(StackOverflowError);
      
      const dupResult = stackDup1(stack);
      expect(dupResult).toBeInstanceOf(StackOverflowError);
      
      const swapResult = stackSwap1(stack);
      expect(swapResult).toBeInstanceOf(StackUnderflowError);
    });
  });

  describe('Unsafe operations at exact boundaries', () => {
    test('push_unsafe at exact capacity', () => {
      const stack = createStack(4);
      
      stackPushUnsafe(stack, 1n);
      stackPushUnsafe(stack, 2n);
      stackPushUnsafe(stack, 3n);
      stackPushUnsafe(stack, 4n);
      expect(stackSize(stack)).toBe(4);
      
      expect(stackPeekUnsafe(stack)).toBe(4n);
      stackSetTopUnsafe(stack, 99n);
      expect(stackPeekUnsafe(stack)).toBe(99n);
      
      // Test pop_unsafe down to empty
      expect(stackPopUnsafe(stack)).toBe(99n);
      expect(stackPopUnsafe(stack)).toBe(3n);
      expect(stackPopUnsafe(stack)).toBe(2n);
      expect(stackPopUnsafe(stack)).toBe(1n);
      expect(stackSize(stack)).toBe(0);
      
      // Test boundary with single item
      stackPushUnsafe(stack, 42n);
      expect(stackPeekUnsafe(stack)).toBe(42n);
      stackSetTopUnsafe(stack, 100n);
      expect(stackPeekUnsafe(stack)).toBe(100n);
      expect(stackPopUnsafe(stack)).toBe(100n);
      expect(stackSize(stack)).toBe(0);
    });
  });
});