# Архітектура delAI

> *delay — the echo that answers back*

---

## Загальна схема

```
┌─────────────────────────────────────────────────────────────────┐
│                         Claude Code                              │
│  • Генерує/модифікує Strudel-патерни                            │
│  • Керує LED-анімаціями Push 2                                   │
│  • Реагує на гру користувача                                     │
│  • Композиція в реальному часі                                   │
│  • CLAUDE.md = Strudel API reference + music theory              │
└──────────────┬──────────────────────────────────────────────────┘
               │ MCP Protocol (stdio)
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Node.js Hub Server                          │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ MCP Server   │  │ WebSocket    │  │ Push 2 Controller     │  │
│  │ (stdio)      │←→│ Bridge       │←→│ • LEDs (node-midi)    │  │
│  │              │  │ (:9001)      │  │ • Display (node-usb)  │  │
│  └─────────────┘  └──────────────┘  └────────────────────────┘  │
│                          ↕                                       │
│                   ┌──────────────┐                               │
│                   │ Session      │                               │
│                   │ State        │                               │
│                   └──────────────┘                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │ WebSocket
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Browser (Strudel Player)                        │
│                                                                  │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐  │
│  │ Strudel Engine       │  │ WebMIDI Layer                    │  │
│  │ • Audio synthesis    │  │ • MIDI Keyboard → notes          │  │
│  │ • Pattern evaluation │  │ • Aruba pads → drums             │  │
│  │ • Effects chain      │  │ • Aruba encoders → CC → effects  │  │
│  │ • Sample playback    │  │ • Push 2 encoders → CC → effects │  │
│  └─────────────────────┘  │ • Push 2 pads → pattern triggers  │  │
│                            │ • → Push 2 LEDs (Note On colors) │  │
│  ┌─────────────────────┐  └──────────────────────────────────┘  │
│  │ WebSocket Client     │                                        │
│  │ • Receives code      │                                        │
│  │ • Sends state back   │                                        │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    Hardware Layer                                  │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ MIDI Keyboard │  │ Nektar Aruba │  │ Ableton Push 2         │  │
│  │ (notes)       │  │ (drums+knobs)│  │ (pads+knobs+display)   │  │
│  │ USB/WebMIDI   │  │ USB/WebMIDI  │  │ USB MIDI + USB Bulk    │  │
│  └──────────────┘  └──────────────┘  └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Компоненти

### 1. Claude Code (MCP Client)

Claude Code — точка входу для AI. Через MCP tools Claude може:
- Надсилати Strudel-код для відтворення
- Зупиняти/модифікувати відтворення
- Керувати Push 2 LEDs та дисплеєм
- Отримувати стан MIDI-контролерів
- Зберігати/завантажувати треки

**Контекст**: CLAUDE.md проєкту містить:
- Strudel API reference (адаптований з strudel-llm-docs)
- Music theory (гами, акорди, прогресії, жанрові пресети)
- Push 2 MIDI mappings
- Композиційні guidelines

### 2. Node.js Hub Server

Центральний хаб, що об'єднує всі компоненти.

**Модулі:**

#### mcp-server.ts
MCP сервер через stdio транспорт. Tools:

| Tool | Параметри | Опис |
|---|---|---|
| `play_code` | `code: string` | Відправити Strudel-код у браузер |
| `stop` | — | Зупинити відтворення |
| `get_status` | — | Статус підключення браузера та MIDI |
| `save_track` | `name: string, code: string` | Зберегти трек у `tracks/` |
| `load_track` | `name: string` | Завантажити трек |
| `list_tracks` | — | Список збережених треків |
| `set_push2_leds` | `pads: [{note, color, animation}]` | Встановити кольори падів |
| `push2_animation` | `type: string, params: object` | LED-анімація (wave, ripple, spectrum) |
| `push2_display` | `content: object` | Контент для дисплея Push 2 |
| `map_push2_pads` | `mapping: object` | Призначити патерни на пади |
| `get_midi_state` | — | Поточні CC/note з контролерів |
| `list_midi_devices` | — | Підключені MIDI пристрої |

#### ws-bridge.ts
WebSocket сервер на порту 9001.

**Протокол Server → Browser:**
```json
{ "type": "execute_code", "code": "..." }
{ "type": "stop" }
{ "type": "get_state" }
```

**Протокол Browser → Server:**
```json
{ "type": "state_update", "data": { "playing": true, "cycle": 42, "cps": 0.5 } }
{ "type": "execution_result", "success": true, "error": null }
{ "type": "midi_event", "device": "Aruba", "type": "cc", "channel": 0, "cc": 48, "value": 64 }
```

#### push2/display.ts
Рендеринг на 960x160 дисплей Push 2 через USB bulk transfer.
- Використовує `node-usb` для USB bulk endpoint 0x01
- BGR565 pixel format з XOR masking
- Canvas API для рендерингу тексту/графіки
- Frame rate: до 60fps

Контент на дисплеї:
- Назва поточного треку
- BPM / CPS
- Активні патерни
- Спрощений спектр
- Назви параметрів на енкодерах

#### push2/leds.ts
LED animation engine для 64 падів + кнопок.

Анімації:
- **Static**: фіксовані кольори для pattern grid
- **Pulse**: пульсація в ритм (sync з Strudel cycle)
- **Wave**: хвиля кольору, що проходить по сітці
- **Ripple**: від центру до країв
- **Spectrum**: візуалізація частотного спектру
- **Rain**: випадкові краплі
- **Fire**: теплі кольори знизу вгору

#### session/state.ts
Стан поточної jam-сесії:
- Який код зараз грає
- Стан MIDI-контролерів (CC values)
- Push 2 pad mapping
- Історія змін (undo/redo)

### 3. Browser Player

Локальний HTML-файл з вбудованим Strudel engine.

**Ключові бібліотеки:**
- `@strudel/repl` — web component `<strudel-editor>`
- WebMIDI API для MIDI I/O
- WebSocket client для зв'язку з Hub

**MIDI routing в браузері:**
```
MIDI Keyboard → WebMIDI → midin() / midikeys() → Strudel patterns
Aruba pads → WebMIDI → note triggers → Strudel drum sounds
Aruba encoders → WebMIDI → midin() CC → Strudel effect parameters
Push 2 encoders → WebMIDI → midin() CC → Strudel effect parameters
Push 2 pads → WebMIDI → pattern triggers (via WebSocket → Hub → Claude)

