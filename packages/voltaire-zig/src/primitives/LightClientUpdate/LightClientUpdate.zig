const std = @import("std");
const primitives = @import("primitives");

const MAX_LIGHT_CLIENT_BRANCH_DEPTH: usize = 7;
const MAX_SYNC_COMMITTEE_BRANCH_DEPTH: usize = 6;

pub const LightClientBootstrap = struct {
    header: primitives.LightClientHeader.LightClientHeader,
    current_sync_committee_pubkeys: [512][48]u8,
    current_sync_committee_aggregate_pubkey: [48]u8,
    current_sync_committee_branch: [MAX_SYNC_COMMITTEE_BRANCH_DEPTH][32]u8,
    current_sync_committee_branch_len: u8,

    pub fn from(
        header: primitives.LightClientHeader.LightClientHeader,
        current_sync_committee_pubkeys: [512][48]u8,
        current_sync_committee_aggregate_pubkey: [48]u8,
        current_sync_committee_branch: [5][32]u8,
    ) LightClientBootstrap {
        var branch: [MAX_SYNC_COMMITTEE_BRANCH_DEPTH][32]u8 = [_][32]u8{[_]u8{0} ** 32} ** MAX_SYNC_COMMITTEE_BRANCH_DEPTH;
        @memcpy(branch[0..current_sync_committee_branch.len], current_sync_committee_branch[0..]);
        return .{
            .header = header,
            .current_sync_committee_pubkeys = current_sync_committee_pubkeys,
            .current_sync_committee_aggregate_pubkey = current_sync_committee_aggregate_pubkey,
            .current_sync_committee_branch = branch,
            .current_sync_committee_branch_len = @intCast(current_sync_committee_branch.len),
        };
    }

    pub fn fromBranch(
        header: primitives.LightClientHeader.LightClientHeader,
        current_sync_committee_pubkeys: [512][48]u8,
        current_sync_committee_aggregate_pubkey: [48]u8,
        current_sync_committee_branch: []const [32]u8,
    ) !LightClientBootstrap {
        if (current_sync_committee_branch.len > MAX_SYNC_COMMITTEE_BRANCH_DEPTH) return error.InvalidArrayLength;

        var branch: [MAX_SYNC_COMMITTEE_BRANCH_DEPTH][32]u8 = [_][32]u8{[_]u8{0} ** 32} ** MAX_SYNC_COMMITTEE_BRANCH_DEPTH;
        @memcpy(branch[0..current_sync_committee_branch.len], current_sync_committee_branch);
        return .{
            .header = header,
            .current_sync_committee_pubkeys = current_sync_committee_pubkeys,
            .current_sync_committee_aggregate_pubkey = current_sync_committee_aggregate_pubkey,
            .current_sync_committee_branch = branch,
            .current_sync_committee_branch_len = @intCast(current_sync_committee_branch.len),
        };
    }

    pub fn currentSyncCommitteeBranch(self: *const LightClientBootstrap) []const [32]u8 {
        return self.current_sync_committee_branch[0..self.current_sync_committee_branch_len];
    }

    pub fn equals(self: LightClientBootstrap, other: LightClientBootstrap) bool {
        return self.header.equals(other.header) and
            std.mem.eql(
                u8,
                std.mem.asBytes(&self.current_sync_committee_pubkeys),
                std.mem.asBytes(&other.current_sync_committee_pubkeys),
            ) and
            std.mem.eql(
                u8,
                self.current_sync_committee_aggregate_pubkey[0..],
                other.current_sync_committee_aggregate_pubkey[0..],
            ) and
            self.current_sync_committee_branch_len == other.current_sync_committee_branch_len and
            std.mem.eql(
                u8,
                std.mem.sliceAsBytes(self.currentSyncCommitteeBranch()),
                std.mem.sliceAsBytes(other.currentSyncCommitteeBranch()),
            );
    }
};

