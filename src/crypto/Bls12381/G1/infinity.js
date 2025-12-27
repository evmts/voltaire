/**
 * Return the point at infinity (identity element) for G1
 *
 * @returns {import('../G1PointType.js').G1PointType}
 */
export function infinity() {
	return /** @type {import('../G1PointType.js').G1PointType} */ ({
		x: 0n,
		y: 1n,
		z: 0n,
	});
}
