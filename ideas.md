# IntentFence Control Center — Design Direction

## Theme Name: Signal & Stewardship

**Very Brief Intro:** A high-trust operations console for autonomous AI: calm, forensic, and precise rather than flashy. The visual language pairs ink-black security surfaces with warm paper-like panels and a single signal-green accent so every permission decision feels legible and consequential.

**Probability:** 0.067

## Alternative approaches considered

### Theme Name: Editorial Command Desk

**Very Brief Intro:** A bright, newspaper-inspired operations workspace using cream, cobalt, and red flags to make complex agent decisions feel accessible to non-technical operators.

**Probability:** 0.024

### Theme Name: Nightwatch Protocol

**Very Brief Intro:** A dark, neon-leaning observability console with electric cyan and amber traces for a more technical, cinematic security posture.

**Probability:** 0.081

## Chosen approach: Signal & Stewardship

### Design Movement
A contemporary fusion of **Swiss International typography** and **forensic operations design**, softened by the material honesty of modern editorial dashboards. The interface should feel like a trusted instrument: structured, quiet, and exact.

### Core Principles
1. **Evidence before decoration.** Every visual flourish must clarify state, authority, or audit history.
2. **Tension with resolution.** Risk surfaces use a controlled amber signal; approved flows settle into green; nothing relies on alarmist red unless execution is actually blocked.
3. **Asymmetric command layout.** A persistent rail anchors navigation while the main canvas privileges the current decision and lets supporting context trail behind it.
4. **Readable authority.** Labels, timestamps, targets, and plan boundaries are always visible and human-scannable.

### Color Philosophy
Ink-black and graphite provide a serious, low-noise field for decision-making. Warm off-white surfaces keep dense operational detail readable and human. The ownable brand color is **Signal Green (#B9F227)**: it represents permission that is active, bounded, and observable—not generic success. Amber is reserved for actions waiting on a human; cobalt-blue is reserved for trace metadata and machine context.

### Layout Paradigm
A command-center layout with a **compact left rail**, a wide central work area, and a right-hand contextual drawer for the active authorization decision. Avoid a symmetrical dashboard grid. The page should feel like a decision is unfolding: current run at the top, risk queue in the middle, proof trail below.

### Signature Elements
- **Intent ribbon:** a thin horizontal line showing the captured intent, current status, and boundary state.
- **Decision cards:** warm-paper cards with a colored vertical spine, showing action, target, scope, and evidence.
- **Audit spine:** a vertical timeline with compact event chips and proof-path identifiers.

### Interaction Philosophy
Interactions should feel like controlled handoffs, not playful app gestures. Hover reveals evidence; click opens context; approve/reject actions require visual confirmation but not a cumbersome flow. The pending action should be the most prominent interactive surface.

### Animation
Use brief 160–220ms transitions with a sharp ease-out. The run status indicator pulses only while a run is active. When an action moves from evaluating to held, the decision card slides in 8px and changes its accent from blue to amber. Approval resolves the amber spine into signal green. Respect reduced-motion preferences.

### Typography System
Use **Space Grotesk** for display labels and major numbers, paired with **DM Sans** for body copy and operational detail. Uppercase micro-labels use 0.12em tracking. Headline hierarchy: 12px eyebrow, 30–38px page title, 18–20px section title, 13–15px body, 11px metadata.

### Brand Essence
IntentFence is an **operator-first control center for teams deploying autonomous agents**, built for people who need speed without surrendering authority. Personality: **exact, composed, protective**.

### Brand Voice
Headlines are short and declarative. CTAs describe the decision, not the feature. Microcopy explains why the system paused.

Example lines:
- “Autonomy is active. Authority is bounded.”
- “This action is outside the captured intent. Decide before execution.”

### Wordmark & Logo
The mark is a **split shield formed from two offset brackets**: the left bracket represents an agent’s open operating field, the right bracket represents the hard boundary. A single signal-green notch closes the gap, expressing a decision checkpoint. The wordmark uses a tight geometric sans with the “F” extended into a subtle fence-like terminal.

### Signature Brand Color
**Signal Green — #B9F227**

## File-level reminder
Every edited CSS/component/page file should begin with a short comment reminding the implementer: “Signal & Stewardship: evidence before decoration, asymmetric command layout, ink + warm paper + Signal Green, exact operator-first copy.”
