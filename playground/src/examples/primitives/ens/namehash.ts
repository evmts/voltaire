import { Ens, Hex } from "voltaire";
const rootHash = Ens.namehash("");
const singleLabels = ["eth", "com", "xyz"];

for (const label of singleLabels) {
	const hash = Ens.namehash(label);
}
const domains = ["vitalik.eth", "nick.eth", "brantly.eth", "example.com"];

for (const domain of domains) {
	const hash = Ens.namehash(domain);
}
const subdomains = [
	"sub.vitalik.eth",
	"test.example.eth",
	"deep.sub.domain.eth",
	"very.deep.sub.domain.eth",
];

for (const subdomain of subdomains) {
	const hash = Ens.namehash(subdomain);
}
const famousNames = ["vitalik.eth", "nick.eth", "brantly.eth", "dao.eth"];

for (const name of famousNames) {
	const hash = Ens.namehash(name);
}

const base = "example.eth";
const sub = "sub.example.eth";
const deep = "deep.sub.example.eth";

const baseHash = Ens.namehash(base);
const subHash = Ens.namehash(sub);
const deepHash = Ens.namehash(deep);
const lowercase = Ens.namehash("vitalik.eth");
const uppercase = Ens.namehash("VITALIK.eth");
