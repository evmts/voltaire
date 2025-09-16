import { Word } from '../types';
import { stackPop, stackPush } from '../stack/stack';
import { next } from '../interpreter';
import type { Frame } from '../frame/frame';
import type { Tail } from '../types_runtime';
import { InvalidJumpError } from '../errors';

// Helper to validate jump destination
function isValidJumpDest(frame: Frame, dest: number): boolean {
  // Check if destination is within code bounds
  if (dest >= frame.code.length) return false;
  
  // Check if destination is a JUMPDEST opcode (0x5b)
  return frame.code[dest] === 0x5b;
}

export function JUMP(f: Frame, cursor: number): Tail {
  const dest = stackPop(f.stack);
  if (dest instanceof Error) return dest;
  
  const destNum = Number(dest as Word);
  
  // Validate jump destination
  if (!isValidJumpDest(f, destNum)) {
    return new InvalidJumpError(destNum);
  }
  
  // Find the cursor position for this PC in the schedule
  // This is a simplified version - in the real implementation
  // we'd need to map PC to schedule cursor efficiently
  const items = f.schedule.items;
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as any;
    if (item.kind === 'handler' && item.pc === destNum) {
      // Jump to this position
      return { next: item.handler, cursor: i };
    }
  }
  
  return new InvalidJumpError(destNum);
}

export function JUMPI(f: Frame, cursor: number): Tail {
  const condition = stackPop(f.stack);
  if (condition instanceof Error) return condition;
  const dest = stackPop(f.stack);
  if (dest instanceof Error) return dest;
  
  // If condition is zero, don't jump
  if ((condition as Word) === 0n) {
    return next(f, cursor);
  }
  
  const destNum = Number(dest as Word);
  
  // Validate jump destination
  if (!isValidJumpDest(f, destNum)) {
    return new InvalidJumpError(destNum);
  }
  
  // Find the cursor position for this PC in the schedule
  const items = f.schedule.items;
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as any;
    if (item.kind === 'handler' && item.pc === destNum) {
      // Jump to this position
      return { next: item.handler, cursor: i };
    }
  }
  
  return new InvalidJumpError(destNum);
}

export function JUMPDEST(f: Frame, cursor: number): Tail {
  // JUMPDEST is a no-op, it just marks a valid jump destination
  return next(f, cursor);
}