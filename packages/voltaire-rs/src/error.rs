//! Error types for Voltaire operations.
//!
//! All errors are represented by the [`Error`] enum, which provides detailed
//! error variants for different failure modes. The [`Result`] type alias
//! provides convenient error handling.

use thiserror::Error;

/// Result type alias using Voltaire's Error type.
pub type Result<T> = core::result::Result<T, Error>;

/// Errors that can occur during Voltaire operations.
#[derive(Debug, Clone, PartialEq, Eq, Error)]
#[non_exhaustive]
pub enum Error {
    /// Invalid hexadecimal string.
    #[error("invalid hex: {0}")]
    InvalidHex(String),

    /// Invalid length for the operation.
    #[error("invalid length: expected {expected}, got {actual}")]
    InvalidLength {
        /// Expected length in bytes.
        expected: usize,
        /// Actual length provided.
        actual: usize,
    },

    /// Invalid checksum (EIP-55).
    #[error("invalid checksum")]
    InvalidChecksum,

    /// Out of memory during operation.
    #[error("out of memory")]
    OutOfMemory,

    /// Invalid input data.
    #[error("invalid input: {0}")]
    InvalidInput(String),

    /// Invalid cryptographic signature.
    #[error("invalid signature: {0}")]
    InvalidSignature(String),

    /// Invalid function selector.
    #[error("invalid selector")]
    InvalidSelector,

    /// Unsupported type in ABI encoding.
    #[error("unsupported type: {0}")]
    UnsupportedType(String),

    /// Maximum length exceeded.
    #[error("max length exceeded: {max}")]
    MaxLengthExceeded {
        /// Maximum allowed length.
        max: usize,
    },

    /// Invalid access list.
    #[error("invalid access list")]
    InvalidAccessList,

    /// Invalid authorization (EIP-7702).
    #[error("invalid authorization")]
    InvalidAuthorization,

    /// Invalid snapshot ID.
    #[error("invalid snapshot")]
    InvalidSnapshot,

    /// RPC request failed.
    #[error("rpc failed: {0}")]
    RpcFailed(String),

    /// RPC request is pending (async pattern).
    #[error("rpc pending")]
    RpcPending,

    /// No pending RPC request.
    #[error("no pending request")]
    NoPendingRequest,

    /// Output buffer too small.
    #[error("output too small: need {needed}, got {actual}")]
    OutputTooSmall {
        /// Bytes needed.
        needed: usize,
        /// Bytes available.
        actual: usize,
    },

    /// Block not found.
    #[error("block not found: {0}")]
    BlockNotFound(String),

    /// Invalid parent block.
    #[error("invalid parent block")]
    InvalidParent,

    /// FFI error from native library.
    #[error("ffi error: code {0}")]
    Ffi(i32),
}

impl Error {
    /// Create an InvalidLength error.
    #[inline]
    pub fn invalid_length(expected: usize, actual: usize) -> Self {
        Self::InvalidLength { expected, actual }
    }

    /// Create an OutputTooSmall error.
    #[inline]
    pub fn output_too_small(needed: usize, actual: usize) -> Self {
        Self::OutputTooSmall { needed, actual }
    }

    /// Create an InvalidHex error.
    #[inline]
    pub fn invalid_hex(msg: impl Into<String>) -> Self {
        Self::InvalidHex(msg.into())
    }

    /// Create an InvalidInput error.
    #[inline]
    pub fn invalid_input(msg: impl Into<String>) -> Self {
        Self::InvalidInput(msg.into())
    }

    /// Create an InvalidSignature error.
    #[inline]
    pub fn invalid_signature(msg: impl Into<String>) -> Self {
        Self::InvalidSignature(msg.into())
    }
}

#[cfg(feature = "native")]
impl Error {
    /// Convert FFI error code to Error.
    pub(crate) fn from_ffi_code(code: i32) -> Self {
        match code {
            -1 => Self::InvalidHex("ffi".into()),
            -2 => Self::InvalidLength { expected: 0, actual: 0 },
            -3 => Self::InvalidChecksum,
            -4 => Self::OutOfMemory,
            -5 => Self::InvalidInput("ffi".into()),
            -6 => Self::InvalidSignature("ffi".into()),
            -7 => Self::InvalidSelector,
            -8 => Self::UnsupportedType("ffi".into()),
            -9 => Self::MaxLengthExceeded { max: 0 },
            -10 => Self::InvalidAccessList,
            -11 => Self::InvalidAuthorization,
            _ => Self::Ffi(code),
        }
    }
}
