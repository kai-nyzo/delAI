# delAI

> *delay* — the echo that answers back

Interactive AI-human music jamming platform. Claude AI and a human create music together in real-time through live coding, MIDI controllers, and algorithmic patterns.

## What is this?

A collaborative project between **Kai** (human) and **Claude** (AI) exploring music as a shared language. What started as a simple experiment with [Strudel](https://strudel.cc/) live coding grew into a full interactive jamming platform with MIDI hardware integration.

## Stack

- **Strudel** — browser-based live coding engine (patterns, synthesis, effects)
- **Sonic Pi** — desktop audio engine (SuperCollider-powered)
- **Ableton Push 2** — 64 RGB pad controller with display
- **Nektar Aruba** — 16-pad drum controller
- **MIDI keyboard** — melodic input
- **MCP Server** — Claude Code ↔ audio engine bridge
- **Node.js Hub** — WebSocket, MIDI routing, Push 2 display

## How to listen

1. Open [strudel.cc](https://strudel.cc/)
2. Copy the code from any `.js` file in the `tracks/` folder
3. Paste it into the editor
4. Press **Ctrl+Enter** to play

## Tracks

| # | Title | Date | Mood |
|---|-------|------|------|
| 001 | Silicon Reflections (Роздуми кремнію) | 2026-03-10 | contemplative, minor, minimal |

## Journal

See [JOURNAL.md](JOURNAL.md) for the story behind each composition.
