import { describe, it, expect } from 'bun:test';
import { compile } from '../src/preprocessor/dispatch';
import { InvalidOpcodeError } from '../src/errors';

describe('Dispatch: invalid opcode handling', () => {
  it('returns InvalidOpcodeError for 0xfe (INVALID)', () => {
    const res = compile(new Uint8Array([0xfe]));
    expect(res).toBeInstanceOf(InvalidOpcodeError);
  });

  it('returns InvalidOpcodeError for unimplemented opcodes (e.g., EXP 0x0a)', () => {
    const res = compile(new Uint8Array([0x0a]));
    expect(res).toBeInstanceOf(InvalidOpcodeError);
  });
});

