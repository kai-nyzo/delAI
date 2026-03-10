# Екосистема AI + Strudel

Дослідження існуючих проєктів, що поєднують AI/LLM зі Strudel live coding.

---

## MCP-інтеграції

### strudel-mcp-bridge (phildougherty)

- **Репо**: https://github.com/phildougherty/strudel-mcp-bridge
- **Ліцензія**: MIT | **Версія**: 2.0.0 | **Зірки**: 16
- **Стек**: Node.js/TypeScript, `@modelcontextprotocol/sdk`, `ws`

**Архітектура:**
```
User prompt → LLM (generates code) → MCP Server (stdio) → WebSocket (:3001) → Browser Extension → strudel.cc editor → Audio
```

Три компоненти:
1. **MCP Server** — Node.js, stdio транспорт, WebSocket сервер на порту 3001
2. **Browser Extension** — Chrome/Edge Manifest V3, ін'єкція коду в CodeMirror
3. **Strudel Reference** — ~470 рядків markdown, вбудований як MCP resource `strudel://reference`

**MCP Tools:**
| Tool | Опис |
|---|---|
| `execute_pattern` | Відправити Strudel-код у браузер через WebSocket |
| `stop_pattern` | Зупинити відтворення |
| `get_connection_status` | Статус підключення браузера |

**Ключові проблеми:**
- Browser autoplay policy вимагає user gesture — перше відтворення може мовчки зфейлитись
- DOM-ін'єкція крихка — 5 fallback методів для запису в CodeMirror
- Евалюація коду через перебір: глобальні функції → кнопки → keyboard shortcuts
- `execute_pattern` — fire-and-forget, LLM не отримує зворотного зв'язку про успіх
- Порт 3001 хардкоднутий
- Тільки Chrome/Edge
- **Статус**: dormant з жовтня 2025, 8 комітів від одного розробника

---

### strudel-mcp-server (williamzujkowski)

- **Репо**: https://github.com/williamzujkowski/strudel-mcp-server
- **npm**: `@williamzujkowski/strudel-mcp-server` v2.4.1
- **Ліцензія**: MIT

**Архітектура**: Playwright запускає реальний Chromium → навігація на strudel.cc → взаємодія через `strudelMirror` API та keyboard shortcuts.

**65+ MCP Tools** в категоріях:

| Категорія | Кількість | Ключові tools |
|---|---|---|
| Core Control | 10 | `init`, `write`, `play`, `stop`, `pause`, `clear` |
| Pattern Generation | 10 | `generate_pattern` (10+ жанрів), `generate_drums`, `generate_bassline`, `generate_melody` |
| Music Theory | 6 | `generate_scale`, `generate_chord_progression`, `generate_euclidean` |
| Effects | 4 | `add_effect`, `remove_effect`, `set_tempo`, `add_swing` |
| Audio Analysis | 6 | `analyze_spectrum`, `analyze_rhythm`, `detect_tempo`, `detect_key` |
| Session | 5 | `save`, `load`, `undo`, `redo` |
| MIDI Export | 1 | `export_midi` |
| Multi-Session | 4 | до 5 одночасних сесій |

**Аудіо-аналіз:**
- Спектральний аналіз: 5-смуговий (bass/low-mid/mid/high-mid/treble)
- Детекція темпу: spectral flux onset detection, 40-200 BPM
- Детекція тональності: 12-dimensional chroma, Krumhansl-Schmuckler profiles, 84 комбінації
- Аналіз ритму: onset density, subdivision quantization, syncopation

**Залежності**: Playwright, `@strudel/core`, `@strudel/mini`, `@strudel/tonal`, `@tonejs/midi`, `@google/generative-ai` (опціональний Gemini feedback)

