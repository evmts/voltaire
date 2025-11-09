const s = class extends Error {
	constructor() {
		super("Invalid hex format");
	}
};
const o = class extends Error {
	constructor() {
		super("Invalid hex string");
	}
};
function a(t) {
	if (!t.startsWith("0x") || t.length !== 42) throw new s();
	const r = t.slice(2);
	if (!/^[0-9a-fA-F]{40}$/.test(r)) throw new o();
	const n = new Uint8Array(20);
	for (let e = 0; e < 20; e++) {
		const i = Number.parseInt(r.slice(e * 2, e * 2 + 2), 16);
		n[e] = i;
	}
	return n;
}
function f(t) {
	return `0x${Array.from(t, (r) => r.toString(16).padStart(2, "0")).join("")}`;
}
function u(t) {
	return t.length === 42
		? t.startsWith("0x")
			? /^0x[0-9a-fA-F]{40}$/.test(t)
			: !1
		: t.length === 40
			? /^[0-9a-fA-F]{40}$/.test(t)
			: !1;
}
function l(t, r) {
	if (t.length !== 20 || r.length !== 20) return !1;
	for (let n = 0; n < 20; n++) if (t[n] !== r[n]) return !1;
	return !0;
}
function c(t) {
	for (let r = 0; r < 20; r++) if (t[r] !== 0) return !1;
	return !0;
}
const E = new Uint8Array(20);
export {
	E as ZERO,
	l as equals,
	a as fromHex,
	u as isValid,
	c as isZero,
	f as toHex,
};