pub const LightClientUpdate = struct {
    attested_header: primitives.LightClientHeader.LightClientHeader,
    next_sync_committee_pubkeys: [512][48]u8,
    next_sync_committee_aggregate_pubkey: [48]u8,
    next_sync_committee_branch: [MAX_SYNC_COMMITTEE_BRANCH_DEPTH][32]u8,
    next_sync_committee_branch_len: u8,
    has_next_sync_committee: bool,
    finalized_header: primitives.LightClientHeader.LightClientHeader,
    finality_branch: [MAX_LIGHT_CLIENT_BRANCH_DEPTH][32]u8,
    finality_branch_len: u8,
    has_finality: bool,
    sync_committee_bits: [64]u8,
    sync_committee_signature: [96]u8,
    signature_slot: u64,

    pub fn from(
        attested_header: primitives.LightClientHeader.LightClientHeader,
        next_sync_committee_pubkeys: [512][48]u8,
        next_sync_committee_aggregate_pubkey: [48]u8,
        next_sync_committee_branch: [5][32]u8,
        finalized_header: primitives.LightClientHeader.LightClientHeader,
        finality_branch: [6][32]u8,
        sync_committee_bits: [64]u8,
        sync_committee_signature: [96]u8,
        signature_slot: u64,
    ) LightClientUpdate {
        var next_branch: [MAX_SYNC_COMMITTEE_BRANCH_DEPTH][32]u8 = [_][32]u8{[_]u8{0} ** 32} ** MAX_SYNC_COMMITTEE_BRANCH_DEPTH;
        @memcpy(next_branch[0..next_sync_committee_branch.len], next_sync_committee_branch[0..]);

        var finality_branch_storage: [MAX_LIGHT_CLIENT_BRANCH_DEPTH][32]u8 = [_][32]u8{[_]u8{0} ** 32} ** MAX_LIGHT_CLIENT_BRANCH_DEPTH;
        @memcpy(finality_branch_storage[0..finality_branch.len], finality_branch[0..]);

        return .{
            .attested_header = attested_header,
            .next_sync_committee_pubkeys = next_sync_committee_pubkeys,
            .next_sync_committee_aggregate_pubkey = next_sync_committee_aggregate_pubkey,
            .next_sync_committee_branch = next_branch,
            .next_sync_committee_branch_len = @intCast(next_sync_committee_branch.len),
            .has_next_sync_committee = true,
            .finalized_header = finalized_header,
            .finality_branch = finality_branch_storage,
            .finality_branch_len = @intCast(finality_branch.len),
            .has_finality = true,
            .sync_committee_bits = sync_committee_bits,
            .sync_committee_signature = sync_committee_signature,
            .signature_slot = signature_slot,
        };
    }

    pub fn fromBranches(
        attested_header: primitives.LightClientHeader.LightClientHeader,
        next_sync_committee_pubkeys: [512][48]u8,
        next_sync_committee_aggregate_pubkey: [48]u8,
        next_sync_committee_branch: []const [32]u8,
        finalized_header: primitives.LightClientHeader.LightClientHeader,
        finality_branch: []const [32]u8,
        sync_committee_bits: [64]u8,
        sync_committee_signature: [96]u8,
        signature_slot: u64,
    ) !LightClientUpdate {
        if (next_sync_committee_branch.len > MAX_SYNC_COMMITTEE_BRANCH_DEPTH) return error.InvalidArrayLength;
        if (finality_branch.len > MAX_LIGHT_CLIENT_BRANCH_DEPTH) return error.InvalidArrayLength;

        var next_branch: [MAX_SYNC_COMMITTEE_BRANCH_DEPTH][32]u8 = [_][32]u8{[_]u8{0} ** 32} ** MAX_SYNC_COMMITTEE_BRANCH_DEPTH;
        @memcpy(next_branch[0..next_sync_committee_branch.len], next_sync_committee_branch);

        var finality_branch_storage: [MAX_LIGHT_CLIENT_BRANCH_DEPTH][32]u8 = [_][32]u8{[_]u8{0} ** 32} ** MAX_LIGHT_CLIENT_BRANCH_DEPTH;
        @memcpy(finality_branch_storage[0..finality_branch.len], finality_branch);

        return .{
            .attested_header = attested_header,
            .next_sync_committee_pubkeys = next_sync_committee_pubkeys,
            .next_sync_committee_aggregate_pubkey = next_sync_committee_aggregate_pubkey,
            .next_sync_committee_branch = next_branch,
            .next_sync_committee_branch_len = @intCast(next_sync_committee_branch.len),
            .has_next_sync_committee = true,
            .finalized_header = finalized_header,
            .finality_branch = finality_branch_storage,
            .finality_branch_len = @intCast(finality_branch.len),
            .has_finality = true,
            .sync_committee_bits = sync_committee_bits,
            .sync_committee_signature = sync_committee_signature,
            .signature_slot = signature_slot,
        };
    }

    pub fn fromOptionalBranches(
        attested_header: primitives.LightClientHeader.LightClientHeader,
        next_sync_committee_pubkeys: ?[512][48]u8,
        next_sync_committee_aggregate_pubkey: ?[48]u8,
        next_sync_committee_branch: ?[]const [32]u8,
        finalized_header: ?primitives.LightClientHeader.LightClientHeader,
        finality_branch: ?[]const [32]u8,
        sync_committee_bits: [64]u8,
        sync_committee_signature: [96]u8,
        signature_slot: u64,
    ) !LightClientUpdate {
        const has_next_sync_committee = next_sync_committee_pubkeys != null or
            next_sync_committee_aggregate_pubkey != null or
            next_sync_committee_branch != null;
        const has_finality = finalized_header != null or finality_branch != null;

        if (has_next_sync_committee and
            (next_sync_committee_pubkeys == null or
                next_sync_committee_aggregate_pubkey == null or
                next_sync_committee_branch == null))
        {
            return error.MissingJsonField;
        }

        if (has_finality and (finalized_header == null or finality_branch == null)) {
            return error.MissingJsonField;
        }

        var next_branch: [MAX_SYNC_COMMITTEE_BRANCH_DEPTH][32]u8 = [_][32]u8{[_]u8{0} ** 32} ** MAX_SYNC_COMMITTEE_BRANCH_DEPTH;
        var next_branch_len: u8 = 0;
        if (next_sync_committee_branch) |branch| {
            if (branch.len > MAX_SYNC_COMMITTEE_BRANCH_DEPTH) return error.InvalidArrayLength;
            @memcpy(next_branch[0..branch.len], branch);
            next_branch_len = @intCast(branch.len);
        }

        var finality_branch_storage: [MAX_LIGHT_CLIENT_BRANCH_DEPTH][32]u8 = [_][32]u8{[_]u8{0} ** 32} ** MAX_LIGHT_CLIENT_BRANCH_DEPTH;
        var finality_branch_len: u8 = 0;
        if (finality_branch) |branch| {
            if (branch.len > MAX_LIGHT_CLIENT_BRANCH_DEPTH) return error.InvalidArrayLength;
            @memcpy(finality_branch_storage[0..branch.len], branch);
            finality_branch_len = @intCast(branch.len);
        }

        return .{
            .attested_header = attested_header,
            .next_sync_committee_pubkeys = next_sync_committee_pubkeys orelse std.mem.zeroes([512][48]u8),
            .next_sync_committee_aggregate_pubkey = next_sync_committee_aggregate_pubkey orelse [_]u8{0} ** 48,
            .next_sync_committee_branch = next_branch,
            .next_sync_committee_branch_len = next_branch_len,
            .has_next_sync_committee = has_next_sync_committee,
            .finalized_header = finalized_header orelse std.mem.zeroes(primitives.LightClientHeader.LightClientHeader),
            .finality_branch = finality_branch_storage,
            .finality_branch_len = finality_branch_len,
            .has_finality = has_finality,
            .sync_committee_bits = sync_committee_bits,
            .sync_committee_signature = sync_committee_signature,
            .signature_slot = signature_slot,
        };
    }

    pub fn nextSyncCommitteeBranch(self: *const LightClientUpdate) []const [32]u8 {
        return self.next_sync_committee_branch[0..self.next_sync_committee_branch_len];
    }

    pub fn finalityBranch(self: *const LightClientUpdate) []const [32]u8 {
        return self.finality_branch[0..self.finality_branch_len];
    }

    pub fn maybeNextSyncCommitteeBranch(self: *const LightClientUpdate) ?[]const [32]u8 {
        if (!self.has_next_sync_committee) return null;
        return self.nextSyncCommitteeBranch();
    }

    pub fn maybeFinalityBranch(self: *const LightClientUpdate) ?[]const [32]u8 {
        if (!self.has_finality) return null;
        return self.finalityBranch();
    }

    pub fn maybeFinalizedHeader(self: LightClientUpdate) ?primitives.LightClientHeader.LightClientHeader {
        if (!self.has_finality) return null;
        return self.finalized_header;
    }

    pub fn equals(self: LightClientUpdate, other: LightClientUpdate) bool {
        return self.attested_header.equals(other.attested_header) and
            std.mem.eql(
                u8,
                std.mem.asBytes(&self.next_sync_committee_pubkeys),
                std.mem.asBytes(&other.next_sync_committee_pubkeys),
            ) and
            std.mem.eql(
                u8,
                self.next_sync_committee_aggregate_pubkey[0..],
                other.next_sync_committee_aggregate_pubkey[0..],
            ) and
            self.next_sync_committee_branch_len == other.next_sync_committee_branch_len and
            std.mem.eql(
                u8,
                std.mem.sliceAsBytes(self.nextSyncCommitteeBranch()),
                std.mem.sliceAsBytes(other.nextSyncCommitteeBranch()),
            ) and
            self.has_next_sync_committee == other.has_next_sync_committee and
            self.finalized_header.equals(other.finalized_header) and
            self.finality_branch_len == other.finality_branch_len and
            std.mem.eql(u8, std.mem.sliceAsBytes(self.finalityBranch()), std.mem.sliceAsBytes(other.finalityBranch())) and
            self.has_finality == other.has_finality and
            std.mem.eql(u8, self.sync_committee_bits[0..], other.sync_committee_bits[0..]) and
            std.mem.eql(u8, self.sync_committee_signature[0..], other.sync_committee_signature[0..]) and
            self.signature_slot == other.signature_slot;
    }
};

