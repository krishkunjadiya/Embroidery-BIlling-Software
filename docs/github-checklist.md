# GitHub Launch Checklist

Use this checklist before making the repository public.

## Identity and Metadata

- [ ] Confirm repository name and description in GitHub
- [ ] Add project topics (for example: `nextjs`, `electron`, `billing`, `typescript`)
- [ ] Add website URL if applicable
- [ ] Verify `LICENSE` is correct for your distribution intent

## Repository Health Files

- [x] `README.md`
- [x] `LICENSE`
- [x] `CONTRIBUTING.md`
- [x] `CODE_OF_CONDUCT.md`
- [x] `SECURITY.md`
- [x] `.github/ISSUE_TEMPLATE/*`
- [x] `.github/PULL_REQUEST_TEMPLATE.md`
- [x] `.github/workflows/ci.yml`
- [x] `.github/dependabot.yml`

## Code and Security Hygiene

- [ ] Ensure no secrets are committed
- [ ] Keep `.env` files local only
- [ ] Run `npm run check` locally
- [ ] Verify CI passes on first push

## Release and Collaboration Settings

- [ ] Protect `main` branch
- [ ] Require pull request reviews
- [ ] Require status checks before merge
- [ ] Enable Dependabot security updates
- [ ] Enable Code scanning (optional but recommended)

## First Release

- [ ] Tag first release as `v0.1.0` (or preferred)
- [ ] Add release notes from `CHANGELOG.md`
