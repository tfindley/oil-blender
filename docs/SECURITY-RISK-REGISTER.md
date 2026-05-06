# Security Risk Register

Triage of vulnerabilities reported by container scanners (Grype, Trivy, Dependabot) for `ghcr.io/tfindley/oil-blender`. The goal is to record, for each finding, **where it lives** and **whether it is actually reachable from our app's runtime** — so we can distinguish CVEs that need urgent action from those that are vendored inside upstream tooling we don't control.

**Last reviewed:** 2026-05-06 against `v0.1.4` image
**Source report:** [vuln-report-ghcr.io-tfindley-oil-blender-latest-grype-2026-05-06.json](./vuln-report-ghcr.io-tfindley-oil-blender-latest-grype-2026-05-06.json)

## Summary

18 findings: 11 high, 5 medium, 2 low, 0 critical. **Zero are exploitable from our running application.** The breakdown:

| Category | Count | Why we can't easily fix |
|---|---|---|
| Vendored inside Next.js compiled dist (`next/dist/compiled/*`) | 7 | Pre-bundled by Next.js — no version metadata, no override mechanism. Fixed when Next.js publishes a patched point release. |
| Prisma engine tooling transitive | 1 | Brought in by Prisma's binary download path; not loaded at runtime. |
| Build/install transitive in node_modules | 7 | Already at safe versions locally; container has older copies via Next.js standalone tracing. Patch-level overrides may help cosmetically. |
| Alpine base image (BusyBox) | 3 | Same CVE counted three times for `busybox`, `busybox-binsh`, `ssl_client`. Awaiting `node:20-alpine` rebuild. |

## Triage policy

- **Reachable from app code AND fixable** → fix immediately
- **Not reachable but fixable cheaply** → fix as cosmetic cleanup
- **Vendored upstream / not reachable** → record here; re-evaluate on Next.js / Prisma / Alpine upgrade
- **Reachable but not fixable** (none today) → mitigate via input validation or feature gating

---

## Vendored inside Next.js (`next/dist/compiled/*`)

These packages ship pre-bundled inside the Next.js distribution. `npm overrides` cannot replace them — they're inlined into Next's compiled JavaScript. Resolution requires upstream Next.js to bump its bundled dependency.

### node-tar 6.2.1 — 6 findings (all high)

