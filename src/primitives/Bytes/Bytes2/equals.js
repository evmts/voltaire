export function equals(a, b) {
	for (let i = 0; i < 2; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
