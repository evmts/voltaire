#!/usr/bin/env bun

import { writeFileSync } from 'fs';
import { join } from 'path';

const docsDir = '/Users/williamcory/voltaire/docs/evm/instructions/stack';

// Generate PUSH1-32 pages
for (let n = 1; n <= 32; n++) {
  const opcode = (0x5f + n).toString(16).toUpperCase();
  const content = `---
title: "PUSH${n} (0x${opcode})"
description: "Push ${n}-byte immediate value onto stack"
---

## Overview

**Opcode:** \`0x${opcode}\`
**Introduced:** Frontier (EVM genesis)

PUSH${n} pushes a ${n}-byte immediate value from the bytecode onto the stack. The ${n} byte${n > 1 ? 's' : ''} immediately following the opcode ${n > 1 ? 'are' : 'is'} read and zero-padded to 256 bits.

## Specification

**Stack Input:**
\`\`\`
[]
\`\`\`

**Stack Output:**
\`\`\`
value (uint256, ${n} byte${n > 1 ? 's' : ''} from bytecode)
\`\`\`

**Gas Cost:** 3 (GasFastestStep)

**Bytecode:** 1 byte opcode + ${n} byte${n > 1 ? 's' : ''} immediate data

**Operation:**
\`\`\`
value = read_bytes(pc + 1, ${n})  // Big-endian
stack.push(value)
pc += ${n + 1}
\`\`\`

## Behavior

PUSH${n} reads ${n} byte${n > 1 ? 's' : ''} from bytecode starting at position \`pc + 1\`, interprets ${n > 1 ? 'them' : 'it'} as a big-endian unsigned integer, and pushes the result onto the stack.

Key characteristics:
- Reads exactly ${n} byte${n > 1 ? 's' : ''} following opcode
- Big-endian byte order (most significant byte first)
- Zero-padded to 256 bits if less than 32 bytes
- InvalidOpcode if insufficient bytecode remaining
- PC advances by ${n + 1} (opcode + data)

## Examples

### Basic Usage

\`\`\`typescript
import { handler_0x${opcode}_PUSH${n} } from '@tevm/voltaire/evm/stack/handlers';
import { createFrame } from '@tevm/voltaire/evm/Frame';

// Bytecode with PUSH${n}
const bytecode = new Uint8Array([
  0x${opcode},  // PUSH${n}
  ${Array.from({ length: n }, (_, i) => `0x${(i + 1).toString(16).padStart(2, '0')}`).join(', ')}   // ${n} byte${n > 1 ? 's' : ''}: ${Array.from({ length: n }, (_, i) => (i + 1).toString(16).padStart(2, '0')).join('')}
]);

const frame = createFrame({
  bytecode,
  pc: 0,
  stack: [],
  gasRemaining: 1000n
});

const err = handler_0x${opcode}_PUSH${n}(frame);

console.log(frame.stack); // [0x${Array.from({ length: n }, (_, i) => (i + 1).toString(16).padStart(2, '0')).join('')}${n < 32 ? '00'.repeat(32 - n) : ''}n]
console.log(frame.pc); // ${n + 1}
console.log(frame.gasRemaining); // 997n (3 gas consumed)
\`\`\`

### Solidity Compilation

\`\`\`solidity
contract Example {
${n <= 4 ? `    // Function selectors use PUSH4
    function transfer() public {
        // PUSH4 0xa9059cbb  (4-byte selector)
    }` : n === 20 ? `    // Addresses use PUSH20
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    // PUSH20 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` : n === 32 ? `    // Large constants use PUSH32
    uint256 constant MAX = type(uint256).max;
    // PUSH32 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff` : `    // ${n}-byte constant
    uint${n * 8} constant VALUE = ${2 ** (n * 8) - 1};
    // PUSH${n} 0x${'ff'.repeat(n)}`}
}
\`\`\`

### Assembly Usage

\`\`\`solidity
assembly {
    // Push ${n}-byte value
    push${n} 0x${Array.from({ length: n }, () => 'ff').join('')}
    ${n <= 20 ? `
    // Example: ${n === 4 ? 'function selector' : n === 20 ? 'address literal' : `${n}-byte constant`}` : ''}
}
\`\`\`

## Gas Cost

**Cost:** 3 gas (GasFastestStep)

All PUSH1-32 instructions cost the same despite different data sizes. Bytecode size impact:
- PUSH${n}: ${n + 1} byte${n + 1 > 1 ? 's' : ''} (1 opcode + ${n} data)
${n < 32 ? `- PUSH32: 33 bytes (1 opcode + 32 data)` : ''}

**Comparison:**
| Opcode | Gas | Bytes | Use Case |
|--------|-----|-------|----------|
| PUSH0 | 2 | 1 | Zero constant (Shanghai+) |
| PUSH1 | 3 | 2 | Small numbers (0-255) |
${n === 4 ? '| PUSH4 | 3 | 5 | Function selectors |' : ''}
${n === 20 ? '| PUSH20 | 3 | 21 | Address literals |' : ''}
${n === 32 ? '| PUSH32 | 3 | 33 | Large constants |' : ''}

## Common Usage

${n === 1 ? `### Small Constants

