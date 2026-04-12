---
title: "TLA+ and PlusCal: Formal Verification for Distributed Systems"
date: 2026-04-11 16:00:00 -0700
categories: [Formal Methods]
tags: [tla-plus, pluscal, formal-verification, distributed-systems, model-checking]
---

TLA+ is a formal specification language for designing and verifying concurrent and distributed systems. PlusCal is an algorithm language that compiles to TLA+, giving you a more familiar imperative syntax while retaining the full power of TLA+'s model checker. Together, they let you find bugs in your system design before you write a single line of implementation code.

This isn't academic theory for its own sake. Amazon, Microsoft, Intel, and others use TLA+ in production to verify real systems — DynamoDB, S3, Azure Cosmos DB, Xbox 360 memory system. The bugs it finds are the kind that only surface under rare interleavings that no amount of testing would catch.

## Why Formal Verification

Testing checks that your code does the right thing for specific inputs. Formal verification checks that your design does the right thing for all possible states.

Consider a distributed lock:
- Testing: "I ran 10,000 lock/unlock cycles and it worked"
- TLA+: "I exhaustively checked every possible interleaving of 3 processes acquiring and releasing the lock, including crashes at every step, and the mutual exclusion property holds in all 847,293 reachable states"

The difference matters when you're building systems where a bug means data loss, split brain, or silent corruption.

## TLA+ Fundamentals

TLA+ describes systems as state machines. A specification has:

1. An initial state predicate (what the system looks like at startup)
2. A next-state relation (what transitions are allowed)
3. Invariants and temporal properties (what must always/eventually be true)

### A Simple Example: A Counter

```tla
---- MODULE Counter ----
EXTENDS Integers

VARIABLE count

Init == count = 0

Increment == count' = count + 1

Decrement == count > 0 /\ count' = count - 1

Next == Increment \/ Decrement

Spec == Init /\ [][Next]_count

CountNonNegative == count >= 0
====
```

Breaking this down:

- `VARIABLE count` — the state consists of a single variable
- `Init == count = 0` — the system starts with count at 0
- `Increment == count' = count + 1` — primed variables (`count'`) represent the next state
- `Decrement == count > 0 /\ count' = count - 1` — can only decrement if count > 0
- `Next == Increment \/ Decrement` — each step is either an increment or decrement
- `Spec == Init /\ [][Next]_count` — the full specification: start at Init, then repeatedly take Next steps
- `CountNonNegative == count >= 0` — an invariant we want to verify

The TLC model checker will explore every reachable state and verify that `CountNonNegative` holds in all of them.

### TLA+ Operators and Notation

| Syntax | Meaning |
|--------|---------|
| `x' = expr` | In the next state, x equals expr |
| `/\` | Logical AND (conjunction) |
| `\/` | Logical OR (disjunction) |
| `~` | Logical NOT |
| `=>` | Implies |
| `<=>` | If and only if |
| `\A x \in S : P(x)` | For all x in S, P(x) holds |
| `\E x \in S : P(x)` | There exists x in S where P(x) holds |
| `UNCHANGED vars` | These variables don't change in this step |
| `[Next]_vars` | Either Next happens or vars stay unchanged (stuttering) |
| `<<a, b, c>>` | A tuple (sequence) |
| `[key |-> val]` | A record (like a struct/map) |
| `DOMAIN f` | The domain of a function |
| `Cardinality(S)` | Number of elements in set S |

### Sets, Functions, and Sequences

TLA+ is built on set theory:

```tla
\* Sets
S == {1, 2, 3}
T == {x \in S : x > 1}          \* {2, 3}
U == {x * 2 : x \in S}          \* {2, 4, 6}
SUBSET S                          \* Power set: all subsets of S

\* Functions (maps from domain to range)
f == [x \in 1..3 |-> x * x]     \* f[1]=1, f[2]=4, f[3]=9
g == [f EXCEPT ![2] = 99]        \* Same as f but g[2]=99

\* Sequences (ordered tuples)
EXTENDS Sequences
seq == <<1, 2, 3>>
Append(seq, 4)                    \* <<1, 2, 3, 4>>
Head(seq)                         \* 1
Tail(seq)                         \* <<2, 3>>
Len(seq)                          \* 3
```

The `EXCEPT` syntax is how you update state functionally — you don't mutate, you describe the new state.

## PlusCal: TLA+ with Imperative Syntax

PlusCal looks like pseudocode but compiles to TLA+. It's the on-ramp for most people — you write algorithms in a familiar style, and the PlusCal translator generates the equivalent TLA+ specification that TLC can check.

### The Same Counter in PlusCal

```tla
---- MODULE CounterPC ----
EXTENDS Integers, TLC

