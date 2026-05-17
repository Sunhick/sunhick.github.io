---
title: "TLC Performance and State Space Management: Every Optimization Technique"
date: 2026-05-17 10:00:00 -0700
categories: [Formal Methods]
tags: [tla-plus, tlc, model-checking, performance, state-space, optimization]
---

TLC is an explicit-state model checker — it enumerates every reachable state. The state space grows exponentially with variables, constants, and interleavings. At some point, every TLA+ practitioner hits the wall where TLC runs out of memory or time. This is the complete guide to keeping it tractable.

## Understanding State Space Explosion

| Factor | Growth |
|--------|--------|
| N processes, each with k labels | k^N interleavings per step |
| Variable with domain size d | x d states per variable |
| Nondeterministic choice from set S | x S branches |
| Sequences up to length L over alphabet A | x A^L |

A spec with 3 processes, 4 labels each, 3 variables with domain size 10, and a queue of length 5 over 3 message types: that's 4^3 x 10^3 x 3^5 = 64 x 1000 x 243 = 15.5 million states. And that's a small spec.

The TLC status output tells you where you stand:

```plaintext
Model checking completed. No error has been found.
  Estimated reachable states: 12,450
  Distinct states found: 3,200
  Queue size: 0
```

Distinct states = states TLC stored in memory. Queue = BFS frontier (states yet to explore). If the queue keeps growing and distinct states are in the millions, you need optimization.

## Constraints: The First Line of Defense

### State Constraint

Prunes states where the constraint is violated — TLC doesn't explore their successors:

```plaintext
\* In the spec:
StateConstraint == x <= MaxX /\ Len(buffer) < 10

\* In .cfg:
CONSTRAINT StateConstraint
```

TLC generates the state (and checks invariants on it) but doesn't explore its children. This bounds unbounded growth — counters, queues, sets that accumulate.

### Action Constraint

Prunes transitions rather than states:

```plaintext
\* Block a specific transition:
ActionConstraint == ~(x = 5 /\ x' = x + 1)

\* In .cfg:
ACTION_CONSTRAINT ActionConstraint
```

Use case: "don't model more than K failures" or "don't allow this specific degenerate transition" without changing the spec itself.

### Depth Constraint

Limits BFS depth using TLCGet:

```plaintext
DepthConstraint == TLCGet("level") < 11

\* In .cfg:
CONSTRAINT DepthConstraint
```

### Comparison

| Mechanism | What it limits | Can hide bugs? |
|-----------|---------------|---------------|
| INVARIANT | Checks state, stops on violation | No (reports) |
| CONSTRAINT | Prunes states (skips children) | Yes |
| ACTION_CONSTRAINT | Prunes transitions | Yes |
| TLCGet("level") | Prunes by depth | Yes |

Constraints can hide bugs. You might constrain away the exact states where the bug lives. Use them for exploration, then gradually relax them as you gain confidence.

## Symmetry: Free State Space Reduction

If processes or values are interchangeable, many states are "the same up to renaming." TLC can check only one representative per equivalence class.

```plaintext
\* In the spec:
Symmetry == Permutations(Workers)

\* In .cfg:
SYMMETRY Symmetry
```

For N symmetric elements, this reduces the state space by up to N! (factorial):

| N | Reduction |
|---|-----------|
| 2 | 2x |
| 3 | 6x |
| 4 | 24x |
| 5 | 120x |
| 6 | 720x |

### When Symmetry is Safe

- Processes are identical (same code, same initial state)
- Values are used only for identity comparison, not arithmetic

### When Symmetry is Unsafe

- Processes have different roles (one is a leader)
- Constants appear in asymmetric formulas ("process 1 is the coordinator")
- Values are ordered (terms in Raft — term 2 > term 1 is meaningful)

## Views: Abstraction for the State Graph

Sometimes you have variables that bloat the state space but aren't relevant to the property you're checking.

```plaintext
\* In the spec:
View == <<pc, x>>

\* In .cfg:
VIEW View
```