pub const LightClientFinalityUpdate = struct {
    attested_header: primitives.LightClientHeader.LightClientHeader,
    finalized_header: primitives.LightClientHeader.LightClientHeader,
    finality_branch: [MAX_LIGHT_CLIENT_BRANCH_DEPTH][32]u8,
    finality_branch_len: u8,
    has_finality: bool,
    sync_committee_bits: [64]u8,
    sync_committee_signature: [96]u8,
    signature_slot: u64,

    pub fn from(
        attested_header: primitives.LightClientHeader.LightClientHeader,
        finalized_header: primitives.LightClientHeader.LightClientHeader,
        finality_branch: [6][32]u8,
        sync_committee_bits: [64]u8,
        sync_committee_signature: [96]u8,
        signature_slot: u64,
    ) LightClientFinalityUpdate {
        var finality_branch_storage: [MAX_LIGHT_CLIENT_BRANCH_DEPTH][32]u8 = [_][32]u8{[_]u8{0} ** 32} ** MAX_LIGHT_CLIENT_BRANCH_DEPTH;
        @memcpy(finality_branch_storage[0..finality_branch.len], finality_branch[0..]);
        return .{
            .attested_header = attested_header,
            .finalized_header = finalized_header,
            .finality_branch = finality_branch_storage,
            .finality_branch_len = @intCast(finality_branch.len),
            .has_finality = true,
            .sync_committee_bits = sync_committee_bits,
            .sync_committee_signature = sync_committee_signature,
            .signature_slot = signature_slot,
        };
    }

    pub fn fromBranch(
        attested_header: primitives.LightClientHeader.LightClientHeader,
        finalized_header: primitives.LightClientHeader.LightClientHeader,
        finality_branch: []const [32]u8,
        sync_committee_bits: [64]u8,
        sync_committee_signature: [96]u8,
        signature_slot: u64,
    ) !LightClientFinalityUpdate {
        if (finality_branch.len > MAX_LIGHT_CLIENT_BRANCH_DEPTH) return error.InvalidArrayLength;

        var finality_branch_storage: [MAX_LIGHT_CLIENT_BRANCH_DEPTH][32]u8 = [_][32]u8{[_]u8{0} ** 32} ** MAX_LIGHT_CLIENT_BRANCH_DEPTH;
        @memcpy(finality_branch_storage[0..finality_branch.len], finality_branch);
        return .{
            .attested_header = attested_header,
            .finalized_header = finalized_header,
            .finality_branch = finality_branch_storage,
            .finality_branch_len = @intCast(finality_branch.len),
            .has_finality = true,
            .sync_committee_bits = sync_committee_bits,
            .sync_committee_signature = sync_committee_signature,
            .signature_slot = signature_slot,
        };
    }

    pub fn fromOptionalBranch(
        attested_header: primitives.LightClientHeader.LightClientHeader,
        finalized_header: ?primitives.LightClientHeader.LightClientHeader,
        finality_branch: ?[]const [32]u8,
        sync_committee_bits: [64]u8,
        sync_committee_signature: [96]u8,
        signature_slot: u64,
    ) !LightClientFinalityUpdate {
        const has_finality = finalized_header != null or finality_branch != null;
        if (has_finality and (finalized_header == null or finality_branch == null)) {
            return error.MissingJsonField;
        }

        var finality_branch_storage: [MAX_LIGHT_CLIENT_BRANCH_DEPTH][32]u8 = [_][32]u8{[_]u8{0} ** 32} ** MAX_LIGHT_CLIENT_BRANCH_DEPTH;
        var finality_branch_len: u8 = 0;
        if (finality_branch) |branch| {
            if (branch.len > MAX_LIGHT_CLIENT_BRANCH_DEPTH) return error.InvalidArrayLength;
            @memcpy(finality_branch_storage[0..branch.len], branch);
            finality_branch_len = @intCast(branch.len);
        }

        return .{
            .attested_header = attested_header,
            .finalized_header = finalized_header orelse std.mem.zeroes(primitives.LightClientHeader.LightClientHeader),
            .finality_branch = finality_branch_storage,
            .finality_branch_len = finality_branch_len,
            .has_finality = has_finality,
            .sync_committee_bits = sync_committee_bits,
            .sync_committee_signature = sync_committee_signature,
            .signature_slot = signature_slot,
        };
    }

    pub fn finalityBranch(self: *const LightClientFinalityUpdate) []const [32]u8 {
        return self.finality_branch[0..self.finality_branch_len];
    }

    pub fn maybeFinalityBranch(self: *const LightClientFinalityUpdate) ?[]const [32]u8 {
        if (!self.has_finality) return null;
        return self.finalityBranch();
    }

    pub fn maybeFinalizedHeader(self: LightClientFinalityUpdate) ?primitives.LightClientHeader.LightClientHeader {
        if (!self.has_finality) return null;
        return self.finalized_header;
    }

    pub fn equals(self: LightClientFinalityUpdate, other: LightClientFinalityUpdate) bool {
        return self.attested_header.equals(other.attested_header) and
            self.finalized_header.equals(other.finalized_header) and
            self.finality_branch_len == other.finality_branch_len and
            std.mem.eql(u8, std.mem.sliceAsBytes(self.finalityBranch()), std.mem.sliceAsBytes(other.finalityBranch())) and
            self.has_finality == other.has_finality and
            std.mem.eql(u8, self.sync_committee_bits[0..], other.sync_committee_bits[0..]) and
            std.mem.eql(u8, self.sync_committee_signature[0..], other.sync_committee_signature[0..]) and
            self.signature_slot == other.signature_slot;
    }
};

