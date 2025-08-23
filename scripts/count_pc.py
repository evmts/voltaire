#!/usr/bin/env python3
import sys
from pathlib import Path


PUSH_BASE = 0x60
PUSH_MAX = 0x7F
PC_OPCODE = 0x58


def parse_hex_bytes(s: str):
    s = s.strip()
    if s.startswith("0x") or s.startswith("0X"):
        s = s[2:]
    if len(s) % 2 != 0:
        # If odd length, pad with leading zero (defensive)
        s = "0" + s
    try:
        return bytes.fromhex(s)
    except ValueError as e:
        raise SystemExit(f"Invalid hex input: {e}")


def count_pc_ops(bytecode: bytes) -> int:
    i = 0
    n = len(bytecode)
    count = 0
    while i < n:
        op = bytecode[i]
        if op == PC_OPCODE:
            count += 1
            i += 1
            continue
        if PUSH_BASE <= op <= PUSH_MAX:
            push_len = op - (PUSH_BASE - 1)  # 0x60 -> 1, 0x7f -> 32
            i += 1 + push_len
        else:
            i += 1
    return count


def load_and_count(path: Path) -> int:
    data = path.read_text().strip()
    b = parse_hex_bytes(data)
    return count_pc_ops(b)


def main():
    base = Path("bench/official/cases")
    sets = {
        "erc20-approval-transfer": base / "erc20-approval-transfer" / "bytecode.txt",
        "erc20-mint": base / "erc20-mint" / "bytecode.txt",
        "erc20-transfer": base / "erc20-transfer" / "bytecode.txt",
        "snailtracer": base / "snailtracer" / "bytecode.txt",
        "ten-thousand-hashes": base / "ten-thousand-hashes" / "bytecode.txt",
    }

    totals = {}
    for name, path in sets.items():
        if not path.exists():
            print(f"ERROR: Missing {path}", file=sys.stderr)
            continue
        totals[name] = load_and_count(path)

    # Aggregate ERC20 total
    erc20_total = sum(totals.get(k, 0) for k in ("erc20-approval-transfer", "erc20-mint", "erc20-transfer"))

    print("PC opcode counts (excluding PUSH data):")
    print(f"- erc20-approval-transfer: {totals.get('erc20-approval-transfer', 0)}")
    print(f"- erc20-mint:            {totals.get('erc20-mint', 0)}")
    print(f"- erc20-transfer:        {totals.get('erc20-transfer', 0)}")
    print(f"- ERC20 total:           {erc20_total}")
    print(f"- snailtracer:           {totals.get('snailtracer', 0)}")
    print(f"- ten-thousand-hashes:   {totals.get('ten-thousand-hashes', 0)}")


if __name__ == "__main__":
    main()

