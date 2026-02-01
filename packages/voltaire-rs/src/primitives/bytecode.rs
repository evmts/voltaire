//! EVM bytecode analysis utilities.
//!
//! Provides bytecode parsing, JUMPDEST validation, and opcode inspection.
//!
//! The key insight is that `JUMPDEST` (0x5b) is only valid if it's not within
//! the immediate data of a `PUSH` instruction. This requires sequential scanning.

use crate::error::{Error, Result};
use crate::primitives::Hex;

#[cfg(not(feature = "std"))]
use alloc::vec::Vec;

// =============================================================================
// Opcode Constants
// =============================================================================

/// STOP opcode (0x00).
pub const STOP: u8 = 0x00;

/// ADD opcode (0x01).
pub const ADD: u8 = 0x01;

/// MUL opcode (0x02).
pub const MUL: u8 = 0x02;

/// SUB opcode (0x03).
pub const SUB: u8 = 0x03;

/// DIV opcode (0x04).
pub const DIV: u8 = 0x04;

/// JUMPDEST opcode (0x5b).
pub const JUMPDEST: u8 = 0x5b;

/// PUSH0 opcode (0x5f).
pub const PUSH0: u8 = 0x5f;

/// PUSH1 opcode (0x60).
pub const PUSH1: u8 = 0x60;

/// PUSH32 opcode (0x7f).
pub const PUSH32: u8 = 0x7f;

/// JUMP opcode (0x56).
pub const JUMP: u8 = 0x56;

/// JUMPI opcode (0x57).
pub const JUMPI: u8 = 0x57;

/// RETURN opcode (0xf3).
pub const RETURN: u8 = 0xf3;

/// REVERT opcode (0xfd).
pub const REVERT: u8 = 0xfd;

/// INVALID opcode (0xfe).
pub const INVALID: u8 = 0xfe;

/// SELFDESTRUCT opcode (0xff).
pub const SELFDESTRUCT: u8 = 0xff;

// =============================================================================
// Bytecode
// =============================================================================

/// EVM bytecode with cached JUMPDEST analysis.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Bytecode {
    /// Raw bytecode bytes.
    code: Vec<u8>,
    /// Cached valid JUMPDEST positions (sorted).
    jumpdests: Vec<u32>,
}

impl Bytecode {
    /// Create and analyze bytecode.
    ///
    /// # Example
    /// ```
    /// use voltaire_rs::primitives::bytecode::Bytecode;
    ///
    /// let code = vec![0x5b, 0x60, 0x5b, 0x00]; // JUMPDEST, PUSH1, 0x5b, STOP
    /// let bc = Bytecode::new(code);
    /// assert!(bc.is_valid_jumpdest(0));  // First 0x5b is valid
    /// assert!(!bc.is_valid_jumpdest(2)); // Second 0x5b is PUSH data
    /// ```
    pub fn new(code: Vec<u8>) -> Self {
        let jumpdests = analyze_jumpdests(&code);
        Self { code, jumpdests }
    }

    /// Parse bytecode from hex string.
    ///
    /// Accepts with or without `0x` prefix.
    ///
    /// # Errors
    /// Returns error if hex is invalid.
    pub fn from_hex(hex: &str) -> Result<Self> {
        let code = Hex::decode(hex)?;
        Ok(Self::new(code))
    }

    /// Check if position is a valid jump destination.
    ///
    /// A position is valid if:
    /// 1. It's within bounds
    /// 2. The opcode at that position is JUMPDEST (0x5b)
    /// 3. It's not within PUSH immediate data
    #[inline]
    pub fn is_valid_jumpdest(&self, position: u32) -> bool {
        self.jumpdests.binary_search(&position).is_ok()
    }

    /// Check if position is within PUSH immediate data.
    ///
    /// This requires scanning from the start to determine context.
    pub fn is_push_data(&self, position: u32) -> bool {
        let pos = position as usize;
        if pos >= self.code.len() {
            return false;
        }

        let mut i = 0;
        while i < pos {
            let opcode = self.code[i];
            if opcode >= PUSH1 && opcode <= PUSH32 {
                let push_size = (opcode - PUSH1 + 1) as usize;
                let data_start = i + 1;
                let data_end = data_start + push_size;
                if pos > i && pos < data_end {
                    return true;
                }
                i = data_end;
            } else {
                i += 1;
            }
        }
        false
    }

