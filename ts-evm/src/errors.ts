export abstract class EvmError extends Error {
  abstract readonly _tag: string;
  constructor(message: string) {
    super(message);
    this.name = (this as any)._tag ?? 'EvmError';
  }
}

// Stack errors
export class StackOverflowError extends EvmError {
  readonly _tag = 'StackOverflowError';
  constructor() { super('stack overflow'); }
}

export class StackUnderflowError extends EvmError {
  readonly _tag = 'StackUnderflowError';
  constructor() { super('stack underflow'); }
}

// Memory errors
export class MemoryError extends EvmError {
  readonly _tag = 'MemoryError';
  constructor(message: string) { super(message); }
}

export class OutOfMemoryError extends EvmError {
  readonly _tag = 'OutOfMemoryError';
  constructor() { super('out of memory'); }
}

export class MemoryOverflowError extends EvmError {
  readonly _tag = 'MemoryOverflowError';
  constructor() { super('memory overflow'); }
}

// Gas errors
export class OutOfGasError extends EvmError {
  readonly _tag = 'OutOfGasError';
  constructor() { super('out of gas'); }
}

export class GasOverflowError extends EvmError {
  readonly _tag = 'GasOverflowError';
  constructor() { super('gas overflow'); }
}

// Execution errors
export class InvalidOpcodeError extends EvmError {
  readonly _tag = 'InvalidOpcodeError';
  constructor(op: number) { super(`invalid opcode 0x${op.toString(16)}`); }
}

export class InvalidJumpError extends EvmError {
  readonly _tag = 'InvalidJumpError';
  constructor(dest: number) { super(`invalid jump destination 0x${dest.toString(16)}`); }
}

export class ReturnDataOutOfBoundsError extends EvmError {
  readonly _tag = 'ReturnDataOutOfBoundsError';
  constructor() { super('return data out of bounds'); }
}

export class CallDepthExceededError extends EvmError {
  readonly _tag = 'CallDepthExceededError';
  constructor() { super('call depth exceeded'); }
}

export class InsufficientBalanceError extends EvmError {
  readonly _tag = 'InsufficientBalanceError';
  constructor() { super('insufficient balance'); }
}

export class ContractAddressCollisionError extends EvmError {
  readonly _tag = 'ContractAddressCollisionError';
  constructor() { super('contract address collision'); }
}

export class StaticCallViolationError extends EvmError {
  readonly _tag = 'StaticCallViolationError';
  constructor() { super('state modification in static call'); }
}

// Safety errors
export class SafetyCounterExceededError extends EvmError {
  readonly _tag = 'SafetyCounterExceededError';
  constructor() { super('safety counter exceeded'); }
}

// Schedule/dispatch errors
export class ScheduleError extends EvmError {
  readonly _tag = 'ScheduleError';
  constructor(message: string = 'schedule error') { super(message); }
}

export class DispatchError extends EvmError {
  readonly _tag = 'DispatchError';
  constructor(message: string = 'dispatch error') { super(message); }
}

// Host/system errors
export class HostError extends EvmError {
  readonly _tag = 'HostError';
  constructor(message: string) { super(message); }
}

export class PrecompileError extends EvmError {
  readonly _tag = 'PrecompileError';
  constructor(address: number, message: string) { 
    super(`precompile 0x${address.toString(16)}: ${message}`); 
  }
}

// Storage errors
export class StorageError extends EvmError {
  readonly _tag = 'StorageError';
  constructor(message: string) { super(message); }
}

export class WriteProtectionError extends EvmError {
  readonly _tag = 'WriteProtectionError';
  constructor() { super('write protection'); }
}

// Create errors
export class CreateCollisionError extends EvmError {
  readonly _tag = 'CreateCollisionError';
  constructor() { super('create collision'); }
}

export class CreateContractSizeError extends EvmError {
  readonly _tag = 'CreateContractSizeError';
  constructor() { super('contract size limit exceeded'); }
}

export class CreateContractStartingWithEFError extends EvmError {
  readonly _tag = 'CreateContractStartingWithEFError';
  constructor() { super('contract code cannot start with 0xEF'); }
}

// Access list errors
export class AccessListError extends EvmError {
  readonly _tag = 'AccessListError';
  constructor(message: string) { super(message); }
}

// Type unions for common error groups
export type StackError = StackOverflowError | StackUnderflowError;
export type MemoryErrorUnion = MemoryError | OutOfMemoryError | MemoryOverflowError;
export type GasError = OutOfGasError | GasOverflowError;
export type ExecutionError = 
  | InvalidOpcodeError 
  | InvalidJumpError 
  | ReturnDataOutOfBoundsError 
  | CallDepthExceededError
  | InsufficientBalanceError
  | ContractAddressCollisionError
  | StaticCallViolationError
  | SafetyCounterExceededError;
export type CreateError = CreateCollisionError | CreateContractSizeError | CreateContractStartingWithEFError;

export type ErrorUnion = 
  | StackError 
  | MemoryErrorUnion
  | GasError
  | ExecutionError
  | CreateError
  | ScheduleError
  | DispatchError
  | HostError
  | PrecompileError
  | StorageError
  | WriteProtectionError
  | AccessListError;