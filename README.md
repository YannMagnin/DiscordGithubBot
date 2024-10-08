# GithubBotGang

This is a small discord bot used to notify Github activities without using any
webhook so we need to create a bot ad-hoc.

## Install

To install the project, you need to install [bun](bun.sh) and simply run:

```bash
bun install
bun run src/main.ts --help
```

## Project setup

- `bun.sh (1.1.x)` : javascript runtime
- `vscode (x.x.x)` : code editor
- `[vscode] indent-raindow` : colored tabulation
- `[vscode] prettier` : for auto code formatting
- `[vscode] ESlint` : for strict Javascript linter

Normally, the workspace configuration is included in the code base, but if you
need to configure it manually, only `Prettier` to force code format at each save
and the tab size. To do so, you need to:

1. go to the `File -> Preference -> Settings` and select `Workspace`
2. search for `format on save` and enable it
3. search for `default formatter` and select `Prettier`
4. search for `tab size` and write `2`
