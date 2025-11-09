/**
 * Merkle Tree Example - BinaryTree
 *
 * Demonstrates:
 * - Building a Merkle tree with multiple accounts
 * - Computing root hash as state commitment
 * - How tree structure changes with insertions
 * - State verification with root hashes
 */

import { BinaryTree } from '../../../src/primitives/BinaryTree/index.js'

console.log('\n=== Binary Merkle Tree State Commitment ===\n')

// Helper to create test data
function createTestData(accountNumber: number): Uint8Array {
  const data = new Uint8Array(32)
  data[0] = accountNumber
  data[1] = 0x01 // version
  return data
}

// Start with empty tree
console.log('1. Initial State (Empty Tree)')
console.log('   ---------------------------')
let tree = BinaryTree()
const initialHash = BinaryTree.rootHashHex(tree)
console.log('   Root hash:', initialHash)
console.log('   All zeros:', initialHash === '0x' + '0'.repeat(64))
console.log('')

// Add first account
console.log('2. Adding First Account (Alice)')
console.log('   -----------------------------')
const aliceKey = new Uint8Array(32)
aliceKey[12] = 0x01 // Address-like key
aliceKey[31] = 0    // Subindex 0 (account data)

const aliceData = createTestData(1)
tree = BinaryTree.insert(tree, aliceKey, aliceData)

const stateRoot1 = BinaryTree.rootHashHex(tree)
console.log('   Alice key[12]:', '0x' + aliceKey[12].toString(16).padStart(2, '0'))
console.log('   Account data[0]:', aliceData[0])
console.log('   Root type:', tree.root.type)
console.log('   State root:', stateRoot1)
console.log('')

// Add second account (same stem)
console.log('3. Adding Second Account (Alice Storage)')
console.log('   --------------------------------------')
const aliceStorageKey = new Uint8Array(32)
aliceStorageKey[12] = 0x01 // Same address
aliceStorageKey[31] = 1    // Subindex 1 (storage slot 0)

const storageValue = new Uint8Array(32)
storageValue[31] = 0xAA

tree = BinaryTree.insert(tree, aliceStorageKey, storageValue)

const stateRoot2 = BinaryTree.rootHashHex(tree)
console.log('   Storage key[31]:', aliceStorageKey[31])
console.log('   Storage value[31]:', '0x' + storageValue[31].toString(16))
console.log('   Root type:', tree.root.type)
console.log('   State root changed:', stateRoot1 !== stateRoot2)
console.log('   New state root:', stateRoot2)
console.log('')

// Add third account (different stem)
console.log('4. Adding Third Account (Bob)')
console.log('   ---------------------------')
const bobKey = new Uint8Array(32)
bobKey[12] = 0x02 // Different address
bobKey[31] = 0    // Subindex 0 (account data)

const bobData = createTestData(2)
tree = BinaryTree.insert(tree, bobKey, bobData)

const stateRoot3 = BinaryTree.rootHashHex(tree)
console.log('   Bob key[12]:', '0x' + bobKey[12].toString(16).padStart(2, '0'))
console.log('   Account data[0]:', bobData[0])
console.log('   Root type now:', tree.root.type)
console.log('   Tree branched:', tree.root.type === 'internal')
console.log('   State root changed:', stateRoot2 !== stateRoot3)
console.log('   New state root:', stateRoot3)
console.log('')

// Add fourth account (another different stem)
console.log('5. Adding Fourth Account (Carol)')
console.log('   ------------------------------')
const carolKey = new Uint8Array(32)
carolKey[12] = 0xFF // Very different address
carolKey[31] = 0    // Subindex 0 (account data)

const carolData = createTestData(3)
tree = BinaryTree.insert(tree, carolKey, carolData)

const stateRoot4 = BinaryTree.rootHashHex(tree)
console.log('   Carol key[12]:', '0x' + carolKey[12].toString(16).padStart(2, '0'))
console.log('   Account data[0]:', carolData[0])
console.log('   Root type:', tree.root.type)
console.log('   State root changed:', stateRoot3 !== stateRoot4)
console.log('   New state root:', stateRoot4)
console.log('')

// Verify all data is still accessible
console.log('6. Verifying All Data Remains Accessible')
console.log('   -------------------------------------')
const aliceRetrieved = BinaryTree.get(tree, aliceKey)
const aliceStorageRetrieved = BinaryTree.get(tree, aliceStorageKey)
const bobRetrieved = BinaryTree.get(tree, bobKey)
const carolRetrieved = BinaryTree.get(tree, carolKey)

console.log('   Alice data accessible:', aliceRetrieved !== null)
console.log('   Alice storage accessible:', aliceStorageRetrieved !== null)
console.log('   Bob data accessible:', bobRetrieved !== null)
console.log('   Carol data accessible:', carolRetrieved !== null)
console.log('')

// Demonstrate state commitment
console.log('7. State Commitment Demonstration')
console.log('   -------------------------------')
console.log('   State progression:')
console.log('   Empty tree:        ', initialHash)
console.log('   After Alice:       ', stateRoot1)
console.log('   After Alice+storage:', stateRoot2)
console.log('   After Bob:         ', stateRoot3)
console.log('   After Carol:       ', stateRoot4)
console.log('   Each insertion changes root hash')
console.log('   Root hash = cryptographic commitment to entire state')
console.log('')

// Verify state hasn't changed
console.log('8. Verify Current State')
console.log('   --------------------')
const currentRoot = BinaryTree.rootHashHex(tree)
console.log('   Expected root:', stateRoot4)
console.log('   Current root: ', currentRoot)
console.log('   Match:', currentRoot === stateRoot4)
console.log('')

// Demonstrate determinism
console.log('9. Demonstrating Determinism')
console.log('   -------------------------')
let tree2 = BinaryTree()
tree2 = BinaryTree.insert(tree2, aliceKey, aliceData)
tree2 = BinaryTree.insert(tree2, aliceStorageKey, storageValue)
tree2 = BinaryTree.insert(tree2, bobKey, bobData)
tree2 = BinaryTree.insert(tree2, carolKey, carolData)

const rebuiltRoot = BinaryTree.rootHashHex(tree2)
console.log('   Original root: ', currentRoot)
console.log('   Rebuilt root:  ', rebuiltRoot)
console.log('   Deterministic: ', currentRoot === rebuiltRoot)
console.log('   Same insertions always produce same root hash')
console.log('')

console.log('=== Example Complete ===\n')
