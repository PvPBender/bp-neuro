/* guide-core.jsx — design tokens + UI atoms for "Guide".
   Synthesis: warm paper page (dir B) · hairline restraint (dir A) ·
   lab-instrument stages with mono readouts (dir C), kept inside the figure only.
   Babel scopes are isolated → everything is exported to window at the end. */

const { useState: useStateCore, useRef: useRefCore, useEffect: useEffectCore } = React;

/* ── palettes ──────────────────────────────────────────────────────── */
function guidePalette(dark, accent) {
  const acc = accent || (dark ? "#c4a4ff" : "#6d28d9");
  return dark ? {
    page: "#1b1814", ink: "#efe8dd", sub: "#a89b89", faint: "#7c7060",
    bg: "#221e18", panel: "#26211a", rail: "#171410", rule: "#37301f",
    ruleStrong: "#4a4030", membrane: "#4a4034",
    na: acc, k: "#f0789f", line: "#8a7c66",
    grid: "#322b20", axis: "#4a4034", curve: acc,
    accent: acc, accent2: "#f0789f", good: "#5fcf94",
    plate: "#221e18", stageBg: "#1e1a14", chipBg: "#2c2519",
    shadow: "none", tabInk: "#1b1814"
  } : {
    page: "#f3ede1", ink: "#231e16", sub: "#6c6353", faint: "#928873",
    bg: "#fffdf6", panel: "#efe7d7", rail: "#ece3d2", rule: "#e2d8c4",
    ruleStrong: "#cdc1a9", membrane: "#d2c6af",
    na: acc, k: "#be185d", line: "#a99a7c",
    grid: "#ece1cd", axis: "#c9bea6", curve: acc,
    accent: acc, accent2: "#be185d", good: "#1c7a48",
    plate: "#fffdf6", stageBg: "#fffdf6", chipBg: "#efe7d7",
    shadow: "0 1px 0 #fff inset, 0 10px 30px -18px rgba(90,66,20,.45)", tabInk: "#fff"
  };
}

const ACCENTS = {
  violet: "#6d28d9", violetD: "#c4a4ff",
  teal:   "#0f766e", tealD:   "#5ecfc4",
  rust:   "#b3471f", rustD:   "#f0936a"
};

/* ── tiny atoms ────────────────────────────────────────────────────── */

function Kicker({ c, children }) {
  return <div style={{ font: "700 12px/1 var(--ui)", letterSpacing: "0.16em",
    color: c.accent, textTransform: "uppercase" }}>{children}</div>;
}

function Chip({ c, children, tone }) {
  const col = tone === "concept" ? c.accent2 : c.accent;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6,
    font: "700 11px/1 var(--ui)", letterSpacing: "0.08em", textTransform: "uppercase",
    color: col, background: `color-mix(in srgb, ${col} 12%, transparent)`,
    border: `1px solid color-mix(in srgb, ${col} 30%, transparent)`,
    borderRadius: 100, padding: "5px 10px" }}>{children}</span>;
}

/* B-style figure plate with a small label tab; the lab lives inside */
function Plate({ c, label, children, note }) {
  return (
    <figure style={{ margin: "0 0 4px" }}>
      <div style={{ position: "relative", background: c.plate,
        border: `1px solid ${c.rule}`, borderRadius: 8, boxShadow: c.shadow,
        padding: "18px 18px 14px" }}>
        {label && (
          <div style={{ position: "absolute", top: -11, left: 20, background: c.accent,
            color: c.tabInk, font: "700 10.5px/1 var(--ui)", letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "5px 10px", borderRadius: 5, whiteSpace: "nowrap" }}>{label}</div>
        )}
        {children}
      </div>
      {note && <figcaption style={{ font: "italic 400 13.5px/1.5 var(--serif)",
        color: c.sub, marginTop: 11, paddingLeft: 13, borderLeft: `2px solid ${c.accent}` }}>{note}</figcaption>}
    </figure>
  );
}

/* C-style instrument side panel */
function Panel({ c, title, children, w }) {
  return (
    <div style={{ background: c.panel, border: `1px solid ${c.rule}`, borderRadius: 8,
      padding: "15px 16px", width: w || "auto" }}>
      {title && <div style={{ font: "700 10.5px/1 var(--ui)", letterSpacing: "0.1em",
        textTransform: "uppercase", color: c.faint, marginBottom: 13 }}>{title}</div>}
      {children}
    </div>
  );
}

/* C-style mono readout row */
function Readout({ c, k, v, col }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "8px 0", borderBottom: `1px solid ${c.rule}` }}>
      <span style={{ font: "500 12px/1 var(--ui)", color: c.sub }}>{k}</span>
      <span style={{ font: "600 14px/1 var(--mono)", color: col || c.ink }}>{v}</span>
    </div>
  );
}

