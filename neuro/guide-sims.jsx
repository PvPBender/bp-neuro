/* guide-sims.jsx — live instruments for the walkthrough.
   PhaseLab  : FHN phase plane (vector field · nullclines · draggable state ·
               Euler trajectory · bifurcation regime). Powers stations 1–6.
   WCPlot    : Wilson–Cowan coupled populations E(t), I(t).  Station 7.
   AccumPlot : evidence accumulation as a definite integral.  Station 8.
   Self-contained instruments: stage + param panel + mono readouts inside. */

const { useState: useStateSim, useRef: useRefSim, useEffect: useEffectSim, useMemo: useMemoSim } = React;

/* ── FHN numerics ──────────────────────────────────────────────────── */
const FHN = { a: 0.7, b: 0.8, tau: 12.5 };
function fhnRHS(v, w, I) {
  return [v - (v * v * v) / 3 - w + I, (v + FHN.a - FHN.b * w) / FHN.tau];
}
function fhnIntegrate(v0, w0, I, dt, n) {
  let v = v0, w = w0; const pts = [[v, w]];
  for (let i = 0; i < n; i++) {
    const [dv, dw] = fhnRHS(v, w, I);
    v += dv * dt; w += dw * dt; pts.push([v, w]);
  }
  return pts;
}
function fhnRegime(I) { // amplitude of v over a long run from rest-ish start
  const pts = fhnIntegrate(-1.2, -0.6, I, 0.05, 2400);
  let mn = 9, mx = -9;
  for (let i = 1200; i < pts.length; i++) { mn = Math.min(mn, pts[i][0]); mx = Math.max(mx, pts[i][0]); }
  return (mx - mn) > 1.4 ? "firing" : "rest";
}

const { Panel: PanelS, Readout: ReadoutS, Slider: SliderS, MathTeX: MathTeXS } = window;

