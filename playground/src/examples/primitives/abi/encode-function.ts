import * as ABI from '../../../primitives/ABI/index.js';

// Example: Encode a simple ERC20 transfer function call
const transfer = ABI.Function.encodeParams(
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'amount' }
    ]
  },
  ['0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 100n]
);

console.log('Transfer calldata:', transfer);

// Example: Encode approve with complex parameters
const approve = ABI.Function.encodeParams(
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { type: 'address', name: 'spender' },
      { type: 'uint256', name: 'value' }
    ]
  },
  ['0x1234567890123456789012345678901234567890', 1000000000000000000n]
);

console.log('Approve calldata:', approve);

// Example: Encode a function with multiple types
const swap = ABI.Function.encodeParams(
  {
    name: 'swap',
    type: 'function',
    inputs: [
      { type: 'uint256', name: 'amountIn' },
      { type: 'uint256', name: 'amountOutMin' },
      { type: 'address[]', name: 'path' },
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'deadline' }
    ]
  },
  [
    1000000000000000000n,
    950000000000000000n,
    ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    1700000000n
  ]
);

console.log('Swap calldata:', swap);
