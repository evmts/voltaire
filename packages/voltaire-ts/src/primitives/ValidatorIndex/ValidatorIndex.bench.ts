/**
 * Benchmark: ValidatorIndex (Beacon Chain) operations
 * Tests validator index creation and comparison
 */

import { bench, run } from "mitata";
import * as ValidatorIndex from "./index.js";

// Test data
const validatorNumber = 500000;
const validatorBigInt = 500000n;

// Pre-created validator indices
const validator1 = ValidatorIndex.from(500000);
const validator2 = ValidatorIndex.from(500001);

// ============================================================================
// from (constructor)
// ============================================================================

bench("ValidatorIndex.from - number - voltaire", () => {
	ValidatorIndex.from(validatorNumber);
});

bench("ValidatorIndex.from - bigint - voltaire", () => {
	ValidatorIndex.from(validatorBigInt);
});

await run();

// ============================================================================
// toNumber
// ============================================================================

bench("ValidatorIndex.toNumber - voltaire", () => {
	ValidatorIndex.toNumber(validator1);
});

await run();

// ============================================================================
// equals
// ============================================================================

bench("ValidatorIndex.equals - same - voltaire", () => {
	ValidatorIndex.equals(validator1, validator1);
});

bench("ValidatorIndex.equals - different - voltaire", () => {
	ValidatorIndex.equals(validator1, validator2);
});

await run();
