/**
 * Key Utilities Example - BinaryTree
 *
 * Demonstrates:
 * - Converting addresses to keys
 * - Splitting keys into stem and subindex
 * - Extracting stem bits for tree traversal
 * - Understanding key structure
 */

import { BinaryTree } from '../../../src/primitives/BinaryTree/index.js'

console.log('\n=== BinaryTree Key Utilities ===\n')

// Example 1: Address to key conversion
console.log('1. Address to Key Conversion')
console.log('   --------------------------')

const address = new Uint8Array(20)
address[0] = 0xf3
address[1] = 0x9f
address[2] = 0xd6
address[19] = 0x66

console.log('   Original address (20 bytes):')
console.log('     First bytes: 0x' + address[0].toString(16) + address[1].toString(16) + address[2].toString(16))
console.log('     Last byte: 0x' + address[19].toString(16))

const key = BinaryTree.addressToKey(address)
console.log('   Converted key (32 bytes):')
console.log('     Length:', key.length)
console.log('     First 12 bytes (padding): all zeros:', key.slice(0, 12).every(b => b === 0))
console.log('     Byte[12] (first address byte):', '0x' + key[12].toString(16).padStart(2, '0'))
console.log('     Byte[13] (second address byte):', '0x' + key[13].toString(16).padStart(2, '0'))
console.log('     Byte[31] (last address byte):', '0x' + key[31].toString(16).padStart(2, '0'))
console.log('')

// Example 2: Key splitting
console.log('2. Splitting Key into Stem and Subindex')
console.log('   -------------------------------------')

const testKey = new Uint8Array(32)
for (let i = 0; i < 31; i++) {
  testKey[i] = 0xAA
}
testKey[31] = 0x42 // Subindex

const { stem, idx } = BinaryTree.splitKey(testKey)
console.log('   Full key[0]:', '0x' + testKey[0].toString(16))
console.log('   Full key[30]:', '0x' + testKey[30].toString(16))
console.log('   Full key[31]:', '0x' + testKey[31].toString(16))
console.log('   Stem length:', stem.length, 'bytes')
console.log('   Stem[0]:', '0x' + stem[0].toString(16))
console.log('   Stem[30]:', '0x' + stem[30].toString(16))
console.log('   Subindex:', idx, '(0x' + idx.toString(16) + ')')
console.log('')

// Example 3: Stem bit extraction
console.log('3. Extracting Stem Bits (Tree Traversal)')
console.log('   -------------------------------------')

const stemExample = new Uint8Array(31)
stemExample[0] = 0b10101010 // Binary: 1-0-1-0-1-0-1-0

console.log('   Stem byte[0]:', '0b' + stemExample[0].toString(2).padStart(8, '0'))
console.log('   Bit positions (left to right):')

for (let pos = 0; pos < 8; pos++) {
  const bit = BinaryTree.getStemBit(stemExample, pos)
  const direction = bit === 0 ? 'left' : 'right'
  console.log(`     Position ${pos}: ${bit} (go ${direction})`)
}
console.log('')

// Example 4: Tree path visualization
console.log('4. Visualizing Tree Path')
console.log('   ---------------------')

const pathStem = new Uint8Array(31)
pathStem[0] = 0b11000000 // First two bits: 1, 1

console.log('   Stem byte[0]:', '0b' + pathStem[0].toString(2).padStart(8, '0'))
console.log('   Tree path (first 5 levels):')

const path = []
for (let depth = 0; depth < 5; depth++) {
  const bit = BinaryTree.getStemBit(pathStem, depth)
  path.push(bit === 0 ? 'L' : 'R')
}
console.log('     Path: Root', path.join(' → '))
console.log('     (L = left, R = right)')
console.log('')

// Example 5: Different stems for different accounts
console.log('5. Different Stems for Different Accounts')
console.log('   ---------------------------------------')

const addr1 = new Uint8Array(20)
addr1[0] = 0x00 // First bit of stem will be 0

const addr2 = new Uint8Array(20)
addr2[0] = 0x80 // First bit of stem will be 1