Strudel → WebMIDI output → Push 2 LEDs (Note On = color)
```

### 4. Optional: Sonic Pi Engine

Альтернативний/додатковий audio engine для складніших задач.

Підключення через Hub Server:
```
Hub Server → OSC UDP → Sonic Pi (port 4560 cues / dynamic port /run-code)
```

Використовується коли:
- Потрібен SuperCollider синтез
- Потрібні live_loop з hot-reload
- Потрібна обробка audio input

---

## Структура проєкту

```
delAI/
├── .claude/
│   └── settings.json              # MCP server config
├── CLAUDE.md                      # Strudel reference + music theory + Push 2 map
├── README.md
├── JOURNAL.md
├── package.json                   # Monorepo (npm workspaces)
│
├── hub/                           # Node.js Hub Server
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts               # Entry: запуск MCP + WS + Push2
│       ├── mcp-server.ts          # MCP tools
│       ├── ws-bridge.ts           # WebSocket server
│       ├── push2/
│       │   ├── display.ts         # Display renderer (USB bulk)
│       │   ├── leds.ts            # LED animation engine
│       │   └── mappings.ts        # Pad/button/encoder note & CC map
│       ├── midi/
│       │   ├── router.ts          # MIDI routing logic
│       │   └── devices.ts         # Device detection
│       └── session/
│           └── state.ts           # Session state
│
├── player/                        # Browser Strudel Player
│   ├── index.html                 # Strudel + WebMIDI + WebSocket
│   ├── js/
│   │   ├── midi-input.js          # MIDI input handler
│   │   ├── push2-leds.js          # Push 2 LED control via WebMIDI
│   │   └── ws-client.js           # WebSocket client
│   └── css/
│       └── style.css
│
├── docs/
│   ├── research/                  # Дослідження (цей документ)
│   ├── reference/                 # Strudel API reference (з strudel-llm-docs)
│   ├── sounds/                    # Каталоги звуків
│   └── theory/                    # Музична теорія, жанри, пресети
│
└── tracks/                        # Збережені композиції
    ├── 001-silicon-reflections.js
    └── ...