TLC collapses all states that differ only in variables not in the view into a single representative. If you have a debugging variable `v` that's not in any invariant, excluding it from the view can massively reduce state count.

Danger: VIEW can make TLC miss bugs in the omitted variables. Only use when you're confident the omitted variables don't affect the property being checked.

## Constants: The Primary State Space Knob

### Start Small, Scale Up

```plaintext
\* Start with (find bugs fast):
N = 2, MaxBuf = 2, MaxVal = 3

\* Then increase:
N = 3, MaxBuf = 3, MaxVal = 5

\* Full confidence (if time permits):
N = 5, MaxBuf = 10, MaxVal = 10
```

Most bugs manifest with small constant values. A spec that passes with N=3 usually passes with N=100. The exceptions: bugs that require a specific quorum size, or off-by-one errors at boundaries.

### Model Values vs Ordinary Values

```plaintext
\* Ordinary value — TLC computes with it:
N = 3

\* Model value — TLC treats as an opaque token:
Null = Null
```

Model values are faster because TLC doesn't compute with them — just compares identity. Use them for process identifiers not used in arithmetic, message types, status enums, and null sentinels.

## Reducing Nondeterminism

### Overly General Initial States

```plaintext
\* BAD — 1001^3 = ~1 billion initial states:
Init == /\ x \in 0..1000
        /\ y \in 0..1000
        /\ z \in 0..1000

\* BETTER — representative subset:
Init == /\ x \in 0..5
        /\ y \in 0..5
        /\ z \in 0..5
```

### Large with/exists Sets

```plaintext
\* Expensive:
with val \in 1..1000 do ...

\* Cheaper — often finds same bugs:
with val \in {1, 50, 100, 500, 999, 1000} do ...
```

Pick boundary values and a few interior values. Most bugs don't depend on the exact value — they depend on the structure of the interleaving.

## TLC Operating Modes

### BFS (Default)

Breadth-first search. Finds shortest error traces. Uses more memory (stores full frontier). Best for safety checking.

### DFS (Depth-First Iterative Deepening)

```bash
java -jar tla2tools.jar -dfid 30 -config MC.cfg MCMySpec.tla
```

Uses less memory. Finds errors faster if they're deep. Error traces may be long. Good for exploring large state spaces with limited RAM.

### Simulation Mode

```bash
java -jar tla2tools.jar -simulate num=10000 -config MC.cfg MCMySpec.tla
```

Random walks through the state space. Never completes (no coverage guarantee). But finds bugs in huge specs where BFS/DFS are infeasible. Good for smoke testing before committing to a full run.

### Parallel TLC

```bash
java -jar tla2tools.jar -workers auto -config MC.cfg MCMySpec.tla
```

Linear speedup for BFS. Use all available cores for large state spaces.

## Memory and Performance Tuning

### JVM Settings

```bash
# Standard large model:
java -XX:+UseParallelGC -Xmx8g -Xms8g -jar tla2tools.jar ...

# Very large models:
java -XX:+UseParallelGC -Xmx32g -jar tla2tools.jar -workers auto ...
```

### Fingerprint Collision Risk

TLC stores state fingerprints (64-bit hashes), not full states. Collision probability for d distinct states: P(collision) is approximately d^2 / 2^65.

For 10^9 states: P is around 10%. That's a real risk. Use `-fp N` (N=0..63) to re-run with a different fingerprint seed if you're unsure.

### Checkpointing

```bash
java -jar tla2tools.jar -checkpoint 10 ...  # checkpoint every 10 minutes
```

Allows resuming interrupted runs.

## Profiling: Find the Bottleneck

### TLCGet for Instrumentation

```plaintext
TLCGet("distinct")      \* distinct states found so far
TLCGet("generated")     \* total states generated
TLCGet("level")         \* current BFS depth
TLCGet("diameter")      \* longest minimal path found
```

### Common Bottlenecks

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Millions of states, no bug | Constants too large | Reduce constants |
| State space grows forever | Unbounded variable | Add CONSTRAINT |
| Memory exhaustion | Too many distinct states | Symmetry, view, or disk |
| Very slow per-state | Expensive operators (Cardinality, Seq) | Simplify or cache |
| Initial state takes forever | Complex `\in` in Init | Simplify initial nondeterminism |

