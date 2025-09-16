import type { Address } from './types_blockchain';
import type { Word } from './types';

export interface CallParams {
  bytecode?: Uint8Array;
  to?: Address;
  caller?: Address;
  value?: Word;
  calldata?: Uint8Array;
  gasLimit?: bigint;
  safetyLimit?: number;
}