const key1 = BinaryTree.addressToKey(addr1)
const key2 = BinaryTree.addressToKey(addr2)

const { stem: stem1 } = BinaryTree.splitKey(key1)
const { stem: stem2 } = BinaryTree.splitKey(key2)

const bit1_0 = BinaryTree.getStemBit(stem1, 0)
const bit2_0 = BinaryTree.getStemBit(stem2, 0)

console.log('   Account 1:')
console.log('     Address[0]: 0x' + addr1[0].toString(16).padStart(2, '0'))
console.log('     Stem bit 0:', bit1_0, '(goes', bit1_0 === 0 ? 'left)' : 'right)')

console.log('   Account 2:')
console.log('     Address[0]: 0x' + addr2[0].toString(16).padStart(2, '0'))
console.log('     Stem bit 0:', bit2_0, '(goes', bit2_0 === 0 ? 'left)' : 'right)')

console.log('   Stems differ at bit 0:', bit1_0 !== bit2_0)
console.log('   Tree will branch at root level')
console.log('')

// Example 6: Subindex usage
console.log('6. Subindex Usage for Account Data')
console.log('   --------------------------------')

const baseKey = BinaryTree.addressToKey(address)

console.log('   Base key for address')
console.log('   Different subindices for different data:')

const subindexMap = [
  { idx: 0, desc: 'Account basic data (version, nonce, balance, code size)' },
  { idx: 1, desc: 'Storage slot 0' },
  { idx: 2, desc: 'Storage slot 1' },
  { idx: 128, desc: 'Storage slot 127' },
  { idx: 255, desc: 'Storage slot 254' }
]

for (const { idx, desc } of subindexMap) {
  const keyForIdx = baseKey.slice()
  keyForIdx[31] = idx
  console.log(`     Subindex ${idx.toString().padStart(3)}: ${desc}`)
}
console.log('')

// Example 7: Complete key breakdown
console.log('7. Complete Key Structure Breakdown')
console.log('   ---------------------------------')

const exampleKey = new Uint8Array(32)
exampleKey[12] = 0xAB // Address start
exampleKey[13] = 0xCD
exampleKey[31] = 5    // Subindex

console.log('   32-byte key structure:')
console.log('   ┌─────────────────────────────────────────┬────┐')
console.log('   │          31-byte Stem                   │ Idx│')
console.log('   │  (tree navigation path)                 │    │')
console.log('   └─────────────────────────────────────────┴────┘')
console.log('   Bytes[0-11]:  Padding (0x00) for address keys')
console.log('   Bytes[12-30]: Address bytes (20 bytes total)')
console.log('   Byte[31]:     Subindex (0-255)')
console.log('')
console.log('   Example key:')
console.log('     Byte[12]: 0x' + exampleKey[12].toString(16))
console.log('     Byte[13]: 0x' + exampleKey[13].toString(16))
console.log('     Byte[31]: ' + exampleKey[31] + ' (subindex)')

const { stem: exStem, idx: exIdx } = BinaryTree.splitKey(exampleKey)
console.log('   Split result:')
console.log('     Stem length: ' + exStem.length + ' bytes')
console.log('     Subindex: ' + exIdx)
console.log('')

// Example 8: Bit-level tree navigation
console.log('8. Bit-Level Tree Navigation')
console.log('   --------------------------')

const navStem = new Uint8Array(31)
navStem[0] = 0b10110100

console.log('   Stem byte[0]: 0b' + navStem[0].toString(2).padStart(8, '0'))
console.log('   Navigation through tree:')
console.log('   ')
console.log('          Root')

let indent = '          '
for (let depth = 0; depth < 4; depth++) {
  const bit = BinaryTree.getStemBit(navStem, depth)
  const direction = bit === 0 ? 'left' : 'right'
  const arrow = bit === 0 ? '/' : '\\'
  indent = indent + '  '
  console.log(`   ${indent}${arrow} (bit ${depth} = ${bit}, go ${direction})`)
}
console.log('')

console.log('=== Example Complete ===\n')
