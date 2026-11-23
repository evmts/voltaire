#!/usr/bin/env python3
"""Mechanical source rewrites that build on Zig 0.15.2 and Zig 0.17.x.

Zig 0.17 removed the `**` array-repeat operator, the field defaults that
made `std.ArrayList(T){}` a valid empty list, and the
`std.heap.GeneralPurposeAllocator` alias. Their replacements (`@splat` into
an array result type, the `.empty` declaration, and
`std.heap.DebugAllocator`) already compile on 0.15.2, so this script can run
before the compiler upgrade.
See docs/MIGRATION_ZIG_017.md.

Rewrites (N is the repeat count, T the element type):

    std.ArrayList(T){}            ->  std.ArrayList(T).empty
    std.ArrayListUnmanaged(T){}   ->  std.ArrayListUnmanaged(T).empty
    std.heap.GeneralPurposeAllocator  ->  std.heap.DebugAllocator

    [_]T{v} ** N      ->  @as([N]T, @splat(v))
    [1]T{v} ** N      ->  @as([N]T, @splat(v))
    "c" ** N          ->  &@as([N]u8, @splat('c'))      (one-byte strings)
    "ab" ** N         ->  @as(*const [(N) * 2]u8, @ptrCast(&@as([N][2]u8, @splat("ab".*))))
    [_]T{a, b} ** N   ->  @as(*const [(N) * 2]T, @ptrCast(&@as([N][2]T, @splat(.{ a, b })))).*

The last two follow the form Zig's own standard library adopted
(`const buf: [32][2]u8 = @splat("90".*)`).

Anything else (anonymous `.{v} ** N` tuples, struct-typed literals, strings
with escapes longer than one byte) is left untouched and reported, with exit
code 1, for a manual rewrite.

Usage:
    scripts/zig017-codemod.py [--check] PATH...

PATH is a .zig file or a directory searched recursively. `--check` reports
what would change and writes nothing.
"""

import os
import re
import sys

SKIP_DIRS = {".zig-cache", "zig-cache", "zig-out", "zig-pkg", "node_modules", "target", "libwally-core", "c-kzg-4844", "docs"}

IDENT = re.compile(r"[A-Za-z_@][A-Za-z0-9_]*")
NUMBER = re.compile(r"0[xXbBoO][0-9A-Fa-f_]+|[0-9][0-9_]*")
PLAIN_STRING = re.compile(r'"[\x20-\x21\x23-\x5b\x5d-\x7e]*"$')
ONE_BYTE_STRING = re.compile(r'"(\\x[0-9A-Fa-f]{2}|\\[nrt\\\'"]|[^"\\])"$')


def mask(src):
    """Return src with comment and string/char literal bodies blanked.

    Offsets are preserved so matches found in the mask index into src.
    """
    out = list(src)
    i = 0
    n = len(src)
    while i < n:
        c = src[i]
        if src.startswith("//", i) or src.startswith("\\\\", i):
            j = src.find("\n", i)
            j = n if j == -1 else j
            for k in range(i, j):
                out[k] = " "
            i = j
        elif c == '"' or c == "'":
            j = i + 1
            while j < n and src[j] != c and src[j] != "\n":
                j += 2 if src[j] == "\\" else 1
            for k in range(i + 1, min(j, n)):
                out[k] = "s"
            i = j + 1
        else:
            i += 1
    return "".join(out)


def match_close(masked, open_at):
    """Index of the bracket closing the one at open_at, or -1."""
    pairs = {"(": ")", "[": "]", "{": "}"}
    close = pairs[masked[open_at]]
    opener = masked[open_at]
    depth = 0
    for i in range(open_at, len(masked)):
        if masked[i] == opener:
            depth += 1
        elif masked[i] == close:
            depth -= 1
            if depth == 0:
                return i
    return -1


