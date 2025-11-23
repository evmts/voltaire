import * as ABI from '../../../primitives/ABI/index.js';

// Example: Calculate event signature (topic0) from signature string
const transferSignature = ABI.Event.getSelector('Transfer(address,address,uint256)');
console.log('Transfer signature:', transferSignature);

// Example: Calculate signature from event definition
const approvalSignature = ABI.Event.getSelector({
  name: 'Approval',
  type: 'event',
  inputs: [
    { type: 'address', name: 'owner', indexed: true },
    { type: 'address', name: 'spender', indexed: true },
    { type: 'uint256', name: 'value', indexed: false }
  ]
});
console.log('Approval signature:', approvalSignature);

// Example: Event with multiple indexed parameters
const swapSignature = ABI.Event.getSelector({
  name: 'Swap',
  type: 'event',
  inputs: [
    { type: 'address', name: 'sender', indexed: true },
    { type: 'uint256', name: 'amount0In', indexed: false },
    { type: 'uint256', name: 'amount1In', indexed: false },
    { type: 'uint256', name: 'amount0Out', indexed: false },
    { type: 'uint256', name: 'amount1Out', indexed: false },
    { type: 'address', name: 'to', indexed: true }
  ]
});
console.log('Swap signature:', swapSignature);

// Example: Event with array parameter
const depositSignature = ABI.Event.getSelector({
  name: 'Deposit',
  type: 'event',
  inputs: [
    { type: 'address', name: 'user', indexed: true },
    { type: 'uint256[]', name: 'amounts', indexed: false }
  ]
});
console.log('Deposit signature:', depositSignature);

// Example: Common ERC721 event signatures
const transferERC721 = ABI.Event.getSelector('Transfer(address,address,uint256)');
const approvalERC721 = ABI.Event.getSelector('Approval(address,address,uint256)');
const approvalForAll = ABI.Event.getSelector('ApprovalForAll(address,address,bool)');

console.log('ERC721 Transfer:', transferERC721);
console.log('ERC721 Approval:', approvalERC721);
console.log('ApprovalForAll:', approvalForAll);