/* ── PhaseLab ──────────────────────────────────────────────────────── */
function PhaseLab({ c, mode, cfg }) {
  const show = cfg.show || {};
  const ctrls = cfg.controls || [];
  const [I, setI] = useStateSim(cfg.Idefault != null ? cfg.Idefault : 0.5);
  const [dt, setDt] = useStateSim(cfg.stepDefault != null ? cfg.stepDefault : 0.25);
  const [pt, setPt] = useStateSim(cfg.point || { v: 0.4, w: -0.1 });
  const dotRef = useRefSim(null);
  const svgRef = useRefSim(null);

  const W = 560, H = 380, m = { l: 40, r: 16, t: 16, b: 34 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const vMin = -2.5, vMax = 2.5, wMin = -1.1, wMax = 2.3;
  const X = v => m.l + (v - vMin) / (vMax - vMin) * pw;
  const Y = w => m.t + (wMax - w) / (wMax - wMin) * ph;
  const invX = px => vMin + (px - m.l) / pw * (vMax - vMin);
  const invY = py => wMax - (py - m.t) / ph * (wMax - wMin);

  /* vector field */
  const field = useMemoSim(() => {
    if (!show.field) return [];
    const out = []; const nx = 13, ny = 9;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const v = vMin + (i + 0.5) / nx * (vMax - vMin);
      const w = wMin + (j + 0.5) / ny * (wMax - wMin);
      const [dv, dw] = fhnRHS(v, w, I);
      const mag = Math.hypot(dv, dw) || 1e-6;
      out.push({ v, w, dv, dw, mag });
    }
    return out;
  }, [show.field, I]);
  const maxMag = useMemoSim(() => field.reduce((a, f) => Math.max(a, f.mag), 1e-6), [field]);

  /* nullclines */
  const vNull = useMemoSim(() => {
    let d = ""; for (let i = 0; i <= 120; i++) { const v = vMin + i / 120 * (vMax - vMin); d += (i ? "L" : "M") + X(v).toFixed(1) + " " + Y(v - v * v * v / 3 + I).toFixed(1) + " "; }
    return d;
  }, [I]);
  const wNull = `M ${X(vMin)} ${Y((vMin + FHN.a) / FHN.b)} L ${X(vMax)} ${Y((vMax + FHN.a) / FHN.b)}`;

  /* trajectory (Euler) + a fine reference */
  const traj = useMemoSim(() => {
    if (!show.trajectory) return null;
    const start = cfg.trajStart || { v: -1.3, w: -0.5 };
    const useDt = show.eulerCompare ? dt : 0.06;          // crisp curve unless we're demoing Euler error
    const span = show.eulerCompare ? 20 : 95;             // shorter window for the Euler demo so hops are countable
    const coarse = fhnIntegrate(start.v, start.w, I, useDt, Math.round(span / useDt));
    const fine = show.eulerCompare ? fhnIntegrate(start.v, start.w, I, 0.04, 1750) : null;
    return { coarse, fine };
  }, [show.trajectory, show.eulerCompare, I, dt, cfg.trajStart]);

  const pathOf = pts => pts.map((p, i) => (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1)).join(" ");

  /* animated dot along trajectory */
  useEffectSim(() => {
    if (!show.animate || !traj) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const pts = (traj.fine || traj.coarse); let k = 0, raf;
    const tick = () => {
      k = (k + 2) % pts.length; const p = pts[k];
      if (dotRef.current) { dotRef.current.setAttribute("cx", X(p[0]).toFixed(1)); dotRef.current.setAttribute("cy", Y(p[1]).toFixed(1)); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show.animate, traj, I, dt]);

  /* drag the state point */
  const onDrag = e => {
    e.preventDefault();
    const move = ev => {
      const r = svgRef.current.getBoundingClientRect();
      const cx = (ev.touches ? ev.touches[0] : ev).clientX, cy = (ev.touches ? ev.touches[0] : ev).clientY;
      const px = (cx - r.left) / r.width * W, py = (cy - r.top) / r.height * H;
      setPt({ v: Math.max(vMin, Math.min(vMax, invX(px))), w: Math.max(wMin, Math.min(wMax, invY(py))) });
    };
    move(e);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };

  const [dv, dw] = fhnRHS(pt.v, pt.w, I);
  const arrowK = 46;
  const regime = show.regime ? fhnRegime(I) : null;

  const stage = (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", touchAction: "none", borderRadius: 4 }}>
      <rect x={m.l} y={m.t} width={pw} height={ph} fill="none" />
      {/* axes */}
      <line x1={m.l} y1={Y(0)} x2={W - m.r} y2={Y(0)} stroke={c.grid} strokeWidth="1" />
      <line x1={X(0)} y1={m.t} x2={X(0)} y2={H - m.b} stroke={c.grid} strokeWidth="1" />
      <text x={W - m.r} y={Y(0) - 7} textAnchor="end" fontStyle="italic" fontSize="13" fill={c.sub} fontFamily="var(--mono)">v</text>
      <text x={X(0) + 8} y={m.t + 12} fontStyle="italic" fontSize="13" fill={c.sub} fontFamily="var(--mono)">w</text>

      {/* vector field */}
      {field.map((f, i) => {
        const s = (Math.min(f.mag / maxMag, 1)) ;
        const len = 9 + s * 13;
        const ux = f.dv / f.mag, uy = f.dw / f.mag;
        const x1 = X(f.v) - ux * len / 2, y1 = Y(f.w) + uy * len / 2;
        const x2 = X(f.v) + ux * len / 2, y2 = Y(f.w) - uy * len / 2;
        const col = `color-mix(in srgb, ${c.accent} ${Math.round(30 + s * 60)}%, ${c.faint})`;
        return <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth="1.5" />
          <circle cx={x2} cy={y2} r="1.9" fill={col} />
        </g>;
      })}

      {/* trajectory */}
      {traj && traj.fine && <path d={pathOf(traj.fine)} fill="none" stroke={c.sub} strokeWidth="1.3" opacity="0.4" />}
      {traj && <path d={pathOf(traj.coarse)} fill="none" stroke={c.curve} strokeWidth="2.2"
        strokeLinejoin="round" strokeDasharray={show.eulerCompare ? "0" : "0"} />}
      {traj && show.eulerCompare && traj.coarse.length <= 130 && traj.coarse.map((p, i) =>
        <circle key={"e" + i} cx={X(p[0])} cy={Y(p[1])} r="2.4" fill={c.bg} stroke={c.curve} strokeWidth="1.6" />)}
      {traj && show.animate && <circle ref={dotRef} cx={X(traj.coarse[0][0])} cy={Y(traj.coarse[0][1])} r="5.5" fill={c.accent2} />}

      {/* nullclines */}
      {show.nullclines && <g>
        <path d={vNull} fill="none" stroke={c.accent} strokeWidth="2.6" />
        <path d={wNull} fill="none" stroke={c.accent2} strokeWidth="2.2" strokeDasharray="6 4" />
      </g>}

      {/* draggable state point + arrow */}
      {show.point && <g>
        <line x1={X(pt.v)} y1={Y(pt.w)} x2={X(pt.v) + dv * arrowK} y2={Y(pt.w) - dw * arrowK * (pw / ph) * ((wMax - wMin) / (vMax - vMin))}
          stroke={c.accent2} strokeWidth="2.6" markerEnd={`url(#ah-${mode})`} />
        <circle cx={X(pt.v)} cy={Y(pt.w)} r="8" fill={c.bg} stroke={c.accent2} strokeWidth="3"
          style={{ cursor: "grab" }} onPointerDown={onDrag} />
      </g>}
      <defs>
        <marker id={`ah-${mode}`} markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" fill={c.accent2} />
        </marker>
      </defs>
    </svg>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 196px", gap: 14, alignItems: "stretch" }}>
      <div style={{ background: c.stageBg, border: `1px solid ${c.rule}`, borderRadius: 6, padding: 8 }}>{stage}</div>
      <PanelS c={c} title="Parameters">
        {ctrls.includes("I") && <div style={{ marginBottom: 14 }}>
          <SliderS value={Math.round(I * 100)} min={-30} max={150} accent={c.accent}
            label="Input current I" valueText={I.toFixed(2)} onChange={x => setI(x / 100)} />
        </div>}
        {ctrls.includes("step") && <div style={{ marginBottom: 14 }}>
          <SliderS value={Math.round(dt * 100)} min={5} max={70} accent={c.accent}
            label="Step size Δt" valueText={dt.toFixed(2)} onChange={x => setDt(x / 100)} />
        </div>}
        <div style={{ marginTop: 4 }}>
          {show.point && <ReadoutS c={c} k="state (v, w)" v={`${pt.v.toFixed(2)}, ${pt.w.toFixed(2)}`} />}
          {show.point && <ReadoutS c={c} k="dv/dt" v={(dv >= 0 ? "+" : "−") + Math.abs(dv).toFixed(2)} col={c.accent} />}
          {show.point && <ReadoutS c={c} k="dw/dt" v={(dw >= 0 ? "+" : "−") + Math.abs(dw).toFixed(3)} col={c.accent2} />}
          {show.regime && <ReadoutS c={c} k="regime" v={regime === "firing" ? "firing ⚡" : "resting"} col={regime === "firing" ? c.accent2 : c.good} />}
          {show.eulerCompare && <ReadoutS c={c} k="steps" v={Math.round(20 / dt)} col={c.ink} />}
        </div>
        {cfg.legend && <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
          {cfg.legend.map(([col, t], i) =>
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, font: "500 11.5px/1.3 var(--ui)", color: c.sub }}>
              <span style={{ width: 16, height: 3, borderRadius: 2, background: col, flex: "0 0 auto" }} />{t}
            </span>)}
        </div>}
      </PanelS>
    </div>
  );
}

