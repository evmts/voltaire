const std = @import("std");
const PrecompileError = @import("common.zig").PrecompileError;
const PrecompileResult = @import("common.zig").PrecompileResult;

/// EIP-2537 G1 MSM discount table. Entry `k - 1` is the discount for `k`
/// pairs, in thousandths. `k > 128` uses the last entry (`max_discount`).
pub const G1_MSM_DISCOUNT = [128]u16{
    1000, 949, 848, 797, 764, 750, 738, 728, 719, 712, 705, 698, 692, 687, 682, 677,
    673,  669, 665, 661, 658, 654, 651, 648, 645, 642, 640, 637, 635, 632, 630, 627,
    625,  623, 621, 619, 617, 615, 613, 611, 609, 608, 606, 604, 603, 601, 599, 598,
    596,  595, 593, 592, 591, 589, 588, 586, 585, 584, 582, 581, 580, 579, 577, 576,
    575,  574, 573, 572, 570, 569, 568, 567, 566, 565, 564, 563, 562, 561, 560, 559,
    558,  557, 556, 555, 554, 553, 552, 551, 550, 549, 548, 547, 547, 546, 545, 544,
    543,  542, 541, 540, 540, 539, 538, 537, 536, 536, 535, 534, 533, 532, 532, 531,
    530,  529, 528, 528, 527, 526, 525, 525, 524, 523, 522, 522, 521, 520, 520, 519,
};

/// EIP-2537 G2 MSM discount table. Entry `k - 1` is the discount for `k`
/// pairs, in thousandths. `k > 128` uses the last entry (`max_discount`).
pub const G2_MSM_DISCOUNT = [128]u16{
    1000, 1000, 923, 884, 855, 832, 812, 796, 782, 770, 759, 749, 740, 732, 724, 717,
    711,  704,  699, 693, 688, 683, 679, 674, 670, 666, 663, 659, 655, 652, 649, 646,
    643,  640,  637, 634, 632, 629, 627, 624, 622, 620, 618, 615, 613, 611, 609, 607,
    606,  604,  602, 600, 598, 597, 595, 593, 592, 590, 589, 587, 586, 584, 583, 582,
    580,  579,  578, 576, 575, 574, 573, 571, 570, 569, 568, 567, 566, 565, 563, 562,
    561,  560,  559, 558, 557, 556, 555, 554, 553, 552, 552, 551, 550, 549, 548, 547,
    546,  545,  545, 544, 543, 542, 541, 541, 540, 539, 538, 537, 537, 536, 535, 535,
    534,  533,  532, 532, 531, 530, 530, 529, 528, 528, 527, 526, 526, 525, 524, 524,
};

/// EIP-2537 MSM discount multiplier.
pub const MSM_MULTIPLIER: u64 = 1000;

/// EIP-2537 MSM gas: `k * multiplication_cost * discount(k) / 1000`, and 0
/// for `k == 0`. `k` is `floor(input.len / LEN_PER_PAIR)`. The gas function
/// never fails: a call with `k == 0` or a ragged length is rejected by the
/// precompile itself. Saturates instead of overflowing.
pub fn msmGas(k: usize, multiplication_cost: u64, table: *const [128]u16) u64 {
    if (k == 0) return 0;
    const discount: u64 = table[@min(k, table.len) - 1];
    const product = @as(u256, k) * multiplication_cost * discount / MSM_MULTIPLIER;
    return std.math.cast(u64, product) orelse std.math.maxInt(u64);
}

