import * as Address from '../../../primitives/Address/index.js';

// Example: Clone an address
const original = Address.from('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');

// Create independent copy
const cloned = Address.clone(original);
console.log('Original:', Address.toHex(original));
console.log('Cloned:', Address.toHex(cloned));

// Equal but different instances
console.log('Equal:', Address.equals(original, cloned));
console.log('Same reference:', original === cloned);

// Modifying clone doesn't affect original
cloned[0] = 0xff;
console.log('Modified clone:', Address.toHex(cloned));
console.log('Original unchanged:', Address.toHex(original));

// Instance method also available
const instance = Address.Address('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
const instanceClone = instance.clone();
console.log('Instance clone:', Address.toHex(instanceClone));