**Проблеми:**
- Залежність від strudel.cc (потрібен інтернет)
- Chromium = значне навантаження на CPU/RAM
- stdout хак: перенаправлення stdout→stderr через emoji в @strudel/* imports
- Regex-based парсинг патернів для MIDI (не повний)
- Test coverage 78% (< 80% goal)

---

## Генератори композицій

### strudel-claude-music-generator (etbars)

- **Репо**: https://github.com/etbars/strudel-claude-music-generator
- **Ліцензія**: AGPL-3.0 (конфлікт: README каже MIT)
- **Стек**: Node.js/Express backend + HTML/CSS/JS frontend з `<strudel-editor>` web component

**Архітектура:**
```
User prompt → Frontend → POST /api/generate → Backend
  → Musical Intelligence аналіз (genre, key, tempo, arrangement)
  → Claude API (claude-sonnet-4-20250514, temperature 0.8, max_tokens 2000)
  → Post-processing & validation
  → Strudel код → Frontend → <strudel-editor> → Web Audio
```

**4 стратегії генерації:**

1. **Standard** (`/api/generate`) — локальний аналіз + Claude з великим system prompt (~3000 слів)
2. **Advanced** (`/api/generate/advanced`) — 4 послідовні виклики Claude API:
   - Structure analysis → Instrumentation → Pattern generation → Integration
3. **Simple** (fallback) — мінімальний промпт, забороняє advanced features
4. **Pattern/Synthesis-assisted** — додає curated templates до промпту

**Модулі музичної теорії:**
- `musical_theory.js` (~9KB): гами (14 типів), акорди, прогресії, NLP-аналіз тональності з тексту промпту
- `genre_intelligence.js` (~13KB): 6 жанрів з деталями (tempo, drum patterns, bass lines, effects)
- `arrangement_intelligence.js` (~13KB): секції (intro/verse/chorus/bridge/drop), переходи, динаміка
- `sounds.js` (~5KB): whitelist валідних звуків Strudel
- `synthesis_presets.js` (~11KB): пресети інструментів (guitar, piano, brass, strings, woodwinds)

**Сильні сторони:**
- Найкращий prompt engineering серед усіх проєктів
- Whitelist валідних звуків мінімізує галюцинації
- Post-processing фіксить типові помилки Claude
- Multiple fallback стратегії

**Слабкості:**
- Advanced pipeline = 4 API calls (дорого, ~10-15с)
- Arrangement code механічно додає `.every()/.sometimes()` — може зламати синтаксис
- Не може "слухати" результат — якість залежить від промпту

---

### strands-strudel (cagataycali)

- **Репо**: https://github.com/cagataycali/strands-strudel
- **Стек**: Python, Strands Agents SDK
- **Статус**: Alpha (v0.1.1)

Мінімальний Python-пакет — **tool для AI-агентів**, не самостійний додаток.

```
Strands Agent (Python) → WebSocket :9999 → Browser Player (Strudel.js)
                                                  ↓ HTTP :10000
                                           Mobile/Other Browsers
```

- Один entry point: `strudel(action, code, style, open_browser)`
- 13 preset стилів (techno, ambient, DnB, house, acid, lofi, minimal...)
- Real-time WebSocket broadcast до кількох клієнтів
- Вбудований HTML5 плеєр з glass-morphism UI

---

## Документація для LLM

### strudel-llm-docs (calvinw)

- **Репо**: https://github.com/calvinw/strudel-llm-docs
- **Найкраща документація для LLM-генерації Strudel коду**

**Структура:**
```
CLAUDE.md                          — головні інструкції для LLM
docs/
  TABLE_OF_CONTENTS.md             — індекс всіх tutorial docs
  basics_and_getting_started.md    — основи Strudel
  patterns_and_notation.md         — mini-notation reference
  audio_and_synthesis.md           — signal chain, синтез, ефекти
  samples_and_sounds.md            — семпли та маніпуляція
  musical_theory.md                — гами, акорди, voicings
  advanced_features.md             — MIDI, OSC, Hydra
  recipes_and_examples.md          — практичні патерни та аранжування
docs/ref/
  strudel_reference_INDEX.txt      — 407 функцій → файли
  strudel_reference_QUICK_LOOKUP.txt — однорядковий опис кожної функції
  strudel_reference_A-C.txt        — 80 функцій
  strudel_reference_D-F.txt        — 63 функції
  ...
docs/sounds/
  synths.txt, samples.txt, drum-machines.txt, wavetables.txt
```

**Anchor Framework — методологія композиції:**
- Крок 0: Стек з 4 інструментів, "якірні" ноти на позиціях 1,4,7,10
- Крок 1-2: Заміна тембрів, заповнення мелодій
- Крок 3-5: Синкопація (5 базових трансформацій)
- Крок 6: Ефекти
- Крок 7: Перкусія

**Ключова інновація**: split-reference архітектура. LLM ніколи не завантажує всі ~120KB reference — спочатку QUICK_LOOKUP (~40KB), потім потрібний алфавітний файл.

**MCP інтеграція**: віддалений сервер `strudel-llm.mcp.mathplosion.com/sse` з tools:
- `play_code` — виконати код
- `stop_play` — зупинити
- `get_currently_playing_code` — прочитати поточний код

---

## Інші проєкти

### StrudelLive (IAmSpring)

- **Репо**: https://github.com/IAmSpring/StrudelLive
- Full-stack React + Express + PostgreSQL з OpenAI GPT-4o інтеграцією
- Monaco Editor, AI Composer (до 50 кроків), collaborative editing через WebSocket
- **Статус**: прототип — audio engine **не підключений** (TODO коментарі, `Math.random()` метрики)

### Strudel Studio (cognitic-ai)

- **Репо**: https://github.com/cognitic-ai/strudel-studio-jbcb
- Expo/React Native app — WebView обгортка навколо strudel.cc
- 8 preset патернів, iOS Liquid Glass
- **Статус**: ранній спайк, 4 коміти, **без AI**

---

## Статті та блоги

### Nicholas Griffin — "Creating Strudel Live Coding Patterns with AI"
- https://nicholasgriffin.dev/blog/creating-strudel-live-coding-patterns-with-ai
- Custom AI app з StrudelMirror + `prebake()` для аудіо-контексту
- Ключовий інсайт: 3-рівнева структура промпту (Identity → Musical Priorities → Hard Rules)

### thoughtwax — "Live-coding music with AI"
- http://thoughtwax.com/2025/06/live-coding/
- Найпростіший підхід: paste промпти в Claude → отримай Strudel-код
- AI як "парашут" у незнайому область — стартова точка для ручного рефайнменту

### Skywork — "AI Engineer's Guide to Strudel MCP Server"
- https://skywork.ai/skypage/en/ai-engineer-guide-strudel-live-coding/1981613226920611840
- Інкрементальна генерація: "Start simple → build gradually → refine"
- Agentic loop: AI діє → аналізує результат → модифікує

### DocsBot — "Strudel Code Music Prompt"
- https://docsbot.ai/prompts/creative/strudel-code-music-prompt
- Структурована специфікація: genre, tempo, key, instrumentation, form