```

---

## Сценарії використання

### 1. Solo Claude — генерація треку
```
Kai: "Зроби dark ambient з granular текстурами"
Claude → play_code → Hub → WebSocket → Browser → Audio
Claude → set_push2_leds → Hub → Push 2 (dark purple pulsing)
```

### 2. Interactive Jam — спільна гра
```
Kai грає drums на Aruba
  → WebMIDI → Strudel → Audio
  → WebSocket → Hub → Claude бачить MIDI events
Claude додає bassline + pad
  → play_code → Hub → Browser → Audio overlay
Kai крутить encoder на Push 2
  → WebMIDI → midin() → filter cutoff sweep
Claude реагує: додає delay, змінює прогресію
```

### 3. Push 2 Pattern Grid
```
64 пади = 8 інструментів × 8 варіацій
Ряд 0: Drums     [basic | complex | euclidean | trap | ...]
Ряд 1: Bass      [sub | acid | walking | ...]
Ряд 2: Chords    [pads | stabs | arps | ...]
Ряд 3: Melody    [lead | sequence | random | ...]
...

Натиснути пад = активувати/деактивувати патерн
Колір = тип (drums=red, bass=blue, melody=green, fx=purple)
Пульсація = активний
Dim = доступний але неактивний
```

### 4. LED Visualization
```
Музика грає → Browser аналізує audio (FFT)
  → WebSocket → Hub → розрахунок LED-патерну
  → Push 2 LEDs оновлюються в ритм

Типи візуалізації:
- Spectrum: 8 колонок = frequency bands, яскравість = amplitude
- Beat pulse: всі пади пульсують на kick
- Wave: кольорова хвиля проходить по сітці
- Pattern mirror: пади = step sequencer view
```

---

## Фази реалізації

### Фаза 1 — Фундамент
- [ ] MCP server з базовими tools (play_code, stop, get_status)
- [ ] WebSocket bridge
- [ ] Browser player з `<strudel-editor>` + WebSocket client
- [ ] Strudel reference в CLAUDE.md
- [ ] Реєстрація MCP server в Claude Code

### Фаза 2 — MIDI Input
- [ ] WebMIDI input у browser player
- [ ] MIDI keyboard → Strudel notes
- [ ] Aruba pads → Strudel drums
- [ ] Aruba encoders → CC → Strudel effects
- [ ] MIDI event forwarding через WebSocket до Hub

### Фаза 3 — Push 2 LEDs
- [ ] Push 2 User Mode activation (SysEx)
- [ ] LED color control через WebMIDI output з browser
- [ ] Базові анімації (static grid, pulse)
- [ ] Pattern state → LED mapping

### Фаза 4 — Push 2 Display
- [ ] USB bulk transfer через node-usb в Hub
- [ ] Canvas renderer для track info, BPM, parameters
- [ ] Encoder labels на дисплеї

### Фаза 5 — Interactive Jam Mode
- [ ] Claude отримує MIDI events через MCP
- [ ] Real-time pattern modification у відповідь на гру
- [ ] Push 2 pad mapping з MCP control
- [ ] Session management (save/load jam states)

### Фаза 6 — Розширення (optional)
- [ ] Sonic Pi integration (OSC bridge)
- [ ] Audio analysis feedback (FFT → Claude)
- [ ] Hydra visual integration
- [ ] MIDI export
- [ ] Web-сайт з колекцією треків та player'ом
- [ ] Recording / audio capture

---

## Технічні рішення та обгрунтування

| Рішення | Альтернатива | Чому обрано |
|---|---|---|
| Власний MCP server | strudel-mcp-bridge | Контроль, Push 2 інтеграція, session state |
| WebSocket bridge | Playwright | Легший, без Chromium overhead |
| Локальний player | strudel.cc | Офлайн, стабільна версія, кастомний WebSocket |
| `<strudel-editor>` web component | Custom Tone.js | Повна Strudel сумісність, менше коду |
| Push 2 LEDs через WebMIDI | Node.js midi library | Менша латентність (браузер → USB напряму) |
| Push 2 Display через Node.js | WebUSB | WebUSB потребує user gesture, node-usb надійніший |
| Hub Server як центральна точка | P2P | Простіше, один процес керує всім |
| npm workspaces monorepo | Окремі репо | Спільні залежності, простіший dev workflow |
