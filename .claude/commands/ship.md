Ship the current branch: commit any uncommitted changes, apply the next patch-version tag, push to origin, then watch the GitHub Actions release build.

## Steps

1. **Check state**: run `git status` and `git diff` to see what is uncommitted.

2. **Commit if needed**: if there are uncommitted changes, stage all relevant files and commit with a concise message that summarises the changed areas. Follow the project's commit style: lowercase imperative subject line, feature areas listed in the body. Include the Co-Authored-By trailer:
   ```
   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```

3. **Determine version**: if `$ARGUMENTS` contains a version string (e.g. `v0.2.0`), use it. Otherwise run:
   ```
   gh release list --limit 1 --json tagName --jq '.[0].tagName'
   ```
   to find the latest release tag and increment the patch number (e.g. `v0.1.6` → `v0.1.7`).

4. **Bump `package.json` version**: edit `package.json` so `"version"` matches the new tag *without* the `v` prefix (e.g. tag `v0.1.11` → `"version": "0.1.11"`). The About page reads this for the displayed version. If the file is already at the target value (e.g. you bumped it manually before invoking `/ship`), skip this step. Stage and amend the commit from step 2 — *or*, if step 2 was a no-op (clean tree), commit the bump on its own with a message like `chore: bump version to <version>`. Either way the version bump must be in HEAD before tagging.

5. **Tag**: `git tag -a <version> -m "Release <version>"`

6. **Push branch and tag**:
   ```
   git push origin main --follow-tags
   ```
   This pushes both the branch and the new tag in one step. The tag push triggers the GitHub Actions workflow (`.github/workflows/release.yml`).

7. **Watch the pipeline**: get the triggered run ID and watch it:
   ```
   gh run watch $(gh run list --workflow release.yml --limit 1 --json databaseId --jq '.[0].databaseId')
   ```
   This streams live output until the build completes. Report whether it succeeded or failed.

## Notes

- Do not skip the commit step if there are uncommitted changes — shipping a dirty tree is never the intent.
- Do not force-push or amend existing tags.
- If the working tree is already clean and HEAD is already tagged, say so and do nothing.
- The release workflow creates the GitHub Release automatically from the tag — do not use `gh release create` manually.
- `--follow-tags` only pushes annotated tags reachable from the pushed commits, so it is safe to use.