def match_open(masked, close_at):
    """Index of the bracket opening the one at close_at, or -1."""
    pairs = {")": "(", "]": "[", "}": "{"}
    opener = pairs[masked[close_at]]
    closer = masked[close_at]
    depth = 0
    for i in range(close_at, -1, -1):
        if masked[i] == closer:
            depth += 1
        elif masked[i] == opener:
            depth -= 1
            if depth == 0:
                return i
    return -1


def count_end(masked, start):
    """End offset of the repeat-count operand starting at start, or -1.

    Accepts a number, a parenthesized expression, or an identifier followed
    by any chain of `.name`, `(...)` and `[...]` suffixes.
    """
    if start >= len(masked):
        return -1
    if masked[start] == "(":
        end = match_close(masked, start)
        return -1 if end == -1 else end + 1
    m = NUMBER.match(masked, start)
    if m:
        return m.end()
    m = IDENT.match(masked, start)
    if not m:
        return -1
    i = m.end()
    while i < len(masked):
        if masked[i] == "." and IDENT.match(masked, i + 1):
            i = IDENT.match(masked, i + 1).end()
        elif masked[i] in "([":
            end = match_close(masked, i)
            if end == -1:
                return -1
            i = end + 1
        else:
            break
    return i


def element_count(masked, start, end):
    """Number of top-level comma-separated elements in masked[start:end]."""
    depth = 0
    count = 1
    for i in range(start, end):
        c = masked[i]
        if c in "([{":
            depth += 1
        elif c in ")]}":
            depth -= 1
        elif c == "," and depth == 0:
            # A trailing comma is not another element.
            if masked[i + 1 : end].strip():
                count += 1
    return count


def element_type_start(masked, brace_open):
    """Start of `[_]T` / `[1]T` for the literal whose `{` is at brace_open."""
    i = brace_open
    # Walk back over the element type: identifiers, dots, nested array and
    # pointer prefixes such as `[32]u8`, `*const T`, `?T`.
    while i > 0:
        c = masked[i - 1]
        if c.isalnum() or c in "_.?*":
            i -= 1
        elif c == " " and masked[max(0, i - 6) : i] == "const ":
            i -= 6
        elif c == "]":
            open_at = match_open(masked, i - 1)
            if open_at == -1:
                return -1, -1
            inner = masked[open_at + 1 : i - 1].strip()
            if inner in ("_", "1"):
                return open_at, i
            i = open_at
        else:
            break
    return -1, -1


def rewrite_pass(src):
    """One pass: rewrite every repeat that contains no other repeat."""
    masked = mask(src)
    edits = []
    manual = []
    for m in re.finditer(r"\*\*", masked):
        op = m.start()
        left = op
        while left > 0 and masked[left - 1] in " \t\n":
            left -= 1
        right = m.end()
        while right < len(masked) and masked[right] in " \t\n":
            right += 1
        end = count_end(masked, right)
        line = src.count("\n", 0, op) + 1
        text = src.splitlines()[line - 1].strip()
        if left == 0 or end == -1:
            manual.append((line, text))
            continue
        count = src[right:end]
        if count.startswith("(") and match_close(masked, right) == end - 1:
            count = count[1:-1].strip()
        last = masked[left - 1]
        if last == "}":
            brace_open = match_open(masked, left - 1)
            if brace_open == -1:
                manual.append((line, text))
                continue
            type_start, type_from = element_type_start(masked, brace_open)
            if type_start == -1:
                manual.append((line, text))
                continue
            elem_type = src[type_from:brace_open].strip()
            value = src[brace_open + 1 : left - 1].strip().rstrip(",").strip()
            if not elem_type or not value:
                manual.append((line, text))
                continue
            k = element_count(masked, brace_open + 1, left - 1)
            if k == 1:
                edits.append((type_start, end, f"@as([{count}]{elem_type}, @splat({value}))"))
            else:
                edits.append(
                    (
                        type_start,
                        end,
                        f"@as(*const [({count}) * {k}]{elem_type}, "
                        f"@ptrCast(&@as([{count}][{k}]{elem_type}, @splat(.{{ {value} }})))).*",
                    )
                )
        elif last == '"':
            quote_open = src.rfind('"', 0, left - 1)
            while quote_open > 0 and src[quote_open - 1] == "\\":
                quote_open = src.rfind('"', 0, quote_open)
            literal = src[quote_open:left]
            if quote_open != -1 and PLAIN_STRING.match(literal) and len(literal) > 3:
                size = len(literal) - 2
                edits.append(
                    (
                        quote_open,
                        end,
                        f"@as(*const [({count}) * {size}]u8, "
                        f"@ptrCast(&@as([{count}][{size}]u8, @splat({literal}.*))))",
                    )
                )
                continue
            if quote_open == -1 or not ONE_BYTE_STRING.match(literal):
                manual.append((line, text))
                continue
            char = literal[1:-1]
            if char == "'":
                char = "\\'"
            elif char == '\\"':
                char = '"'
            edits.append((quote_open, end, f"&@as([{count}]u8, @splat('{char}'))"))
        else:
            manual.append((line, text))
    # Nested repeats overlap. Rewrite the innermost ones now; the caller
    # reruns until a pass rewrites nothing.
    innermost = [
        e for e in edits if not any(o is not e and e[0] <= o[0] and o[1] <= e[1] for o in edits)
    ]
    out = src
    for start, end, text in sorted(innermost, reverse=True):
        out = out[:start] + text + out[end:]
    return out, len(innermost), manual