pub const LightClientOptimisticUpdate = struct {
    attested_header: primitives.LightClientHeader.LightClientHeader,
    sync_committee_bits: [64]u8,
    sync_committee_signature: [96]u8,
    signature_slot: u64,

    pub fn from(
        attested_header: primitives.LightClientHeader.LightClientHeader,
        sync_committee_bits: [64]u8,
        sync_committee_signature: [96]u8,
        signature_slot: u64,
    ) LightClientOptimisticUpdate {
        return .{
            .attested_header = attested_header,
            .sync_committee_bits = sync_committee_bits,
            .sync_committee_signature = sync_committee_signature,
            .signature_slot = signature_slot,
        };
    }

    pub fn equals(self: LightClientOptimisticUpdate, other: LightClientOptimisticUpdate) bool {
        return self.attested_header.equals(other.attested_header) and
            std.mem.eql(u8, self.sync_committee_bits[0..], other.sync_committee_bits[0..]) and
            std.mem.eql(u8, self.sync_committee_signature[0..], other.sync_committee_signature[0..]) and
            self.signature_slot == other.signature_slot;
    }
};

pub const GenericUpdate = struct {
    attested_header: primitives.LightClientHeader.LightClientHeader,
    sync_committee_bits: [64]u8,
    sync_committee_signature: [96]u8,
    signature_slot: u64,
    next_sync_committee_pubkeys: ?[512][48]u8,
    next_sync_committee_aggregate_pubkey: ?[48]u8,
    next_sync_committee_branch: ?[]const [32]u8,
    finalized_header: ?primitives.LightClientHeader.LightClientHeader,
    finality_branch: ?[]const [32]u8,

    pub fn from(
        attested_header: primitives.LightClientHeader.LightClientHeader,
        sync_committee_bits: [64]u8,
        sync_committee_signature: [96]u8,
        signature_slot: u64,
        next_sync_committee_pubkeys: ?[512][48]u8,
        next_sync_committee_aggregate_pubkey: ?[48]u8,
        next_sync_committee_branch: ?[]const [32]u8,
        finalized_header: ?primitives.LightClientHeader.LightClientHeader,
        finality_branch: ?[]const [32]u8,
    ) GenericUpdate {
        return .{
            .attested_header = attested_header,
            .sync_committee_bits = sync_committee_bits,
            .sync_committee_signature = sync_committee_signature,
            .signature_slot = signature_slot,
            .next_sync_committee_pubkeys = next_sync_committee_pubkeys,
            .next_sync_committee_aggregate_pubkey = next_sync_committee_aggregate_pubkey,
            .next_sync_committee_branch = next_sync_committee_branch,
            .finalized_header = finalized_header,
            .finality_branch = finality_branch,
        };
    }

    pub fn equals(self: GenericUpdate, other: GenericUpdate) bool {
        return self.attested_header.equals(other.attested_header) and
            std.mem.eql(u8, self.sync_committee_bits[0..], other.sync_committee_bits[0..]) and
            std.mem.eql(u8, self.sync_committee_signature[0..], other.sync_committee_signature[0..]) and
            self.signature_slot == other.signature_slot and
            optionalFixedValueEquals([512][48]u8, self.next_sync_committee_pubkeys, other.next_sync_committee_pubkeys) and
            optionalFixedValueEquals([48]u8, self.next_sync_committee_aggregate_pubkey, other.next_sync_committee_aggregate_pubkey) and
            optionalBranchEquals(self.next_sync_committee_branch, other.next_sync_committee_branch) and
            optionalHeaderEquals(self.finalized_header, other.finalized_header) and
            optionalBranchEquals(self.finality_branch, other.finality_branch);
    }
};

