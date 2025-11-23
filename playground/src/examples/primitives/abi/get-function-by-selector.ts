import * as ABI from '../../../primitives/ABI/index.js';

// Example: Create ABI instance with multiple functions
const abi = ABI.Abi([
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'amount' }
    ],
    outputs: [{ type: 'bool', name: 'success' }]
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { type: 'address', name: 'spender' },
      { type: 'uint256', name: 'value' }
    ],
    outputs: [{ type: 'bool', name: 'success' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ type: 'address', name: 'account' }],
    outputs: [{ type: 'uint256', name: 'balance' }]
  }
]);

// Example: Get function by selector
const transferFunc = ABI.getFunctionBySelector(abi, '0xa9059cbb');
console.log('Transfer function:', transferFunc);

const approveFunc = ABI.getFunctionBySelector(abi, '0x095ea7b3');
console.log('Approve function:', approveFunc);

const balanceOfFunc = ABI.getFunctionBySelector(abi, '0x70a08231');
console.log('BalanceOf function:', balanceOfFunc);

// Example: Handle unknown selector
try {
  const unknown = ABI.getFunctionBySelector(abi, '0x00000000');
  console.log('Unknown function:', unknown);
} catch (error) {
  console.log('Error:', error);
}