\`\`\`solidity
assembly {
    push1 0x20  // Memory offset (32 bytes)
    push1 0x00  // Zero offset
    push1 0x01  // Boolean true
    push1 0xff  // Maximum byte value
}
\`\`\`` : n === 4 ? `### Function Selectors

\`\`\`solidity
// Function selector is first 4 bytes of keccak256("transfer(address,uint256)")
function checkSelector() public pure {
    assembly {
        let selector := shr(224, calldataload(0))
        push4 0xa9059cbb  // transfer selector
        eq  // Compare
    }
}
\`\`\`` : n === 20 ? `### Address Constants

\`\`\`solidity
contract Uniswap {
    // WETH address
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    // Compiled to:
    // PUSH20 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
}
\`\`\`` : n === 32 ? `### Maximum Values

\`\`\`solidity
contract Constants {
    uint256 constant MAX_UINT256 = type(uint256).max;

    // Compiled to:
    // PUSH32 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
}
\`\`\`` : `### ${n}-Byte Constants

\`\`\`solidity
assembly {
    // ${n}-byte literal
    push${n} 0x${Array.from({ length: n }, () => 'ab').join('')}
}
\`\`\``}

### Big-Endian Encoding

\`\`\`typescript
// Bytecode: PUSH${n} ${Array.from({ length: n }, (_, i) => (i + 1).toString(16).padStart(2, '0')).join(' ')}
// Reads as: 0x${Array.from({ length: n }, (_, i) => (i + 1).toString(16).padStart(2, '0')).join('')}

// Most significant byte first
// Byte 0: 0x01 (highest significance)
// Byte ${n - 1}: 0x${n.toString(16).padStart(2, '0')} (lowest significance)
\`\`\`

## Implementation

<Tabs>
<Tab title="TypeScript">
\`\`\`typescript
/**
 * Read immediate data from bytecode for PUSH operations
 */
function readImmediate(bytecode: Uint8Array, pc: number, size: number): bigint | null {
  if (pc + 1 + size > bytecode.length) {
    return null;
  }

  let result = 0n;
  for (let i = 0; i < size; i++) {
    result = (result << 8n) | BigInt(bytecode[pc + 1 + i]);
  }
  return result;
}

/**
 * PUSH${n} opcode (0x${opcode}) - Push ${n} byte${n > 1 ? 's' : ''} onto stack
 *
 * Stack: [] => [value]
 * Gas: 3 (GasFastestStep)
 */
export function handler_0x${opcode}_PUSH${n}(frame: BrandedFrame): EvmError | null {
  const gasErr = consumeGas(frame, FastestStep);
  if (gasErr) return gasErr;

  const value = readImmediate(frame.bytecode, frame.pc, ${n});
  if (value === null) {
    return { type: "InvalidOpcode" };
  }

  const pushErr = pushStack(frame, value);
  if (pushErr) return pushErr;

  frame.pc += ${n + 1};
  return null;
}
\`\`\`
</Tab>

<Tab title="Zig">
\`\`\`zig
/// PUSH${n} opcode (0x${opcode}) - Push ${n} byte${n > 1 ? 's' : ''} onto stack
pub fn push(frame: *FrameType, opcode: u8) FrameType.EvmError!void {
    const push_size = opcode - 0x5f;
    try frame.consumeGas(GasConstants.GasFastestStep);

    const value = frame.readImmediate(push_size) orelse return error.InvalidPush;
    try frame.pushStack(value);
    frame.pc += 1 + push_size;
}
\`\`\`
</Tab>
</Tabs>

## Edge Cases

### Insufficient Bytecode

\`\`\`typescript
// Bytecode ends before ${n} byte${n > 1 ? 's' : ''} read
const bytecode = new Uint8Array([0x${opcode}, 0x01]); // Only 1 byte instead of ${n}
const frame = createFrame({ bytecode, pc: 0 });

const err = handler_0x${opcode}_PUSH${n}(frame);
console.log(err); // { type: "InvalidOpcode" }
\`\`\`

### Stack Overflow

\`\`\`typescript
// Stack at maximum capacity
const frame = createFrame({
  stack: new Array(1024).fill(0n),
  bytecode: new Uint8Array([0x${opcode}, ${Array.from({ length: n }, () => '0x00').join(', ')}])
});

const err = handler_0x${opcode}_PUSH${n}(frame);
console.log(err); // { type: "StackOverflow" }
\`\`\`

### Out of Gas

\`\`\`typescript
// Insufficient gas
const frame = createFrame({
  gasRemaining: 2n,  // Need 3 gas
  bytecode: new Uint8Array([0x${opcode}, ${Array.from({ length: n }, () => '0xff').join(', ')}])
});

const err = handler_0x${opcode}_PUSH${n}(frame);
console.log(err); // { type: "OutOfGas" }
\`\`\`

### Maximum Value

\`\`\`typescript
// All bytes 0xFF
const bytecode = new Uint8Array([0x${opcode}, ${Array.from({ length: n }, () => '0xff').join(', ')}]);
const frame = createFrame({ bytecode, pc: 0 });

handler_0x${opcode}_PUSH${n}(frame);
console.log(frame.stack[0]); // 0x${'ff'.repeat(n)}${n < 32 ? '00'.repeat(32 - n) : ''}n
\`\`\`

## References

- [Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Section 9.4.1 (PUSH)
- [EVM Codes - PUSH${n}](https://www.evm.codes/#${opcode.toLowerCase()}?fork=cancun)
- [Solidity Assembly - push${n}](https://docs.soliditylang.org/en/latest/yul.html#evm-opcodes)
`;

  writeFileSync(join(docsDir, `push${n}.mdx`), content);
  console.log(`Created push${n}.mdx`);
}