(*--algorithm Counter
variables count = 0;

process Incrementer = 1
begin
  inc:
    while TRUE do
      count := count + 1;
    end while;
end process;

process Decrementer = 2
begin
  dec:
    while TRUE do
      await count > 0;
      count := count - 1;
    end while;
end process;

end algorithm; *)

\* BEGIN TRANSLATION
\* ... (auto-generated TLA+ goes here)
\* END TRANSLATION

CountNonNegative == count >= 0
====
```

### PlusCal Syntax

PlusCal has two flavors: P-syntax (Pascal-like) and C-syntax. P-syntax is more common:

```
\* Variables
variables x = 0, y = "hello", queue = <<>>;

\* Assignment
x := x + 1;

\* If/else
if x > 0 then
  x := x - 1;
elsif x = 0 then
  skip;
else
  x := 0;
end if;

\* While loop
while x < 10 do
  x := x + 1;
end while;

\* Either/or (nondeterministic choice)
either
  x := 1;
or
  x := 2;
or
  x := 3;
end either;

\* With (nondeterministic selection from a set)
with val \in {1, 2, 3} do
  x := val;
end with;

\* Await (block until condition is true)
await x > 0;

\* Assert (fail if condition is false)
assert x >= 0;

\* Print (for debugging)
print <<"x is", x>>;
```

### Labels: The Atomicity Boundary

Labels are the most important concept in PlusCal. Each label defines an atomic step — the model checker will not interleave other processes within a single label.

```
process Worker = 1
begin
  \* This is ONE atomic step:
  step1:
    x := x + 1;
    y := y + 1;

  \* This is ANOTHER atomic step:
  step2:
    z := x + y;
end process;
```

Between `step1` and `step2`, other processes can execute. Within `step1`, the two assignments happen atomically.

This is how you model real-world atomicity:
- A single label = one database transaction, one lock-protected critical section, one atomic CPU instruction
- Multiple labels = operations that can be interleaved by other threads/processes

Getting labels right is the art of PlusCal modeling. Too few labels (everything atomic) and you miss bugs. Too many labels (every line is a step) and the state space explodes.

### Processes

PlusCal processes model concurrent actors:

```
\* Single process
process Server = "server"
begin
  ...
end process;

\* Multiple identical processes (process set)
process Worker \in 1..3
begin
  \* self refers to the process ID (1, 2, or 3)
  work:
    result[self] := Compute(self);
end process;
```

Each process in a set runs the same code but has its own identity (`self`). The model checker explores all possible interleavings of all processes.

## A Real Example: Two-Phase Commit

Let's model the Two-Phase Commit (2PC) protocol — a coordinator asks participants to commit or abort a transaction.

```tla
---- MODULE TwoPhaseCommit ----
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS Participants

(*--algorithm TwoPhaseCommit
variables
  coordState = "init",
  partState = [p \in Participants |-> "working"],
  prepared = {},
  decision = "none";

process Coordinator = 0
begin
  propose:
    coordState := "waiting";

  collect:
    await prepared = Participants \/ \E p \in Participants : partState[p] = "aborted";
    if prepared = Participants then
      decision := "commit";
    else
      decision := "abort";
    end if;
    coordState := "decided";
end process;

process Participant \in Participants
begin
  respond:
    either
      \* Vote to commit
      partState[self] := "prepared";
      prepared := prepared \union {self};
    or
      \* Vote to abort
      partState[self] := "aborted";
    end either;

  finalize:
    await decision /= "none";
    if decision = "commit" then
      partState[self] := "committed";
    else
      partState[self] := "aborted";
    end if;
end process;

end algorithm; *)

\* BEGIN TRANSLATION
\* ... (auto-generated)
\* END TRANSLATION

\* Safety: if any participant committed, all must eventually commit
\* (no mixed outcomes)
Agreement ==
  \A p1, p2 \in Participants :
    ~ (partState[p1] = "committed" /\ partState[p2] = "aborted")

\* Safety: commit only if all participants prepared
CommitValidity ==
  decision = "commit" => prepared = Participants
====
```

Run TLC with `Participants = {1, 2, 3}` and it will check `Agreement` and `CommitValidity` across all possible interleavings of the coordinator and three participants, including every combination of commit/abort votes.

## The TLC Model Checker

TLC is the tool that actually verifies your specification. It performs exhaustive state-space exploration.

### How TLC Works

1. Starts at the initial state (defined by `Init` or PlusCal's `variables`)
2. Computes all possible next states from the current state
3. Checks invariants in each state
4. Adds unseen states to the queue
5. Repeats until all reachable states are explored (or a violation is found)

This is breadth-first search over the state graph. If TLC finds a state that violates an invariant, it produces a counterexample trace — the exact sequence of steps that leads to the bug.

### Running TLC

In the TLA+ Toolbox (IDE):

1. Create a new model
2. Set the specification (your `.tla` file)
3. Define constants (e.g., `Participants = {1, 2, 3}`)
4. Add invariants to check
5. Run

From the command line:

```bash
# Using the tla2tools.jar
java -jar tla2tools.jar -config MC.cfg MC.tla