pub const StoredGenericUpdate = struct {
    attested_header: primitives.LightClientHeader.LightClientHeader,
    sync_committee_bits: [64]u8,
    sync_committee_signature: [96]u8,
    signature_slot: u64,
    next_sync_committee_pubkeys: ?[512][48]u8,
    next_sync_committee_aggregate_pubkey: ?[48]u8,
    next_sync_committee_branch: [MAX_LIGHT_CLIENT_BRANCH_DEPTH][32]u8,
    next_sync_committee_branch_len: u8,
    finalized_header: ?primitives.LightClientHeader.LightClientHeader,
    finality_branch: [MAX_LIGHT_CLIENT_BRANCH_DEPTH][32]u8,
    finality_branch_len: u8,

    pub fn fromGeneric(update: GenericUpdate) !StoredGenericUpdate {
        var next_branch: [MAX_LIGHT_CLIENT_BRANCH_DEPTH][32]u8 = [_][32]u8{[_]u8{0} ** 32} ** MAX_LIGHT_CLIENT_BRANCH_DEPTH;
        const next_branch_len = if (update.next_sync_committee_branch) |branch| blk: {
            if (branch.len > MAX_LIGHT_CLIENT_BRANCH_DEPTH) return error.InvalidArrayLength;
            @memcpy(next_branch[0..branch.len], branch);
            break :blk branch.len;
        } else 0;

        var finality_branch_storage: [MAX_LIGHT_CLIENT_BRANCH_DEPTH][32]u8 = [_][32]u8{[_]u8{0} ** 32} ** MAX_LIGHT_CLIENT_BRANCH_DEPTH;
        const finality_branch_len = if (update.finality_branch) |branch| blk: {
            if (branch.len > MAX_LIGHT_CLIENT_BRANCH_DEPTH) return error.InvalidArrayLength;
            @memcpy(finality_branch_storage[0..branch.len], branch);
            break :blk branch.len;
        } else 0;

        return .{
            .attested_header = update.attested_header,
            .sync_committee_bits = update.sync_committee_bits,
            .sync_committee_signature = update.sync_committee_signature,
            .signature_slot = update.signature_slot,
            .next_sync_committee_pubkeys = update.next_sync_committee_pubkeys,
            .next_sync_committee_aggregate_pubkey = update.next_sync_committee_aggregate_pubkey,
            .next_sync_committee_branch = next_branch,
            .next_sync_committee_branch_len = @intCast(next_branch_len),
            .finalized_header = update.finalized_header,
            .finality_branch = finality_branch_storage,
            .finality_branch_len = @intCast(finality_branch_len),
        };
    }

    pub fn toGeneric(self: *const StoredGenericUpdate) GenericUpdate {
        const next_branch: ?[]const [32]u8 = if (self.next_sync_committee_branch_len > 0)
            self.next_sync_committee_branch[0..self.next_sync_committee_branch_len]
        else
            null;
        const finality_branch: ?[]const [32]u8 = if (self.finality_branch_len > 0)
            self.finality_branch[0..self.finality_branch_len]
        else
            null;

        return GenericUpdate.from(
            self.attested_header,
            self.sync_committee_bits,
            self.sync_committee_signature,
            self.signature_slot,
            self.next_sync_committee_pubkeys,
            self.next_sync_committee_aggregate_pubkey,
            next_branch,
            self.finalized_header,
            finality_branch,
        );
    }

    pub fn equals(self: StoredGenericUpdate, other: StoredGenericUpdate) bool {
        var self_copy = self;
        var other_copy = other;
        return self_copy.toGeneric().equals(other_copy.toGeneric());
    }
};