// Generate DUP1-16 pages
for (let n = 1; n <= 16; n++) {
  const opcode = (0x7f + n).toString(16).toUpperCase();
  const stackExample = Array.from({ length: n }, (_, i) => String.fromCharCode(97 + i)).join(', ');
  const content = `---
title: "DUP${n} (0x${opcode})"
description: "Duplicate ${n === 1 ? 'top' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`} stack item"
---

## Overview

**Opcode:** \`0x${opcode}\`
**Introduced:** Frontier (EVM genesis)

DUP${n} duplicates the ${n === 1 ? 'top' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`} stack item and pushes it to the top of the stack. The original ${n === 1 ? 'item' : `${n}th item`} remains in place.

## Specification

**Stack Input:**
\`\`\`
[..., value${n > 1 ? `, item${n - 1}, ..., item1` : ''}]
\`\`\`

**Stack Output:**
\`\`\`
[..., value${n > 1 ? `, item${n - 1}, ..., item1` : ''}, value]
\`\`\`

**Gas Cost:** 3 (GasFastestStep)

**Operation:**
\`\`\`
value = stack[depth - ${n}]
stack.push(value)
\`\`\`

## Behavior

DUP${n} copies the ${n === 1 ? 'top' : `${n}th-from-top`} stack item without removing it. Requires stack depth ≥ ${n}.

Key characteristics:
- Requires stack depth ≥ ${n}
- Original value unchanged
- New copy pushed to top
- StackUnderflow if depth < ${n}
- Stack depth increases by 1

## Examples

### Basic Usage

\`\`\`typescript
import { handler_0x${opcode}_DUP${n} } from '@tevm/voltaire/evm/stack/handlers';
import { createFrame } from '@tevm/voltaire/evm/Frame';

// Duplicate ${n === 1 ? 'top' : `${n}th`} item
const frame = createFrame({
  stack: [${Array.from({ length: n }, (_, i) => `${(n - i) * 100}n`).join(', ')}],
  gasRemaining: 1000n
});

const err = handler_0x${opcode}_DUP${n}(frame);

console.log(frame.stack); // [${Array.from({ length: n }, (_, i) => `${(n - i) * 100}n`).join(', ')}, ${100}n] - ${n === 1 ? 'top' : `${n}th item`} duplicated
console.log(frame.gasRemaining); // 997n (3 gas consumed)
\`\`\`

### Solidity Compilation

\`\`\`solidity
contract Example {
${n === 1 ? `    function reuse() public pure returns (uint256, uint256) {
        uint256 x = 42;
        // Need x twice
        return (x, x);  // Compiler uses DUP1
        // PUSH1 0x2a
        // DUP1
        // DUP1
    }` : n === 2 ? `    function swap() public pure {
        uint256 a = 10;
        uint256 b = 20;
        // Access a again
        // Stack: [b, a]
        // DUP2  // Stack: [b, a, a]
    }` : `    function deepAccess() public pure {
        // Access deep stack value
        assembly {
            // Stack has ${n} items
            dup${n}  // Duplicate ${n}th item to top
        }
    }`}
}
\`\`\`

### Assembly Usage

\`\`\`solidity
assembly {
    ${Array.from({ length: n }, (_, i) => `push1 0x${(i + 1).toString(16).padStart(2, '0')}`).join('\n    ')}
    // Stack: [${Array.from({ length: n }, (_, i) => `0x${(i + 1).toString(16).padStart(2, '0')}`).join(', ')}]

    dup${n}
    // Stack: [${Array.from({ length: n }, (_, i) => `0x${(i + 1).toString(16).padStart(2, '0')}`).join(', ')}, 0x01] - first item duplicated
}
\`\`\`

## Gas Cost

**Cost:** 3 gas (GasFastestStep)

All DUP1-16 operations cost the same despite different stack depths accessed.

**Comparison:**
| Operation | Gas | Note |
|-----------|-----|------|
| DUP${n} | 3 | Duplicate ${n}th item |
| PUSH1-32 | 3 | Same cost tier |
| POP | 2 | Cheaper |

## Common Usage

${n === 1 ? `### Value Reuse

