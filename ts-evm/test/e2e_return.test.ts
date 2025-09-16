import { describe, it, expect } from 'bun:test';
import { createEvm, call } from '../src/evm';
import { ReturnData } from '../src/frame/call_result';

function hex(b: Uint8Array): string {
  return [...b].map(x => x.toString(16).padStart(2,'0')).join('');
}

describe('E2E: PUSH1 1; PUSH1 2; ADD; RETURN', () => {
  it('returns 0x03 as 32-byte big-endian', () => {
    const PUSH1 = 0x60, ADD = 0x01, RETURN = 0xf3;
    const bytecode = new Uint8Array([PUSH1, 0x01, PUSH1, 0x02, ADD, RETURN]);
    const evm = createEvm();
    const res = call(evm, { bytecode });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    expect((res as ReturnData).data.length).toBe(32);
    const lastByte = (res as ReturnData).data[31];
    expect(lastByte).toBe(0x03);
    
    // Verify all other bytes are 0
    for (let i = 0; i < 31; i++) {
      expect((res as ReturnData).data[i]).toBe(0);
    }
  });

  it('handles empty bytecode', () => {
    const evm = createEvm();
    const res = call(evm, { bytecode: new Uint8Array() });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    // Should execute STOP and return empty data
    expect((res as ReturnData).data.length).toBe(0);
  });

  it('handles stack underflow on RETURN', () => {
    const RETURN = 0xf3;
    const bytecode = new Uint8Array([RETURN]);
    const evm = createEvm();
    const res = call(evm, { bytecode });
    
    expect(res).toHaveProperty('_tag');
    expect((res as any)._tag).toBe('StackUnderflowError');
  });

  it('handles more complex arithmetic', () => {
    const PUSH1 = 0x60, MUL = 0x02, ADD = 0x01, SUB = 0x03, RETURN = 0xf3;
    // (5 * 7) - (3 + 2) = 35 - 5 = 30 = 0x1e
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
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const lastByte = (res as ReturnData).data[31];
    expect(lastByte).toBe(0x1e);
  });

  it('handles DUP and SWAP operations', () => {
    const PUSH1 = 0x60, DUP1 = 0x80, SWAP1 = 0x90, ADD = 0x01, RETURN = 0xf3;
    const bytecode = new Uint8Array([
      PUSH1, 0x03,  // Push 3
      PUSH1, 0x05,  // Push 5
      DUP1,         // Duplicate top (5) -> stack: [3, 5, 5]
      SWAP1,        // Swap top two -> stack: [3, 5, 5]
      ADD,          // Add top two -> stack: [3, 10]
      ADD,          // Add -> stack: [13]
      RETURN
    ]);
    
    const evm = createEvm();
    const res = call(evm, { bytecode });
    
    if (res instanceof Error) {
      throw new Error(`unexpected error: ${res.message}`);
    }
    
    const lastByte = (res as ReturnData).data[31];
    expect(lastByte).toBe(0x0d); // 13
  });
});