# 0.5.1-k1

Kaczev fork of [Yu-tao-Li/dsh-computer-use-win](https://github.com/Yu-tao-Li/dsh-computer-use-win), based on 0.5.1. Original MIT notices and attribution are retained. This is a GitHub-only trial release; it has not been published to npm.

## Fix

The package and bundle row were renamed to `dsh-computer-use`. The browser module now registers under that same id; the previous mismatch with `dsh-computer-use-win` made DSH fail while loading the client half after a restart.

Empty or whitespace-only optional `elementId` values now fall back to supplied coordinates for click, double-click, move, scroll and element inspection. Nonblank IDs still take precedence. A stale or invalid nonblank ID still fails rather than silently clicking coordinates.

The upstream MCP schema already makes these IDs optional. This patch does not change DSH's model/provider schema adaptation.

## Verification

Added argument-dispatch regression coverage without physical mouse/keyboard input, covering omitted/null/empty/whitespace IDs, zero/negative coordinates, missing coordinates, ID precedence and stale-ID rejection. Existing input safety contracts and MCP self-test pass. Full suite results are recorded in the GitHub release description.

## Install

Download `dsh-computer-use-0.5.1-k1.tgz` and install it through the DSH plugin manager, replacing the existing package of the same name. Do not enable a second copy of the bridge. A running Host module replacement may require restarting DSH before it loads the new code.
