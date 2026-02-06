# Cleanup TODO Comments

**Priority: LOW**

Several TODO comments need addressing.

## TODOs to Address

### 1. c_api.zig JSON Parsing
**File:** `src/c_api.zig:1797`
**TODO:** Parse JSON properly for access list

Current stubs return 0:
- `primitives_access_list_calculate_cost()`
- `primitives_access_list_gas_savings()`
- `primitives_access_list_includes_address()`
- `primitives_access_list_includes_storage_key()`

### 2. WASM Module Refactoring
**File:** `build.zig:1092`
**TODO:** Refactor _c.zig files to be standalone WASM modules

### 3. BinaryTree WASM Docs
**File:** `src/content/docs/primitives/binarytree/wasm.mdx:194-195`
**TODO:** Document BinaryTree WASM exports

### 4. Types Index Restoration
**File:** `src/index.ts:13`
**TODO:** Comment about removed types/index.ts

## Steps
1. Review each TODO
2. Determine if still relevant
3. Either:
   - Implement the fix
   - Create separate task if complex
   - Remove if no longer needed

## Low Priority
These are not blocking. Address when time permits.
