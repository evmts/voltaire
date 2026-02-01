/**
 * Return new transaction with updated data
 * @param this Transaction
 * @param data New data value
 * @returns New transaction with updated data
 */
export function withData(data) {
    return { ...this, data };
}
