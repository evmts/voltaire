# Release Process

This document describes how to release a new version of `@tevm/primitives` to npm.

## Prerequisites

1. **npm account**: You need an npm account with publish access to `@tevm/primitives`
2. **GitHub access**: You need write access to the repository
3. **npm token**: Set up an `NPM_TOKEN` secret in GitHub repository settings

## Release Steps

### 1. Ensure All Changes Are Merged

Make sure all intended changes are merged to the `main` branch and CI is passing.

Check CI status: https://github.com/evmts/primitives/actions/workflows/ci.yml

### 2. Update Version in package.json

Edit `package.json` and update the version number following [semantic versioning](https://semver.org/):

- **Patch** (0.0.x): Bug fixes, no API changes
- **Minor** (0.x.0): New features, backward compatible
- **Major** (x.0.0): Breaking changes

Example:
```json
{
  "name": "@tevm/primitives",
  "version": "0.0.2"
}
```

### 3. Commit Version Change

```bash
git add package.json
git commit -m "chore: bump version to 0.0.2"
git push origin main
```

### 4. Create and Push Git Tag

Create a git tag matching the version:

```bash
# Create tag
git tag v0.0.2

# Push tag to trigger release workflow
git push origin v0.0.2
```

### 5. Monitor Release Workflow

The release workflow will automatically:

1. **Validate**: Run all Zig builds and tests
2. **TypeScript Quality**: Run typecheck, lint, format check, and tests
3. **Build Artifacts**: Build native libraries for Linux, macOS, and Windows
4. **Publish to npm**: Build and publish the package with provenance
5. **Create GitHub Release**: Generate release notes and create a GitHub release

Monitor progress: https://github.com/evmts/primitives/actions/workflows/release.yml

### 6. Verify Release

After the workflow completes:

1. **Check npm**: Visit https://www.npmjs.com/package/@tevm/primitives
2. **Check GitHub Releases**: Visit https://github.com/evmts/primitives/releases
3. **Test installation**:
   ```bash
   npm install @tevm/primitives@latest
   # or
   bun add @tevm/primitives@latest
   ```

## Troubleshooting

### Release Workflow Fails

If the release workflow fails:

1. **Check the logs**: Click on the failed job in GitHub Actions
2. **Fix the issue**: Make necessary changes and push to main
3. **Delete the tag**:
   ```bash
   git tag -d v0.0.2
   git push origin :refs/tags/v0.0.2
   ```
4. **Retry**: Go back to step 3 and create the tag again

### npm Publish Fails

If npm publish fails but other steps pass:

1. **Check npm token**: Ensure `NPM_TOKEN` secret is set correctly in GitHub
2. **Check package name**: Ensure the package name is available and you have access
3. **Manual publish**: You can manually publish after fixing issues:
   ```bash
   npm login
   npm publish --access public
   ```

### Build Failures

If builds fail during release:

- The issue should have been caught by CI before tagging
- Fix the build issues, merge to main, and retry the release

## Rolling Back a Release

If you need to roll back a release:

### npm

You can deprecate a version (recommended):
```bash
npm deprecate @tevm/primitives@0.0.2 "This version has been deprecated due to [reason]"
```

Or unpublish within 72 hours (not recommended):
```bash
npm unpublish @tevm/primitives@0.0.2
```

### GitHub

Delete the release and tag:
1. Go to https://github.com/evmts/primitives/releases
2. Delete the release
3. Delete the tag:
   ```bash
   git tag -d v0.0.2
   git push origin :refs/tags/v0.0.2
   ```

## Pre-release Versions

For beta or alpha releases:

1. Update version with pre-release identifier:
   ```json
   "version": "0.1.0-beta.1"
   ```

2. Tag and push:
   ```bash
   git tag v0.1.0-beta.1
   git push origin v0.1.0-beta.1
   ```

3. The workflow will automatically detect and publish as a pre-release

## Release Checklist

- [ ] All changes merged to main
- [ ] CI passing on main branch
- [ ] Version updated in package.json
- [ ] Version committed and pushed
- [ ] Git tag created and pushed
- [ ] Release workflow completed successfully
- [ ] Package verified on npm
- [ ] GitHub release verified
- [ ] Installation tested

## Additional Notes

- **Provenance**: The package is published with npm provenance enabled for supply chain security
- **Multi-platform**: The workflow builds and tests on Linux, macOS, and Windows
- **WASM**: The release includes WebAssembly builds for browser compatibility
- **Native bindings**: The package includes native Zig libraries for better performance

## Questions?

For questions or issues with the release process, please:
1. Check the GitHub Actions logs
2. Review this document
3. Open an issue on GitHub
