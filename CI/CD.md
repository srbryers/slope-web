# Development and delivery

Read this guide before changing checks or planning a site release.
Current project, access and human approval rules stay in force.

## Sources and scope

- Verified on **2026-10-09**, against `origin/main` at `c1619f8d3dd586e2d13f090c7783437a0c2a33b4`.
- Source branch: `main`. Use an isolated feature branch and PR for this rollout.
- [Package scripts](../package.json), [Astro config](../astro.config.mjs), and [manifest validation](../.github/workflows/validate-manifest.yml) own executable behavior.
- [Manifest loader](../src/data/manifest.ts), [release loader](../src/data/releases.ts), and [live stats](../src/scripts/live-stats.ts) explain external data.
- No root AGENTS.md or CLAUDE.md exists at this base. Applicable ancestor instructions still apply.
- [CODEBASE.md](../CODEBASE.md) is a navigation aid; its older metadata does not prove current delivery settings.
- Prompt source: [shared template at e938d054825d4b20b7d3fb63a4629e97b97a4142](https://github.com/srbryers/ci/blob/e938d054825d4b20b7d3fb63a4629e97b97a4142/templates/CI-CD.md).
- Template PR [ci#1](https://github.com/srbryers/ci/pull/1) remains **pending**. These prompts grant no automation or approval.

This repository builds the public Astro site at `https://getslope.dev`.
It is a private npm package, not a package publication target.
The repo has no deployment workflow or hosting runbook, but live Cloudflare Pages builds branch previews.
The production branch and settings still need host evidence.

## Checks by change

Run package commands at this isolated repository root.
For app builds, `npm ci` uses [package-lock.json](../package-lock.json).
No runtime version file or engines field pins Node in the repository.
Check the host's Node/npm versions before a build or release.
Do not install dependencies or run a browser for prose alone.

| Change | Focused development check | Stable candidate evidence |
| --- | --- | --- |
| Prose and process | Readback, local links, `git diff --check`, command/source comparison | No dedicated Markdown check; live Pages and GitGuardian checks still apply |
| Astro pages, styles or dependencies | `npm run build`; inspect affected output | Build artifact plus affected browser journey; hosting delivery identity remains separate |
| Docs manifest | Parse JSON; check version, `gitSha` and changed sections | Existing version comparison with the latest SLOPE release; source/content review |
| Release display | Build with network access; inspect GitHub fetch warnings | Verify the rendered release content, not build exit status alone |
| Live stats | Inspect the endpoint, fallback and polling behavior | Browser evidence for current stats and fallback behavior; backend delivery is separate |
| Workflow changes | Read triggers, token scope and exact comparison commands | Run the changed existing lane on the stable candidate when its trigger applies |

Available scripts: `npm run dev`, `npm run build`, `npm run preview`.
There are no repository `test`, `lint` or `typecheck` scripts.
`astro build` produces `dist/`; it is not a separate typecheck or browser test.
The release loader fetches GitHub during build; `GITHUB_TOKEN` is optional for higher rate limits.
Fetch failures can leave release content empty while the build still succeeds.
Keep warnings and inspect that page before delivery.

## Current CI and live settings

| Setting | Verified behavior |
| --- | --- |
| Workflow | [Validate Manifest](../.github/workflows/validate-manifest.yml), job `validate` |
| Triggers | Push to `main`, daily at 08:00 UTC, manual dispatch |
| PR checks | No `pull_request` trigger; this workflow does not validate feature PRs automatically |
| Runner | `ubuntu-latest`; uses `jq` and `gh`, without a Node install or Astro build |
| Check | Compares manifest `.version` with latest SLOPE release tag after removing leading `v` |
| Token | `GH_TOKEN` receives the run's `GITHUB_TOKEN`; no custom secret is referenced in this workflow |
| Cache and concurrency | Neither is explicitly configured; no automatic cancellation group is declared |
| Permissions | Workflow has no explicit permissions block; live repository default is read-only |
| Review permission | Actions cannot approve PR reviews under the live setting |
| Protected environments | No workflow environment; live environment list was empty |
| Rules and protection | Rulesets were empty; `main` protection returned **404: Branch not protected** |
| Live workflow state | Validate Manifest is `disabled_inactivity`; its source triggers do not prove it currently runs |
| External PR checks | Cloudflare Pages and GitGuardian Security Checks run through apps, outside GitHub workflow files |
| CodeQL | Live default setup is not configured |

The live settings do not waive source review, manual release or access gates.
Required-check names and hosting gate owners are **unresolved**.
**Sebastian** owns approval for merge, access and delivery in this task's context.
The base manifest is **1.61.0**; the latest release is **v2.0.0** on the verification date.
The manual comparison fails and past runs are red. Keep that history. This guide waives no gate or enables any workflow.
Do not mark a stale manifest current by editing its version alone.

For the existing check's manual equivalent, use authenticated `gh` plus `jq` from this worktree:

1. Read `jq -r '.version' src/data/docs-manifest.json`.
2. Read `gh api repos/srbryers/slope/releases/latest --jq '.tag_name'`.
3. Remove the tag's leading `v` and compare exactly, as the workflow does.
4. If they differ, request the SLOPE docs-sync process under its own authorization.

## Source sync and site delivery

SLOPE's own `sync-docs.yml` builds the manifest and opens a PR here.
Its target is `main`, through `chore/docs-manifest-sync`; merging needs normal review and approval.
That workflow may also write the stats backend's KV data. It does not deploy this Astro site.
Generated command, guard, MCP, metaphor and changelog content still needs source identity checks.
New feature areas, setup changes and breaking changes need manual content review under SLOPE's release policy.

The public URL returned HTTP 200 with Cloudflare headers on the verification date.
GitHub deployment records were empty; GitHub's Pages endpoint returned 404. Those checks do not cover Cloudflare Pages.
The [live Pages check](https://github.com/srbryers/slope-web/runs/114075374051) records a successful preview of head `7f210bce85d675263c1dc39b76d9d2b8d1155f9f`.
It names project `slope-web`, preview `7aa6b544.slope-web-vga.pages.dev`, and branch alias `chore-delivery-guide.slope-web-vga.pages.dev`.
That is preview source identity, not production or browser proof. The host's build command, runtime, secrets, filters and rollback are **unresolved**.
Sebastian must confirm production settings and the deployed revision before production delivery.

Manual delivery preparation follows the implemented build path:

1. Record the reviewed source SHA, dependency lockfile and Node/npm versions.
2. For site changes, use `npm ci`, then `npm run build`; keep warnings and the owned `dist/` artifact.
3. Review the changed page, release content and manifest identity. Record browser evidence when behavior changes.
4. Obtain Sebastian's separate merge and delivery approval.
5. Confirm Pages production settings and source/artifact revision; a push can already trigger an automatic branch preview.
6. After approved delivery, compare its revision or artifact with the reviewed SHA and verify the affected public journey.

This repo has no local deploy command. Its observed preview is delivered through the Pages Git integration.
Do not invent one or call an HTTP 200 proof of the delivered revision.
If the host shows no revision marker, record the gap. Get its build/deployment receipt.
Source checks, local browser proof and the public site's revision need their own evidence.
This repo has no native/device tests or private visual-review system.

## Host use, failure and rollback

- For local rendering, reserve a free port: `npm run preview -- --host 127.0.0.1 --port <free-port>` after build.
- Development uses `npm run dev -- --host 127.0.0.1 --port <free-port>`.
- Record the server PID, worktree, source SHA and artifact path; verify the response belongs to that build.
- Do not accept an old process's response as readiness. Stop only owned processes and remove only owned outputs.
- No global `pkill`, shared cleanup or CPU burners. Keep logs and screenshots needed for review.
- Live stats polls the SLOPE worker every 60 seconds and keeps fallback/last-known data on failures.
- A page load alone does not prove fresh stats or release content.
- Keep failed and superseded CI, build warnings and cancellation history; this rollout performs no manual retries or cancellations.
- Batch known repairs before a stable push. Record the cause and reason for any later rerun.
- Do not hide defects with skips, baseline/hash refreshes, version edits or threshold changes.

Hosted rollback commands and saved-build rules are **unresolved**.
Sebastian must confirm host access and how to restore a known build before release.
You can revert source through an approved PR. That alone does not prove a hosted rollback.
Package publication and stats-backend changes need their own recovery rules.
Update this guide in the same PR as future workflow or delivery changes, keeping policy sources intact.
