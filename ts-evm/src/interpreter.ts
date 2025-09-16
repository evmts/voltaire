import { SafetyCounterExceededError } from './errors';
import type { Frame } from './frame/frame';
import type { Handler, Tail, Next } from './types_runtime';
import type { ReturnData } from './frame/call_result';
import type { ErrorUnion } from './errors';

export function interpret(f: Frame, entry: { handler: Handler; cursor: number }): ReturnData | ErrorUnion {
  let h = entry.handler;
  let c = entry.cursor;
  let steps = 300_000_000; // 300M instruction limit
  
  while (true) {
    if (--steps < 0) return new SafetyCounterExceededError();
    const r = h(f, c);
    if ('next' in (r as any)) {
      const n = r as Next;
      h = n.next;
      c = n.cursor;
      continue;
    }
    return r as ReturnData | ErrorUnion;
  }
}

// Alias for common usage
export const execute = interpret;

export function next(f: Frame, cursor: number): Next {
  const items = f.schedule.items;
  const handlerItem = items[cursor] as any;
  const nextCursor = handlerItem.nextCursor as number;
  const nextItem = items[nextCursor] as any;
  return { next: nextItem.handler, cursor: nextCursor };
}