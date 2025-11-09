/**
 * Basic Operations Example - BinaryTree
 *
 * Demonstrates:
 * - Creating an empty tree
 * - Inserting values
 * - Retrieving values
 * - Computing root hash
 */

import { BinaryTree } from '../../../src/primitives/BinaryTree/index.js'

console.log('\n=== BinaryTree Basic Operations ===\n')

// Create empty tree
console.log('1. Creating Empty Tree')
console.log('   -------------------')
const tree = BinaryTree()
console.log('   Root type:', tree.root.type)
console.log('   Root hash (hex):', BinaryTree.rootHashHex(tree))
console.log('')

// Insert first value
console.log('2. Inserting First Value')
console.log('   ----------------------')
const key1 = new Uint8Array(32)
key1[31] = 5 // Subindex 5

const value1 = new Uint8Array(32)
value1[0] = 0x42

let tree2 = BinaryTree.insert(tree, key1, value1)
console.log('   Key subindex:', key1[31])
console.log('   Value[0]:', '0x' + value1[0].toString(16))
console.log('   Root type after insert:', tree2.root.type)
console.log('   Root hash changed:', BinaryTree.rootHashHex(tree) !== BinaryTree.rootHashHex(tree2))
console.log('')

// Retrieve value
console.log('3. Retrieving Value')
console.log('   ----------------')
const retrieved = BinaryTree.get(tree2, key1)
if (retrieved) {
  console.log('   Retrieved value[0]:', '0x' + retrieved[0].toString(16))
  console.log('   Match original:', retrieved[0] === value1[0])
} else {
  console.log('   Value not found')
}
console.log('')

// Insert second value (same stem, different subindex)
console.log('4. Inserting Second Value (Same Stem)')
console.log('   -----------------------------------')
const key2 = new Uint8Array(32)
key2[31] = 10 // Different subindex

const value2 = new Uint8Array(32)
value2[0] = 0x99

tree2 = BinaryTree.insert(tree2, key2, value2)
console.log('   Key subindex:', key2[31])
console.log('   Value[0]:', '0x' + value2[0].toString(16))
console.log('   Root still stem type:', tree2.root.type === 'stem')
console.log('')

// Retrieve both values
console.log('5. Retrieving Multiple Values')
console.log('   ---------------------------')
const val1 = BinaryTree.get(tree2, key1)
const val2 = BinaryTree.get(tree2, key2)
console.log('   Value 1 [subindex 5]:', val1 ? '0x' + val1[0].toString(16) : 'null')
console.log('   Value 2 [subindex 10]:', val2 ? '0x' + val2[0].toString(16) : 'null')
console.log('')

// Insert with different stem
console.log('6. Inserting Different Stem (Creates Internal Node)')
console.log('   ------------------------------------------------')
const key3 = new Uint8Array(32)
key3[0] = 0xFF // Different stem (first byte differs)
key3[31] = 0

const value3 = new Uint8Array(32)
value3[0] = 0xAB

const tree3 = BinaryTree.insert(tree2, key3, value3)
console.log('   First byte of stem:', '0x' + key3[0].toString(16))
console.log('   Root type changed to:', tree3.root.type)
console.log('   Tree now has branches:', tree3.root.type === 'internal')
console.log('')

// Query non-existent value
console.log('7. Querying Non-existent Value')
console.log('   ----------------------------')
const nonExistentKey = new Uint8Array(32)
nonExistentKey[31] = 99

const notFound = BinaryTree.get(tree3, nonExistentKey)
console.log('   Query result:', notFound === null ? 'null (not found)' : 'found')
console.log('')

// Update existing value
console.log('8. Updating Existing Value')
console.log('   -----------------------')
const updatedValue = new Uint8Array(32)
updatedValue[0] = 0xFF

const tree4 = BinaryTree.insert(tree3, key1, updatedValue)
const updated = BinaryTree.get(tree4, key1)
console.log('   Original value[0]:', '0x' + value1[0].toString(16))
console.log('   Updated value[0]:', updated ? '0x' + updated[0].toString(16) : 'null')
console.log('')

// Final root hash
console.log('9. Final State')
console.log('   -----------')
console.log('   Root type:', tree4.root.type)
console.log('   Root hash:', BinaryTree.rootHashHex(tree4))
console.log('')

console.log('=== Example Complete ===\n')
