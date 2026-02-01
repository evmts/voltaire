/**
 * Create successful ContractResult
 *
 * @param {import('../ReturnData/ReturnDataType.js').ReturnDataType} data - Return data
 * @returns {import('./ContractResultType.js').SuccessResult} Success result
 *
 * @example
 * ```typescript
 * const result = ContractResult.success(returnData);
 * ```
 */
export function success(data) {
	return {
		success: true,
		data,
	};
}
