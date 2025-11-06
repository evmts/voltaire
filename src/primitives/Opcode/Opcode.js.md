---
title: "Opcode.js"
---

# Opcode.js

EVM opcode namespace providing constants, metadata, and bytecode analysis utilities.

## Namespace

```typescript
Opcode(value: number): BrandedOpcode
```

Identity function for type branding. Returns branded opcode.

**Parameters:**
- `value`: Byte value (0x00-0xFF)

**Returns:** BrandedOpcode

## Constants

### Arithmetic (0x00-0x0b)
- [STOP](./BrandedOpcode/constants.js.md#stop) = 0x00
- [ADD](./BrandedOpcode/constants.js.md#add) = 0x01
- [MUL](./BrandedOpcode/constants.js.md#mul) = 0x02
- [SUB](./BrandedOpcode/constants.js.md#sub) = 0x03
- [DIV](./BrandedOpcode/constants.js.md#div) = 0x04
- [SDIV](./BrandedOpcode/constants.js.md#sdiv) = 0x05
- [MOD](./BrandedOpcode/constants.js.md#mod) = 0x06
- [SMOD](./BrandedOpcode/constants.js.md#smod) = 0x07
- [ADDMOD](./BrandedOpcode/constants.js.md#addmod) = 0x08
- [MULMOD](./BrandedOpcode/constants.js.md#mulmod) = 0x09
- [EXP](./BrandedOpcode/constants.js.md#exp) = 0x0a
- [SIGNEXTEND](./BrandedOpcode/constants.js.md#signextend) = 0x0b

### Comparison & Bitwise (0x10-0x1d)
- [LT](./BrandedOpcode/constants.js.md#lt), [GT](./BrandedOpcode/constants.js.md#gt), [SLT](./BrandedOpcode/constants.js.md#slt), [SGT](./BrandedOpcode/constants.js.md#sgt)
- [EQ](./BrandedOpcode/constants.js.md#eq), [ISZERO](./BrandedOpcode/constants.js.md#iszero)
- [AND](./BrandedOpcode/constants.js.md#and), [OR](./BrandedOpcode/constants.js.md#or), [XOR](./BrandedOpcode/constants.js.md#xor), [NOT](./BrandedOpcode/constants.js.md#not)
- [BYTE](./BrandedOpcode/constants.js.md#byte)
- [SHL](./BrandedOpcode/constants.js.md#shl), [SHR](./BrandedOpcode/constants.js.md#shr), [SAR](./BrandedOpcode/constants.js.md#sar)

### Crypto (0x20)
- [KECCAK256](./BrandedOpcode/constants.js.md#keccak256) = 0x20

### Environment (0x30-0x3f)
- [ADDRESS](./BrandedOpcode/constants.js.md#address), [BALANCE](./BrandedOpcode/constants.js.md#balance), [ORIGIN](./BrandedOpcode/constants.js.md#origin), [CALLER](./BrandedOpcode/constants.js.md#caller)
- [CALLVALUE](./BrandedOpcode/constants.js.md#callvalue), [CALLDATALOAD](./BrandedOpcode/constants.js.md#calldataload), [CALLDATASIZE](./BrandedOpcode/constants.js.md#calldatasize), [CALLDATACOPY](./BrandedOpcode/constants.js.md#calldatacopy)
- [CODESIZE](./BrandedOpcode/constants.js.md#codesize), [CODECOPY](./BrandedOpcode/constants.js.md#codecopy), [GASPRICE](./BrandedOpcode/constants.js.md#gasprice)
- [EXTCODESIZE](./BrandedOpcode/constants.js.md#extcodesize), [EXTCODECOPY](./BrandedOpcode/constants.js.md#extcodecopy), [EXTCODEHASH](./BrandedOpcode/constants.js.md#extcodehash)
- [RETURNDATASIZE](./BrandedOpcode/constants.js.md#returndatasize), [RETURNDATACOPY](./BrandedOpcode/constants.js.md#returndatacopy)

### Block Info (0x40-0x4a)
- [BLOCKHASH](./BrandedOpcode/constants.js.md#blockhash), [COINBASE](./BrandedOpcode/constants.js.md#coinbase), [TIMESTAMP](./BrandedOpcode/constants.js.md#timestamp), [NUMBER](./BrandedOpcode/constants.js.md#number)
- [DIFFICULTY](./BrandedOpcode/constants.js.md#difficulty), [GASLIMIT](./BrandedOpcode/constants.js.md#gaslimit), [CHAINID](./BrandedOpcode/constants.js.md#chainid)
- [SELFBALANCE](./BrandedOpcode/constants.js.md#selfbalance), [BASEFEE](./BrandedOpcode/constants.js.md#basefee)
- [BLOBHASH](./BrandedOpcode/constants.js.md#blobhash), [BLOBBASEFEE](./BrandedOpcode/constants.js.md#blobbasefee)

### Stack/Memory/Storage (0x50-0x5e)
- [POP](./BrandedOpcode/constants.js.md#pop), [MLOAD](./BrandedOpcode/constants.js.md#mload), [MSTORE](./BrandedOpcode/constants.js.md#mstore), [MSTORE8](./BrandedOpcode/constants.js.md#mstore8)
- [SLOAD](./BrandedOpcode/constants.js.md#sload), [SSTORE](./BrandedOpcode/constants.js.md#sstore)
- [JUMP](./BrandedOpcode/constants.js.md#jump), [JUMPI](./BrandedOpcode/constants.js.md#jumpi), [JUMPDEST](./BrandedOpcode/constants.js.md#jumpdest)
- [PC](./BrandedOpcode/constants.js.md#pc), [MSIZE](./BrandedOpcode/constants.js.md#msize), [GAS](./BrandedOpcode/constants.js.md#gas)
- [TLOAD](./BrandedOpcode/constants.js.md#tload), [TSTORE](./BrandedOpcode/constants.js.md#tstore), [MCOPY](./BrandedOpcode/constants.js.md#mcopy)
- [PUSH0](./BrandedOpcode/constants.js.md#push0) = 0x5f

### PUSH (0x60-0x7f)
[PUSH1](./BrandedOpcode/constants.js.md#push) through [PUSH32](./BrandedOpcode/constants.js.md#push) - Push 1-32 bytes

### DUP (0x80-0x8f)
[DUP1](./BrandedOpcode/constants.js.md#dup) through [DUP16](./BrandedOpcode/constants.js.md#dup) - Duplicate stack items

### SWAP (0x90-0x9f)
[SWAP1](./BrandedOpcode/constants.js.md#swap) through [SWAP16](./BrandedOpcode/constants.js.md#swap) - Swap stack items

### LOG (0xa0-0xa4)
[LOG0](./BrandedOpcode/constants.js.md#log) through [LOG4](./BrandedOpcode/constants.js.md#log) - Emit logs with 0-4 topics

### System (0xf0-0xff)
- [CREATE](./BrandedOpcode/constants.js.md#create), [CREATE2](./BrandedOpcode/constants.js.md#create2)
- [CALL](./BrandedOpcode/constants.js.md#call), [CALLCODE](./BrandedOpcode/constants.js.md#callcode), [DELEGATECALL](./BrandedOpcode/constants.js.md#delegatecall), [STATICCALL](./BrandedOpcode/constants.js.md#staticcall)
- [AUTH](./BrandedOpcode/constants.js.md#auth), [AUTHCALL](./BrandedOpcode/constants.js.md#authcall) (EIP-3074)
- [RETURN](./BrandedOpcode/constants.js.md#return), [REVERT](./BrandedOpcode/constants.js.md#revert)
- [INVALID](./BrandedOpcode/constants.js.md#invalid), [SELFDESTRUCT](./BrandedOpcode/constants.js.md#selfdestruct)

## Metadata

### [Opcode.info(opcode)](./BrandedOpcode/info.js.md)
```typescript
info(opcode: BrandedOpcode): Info | undefined
```
Get opcode metadata (gas cost, stack requirements, name).

### [Opcode.name(opcode)](./BrandedOpcode/name.js.md)
```typescript
name(opcode: BrandedOpcode): string
```
Get opcode name. Returns "UNKNOWN" if invalid.

### [Opcode.isValid(opcode)](./BrandedOpcode/isValid.js.md)
```typescript
isValid(opcode: number): opcode is BrandedOpcode
```
Check if opcode is defined.

## Category Checks

### [Opcode.isPush(opcode)](./BrandedOpcode/isPush.js.md)
```typescript
isPush(opcode: BrandedOpcode): boolean
```
Check if PUSH0-PUSH32.

### [Opcode.isDup(opcode)](./BrandedOpcode/isDup.js.md)
```typescript
isDup(opcode: BrandedOpcode): boolean
```
Check if DUP1-DUP16.

### [Opcode.isSwap(opcode)](./BrandedOpcode/isSwap.js.md)
```typescript
isSwap(opcode: BrandedOpcode): boolean
```
Check if SWAP1-SWAP16.

### [Opcode.isLog(opcode)](./BrandedOpcode/isLog.js.md)
```typescript
isLog(opcode: BrandedOpcode): boolean
```
Check if LOG0-LOG4.

### [Opcode.isJump(opcode)](./BrandedOpcode/isJump.js.md)
```typescript
isJump(opcode: BrandedOpcode): boolean
```
Check if JUMP or JUMPI.

### [Opcode.isTerminating(opcode)](./BrandedOpcode/isTerminating.js.md)
```typescript
isTerminating(opcode: BrandedOpcode): boolean
```
Check if terminates execution (STOP, RETURN, REVERT, INVALID, SELFDESTRUCT).

## PUSH Operations

### [Opcode.pushBytes(opcode)](./BrandedOpcode/pushBytes.js.md)
```typescript
pushBytes(opcode: BrandedOpcode): number | undefined
```
Get number of bytes pushed (0-32). Returns undefined if not PUSH.

### [Opcode.pushOpcode(bytes)](./BrandedOpcode/pushOpcode.js.md)
```typescript
pushOpcode(bytes: number): BrandedOpcode
```
Get PUSH opcode for byte count (0-32).

**Throws:** If bytes not in 0-32 range

## DUP/SWAP/LOG Operations

### [Opcode.dupPosition(opcode)](./BrandedOpcode/dupPosition.js.md)
```typescript
dupPosition(opcode: BrandedOpcode): number | undefined
```
Get DUP position (1-16). Returns undefined if not DUP.

### [Opcode.swapPosition(opcode)](./BrandedOpcode/swapPosition.js.md)
```typescript
swapPosition(opcode: BrandedOpcode): number | undefined
```
Get SWAP position (1-16). Returns undefined if not SWAP.

### [Opcode.logTopics(opcode)](./BrandedOpcode/logTopics.js.md)
```typescript
logTopics(opcode: BrandedOpcode): number | undefined
```
Get LOG topic count (0-4). Returns undefined if not LOG.

## Bytecode Parsing

### [Opcode.parse(bytecode)](./BrandedOpcode/parse.js.md)
```typescript
parse(bytecode: Uint8Array): Instruction[]
```
Parse bytecode into instructions with offsets and immediate data.

### [Opcode.format(instruction)](./BrandedOpcode/format.js.md)
```typescript
format(instruction: Instruction): string
```
Format instruction to human-readable string.

### [Opcode.disassemble(bytecode)](./BrandedOpcode/disassemble.js.md)
```typescript
disassemble(bytecode: Uint8Array): string[]
```
Disassemble bytecode to formatted strings.

## Jump Destination Analysis

### [Opcode.jumpDests(bytecode)](./BrandedOpcode/jumpDests.js.md)
```typescript
jumpDests(bytecode: Uint8Array): Set<number>
```
Find all valid JUMPDEST locations.

### [Opcode.isValidJumpDest(bytecode, offset)](./BrandedOpcode/isValidJumpDest.js.md)
```typescript
isValidJumpDest(bytecode: Uint8Array, offset: number): boolean
```
Check if offset is valid jump destination.

## Example

```javascript
import { Opcode } from './Opcode.js';

// Get opcode info
const info = Opcode.info(Opcode.ADD);
console.log(info.name);        // "ADD"
console.log(info.gasCost);     // 3
console.log(info.stackInputs); // 2

// Category checks
Opcode.isPush(Opcode.PUSH1);    // true
Opcode.isJump(Opcode.JUMP);     // true

// Parse bytecode
const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
const instructions = Opcode.parse(bytecode);
// [
//   { offset: 0, opcode: PUSH1, immediate: [0x01] },
//   { offset: 2, opcode: PUSH1, immediate: [0x02] },
//   { offset: 4, opcode: ADD }
// ]

// Disassemble
const asm = Opcode.disassemble(bytecode);
console.log(asm.join('\n'));
// 0x0000: PUSH1 0x01
// 0x0002: PUSH1 0x02
// 0x0004: ADD

// Jump analysis
const code = new Uint8Array([0x5b, 0x60, 0x01, 0x5b]);
const dests = Opcode.jumpDests(code);  // Set { 0, 3 }
```

## Implementation

- Pure data namespace pattern
- No instance methods (operates on numbers)
- All functions use opcode as first parameter
- Tree-shakable exports
