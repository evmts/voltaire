//! Streaming Unicode NFKD (compatibility decomposition + canonical ordering)
//! for BIP-39 mnemonic and passphrase normalization.
//!
//! `normalize(input, sink)` feeds the NFKD form of UTF-8 `input` to
//! `sink.update([]const u8)` without allocating. Pure ASCII input is passed
//! through in one call. Runs of non-starters are emitted in canonical order
//! (stable by combining class) by rescanning the run once per distinct class,
//! so run length is unbounded and no buffer is needed.
//!
//! Bytes that are not well-formed UTF-8 are passed through unchanged and act
//! as starters. Tables come from `nfkd_data.zig` (see `nfkd_data_gen.py`).

const std = @import("std");
const data = @import("nfkd_data.zig");

pub fn isAscii(input: []const u8) bool {
    for (input) |c| if (c >= 0x80) return false;
    return true;
}

fn combiningClass(cp: u21) u8 {
    var lo: usize = 0;
    var hi: usize = data.ccc_ranges.len;
    while (lo < hi) {
        const mid = lo + (hi - lo) / 2;
        const r = data.ccc_ranges[mid];
        if (cp < r.lo) {
            hi = mid;
        } else if (cp > r.hi) {
            lo = mid + 1;
        } else return r.ccc;
    }
    return 0;
}

fn decomposition(cp: u21) ?[]const u8 {
    const i = std.sort.binarySearch(u21, &data.decomp_keys, cp, struct {
        fn order(key: u21, item: u21) std.math.Order {
            return std.math.order(key, item);
        }
    }.order) orelse return null;
    const off = data.decomp_offsets[i];
    return data.decomp_data[off..][0..data.decomp_lengths[i]];
}

const s_base: u21 = 0xAC00;
const l_base: u21 = 0x1100;
const v_base: u21 = 0x1161;
const t_base: u21 = 0x11A7;
const t_count: u21 = 28;
const n_count: u21 = 21 * t_count;
const s_count: u21 = 19 * n_count;

/// Full decomposition of one source code point (or one raw invalid byte).
const Unit = struct {
    buf: [12]u8 = undefined,
    len: u8 = 0,
    ext: ?[]const u8 = null,
    /// Source byte is not well-formed UTF-8; emitted verbatim.
    raw: bool = false,
    /// Source index after this unit.
    next: usize = 0,

    fn bytes(self: *const Unit) []const u8 {
        return self.ext orelse self.buf[0..self.len];
    }

    fn push(self: *Unit, cp: u21) void {
        const n = std.unicode.utf8Encode(cp, self.buf[self.len..]) catch return;
        self.len += n;
    }
};

fn unitAt(input: []const u8, pos: usize) Unit {
    var u = Unit{};
    const n = std.unicode.utf8ByteSequenceLength(input[pos]) catch 0;
    const cp: ?u21 = if (n == 0 or pos + n > input.len)
        null
    else
        std.unicode.utf8Decode(input[pos..][0..n]) catch null;

    const c = cp orelse {
        u.buf[0] = input[pos];
        u.len = 1;
        u.raw = true;
        u.next = pos + 1;
        return u;
    };
    u.next = pos + n;

    if (c >= s_base and c < s_base + s_count) {
        const s = c - s_base;
        u.push(l_base + s / n_count);
        u.push(v_base + (s % n_count) / t_count);
        if (s % t_count != 0) u.push(t_base + s % t_count);
    } else if (decomposition(c)) |d| {
        u.ext = d;
    } else {
        @memcpy(u.buf[0..n], input[pos..][0..n]);
        u.len = @intCast(n);
    }
    return u;
}

/// One code point of the decomposed stream.
const Elem = struct {
    buf: [4]u8,
    len: u3,
    ccc: u8,

    fn slice(self: *const Elem) []const u8 {
        return self.buf[0..self.len];
    }
};

/// Cursor over the decomposed stream of `input`.
const Iter = struct {
    input: []const u8,
    pos: usize,
    off: usize = 0,
    unit: Unit = .{},

    fn init(input: []const u8) Iter {
        var it = Iter{ .input = input, .pos = 0 };
        if (input.len > 0) it.unit = unitAt(input, 0);
        return it;
    }

    fn done(self: *const Iter) bool {
        return self.pos >= self.input.len;
    }

    fn eql(self: *const Iter, other: *const Iter) bool {
        return self.pos == other.pos and self.off == other.off;
    }

    fn peek(self: *const Iter) Elem {
        const b = self.unit.bytes();
        var e = Elem{ .buf = undefined, .len = 1, .ccc = 0 };
        if (self.unit.raw) {
            e.buf[0] = b[0];
            return e;
        }
        const n = std.unicode.utf8ByteSequenceLength(b[self.off]) catch {
            e.buf[0] = b[self.off];
            return e;
        };
        if (self.off + n > b.len) {
            e.buf[0] = b[self.off];
            return e;
        }
        @memcpy(e.buf[0..n], b[self.off..][0..n]);
        e.len = n;
        const cp = std.unicode.utf8Decode(b[self.off..][0..n]) catch {
            e.len = 1;
            e.buf[0] = b[self.off];
            return e;
        };
        e.ccc = combiningClass(cp);
        return e;
    }

    fn advance(self: *Iter, e: *const Elem) void {
        self.off += e.len;
        if (self.off < self.unit.bytes().len) return;
        self.pos = self.unit.next;
        self.off = 0;
        if (!self.done()) self.unit = unitAt(self.input, self.pos);
    }
};