    /// Get opcode at position, or None if position is within PUSH data.
    pub fn get_opcode_at(&self, position: u32) -> Option<u8> {
        let pos = position as usize;
        if pos >= self.code.len() {
            return None;
        }
        if self.is_push_data(position) {
            return None;
        }
        Some(self.code[pos])
    }

    /// Get bytecode length.
    #[inline]
    pub fn len(&self) -> usize {
        self.code.len()
    }

    /// Check if bytecode is empty.
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.code.is_empty()
    }

    /// Get bytecode as bytes.
    #[inline]
    pub fn as_bytes(&self) -> &[u8] {
        &self.code
    }

    /// Get all valid JUMPDEST positions.
    #[inline]
    pub fn jumpdests(&self) -> &[u32] {
        &self.jumpdests
    }

    /// Consume self and return the raw bytecode.
    #[inline]
    pub fn into_bytes(self) -> Vec<u8> {
        self.code
    }
}

impl Default for Bytecode {
    fn default() -> Self {
        Self {
            code: Vec::new(),
            jumpdests: Vec::new(),
        }
    }
}

impl AsRef<[u8]> for Bytecode {
    fn as_ref(&self) -> &[u8] {
        &self.code
    }
}

impl From<Vec<u8>> for Bytecode {
    fn from(code: Vec<u8>) -> Self {
        Self::new(code)
    }
}

impl From<&[u8]> for Bytecode {
    fn from(code: &[u8]) -> Self {
        Self::new(code.to_vec())
    }
}

// =============================================================================
// Analysis Functions
// =============================================================================

/// Analyze bytecode and find all valid JUMPDEST positions.
///
/// Scans bytecode sequentially, skipping PUSH immediate data.
/// Returns sorted vector of valid JUMPDEST positions.
pub fn analyze_jumpdests(code: &[u8]) -> Vec<u32> {
    let mut jumpdests = Vec::new();
    let mut i = 0;

    while i < code.len() {
        let opcode = code[i];

        if opcode == JUMPDEST {
            jumpdests.push(i as u32);
        }

        // Skip PUSH immediate data
        if opcode >= PUSH1 && opcode <= PUSH32 {
            let push_size = (opcode - PUSH1 + 1) as usize;
            i += 1 + push_size;
        } else {
            i += 1;
        }
    }

    jumpdests
}

/// Validate bytecode for basic correctness.
///
/// Checks:
/// - Truncated PUSH instructions at end
///
/// # Errors
/// Returns error if bytecode is invalid.
pub fn validate(code: &[u8]) -> Result<()> {
    let mut i = 0;

    while i < code.len() {
        let opcode = code[i];

        // Check for truncated PUSH
        if opcode >= PUSH1 && opcode <= PUSH32 {
            let push_size = (opcode - PUSH1 + 1) as usize;
            let needed = i + 1 + push_size;
            if needed > code.len() {
                return Err(Error::invalid_input(format!(
                    "truncated PUSH{} at position {}: needs {} bytes, only {} remaining",
                    push_size,
                    i,
                    push_size,
                    code.len() - i - 1
                )));
            }
            i = needed;
        } else {
            i += 1;
        }
    }

    Ok(())
}

/// Validate bytecode with strict opcode checking.
///
/// Checks for:
/// - Truncated PUSH instructions
/// - Invalid opcodes (undefined in EVM)
///
/// Note: The EVM doesn't actually reject invalid opcodes until execution.
/// This is for static analysis purposes.
///
/// # Errors
/// Returns error if bytecode contains invalid opcodes.
pub fn validate_strict(code: &[u8]) -> Result<()> {
    // First do basic validation
    validate(code)?;

    let mut i = 0;
    while i < code.len() {
        let opcode = code[i];

        // Check for undefined opcodes
        if !is_valid_opcode(opcode) {
            return Err(Error::invalid_input(format!(
                "invalid opcode 0x{:02x} at position {}",
                opcode, i
            )));
        }

        // Skip PUSH immediate data
        if opcode >= PUSH1 && opcode <= PUSH32 {
            let push_size = (opcode - PUSH1 + 1) as usize;
            i += 1 + push_size;
        } else {
            i += 1;
        }
    }

    Ok(())
}