/* "Do this" imperative line */
function DoThis({ c, children }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", margin: "0 0 22px",
      padding: "13px 16px", background: `color-mix(in srgb, ${c.accent} 7%, transparent)`,
      border: `1px solid color-mix(in srgb, ${c.accent} 22%, transparent)`, borderRadius: 8 }}>
      <span aria-hidden="true" style={{ font: "700 13px/1.35 var(--ui)", color: c.accent,
        flex: "0 0 auto", letterSpacing: "0.06em", textTransform: "uppercase" }}>Do</span>
      <span style={{ font: "500 16px/1.45 var(--serif)", color: c.ink, textWrap: "pretty" }}>{children}</span>
    </div>
  );
}

/* "Why it works" — biological meaning + named concept */
function WhyBox({ c, concept, children }) {
  return (
    <div style={{ margin: "26px 0 0", paddingLeft: 18, borderLeft: `3px solid ${c.accent2}` }}>
      <div style={{ font: "700 11px/1 var(--ui)", letterSpacing: "0.1em", textTransform: "uppercase",
        color: c.accent2, marginBottom: 9 }}>Why it works{concept ? " · " + concept : ""}</div>
      <p style={{ font: "400 17px/1.62 var(--serif)", color: c.ink, margin: 0, textWrap: "pretty" }}>{children}</p>
    </div>
  );
}

/* predict-then-check prompt with a hidden answer */
function RevealPrompt({ c, q, a }) {
  const [open, setOpen] = useStateCore(false);
  return (
    <div style={{ margin: "24px 0 0", background: c.panel, border: `1px solid ${c.rule}`,
      borderRadius: 8, padding: "15px 17px" }}>
      <div style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
        <span style={{ font: "700 11px/1 var(--ui)", letterSpacing: "0.08em", textTransform: "uppercase",
          color: c.faint, flex: "0 0 auto", marginTop: 2 }}>Predict</span>
        <p style={{ font: "500 16px/1.5 var(--serif)", color: c.ink, margin: 0, textWrap: "pretty" }}>{q}</p>
      </div>
      <button onClick={() => setOpen(o => !o)} style={{ marginTop: 12, cursor: "pointer",
        font: "600 13px/1 var(--ui)", color: c.accent, background: "transparent",
        border: `1px solid ${c.accent}`, borderRadius: 100, padding: "8px 14px" }}>
        {open ? "Hide" : "Show answer"}
      </button>
      {open && <p style={{ font: "400 15.5px/1.55 var(--serif)", color: c.sub, margin: "13px 0 0",
        textWrap: "pretty" }}>{a}</p>}
    </div>
  );
}

/* "Go further" go-further */
function GoFurther({ c, children }) {
  return (
    <div style={{ margin: "20px 0 0", display: "flex", gap: 11, alignItems: "flex-start" }}>
      <span style={{ font: "700 11px/1.4 var(--ui)", letterSpacing: "0.08em", textTransform: "uppercase",
        color: c.good, flex: "0 0 auto", marginTop: 2 }}>Go further</span>
      <p style={{ font: "italic 400 15.5px/1.55 var(--serif)", color: c.sub, margin: 0, textWrap: "pretty" }}>{children}</p>
    </div>
  );
}

/* teacher-facing margin note — hidden by default */
function TeacherNote({ c, show, objective, misconception, check }) {
  if (!show) return null;
  return (
    <div style={{ margin: "26px 0 0", border: `1px dashed ${c.ruleStrong}`, borderRadius: 8,
      padding: "15px 17px", background: `color-mix(in srgb, ${c.good} 6%, transparent)` }}>
      <div style={{ font: "700 10.5px/1 var(--ui)", letterSpacing: "0.1em", textTransform: "uppercase",
        color: c.good, marginBottom: 11 }}>For the teacher</div>
      <NoteRow c={c} k="Goal" v={objective} />
      <NoteRow c={c} k="Misconception" v={misconception} />
      <NoteRow c={c} k="Check" v={check} />
    </div>
  );
}
function NoteRow({ c, k, v }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "118px 1fr", gap: 12, padding: "5px 0" }}>
      <span style={{ font: "600 12px/1.45 var(--ui)", color: c.faint }}>{k}</span>
      <span style={{ font: "400 14px/1.5 var(--serif)", color: c.ink, textWrap: "pretty" }}>{v}</span>
    </div>
  );
}

Object.assign(window, {
  guidePalette, ACCENTS, Kicker, Chip, Plate, Panel, Readout,
  DoThis, WhyBox, RevealPrompt, GoFurther, TeacherNote
});
