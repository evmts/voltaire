# Opcodes Returning Wrong Values

Based on the generated test file, here are the opcodes that are likely returning incorrect values:

## 1. MULMOD (0x09) - Modular Multiplication
- **Test**: `(10 * 10) % 8`
- **Expected**: 4
- **Test**: `MAX * 2 % 3` 
- **Expected**: 2
- **Issue**: Implementation may have issues with overflow handling

## 2. ADDMOD (0x08) - Modular Addition  
- **Test**: `(MAX + MAX) % MAX`
- **Expected**: 1
- **Issue**: Not handling overflow correctly when sum exceeds 256 bits

## 3. EXP (0x0A) - Exponentiation
- **Test**: `0 ** 0`
- **Expected**: 1 (by EVM specification)
- **Test**: `2 ** 256`
- **Expected**: 0 (wraps around)
- **Issue**: Missing edge case handling

## 4. Comparison Operators (Stack Order Issues)
These likely have reversed stack order (popping b,a instead of a,b):

### GT (0x11) - Greater Than
- Stack order: `[a, b]` → pops as `b > a` (should be `a > b`)

### LT (0x10) - Less Than  
- Stack order: `[a, b]` → pops as `b < a` (should be `a < b`)

### SLT (0x12) - Signed Less Than
- Stack order issue similar to LT

### SGT (0x13) - Signed Greater Than
- Stack order issue similar to GT

## 5. Shift Operators (Stack Order Issues)
These also have reversed stack order:

### SHL (0x1B) - Shift Left
- Stack: `[shift, value]` → should shift `value` left by `shift` bits
- Currently doing: shift `shift` left by `value` bits

### SHR (0x1C) - Shift Right
- Same stack order issue as SHL

### SAR (0x1D) - Arithmetic Shift Right  
- Same stack order issue as SHL

## 6. BYTE (0x1A) - Byte Extraction
- **Test**: Extract byte at various indices
- **Issue**: May have off-by-one errors or endianness issues

## 7. SIGNEXTEND (0x0B) - Sign Extension
- **Test**: Sign extend from various byte positions
- **Issue**: Incorrect implementation of sign extension logic

## Summary of Root Causes

1. **Stack Order Reversal**: Many operators pop values in wrong order
   - Affects: GT, LT, SLT, SGT, SHL, SHR, SAR
   
2. **Edge Case Handling**: Missing special cases
   - Affects: EXP (0^0), MULMOD/ADDMOD with overflow
   
3. **Algorithm Issues**: 
   - BYTE: Endianness or indexing
   - SIGNEXTEND: Sign extension logic

These are the opcodes that need fixing because they return incorrect values, not counting any gas estimation issues.