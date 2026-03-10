# MIDI Hardware & Integration

---

## Ableton Push 2

### Огляд
- **64 RGB-пади** з повним контролем кольору
- **11 ротарних енкодерів** з touch detection
- **960x160 RGB дисплей** (USB bulk transfer, 60fps)
- **Touch strip** з 31 LED
- USB composite device: USB MIDI (2 порти) + USB Bulk (дисплей)
- **USB ID**: Vendor `0x2982`, Product `0x1967`

### Pad MIDI Map (8x8)

Формула: `note = 92 - (row * 8) + column` (row 0 = top, col 0 = left)

```
         Col0  Col1  Col2  Col3  Col4  Col5  Col6  Col7
Row 0:    92    93    94    95    96    97    98    99
Row 1:    84    85    86    87    88    89    90    91
Row 2:    76    77    78    79    80    81    82    83
Row 3:    68    69    70    71    72    73    74    75
Row 4:    60    61    62    63    64    65    66    67
Row 5:    52    53    54    55    56    57    58    59
Row 6:    44    45    46    47    48    49    50    51
Row 7:    36    37    38    39    40    41    42    43
```

### RGB LED Control

Кольори встановлюються через MIDI повідомлення **до** Push 2:
- **Пади**: Note On (0x90) з note = pad, velocity = **індекс палітри** (0-127)
- **Кнопки**: CC (0xB0) з CC = номер кнопки, value = **індекс палітри**

**MIDI канал визначає анімацію:**
| Канал | Анімація |
|---|---|
| 0 | Static |
| 1-5 | One-shot fade (24th, 16th, 8th, quarter, half note) |
| 6-10 | Pulsing (ті ж тривалості) |
| 11-15 | Blinking (ті ж тривалості) |

**Палітра (128 слотів):**
- 0 = Black, 122 = White, 125 = Blue, 126 = Green, 127 = Red
- Повністю кастомізується через SysEx

### Енкодери

| Encoder | Rotation CC | Touch Note |
|---|---|---|
| Tempo | CC 14 | Note 10 |
| Swing | CC 15 | Note 9 |
| Track 1-8 | CC 71-78 | Note 0-7 |
| Master | CC 79 | Note 8 |

Rotation: 1-63 = clockwise, 127-65 = counter-clockwise

### Touch Strip
- Touch/release: Note On/Off на note 12
- Position: Pitch Bend (default) або CC 1 (configurable)
- 31 LED, кожна з 8 рівнями яскравості

### SysEx Protocol

Формат: `F0 00 21 1D 01 01 <CommandID> [args...] F7`

| ID | Команда | Опис |
|---|---|---|
| 0x03 | Set LED Color Palette Entry | R,G,B,W для індексу палітри |
| 0x05 | Reapply Color Palette | Застосувати змінену палітру |
| 0x06 | Set LED Brightness | 0-127 (глобально) |
| 0x08 | Set Display Brightness | 0-255 |
| 0x0A | Set MIDI Mode | 0=Live, 1=User, 2=Dual |
| 0x1E | Set Aftertouch Mode | 0=Channel, 1=Polyphonic |
| 0x20 | Set Pad Velocity Curve | 128-entry lookup table |

**Важливо**: немає прямого RGB per-LED через SysEx — потрібно використовувати 128-слотну палітру.

### Display Protocol (USB Bulk Transfer)
- Роздільність: 960x160 px, 16-bit BGR565
- Frame header: `FF CC AA 88 00 00 00 00 ...` (16 bytes)
- Frame data: 160 lines × 2048 bytes/line = 327,680 bytes
- XOR masking: `E7 F3 E7 FF` (repeating)
- Transfer: 20 × 16,384 byte USB bulk packets
- Endpoint: `0x01` (bulk out)
- **Потребує Node.js з node-usb — WebMIDI не підтримує USB bulk transfer**

### MIDI Modes
- **Live Mode** (0x00): Port 1 — для Ableton Live
- **User Mode** (0x01): Port 2 — для third-party apps (**наш режим**)
- **Dual Mode** (0x02): обидва порти

### Доступні бібліотеки

| Мова | Бібліотека | Можливості |
|---|---|---|
| **Node.js** | `node-ableton-push2` | MIDI: pads, buttons, encoders, LEDs, strip |
| **Node.js** | `ableton-push-canvas-display` | Display через canvas (archived) |
| **Browser** | `abletonpush` (WebMIDI) | Pads, LEDs через WebMIDI |
| **Python** | `push2-python` | Повна підтримка + display + simulator |
| **Rust** | `push2_display` | Display через embedded-graphics trait |
| **Max/MSP** | `push2-midi-controller` | Chromatic/diatonic modes |

