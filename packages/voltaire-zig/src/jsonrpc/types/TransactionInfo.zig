const std = @import("std");
const Address = @import("Address.zig").Address;
const Hash = @import("Hash.zig").Hash;
const Quantity = @import("Quantity.zig").Quantity;

/// TransactionInfo for JSON-RPC block responses.
/// This is a simplified wrapper around transaction data that can be
/// either a hash (for non-hydrated) or full transaction info (for hydrated).
pub const TransactionInfo = union(enum) {
    /// Transaction hash only (non-hydrated)
    hash: Hash,
    /// Full transaction data (hydrated) - uses the existing TransactionResponse pattern
    full: FullTransactionInfo,

    pub fn jsonStringify(self: TransactionInfo, jws: *std.json.Stringify) !void {
        switch (self) {
            .hash => |h| try jws.write(h),
            .full => |f| try jws.write(f),
        }
    }
};

/// FullTransactionInfo represents a hydrated transaction in a block response.
/// This matches the execution-apis spec for transaction objects in eth_getBlockByHash/Number.
pub const FullTransactionInfo = struct {
    // Transaction type
    type: TransactionType,
    // Common fields
    hash: Hash,
    nonce: Quantity,
    blockHash: ?Hash,
    blockNumber: ?Quantity,
    transactionIndex: ?Quantity,
    from: Address,
    to: ?Address,
    value: Quantity,
    gas: Quantity,
    input: Quantity, // DATA
    // Legacy fields
    gasPrice: ?Quantity = null,
    v: ?Quantity = null,
    r: ?Quantity = null,
    s: ?Quantity = null,
    // EIP-2930 / EIP-1559 / EIP-4844 / EIP-7702 fields
    chainId: ?Quantity = null,
    accessList: ?[]const AccessListItem = null,
    // EIP-1559 fields
    maxFeePerGas: ?Quantity = null,
    maxPriorityFeePerGas: ?Quantity = null,
    // EIP-4844 fields
    maxFeePerBlobGas: ?Quantity = null,
    blobVersionedHashes: ?[]const Hash = null,
    // EIP-7702 fields
    authorizationList: ?std.json.Value = null,

    pub fn jsonStringify(self: FullTransactionInfo, jws: *std.json.Stringify) !void {
        try jws.beginObject();

        // Type
        try jws.objectField("type");
        try jws.print("\"0x{x}\"", .{@intFromEnum(self.type)});

        // Common fields
        try jws.objectField("hash");
        try jws.write(self.hash);
        try jws.objectField("nonce");
        try jws.write(self.nonce);
        try jws.objectField("blockHash");
        if (self.blockHash) |bh| {
            try jws.write(bh);
        } else {
            try jws.writeNull();
        }
        try jws.objectField("blockNumber");
        if (self.blockNumber) |bn| {
            try jws.write(bn);
        } else {
            try jws.writeNull();
        }
        try jws.objectField("transactionIndex");
        if (self.transactionIndex) |ti| {
            try jws.write(ti);
        } else {
            try jws.writeNull();
        }
        try jws.objectField("from");
        try jws.write(self.from);
        try jws.objectField("to");
        if (self.to) |to_addr| {
            try jws.write(to_addr);
        } else {
            try jws.writeNull();
        }
        try jws.objectField("value");
        try jws.write(self.value);
        try jws.objectField("gas");
        try jws.write(self.gas);
        try jws.objectField("input");
        try jws.write(self.input);

        // Gas price (legacy or maxFeePerGas for EIP-1559)
        if (self.gasPrice) |gp| {
            try jws.objectField("gasPrice");
            try jws.write(gp);
        }
        if (self.maxFeePerGas) |mfg| {
            try jws.objectField("maxFeePerGas");
            try jws.write(mfg);
        }
        if (self.maxPriorityFeePerGas) |mpfg| {
            try jws.objectField("maxPriorityFeePerGas");
            try jws.write(mpfg);
        }

        // Chain ID
        if (self.chainId) |cid| {
            try jws.objectField("chainId");
            try jws.write(cid);
        }

        // Access list
        if (self.accessList) |al| {
            try jws.objectField("accessList");
            try jws.beginArray();
            for (al) |item| {
                try jws.beginObject();
                try jws.objectField("address");
                try jws.write(item.address);
                try jws.objectField("storageKeys");
                try jws.beginArray();
                for (item.storageKeys) |key| {
                    try jws.write(key);
                }
                try jws.endArray();
                try jws.endObject();
            }
            try jws.endArray();
        }

        // Blob fields (EIP-4844)
        if (self.maxFeePerBlobGas) |mfbg| {
            try jws.objectField("maxFeePerBlobGas");
            try jws.write(mfbg);
        }
        if (self.blobVersionedHashes) |bvh| {
            try jws.objectField("blobVersionedHashes");
            try jws.beginArray();
            for (bvh) |hash_val| {
                try jws.write(hash_val);
            }
            try jws.endArray();
        }

        // Signature fields (for legacy)
        if (self.v) |v| {
            try jws.objectField("v");
            try jws.write(v);
        }
        if (self.r) |r| {
            try jws.objectField("r");
            try jws.write(r);
        }
        if (self.s) |s| {
            try jws.objectField("s");
            try jws.write(s);
        }

        // EIP-7702 authorization list
        if (self.authorizationList) |al| {
            try jws.objectField("authorizationList");
            try jws.write(al);
        }

        try jws.endObject();
    }
};

pub const TransactionType = enum(u8) {
    legacy = 0x0,
    eip2930 = 0x1,
    eip1559 = 0x2,
    eip4844 = 0x3,
    eip7702 = 0x4,
};

pub const AccessListItem = struct {
    address: Address,
    storageKeys: []const Hash,
};
