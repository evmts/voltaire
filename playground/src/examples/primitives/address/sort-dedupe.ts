import * as Address from '../../../primitives/Address/index.js';

// Example: Sort and deduplicate addresses
const addr1 = Address.from('0x0000000000000000000000000000000000000003');
const addr2 = Address.from('0x0000000000000000000000000000000000000001');
const addr3 = Address.from('0x0000000000000000000000000000000000000002');
const addr4 = Address.from('0x0000000000000000000000000000000000000001'); // Duplicate

const addresses = [addr1, addr2, addr3, addr4];

// Sort addresses lexicographically
const sorted = Address.sortAddresses(addresses);
console.log('Sorted addresses:');
sorted.forEach(addr => console.log('  ' + Address.toHex(addr)));

// Remove duplicates
const unique = Address.deduplicateAddresses(addresses);
console.log('\nUnique addresses:', unique.length);
unique.forEach(addr => console.log('  ' + Address.toHex(addr)));

// Combine: sort and deduplicate
const cleanList = Address.deduplicateAddresses(Address.sortAddresses(addresses));
console.log('\nSorted & unique:', cleanList.length);
cleanList.forEach(addr => console.log('  ' + Address.toHex(addr)));
