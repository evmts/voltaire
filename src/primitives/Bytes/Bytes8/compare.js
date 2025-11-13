export function compare(a, b) {
	for (let i = 0; i < 8; i++) {
		if (a[i] < b[i]) return -1;
		if (a[i] > b[i]) return 1;
	}
	return 0;
}
