import { encodeErrorResult } from 'viem';

const abi = [{
  type: 'error',
  name: 'InsufficientBalance',
  inputs: [
    { name: 'available', type: 'uint256' },
    { name: 'required', type: 'uint256' }
  ]
}] as const;

const available = 50n;
const required = 100n;

export function main(): void {
  const encoded = encodeErrorResult({
    abi,
    errorName: 'InsufficientBalance',
    args: [available, required]
  });
}