pub const LightClientStore = struct {
    finalized_header: primitives.LightClientHeader.LightClientHeader,
    current_sync_committee_pubkeys: [512][48]u8,
    current_sync_committee_aggregate_pubkey: [48]u8,
    next_sync_committee_pubkeys: ?[512][48]u8,
    next_sync_committee_aggregate_pubkey: ?[48]u8,
    best_valid_update: ?StoredGenericUpdate,
    optimistic_header: primitives.LightClientHeader.LightClientHeader,
    previous_max_active_participants: u64,
    current_max_active_participants: u64,

    pub fn from(
        finalized_header: primitives.LightClientHeader.LightClientHeader,
        current_sync_committee_pubkeys: [512][48]u8,
        current_sync_committee_aggregate_pubkey: [48]u8,
        next_sync_committee_pubkeys: ?[512][48]u8,
        next_sync_committee_aggregate_pubkey: ?[48]u8,
        optimistic_header: primitives.LightClientHeader.LightClientHeader,
        previous_max_active_participants: u64,
        current_max_active_participants: u64,
    ) LightClientStore {
        return .{
            .finalized_header = finalized_header,
            .current_sync_committee_pubkeys = current_sync_committee_pubkeys,
            .current_sync_committee_aggregate_pubkey = current_sync_committee_aggregate_pubkey,
            .next_sync_committee_pubkeys = next_sync_committee_pubkeys,
            .next_sync_committee_aggregate_pubkey = next_sync_committee_aggregate_pubkey,
            .best_valid_update = null,
            .optimistic_header = optimistic_header,
            .previous_max_active_participants = previous_max_active_participants,
            .current_max_active_participants = current_max_active_participants,
        };
    }

    pub fn equals(self: LightClientStore, other: LightClientStore) bool {
        return self.finalized_header.equals(other.finalized_header) and
            std.mem.eql(
                u8,
                std.mem.asBytes(&self.current_sync_committee_pubkeys),
                std.mem.asBytes(&other.current_sync_committee_pubkeys),
            ) and
            std.mem.eql(
                u8,
                self.current_sync_committee_aggregate_pubkey[0..],
                other.current_sync_committee_aggregate_pubkey[0..],
            ) and
            optionalFixedValueEquals([512][48]u8, self.next_sync_committee_pubkeys, other.next_sync_committee_pubkeys) and
            optionalFixedValueEquals([48]u8, self.next_sync_committee_aggregate_pubkey, other.next_sync_committee_aggregate_pubkey) and
            optionalStoredUpdateEquals(self.best_valid_update, other.best_valid_update) and
            self.optimistic_header.equals(other.optimistic_header) and
            self.previous_max_active_participants == other.previous_max_active_participants and
            self.current_max_active_participants == other.current_max_active_participants;
    }
};

