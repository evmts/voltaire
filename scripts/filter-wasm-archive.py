#!/usr/bin/env python3
"""
Filter a static archive to include only WASM object files.
Used to remove host objects from Rust staticlibs before Zig links them to WASM.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tempfile


def run(cmd: list[str], *, stdout=None) -> None:
    subprocess.run(cmd, check=True, stdout=stdout)


def list_members(archive_path: str) -> list[str]:
    result = subprocess.run(
        ["zig", "ar", "t", archive_path],
        check=True,
        stdout=subprocess.PIPE,
        text=True,
    )
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def is_wasm_object(path: str) -> bool:
    with open(path, "rb") as handle:
        return handle.read(4) == b"\x00asm"


def filter_archive(input_path: str, output_path: str) -> None:
    members = list_members(input_path)
    if not members:
        raise RuntimeError(f"No members found in archive: {input_path}")

    with tempfile.TemporaryDirectory() as tmp_dir:
        kept_files: list[str] = []
        for index, member in enumerate(members):
            out_path = os.path.join(tmp_dir, f"{index:04d}.o")
            with open(out_path, "wb") as handle:
                run(["zig", "ar", "p", input_path, member], stdout=handle)
            if is_wasm_object(out_path):
                kept_files.append(out_path)

        if not kept_files:
            raise RuntimeError(f"No WASM objects found in archive: {input_path}")

        if os.path.exists(output_path):
            os.remove(output_path)
        run(["zig", "ar", "rcs", output_path, *kept_files])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="Input .a archive path")
    parser.add_argument(
        "output",
        nargs="?",
        help="Output .a archive path (defaults to input path)",
    )
    args = parser.parse_args()

    output = args.output or args.input
    filter_archive(args.input, output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