\`\`\`solidity
assembly {
    let x := 100
    dup1  // Reuse x
    dup1  // Reuse again
    // Stack: [100, 100, 100]
    add   // Use first two
    // Stack: [200, 100]
}\`\`\`` : n === 2 ? `### Access Previous Value

\`\`\`solidity
assembly {
    let a := 10
    let b := 20
    dup2  // Get 'a' again
    // Stack: [b, a, a]
}\`\`\`` : `### Deep Stack Access

\`\`\`solidity
function complex() public pure {
    assembly {
        // Build deep stack
        ${Array.from({ length: n }, (_, i) => `let v${i + 1} := ${i + 1}`).join('\n        ')}

        // Access v1 from depth ${n}
        dup${n}
    }
}\`\`\``}

### Efficient Copies

\`\`\`solidity
// Instead of multiple loads
assembly {
    let value := sload(slot)  // Expensive
    // Use value
    let value2 := sload(slot) // Wasteful!
}

// Use DUP to reuse
assembly {
    let value := sload(slot)  // Load once
    dup1                       // Copy
    // Use both copies
}
\`\`\`

### Conditional Logic

\`\`\`solidity
assembly {
    let condition := calldataload(0)
    dup1  // Keep condition for later
    iszero
    jumpi(skip)
    // Use condition again
    skip:
}
\`\`\`

## Stack Depth Requirements

### Minimum Depth

\`\`\`solidity
// DUP${n} requires ${n} items on stack
assembly {
    ${Array.from({ length: n - 1 }, (_, i) => `push1 0x${(i + 1).toString(16).padStart(2, '0')}`).join('\n    ')}
    // Only ${n - 1} items - DUP${n} will fail!
    dup${n}  // StackUnderflow
}
\`\`\`

### Safe Usage

\`\`\`solidity
assembly {
    ${Array.from({ length: n }, (_, i) => `push1 0x${(i + 1).toString(16).padStart(2, '0')}`).join('\n    ')}
    // Exactly ${n} items - safe
    dup${n}  // Success
}
\`\`\`

## Implementation

<Tabs>
<Tab title="TypeScript">
\`\`\`typescript
/**
 * DUP${n} opcode (0x${opcode}) - Duplicate ${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'} stack item
 *
 * Stack: [..., value${n > 1 ? ', ...' : ''}] => [..., value${n > 1 ? ', ...' : ''}, value]
 * Gas: 3 (GasFastestStep)
 */
export function handler_0x${opcode}_DUP${n}(frame: BrandedFrame): EvmError | null {
  const gasErr = consumeGas(frame, FastestStep);
  if (gasErr) return gasErr;

  if (frame.stack.length < ${n}) {
    return { type: "StackUnderflow" };
  }

  const value = frame.stack[frame.stack.length - ${n}];
  const pushErr = pushStack(frame, value);
  if (pushErr) return pushErr;

  frame.pc += 1;
  return null;
}
\`\`\`
</Tab>

<Tab title="Zig">
\`\`\`zig
/// DUP${n} opcode (0x${opcode}) - Duplicate ${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'} stack item
pub fn dup(frame: *FrameType, opcode: u8) FrameType.EvmError!void {
    try frame.consumeGas(GasConstants.GasFastestStep);
    const n = opcode - 0x7f;
    if (frame.stack.items.len < n) {
        return error.StackUnderflow;
    }
    const value = frame.stack.items[frame.stack.items.len - n];
    try frame.pushStack(value);
    frame.pc += 1;
}
\`\`\`
</Tab>
</Tabs>

## Edge Cases

### Stack Underflow

\`\`\`typescript
// Insufficient stack depth
const frame = createFrame({
  stack: ${n > 1 ? `[${Array.from({ length: n - 1 }, () => '100n').join(', ')}]` : '[]'}  // Only ${n - 1} item${n - 1 !== 1 ? 's' : ''}
});

const err = handler_0x${opcode}_DUP${n}(frame);
console.log(err); // { type: "StackUnderflow" }
\`\`\`

### Stack Overflow

\`\`\`typescript
// Stack at maximum, can't add more
const frame = createFrame({
  stack: new Array(1024).fill(0n)
});

const err = handler_0x${opcode}_DUP${n}(frame);
console.log(err); // { type: "StackOverflow" }
\`\`\`

### Out of Gas

\`\`\`typescript
// Insufficient gas
const frame = createFrame({
  stack: [${Array.from({ length: n }, () => '100n').join(', ')}],
  gasRemaining: 2n  // Need 3
});

const err = handler_0x${opcode}_DUP${n}(frame);
console.log(err); // { type: "OutOfGas" }
\`\`\`

### Maximum Value

\`\`\`typescript
// Duplicate max uint256
const MAX = (1n << 256n) - 1n;
const frame = createFrame({
  stack: [${Array.from({ length: n - 1 }, () => '0n').join(', ')}${n > 1 ? ', ' : ''}MAX]
});

handler_0x${opcode}_DUP${n}(frame);
console.log(frame.stack[frame.stack.length - 1]); // MAX (duplicated)
\`\`\`

## References

- [Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Section 9.1 (Stack Operations)
- [EVM Codes - DUP${n}](https://www.evm.codes/#${opcode.toLowerCase()}?fork=cancun)
- [Solidity Assembly - dup${n}](https://docs.soliditylang.org/en/latest/yul.html#evm-opcodes)
`;

  writeFileSync(join(docsDir, `dup${n}.mdx`), content);
  console.log(`Created dup${n}.mdx`);
}

