# Picomatch security backport

`picomatch@4.0.7.patch` starts with the production code from upstream
[pull request 237](https://github.com/micromatch/picomatch/pull/237),
commit `1bf0d04563cb9ce568cf36efc5f6b7187d9911d5`, for
GHSA-fc5q-39xc-vjpf / CVE-2026-112366.

As of November 18, 2026, the latest published Picomatch is 4.0.7, which is
affected. The advisory's linked PR 194 explicitly does **not** fix `+(*a)`;
this backport instead collapses the redundant repeated quantifier in
single-branch star-containing extglobs.

## Additional local hardening

The upstream backport alone does not handle `+(*a|z)` or `*(*a|z)`: adding an
alternative preserves the nested wildcard quantifier. The local patch therefore
**throws a SyntaxError** when a repeated extglob contains wildcard stars and
cannot be safely collapsed as one simple branch. This also rejects nested and
globstar shapes rather than assuming they are safe. Rejection is intentional:
those unsafe patterns no longer have matching semantics in this workspace.
Literal alternatives, escaped stars, bracket-class stars, and non-repeated
alternatives such as `@(*a|z)` remain supported. The existing upstream
`maxExtglobRecursion: false` option still explicitly disables the safeguard;
do not use that opt-out with untrusted patterns.

The workspace override consolidates Picomatch 2 and 4 onto this patched copy.
Micromatch's callable matcher, `parse`, and `scan` interfaces remain available.
Regression tests cover single-branch attacks and alternative/nested bypasses
inside a timeout-bounded process, supported positive matching cases, and the
Canvas discovery pattern through fast-glob using temporary fixtures.

Run `pnpm --filter @workspace/scripts run test:security`.

## Audit reporting

`pnpm audit` and other version-based scanners still report
GHSA-fc5q-39xc-vjpf for 4.0.7: they cannot inspect this local patch. We do not
ignore the advisory, rename the package, or pretend an unpublished fixed version
exists. All other requested vulnerable versions have been upgraded.

When an official fixed release becomes available, replace the override and
patch with that release and rerun the regression tests, typecheck, code
generation, builds, and audit. Keep the one-day minimum release age policy.
