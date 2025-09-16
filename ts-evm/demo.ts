#!/usr/bin/env bun
import { createEvm, call } from './src/evm';
import type { ReturnData } from './src/frame/call_result';

function hex(b: Uint8Array): string {
  return [...b].map(x => x.toString(16).padStart(2,'0')).join('');
}

console.log("TypeScript EVM Demo - Stack-Only Operations\n");

// Demo 1: Simple Addition
{
  console.log("Demo 1: PUSH1 1; PUSH1 2; ADD; RETURN");
  const PUSH1 = 0x60, ADD = 0x01, RETURN = 0xf3;
  const bytecode = new Uint8Array([PUSH1, 0x01, PUSH1, 0x02, ADD, RETURN]);
  
  const evm = createEvm();
  const res = call(evm, { bytecode });
  
  if (!(res instanceof Error)) {
    const data = (res as ReturnData).data;
    console.log(`Result: 0x${hex(data)}`);
    console.log(`Decimal: ${data[31]}\n`);
  }
}

// Demo 2: Complex Arithmetic
{
  console.log("Demo 2: (5 * 7) - (3 + 2) = 30");
  const PUSH1 = 0x60, MUL = 0x02, ADD = 0x01, SUB = 0x03, RETURN = 0xf3;
  const bytecode = new Uint8Array([
    PUSH1, 0x05,  // Push 5
    PUSH1, 0x07,  // Push 7
    MUL,          // 5 * 7 = 35
    PUSH1, 0x03,  // Push 3
    PUSH1, 0x02,  // Push 2
    ADD,          // 3 + 2 = 5
    SUB,          // 35 - 5 = 30
    RETURN
  ]);
  
  const evm = createEvm();
  const res = call(evm, { bytecode });
  
  if (!(res instanceof Error)) {
    const data = (res as ReturnData).data;
    console.log(`Result: 0x${hex(data)}`);
    console.log(`Decimal: ${data[31]}\n`);
  }
}

// Demo 3: Bitwise Operations
{
  console.log("Demo 3: Bitwise AND of 0xFF and 0x0F");
  const PUSH1 = 0x60, AND = 0x16, RETURN = 0xf3;
  const bytecode = new Uint8Array([
    PUSH1, 0xFF,  // Push 255
    PUSH1, 0x0F,  // Push 15
    AND,          // 0xFF & 0x0F = 0x0F
    RETURN
  ]);
  
  const evm = createEvm();
  const res = call(evm, { bytecode });
  
  if (!(res instanceof Error)) {
    const data = (res as ReturnData).data;
    console.log(`Result: 0x${hex(data)}`);
    console.log(`Decimal: ${data[31]}\n`);
  }
}

// Demo 4: Stack Operations with DUP and SWAP
{
  console.log("Demo 4: DUP and SWAP operations");
  const PUSH1 = 0x60, DUP2 = 0x81, SWAP1 = 0x90, ADD = 0x01, RETURN = 0xf3;
  const bytecode = new Uint8Array([
    PUSH1, 0x0A,  // Push 10
    PUSH1, 0x14,  // Push 20
    DUP2,         // Duplicate 10 -> stack: [10, 20, 10]
    ADD,          // 20 + 10 = 30 -> stack: [10, 30]
    SWAP1,        // Swap -> stack: [30, 10]
    ADD,          // 30 + 10 = 40
    RETURN
  ]);
  
  const evm = createEvm();
  const res = call(evm, { bytecode });
  
  if (!(res instanceof Error)) {
    const data = (res as ReturnData).data;
    console.log(`Result: 0x${hex(data)}`);
    console.log(`Decimal: ${data[31]}\n`);
  }
}

// Demo 5: Comparison Operations
{
  console.log("Demo 5: Comparison - Is 10 > 5?");
  const PUSH1 = 0x60, GT = 0x11, RETURN = 0xf3;
  const bytecode = new Uint8Array([
    PUSH1, 0x0A,  // Push 10
    PUSH1, 0x05,  // Push 5
    GT,           // 10 > 5 = 1
    RETURN
  ]);
  
  const evm = createEvm();
  const res = call(evm, { bytecode });
  
  if (!(res instanceof Error)) {
    const data = (res as ReturnData).data;
    console.log(`Result: 0x${hex(data)}`);
    console.log(`Boolean: ${data[31] === 1 ? 'true' : 'false'}\n`);
  }
}

console.log("Demo complete! The TypeScript EVM successfully executes stack-only operations.");