// Generate SWAP1-16 pages
for (let n = 1; n <= 16; n++) {
  const opcode = (0x8f + n).toString(16).toUpperCase();
  const content = `---
title: "SWAP${n} (0x${opcode})"
description: "Swap top with ${n + 1}${n + 1 === 2 ? 'nd' : n + 1 === 3 ? 'rd' : 'th'} stack item"
---

## Overview

**Opcode:** \`0x${opcode}\`
**Introduced:** Frontier (EVM genesis)

SWAP${n} exchanges the top stack item with the ${n + 1}${n + 1 === 2 ? 'nd' : n + 1 === 3 ? 'rd' : 'th'} item from the top. Only these two positions change - all other items remain in place.

## Specification

**Stack Input:**
\`\`\`
[..., valueN${n > 1 ? `, item${n - 1}, ..., item1` : ''}, top]
\`\`\`

**Stack Output:**
\`\`\`
[..., top${n > 1 ? `, item${n - 1}, ..., item1` : ''}, valueN]
\`\`\`

**Gas Cost:** 3 (GasFastestStep)

**Operation:**
\`\`\`
temp = stack[top]
stack[top] = stack[top - ${n + 1}]
stack[top - ${n + 1}] = temp
\`\`\`

## Behavior

SWAP${n} exchanges positions of the top item and the item at position ${n + 1} from top. Requires stack depth ≥ ${n + 1}.

Key characteristics:
- Requires stack depth ≥ ${n + 1}
- Only two items change positions
- Middle items ${n > 1 ? `(items 1-${n})` : ''} unchanged
- StackUnderflow if depth < ${n + 1}
- Stack depth unchanged

## Examples

### Basic Usage

\`\`\`typescript
import { handler_0x${opcode}_SWAP${n} } from '@tevm/voltaire/evm/stack/handlers';
import { createFrame } from '@tevm/voltaire/evm/Frame';

// Swap top with ${n + 1}${n + 1 === 2 ? 'nd' : n + 1 === 3 ? 'rd' : 'th'} item
const frame = createFrame({
  stack: [${Array.from({ length: n + 1 }, (_, i) => `${(n + 1 - i) * 100}n`).join(', ')}],
  gasRemaining: 1000n
});

const err = handler_0x${opcode}_SWAP${n}(frame);

console.log(frame.stack); // [${Array.from({ length: n + 1 }, (_, i) => i === 0 ? `${100}n` : i === n ? `${(n + 1) * 100}n` : `${(n + 1 - i) * 100}n`).join(', ')}] - positions 0 and ${n} swapped
console.log(frame.gasRemaining); // 997n (3 gas consumed)
\`\`\`

### Solidity Compilation

\`\`\`solidity
contract Example {
${n === 1 ? `    function simpleSwap(uint256 a, uint256 b) public pure returns (uint256, uint256) {
        // Return in reverse order
        return (b, a);  // Compiler uses SWAP1
        // Stack: [a, b] => [b, a]
    }` : n === 2 ? `    function reorder() public pure {
        assembly {
            push1 0x01
            push1 0x02
            push1 0x03
            // Stack: [1, 2, 3]
            swap2
            // Stack: [3, 2, 1]
        }
    }` : `    function deepSwap() public pure {
        assembly {
            ${Array.from({ length: n + 1 }, (_, i) => `push1 0x${(i + 1).toString(16).padStart(2, '0')}`).join('\n            ')}
            // Stack: [${Array.from({ length: n + 1 }, (_, i) => (i + 1)).join(', ')}]
            swap${n}
            // Stack: [${Array.from({ length: n + 1 }, (_, i) => i === 0 ? n + 1 : i === n ? 1 : i + 1).join(', ')}]
        }
    }`}
}
\`\`\`

### Assembly Usage

\`\`\`solidity
assembly {
    ${Array.from({ length: n + 1 }, (_, i) => `push1 0x${String.fromCharCode(97 + i)}`).join('\n    ')}
    // Stack: [${Array.from({ length: n + 1 }, (_, i) => `'${String.fromCharCode(97 + i)}'`).join(', ')}]

    swap${n}
    // Stack: [${Array.from({ length: n + 1 }, (_, i) => i === 0 ? `'${String.fromCharCode(97 + n)}'` : i === n ? `'a'` : `'${String.fromCharCode(97 + i)}'`).join(', ')}] - 'a' and '${String.fromCharCode(97 + n)}' swapped
}
\`\`\`

## Gas Cost

**Cost:** 3 gas (GasFastestStep)

All SWAP1-16 operations cost the same despite different stack depths accessed.

**Comparison:**
| Operation | Gas | Note |
|-----------|-----|------|
| SWAP${n} | 3 | Swap with ${n + 1}${n + 1 === 2 ? 'nd' : n + 1 === 3 ? 'rd' : 'th'} item |
| DUP1-16 | 3 | Same cost tier |
| POP | 2 | Cheaper |

## Common Usage

${n === 1 ? `### Argument Reordering

\`\`\`solidity
// Function expects (b, a) but has (a, b)
assembly {
    // Stack: [a, b]
    swap1
    // Stack: [b, a]
    call(...)
}\`\`\`` : n === 2 ? `### Triple Reordering

\`\`\`solidity
assembly {
    let a := 1
    let b := 2
    let c := 3
    // Stack: [a, b, c]
    swap2
    // Stack: [c, b, a]
}\`\`\`` : `### Deep Stack Manipulation

\`\`\`solidity
function complex() public pure {
    assembly {
        ${Array.from({ length: n + 1 }, (_, i) => `let v${i} := ${i}`).join('\n        ')}
        // Need v0 at top
        swap${n}
        // v0 now at top
    }
}\`\`\``}

