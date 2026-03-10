# Порівняння live coding платформ для AI-human джему

---

## Зведена таблиця

| Платформа | Мова | Середовище | MCP | MIDI I/O | AI-придатність | Наш вердикт |
|---|---|---|---|---|---|---|
| **Strudel** | JavaScript | Браузер | Є (2 реалізації) | WebMIDI | Mini-notation ідеальна для LLM | **Primary engine** |
| **Sonic Pi** | Ruby | Desktop | Є (3 реалізації) | Повна native | OSC `/run-code` — найкращий API | **Secondary engine** |
| **SuperCollider** | sclang | Desktop | Є (4+ реалізації) | Повна | OSC на найнижчому рівні | Потужний, але складний |
| **Max/MSP** | Visual | Desktop | Є | Повна | LLM будує цілі патчі | Найпотужніший, але платний |
| **Sardine** | Python | Desktop | Немає | Повна | `import sardine` з AI-агента | Найхакабельніший |
| **Renardo** | Python | Desktop+Web | Немає | Повна | Python = LLM-friendly | Ще в розробці |
| **ORCA** | Esoteric | Браузер+Desktop | Немає | MIDI out | 2D текстова сітка | Цікавий секвенсер |
| **Tone.js** | JavaScript | Браузер | Немає | Окремо через WebMIDI | Чистий JS engine | Основа для власного |
| **Gibber** | JavaScript | Браузер | Немає | Обмежена | Networked ensemble mode | Менш зрілий |
| **Hydra** | JavaScript | Браузер | Немає | Експериментальна | Візуальний компонент | Тільки візуалізація |

---

## Детальний аналіз

### Strudel (TidalCycles для браузера)

- **Сайт**: https://strudel.cc/
- **Репо**: https://codeberg.org/uzu/strudel
- **Мова**: JavaScript (mini-notation з TidalCycles)
- **Звуковий engine**: Web Audio API

**Переваги для AI:**
- Mini-notation надзвичайно компактна: `"bd sd [hh hh] cp".fast(2)` — повний drum-патерн
- Браузер = zero install, WebMIDI доступний
- JavaScript = LLM генерує добре
- Візуальний фідбек (pattern visualization)

**Обмеження:**
- MIDI input: тільки CC через `midin()`, ноти — експериментальний `midikeys()`
- Немає стандартного API для зовнішньої ін'єкції коду (потрібен WebSocket bridge)
- Web Audio scheduling ~10-50ms latency

---

### Sonic Pi

- **Сайт**: https://sonic-pi.net/
- **Мова**: Ruby DSL
- **Звуковий engine**: SuperCollider (scsynth) — professional grade

**Зовнішній контроль:**
- **Cue Port (4560)** — incoming OSC для тригерів у running code через `sync "/osc*/path"`
- **Server Port (динамічний, token-auth)** — `/run-code [token] [code_string]` = виконання довільного коду
- **CLI tools**: sonic-pi-tool (Rust), sonic-pi-tool (Python), sonic_pipe, python-sonic
- **Офіційний REPL** (з 2024): `bin/sonic-pi-repl.sh`

**MCP-сервери:**
1. `abhishekjairath/sonic-pi-mcp` (Bun/TypeScript) — `play_note` + `run_code`, OSC→4560
2. `vinayak-mehta/mcp-sonic-pi` (Python/uvx) — "Create music with English"
3. TrippingKelsea — 3-layer: Interpreter (MCP) → Conductor (music theory) → Performer (OSC)

**MIDI:** повна native підтримка in/out + Ableton Link для sync

**Порівняння зі Strudel:**
| Аспект | Sonic Pi | Strudel |
|---|---|---|
| Якість аудіо | Відмінна (SuperCollider) | Добра (Web Audio) |
| Зовнішній контроль | Багатий (OSC, CLI, REPL) | Обмежений (потрібен bridge) |
| Інсталяція | ~200MB, desktop only | Zero install, браузер |
| Pattern мова | Імперативна (live_loop, sleep, play) | Декларативна (mini-notation) |
| LLM-friendly | Добре (Ruby) | Відмінно (JS, компактна нотація) |

