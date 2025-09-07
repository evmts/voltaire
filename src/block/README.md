# Block Module

Ethereum block structure, validation, and processing implementation.

## Overview

This module handles all block-related functionality including block headers, bodies, validation rules, and consensus mechanisms.

## Components

### Core Files
- **block.zig** - Main block structure and methods
- **header.zig** - Block header structure and validation
- **body.zig** - Block body with transactions and receipts
- **validation.zig** - Block validation rules

## Key Structures

### Block
- Header information (number, hash, parent hash, etc.)
- Transaction list
- Uncle/ommer blocks
- State root
- Receipts root

### Block Header
- Parent hash
- Uncle hash
- Coinbase address
- State root
- Transactions root
- Receipts root
- Logs bloom
- Difficulty
- Number
- Gas limit
- Gas used
- Timestamp
- Extra data
- Mix hash
- Nonce

## Features

- Block validation according to consensus rules
- Header verification
- Transaction inclusion verification
- State transition validation
- Uncle block validation
- Difficulty calculation

## Usage

```zig
const block = @import("block");
const Block = block.Block;
const Header = block.Header;
```

## Consensus Support

- Proof of Work validation
- EIP-1559 base fee calculation
- London hardfork support
- Merge transition handling