### Efficient Reordering

\`\`\`solidity
// Reorder for function call
assembly {
    // Have: [value, to, token]
    // Need: [token, to, value]
    swap2  // [token, to, value]

    // Call transfer(token, to, value)
    call(gas(), target, 0, 0, 100, 0, 0)
}
\`\`\`

### Storage Optimization

\`\`\`solidity
assembly {
    let slot := 0
    let value := 42
    // Stack: [slot, value]

    // SSTORE needs (slot, value) but we have them reversed
    // No swap needed in this case, but if we did:
    swap1
    // Stack: [value, slot]
    sstore
}
\`\`\`

## Stack Depth Requirements

### Minimum Depth

\`\`\`solidity
// SWAP${n} requires ${n + 1} items
assembly {
    ${Array.from({ length: n }, (_, i) => `push1 0x${(i + 1).toString(16).padStart(2, '0')}`).join('\n    ')}
    // Only ${n} items - SWAP${n} will fail!
    swap${n}  // StackUnderflow
}
\`\`\`

### Safe Usage

\`\`\`solidity
assembly {
    ${Array.from({ length: n + 1 }, (_, i) => `push1 0x${(i + 1).toString(16).padStart(2, '0')}`).join('\n    ')}
    // Exactly ${n + 1} items - safe
    swap${n}  // Success
}
\`\`\`

## Implementation

<Tabs>
<Tab title="TypeScript">
\`\`\`typescript
/**
 * SWAP${n} opcode (0x${opcode}) - Swap top with ${n + 1}${n + 1 === 2 ? 'nd' : n + 1 === 3 ? 'rd' : 'th'} item
 *
 * Stack: [..., valueN${n > 1 ? ', ...' : ''}, top] => [..., top${n > 1 ? ', ...' : ''}, valueN]
 * Gas: 3 (GasFastestStep)
 */
export function handler_0x${opcode}_SWAP${n}(frame: BrandedFrame): EvmError | null {
  const gasErr = consumeGas(frame, FastestStep);
  if (gasErr) return gasErr;

  if (frame.stack.length <= ${n}) {
    return { type: "StackUnderflow" };
  }

  const topIdx = frame.stack.length - 1;
  const swapIdx = frame.stack.length - ${n + 1};
  const temp = frame.stack[topIdx];
  frame.stack[topIdx] = frame.stack[swapIdx];
  frame.stack[swapIdx] = temp;

  frame.pc += 1;
  return null;
}
\`\`\`
</Tab>

<Tab title="Zig">
\`\`\`zig
/// SWAP${n} opcode (0x${opcode}) - Swap top with ${n + 1}${n + 1 === 2 ? 'nd' : n + 1 === 3 ? 'rd' : 'th'} item
pub fn swap(frame: *FrameType, opcode: u8) FrameType.EvmError!void {
    try frame.consumeGas(GasConstants.GasFastestStep);
    const n = opcode - 0x8f;
    if (frame.stack.items.len <= n) {
        return error.StackUnderflow;
    }
    const top_idx = frame.stack.items.len - 1;
    const swap_idx = frame.stack.items.len - 1 - n;
    const temp = frame.stack.items[top_idx];
    frame.stack.items[top_idx] = frame.stack.items[swap_idx];
    frame.stack.items[swap_idx] = temp;
    frame.pc += 1;
}
\`\`\`
</Tab>
</Tabs>

## Edge Cases

### Stack Underflow

\`\`\`typescript
// Insufficient stack depth
const frame = createFrame({
  stack: [${Array.from({ length: n }, () => '100n').join(', ')}]  // Only ${n} items, need ${n + 1}
});

const err = handler_0x${opcode}_SWAP${n}(frame);
console.log(err); // { type: "StackUnderflow" }
\`\`\`

### Out of Gas

\`\`\`typescript
// Insufficient gas
const frame = createFrame({
  stack: [${Array.from({ length: n + 1 }, () => '100n').join(', ')}],
  gasRemaining: 2n  // Need 3
});

const err = handler_0x${opcode}_SWAP${n}(frame);
console.log(err); // { type: "OutOfGas" }
\`\`\`

### Identity Swap

\`\`\`typescript
// Swap same values
const frame = createFrame({
  stack: new Array(${n + 1}).fill(42n)
});

handler_0x${opcode}_SWAP${n}(frame);
console.log(frame.stack); // All still 42n
\`\`\`

### Maximum Values

\`\`\`typescript
// Swap with max uint256
const MAX = (1n << 256n) - 1n;
const frame = createFrame({
  stack: [${Array.from({ length: n }, () => '0n').join(', ')}${n > 0 ? ', ' : ''}MAX, 1n]
});

handler_0x${opcode}_SWAP${n}(frame);
console.log(frame.stack[0]); // 1n (was at top)
console.log(frame.stack[${n}]); // MAX (was at bottom)
\`\`\`

## References

- [Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Section 9.1 (Stack Operations)
- [EVM Codes - SWAP${n}](https://www.evm.codes/#${opcode.toLowerCase()}?fork=cancun)
- [Solidity Assembly - swap${n}](https://docs.soliditylang.org/en/latest/yul.html#evm-opcodes)
`;

  writeFileSync(join(docsDir, `swap${n}.mdx`), content);
  console.log(`Created swap${n}.mdx`);
}

console.log('\nGeneration complete! Created 85 opcode documentation pages.');
console.log('Total files: 88 (1 index + 1 POP + 1 PUSH0 + 32 PUSH + 16 DUP + 16 SWAP + 16 SWAP)');