/// Test helper: run every vector of a `name|input hex|expected|gas` file
/// against a precompile. `expected` is the output hex, or `ERR` when the call
/// must be an exceptional halt. A success vector must return the expected
/// output and charge exactly `gas`, and must run out of gas with `gas - 1`.
/// Fails unless the file holds exactly `expected_count` vectors.
pub fn expectVectors(
    comptime execute: fn (std.mem.Allocator, []const u8, u64) PrecompileError!PrecompileResult,
    vectors: []const u8,
    expected_count: usize,
) !void {
    const testing = std.testing;
    const allocator = testing.allocator;

    var count: usize = 0;
    var lines = std.mem.splitScalar(u8, vectors, '\n');
    while (lines.next()) |line| {
        if (line.len == 0 or line[0] == '#') continue;

        var fields = std.mem.splitScalar(u8, line, '|');
        const name = fields.next() orelse return error.MalformedVector;
        const input_hex = fields.next() orelse return error.MalformedVector;
        const expected_hex = fields.next() orelse return error.MalformedVector;
        const gas_text = fields.next() orelse return error.MalformedVector;
        if (fields.next() != null) return error.MalformedVector;

        const input = try allocator.alloc(u8, input_hex.len / 2);
        defer allocator.free(input);
        _ = try std.fmt.hexToBytes(input, input_hex);

        errdefer std.debug.print("vector failed: {s}\n", .{name});

        if (std.mem.eql(u8, expected_hex, "ERR")) {
            if (execute(allocator, input, std.math.maxInt(u64))) |result| {
                result.deinit(allocator);
                return error.ExpectedPrecompileFailure;
            } else |err| {
                try testing.expect(err != error.OutOfGas);
                try testing.expect(err != error.OutOfMemory);
            }
        } else {
            const expected = try allocator.alloc(u8, expected_hex.len / 2);
            defer allocator.free(expected);
            _ = try std.fmt.hexToBytes(expected, expected_hex);
            const gas = try std.fmt.parseInt(u64, gas_text, 10);

            const result = try execute(allocator, input, gas);
            defer result.deinit(allocator);
            try testing.expectEqualSlices(u8, expected, result.output);
            try testing.expectEqual(gas, result.gas_used);

            if (gas > 0) {
                try testing.expectError(error.OutOfGas, execute(allocator, input, gas - 1));
            }
        }
        count += 1;
    }
    try testing.expectEqual(expected_count, count);
}

test "msmGas - EIP-2537 discount tables" {
    const testing = std.testing;

    try testing.expectEqual(@as(u16, 1000), G1_MSM_DISCOUNT[0]);
    try testing.expectEqual(@as(u16, 949), G1_MSM_DISCOUNT[1]);
    try testing.expectEqual(@as(u16, 519), G1_MSM_DISCOUNT[127]);
    try testing.expectEqual(@as(u16, 1000), G2_MSM_DISCOUNT[1]);
    try testing.expectEqual(@as(u16, 923), G2_MSM_DISCOUNT[2]);
    try testing.expectEqual(@as(u16, 524), G2_MSM_DISCOUNT[127]);

    // The discount never increases with k.
    for (G1_MSM_DISCOUNT[1..], G1_MSM_DISCOUNT[0..127]) |next, prev| try testing.expect(next <= prev);
    for (G2_MSM_DISCOUNT[1..], G2_MSM_DISCOUNT[0..127]) |next, prev| try testing.expect(next <= prev);
}

test "msmGas - k = 0 costs nothing and k > 128 uses max_discount" {
    const testing = std.testing;

    try testing.expectEqual(@as(u64, 0), msmGas(0, 12000, &G1_MSM_DISCOUNT));
    try testing.expectEqual(@as(u64, 0), msmGas(0, 22500, &G2_MSM_DISCOUNT));
    try testing.expectEqual(@as(u64, 129 * 12000 * 519 / 1000), msmGas(129, 12000, &G1_MSM_DISCOUNT));
    try testing.expectEqual(@as(u64, 1000 * 22500 * 524 / 1000), msmGas(1000, 22500, &G2_MSM_DISCOUNT));
    try testing.expectEqual(@as(u64, std.math.maxInt(u64)), msmGas(std.math.maxInt(usize), std.math.maxInt(u64), &G1_MSM_DISCOUNT));
}

