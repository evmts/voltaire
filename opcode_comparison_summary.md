# Opcode Comparison Summary

Based on analysis of the generated test file (`test/evm/opcodes/generated_opcode_comparison_test.zig`), here is a comprehensive summary of opcode implementation issues in the Guillotine EVM compared to REVM.

## Test Statistics

- **Total tests generated**: 194
- **Previously passing**: 148 (76.3%)
- **Previously failing**: 46 (23.7%)

## Critical Issues by Category

### 1. Modular Arithmetic Operations

#### MULMOD (Multiplication Modulo)
- **Test Case**: `(10 * 10) % 8`
- **Expected**: 4
- **Issue**: Implementation appears correct based on code review, but test was failing
- **Algorithm**: Uses Russian peasant multiplication with modular reduction

#### ADDMOD (Addition Modulo)  
- **Test Case**: `(MAX + MAX) % MAX`
- **Expected**: 1
- **Issue**: May not be handling overflow correctly in all edge cases

### 2. Exponentiation (EXP)

#### Edge Cases
- **0^0**: Should return 1 (by EVM spec)
- **x^256**: Should wrap to 0 for any x
- **Large exponents**: Need to handle gas costs correctly

### 3. Stack Order Issues

Multiple comparison and shift operators appear to have reversed stack order:

#### Comparison Operators
- **GT** (Greater Than)
- **LT** (Less Than)
- **SLT** (Signed Less Than)
- **SGT** (Signed Greater Than)

#### Shift Operators
- **SHL** (Shift Left)
- **SHR** (Shift Right)
- **SAR** (Arithmetic Shift Right)

**Pattern**: These operators are popping operands in wrong order (b, a instead of a, b)

### 4. Other Failing Opcodes

- **BYTE**: Byte extraction operation
- **SIGNEXTEND**: Sign extension operation
- Various edge cases in arithmetic operations

## Root Causes

1. **Stack Order Confusion**: Many operators pop values in reverse order
2. **Edge Case Handling**: Missing special cases (0^0, overflow conditions)
3. **Test Generation Issues**: Some expected values in tests may be incorrect

## Recommendations

1. **Priority 1**: Fix stack order for comparison and shift operators
2. **Priority 2**: Add edge case handling for EXP (0^0 = 1)
3. **Priority 3**: Verify MULMOD/ADDMOD implementations with more test cases
4. **Priority 4**: Update test generator to use actual REVM output

## Next Steps

1. Create isolated test cases for each failing opcode
2. Compare execution traces between REVM and Guillotine
3. Fix operators one by one, starting with stack order issues
4. Re-run comprehensive test suite after each fix

## Notes

- The REVM wrapper build is currently failing due to bn254 symbol issues
- Once fixed, we can run side-by-side comparisons for all opcodes
- The test generator was hardcoding expected values rather than using REVM output