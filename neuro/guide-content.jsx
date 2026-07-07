/* guide-content.jsx — the guided walkthrough's spine (ENGLISH working copy).
   Onramp (motivation) + 8 stations, each binding ONE calculus concept to ONE
   manipulation, ordered by a strict difficulty ladder (progressive disclosure).
   Copy is English on purpose — a working scaffold, not final thesis wording.
   Source: scaffold.pdf (blueprint) §2, §6.1–6.4. */

const GUIDE = {
  title: "From Ions to the Derivative",
  subtitle: "Interactive guide · modelling dynamical systems",
  // ── onramp: why does change matter at all? ──────────────────────────
  onramp: {
    id: "intro", n: "00", rung: "Intro", concept: "Motivation",
    title: "How fast does the membrane voltage change?",
    dek: "Before we compute anything, let's see where the change comes from. Thousands of ions collapse into a single curve — and the slope of that curve turns out to be the most important number in the whole story."
  },
  stations: [
    {
      id: "s1", n: "01", rung: "1", concept: "Derivative",
      title: "The derivative is an arrow",
      doThis: "Grab the point and drag it across the plane. At every location the arrow tells you which way — and how fast — the state of the neuron is changing right now.",
      lab: { kind: "phase", cfg: { controls: ["I"], Idefault: 0.5, point: { v: 0.6, w: 0.1 },
        show: { field: true, point: true } } },
      caption: "Vector field: at each point we feed the state (v, w) into two formulas and get two numbers — the components of a single arrow.",
      why: { concept: "instantaneous rate of change", text: "That arrow isn't decoration — it is the derivative of the state. Its horizontal part is how fast the membrane voltage is changing now; its vertical part is how fast recovery is catching up. Its length is the speed, its direction is where the cell is headed." },
      prompt: { q: "Find the place where the voltage is rising fastest. Which way does the arrow point there — and what is the cell doing?",
        a: "Where the horizontal component is longest, the arrow points right. The membrane is depolarising hard — the neuron is firing." },
      goFurther: "Move the input current I and watch the whole field tilt. Same rule, different terrain.",
      teacher: { objective: "Student reads a vector-field arrow as the instantaneous rate of change of the state.",
        misconception: "That a point in the plane is a measurement over time. It isn't — it's the complete state at one instant.",
        check: "Point anywhere: \u201cWhat does the length of that arrow mean?\u201d" }
    },
    {
      id: "s2", n: "02", rung: "2", concept: "Differential equation",
      title: "A law with no memory",
      doThis: "Drop the point at two different places and compare the two arrows. The rule for motion depends only on where you are — never on how you got there.",
      lab: { kind: "phase", cfg: { controls: ["I"], Idefault: 0.5, point: { v: -1.0, w: 0.2 },
        show: { field: true, point: true } } },
      caption: "A differential equation doesn't say where the state is — it says how fast it changes as a function of the current state.",
      why: { concept: "rate fixed by state", text: "The cell is memoryless: its next move is set entirely by where it is right now, not by its history. That is exactly what an ODE says — a local law that hands every state a velocity. Two different points, two different arrows." },
      prompt: { q: "Before you move it: will the arrow near the resting state be longer or shorter than one mid-spike?",
        a: "Shorter. At rest almost nothing changes, so the rate — and the arrow — is nearly zero." },
      goFurther: "Are there places where the arrow would vanish entirely? What would that mean for the cell?",
      teacher: { objective: "Student understands an ODE as the rule \u201crate = function of state,\u201d with no memory.",
        misconception: "That predicting the future needs the past. The present state is enough.",
        check: "\u201cWhy is the system memoryless?\u201d" }
    },
    {
      id: "s3", n: "03", rung: "3", concept: "Numerical integration",
      title: "Arrows chain into a path",
      doThis: "Shrink the step size Δt and watch the jagged line hug the smooth trajectory. A large step is a coarser guess.",
      lab: { kind: "phase", cfg: { controls: ["I", "step"], Idefault: 0.6, stepDefault: 0.4,
        trajStart: { v: -1.3, w: -0.5 },
        show: { field: false, trajectory: true, eulerCompare: true },
        legend: [["var(--curve)", "Euler steps"], ["var(--sub)", "exact solution"]] } },
      caption: "Euler's method: take a short step along the arrow, recompute the arrow, repeat. Chaining the arrows traces the whole path.",
      why: { concept: "building a solution step by step", text: "We can't write the continuous solution as a formula, but we can accumulate it: every small hop goes where the current arrow points. A smaller step is more faithful — at the cost of more steps. Halving Δt halves the error but doubles the work. That is the whole speed-vs-accuracy trade." },
      prompt: { q: "Find the largest step that still tracks the smooth curve. What happens when you push it bigger?",
        a: "The jagged line starts to drift — it overshoots the bends, because between steps we don't recompute the arrow often enough." },
      goFurther: "How many steps does Δt = 0.1 take? And 0.5? Accuracy isn't free.",
      teacher: { objective: "Student feels the trade-off between step size and accuracy in a numerical solution.",
        misconception: "That a smaller step is \u201cfree.\u201d It costs compute.",
        check: "\u201cWhy does a big step overshoot the bends?\u201d" }
    },
    {
      id: "s4", n: "04", rung: "4", concept: "Equilibrium · dv/dt = 0",
      title: "Where nothing is changing",
      doThis: "Turn on the nullclines. On the purple curve dv/dt = 0; on the pink one dw/dt = 0. Watch how the arrows land on them.",
      lab: { kind: "phase", cfg: { controls: ["I"], Idefault: 0.5,
        show: { field: true, nullclines: true },
        legend: [["var(--accent)", "v-nullcline (dv/dt = 0)"], ["var(--accent2)", "w-nullcline (dw/dt = 0)"]] } },
      caption: "A nullcline is the set of states where one of the rates is exactly zero. Where the two cross, nothing moves — a fixed point.",
      why: { concept: "the equilibrium condition", text: "Setting a derivative to zero isn't an abstract trick — it's the question \u201cwhere is this quantity momentarily not changing?\u201d On the v-nullcline the voltage neither rises nor falls. Where both nullclines cross, every rate vanishes at once: the system stands still." },
      prompt: { q: "Why does every arrow that touches the v-nullcline point straight up or down?",
        a: "Because on the v-nullcline the horizontal component dv/dt is zero — only the vertical change in w is left." },
      goFurther: "Move I and watch the cubic nullcline rise. When does the crossing jump to a new position?",
      teacher: { objective: "Student reads \u201cderivative = 0\u201d as a geometric locus, not an equation to solve.",
        misconception: "That equilibrium = calm forever. It can be unstable.",
        check: "\u201cWhat's special about where the two nullclines cross?\u201d" }
    },
    {
      id: "s5", n: "05", rung: "5", concept: "Phase portrait",
      title: "The whole story at a glance",
      doThis: "Watch the point slide along the arrows and trace out a trajectory. One closed loop = one action potential.",
      lab: { kind: "phase", cfg: { controls: ["I"], Idefault: 0.6, trajStart: { v: -1.0, w: -0.6 },
        show: { field: true, nullclines: true, trajectory: true, animate: true },
        legend: [["var(--accent2)", "state of the neuron in time"], ["var(--curve)", "trajectory"]] } },
      caption: "A phase portrait fuses the field, the nullclines and a trajectory into one image. The shape of the path summarises the whole event at once.",
      why: { concept: "the global picture of the dynamics", text: "Instead of time, we plot voltage against recovery. The trajectory then shows the fate of every starting state — and the characteristic loop is exactly what biology calls a spike. Trajectories never cross. One picture instead of a thousand values." },
      prompt: { q: "Does the point return to exactly where it started? What does that say about repeated spikes?",
        a: "Above threshold it circles a closed loop — a limit cycle — so the spike repeats periodically." },
      goFurther: "Launch the trajectory from different places. Do they all end up the same?",
      teacher: { objective: "Student sees a trajectory as the complete account of evolution from a given start.",
        misconception: "That a phase portrait is a \u201cgraph over time.\u201d Time is hidden in the motion of the point.",
        check: "\u201cWhere is time on this picture?\u201d" }
    },
    {
      id: "s6", n: "06", rung: "6", concept: "Bifurcation",
      title: "The break: from rest to firing",
      doThis: "Slowly raise the input current I across its critical value (near 0.33). At one instant the resting point becomes an endless loop.",
      lab: { kind: "phase", cfg: { controls: ["I"], Idefault: 0.3, trajStart: { v: -1.0, w: -0.6 },
        show: { field: false, nullclines: true, trajectory: true, animate: true, regime: true } } },
      caption: "Bifurcation: a smooth change in a parameter causes a sudden qualitative change in the behaviour of the whole system.",
      why: { concept: "a qualitative jump", text: "Below threshold a nudged cell settles back to rest. Just above it the cell fires without stopping. The formula didn't change — only one value did — yet the behaviour flipped in kind, not degree. That is a bifurcation." },
      prompt: { q: "Find the value of I where rest gives way to continuous firing. Is the change gradual or sudden?",
        a: "It flips suddenly: just below the line, rest; just above it, a limit cycle. A small change in I, a large consequence." },
      goFurther: "Is there a narrow band where the system seems to hesitate? What happens right on the edge?",
      teacher: { objective: "Student feels that a small continuous change in a parameter can cause a discontinuous change in behaviour.",
        misconception: "That bigger input = proportionally bigger response. There is a threshold.",
        check: "\u201cWhere exactly does the behaviour break?\u201d" }
    },
    {
      id: "s7", n: "07", rung: "7", concept: "System of equations",
      title: "Two populations, one system",
      doThis: "Change the coupling between the excitatory and inhibitory populations. Watch both traces respond together — neither makes sense alone.",
      lab: { kind: "wc" },
      caption: "Wilson–Cowan: two coupled populations of neurons. Excitation and inhibition drive each other.",
      why: { concept: "coupled equations", text: "One equation no longer suffices. The excitatory group drives the inhibitory one, which damps it back — and out of that loop come oscillations, a rhythm we really see in EEG. You can't integrate dE/dt without knowing I(t), and vice versa. That cross-dependence is what makes it a system." },
      prompt: { q: "When you push excitation up hard, what happens to inhibition? Do they catch up, or drift apart?",
        a: "Inhibition catches up with a lag and pulls it back down — and that very lag rocks the whole system into oscillation." },
      goFurther: "At what coupling does the system stop oscillating and settle? Where is the edge of rhythm?",
      teacher: { objective: "Student understands a system of ODEs as coupled quantities that can't be solved separately.",
        misconception: "That the populations can be studied independently. The coupling is the point.",
        check: "\u201cWhy isn't one equation enough?\u201d" }
    },
    {
      id: "s8", n: "08", rung: "8", concept: "Definite integral",
      title: "Accumulation is area",
      doThis: "Change the rate at which evidence arrives. The curve climbs by sweeping out area beneath it — and the moment it's tall enough, a decision is made.",
      lab: { kind: "accum" },
      caption: "Wong–Wang: the brain piles up sensory evidence over time and commits once the accumulated area crosses a threshold.",
      why: { concept: "accumulation = ∫ rate · dt", text: "If the derivative is a rate, the integral is the running total. The height of the curve at any instant is exactly the area under the rate up to that moment. Derivative and integral are two sides of one coin — taking change apart, and adding it back up. A brief strong signal and a long weak one can reach the same height, because area, not instantaneous value, decides." },
      prompt: { q: "If you double the rate of arrival, what happens to the time of decision?",
        a: "It shortens: the area (and so the accumulated evidence) grows twice as fast, so the threshold arrives sooner." },
      goFurther: "Is there a rate so low the decision never arrives? What would that mean for the brain?",
      teacher: { objective: "Student sees a definite integral as the accumulated area under a rate curve.",
        misconception: "That the integral is just \u201cthe reverse formula of the derivative.\u201d It is an accumulated total.",
        check: "\u201cWhat does the area under that curve physically mean?\u201d" }
    }
  ]
};

window.GUIDE = GUIDE;