fn optionalFixedValueEquals(comptime T: type, left: ?T, right: ?T) bool {
    if (left) |left_value| {
        if (right) |right_value| {
            return std.mem.eql(u8, std.mem.asBytes(&left_value), std.mem.asBytes(&right_value));
        }
        return false;
    }
    return right == null;
}

fn branchEquals(left: []const [32]u8, right: []const [32]u8) bool {
    if (left.len != right.len) {
        return false;
    }

    return std.mem.eql(u8, std.mem.sliceAsBytes(left), std.mem.sliceAsBytes(right));
}

fn optionalBranchEquals(left: ?[]const [32]u8, right: ?[]const [32]u8) bool {
    if (left) |left_branch| {
        if (right) |right_branch| {
            return branchEquals(left_branch, right_branch);
        }
        return false;
    }
    return right == null;
}

fn optionalStoredUpdateEquals(left: ?StoredGenericUpdate, right: ?StoredGenericUpdate) bool {
    if (left) |left_update| {
        if (right) |right_update| {
            return left_update.equals(right_update);
        }
        return false;
    }
    return right == null;
}

fn optionalHeaderEquals(
    left: ?primitives.LightClientHeader.LightClientHeader,
    right: ?primitives.LightClientHeader.LightClientHeader,
) bool {
    if (left) |left_header| {
        if (right) |right_header| {
            return left_header.equals(right_header);
        }
        return false;
    }
    return right == null;
}

fn fixtureLightClientHeader(slot: u64, marker: u8) primitives.LightClientHeader.LightClientHeader {
    return primitives.LightClientHeader.LightClientHeader.from(
        primitives.LightClientHeader.LightClientHeader.BeaconBlockHeader.from(
            slot,
            slot + 1,
            [_]u8{marker} ** 32,
            [_]u8{marker +% 1} ** 32,
            [_]u8{marker +% 2} ** 32,
        ),
        primitives.LightClientHeader.LightClientHeader.ExecutionPayloadHeaderFields.from(
            [_]u8{marker +% 3} ** 32,
            [_]u8{marker +% 4} ** 20,
            [_]u8{marker +% 5} ** 32,
            [_]u8{marker +% 6} ** 32,
            [_]u8{marker +% 7} ** 256,
            [_]u8{marker +% 8} ** 32,
            slot + 10,
            30_000_000,
            15_000_000,
            1_700_000_000 + slot,
            @as(u256, marker) + 1,
            [_]u8{marker +% 9} ** 32,
            [_]u8{marker +% 10} ** 32,
            [_]u8{marker +% 11} ** 32,
            slot + 12,
            slot + 13,
        ),
        [_][32]u8{[_]u8{marker +% 12} ** 32} ** 4,
    );
}

fn fixtureSyncCommitteePubkeys(marker: u8) [512][48]u8 {
    return [_][48]u8{[_]u8{marker} ** 48} ** 512;
}

fn fixtureAggregatePubkey(marker: u8) [48]u8 {
    return [_]u8{marker} ** 48;
}

fn fixtureSyncCommitteeBits(marker: u8) [64]u8 {
    return [_]u8{marker} ** 64;
}

fn fixtureSyncCommitteeSignature(marker: u8) [96]u8 {
    return [_]u8{marker} ** 96;
}

test "LightClientBootstrap: from creates bootstrap and exposes fields" {
    const bootstrap = LightClientBootstrap.from(
        fixtureLightClientHeader(1, 1),
        fixtureSyncCommitteePubkeys(2),
        fixtureAggregatePubkey(3),
        [_][32]u8{[_]u8{4} ** 32} ** 5,
    );

    try std.testing.expectEqual(@as(u64, 1), bootstrap.header.beacon.slot);
    try std.testing.expectEqual(@as(u8, 2), bootstrap.current_sync_committee_pubkeys[0][0]);
    try std.testing.expectEqual(@as(u8, 3), bootstrap.current_sync_committee_aggregate_pubkey[0]);
    try std.testing.expectEqual(@as(u8, 4), bootstrap.current_sync_committee_branch[0][0]);
}

test "LightClientBootstrap: equals matches identical values" {
    const bootstrap_one = LightClientBootstrap.from(
        fixtureLightClientHeader(1, 1),
        fixtureSyncCommitteePubkeys(2),
        fixtureAggregatePubkey(3),
        [_][32]u8{[_]u8{4} ** 32} ** 5,
    );
    const bootstrap_two = LightClientBootstrap.from(
        fixtureLightClientHeader(1, 1),
        fixtureSyncCommitteePubkeys(2),
        fixtureAggregatePubkey(3),
        [_][32]u8{[_]u8{4} ** 32} ** 5,
    );

    try std.testing.expect(bootstrap_one.equals(bootstrap_two));
}

