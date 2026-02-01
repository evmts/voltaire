/// SSZ (Simple Serialize) encoding
///
/// Ethereum consensus layer serialization format as specified in:
/// https://github.com/ethereum/consensus-specs/blob/dev/ssz/simple-serialize.md
///
/// Provides:
/// - Basic type encoding (uint8, uint16, uint32, uint64, uint256, bool)
/// - Variable-length type encoding (vectors, lists, bitvectors, bitlists)
/// - Container (struct) encoding
/// - Merkleization and hash tree root computation
pub const basicTypes = @import("basicTypes.zig");
pub const variableTypes = @import("variableTypes.zig");
pub const container = @import("container.zig");
pub const merkle = @import("merkle.zig");

// Re-export commonly used functions
pub const encodeUint8 = basicTypes.encodeUint8;
pub const encodeUint16 = basicTypes.encodeUint16;
pub const encodeUint32 = basicTypes.encodeUint32;
pub const encodeUint64 = basicTypes.encodeUint64;
pub const encodeUint256 = basicTypes.encodeUint256;
pub const encodeBool = basicTypes.encodeBool;

pub const decodeUint8 = basicTypes.decodeUint8;
pub const decodeUint16 = basicTypes.decodeUint16;
pub const decodeUint32 = basicTypes.decodeUint32;
pub const decodeUint64 = basicTypes.decodeUint64;
pub const decodeUint256 = basicTypes.decodeUint256;
pub const decodeBool = basicTypes.decodeBool;

pub const encodeVector = variableTypes.encodeVector;
pub const encodeList = variableTypes.encodeList;
pub const encodeBitvector = variableTypes.encodeBitvector;
pub const encodeBitlist = variableTypes.encodeBitlist;
pub const encodeBytes = variableTypes.encodeBytes;

pub const encodeContainer = container.encodeContainer;
pub const isFixedSize = container.isFixedSize;
pub const fixedSize = container.fixedSize;

pub const hashTreeRoot = merkle.hashTreeRoot;
pub const hashTreeRootBasic = merkle.hashTreeRootBasic;

test {
    _ = basicTypes;
    _ = variableTypes;
    _ = container;
    _ = merkle;
}
