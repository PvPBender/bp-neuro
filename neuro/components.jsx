/* components.jsx — shared primitives for the interactive guide.
   Babel scripts get isolated scope, so everything is exported to window at the end.
   Primitives are theme-agnostic: callers pass a palette object `c`. */

const { useState, useRef, useEffect, useCallback } = React;

/* ──────────────────────────────────────────────────────────────
   MathTeX — KaTeX renderer
   ────────────────────────────────────────────────────────────── */
function MathTeX({ tex, display = false, style }) {
  const ref = useRef(null);
  useEffect(() => {
    let tries = 0;
    const render = () => {
      if (!ref.current) return;
      if (window.katex) { window.katex.render(tex, ref.current, { displayMode: display, throwOnError: false }); }
      else if (tries++ < 60) { setTimeout(render, 80); }
    };
    render();
  }, [tex, display]);
  return <span ref={ref} style={style} />;
}

/* ──────────────────────────────────────────────────────────────
   Voltage physics — one action potential over t ∈ [0,1] (≈ 5 ms)
   ────────────────────────────────────────────────────────────── */
const T_MS = 5;
function apV(t) {
  const rest = -70;
  const slowRise = 9 * Math.exp(-Math.pow((t - 0.24) / 0.075, 2));
  const spike = 116 * Math.exp(-Math.pow((t - 0.34) / 0.046, 2));
  const after = -19 * Math.exp(-Math.pow((t - 0.52) / 0.085, 2));
  return rest + slowRise + spike + after;
}
function apSlope(t) { // dV/dt in mV per (t-unit); convert to mV/ms
  const h = 0.0015;
  return (apV(t + h) - apV(t - h)) / (2 * h) / T_MS;
}

/* ──────────────────────────────────────────────────────────────
   MembraneDiagram — DK-style cross-section with live ion flow.
   c: { ink, sub, bg, membrane, na, k, line, accent, tag, tagInk }
   labeled: DK callouts/leader-lines/legend on/off
   ────────────────────────────────────────────────────────────── */
