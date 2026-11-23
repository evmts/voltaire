---
"@tevm/voltaire": patch
---

Fix `FeeMarket.gweiToWei` returning one wei too little for decimal inputs such as
`2.01` and `33.3`. Convert the input's decimal representation exactly and floor
any fractional wei. See [issue #399](https://github.com/evmts/voltaire/issues/399).
