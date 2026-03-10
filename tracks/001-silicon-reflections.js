// "Роздуми кремнію" (Silicon Reflections)
// Перша композиція — 2026-03-10
// Задумлива, мінорна, мінімалістична

setcps(0.5)

stack(
  // мелодична лінія — задумлива, мінорна
  note("<[e4 ~ d4 c4] [b3 ~ a3 g3] [a3 ~ b3 c4] [d4 ~ ~ e4]>")
    .s("triangle")
    .lpf(sine.range(600, 3000).slow(8))
    .lpq(5)
    .attack(0.05).decay(0.2).sustain(0.4).release(0.8)
    .room(0.6).roomsize(4)
    .gain(0.7)
    .delay(0.3).delaytime(0.375).delayfeedback(0.4),

  // акорди — повільні, теплі
  chord("<Am C G Em>")
    .voicing()
    .s("sawtooth")
    .lpf(800).lpq(2)
    .attack(0.3).decay(0.5).sustain(0.6).release(1)
    .room(0.5).roomsize(3)
    .gain(0.3),

  // бас — мінімальний
  note("<a2 c3 g2 e2>")
    .s("sine")
    .attack(0.01).decay(0.3).sustain(0.7).release(0.5)
    .gain(0.65),

  // ритмічна текстура — делікатна
  s("hh*8")
    .gain("0.4 0.2 0.3 0.2 0.4 0.2 0.35 0.2")
    .pan(sine.range(0.3, 0.7).fast(2))
    .lpf(perlin.range(3000, 8000))
    .room(0.3),

  // перкусія
  s("bd ~ [~ bd] ~, ~ sd ~ sd")
    .gain(0.5)
    .room(0.2)
)