function MembraneDiagram({ c, perm = 55, labeled = true, w = 640, h = 360, idPrefix = "m" }) {
  const midY = h * 0.52;
  const memH = 46;
  const top = midY - memH / 2;
  const bot = midY + memH / 2;
  // ion counts + speed + gate opening, all driven by permeability
  const openF = Math.max(0, Math.min(1, perm / 100));   // 0..1
  const naN = Math.round(openF * 9);
  const kN = Math.round(openF * 6);
  const dur = (2.9 - openF * 2.0).toFixed(2);
  const gap = 1.5 + openF * 11;                          // gate leaflets separate as it opens
  const leafW = 11;
  const chOp = 0.12 + openF * 0.6;                       // pore brightens as it opens
  const naX = w * 0.38, kX = w * 0.66;

  const heads = [];
  const headR = 5.5, headGap = 13;
  for (let x = 18; x < w - 12; x += headGap) {
    heads.push(x);
  }

  const ion = (key, x, color, dir, i, n) => {
    const delay = -(i / n) * dur;
    return (
      <g key={key} transform={`translate(${x},0)`}>
        <g className={dir === "down" ? "ion-down" : "ion-up"}
           style={{ animationDuration: dur + "s", animationDelay: delay + "s" }}>
          <circle cx={0} cy={dir === "down" ? top - 56 : bot + 56} r="7" fill={color} />
          <text x={0} y={(dir === "down" ? top - 56 : bot + 56) + 3} textAnchor="middle"
                fontSize="7.5" fontWeight="700" fill={c.bg} fontFamily="ui-monospace, monospace">
            {dir === "down" ? "+" : "+"}
          </text>
        </g>
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      {/* compartment labels */}
      <text x="16" y="26" fontSize="12.5" letterSpacing="1.5" fontWeight="600"
            fill={c.sub} fontFamily="var(--ui)">OUTSIDE</text>
      <text x="16" y={h - 14} fontSize="12.5" letterSpacing="1.5" fontWeight="600"
            fill={c.sub} fontFamily="var(--ui)">INSIDE  ·  −70 mV</text>

      {/* lipid bilayer — two rows of phospholipid heads + tails */}
      <g opacity="0.9">
        {heads.map((x, i) => (
          <g key={"ht" + i}>
            <line x1={x} y1={top + headR} x2={x} y2={midY} stroke={c.membrane} strokeWidth="1.4" opacity="0.55" />
            <line x1={x} y1={bot - headR} x2={x} y2={midY} stroke={c.membrane} strokeWidth="1.4" opacity="0.55" />
            <circle cx={x} cy={top + headR} r={headR} fill={c.membrane} />
            <circle cx={x} cy={bot - headR} r={headR} fill={c.membrane} />
          </g>
        ))}
      </g>

      {/* channels (pores) — gate leaflets that open with permeability */}
      {[naX, kX].map((cx, idx) => {
        const col = idx === 0 ? c.na : c.k;
        const slot = gap / 2 + leafW + 3;
        return (
          <g key={"ch" + idx}>
            {/* clear the lipid heads behind the channel */}
            <rect x={cx - slot} y={top - 7} width={slot * 2} height={memH + 14} rx="7" fill={c.bg} />
            {/* open-pore glow */}
            <rect x={cx - gap / 2} y={top - 4} width={gap} height={memH + 8} rx="4" fill={col} opacity={openF * 0.2} />
            {/* two gate leaflets */}
            <rect x={cx - gap / 2 - leafW} y={top - 6} width={leafW} height={memH + 12} rx="5"
                  fill={col} opacity={chOp} stroke={col} strokeWidth="1.5" />
            <rect x={cx + gap / 2} y={top - 6} width={leafW} height={memH + 12} rx="5"
                  fill={col} opacity={chOp} stroke={col} strokeWidth="1.5" />
          </g>
        );
      })}

      {/* ions flowing */}
      <g clipPath={`url(#${idPrefix}clip)`}>
        {Array.from({ length: naN }).map((_, i) =>
          ion("na" + i, naX + (i % 2 ? 5 : -5), c.na, "down", i, naN))}
        {Array.from({ length: kN }).map((_, i) =>
          ion("k" + i, kX + (i % 2 ? 5 : -5), c.k, "up", i, kN))}
      </g>
      <clipPath id={`${idPrefix}clip`}>
        <rect x="0" y="6" width={w} height={h - 30} />
      </clipPath>

      {/* DK callouts */}
      {labeled && (
        <g fontFamily="var(--ui)">
          {/* Na channel tag */}
          <line x1={naX} y1={top - 10} x2={naX - 70} y2={top - 48} stroke={c.line} strokeWidth="1.2" />
          <circle cx={naX} cy={top - 10} r="2.6" fill={c.line} />
          <g transform={`translate(${naX - 154}, ${top - 64})`}>
            <rect width="84" height="22" rx="4" fill={c.na} />
            <text x="42" y="15" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">Na⁺ channel</text>
          </g>
          {/* K channel tag */}
          <line x1={kX} y1={bot + 10} x2={kX + 70} y2={bot + 46} stroke={c.line} strokeWidth="1.2" />
          <circle cx={kX} cy={bot + 10} r="2.6" fill={c.line} />
          <g transform={`translate(${kX + 70}, ${bot + 36})`}>
            <rect width="78" height="22" rx="4" fill={c.k} />
            <text x="39" y="15" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">K⁺ channel</text>
          </g>
          {/* bilayer tag */}
          <line x1={w * 0.86} y1={midY} x2={w * 0.86 + 30} y2={midY - 40} stroke={c.line} strokeWidth="1.2" />
          <circle cx={w * 0.86} cy={midY} r="2.6" fill={c.line} />
          <text x={w * 0.86 + 34} y={midY - 42} fontSize="11.5" fontWeight="600" fill={c.sub}>lipid</text>
          <text x={w * 0.86 + 34} y={midY - 29} fontSize="11.5" fontWeight="600" fill={c.sub}>bilayer</text>
        </g>
      )}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   VoltageCurve — V(t) with draggable tangent showing dV/dt.
   c: { ink, sub, bg, grid, axis, curve, accent, accent2 }
   ────────────────────────────────────────────────────────────── */
function VoltageCurve({ c, w = 640, h = 360, startT = 0.34 }) {
  const [t, setT] = useState(startT);
  const svgRef = useRef(null);
  const m = { l: 52, r: 20, t: 22, b: 40 };
  const plotW = w - m.l - m.r, plotH = h - m.t - m.b;
  const vMin = -92, vMax = 52;
  const X = tt => m.l + tt * plotW;
  const Y = v => m.t + (vMax - v) / (vMax - vMin) * plotH;

  const pts = [];
  for (let i = 0; i <= 220; i++) { const tt = i / 220; pts.push([X(tt), Y(apV(tt))]); }
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");

  const px = X(t), py = Y(apV(t));
  const slope = apSlope(t);                 // mV/ms
  const slopePix = -slope * T_MS * (plotH / (vMax - vMin)) / (plotW); // dy/dx in px
  const tl = 78;
  const dx = tl / Math.sqrt(1 + slopePix * slopePix);
  const dy = slopePix * dx;

  const onMove = useCallback((clientX) => {
    const r = svgRef.current.getBoundingClientRect();
    const tt = Math.max(0, Math.min(1, ((clientX - r.left) / r.width * w - m.l) / plotW));
    setT(tt);
  }, [w, plotW]);

  const drag = (e) => {
    e.preventDefault();
    const move = ev => onMove((ev.touches ? ev.touches[0] : ev).clientX);
    move(e);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };

  const rising = slope > 0.5;
  const gridV = [-80, -40, 0, 40];
  return (
    <div>
      <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block", touchAction: "none", cursor: "ew-resize" }}
           onPointerDown={drag}>
        {/* grid */}
        {gridV.map(v => (
          <g key={v}>
            <line x1={m.l} y1={Y(v)} x2={w - m.r} y2={Y(v)} stroke={c.grid} strokeWidth="1" />
            <text x={m.l - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill={c.sub} fontFamily="var(--mono)">{v}</text>
          </g>
        ))}
        {/* threshold line */}
        <line x1={m.l} y1={Y(-55)} x2={w - m.r} y2={Y(-55)} stroke={c.accent2} strokeWidth="1.2" strokeDasharray="3 4" opacity="0.7" />
        <text x={w - m.r} y={Y(-55) - 6} textAnchor="end" fontSize="10.5" fill={c.accent2} fontFamily="var(--ui)" fontWeight="600">threshold</text>
        {/* axes labels */}
        <text x={m.l - 36} y={m.t + 4} fontSize="11" fill={c.sub} fontFamily="var(--ui)" fontWeight="600">mV</text>
        <text x={w - m.r} y={h - 10} textAnchor="end" fontSize="11" fill={c.sub} fontFamily="var(--ui)" fontWeight="600">time (ms)</text>
        {[0,1,2,3,4,5].map(ms => (
          <text key={ms} x={X(ms/5)} y={h - 24} textAnchor="middle" fontSize="10.5" fill={c.sub} fontFamily="var(--mono)">{ms}</text>
        ))}
        {/* curve */}
        <path d={path} fill="none" stroke={c.curve} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
        {/* tangent */}
        <line x1={px - dx} y1={py - dy} x2={px + dx} y2={py + dy}
              stroke={rising ? c.accent : c.accent2} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx={px} cy={py} r="6" fill={c.bg} stroke={rising ? c.accent : c.accent2} strokeWidth="3" />
      </svg>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10, fontFamily: "var(--mono)" }}>
        <span style={{ fontSize: 13, color: c.sub, fontFamily: "var(--ui)" }}>instantaneous slope</span>
        <MathTeX tex={"\\frac{dV}{dt}"} style={{ color: c.ink, fontSize: 15 }} />
        <span style={{ fontSize: 20, fontWeight: 700, color: rising ? c.accent : c.accent2 }}>
          {slope >= 0 ? "+" : "−"}{Math.abs(slope).toFixed(0)}
        </span>
        <span style={{ fontSize: 13, color: c.sub }}>mV/ms</span>
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: c.sub, fontFamily: "var(--ui)" }}>
          {rising ? "↗ voltage rising fast" : slope < -0.5 ? "↘ voltage falling" : "→ nearly constant"}
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   PhasePortrait — FitzHugh–Nagumo nullclines + trajectory.
   Echoes the cubic nullcline shape from the napkin sketch.
   ────────────────────────────────────────────────────────────── */
function PhasePortrait({ c, w = 420, h = 300, I = 0.5 }) {
  const m = { l: 36, r: 16, t: 16, b: 30 };
  const pw = w - m.l - m.r, ph = h - m.t - m.b;
  const vMin = -2.4, vMax = 2.4, wMin = -1, wMax = 2.2;
  const X = v => m.l + (v - vMin) / (vMax - vMin) * pw;
  const Y = ww => m.t + (wMax - ww) / (wMax - wMin) * ph;
  const a = 0.7, b = 0.8;

  // v-nullcline: w = v - v^3/3 + I  (the cubic — matches the sketch)
  let cub = "";
  for (let i = 0; i <= 120; i++) { const v = vMin + (i / 120) * (vMax - vMin); cub += (i ? "L" : "M") + X(v).toFixed(1) + " " + Y(v - v*v*v/3 + I).toFixed(1) + " "; }
  // w-nullcline: w = (v + a)/b
  const wn = `M ${X(vMin)} ${Y((vMin + a)/b)} L ${X(vMax)} ${Y((vMax + a)/b)}`;

  // trajectory via Euler
  let v = -1.2, ww = -0.4; let traj = `M ${X(v)} ${Y(ww)} `;
  const dt = 0.04;
  for (let i = 0; i < 1400; i++) {
    const dv = v - v*v*v/3 - ww + I;
    const dw = (v + a - b*ww) * 0.08;
    v += dv * dt; ww += dw * dt;
    if (i % 3 === 0) traj += `L ${X(v).toFixed(1)} ${Y(ww).toFixed(1)} `;
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      <line x1={m.l} y1={Y(0)} x2={w - m.r} y2={Y(0)} stroke={c.grid} strokeWidth="1" />
      <line x1={X(0)} y1={m.t} x2={X(0)} y2={h - m.b} stroke={c.grid} strokeWidth="1" />
      <path d={traj} fill="none" stroke={c.curve} strokeWidth="1.6" opacity="0.55" />
      <path d={cub} fill="none" stroke={c.accent} strokeWidth="2.6" />
      <path d={wn} fill="none" stroke={c.accent2} strokeWidth="2.2" strokeDasharray="5 4" />
      <text x={w - m.r} y={Y(0) - 6} textAnchor="end" fontSize="12" fontStyle="italic" fill={c.sub} fontFamily="var(--mono)">V</text>
      <text x={X(0) + 8} y={m.t + 12} fontSize="12" fontStyle="italic" fill={c.sub} fontFamily="var(--mono)">w</text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   Slider — native range, themed via inline --acc
   ────────────────────────────────────────────────────────────── */
function Slider({ value, onChange, min = 0, max = 100, accent, label, valueText }) {
  return (
    <label style={{ display: "block" }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, alignItems: "baseline" }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: "var(--ui)", letterSpacing: 0.2 }}>{label}</span>
          {valueText && <span style={{ fontSize: 12.5, fontFamily: "var(--mono)", color: accent, fontWeight: 700 }}>{valueText}</span>}
        </div>
      )}
      <input className="rng" type="range" min={min} max={max} value={value}
             onChange={e => onChange(Number(e.target.value))}
             style={{ "--acc": accent, width: "100%" }} />
    </label>
  );
}

Object.assign(window, { MathTeX, MembraneDiagram, VoltageCurve, PhasePortrait, Slider, apV, apSlope });
