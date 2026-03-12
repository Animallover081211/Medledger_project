# Local Requirements (macOS)

Install these once on your machine before running the project scripts.

## 1) Homebrew (if needed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## 2) Node.js

```bash
brew install node
```

Verify:

```bash
node --version
npm --version
```

## 3) Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

Add to PATH if needed:

```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

Verify:

```bash
bun --version
```

## 4) Go (Golang)

```bash
brew install go
```

Verify:

```bash
go version
```