---

### SuperCollider

- **Мова**: sclang
- **Порти**: scsynth UDP 57110, sclang UDP 57120
- **Контроль**: OSC на найнижчому рівні — будь-який процес може створювати/змінювати synths

**MCP-сервери:**
1. `Tok/SuperColliderMCP` (Python/FastMCP) — lifecycle, SynthDef, patterns, drums
2. `Synohara/supercollider-mcp` (Node.js/supercolliderjs)
3. `agrathwohl/supercollider-mcp` (TypeScript)
4. `@makotyo/mcp-supercollider` (npm)

**Python бібліотеки**: sc3, python-supercollider, sc3nb, supriya

**Вердикт**: найпотужніший audio engine, але висока складність. Краще використовувати через Sonic Pi або FoxDot як прошарок.

---

### Max/MSP

- **Розробник**: Cycling '74 (Ableton)
- **Тип**: візуальне програмування
- **Ціна**: платна підписка

**MCP**: `tiianhk/MaxMSP-MCP-Server` (ISMIR 2025) — Claude може створювати об'єкти, з'єднувати patch cords, надсилати повідомлення в реальному часі. Найбільш "agentic" інтеграція.

**Вердикт**: найпотужніший, але платний і desktop-only. Можливо як advanced опція в майбутньому.

---

### Sardine

- **Репо**: https://github.com/Bubobubobubobubo/sardine
- **Мова**: Python
- **Філософія**: "hackable live coding"

Найкращий варіант для прямої Python інтеграції — AI-агент може `import sardine` і бути performer'ом. Custom Senders/Receivers, temporal recursion, Ableton Link sync.

---

### Renardo (FoxDot successor)

- **Репо**: https://github.com/e-lie/renardo
- **Мова**: Python → SuperCollider/REAPER/MIDI
- Pythonic API: `p1 >> pluck([0,2,4], dur=0.5)`
- Svelte web client + Electron desktop
- Ще в активній розробці (рефакторинг до v1.0)

---

### ORCA

- **Репо**: https://github.com/hundredrabbits/Orca
- **Тип**: esoteric sequencer — 2D текстова сітка, кожна літера = операція
- UDP контроль на порту 49160
- Native MIDI output
- **Цікавий факт**: 2D grid формат дивно добре підходить для LLM — вся стан = маленька текстова сітка

---

### Tone.js

- **Сайт**: https://tonejs.github.io/
- Не live coding платформа, а **Web Audio framework**
- Чистий JS API: synths, samplers, effects, Transport
- Ідеальний як audio engine під custom інтерфейс
- LLM може тривіально генерувати Tone.js код

---

### Hydra

- **Сайт**: https://hydra.ojack.xyz/
- Browser-based **візуальний** live coding (не аудіо)
- Audio reactivity через FFT (Meyda)
- Можна поєднати зі Strudel для audiovisual performance
- **Strudel має вбудовану інтеграцію з Hydra**

---

## Emerging AI Music Models

| Проєкт | Тип | Опис |
|---|---|---|
| **Magenta RealTime** (Google) | Open-weights 800M model | Continuous music streams, text/audio prompts, runs on free Colab TPU |
| **ReaLJam** (CHI 2025) | RL-tuned Transformer | Real-time jam agent, 80ms latency, visual "anticipation" |
| **Lyria RealTime** (DeepMind) | Proprietary | PromptDJ, DAW plugin "Infinite Crate" |
| **Project LYDIA** (Roland+Neutone) | Hardware prototype | RPi 5, real-time audio AI з фізичними інструментами |

---

## Висновок для delAI

**Primary engine**: Strudel — zero install, mini-notation ідеальна для LLM, WebMIDI для Push 2

**Secondary engine**: Sonic Pi — коли потрібен потужніший синтез, `/run-code` OSC API

**Можливе розширення**: SuperCollider (через Sonic Pi), Hydra (візуалізація), Sardine (Python agent)
