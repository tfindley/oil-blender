Ship the current branch: commit any uncommitted changes, apply the next patch-version tag, and push both to origin to trigger the GitHub Actions release build.

## Steps

1. **Check state**: run `git status` and `git diff` to see what is uncommitted.

2. **Commit if needed**: if there are uncommitted changes, stage all relevant files and commit with a concise message that summarises the changed areas. Follow the project's commit style: lowercase imperative subject line, feature areas listed in the body. Include the Co-Authored-By trailer:
   ```
   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```

3. **Determine version**: if `$ARGUMENTS` contains a version string (e.g. `v0.2.0`), use it. Otherwise run `git tag --sort=-version:refname | head -1` to find the latest tag and increment the patch number (e.g. `v0.1.5` → `v0.1.6`).

4. **Tag**: `git tag -a <version> -m "Release <version>"`

5. **Push branch**: `git push origin main`

6. **Push tag**: `git push origin <version>` — this triggers the GitHub Actions workflow (`.github/workflows/release.yml`) which builds the Docker image, pushes `ghcr.io/tfindley/oil-blender:<version>` and `:latest` to GHCR, and creates a GitHub Release.

7. **Report**: confirm the tag that was pushed and note that the build can be watched at the Actions tab on GitHub (`https://github.com/tfindley/oil-blender/actions`).

## Notes

- Do not skip the commit step if there are uncommitted changes — shipping a dirty tree is never the intent.
- Do not force-push or amend existing tags.
- If the working tree is already clean and HEAD is already tagged, say so and do nothing.
- The release workflow creates the GitHub Release automatically from the tag — do not create one manually.