/* ── Wilson–Cowan ──────────────────────────────────────────────────── */
function sig(x, a, th) { return 1 / (1 + Math.exp(-a * (x - th))); }
function wcIntegrate(wEI, n = 620, dt = 0.1) {
  const wEE = 16, wIE = 15, wII = 3, P = 1.6, Q = 0, a = 1.0, thE = 4, thI = 3.7, tauE = 1, tauI = 2;
  let E = 0.1, Iv = 0.1; const e = [], iv = [];
  for (let k = 0; k < n; k++) {
    const dE = (-E + sig(wEE * E - wEI * Iv + P, a, thE)) / tauE;
    const dI = (-Iv + sig(wIE * E - wII * Iv + Q, a, thI)) / tauI;
    E += dE * dt; Iv += dI * dt; e.push(E); iv.push(Iv);
  }
  let mn = 9, mx = -9; for (let k = Math.floor(n * 0.5); k < n; k++) { mn = Math.min(mn, e[k]); mx = Math.max(mx, e[k]); }
  return { e, iv, amp: mx - mn };
}

function WCPlot({ c }) {
  const [wEI, setWEI] = useStateSim(11);
  const { e, iv, amp } = useMemoSim(() => wcIntegrate(wEI), [wEI]);
  const osc = amp > 0.15;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 196px", gap: 14, alignItems: "stretch" }}>
      <div style={{ background: c.stageBg, border: `1px solid ${c.rule}`, borderRadius: 6, padding: 8 }}>
        <LinePlot c={c} series={[{ y: e, col: c.accent, label: "E" }, { y: iv, col: c.accent2, label: "I" }]}
          yMin={0} yMax={1} xLabel="time" yLabel="activity" />
      </div>
      <PanelS c={c} title="Parameters">
        <SliderS value={wEI} min={4} max={14} accent={c.accent} label="E→I coupling (wEI)" valueText={wEI.toFixed(0)} onChange={setWEI} />
        <div style={{ marginTop: 14 }}>
          <ReadoutS c={c} k="population E" v="excitatory" col={c.accent} />
          <ReadoutS c={c} k="population I" v="inhibitory" col={c.accent2} />
          <ReadoutS c={c} k="regime" v={osc ? "oscillation" : "steady"} col={osc ? c.accent2 : c.good} />
        </div>
      </PanelS>
    </div>
  );
}

