# Merge Status

Last updated: 2026-03-25 (America/Toronto)

## Source Repo Consolidation

| Source Repo | Relevant | Clone Status | Verification | Notes |
|---|---|---|---|---|
| `conversion.craft-` | yes | cloned then removed | `diff -qr` run vs current repo | Current repo is a superset; staging clone was deleted after merge validation. |
| `conversioncraft` | yes | blocked | clone failed | `fatal: could not read Username for 'https://github.com': Device not configured` |
| `conversion-craft-` | yes | blocked | clone failed | `fatal: could not read Username for 'https://github.com': Device not configured` |
| duplicate `conversion.craft-` URL | yes | skipped | already covered | Duplicate source URL. |

## Exact Commands Used

```bash
cd /Users/anwarito/Desktop/conversioncraft5/tools/sources

git clone https://github.com/Anwarito-lbd/conversion.craft-.git conversion.craft-
git clone https://github.com/Anwarito-lbd/conversioncraft.git conversioncraft
git clone https://github.com/Anwarito-lbd/conversion-craft-.git conversion-craft-
```

## How to Unblock Private Repo Import

Authenticate GitHub first, then re-run import script.

```bash
gh auth login
# or:
git config --global credential.helper osxkeychain
```

Then:

```bash
bash /Users/anwarito/Desktop/conversioncraft5/scripts/import_sources.sh
```

## Merge Strategy

1. Clone source repos into `tools/sources/`.
2. Compare trees with excludes (`.git`, `node_modules`, `venv`, caches, build outputs).
3. Copy only missing/valuable files into main repo.
4. Resolve duplicate/conflicting files by keeping latest production-ready implementation in current monorepo paths.
5. Record every import and conflict decision in this file.
