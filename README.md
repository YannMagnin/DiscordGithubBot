# DiscordGithubBot

TL;DR do not use it, it's a very specific Discord bot designed for my personal
needs

This is a small discord bot used to notify Github activities without using any
webhook. I do not have access to the projects I want to follow and I also want
to get notified only when people I know interact with these.

## Install

To install the project, you need to install [bun](bun.sh) and simply run:

```bash
bun install
bun run --env-file=.your_env_file src/main.ts --help
```

Note that you need to provide your own bot secret token through the environment
variable `DISCORD_TOKEN`.

## Developement setup

You need to install:

- `bun.sh (1.1.x)` : javascript runtime
- `vscode (x.x.x)` : code editor
- `[vscode] indent-raindow` : colored tabulation
- `[vscode] prettier` : for auto code formatting
- `[vscode] ESlint` : for strict Javascript linter

Normally, the workspace configuration is included in the code base, but if you
need to configure it manually, you need to:

1. go to the `File -> Preference -> Settings` and select `Workspace`
2. search for `format on save` and enable it
3. search for `default formatter` and select `Prettier`
4. search for `tab size` and write `2`