test "msmGas - matches the gas of every official EIP-2537 MSM vector (k = 1..149)" {
    const testing = std.testing;

    // Gas of the official msm_G1_bls.json / msm_G2_bls.json vectors, indexed by k - 1.
    const g1 = [_]u64{
        12000,  22776,  30528,  38256,  45840,  54000,  61992,  69888,  77652,  85440,
        93060,  100512, 107952, 115416, 122760, 129984, 137292, 144504, 151620, 158640,
        165816, 172656, 179676, 186624, 193500, 200304, 207360, 214032, 220980, 227520,
        234360, 240768, 247500, 254184, 260820, 267408, 273948, 280440, 286884, 293280,
        299628, 306432, 312696, 318912, 325620, 331752, 337836, 344448, 350448, 357000,
        362916, 369408, 375876, 381672, 388080, 393792, 400140, 406464, 412056, 418320,
        424560, 430776, 436212, 442368, 448500, 454608, 460692, 466752, 471960, 477960,
        483936, 489888, 495816, 501720, 507600, 513456, 519288, 525096, 530880, 536640,
        542376, 548088, 553776, 559440, 565080, 570696, 576288, 581856, 587400, 592920,
        598416, 603888, 610452, 615888, 621300, 626688, 632052, 637392, 642708, 648000,
        654480, 659736, 664968, 670176, 675360, 681792, 686940, 692064, 697164, 702240,
        708624, 713664, 718680, 723672, 728640, 734976, 739908, 744816, 749700, 756000,
        760848, 765672, 770472, 776736, 781500, 786240, 792480, 797184, 803412, 809640,
        815868, 822096, 828324, 834552, 840780, 847008, 853236, 859464, 865692, 871920,
        878148, 884376, 890604, 896832, 903060, 909288, 915516, 921744, 927972,
    };
    const g2 = [_]u64{
        22500,   45000,   62302,   79560,   96187,   112320,  127890,  143280,  158355,  173250,
        187852,  202230,  216450,  230580,  244350,  258120,  271957,  285120,  298822,  311850,
        325080,  338085,  351382,  363960,  376875,  389610,  402772,  415170,  427387,  440100,
        452677,  465120,  477427,  489600,  501637,  513540,  526140,  537795,  550192,  561600,
        573795,  585900,  597915,  608850,  620662,  632385,  644017,  655560,  668115,  679500,
        690795,  702000,  713115,  725355,  736312,  747180,  759240,  769950,  781897,  792450,
        804285,  814680,  826402,  838080,  848250,  859815,  871335,  881280,  892687,  904050,
        915367,  925020,  936225,  947385,  958500,  969570,  980595,  991575,  1000732, 1011600,
        1022422, 1033200, 1043932, 1054620, 1065262, 1075860, 1086412, 1096920, 1107382, 1117800,
        1130220, 1140570, 1150875, 1161135, 1171350, 1181520, 1191645, 1201725, 1213987, 1224000,
        1233967, 1243890, 1253767, 1265940, 1275750, 1285515, 1295235, 1304910, 1316992, 1326600,
        1336162, 1348200, 1357695, 1367145, 1376550, 1388520, 1397857, 1407150, 1419075, 1428300,
        1437480, 1449360, 1458472, 1467540, 1479375, 1488375, 1497330, 1509120, 1520910, 1532700,
        1544490, 1556280, 1568070, 1579860, 1591650, 1603440, 1615230, 1627020, 1638810, 1650600,
        1662390, 1674180, 1685970, 1697760, 1709550, 1721340, 1733130, 1744920, 1756710,
    };
    try testing.expectEqual(@as(usize, 149), g1.len);
    try testing.expectEqual(@as(usize, 149), g2.len);
    for (g1, 1..) |gas, k| try testing.expectEqual(gas, msmGas(k, 12000, &G1_MSM_DISCOUNT));
    for (g2, 1..) |gas, k| try testing.expectEqual(gas, msmGas(k, 22500, &G2_MSM_DISCOUNT));
}
