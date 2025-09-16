export abstract class EvmError extends Error {
  abstract readonly _tag: string;
  constructor(message: string) {
    super(message);
    this.name = (this as any)._tag ?? 'EvmError';
  }
}

export class StackOverflowError extends EvmError {
  readonly _tag = 'StackOverflowError';
  constructor() { super('stack overflow'); }
}

export class StackUnderflowError extends EvmError {
  readonly _tag = 'StackUnderflowError';
  constructor() { super('stack underflow'); }
}

export class InvalidOpcodeError extends EvmError {
  readonly _tag = 'InvalidOpcodeError';
  constructor(op: number) { super(`invalid opcode 0x${op.toString(16)}`); }
}

export class SafetyCounterExceededError extends EvmError {
  readonly _tag = 'SafetyCounterExceededError';
  constructor() { super('safety counter exceeded'); }
}

export class ScheduleError extends EvmError {
  readonly _tag = 'ScheduleError';
  constructor(message: string = 'schedule error') { super(message); }
}

export type StackError = StackOverflowError | StackUnderflowError;
export type ErrorUnion = StackError | InvalidOpcodeError | SafetyCounterExceededError | ScheduleError;