## Structural Techniques

### Separate MC Module

Keep the main spec clean and general. Put model-checking-specific overrides in a separate module:

```plaintext
---- MODULE MCMySpec ----
EXTENDS TLC, MySpec

\* Override constants with small values:
K = 100

\* Add constraints not in the actual spec:
StateConstraint == Len(buffer) < 5

\* Add debugging operators:
DebugInvariant == ...
====
```

Multiple MC modules for different scenarios: MCsmall, MClarge, MCfailure. The main spec never changes.

### LOCAL INSTANCE

```plaintext
LOCAL INSTANCE Naturals
LOCAL INSTANCE Integers
LOCAL INSTANCE TLC
```

`LOCAL` prevents imported names from polluting the namespace of modules that extend yours. Good hygiene for larger projects.

## Bounding Common Data Structures

### Sequences (Queues, Logs)

```plaintext
\* Don't use Seq(S) in type invariants — it's infinite.
\* Bound it:
TypeOK == buffer \in UNION {[1..n -> ValSet] : n \in 0..MaxLen}

\* Or simpler constraint:
CONSTRAINT Len(buffer) <= MaxBufSize
```

### Sets (Growing Collections)

```plaintext
CONSTRAINT Cardinality(messages) <= MaxMessages
```

### Integers (Counters)

```plaintext
CONSTRAINT x <= MaxX
```

### Functions/Maps

Already bounded if the domain is bounded: `[1..N -> 0..MaxVal]` has `(MaxVal+1)^N` states.

## Cost Estimation Before Running

Before hitting run, estimate:

```plaintext
States ~ |Init| x (avg branching factor)^depth
```

Where:
- `|Init|` = number of initial states (product of all `\in` domains)
- Branching factor = average number of enabled actions per state
- Depth = expected behavior length (or your constraint depth)

If the estimate is over 10^8, you need optimization before running.

## State Graph Visualization

For small specs (under 100 states), visualize the state graph:

```bash
# Generate DOT file:
java -jar tla2tools.jar -dump dot,colorize states.dot -config MC.cfg MCMySpec.tla

# Convert to image:
dot -Tpng states.dot -o states.png
```

Useful for understanding behavior, debugging liveness (find the cycle visually), and teaching.

## Decision Tree

```plaintext
State space too large?
|
+-- Unbounded variable (counter grows forever)?
|   --> Add CONSTRAINT
|
+-- Processes are symmetric?
|   --> Add SYMMETRY Permutations(ProcSet)
|
+-- Variables not in your property?
|   --> Consider VIEW to collapse them
|
+-- Constants too large?
|   --> Use MC module with smaller constants
|
+-- Initial nondeterminism is huge?
|   --> Constrain Init or use representative subset
|
+-- Single deep path (not wide)?
|   --> Use DFS or -dfid
|
+-- Impossibly large but want confidence?
|   --> Use -simulate for random testing
|
+-- None of the above?
    --> More hardware: -workers auto, more RAM
```

## Quick Reference

| Technique | Where | Effect | Risk |
|-----------|-------|--------|------|
| CONSTRAINT | .cfg | Prune states | Hides deep bugs |
| ACTION_CONSTRAINT | .cfg | Prune transitions | Hides specific paths |
| SYMMETRY | .cfg | / N! states | Wrong if asymmetric |
| VIEW | .cfg | Collapse variables | Misses bugs in hidden vars |
| Smaller constants | .cfg | Fewer states | Misses size-dependent bugs |
| Model values | .cfg | Faster comparison | Can't do arithmetic |
| -simulate | CLI | Random exploration | No completeness |
| -workers N | CLI | Parallel speedup | More memory |
| -dfid N | CLI | Depth-bounded DFS | Longer traces |
| MC module | Spec design | Clean separation | None |
| TLCGet("level") | Spec | Depth limit | Hides deep bugs |
| Permutations() | Spec | Symmetry set | Wrong if asymmetric |
