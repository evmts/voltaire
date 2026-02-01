import { Ens, Hex } from "@tevm/voltaire";
const domain = "example.eth";
const subdomains = [
	"example.eth",
	"www.example.eth",
	"api.example.eth",
	"app.example.eth",
	"blog.example.eth",
];
for (const name of subdomains) {
	const hash = Ens.namehash(name);
	const depth = name.split(".").length - 1;
	const indent = "  ".repeat(depth);
}
const deepSubdomains = [
	"eth",
	"example.eth",
	"sub.example.eth",
	"deep.sub.example.eth",
	"very.deep.sub.example.eth",
	"extremely.very.deep.sub.example.eth",
];

for (const name of deepSubdomains) {
	const hash = Ens.namehash(name);
	const depth = name === "eth" ? 0 : name.split(".").length - 1;
}
const base = "company.eth";
const patterns = [
	{ subdomain: `www.${base}`, purpose: "Website" },
	{ subdomain: `api.${base}`, purpose: "API endpoint" },
	{ subdomain: `app.${base}`, purpose: "Application" },
	{ subdomain: `docs.${base}`, purpose: "Documentation" },
	{ subdomain: `staging.${base}`, purpose: "Staging environment" },
	{ subdomain: `prod.${base}`, purpose: "Production" },
];

for (const { subdomain, purpose } of patterns) {
	const hash = Ens.namehash(subdomain);
}
const mainDomain = "users.eth";
const users = ["alice", "bob", "charlie", "david"];
for (const user of users) {
	const userDomain = `${user}.${mainDomain}`;
	const hash = Ens.namehash(userDomain);
}
const app = "dapp.eth";
const environments = [
	{ env: "local", subdomain: `local.${app}` },
	{ env: "dev", subdomain: `dev.${app}` },
	{ env: "staging", subdomain: `staging.${app}` },
	{ env: "prod", subdomain: app },
];

for (const { env, subdomain } of environments) {
	const hash = Ens.namehash(subdomain);
}

const parent = "domain.eth";
const child1 = "sub1.domain.eth";
const child2 = "sub2.domain.eth";

const parentHash = Ens.namehash(parent);
const child1Hash = Ens.namehash(child1);
const child2Hash = Ens.namehash(child2);
const wildcardBase = "catch.eth";
const wildcardExamples = [
	`a.${wildcardBase}`,
	`b.${wildcardBase}`,
	`anything.${wildcardBase}`,
	`test123.${wildcardBase}`,
];
for (const name of wildcardExamples) {
	const hash = Ens.namehash(name);
}