/// Check if an opcode is valid/defined in EVM.
///
/// This covers opcodes up to Shanghai. Note that even "undefined" opcodes
/// will just cause the EVM to revert when executed, not reject the bytecode.
fn is_valid_opcode(opcode: u8) -> bool {
    match opcode {
        // 0x00-0x0b: arithmetic + comparison
        0x00..=0x0b => true,
        // 0x10-0x1d: comparison + bitwise
        0x10..=0x1d => true,
        // 0x20: KECCAK256
        0x20 => true,
        // 0x30-0x3f: environmental info
        0x30..=0x3f => true,
        // 0x40-0x48: block info
        0x40..=0x48 => true,
        // 0x50-0x5f: stack/memory/storage/flow + PUSH0
        0x50..=0x5f => true,
        // 0x60-0x7f: PUSH1-PUSH32
        0x60..=0x7f => true,
        // 0x80-0x8f: DUP1-DUP16
        0x80..=0x8f => true,
        // 0x90-0x9f: SWAP1-SWAP16
        0x90..=0x9f => true,
        // 0xa0-0xa4: LOG0-LOG4
        0xa0..=0xa4 => true,
        // 0xf0-0xff: system operations
        0xf0..=0xf5 => true,
        0xfa => true, // STATICCALL
        0xfd => true, // REVERT
        0xfe => true, // INVALID
        0xff => true, // SELFDESTRUCT
        _ => false,
    }
}

/// Get the size of a PUSH instruction's immediate data.
///
/// Returns 0 for non-PUSH opcodes.
#[inline]
pub fn push_size(opcode: u8) -> usize {
    if opcode >= PUSH1 && opcode <= PUSH32 {
        (opcode - PUSH1 + 1) as usize
    } else {
        0
    }
}

/// Check if opcode is a PUSH instruction (PUSH1-PUSH32).
///
/// Note: PUSH0 (0x5f) has no immediate data and returns false.
#[inline]
pub fn is_push(opcode: u8) -> bool {
    opcode >= PUSH1 && opcode <= PUSH32
}

/// Check if opcode is a terminating instruction.
///
/// Terminating instructions: STOP, RETURN, REVERT, INVALID, SELFDESTRUCT.
#[inline]
pub fn is_terminating(opcode: u8) -> bool {
    matches!(opcode, STOP | RETURN | REVERT | INVALID | SELFDESTRUCT)
}

