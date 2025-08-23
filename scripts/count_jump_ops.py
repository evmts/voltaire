#!/usr/bin/env python3
import sys
from pathlib import Path

PUSH_BASE = 0x60
PUSH_MAX = 0x7F

OP_JUMP = 0x56
OP_JUMPI = 0x57
OP_JUMPDEST = 0x5B


def parse_hex_bytes(s: str):
    s = s.strip()
    if s.startswith("0x") or s.startswith("0X"):
        s = s[2:]
    if len(s) % 2 != 0:
        s = "0" + s
    return bytes.fromhex(s)


def count_jumps(bytecode: bytes):
    i = 0
    n = len(bytecode)
    c_jump = c_jumpi = c_jumpdest = 0
    while i < n:
        op = bytecode[i]
        if op == OP_JUMP:
            c_jump += 1
            i += 1
            continue
        if op == OP_JUMPI:
            c_jumpi += 1
            i += 1
            continue
        if op == OP_JUMPDEST:
            c_jumpdest += 1
            i += 1
            continue
        if PUSH_BASE <= op <= PUSH_MAX:
            push_len = op - (PUSH_BASE - 1)
            i += 1 + push_len
        else:
            i += 1
    return c_jump, c_jumpi, c_jumpdest


def main():
    path = Path("bench/official/cases/snailtracer/bytecode.txt")
    if not path.exists():
        print(f"ERROR: Missing {path}", file=sys.stderr)
        sys.exit(1)
    data = path.read_text().strip()
    b = parse_hex_bytes(data)
    j, ji, jd = count_jumps(b)
    total = j + ji + jd
    print("snailtracer jump-related opcode counts:")
    print(f"- JUMP (0x56):     {j}")
    print(f"- JUMPI (0x57):    {ji}")
    print(f"- JUMPDEST (0x5b): {jd}")
    print(f"- Total:           {total}")


if __name__ == "__main__":
    main()