### Standalone Use
Push 2 не має standalone mode — завжди потрібен host. Для нашого проєкту:
1. SysEx `0x0A 0x01` — перемкнути в User Mode
2. Node.js hub керує LEDs та display
3. Browser отримує pad/encoder input через WebMIDI

---

## Nektar Aruba

### Огляд
- **16 velocity+pressure RGB LED пади** з auto-калібрацією
- **8 безкінечних ротарних енкодерів**
- **TFT дисплей** 320x240
- **Step sequencer**: 16 songs × 16 patterns × 4 parts × 16 steps
- USB class-compliant (працює з WebMIDI одразу)
- 5-pin DIN MIDI Out
- 1/4" TRS footswitch jack (2 педалі через Y-adapter)

### MIDI Messages

**Пади:**
- Note On/Off (velocity 0-127)
- Channel Aftertouch (assignable)
- Polyphonic Aftertouch (assignable)
- Pitch Bend (assignable to pressure)
- Будь-який CC (assignable to pressure)
- Кожен пад може мати свій MIDI канал (1-16)

**Енкодери:**
- CC (будь-який номер)
- Pitch Bend, Velocity, Program Change, NRPN

### Velocity & Pressure
- **Velocity Bias**: linear → logarithmic → exponential
- Per-pad auto-калібрація + ручне налаштування
- Pressure = окремий continuous параметр (aftertouch, pitch bend, або CC)

### Для delAI
- USB class-compliant → WebMIDI в браузері без драйверів
- 16 пади → drum input для Strudel
- 8 енкодерів → CC control для ефектів (cutoff, reverb, delay...)
- Pressure → expressive control
- Немає SDK — програмування через on-device TFT + Nektarine software

---

## Strudel MIDI Capabilities

### MIDI Output (повна підтримка)

```javascript
note("c a f e").midi()                     // перший доступний MIDI output
note("c a f e").midi('Device Name')        // конкретний пристрій
chord("<C^7 A7 Dm7 G7>").voicing().midi()  // акорди
```

| Можливість | Приклад |
|---|---|
| Notes | `note("c a f e").midi()` |
| CC | `ccv(sine.slow(4)).ccn(74).midi()` |
| Program Change | `progNum("<0 1>").midi()` |
| Pitch Bend | `.midibend(sine.slow(4).range(-0.4, 0.4))` |
| Aftertouch | `.miditouch(sine.slow(4).range(0, 1))` |
| SysEx | `.sysex(0x43, "0x79:0x09:0x11").midi()` |
| Clock | `midicmd("clock*48").midi()` |
| Transport | `midicmd("<start stop>/2").midi()` |

**CC Mappings (midimaps):**
```javascript
midimaps({ mymap: { lpf: { ccn: 74, min: 0, max: 20000, exp: 0.5 } } })
note("c a f e").lpf(sine.slow(4)).midimap('mymap').midi()
```

### MIDI Input (обмежена)

```javascript
let cc = await midin('Device Name')
note("c a f e")
  .lpf(cc(0).range(0, 1000))   // CC 0 → filter cutoff
  .lpq(cc(1).range(0, 10))     // CC 1 → resonance
  .sound("sawtooth")
```

| Можливість | Статус |
|---|---|
| CC input | Підтримується через `midin()` |
| Note input | Експериментальний `midikeys()` (не документований) |
| Clock input (slave) | **Не підтримується** |
| Aftertouch input | **Не підтримується** |
| Pitch bend input | **Не підтримується** |

### Push 2 LED Control через Strudel

Strudel може керувати LEDs Push 2 через `.midi()` output:
```javascript
// Встановити колір паду 36 (Row 7, Col 0) = palette index 126 (green)
note(36).velocity(126/127).midichan(1).midi('Ableton Push 2')
// Канал 1 = static, velocity = color index
```

**SysEx для палітри:**
```javascript
// Strudel підтримує SysEx: sysex: true увімкнений в WebMIDI ініціалізації
.sysex(0x00211D, "0x01:0x01:0x06:0x7F").midi('Ableton Push 2') // brightness 127
```

### WebMIDI Browser Support

| Браузер | Підтримка |
|---|---|
| Chrome 43+ | Повна |
| Edge 79+ | Повна |
| Firefox 108+ | Повна |
| Safari | **Не підтримується** |
| Chrome Android | Підтримується |

- SysEx потребує HTTPS + user permission
- Глобальне покриття: ~79.7%