/// Check if opcode is a jump instruction (JUMP or JUMPI).
#[inline]
pub fn is_jump(opcode: u8) -> bool {
    opcode == JUMP || opcode == JUMPI
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_jumpdest() {
        // JUMPDEST at position 0
        let bc = Bytecode::new(vec![JUMPDEST, STOP]);
        assert!(bc.is_valid_jumpdest(0));
        assert!(!bc.is_valid_jumpdest(1));
    }

    #[test]
    fn test_jumpdest_after_push1() {
        // PUSH1 0x00, JUMPDEST
        let bc = Bytecode::new(vec![PUSH1, 0x00, JUMPDEST]);
        assert!(!bc.is_valid_jumpdest(0)); // PUSH1 opcode
        assert!(!bc.is_valid_jumpdest(1)); // PUSH1 data
        assert!(bc.is_valid_jumpdest(2));  // JUMPDEST
    }

    #[test]
    fn test_jumpdest_in_push_data() {
        // PUSH1 0x5b (0x5b is JUMPDEST opcode but here it's data)
        let bc = Bytecode::new(vec![PUSH1, JUMPDEST, STOP]);
        assert!(!bc.is_valid_jumpdest(1)); // 0x5b in PUSH data is NOT valid
        assert_eq!(bc.jumpdests().len(), 0);
    }

    #[test]
    fn test_push32_with_jumpdest_bytes() {
        // PUSH32 followed by 32 bytes, all 0x5b
        let mut code = vec![PUSH32];
        code.extend([JUMPDEST; 32]); // 32 bytes of 0x5b
        code.push(STOP);

        let bc = Bytecode::new(code);

        // None of the 0x5b bytes inside PUSH32 should be valid JUMPDESTs
        for i in 1..=32 {
            assert!(!bc.is_valid_jumpdest(i), "position {} should not be valid", i);
        }
        assert_eq!(bc.jumpdests().len(), 0);
    }

    #[test]
    fn test_multiple_valid_jumpdests() {
        // JUMPDEST, PUSH1 0x5b, JUMPDEST, STOP
        let bc = Bytecode::new(vec![JUMPDEST, PUSH1, JUMPDEST, JUMPDEST, STOP]);
        assert!(bc.is_valid_jumpdest(0));  // First JUMPDEST
        assert!(!bc.is_valid_jumpdest(2)); // 0x5b in PUSH data
        assert!(bc.is_valid_jumpdest(3));  // Second JUMPDEST
        assert_eq!(bc.jumpdests(), &[0, 3]);
    }

    #[test]
    fn test_empty_bytecode() {
        let bc = Bytecode::new(vec![]);
        assert!(bc.is_empty());
        assert_eq!(bc.len(), 0);
        assert!(!bc.is_valid_jumpdest(0));
        assert_eq!(bc.jumpdests().len(), 0);
    }

    #[test]
    fn test_from_hex() {
        // 0x5b 0x00 = JUMPDEST STOP
        let bc = Bytecode::from_hex("0x5b00").unwrap();
        assert!(bc.is_valid_jumpdest(0));
        assert!(!bc.is_valid_jumpdest(1));
    }

    #[test]
    fn test_from_hex_without_prefix() {
        let bc = Bytecode::from_hex("5b00").unwrap();
        assert!(bc.is_valid_jumpdest(0));
    }

    #[test]
    fn test_from_hex_invalid() {
        assert!(Bytecode::from_hex("0xgg").is_err());
    }

    #[test]
    fn test_validate_valid_bytecode() {
        assert!(validate(&[JUMPDEST, PUSH1, 0x00, STOP]).is_ok());
        // PUSH32 with 32 zero bytes
        let mut push32_code = vec![PUSH32];
        push32_code.extend([0u8; 32]);
        assert!(validate(&push32_code).is_ok());
        assert!(validate(&[]).is_ok()); // Empty is valid
    }

    #[test]
    fn test_validate_truncated_push1() {
        // PUSH1 without data byte
        let result = validate(&[PUSH1]);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("truncated"));
    }

    #[test]
    fn test_validate_truncated_push32() {
        // PUSH32 with only 10 bytes instead of 32
        let mut code = vec![PUSH32];
        code.extend([0u8; 10]);
        let result = validate(&code);
        assert!(result.is_err());
    }

    #[test]
    fn test_is_push_data() {
        let bc = Bytecode::new(vec![PUSH1, 0xab, JUMPDEST, STOP]);
        assert!(!bc.is_push_data(0)); // PUSH1 opcode
        assert!(bc.is_push_data(1));  // PUSH1 data
        assert!(!bc.is_push_data(2)); // JUMPDEST
        assert!(!bc.is_push_data(3)); // STOP
        assert!(!bc.is_push_data(100)); // Out of bounds
    }

    #[test]
    fn test_get_opcode_at() {
        let bc = Bytecode::new(vec![PUSH1, 0xab, JUMPDEST, STOP]);
        assert_eq!(bc.get_opcode_at(0), Some(PUSH1));
        assert_eq!(bc.get_opcode_at(1), None); // PUSH data
        assert_eq!(bc.get_opcode_at(2), Some(JUMPDEST));
        assert_eq!(bc.get_opcode_at(3), Some(STOP));
        assert_eq!(bc.get_opcode_at(100), None); // Out of bounds
    }

    #[test]
    fn test_push_size() {
        assert_eq!(push_size(PUSH1), 1);
        assert_eq!(push_size(PUSH32), 32);
        assert_eq!(push_size(PUSH0), 0);  // PUSH0 has no immediate
        assert_eq!(push_size(STOP), 0);   // Not a PUSH
        assert_eq!(push_size(JUMPDEST), 0);
    }

    #[test]
    fn test_is_push() {
        assert!(is_push(PUSH1));
        assert!(is_push(PUSH32));
        assert!(!is_push(PUSH0)); // PUSH0 has no immediate data
        assert!(!is_push(STOP));
        assert!(!is_push(JUMPDEST));
    }

    #[test]
    fn test_is_terminating() {
        assert!(is_terminating(STOP));
        assert!(is_terminating(RETURN));
        assert!(is_terminating(REVERT));
        assert!(is_terminating(INVALID));
        assert!(is_terminating(SELFDESTRUCT));
        assert!(!is_terminating(PUSH1));
        assert!(!is_terminating(JUMPDEST));
    }

    #[test]
    fn test_is_jump() {
        assert!(is_jump(JUMP));
        assert!(is_jump(JUMPI));
        assert!(!is_jump(JUMPDEST));
        assert!(!is_jump(STOP));
    }

    #[test]
    fn test_consecutive_push_instructions() {
        // PUSH1 0x5b, PUSH2 0x5b 0x5b, JUMPDEST
        let bc = Bytecode::new(vec![
            PUSH1, JUMPDEST,           // positions 0, 1
            PUSH1 + 1, JUMPDEST, JUMPDEST, // PUSH2 at 2, data at 3, 4
            JUMPDEST,                  // position 5
        ]);
        assert!(!bc.is_valid_jumpdest(1)); // PUSH1 data
        assert!(!bc.is_valid_jumpdest(3)); // PUSH2 data
        assert!(!bc.is_valid_jumpdest(4)); // PUSH2 data
        assert!(bc.is_valid_jumpdest(5));  // Valid JUMPDEST
        assert_eq!(bc.jumpdests(), &[5]);
    }

    #[test]
    fn test_all_push_sizes() {
        // Test PUSH1 through PUSH32
        for n in 1u8..=32 {
            let opcode = PUSH1 + n - 1;
            let mut code = vec![opcode];
            code.extend(vec![JUMPDEST; n as usize]); // Fill with 0x5b
            code.push(JUMPDEST); // Valid JUMPDEST after

            let bc = Bytecode::new(code.clone());

            // All 0x5b within PUSH data should be invalid
            for i in 1..=(n as u32) {
                assert!(
                    !bc.is_valid_jumpdest(i),
                    "PUSH{}: position {} should not be valid jumpdest",
                    n,
                    i
                );
            }

            // JUMPDEST after PUSH should be valid
            assert!(
                bc.is_valid_jumpdest((n + 1) as u32),
                "PUSH{}: position {} should be valid jumpdest",
                n,
                n + 1
            );
        }
    }

    #[test]
    fn test_real_contract_pattern() {
        // Simplified ERC20 transfer selector check pattern:
        // PUSH4 selector, PUSH1 offset, JUMPDEST
        let code = vec![
            0x63, 0xa9, 0x05, 0x9c, 0xbb, // PUSH4 0xa9059cbb (transfer selector)
            PUSH1, 0x20,                   // PUSH1 0x20
            JUMPDEST,                      // Valid JUMPDEST at position 7
            STOP,
        ];
        let bc = Bytecode::new(code);
        assert!(bc.is_valid_jumpdest(7));
        assert_eq!(bc.jumpdests(), &[7]);
    }

    #[test]
    fn test_bytecode_from_slice() {
        let slice: &[u8] = &[JUMPDEST, STOP];
        let bc: Bytecode = slice.into();
        assert!(bc.is_valid_jumpdest(0));
    }

    #[test]
    fn test_bytecode_from_vec() {
        let vec = vec![JUMPDEST, STOP];
        let bc: Bytecode = vec.into();
        assert!(bc.is_valid_jumpdest(0));
    }

    #[test]
    fn test_as_ref() {
        let bc = Bytecode::new(vec![JUMPDEST, STOP]);
        let bytes: &[u8] = bc.as_ref();
        assert_eq!(bytes, &[JUMPDEST, STOP]);
    }

    #[test]
    fn test_into_bytes() {
        let bc = Bytecode::new(vec![JUMPDEST, STOP]);
        let bytes = bc.into_bytes();
        assert_eq!(bytes, vec![JUMPDEST, STOP]);
    }

    #[test]
    fn test_default() {
        let bc = Bytecode::default();
        assert!(bc.is_empty());
        assert_eq!(bc.len(), 0);
    }

    #[test]
    fn test_validate_strict_valid() {
        // Valid opcodes only
        assert!(validate_strict(&[STOP]).is_ok());
        assert!(validate_strict(&[JUMPDEST, PUSH1, 0xff, RETURN]).is_ok());
    }

    #[test]
    fn test_validate_strict_invalid_opcode() {
        // 0x0c is undefined
        let result = validate_strict(&[0x0c]);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("invalid opcode"));
    }

    #[test]
    fn test_out_of_bounds_jumpdest() {
        let bc = Bytecode::new(vec![STOP]);
        assert!(!bc.is_valid_jumpdest(100));
        assert!(!bc.is_valid_jumpdest(u32::MAX));
    }

    #[test]
    fn test_jumpdest_at_end() {
        let bc = Bytecode::new(vec![STOP, JUMPDEST]);
        assert!(bc.is_valid_jumpdest(1));
    }
}