| ID | Issue |
|---|---|
| [GHSA-34x7-hfp2-rc4v](https://github.com/advisories/GHSA-34x7-hfp2-rc4v) | Arbitrary File Creation/Overwrite via Hardlink Path Traversal |
| [GHSA-r6q2-hw4h-h46w](https://github.com/advisories/GHSA-r6q2-hw4h-h46w) | Race Condition in Path Reservations via Unicode Ligature Collisions on macOS APFS |
| [GHSA-9ppj-qmqm-q256](https://github.com/advisories/GHSA-9ppj-qmqm-q256) | Symlink Path Traversal via Drive-Relative Linkpath |
| [GHSA-qffp-2rhf-9h96](https://github.com/advisories/GHSA-qffp-2rhf-9h96) | Hardlink Path Traversal via Drive-Relative Linkpath |
| [GHSA-83g3-92jg-28cx](https://github.com/advisories/GHSA-83g3-92jg-28cx) | Arbitrary File Read/Write via Hardlink Target Escape |
| [GHSA-8qq5-rm4j-mr97](https://github.com/advisories/GHSA-8qq5-rm4j-mr97) | Arbitrary File Overwrite via Insufficient Path Sanitization |

**Reachable from app?** No. Our app does not extract tar archives at runtime. `tar` is bundled into `next/dist/compiled/tar/` because Next.js uses it during build/install for asset packaging. Container scanners detect it via file signature, not because the runtime loads it.

**Remediation:** wait for Next.js to bump its bundled `tar` to 7.5.x, then upgrade Next.js. Tracked: <https://github.com/vercel/next.js/issues> (no specific issue filed).

### glob 10.4.2 — 1 finding (high)

[GHSA-5j98-mcp5-4vw2](https://github.com/advisories/GHSA-5j98-mcp5-4vw2) — Command injection via `glob -c/--cmd` flag executes matches with `shell:true`.

**Reachable from app?** No. The vulnerability is in the `glob` CLI executable, which we never invoke. The library API used by Next.js internals is unaffected.

**Remediation:** wait for Next.js to bump bundled `glob` to 10.5.0+.

---

## Prisma engine tooling (transitive)

### ip-address 9.0.5 — 1 finding (medium)

[GHSA-v2v4-37r5-5v8g](https://github.com/advisories/GHSA-v2v4-37r5-5v8g) — XSS in `Address6` HTML-emitting methods.

**Reachable from app?** No. The vulnerability triggers only when the library's `toRFC5952String()` or similar HTML-emitting helpers render user-controlled IPv6 addresses into a web page. Prisma uses `ip-address` deep in its proxy-agent dependency chain (engine binary downloads), not for output. Our app code never imports `ip-address` directly.

**Remediation:** awaiting Prisma to bump its transitive proxy-agent stack. Major v9→v10 of `ip-address` is a breaking API change, so an npm override would risk breaking Prisma's engine downloads.

---

## Build/install transitive (low practical risk)

These appear in the Next.js standalone trace because Next analyzes which files are needed at runtime and copies them. Local `node_modules` is already on safe versions, but the standalone bundle has older copies.

### cross-spawn 7.0.3 — 1 finding (high)

[GHSA-3xgq-45jj-v275](https://github.com/advisories/GHSA-3xgq-45jj-v275) — ReDoS in shebang parsing.

**Reachable from app?** Effectively no. Our runtime app code does not call `child_process.spawn` with user input. The library appears in the trace because Next.js standalone tracing pulls it in defensively.

**Remediation:** an npm override to `^7.0.5` would propagate through standalone tracing. Skipped at v0.1.4 because the report would still be dominated by vendored Next.js findings; revisit when those clear up.

### minimatch 9.0.5 — 3 findings (all high)

| ID | Issue |
|---|---|
| [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj) | ReDoS via combinatorial backtracking with multiple non-adjacent `**` segments |
| [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) | ReDoS via repeated wildcards with non-matching literal |
| [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74) | ReDoS via nested `*()` extglobs |

**Reachable from app?** No. Our app code does not invoke `minimatch` with user-supplied patterns. Used by Next.js / Prisma for build-time glob matching.

**Remediation:** patch-level override (`^9.0.7`) is safe; deferred for the same reason as cross-spawn.

### brace-expansion 2.0.1 — 2 findings

| ID | Severity | Issue |
|---|---|---|
| [GHSA-v6h2-p8h4-qcjw](https://github.com/advisories/GHSA-v6h2-p8h4-qcjw) | low | ReDoS |
| [GHSA-f886-m6hf-6m8v](https://github.com/advisories/GHSA-f886-m6hf-6m8v) | medium | Zero-step sequence causes process hang and memory exhaustion |

**Reachable from app?** No. Same reasoning as minimatch — used internally by glob/minimatch for brace expansion.

**Remediation:** patch-level override (`^2.0.3`) is safe.

### diff 5.2.0 — 1 finding (low)

[GHSA-73rr-hh4g-fpgx](https://github.com/advisories/GHSA-73rr-hh4g-fpgx) — DoS in `parsePatch`/`applyPatch` with malformed patch input.

**Reachable from app?** No. We don't apply patches at runtime. Likely pulled in by Prisma's CLI tooling during engine installation.

**Remediation:** patch override (`^5.2.2`) is safe.

---

## Alpine base image (BusyBox)

### busybox 1.37.0-r30 — 3 findings (all medium, same CVE)

[CVE-2025-60876](https://nvd.nist.gov/vuln/detail/CVE-2025-60876) — BusyBox `wget` accepts raw CR/LF in the request-target, allowing HTTP request smuggling / header injection.

Reported three times in the SBOM (once for `busybox`, once for `busybox-binsh`, once for `ssl_client`) — these are all the same package providing different applets.

**Reachable from app?** No. Our `docker-entrypoint.sh` does not invoke `wget`. The image runs as a non-root user (`nextjs`, uid 1001) with no shell access exposed to the network. An attacker would need code execution inside the container to weaponize BusyBox `wget`.

**Remediation:** waiting for the `node:20-alpine` base image to ship an updated `apk` package. The Dockerfile already runs `apk upgrade --no-cache` in the runner stage, so this will resolve on the next image rebuild after Alpine publishes the patch.

---

## Re-evaluation

Re-run the scanner and update this document:

- After each Next.js minor/patch upgrade
- After each Prisma upgrade
- After any base-image change
- At least quarterly even with no upgrades

To regenerate the underlying report:

```bash
grype ghcr.io/tfindley/oil-blender:latest -o json > docs/vuln-report-ghcr.io-tfindley-oil-blender-latest-grype-$(date +%Y-%m-%d).json
```