ARRAY_LIST = re.compile(r"\bArrayList(?:Unmanaged|AlignedUnmanaged|Aligned)?\(")


def rewrite_empty_lists(src):
    """Rewrite `ArrayList(T){}` to `ArrayList(T).empty`. Return (src, count)."""
    masked = mask(src)
    edits = []
    for m in ARRAY_LIST.finditer(masked):
        close = match_close(masked, m.end() - 1)
        if close != -1 and masked.startswith("{}", close + 1):
            edits.append(close + 1)
    for at in sorted(edits, reverse=True):
        src = src[:at] + ".empty" + src[at + 2 :]
    return src, len(edits)


GPA = re.compile(r"\bheap\.GeneralPurposeAllocator\b")


def rewrite_gpa(src):
    """Rewrite the removed GeneralPurposeAllocator alias. Return (src, count)."""
    starts = [m.start() for m in GPA.finditer(mask(src))]
    for at in sorted(starts, reverse=True):
        src = src[:at] + "heap.DebugAllocator" + src[at + len("heap.GeneralPurposeAllocator") :]
    return src, len(starts)


def rewrite(src):
    """Return (new_src, rewritten_count, [(line, text)] left for manual work)."""
    src, total = rewrite_empty_lists(src)
    src, renamed = rewrite_gpa(src)
    total += renamed
    while True:
        src, count, manual = rewrite_pass(src)
        total += count
        if count == 0:
            return src, total, manual


def zig_files(paths):
    for path in paths:
        if os.path.isfile(path):
            yield path
            continue
        for root, dirs, files in os.walk(path):
            dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
            for name in sorted(files):
                if name.endswith(".zig"):
                    yield os.path.join(root, name)


def main(argv):
    check = "--check" in argv
    paths = [a for a in argv if a != "--check"]
    if not paths:
        sys.stderr.write(__doc__)
        return 2
    total = 0
    changed = 0
    leftovers = 0
    for path in zig_files(paths):
        with open(path, encoding="utf-8") as f:
            src = f.read()
        if "**" not in src and "ArrayList" not in src and "GeneralPurposeAllocator" not in src:
            continue
        out, count, manual = rewrite(src)
        for line, text in manual:
            sys.stdout.write(f"MANUAL {path}:{line}: {text}\n")
        leftovers += len(manual)
        if count:
            total += count
            changed += 1
            if not check:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(out)
    verb = "would rewrite" if check else "rewrote"
    sys.stdout.write(f"{verb} {total} sites in {changed} files; {leftovers} left for manual rewrite\n")
    return 1 if leftovers else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