test "LightClientUpdate: from creates update and equals matches identical values" {
    const update_one = LightClientUpdate.from(
        fixtureLightClientHeader(2, 5),
        fixtureSyncCommitteePubkeys(6),
        fixtureAggregatePubkey(7),
        [_][32]u8{[_]u8{8} ** 32} ** 5,
        fixtureLightClientHeader(3, 9),
        [_][32]u8{[_]u8{10} ** 32} ** 6,
        fixtureSyncCommitteeBits(11),
        fixtureSyncCommitteeSignature(12),
        99,
    );
    const update_two = LightClientUpdate.from(
        fixtureLightClientHeader(2, 5),
        fixtureSyncCommitteePubkeys(6),
        fixtureAggregatePubkey(7),
        [_][32]u8{[_]u8{8} ** 32} ** 5,
        fixtureLightClientHeader(3, 9),
        [_][32]u8{[_]u8{10} ** 32} ** 6,
        fixtureSyncCommitteeBits(11),
        fixtureSyncCommitteeSignature(12),
        99,
    );

    try std.testing.expectEqual(@as(u64, 99), update_one.signature_slot);
    try std.testing.expect(update_one.equals(update_two));
}

test "LightClientFinalityUpdate: equals detects differences" {
    const update_one = LightClientFinalityUpdate.from(
        fixtureLightClientHeader(4, 13),
        fixtureLightClientHeader(5, 14),
        [_][32]u8{[_]u8{15} ** 32} ** 6,
        fixtureSyncCommitteeBits(16),
        fixtureSyncCommitteeSignature(17),
        111,
    );
    const update_two = LightClientFinalityUpdate.from(
        fixtureLightClientHeader(4, 13),
        fixtureLightClientHeader(5, 14),
        [_][32]u8{[_]u8{15} ** 32} ** 6,
        fixtureSyncCommitteeBits(16),
        fixtureSyncCommitteeSignature(17),
        112,
    );

    try std.testing.expect(!update_one.equals(update_two));
}

test "LightClientOptimisticUpdate: from creates optimistic update" {
    const update = LightClientOptimisticUpdate.from(
        fixtureLightClientHeader(6, 18),
        fixtureSyncCommitteeBits(19),
        fixtureSyncCommitteeSignature(20),
        130,
    );

    try std.testing.expectEqual(@as(u64, 130), update.signature_slot);
    try std.testing.expectEqual(@as(u8, 19), update.sync_committee_bits[0]);
}

test "LightClientOptimisticUpdate: equals detects differences" {
    const update_one = LightClientOptimisticUpdate.from(
        fixtureLightClientHeader(6, 18),
        fixtureSyncCommitteeBits(19),
        fixtureSyncCommitteeSignature(20),
        130,
    );
    const update_two = LightClientOptimisticUpdate.from(
        fixtureLightClientHeader(6, 18),
        fixtureSyncCommitteeBits(19),
        fixtureSyncCommitteeSignature(20),
        131,
    );

    try std.testing.expect(!update_one.equals(update_two));
}

test "GenericUpdate: equals compares optional branches by content" {
    var next_branch_one = [_][32]u8{[_]u8{21} ** 32} ** 5;
    var next_branch_two = [_][32]u8{[_]u8{21} ** 32} ** 5;
    var finality_branch_one = [_][32]u8{[_]u8{22} ** 32} ** 6;
    var finality_branch_two = [_][32]u8{[_]u8{22} ** 32} ** 6;

    const update_one = GenericUpdate.from(
        fixtureLightClientHeader(7, 23),
        fixtureSyncCommitteeBits(24),
        fixtureSyncCommitteeSignature(25),
        140,
        fixtureSyncCommitteePubkeys(26),
        fixtureAggregatePubkey(27),
        next_branch_one[0..],
        fixtureLightClientHeader(8, 28),
        finality_branch_one[0..],
    );
    const update_two = GenericUpdate.from(
        fixtureLightClientHeader(7, 23),
        fixtureSyncCommitteeBits(24),
        fixtureSyncCommitteeSignature(25),
        140,
        fixtureSyncCommitteePubkeys(26),
        fixtureAggregatePubkey(27),
        next_branch_two[0..],
        fixtureLightClientHeader(8, 28),
        finality_branch_two[0..],
    );

    try std.testing.expect(update_one.equals(update_two));
}

test "LightClientStore: from creates store and equals matches identical values" {
    const store_one = LightClientStore.from(
        fixtureLightClientHeader(9, 29),
        fixtureSyncCommitteePubkeys(30),
        fixtureAggregatePubkey(31),
        fixtureSyncCommitteePubkeys(32),
        fixtureAggregatePubkey(33),
        fixtureLightClientHeader(10, 34),
        200,
        300,
    );
    const store_two = LightClientStore.from(
        fixtureLightClientHeader(9, 29),
        fixtureSyncCommitteePubkeys(30),
        fixtureAggregatePubkey(31),
        fixtureSyncCommitteePubkeys(32),
        fixtureAggregatePubkey(33),
        fixtureLightClientHeader(10, 34),
        200,
        300,
    );

    try std.testing.expectEqual(@as(u64, 200), store_one.previous_max_active_participants);
    try std.testing.expect(store_one.equals(store_two));
}
