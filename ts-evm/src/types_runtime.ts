import type { ErrorUnion } from './errors';
import type { ReturnData } from './frame/call_result';
import type { Frame } from './frame/frame';

export type Tail = Next | ReturnData | ErrorUnion;
export type Handler = (f: Frame, cursor: number) => Tail;
export type Next = { next: Handler; cursor: number };