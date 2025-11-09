/**
 * Hex Manipulation Example
 *
 * Demonstrates:
 * - Concatenating hex strings
 * - Slicing hex data
 * - Padding (left and right)
 * - Trimming zeros
 * - XOR operations
 */

import { Hex } from '@tevm/voltaire'

console.log('=== Hex Manipulation ===\n')

// 1. Concatenation
console.log('1. Concatenation:')

const part1 = Hex('0x12')
const part2 = Hex('0x34')
const part3 = Hex('0x56')

const combined = Hex.concat(part1, part2, part3)
console.log(`  ${part1} + ${part2} + ${part3} = ${combined}`)

// Build transaction data (function selector + arguments)
const selector = Hex('0xa9059cbb') // transfer(address,uint256)
const recipient = Hex.pad(Hex('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'), 32)
const amount = Hex.fromBigInt(1000000n, 32)
const txData = Hex.concat(selector, recipient, amount)
console.log(`  Transaction data: ${txData.slice(0, 20)}... (${Hex.size(txData)} bytes)`)

// 2. Slicing
console.log('\n2. Slicing:')

const data = Hex('0x123456789abc')
console.log(`  Original: ${data}`)
console.log(`  Slice(1): ${Hex.slice(data, 1)}`) // From byte 1 to end
console.log(`  Slice(1, 3): ${Hex.slice(data, 1, 3)}`) // Bytes 1-2
console.log(`  Slice(0, 4): ${Hex.slice(data, 0, 4)}`) // First 4 bytes
console.log(`  Slice(-1): ${Hex.slice(data, -1)}`) // Last byte

// Extract function selector (first 4 bytes)
const calldata = Hex('0xa9059cbb000000000000000000000000742d35cc')
const extractedSelector = Hex.slice(calldata, 0, 4)
console.log(`  Function selector from calldata: ${extractedSelector}`)

// 3. Padding
console.log('\n3. Padding:')

const short = Hex('0x1234')
console.log(`  Original: ${short} (${Hex.size(short)} bytes)`)

// Pad left (prepend zeros) - used for numbers, addresses
const padded4 = Hex.pad(short, 4)
console.log(`  Pad left to 4 bytes: ${padded4}`)

const padded32 = Hex.pad(short, 32)
console.log(`  Pad left to 32 bytes: ${padded32}`)

// Pad right (append zeros) - used for strings/bytes
const paddedRight = Hex.padRight(short, 4)
console.log(`  Pad right to 4 bytes: ${paddedRight}`)

// Ethereum use case: address to U256
const address = Hex('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e')
const addressAsU256 = Hex.pad(address, 32)
console.log(`  Address (20 bytes): ${address}`)
console.log(`  As U256 (32 bytes): ${addressAsU256}`)

// 4. Trimming
console.log('\n4. Trimming:')

const padded = Hex('0x00001234')
console.log(`  Original: ${padded}`)

const trimmed = Hex.trim(padded)
console.log(`  Trimmed: ${trimmed}`)

// Trim all zeros
const allZeros = Hex('0x00000000')
const trimmedZeros = Hex.trim(allZeros)
console.log(`  All zeros trimmed: ${trimmedZeros} (${Hex.size(trimmedZeros)} bytes)`)

// Compact storage value
const storageValue = Hex.fromBigInt(255n, 32)
console.log(`  Storage value (32 bytes): ${storageValue}`)
const compact = Hex.trim(storageValue)
console.log(`  Compacted: ${compact} (${Hex.size(compact)} bytes)`)

// 5. XOR operations
console.log('\n5. XOR operations:')

const a = Hex('0x12')
const b = Hex('0x34')
const xorResult = Hex.xor(a, b)
console.log(`  ${a} XOR ${b} = ${xorResult}`)

// XOR properties
const self = Hex('0x1234')
const selfXor = Hex.xor(self, self)
console.log(`  Self XOR (always zero): ${selfXor}`)

// XOR for masking
const value = Hex('0xff00')
const mask = Hex('0x00ff')
const masked = Hex.xor(value, mask)
console.log(`  ${value} XOR ${mask} = ${masked}`)

// XOR is reversible: xor(xor(a, b), b) === a
const original = Hex('0xabcd')
const key = Hex('0x1234')
const encrypted = Hex.xor(original, key)
const decrypted = Hex.xor(encrypted, key)
console.log(`  Original: ${original}`)
console.log(`  Encrypted (XOR with key): ${encrypted}`)
console.log(`  Decrypted (XOR with key): ${decrypted}`)
console.log(`  Match: ${Hex.equals(original, decrypted)}`)

// 6. Real-world example: Build ERC20 transfer calldata
console.log('\n6. Real-world: Build ERC20 transfer calldata:')

const transferSelector = Hex('0xa9059cbb')
const recipientAddress = Hex('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e')
const transferAmount = 1000000000000000000n // 1 token (18 decimals)

// Pad address and amount to 32 bytes each
const paddedRecipient = Hex.pad(recipientAddress, 32)
const paddedAmount = Hex.fromBigInt(transferAmount, 32)

// Concatenate: selector + recipient + amount
const callData = Hex.concat(transferSelector, paddedRecipient, paddedAmount)

console.log(`  Function: transfer(address,uint256)`)
console.log(`  Selector: ${transferSelector}`)
console.log(`  Recipient: ${recipientAddress}`)
console.log(`  Amount: ${transferAmount}n`)
console.log(`  Calldata: ${callData}`)
console.log(`  Calldata size: ${Hex.size(callData)} bytes`)

// Decode it back
const decodedSelector = Hex.slice(callData, 0, 4)
const decodedRecipient = Hex.trim(Hex.slice(callData, 4, 36))
const decodedAmount = Hex.toBigInt(Hex.slice(callData, 36, 68))

console.log(`  Decoded selector: ${decodedSelector}`)
console.log(`  Decoded recipient: ${decodedRecipient}`)
console.log(`  Decoded amount: ${decodedAmount}n`)

console.log('\n=== Example completed ===\n')
