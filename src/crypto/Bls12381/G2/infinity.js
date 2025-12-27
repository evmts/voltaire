/**
 * Return the point at infinity (identity element) for G2
 *
 * @returns {import('../G2PointType.js').G2PointType}
 */
export function infinity() {
	return /** @type {import('../G2PointType.js').G2PointType} */ ({
		x: { c0: 0n, c1: 0n },
		y: { c0: 1n, c1: 0n },
		z: { c0: 0n, c1: 0n },
	});
}