# MC.cfg contains:
# SPECIFICATION Spec
# INVARIANT Agreement CommitValidity
# CONSTANT Participants = {1, 2, 3}
```

Or with the VS Code TLA+ extension, which provides inline model checking.

### State Space Management

The biggest practical challenge with TLC is state space explosion. With 3 processes and 5 variables each taking 10 values, you could have 10^15 states.

Strategies to manage this:

```
\* Use small model values for constants
CONSTANTS
  Participants = {p1, p2, p3}    \* 3, not 100
  MaxQueueLen = 3                 \* bound queues

\* Use symmetry sets (TLC optimization)
\* If participants are interchangeable, TLC can collapse symmetric states
CONSTANTS
  Participants = {p1, p2, p3}    \* declared as a symmetry set in the model

\* Use state constraints to bound exploration
\* In the model config:
STATE_CONSTRAINT
  count < 5
```

## Temporal Properties

Invariants check that something is true in every state. Temporal properties check behavior over time — things like "every request eventually gets a response" or "the system never gets stuck."

### Liveness vs Safety

| Property Type | Meaning | Example |
|--------------|---------|---------|
| Safety | "Nothing bad ever happens" | Mutual exclusion is never violated |
| Liveness | "Something good eventually happens" | Every lock request is eventually granted |

Safety properties are invariants — TLC checks them in every state. Liveness properties use temporal logic operators.

### Temporal Operators

```tla
\* Always: [] (box)
[]Invariant                    \* Invariant holds in every state

\* Eventually: <> (diamond)
<>(x = "done")                 \* x eventually equals "done"

\* Leads to: ~>
(x = "requested") ~> (x = "granted")
\* Whenever x is "requested", it eventually becomes "granted"

\* Always eventually (fairness/liveness):
[]<>(x = "ready")              \* x is "ready" infinitely often

\* Eventually always (stability):
<>[](x = "stable")             \* x eventually reaches "stable" and stays there
```

### Fairness

Without fairness constraints, TLC considers executions where a process never gets to run — which trivially violates liveness. Fairness says "every enabled action eventually executes."

```tla
\* Weak fairness: if an action is continuously enabled, it eventually executes
Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

\* Strong fairness: if an action is repeatedly enabled, it eventually executes
Spec == Init /\ [][Next]_vars /\ SF_vars(Next)
```

In PlusCal, fairness is declared on processes:

```
\* Weak fairness (default for most models)
fair process Worker \in 1..3

\* Strong fairness
fair+ process Worker \in 1..3
```

## Modeling Patterns

### Message Passing (Network Communication)

```tla
(*--algorithm MessagePassing
variables
  network = [src \in Nodes, dst \in Nodes |-> <<>>];  \* per-pair message queues

macro Send(src, dst, msg) begin
  network[src, dst] := Append(network[src, dst], msg);
end macro;

macro Receive(src, dst, msg) begin
  await Len(network[src, dst]) > 0;
  msg := Head(network[src, dst]);
  network[src, dst] := Tail(network[src, dst]);
end macro;
*)
```

### Modeling Failures

```
\* Process crash: nondeterministically stop executing
process Server \in Servers
variables alive = TRUE;
begin
  serve:
    while alive do
      either
        \* Normal operation
        HandleRequest();
      or
        \* Crash
        alive := FALSE;
      end either;
    end while;
end process;
```

### Modeling Network Partitions

```
\* Messages can be lost, duplicated, or reordered
macro UnreliableSend(src, dst, msg) begin
  either
    \* Message delivered
    network[dst] := Append(network[dst], msg);
  or
    \* Message lost
    skip;
  or
    \* Message duplicated
    network[dst] := Append(Append(network[dst], msg), msg);
  end either;
end macro;
```

### Modeling Timeouts

```
\* Timeout as nondeterministic choice
either
  \* Receive response before timeout
  await response[self] /= "none";
  result := response[self];
or
  \* Timeout fires
  result := "timeout";
end either;
```

## A Complete Example: Distributed Lock with Lease

Here's a more realistic example — a distributed lock with lease expiration, modeling the kind of thing you'd build on top of a coordination service:

```tla
---- MODULE DistributedLock ----
EXTENDS Integers, TLC

CONSTANTS Clients, MaxTime

