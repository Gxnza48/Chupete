let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.25, delay = 0) {
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + delay);
  gain.gain.setValueAtTime(vol, c.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + dur);
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + dur + 0.01);
}

function sweep(from: number, to: number, dur: number, type: OscillatorType = "sine", vol = 0.25) {
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(from, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(to, c.currentTime + dur);
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + dur + 0.01);
}

export function playClick() {
  tone(900, 0.04, "square", 0.12);
}

export function playCaseOpenSpin() {
  sweep(180, 900, 0.45, "sine", 0.2);
}

export function playCaseResult(rarity: string) {
  const chords: Record<string, { freqs: number[]; vol: number; dur: number }> = {
    comun:          { freqs: [400],                   vol: 0.15, dur: 0.3 },
    poco_comun:     { freqs: [500, 630],              vol: 0.18, dur: 0.4 },
    medio_raro:     { freqs: [550, 700, 880],         vol: 0.2,  dur: 0.5 },
    raro:           { freqs: [600, 750, 940],         vol: 0.22, dur: 0.6 },
    ultra_raro:     { freqs: [700, 880, 1100, 1320],  vol: 0.25, dur: 0.7 },
    legendario:     { freqs: [800, 1000, 1260, 1600], vol: 0.28, dur: 0.9 },
    extraterrestre: { freqs: [900, 1150, 1400, 1800], vol: 0.28, dur: 1.0 },
    en_el_ort:      { freqs: [1000,1250,1600,2000,2400], vol: 0.3, dur: 1.2 },
  };
  const c = chords[rarity] ?? chords.comun;
  c.freqs.forEach((f, i) => tone(f, c.dur, "sine", c.vol / c.freqs.length, i * 0.07));
}

export function playUpgradeWin() {
  sweep(400, 1600, 0.15, "sine", 0.2);
  tone(1200, 0.7, "sine", 0.25, 0.18);
  tone(1500, 0.7, "sine", 0.2,  0.28);
  tone(1800, 0.6, "sine", 0.15, 0.38);
}

export function playUpgradeLose() {
  sweep(400, 100, 0.5, "sine", 0.2);
}

export function playUpgradeSpin() {
  sweep(200, 1000, 0.3, "sine", 0.15);
}

// Progressive spin tick — starts fast, slows down over `durationMs`.
// Returns a stop function.
export function startSpinTick(durationMs: number): () => void {
  let stopped = false;
  let interval = 55; // ms — starts fast
  const maxInterval = 600; // ms — ends slow
  const startTime = Date.now();

  function tick() {
    if (stopped || Date.now() - startTime > durationMs + 500) return;
    const c = ac();
    if (c) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g);
      g.connect(c.destination);
      o.type = "triangle";
      o.frequency.setValueAtTime(180 + Math.random() * 40, c.currentTime);
      g.gain.setValueAtTime(0.12, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.035);
      o.start(c.currentTime);
      o.stop(c.currentTime + 0.04);
    }
    interval = Math.min(maxInterval, interval * 1.075);
    setTimeout(tick, interval);
  }

  tick();
  return () => { stopped = true; };
}

export function playCraftSuccess() {
  playUpgradeWin();
}

export function playCraftFail() {
  tone(300, 0.4, "sine", 0.18);
  tone(200, 0.4, "sine", 0.12, 0.15);
}