/// Feed NFKD(`input`) to `sink.update(bytes)`.
pub fn normalize(input: []const u8, sink: anytype) void {
    if (isAscii(input)) {
        sink.update(input);
        return;
    }
    var it = Iter.init(input);
    while (!it.done()) {
        const e = it.peek();
        if (e.ccc == 0) {
            sink.update(e.slice());
            it.advance(&e);
            continue;
        }

        // Run of non-starters [start, end): emit stable-sorted by class.
        const start = it;
        var end = it;
        while (!end.done()) {
            const x = end.peek();
            if (x.ccc == 0) break;
            end.advance(&x);
        }
        var last: u16 = 0;
        while (true) {
            var next: u16 = 256;
            var s = start;
            while (!s.eql(&end)) {
                const x = s.peek();
                if (x.ccc > last and x.ccc < next) next = x.ccc;
                s.advance(&x);
            }
            if (next == 256) break;
            s = start;
            while (!s.eql(&end)) {
                const x = s.peek();
                if (x.ccc == next) sink.update(x.slice());
                s.advance(&x);
            }
            last = next;
        }
        it = end;
    }
}

/// Byte length of NFKD(`input`).
pub fn normalizedLength(input: []const u8) usize {
    var counter = struct {
        n: usize = 0,
        pub fn update(self: *@This(), b: []const u8) void {
            self.n += b.len;
        }
    }{};
    normalize(input, &counter);
    return counter.n;
}

// ============================================================================
// Tests
// ============================================================================

const TestSink = struct {
    list: std.ArrayList(u8) = .empty,
    failed: bool = false,
    pub fn update(self: *TestSink, b: []const u8) void {
        self.list.appendSlice(std.testing.allocator, b) catch {
            self.failed = true;
        };
    }
};

fn expectNfkd(input: []const u8, expected: []const u8) !void {
    var sink = TestSink{};
    defer sink.list.deinit(std.testing.allocator);
    normalize(input, &sink);
    try std.testing.expect(!sink.failed);
    try std.testing.expectEqualSlices(u8, expected, sink.list.items);
    try std.testing.expectEqual(expected.len, normalizedLength(input));
}

test "nfkd: ASCII passes through" {
    try expectNfkd("", "");
    try expectNfkd("abandon about TREZOR", "abandon about TREZOR");
}

test "nfkd: composed and decomposed e-acute normalize identically" {
    try expectNfkd("caf\u{e9}", "cafe\u{301}");
    try expectNfkd("cafe\u{301}", "cafe\u{301}");
}

test "nfkd: compatibility mappings" {
    try expectNfkd("\u{fb01}", "fi"); // LATIN SMALL LIGATURE FI
    try expectNfkd("\u{3000}", " "); // IDEOGRAPHIC SPACE
    try expectNfkd("\u{2460}", "1"); // CIRCLED DIGIT ONE
    try expectNfkd("\u{338d}", "\u{3bc}g"); // SQUARE MU G
    try expectNfkd("\u{ff21}", "A"); // FULLWIDTH A
}

test "nfkd: Hangul syllables decompose algorithmically" {
    try expectNfkd("\u{d55c}", "\u{1112}\u{1161}\u{11ab}"); // 한 (LVT)
    try expectNfkd("\u{ac00}", "\u{1100}\u{1161}"); // 가 (LV)
}

test "nfkd: canonical ordering of combining marks" {
    // U+0301 (ccc 230) before U+0323 (ccc 220) must be reordered.
    try expectNfkd("a\u{301}\u{323}", "a\u{323}\u{301}");
    // Stable for equal classes: U+0301 and U+0300 are both 230.
    try expectNfkd("a\u{301}\u{300}", "a\u{301}\u{300}");
    // Marks contributed by a precomposed char join the following run.
    // U+1EA1 = a + U+0323; followed by U+0301 stays after.
    try expectNfkd("\u{1ea1}\u{301}", "a\u{323}\u{301}");
    // U+00E9 = e + U+0301 (230), then U+0323 (220): reorder across units.
    try expectNfkd("\u{e9}\u{323}", "e\u{323}\u{301}");
    // Leading non-starter run at the start of input.
    try expectNfkd("\u{301}\u{323}x", "\u{323}\u{301}x");
}

test "nfkd: matches Python unicodedata on a mixed vector" {
    // Python: unicodedata.normalize("NFKD", "㍍ガバヴァぱばぐゞちぢ十人十色")
    try expectNfkd(
        "\u{334d}\u{ff76}\u{ff9e}\u{ff8a}\u{ff9e}\u{30f4}\u{30a1}\u{3071}\u{3070}\u{3050}\u{309e}\u{3061}\u{3062}\u{5341}\u{4eba}\u{5341}\u{8272}",
        "\u{30e1}\u{30fc}\u{30c8}\u{30eb}\u{30ab}\u{3099}\u{30cf}\u{3099}\u{30a6}\u{3099}\u{30a1}\u{306f}\u{309a}\u{306f}\u{3099}\u{304f}\u{3099}\u{309d}\u{3099}\u{3061}\u{3061}\u{3099}\u{5341}\u{4eba}\u{5341}\u{8272}",
    );
}

test "nfkd: invalid UTF-8 bytes pass through" {
    try expectNfkd("a\xffb", "a\xffb");
    try expectNfkd("\xc3", "\xc3"); // truncated sequence
    try expectNfkd("\xed\xa0\x80", "\xed\xa0\x80"); // surrogate
    try expectNfkd("\xc3\xa9\xff", "e\u{301}\xff");
}

test "nfkd: table lookups agree with spot checks" {
    try std.testing.expectEqual(@as(u8, 230), combiningClass(0x301));
    try std.testing.expectEqual(@as(u8, 220), combiningClass(0x323));
    try std.testing.expectEqual(@as(u8, 0), combiningClass('a'));
    try std.testing.expectEqualStrings("e\u{301}", decomposition(0xE9).?);
    try std.testing.expect(decomposition('a') == null);
}
