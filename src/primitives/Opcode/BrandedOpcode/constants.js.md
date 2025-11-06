---
title: "Opcode Constants"
---

# Opcode Constants

All EVM opcodes as BrandedOpcode constants.

## Arithmetic

### STOP
- Value: `0x00`
- Halts execution

### ADD
- Value: `0x01`
- Addition operation

### MUL
- Value: `0x02`
- Multiplication operation

### SUB
- Value: `0x03`
- Subtraction operation

### DIV
- Value: `0x04`
- Unsigned integer division

### SDIV
- Value: `0x05`
- Signed integer division

### MOD
- Value: `0x06`
- Modulo operation

### SMOD
- Value: `0x07`
- Signed modulo operation

### ADDMOD
- Value: `0x08`
- Modular addition

### MULMOD
- Value: `0x09`
- Modular multiplication

### EXP
- Value: `0x0a`
- Exponentiation

### SIGNEXTEND
- Value: `0x0b`
- Sign extension

## Comparison & Bitwise

### LT
- Value: `0x10`
- Less-than comparison

### GT
- Value: `0x11`
- Greater-than comparison

### SLT
- Value: `0x12`
- Signed less-than

### SGT
- Value: `0x13`
- Signed greater-than

### EQ
- Value: `0x14`
- Equality comparison

### ISZERO
- Value: `0x15`
- Is-zero check

### AND
- Value: `0x16`
- Bitwise AND

### OR
- Value: `0x17`
- Bitwise OR

### XOR
- Value: `0x18`
- Bitwise XOR

### NOT
- Value: `0x19`
- Bitwise NOT

### BYTE
- Value: `0x1a`
- Retrieve single byte

### SHL
- Value: `0x1b`
- Shift left

### SHR
- Value: `0x1c`
- Logical shift right

### SAR
- Value: `0x1d`
- Arithmetic shift right

## Crypto

### KECCAK256
- Value: `0x20`
- Keccak-256 hash

## Environment

### ADDRESS
- Value: `0x30`
- Current contract address

### BALANCE
- Value: `0x31`
- Get account balance

### ORIGIN
- Value: `0x32`
- Transaction originator

### CALLER
- Value: `0x33`
- Message sender

### CALLVALUE
- Value: `0x34`
- Message value

### CALLDATALOAD
- Value: `0x35`
- Load calldata

### CALLDATASIZE
- Value: `0x36`
- Calldata size

### CALLDATACOPY
- Value: `0x37`
- Copy calldata

### CODESIZE
- Value: `0x38`
- Code size

### CODECOPY
- Value: `0x39`
- Copy code

### GASPRICE
- Value: `0x3a`
- Gas price

### EXTCODESIZE
- Value: `0x3b`
- External code size

### EXTCODECOPY
- Value: `0x3c`
- Copy external code

### RETURNDATASIZE
- Value: `0x3d`
- Return data size

### RETURNDATACOPY
- Value: `0x3e`
- Copy return data

### EXTCODEHASH
- Value: `0x3f`
- External code hash

## Block Info

### BLOCKHASH
- Value: `0x40`
- Block hash

### COINBASE
- Value: `0x41`
- Block beneficiary

### TIMESTAMP
- Value: `0x42`
- Block timestamp

### NUMBER
- Value: `0x43`
- Block number

### DIFFICULTY
- Value: `0x44`
- Block difficulty / prevrandao

### GASLIMIT
- Value: `0x45`
- Block gas limit

### CHAINID
- Value: `0x46`
- Chain ID

### SELFBALANCE
- Value: `0x47`
- Current contract balance

### BASEFEE
- Value: `0x48`
- Base fee per gas

### BLOBHASH
- Value: `0x49`
- Blob versioned hash (EIP-4844)

### BLOBBASEFEE
- Value: `0x4a`
- Blob base fee (EIP-4844)

## Stack/Memory/Storage

### POP
- Value: `0x50`
- Pop from stack

### MLOAD
- Value: `0x51`
- Load from memory

### MSTORE
- Value: `0x52`
- Store to memory

### MSTORE8
- Value: `0x53`
- Store byte to memory

### SLOAD
- Value: `0x54`
- Load from storage

### SSTORE
- Value: `0x55`
- Store to storage

### JUMP
- Value: `0x56`
- Unconditional jump

### JUMPI
- Value: `0x57`
- Conditional jump

### PC
- Value: `0x58`
- Program counter

### MSIZE
- Value: `0x59`
- Memory size

### GAS
- Value: `0x5a`
- Available gas

### JUMPDEST
- Value: `0x5b`
- Jump destination

### TLOAD
- Value: `0x5c`
- Load from transient storage (EIP-1153)

### TSTORE
- Value: `0x5d`
- Store to transient storage (EIP-1153)

### MCOPY
- Value: `0x5e`
- Copy memory (EIP-5656)

### PUSH0
- Value: `0x5f`
- Push zero (EIP-3855)

## PUSH

### PUSH1-PUSH32
- Values: `0x60-0x7f`
- Push 1-32 bytes onto stack
- `PUSH1` = 0x60, `PUSH2` = 0x61, ..., `PUSH32` = 0x7f

## DUP

### DUP1-DUP16
- Values: `0x80-0x8f`
- Duplicate stack item at position 1-16
- `DUP1` = 0x80, `DUP2` = 0x81, ..., `DUP16` = 0x8f

## SWAP

### SWAP1-SWAP16
- Values: `0x90-0x9f`
- Swap stack items at position 1-16
- `SWAP1` = 0x90, `SWAP2` = 0x91, ..., `SWAP16` = 0x9f

## LOG

### LOG0-LOG4
- Values: `0xa0-0xa4`
- Emit log with 0-4 topics
- `LOG0` = 0xa0, `LOG1` = 0xa1, ..., `LOG4` = 0xa4

## System

### CREATE
- Value: `0xf0`
- Create contract

### CALL
- Value: `0xf1`
- Message call

### CALLCODE
- Value: `0xf2`
- Message call with alternative code (deprecated)

### RETURN
- Value: `0xf3`
- Halt and return output

### DELEGATECALL
- Value: `0xf4`
- Delegate message call

### CREATE2
- Value: `0xf5`
- Create contract with deterministic address

### AUTH
- Value: `0xf6`
- Authorize code from signed message (EIP-3074)

### AUTHCALL
- Value: `0xf7`
- Call with authorization (EIP-3074)

### STATICCALL
- Value: `0xfa`
- Static message call

### REVERT
- Value: `0xfd`
- Halt and revert state changes

### INVALID
- Value: `0xfe`
- Invalid instruction

### SELFDESTRUCT
- Value: `0xff`
- Destroy contract
