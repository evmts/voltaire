import { Word } from '../types';
import { stackPop } from '../stack/stack';
import { getSlice } from '../memory/memory';
import { next } from '../interpreter';
import type { Frame } from '../frame/frame';
import type { Tail } from '../types_runtime';

export interface LogEntry {
  address: Uint8Array;
  topics: Word[];
  data: Uint8Array;
}

function createLog(f: Frame, topicCount: number): LogEntry | Error {
  const offset = stackPop(f.stack);
  if (offset instanceof Error) return offset;
  const length = stackPop(f.stack);
  if (length instanceof Error) return length;
  
  const topics: Word[] = [];
  for (let i = 0; i < topicCount; i++) {
    const topic = stackPop(f.stack);
    if (topic instanceof Error) return topic;
    topics.push(topic as Word);
  }
  
  const data = getSlice(f.memory, Number(offset), Number(length));
  
  return {
    address: f.contractAddress,
    topics,
    data
  };
}

function emitLog(f: Frame, log: LogEntry): void {
  // In a real implementation, this would add the log to the transaction's log list
  // For now, we'll store it on the frame
  if (!f.logs) {
    f.logs = [];
  }
  f.logs.push(log);
}

export function LOG0(f: Frame, cursor: number): Tail {
  if (f.isStatic) {
    return new Error('Cannot emit logs in static call');
  }
  
  const log = createLog(f, 0);
  if (log instanceof Error) return log;
  
  emitLog(f, log);
  return next(f, cursor);
}

export function LOG1(f: Frame, cursor: number): Tail {
  if (f.isStatic) {
    return new Error('Cannot emit logs in static call');
  }
  
  const log = createLog(f, 1);
  if (log instanceof Error) return log;
  
  emitLog(f, log);
  return next(f, cursor);
}

export function LOG2(f: Frame, cursor: number): Tail {
  if (f.isStatic) {
    return new Error('Cannot emit logs in static call');
  }
  
  const log = createLog(f, 2);
  if (log instanceof Error) return log;
  
  emitLog(f, log);
  return next(f, cursor);
}

export function LOG3(f: Frame, cursor: number): Tail {
  if (f.isStatic) {
    return new Error('Cannot emit logs in static call');
  }
  
  const log = createLog(f, 3);
  if (log instanceof Error) return log;
  
  emitLog(f, log);
  return next(f, cursor);
}

export function LOG4(f: Frame, cursor: number): Tail {
  if (f.isStatic) {
    return new Error('Cannot emit logs in static call');
  }
  
  const log = createLog(f, 4);
  if (log instanceof Error) return log;
  
  emitLog(f, log);
  return next(f, cursor);
}