(*--algorithm DistributedLock
variables
  lock = [holder |-> "none", expiry |-> 0],
  clock = 0;

fair process client \in Clients
variables myLease = 0;
begin
  acquire:
    while TRUE do
      tryLock:
        if lock.holder = "none" \/ clock >= lock.expiry then
          \* Lock is free or expired — acquire it
          lock := [holder |-> self, expiry |-> clock + 2];
          myLease := clock + 2;
        end if;

      criticalSection:
        if lock.holder = self /\ clock < myLease then
          \* We hold the lock and it hasn't expired
          \* Do critical section work
          skip;
        end if;

      release:
        if lock.holder = self then
          lock := [holder |-> "none", expiry |-> 0];
          myLease := 0;
        end if;
    end while;
end process;

fair process timer = "timer"
begin
  tick:
    while clock < MaxTime do
      clock := clock + 1;
    end while;
end process;

end algorithm; *)

\* BEGIN TRANSLATION
\* ... (auto-generated)
\* END TRANSLATION

\* Safety: at most one client in the critical section at a time
MutualExclusion ==
  \A c1, c2 \in Clients :
    c1 /= c2 =>
      ~ (pc[c1] = "criticalSection" /\ lock.holder = c1 /\ clock < c1 \* ...
         /\ pc[c2] = "criticalSection" /\ lock.holder = c2)
====
```

This model lets TLC explore what happens when leases expire while a client thinks it still holds the lock — a classic distributed systems bug.

## Tooling and Workflow

### Setup

```bash
# VS Code extension (recommended)
# Install "TLA+" extension by Markus Kuppe

# Or use the TLA+ Toolbox (standalone IDE)
# Download from: https://github.com/tlaplus/tlaplus/releases

# Command-line tools
# Download tla2tools.jar from the same releases page
```

### Development Workflow

1. Start with an English description of the algorithm/protocol
2. Identify the state variables and processes
3. Write the PlusCal algorithm
4. Define invariants (what should always be true)
5. Define liveness properties (what should eventually happen)
6. Run TLC with small constants
7. If TLC finds a violation, examine the error trace
8. Fix the algorithm, repeat
9. Gradually increase constants to check larger state spaces
10. Once satisfied, implement the verified design in your language of choice

### Reading Error Traces

When TLC finds a bug, it produces a trace like:

```
Error: Invariant MutualExclusion is violated.

State 1: <Initial predicate>
/\ lock = [holder |-> "none", expiry |-> 0]
/\ clock = 0

State 2: <tryLock in process 1>
/\ lock = [holder |-> 1, expiry |-> 2]
/\ clock = 0

State 3: <tick>
/\ lock = [holder |-> 1, expiry |-> 2]
/\ clock = 1

State 4: <tick>
/\ lock = [holder |-> 1, expiry |-> 2]
/\ clock = 2

State 5: <tryLock in process 2>
/\ lock = [holder |-> 2, expiry |-> 4]
/\ clock = 2
\* BUG: Process 1 still thinks it holds the lock (myLease = 2, clock = 2)
\* but process 2 just acquired it because the lease expired
```

This trace is gold — it shows you the exact interleaving that breaks your design.

## Best Practices

### Modeling

- Start simple — model the core algorithm first, add complexity incrementally
- Use PlusCal for algorithms, raw TLA+ for abstract specifications
- Keep the state space small during development (2-3 processes, small bounds)
- Model failures explicitly — crashes, network partitions, timeouts
- Use `either/or` for nondeterministic choices (models all possibilities)
- Label boundaries should match real atomicity boundaries in your implementation

### Invariants

- Write invariants before writing the algorithm — they're your requirements
- Start with type invariants (variables have expected types/ranges)
- Add safety invariants (mutual exclusion, no data loss, consistency)
- Add liveness properties last (they're harder to get right)
- If an invariant is violated, the bug is usually in the algorithm, not the invariant — but check both

### Performance

- Use symmetry sets for interchangeable processes
- Use state constraints to bound infinite models
- Use `CHOOSE` sparingly — it can explode the state space
- Profile with TLC's statistics output to understand where time is spent
- For very large state spaces, consider simulation mode (`-simulate` flag) which randomly samples traces instead of exhaustive checking

### From Spec to Implementation

- The TLA+ spec is the design document — keep it updated as the implementation evolves
- Map each PlusCal label to an atomic operation in your implementation
- Map each process to a thread, goroutine, or service
- Map `either/or` to runtime decisions (user input, network responses, timeouts)
- The spec doesn't tell you how to implement — it tells you what properties the implementation must satisfy

## Wrapping Up

TLA+ and PlusCal give you a way to think precisely about concurrent systems before building them. The model checker finds bugs that testing can't — race conditions, deadlocks, liveness violations, and subtle protocol errors that only manifest under specific interleavings. The investment is in learning to think in terms of state machines and invariants, but once you do, it changes how you design systems. You stop hoping your distributed protocol is correct and start knowing it is.
