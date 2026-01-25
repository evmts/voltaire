/**
 * ContractResult module for handling smart contract call results.
 * Provides Effect-based operations for working with success/failure results.
 * @module
 * @since 0.0.1
 */
export { ContractResultSchema, type ContractResultType, type SuccessResult, type FailureResult, type ContractResultInput } from './ContractResultSchema.js'
export {
  from,
  success,
  failure,
  isSuccess,
  isFailure,
  unwrap,
  unwrapOr,
  ContractResultError
} from './from.js'
