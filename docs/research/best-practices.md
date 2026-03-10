# Best Practices: AI + Live Coding Music

Інсайти зібрані з аналізу існуючих проєктів, статей та документації.

---

## Головні проблеми AI-генерації Strudel-коду

| Проблема | Опис | Рішення |
|---|---|---|
| **Галюцинації функцій** | AI вигадує методи, яких немає в API | Whitelist + explicit ban list у промпті |
| **Галюцинації семплів** | AI генерує імена файлів, яких немає | Каталог валідних звуків у контексті |
| **Зламаний синтаксис** | Вирази не парсяться | Post-processing, fallback стратегії |
| **Стіна шуму** | Занадто багато шарів, немає тональної когерентності | "Groove first" правило в промпті |
| **Статичні патерни** | Механічна повторюваність без варіацій | Інструкції на `.every()`, `.sometimes()`, LFO |
| **Глобальний стан** | `.play()`, `setcps()`, `const/let/var` ламають REPL | Hard rules: "NEVER call .play()" |

---

## 3-рівнева структура промпту (Nicholas Griffin)

### Рівень 1 — Identity & Constraints
> "You are an expert Strudel live-coding assistant and performing musician."
- Output = single self-contained expression
- Patterns = time-based functions in "cycles"

### Рівень 2 — Musical Priorities
- **Groove first**: ритм має бути інтенціональним і грайливим
- **Tonality**: обери key/scale і тримайся
- **Clarity**: кілька сильних ідей > стіна шуму
- **Gentle variation**: time-based modulation для життя

### Рівень 3 — Hard Rules (guardrails)
- Output ТІЛЬКИ Strudel код, без markdown чи прози
- ТІЛЬКИ документовані API функції
- НІКОЛИ `.play()` або `setcps()`/`setCps()`
- НІКОЛИ helper functions, globals, `const`/`let`/`var`
- Inline коментарі для кожного шару

---

## Anchor Framework (strudel-llm-docs)

Системна методологія композиції, що грає на сильних сторонах LLM:

1. **Крок 0**: Стек з 4 інструментів. Інструменти 1-2: 4 кроки (акордова прогресія). Інструменти 3-4: 12 кроків з "якірними" нотами на позиціях 1,4,7,10
2. **Крок 1**: Замінити piano на різні тембри
3. **Крок 2**: Заповнити мелодії для 12-крокових інструментів, зберігаючи якірну гармонію
4. **Крок 3**: Додати синкопацію (5 базових трансформацій):
   ```
   note → [~ note]        (delayed entry)
   note → [note ~]        (early cutoff)
   note → [note@2 ~]      (half duration + rest)
   note → [~ note@2]      (rest + half duration)
   note → [~ ~ note]      (late entry)
   ```
5. **Крок 4**: Розвити контр-мелодію в інструменті 4
6. **Крок 5**: Синкопація для фундаментальних інструментів 1-2
7. **Крок 6**: Ефекти (reverb, distortion)
8. **Крок 7**: Drum patterns

**Ключова ідея**: обмежений словник модифікацій замість "будь креативним".

---

## Інкрементальна генерація (Skywork)

Ніколи не генерувати все за один промпт:

1. "Initialize Strudel and create a techno beat at 130 BPM"
2. "Add a funky, off-beat bassline"
3. "Make the hi-hats more complex, 16th-note pattern with swing"
4. "Let's hear this in D minor"

Кожен крок — окремий промпт → оцінка → рефайнмент.

---

## Архітектурні патерни

### Pattern 1: Prompt → Code Sandbox
```
User Input → Parameterized Prompt → LLM → Strudel Code → evaluate()
```
Найлегший. Потребує ретельного prompt engineering.

### Pattern 2: MCP → Browser Automation
```
Claude ↔ MCP ↔ Strudel MCP Server ↔ Playwright ↔ strudel.cc
                                    ↘ Web Audio API (analysis feedback)
```
Найважчий, але найнадійніший. 100% API compatibility.

### Pattern 3: Human-in-the-Loop
```
Human prompt → Claude → Strudel code → Human tweaks → Hardware FX → Recording
```
Найпростіший. AI = стартова точка, людина = editor/performer.

### Pattern 4: MCP → WebSocket → Custom Player (наш підхід)
```
Claude Code ↔ MCP (stdio) ↔ Hub Server ↔ WebSocket ↔ Browser Player
                                        ↔ Push 2 (MIDI/USB)
                                        ↔ MIDI devices
```
Оптимальний баланс: надійність + легкість + контроль.

---

## Context Management для LLM

Техніка з strudel-llm-docs:

1. **INDEX** — список 407 функцій з посиланнями на файли
2. **QUICK_LOOKUP** (~40KB) — однорядковий опис кожної функції
3. **Split reference** (A-C, D-F, G-J, K-O, P-R, S-Z) — повна документація по частинах

LLM ніколи не завантажує всі ~120KB. Алгоритм:
1. Перевірити QUICK_LOOKUP
2. Знайти потрібну функцію в INDEX
3. Завантажити тільки релевантний файл

**Для delAI**: адаптувати цю структуру в CLAUDE.md проєкту.

---

## Sound Selection

Відома слабкість: LLM не знає як звучать семпли.

**Рішення:**
- Curated каталоги з тональними описами ("warm", "bright", "dark")
- Genre→sound mapping (techno → `bd:4`, `sd:1`, `hh:2`)
- Whitelist перевірених звуків
- "MIDI learn" mode для фізичних контролерів

---

## Ключові Strudel функції для AI-генерації

Найчастіше використовувані в успішних проєктах:

```javascript
// Структура
stack()                    // вертикальне поєднання
"<a b c>"                  // чергування по циклах
"[a b]"                    // підрозділ

// Варіативність
.firstOf(4, x => x.rev()) // кожен 4-й цикл
.sometimes(x => x.speed(2))
.chunk(4, x => x.add(7))

// Модуляція
.lpf(sine.range(200, 4000).slow(4))
.pan(sine.range(0.3, 0.7).fast(2))

// Звучання
.room(0.5).roomsize(3)    // reverb
.delay(0.3).delaytime(0.375).delayfeedback(0.4)

// Ритм
.euclid(3, 8)             // евклідовий ритм
.swing(4)                  // shuffle
```