/* ── Wong–Wang accumulator : the definite integral ─────────────────── */
function AccumPlot({ c }) {
  const [rate, setRate] = useStateSim(45); // evidence rate
  const N = 200, thr = 1.0;
  const data = useMemoSim(() => {
    const r = rate / 100; let x = 0; const xs = []; let cross = null;
    for (let k = 0; k < N; k++) {
      const noise = (Math.sin(k * 0.7) + Math.sin(k * 0.21)) * 0.012;
      if (cross == null) { x += (r + noise) * (1 / N) * 4; if (x >= thr) { x = thr; cross = k; } }
      xs.push(x);
    }
    return { xs, cross, r };
  }, [rate]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 196px", gap: 14, alignItems: "stretch" }}>
      <div style={{ background: c.stageBg, border: `1px solid ${c.rule}`, borderRadius: 6, padding: 8 }}>
        <LinePlot c={c} series={[{ y: data.xs, col: c.accent, label: "x", fill: true }]}
          yMin={0} yMax={1.25} xLabel="time" yLabel="accumulated evidence" threshold={{ y: thr, label: "decision threshold", col: c.accent2 }}
          marker={data.cross} />
      </div>
      <PanelS c={c} title="Parameters">
        <SliderS value={rate} min={10} max={90} accent={c.accent} label="Rate of evidence arrival" valueText={(rate / 100).toFixed(2)} onChange={setRate} />
        <div style={{ marginTop: 14 }}>
          <ReadoutS c={c} k="accumulation" v="= area" col={c.accent} />
          <ReadoutS c={c} k="decision" v={data.cross != null ? "at t = " + data.cross : "not reached"} col={data.cross != null ? c.accent2 : c.faint} />
        </div>
      </PanelS>
    </div>
  );
}

/* ── generic time-series plot ──────────────────────────────────────── */
function LinePlot({ c, series, yMin, yMax, xLabel, yLabel, threshold, marker }) {
  const W = 560, H = 320, m = { l: 44, r: 16, t: 18, b: 34 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const n = series[0].y.length;
  const X = i => m.l + i / (n - 1) * pw;
  const Y = v => m.t + (yMax - v) / (yMax - yMin) * ph;
  const path = s => s.y.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      {[0, 0.25, 0.5, 0.75, 1].map(f => { const v = yMin + f * (yMax - yMin); return (
        <g key={f}><line x1={m.l} y1={Y(v)} x2={W - m.r} y2={Y(v)} stroke={c.grid} strokeWidth="1" />
          <text x={m.l - 7} y={Y(v) + 4} textAnchor="end" fontSize="10.5" fill={c.sub} fontFamily="var(--mono)">{v.toFixed(1)}</text></g>); })}
      {threshold && <g>
        <line x1={m.l} y1={Y(threshold.y)} x2={W - m.r} y2={Y(threshold.y)} stroke={threshold.col} strokeWidth="1.4" strokeDasharray="4 4" />
        <text x={W - m.r} y={Y(threshold.y) - 6} textAnchor="end" fontSize="11" fontFamily="var(--ui)" fontWeight="600" fill={threshold.col}>{threshold.label}</text>
      </g>}
      {series.map((s, si) => s.fill && (
        <path key={"f" + si} d={`${path(s)} L ${X(n - 1)} ${Y(yMin)} L ${X(0)} ${Y(yMin)} Z`}
          fill={`color-mix(in srgb, ${s.col} 16%, transparent)`} stroke="none" />
      ))}
      {series.map((s, si) => <path key={si} d={path(s)} fill="none" stroke={s.col} strokeWidth="2.4" strokeLinejoin="round" />)}
      {marker != null && <line x1={X(marker)} y1={m.t} x2={X(marker)} y2={H - m.b} stroke={c.accent2} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.7" />}
      {series.map((s, si) => <g key={"l" + si}>
        <circle cx={m.l + 10 + si * 64} cy={H - 12} r="4" fill={s.col} />
        <text x={m.l + 19 + si * 64} y={H - 8} fontSize="12" fontFamily="var(--mono)" fill={c.sub}>{s.label}</text>
      </g>)}
      <text x={W - m.r} y={H - 8} textAnchor="end" fontSize="11" fontFamily="var(--ui)" fontWeight="600" fill={c.sub}>{xLabel}</text>
    </svg>
  );
}

Object.assign(window, { PhaseLab, WCPlot, AccumPlot, LinePlot, fhnRHS, fhnIntegrate });
