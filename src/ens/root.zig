//! Ethereum Name Service (ENS) - Domain name resolution for Ethereum
//!
//! This module provides utilities for working with the Ethereum Name Service,
//! including namehash computation, content hash handling, and domain name
//! resolution utilities. ENS provides a decentralized naming system that
//! maps human-readable names to Ethereum addresses and other resources.
//!
//! ## Features
//!
//! ### Namehash Algorithm
//! - **Namehash**: Canonical name hashing for ENS domains
//! - **Label Processing**: Individual label validation and processing
//! - **Hierarchical Names**: Support for nested domain structures
//!
//! ### Content Hash Support
//! - **IPFS**: InterPlanetary File System content addressing
//! - **IPNS**: InterPlanetary Name System for mutable content
//! - **Swarm**: Decentralized storage platform integration
//! - **Arweave**: Permanent storage blockchain integration
//!
//! ### Domain Utilities
//! - **Validation**: Domain name format validation
//! - **Normalization**: Unicode normalization for internationalized domains
//! - **Resolution**: Address and content resolution helpers
//!
//! ## Usage Examples
//!
//! ### Basic Namehash
//! ```zig
//! const ens = @import("ens");
//! 
//! // Compute namehash for a domain
//! const hash = ens.namehash("vitalik.eth");
//! 
//! // Compute namehash for subdomain
//! const subdomain_hash = ens.namehash("blog.vitalik.eth");
//! ```
//!
//! ### Content Hash Processing
//! ```zig
//! // Parse content hash from ENS record
//! const content_hash = try ens.parseContentHash(record_data);
//! 
//! // Extract IPFS CID from content hash
//! if (content_hash.type == .ipfs) {
//!     const cid = content_hash.data;
//! }
//! ```

// Main ENS module
pub const Ens = @import("ens.zig");

// Re-export main types and functions
pub const EnsError = Ens.EnsError;
pub const ContentHashType = Ens.ContentHashType;
pub const namehash = Ens.namehash;
pub const parseContentHash = Ens.parseContentHash;
pub const encodeContentHash = Ens.encodeContentHash;
pub const normalizeLabel = Ens.normalizeLabel;
pub const isValidLabel = Ens.isValidLabel;