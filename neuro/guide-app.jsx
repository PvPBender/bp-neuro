/* guide-app.jsx — the shell: difficulty-ladder rail + one station on stage +
   Next/Prev + settings. NOT infinite scroll — one focused station at a time,
   jump freely via the ladder. */

const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp } = React;

const LS = {
  get(k, d) { try { const v = localStorage.getItem("guide." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("guide." + k, JSON.stringify(v)); } catch (e) {} }
};

function GuideApp() {
  const {
    guidePalette, ACCENTS, Kicker, Chip, Plate, Panel, Readout, DoThis, WhyBox,
    RevealPrompt, GoFurther, TeacherNote, PhaseLab, WCPlot, AccumPlot,
    MembraneDiagram, VoltageCurve, MathTeX, Slider, GUIDE
  } = window;

  const [dark, setDark] = useStateApp(LS.get("dark", false));
  const [accentKey, setAccentKey] = useStateApp(LS.get("accent", "violet"));
  const [density, setDensity] = useStateApp(LS.get("density", "air"));
  const [teacher, setTeacher] = useStateApp(LS.get("teacher", false));
  const [idx, setIdx] = useStateApp(LS.get("idx", 0));
  const [seen, setSeen] = useStateApp(LS.get("seen", [0]));
  const [settingsOpen, setSettingsOpen] = useStateApp(false);

  const accent = dark ? ACCENTS[accentKey + "D"] : ACCENTS[accentKey];
  const c = guidePalette(dark, accent);
  const stations = GUIDE.stations;
  const total = stations.length;           // 8
  const OUTRO = total + 1;                  // coverage-map capstone
  const isIntro = idx === 0;
  const isOutro = idx === OUTRO;
  const station = (isIntro || isOutro) ? null : stations[idx - 1];
  const stageRef = useRefApp(null);

  useEffectApp(() => { LS.set("dark", dark); }, [dark]);
  useEffectApp(() => { LS.set("accent", accentKey); }, [accentKey]);
  useEffectApp(() => { LS.set("density", density); }, [density]);
  useEffectApp(() => { LS.set("teacher", teacher); }, [teacher]);
  useEffectApp(() => { LS.set("idx", idx); LS.set("seen", seen); }, [idx, seen]);

  const go = n => {
    const next = Math.max(0, Math.min(OUTRO, n));
    setIdx(next);
    setSeen(s => s.includes(next) ? s : [...s, next]);
    if (stageRef.current) stageRef.current.scrollTop = 0;
  };

  // keyboard nav
  useEffectApp(() => {
    const h = e => {
      const t = e.target.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || t === "BUTTON") return;
      if (e.key === "ArrowRight") go(idx + 1);
      if (e.key === "ArrowLeft") go(idx - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [idx]);

  const COL = density === "compact" ? 720 : 820;
  const fontScale = density === "compact" ? 0.96 : 1;

  const rootStyle = {
    "--ui": "'Hanken Grotesk', system-ui, sans-serif",
    "--serif": "'Newsreader', Georgia, serif",
    "--mono": "'JetBrains Mono', ui-monospace, monospace",
    "--accent": c.accent, "--accent2": c.accent2, "--curve": c.curve, "--sub": c.sub,
    fontFamily: "var(--serif)", background: c.page, color: c.ink,
    height: "100vh", display: "grid", gridTemplateColumns: "272px 1fr", overflow: "hidden",
    fontSize: (16 * fontScale) + "px"
  };

  /* ── ladder rail ─────────────────────────────────────────────── */
  const rungs = [{ n: "00", rung: "Intro", concept: "Why a derivative?", short: "From ions to the derivative" },
    ...stations.map(s => ({ n: s.n, rung: s.rung, concept: s.concept, short: s.title })),
    { n: "★", rung: "Recap", concept: "Coverage map", short: "The eight concepts" }];

  const Rail = (
    <aside style={{ background: c.rail, borderRight: `1px solid ${c.rule}`, display: "flex",
      flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "22px 22px 16px", borderBottom: `1px solid ${c.rule}` }}>
        <div style={{ font: "700 11px/1 var(--ui)", letterSpacing: "0.14em", textTransform: "uppercase",
          color: c.accent, marginBottom: 9 }}>Chapter 2</div>
        <div style={{ font: "600 21px/1.18 var(--serif)", color: c.ink, letterSpacing: "-0.01em" }}>{GUIDE.title}</div>
        <div style={{ font: "400 12.5px/1.4 var(--ui)", color: c.sub, marginTop: 6 }}>{GUIDE.subtitle}</div>
      </div>
      <nav style={{ flex: 1, overflowY: "auto", padding: "16px 14px 18px" }}>
        <div style={{ font: "700 10px/1 var(--ui)", letterSpacing: "0.12em", textTransform: "uppercase",
          color: c.faint, padding: "0 8px 10px" }}>Difficulty ladder</div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 21, top: 14, bottom: 14, width: 2, background: c.rule }} />
          {rungs.map((r, i) => {
            const active = i === idx, visited = seen.includes(i) && !active;
            return (
              <button key={i} onClick={() => go(i)} style={{ position: "relative", display: "flex",
                gap: 12, alignItems: "flex-start", width: "100%", textAlign: "left", cursor: "pointer",
                background: active ? `color-mix(in srgb, ${c.accent} 12%, transparent)` : "transparent",
                border: "none", borderRadius: 9, padding: "9px 10px", marginBottom: 2, transition: "background .14s" }}>
                <span style={{ flex: "0 0 auto", width: 20, height: 20, borderRadius: 50, marginTop: 1,
                  display: "grid", placeItems: "center", zIndex: 1,
                  background: active ? c.accent : (visited ? c.bg : c.rail),
                  border: `2px solid ${active ? c.accent : (visited ? c.accent : c.ruleStrong)}`,
                  color: active ? c.tabInk : c.accent, font: "700 10px/1 var(--ui)" }}>
                  {visited ? "✓" : (i === 0 ? "·" : r.n.replace(/^0/, ""))}
                </span>
                <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ font: `${active ? 600 : 500} 13.5px/1.28 var(--serif)`,
                    color: active ? c.ink : (visited ? c.ink : c.sub) }}>{r.short}</span>
                  <span style={{ font: "600 10px/1.2 var(--ui)", letterSpacing: "0.06em",
                    textTransform: "uppercase", color: active ? c.accent : c.faint }}>{r.concept}</span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${c.rule}`, display: "flex",
        alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ font: "500 11.5px/1 var(--ui)", color: c.faint }}>{Math.min(seen.length, OUTRO + 1)} / {OUTRO + 1} visited</span>
        <button onClick={() => setSettingsOpen(o => !o)} aria-label="Settings" style={{ cursor: "pointer",
          width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center",
          background: settingsOpen ? c.panel : "transparent", border: `1px solid ${c.rule}`, color: c.sub }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8a1.65 1.65 0 0 0 1.51 1H22a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </aside>
  );

  /* ── settings popover ────────────────────────────────────────── */
  const Seg = ({ opts, val, on }) => (
    <div style={{ display: "flex", background: c.page, border: `1px solid ${c.rule}`, borderRadius: 8, padding: 3 }}>
      {opts.map(([v, lbl]) => (
        <button key={v} onClick={() => on(v)} style={{ flex: 1, cursor: "pointer", border: "none",
          font: "600 12px/1 var(--ui)", padding: "7px 10px", borderRadius: 6,
          background: val === v ? c.accent : "transparent", color: val === v ? c.tabInk : c.sub }}>{lbl}</button>
      ))}
    </div>
  );
  const Settings = settingsOpen && (
    <div style={{ position: "absolute", left: 16, bottom: 56, width: 240, zIndex: 50,
      background: c.bg, border: `1px solid ${c.ruleStrong}`, borderRadius: 12,
      boxShadow: "0 18px 50px -16px rgba(0,0,0,.4)", padding: 16 }}>
      <Row3 c={c} label="Theme"><Seg opts={[["light", "Light"], ["dark", "Dark"]]} val={dark ? "dark" : "light"} on={v => setDark(v === "dark")} /></Row3>
      <Row3 c={c} label="Accent">
        <div style={{ display: "flex", gap: 8 }}>
          {[["violet", "Violet"], ["teal", "Teal"], ["rust", "Rust"]].map(([k]) => (
            <button key={k} onClick={() => setAccentKey(k)} aria-label={k} style={{ width: 30, height: 30,
              borderRadius: 50, cursor: "pointer", background: ACCENTS[k],
              border: accentKey === k ? `3px solid ${c.ink}` : `2px solid ${c.rule}` }} />
          ))}
        </div>
      </Row3>
      <Row3 c={c} label="Density"><Seg opts={[["air", "Airy"], ["compact", "Compact"]]} val={density} on={setDensity} /></Row3>
      <Row3 c={c} label="Teacher notes"><Seg opts={[[false, "Hidden"], [true, "Shown"]]} val={teacher} on={setTeacher} /></Row3>
    </div>
  );

  /* ── intro / onramp ──────────────────────────────────────────── */
  const Intro = () => {
    const [perm, setPerm] = useStateApp(45);
    return (
      <div style={{ maxWidth: COL, margin: "0 auto" }}>
        <Kicker c={c}>{GUIDE.onramp.concept} · Chapter 2</Kicker>
        <h1 style={{ font: "600 40px/1.14 var(--serif)", color: c.ink, margin: "16px 0 18px",
          letterSpacing: "-0.02em", textWrap: "pretty", maxWidth: 620 }}>{GUIDE.onramp.title}</h1>
        <p style={{ font: "400 19px/1.55 var(--serif)", color: c.sub, margin: "0 0 38px", maxWidth: 640, textWrap: "pretty" }}>{GUIDE.onramp.dek}</p>

        <Plate c={c} label="Fig. 1 · Membrane" note="Move the channel permeability and watch ions cross the membrane.">
          <div style={{ background: c.stageBg, borderRadius: 4 }}>
            <MembraneDiagram c={c} perm={perm} labeled={true} idPrefix="intro" h={300} />
          </div>
          <div style={{ maxWidth: 320, margin: "12px auto 2px", padding: "12px 16px", background: c.panel,
            border: `1px solid ${c.rule}`, borderRadius: 8 }}>
            <Slider value={perm} onChange={setPerm} accent={c.accent} label="Channel permeability" valueText={perm + " %"} />
          </div>
        </Plate>

        <p style={{ font: "400 18px/1.62 var(--serif)", color: c.ink, margin: "30px 0", textWrap: "pretty" }}>
          But the channels number in the thousands at once. Tracking each ion separately is hopeless — we need
          <em> a single number</em> that sums up the whole commotion. That number is the voltage over time, and its
          <strong style={{ color: c.accent }}> rate of change</strong>.
        </p>

        <Plate c={c} label="Fig. 2 · Voltage over time" note="Drag the point along the curve and read the instantaneous slope dV/dt — the speed at which the voltage is changing right now.">
          <div style={{ background: c.stageBg, borderRadius: 4, padding: "6px 8px" }}>
            <VoltageCurve c={c} />
          </div>
        </Plate>

        <div style={{ marginTop: 34, padding: "22px 24px", background: c.panel, border: `1px solid ${c.rule}`,
          borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ font: "600 18px/1.3 var(--serif)", color: c.ink }}>From this one curve we'll build the whole of calculus.</div>
            <div style={{ font: "400 14px/1.4 var(--ui)", color: c.sub, marginTop: 5 }}>Eight stations, eight concepts — each bound to one thing you steer yourself.</div>
          </div>
          <button onClick={() => go(1)} style={{ cursor: "pointer", font: "600 15px/1 var(--ui)",
            color: c.tabInk, background: c.accent, border: "none", borderRadius: 100, padding: "14px 24px", whiteSpace: "nowrap" }}>
            Start · Station 01 →
          </button>
        </div>
      </div>
    );
  };

  /* ── station ─────────────────────────────────────────────────── */
  const lab = station && (
    station.lab.kind === "phase" ? <PhaseLab c={c} mode={dark ? "dark" : "light"} cfg={station.lab.cfg} />
    : station.lab.kind === "wc" ? <WCPlot c={c} />
    : <AccumPlot c={c} />
  );

  const Station = station && (
    <div style={{ maxWidth: COL, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Chip c={c}>Station {station.n}</Chip>
        <Chip c={c} tone="concept">{station.concept}</Chip>
      </div>
      <h1 style={{ font: "600 36px/1.16 var(--serif)", color: c.ink, margin: "0 0 24px",
        letterSpacing: "-0.02em", textWrap: "pretty", maxWidth: 640 }}>{station.title}</h1>
      <DoThis c={c}>{station.doThis}</DoThis>
      <Plate c={c} label="Live simulation" note={station.caption}>{lab}</Plate>
      <WhyBox c={c} concept={station.why.concept}>{station.why.text}</WhyBox>
      <RevealPrompt c={c} q={station.prompt.q} a={station.prompt.a} />
      <GoFurther c={c}>{station.goFurther}</GoFurther>
      <TeacherNote c={c} show={teacher} objective={station.teacher.objective}
        misconception={station.teacher.misconception} check={station.teacher.check} />
    </div>
  );

  /* ── outro: coverage map (blueprint §6.4) ────────────────────── */
  const COVER = [
    ["01", "Derivative — rate / arrow", "FitzHugh–Nagumo"],
    ["02", "Differential equation", "FitzHugh–Nagumo"],
    ["03", "Numerical integration (Euler)", "FitzHugh–Nagumo"],
    ["04", "Equilibrium · nullcline", "FitzHugh–Nagumo"],
    ["05", "Phase portrait · trajectory", "FitzHugh–Nagumo"],
    ["06", "Bifurcation", "FitzHugh–Nagumo"],
    ["07", "System of equations", "Wilson–Cowan"],
    ["08", "Definite integral", "Wong–Wang"]
  ];
  const Outro = () => (
    <div style={{ maxWidth: COL, margin: "0 auto" }}>
      <Kicker c={c}>Recap · the difficulty ladder</Kicker>
      <h1 style={{ font: "600 38px/1.14 var(--serif)", color: c.ink, margin: "16px 0 18px",
        letterSpacing: "-0.02em", textWrap: "pretty", maxWidth: 640 }}>Eight concepts, eight stations, one rising model</h1>
      <p style={{ font: "400 18px/1.55 var(--serif)", color: c.sub, margin: "0 0 32px", maxWidth: 640, textWrap: "pretty" }}>
        Each concept was touched exactly once, in dependency order — a concept only appears after you've
        watched it behave on screen. Coverage is total, with no gaps and no duplicates.
      </p>
      <Plate c={c} label="Coverage map" note="Rising model complexity is itself the ordering axis: concepts 1–6 live in FitzHugh–Nagumo, the system in Wilson–Cowan, the integral in Wong–Wang.">
        <div style={{ display: "grid", gridTemplateColumns: "58px 1fr 168px", rowGap: 0,
          font: "var(--ui)" }}>
          <div style={hd(c)}>Station</div><div style={hd(c)}>Calculus concept</div><div style={hd(c)}>Model</div>
          {COVER.map(([n, concept, model], i) => (
            <React.Fragment key={n}>
              <button onClick={() => go(i + 1)} style={{ ...cell(c, i), cursor: "pointer", textAlign: "left",
                background: "transparent", font: "700 14px/1.4 var(--mono)", color: c.accent }}>{n}</button>
              <button onClick={() => go(i + 1)} style={{ ...cell(c, i), cursor: "pointer", textAlign: "left",
                background: "transparent", font: "500 15px/1.4 var(--serif)", color: c.ink }}>{concept}</button>
              <div style={{ ...cell(c, i), font: "500 13px/1.4 var(--ui)", color: c.sub }}>{model}</div>
            </React.Fragment>
          ))}
        </div>
      </Plate>
      <div style={{ marginTop: 30, padding: "22px 24px", background: c.panel, border: `1px solid ${c.rule}`,
        borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ font: "600 18px/1.3 var(--serif)", color: c.ink }}>Same math, everywhere it matters.</div>
          <div style={{ font: "400 14px/1.4 var(--ui)", color: c.sub, marginTop: 5 }}>One two-variable neuron carried a derivative, an ODE, an integral, a system and a bifurcation.</div>
        </div>
        <button onClick={() => go(0)} style={{ cursor: "pointer", font: "600 15px/1 var(--ui)",
          color: c.ink, background: "transparent", border: `1px solid ${c.ruleStrong}`, borderRadius: 100, padding: "13px 22px", whiteSpace: "nowrap" }}>
          ↺ Start over
        </button>
      </div>
    </div>
  );

  /* ── bottom nav ──────────────────────────────────────────────── */
  const Nav = (
    <div style={{ borderTop: `1px solid ${c.rule}`, background: c.page, padding: "14px 40px",
      display: "flex", alignItems: "center", justifyContent: "space-between", flex: "0 0 auto" }}>
      <button disabled={idx === 0} onClick={() => go(idx - 1)} style={{ cursor: idx === 0 ? "default" : "pointer",
        opacity: idx === 0 ? 0.35 : 1, font: "600 14px/1 var(--ui)", color: c.ink, background: "transparent",
        border: `1px solid ${c.ruleStrong}`, borderRadius: 100, padding: "11px 18px" }}>← Back</button>
      <div style={{ display: "flex", gap: 6 }}>
        {rungs.map((_, i) => (
          <button key={i} onClick={() => go(i)} aria-label={"Step " + i} style={{ width: i === idx ? 22 : 8, height: 8,
            borderRadius: 100, cursor: "pointer", border: "none", transition: "all .18s",
            background: i === idx ? c.accent : (seen.includes(i) ? c.ruleStrong : c.rule) }} />
        ))}
      </div>
      <button disabled={idx === OUTRO} onClick={() => go(idx + 1)} style={{ cursor: idx === OUTRO ? "default" : "pointer",
        opacity: idx === OUTRO ? 0.35 : 1, font: "600 14px/1 var(--ui)", color: c.tabInk, background: c.accent,
        border: "none", borderRadius: 100, padding: "11px 20px" }}>
        {idx === OUTRO ? "Done ✓" : idx === total ? "Recap →" : "Next →"}
      </button>
    </div>
  );

  return (
    <div style={rootStyle}>
      <div style={{ position: "relative" }}>{Rail}{Settings}</div>
      <main style={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <div ref={stageRef} style={{ flex: 1, overflowY: "auto", padding: "48px 40px 60px" }}>
          {isIntro ? <Intro /> : isOutro ? <Outro /> : Station}
        </div>
        {Nav}
      </main>
    </div>
  );
}

function hd(c) {
  return { font: "700 10.5px/1 var(--ui)", letterSpacing: "0.1em", textTransform: "uppercase",
    color: c.faint, padding: "0 0 12px", borderBottom: `1.5px solid ${c.ruleStrong}`, marginBottom: 2 };
}
function cell(c, i) {
  return { padding: "13px 0", alignSelf: "stretch", display: "flex", alignItems: "center",
    border: "none", borderBottom: `1px solid ${c.rule}` };
}

function Row3({ c, label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ font: "600 11px/1 var(--ui)", letterSpacing: "0.06em", textTransform: "uppercase",
        color: c.faint, marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

window.GuideApp = GuideApp;
