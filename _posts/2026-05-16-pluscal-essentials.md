---
title: "PlusCal Essentials: The Complete Guide to Modeling Concurrent Systems"
date: 2026-05-16 15:00:00 -0700
categories: [Formal Methods]
tags: [tla-plus, pluscal, formal-verification, distributed-systems, model-checking, concurrency]
---

PlusCal is an algorithmic language that transpiles into TLA+. You write imperative-looking code, the translator generates the TLA+ spec underneath, and the model checker (TLC) exhaustively explores every possible interleaving. It's the fastest path from "I have a concurrent algorithm" to "I've verified it's correct."

This is the complete reference — every construct, every pattern, every gotcha.

## Structure and Skeleton

Every PlusCal spec lives inside a TLA+ module:

```plaintext
---- MODULE MySpec ----
EXTENDS Integers, TLC, Sequences, FiniteSets

CONSTANTS ...

(*--algorithm MyAlgorithm
variables ...;

define
  \* Operators visible to TLC (invariants, helpers)
end define;

macro MyMacro(args) begin ... end macro;

procedure MyProc(args) begin ... end procedure;

\* Single-process or multi-process body here

end algorithm; *)

\* BEGIN TRANSLATION
\* ... (auto-generated TLA+) ...
\* END TRANSLATION

\* Additional TLA+ properties can go here
====
```

The algorithm block goes inside `(* ... *)` — it's technically a TLA+ comment. You must run the PlusCal translator before TLC (it fills the TRANSLATION section). `EXTENDS` goes at the module level, not inside the algorithm.

## Variables

### Global Variables

```plaintext
variables
    x = 0,
    y \in 1..5,           \* nondeterministic — TLC explores ALL values
    queue = <<>>,         \* sequence
    seen = {};            \* set
```

`=` assigns a concrete initial value. `\in` assigns nondeterministically from a set — TLC explores all possibilities as separate initial states.

### Process-Local Variables

```plaintext
process Worker \in 1..3
variable local_count = 0, buffer = <<>>;
begin ...
```

Each process instance gets its own copy. In the generated TLA+, these become functions indexed by `self`: `local_count[self]`.

## Labels (The Atomic Unit)

Labels are the most important concept in PlusCal. A label defines an atomic step — everything between two labels executes in a single state transition. Other processes cannot interleave within a label.

```plaintext
begin
A:                          \* one atomic step
    x := x + 1;
    y := y * 2;
B:                          \* another atomic step
    z := x + y;
```

Between A and B, other processes can run. Within A, the two assignments happen atomically.

### When You Must Have a Label

1. At the start of each process/procedure body
2. Before a `while` loop
3. After a `call` to a procedure
4. After a `return` from a procedure
5. After `either`, `with`, or `if` if another statement follows that should be a separate step

The more labels you add, the more interleavings TLC explores, and the more bugs you find. Too few labels and you miss concurrency bugs. Too many and the state space explodes.

## Control Flow

### If/Else

```plaintext
if condition then
    x := 1;
elsif other_condition then
    x := 2;
else
    x := 3;
end if;
```

### While Loop

```plaintext
Loop:                       \* label required before while
    while x < 10 do
        x := x + 1;
    end while;
```

### Either/Or (Nondeterministic Choice)

```plaintext
either
    x := x + 1;            \* TLC explores this path
or
    x := x - 1;            \* AND this path
or
    skip;                   \* AND this path
end either;
```

TLC exhaustively explores all branches. This models choices the environment could make — network delivering or dropping a message, a process crashing or continuing, a user clicking one button or another.

### With (Nondeterministic Selection)

```plaintext
with val \in 1..5 do        \* TLC tries ALL values in the set
    x := x + val;
end with;
```

### Goto

```plaintext
A:
    if x > 10 then
        goto Done;          \* jump to built-in "Done" label
    end if;
B:
    x := x + 1;
    goto A;
```

## The define Block

The `define` block creates TLA+ operators — used for invariants, helpers, and temporal properties:

```plaintext
define
    \* Safety invariant
    BalanceNonNeg == balance >= 0

    \* Helper operator
    Total == balance + pending

    \* Type invariant
    TypeOK == /\ balance \in Int
              /\ status \in {"open", "closed"}

    \* Temporal property
    EventuallyDone == <>(pc = "Done")
end define;
```

Invariants go in TLC's model config as "Invariant" (checked in every state). Temporal properties go as "Temporal Property" (checked over entire behaviors, requires fairness).

## Macros

Macros are textual substitution — they don't introduce a new label or step. Everything in the macro executes atomically within the caller's label.

```plaintext
macro increment(var, amount)
begin
    var := var + amount;
end macro;
```

Rules:
- No labels inside macros
- No `while`, `call`, `return`, `goto`
- `await` and `assert` are allowed

The classic use — atomic test-and-set:

```plaintext
macro acquire(lock)
begin
    await lock = 0;         \* blocks until lock is free
    lock := 1;              \* acquire atomically (same label as caller)
end macro;
```

## Procedures

Procedures are like function calls — they introduce labels and new steps, meaning other processes can interleave during a procedure call.

```plaintext
procedure Transfer(from, to, amount)
variable tmp;
begin
CheckBalance:
    if balance[from] >= amount then
DoTransfer:
        balance[from] := balance[from] - amount;
        balance[to] := balance[to] + amount;
    end if;
Return:
    return;
end procedure;
```

Rules:
- Must have at least one label
- Can have local variables
- Called with `call Transfer(a, b, 50);`
- After a `call`, the next statement must be at a new label
- Use `return;` to go back to the caller

```plaintext
begin
Start:
    call Transfer("alice", "bob", 50);
AfterTransfer:                  \* REQUIRED: label after call
    print "done";
```

## Single-Process vs Multi-Process

### Single Process

```plaintext
(*--algorithm Simple
variables x = 0;
begin
    x := x + 1;
end algorithm; *)
```

### Multi-Process

```plaintext
(*--algorithm Concurrent
variables shared = 0;

process Worker \in 1..3      \* 3 instances (self = 1, 2, or 3)
variable local = 0;
begin
Work:
    local := shared;
Update:
    shared := local + 1;
end process;

process Monitor = "mon"       \* single named instance
begin
Check:
    while TRUE do
        assert shared <= 3;
    end while;
end process;

end algorithm; *)
```

| | Single Process | Multi-Process |
|---|---|---|
| Processes | One implicit | One or more explicit |
| `self` | N/A | Built-in: current process ID |
| Interleaving | None | TLC explores all interleavings |
| `pc` | Single value | Function: `pc[self]` |

### Process ID Patterns

```plaintext
process P \in 1..N          \* N instances, self in 1..N
process P \in {"a","b"}     \* 2 instances, self in {"a","b"}
process P = 0               \* exactly 1 instance, self = 0
process P = "coordinator"   \* exactly 1 instance
```

## await (Blocking)

`await` blocks the process until the condition becomes true. Another process must make progress to unblock it.

```plaintext
lock:
    await sem = 1;      \* blocks until sem = 1
    sem := 0;           \* acquire (atomic with await — same label)
```

`await` + assignment in the same label = atomic test-and-set. This is how you model locks correctly.

## assert, print, skip

```plaintext
\* Fails model checking immediately if false at this point:
assert x >= 0;

\* Debugging output to TLC console:
print <<"Process", self, "sees x =", x>>;

\* No-op (useful in either/or branches):
skip;
```

`assert` is imperative — it checks at a specific execution point. Invariants (in `define`) are checked in every reachable state.

## Assignment Semantics

All assignments in a single label take effect simultaneously:

```plaintext
A:
    x := y;         \* these see the OLD values of x and y
    y := x;         \* so this swaps x and y!
```

You cannot assign to the same variable twice in one label:

```plaintext
\* ILLEGAL:
A:
    x := x + 1;
    x := x + 1;    \* ERROR: double assignment to x
```

## Fairness

Without fairness, the system can stutter forever — a process that's always enabled might never run, trivially violating liveness properties.

```plaintext
fair process Worker \in 1..N       \* weak fairness
fair+ process Worker \in 1..N      \* strong fairness
```

- **Weak fairness (fair):** if an action is continuously enabled, it must eventually happen
- **Strong fairness (fair+):** if an action is repeatedly enabled (even intermittently), it must eventually happen

Use weak fairness for most things. Use strong fairness for actions that might be briefly disabled between enables (e.g., a message that arrives, gets preempted, arrives again).

## Common Patterns

### Lock / Mutex

```plaintext
variables lock = 0;

process P \in 1..N
begin
Acquire:
    await lock = 0;
    lock := self;       \* atomic test-and-set
Critical:
    \* ... critical section ...
Release:
    lock := 0;
    goto Acquire;
end process;
```

### Channel / Message Passing

```plaintext
variables chan = <<>>;

process Sender = 1
begin
Send:
    chan := Append(chan, "msg");
end process;

process Receiver = 2
begin
Recv:
    await Len(chan) > 0;
    with msg = Head(chan) do
        chan := Tail(chan);
        print msg;
    end with;
end process;
```

### Nondeterministic Failure

```plaintext
process Node \in 1..N
variable alive = TRUE;
begin
Run:
    while alive do
        either
            \* normal operation
            x := x + 1;
        or
            \* crash
            alive := FALSE;
        end either;
    end while;
end process;
```

### Rate Limiter (Macro Pattern)

```plaintext
macro make_calls(n)
begin
    await made_calls <= max_calls - n;
    made_calls := made_calls + n;
    assert made_calls <= max_calls;
end macro;
```

## Data Structures Quick Reference

### Sets

```plaintext
S = {1, 2, 3}
S = 1..100
\in, \notin, \union, \intersect, \subseteq, SUBSET
Cardinality(S)          \* needs FiniteSets
```

### Sequences

```plaintext
seq = <<1, 2, 3>>
Append(seq, 4)          \* <<1,2,3,4>>
Head(seq)               \* 1
Tail(seq)               \* <<2,3>>
Len(seq)                \* 3
seq[1]                  \* 1 (1-indexed)
s1 \o s2               \* concatenation
```

### Functions (Maps)

```plaintext
f = [x \in 1..3 |-> x * 2]
f[key]                  \* access
DOMAIN f                \* domain set
[f EXCEPT ![key] = val] \* update
[f EXCEPT ![k] = @ + 1] \* @ = old value
```

### Records

```plaintext
r = [type |-> "request", sender |-> "alice", value |-> 42]
r.type                  \* "request"
```

## What TLC Actually Does

When you translate and run, TLC:
1. Starts from all states satisfying `Init` (including nondeterministic `\in` choices)
2. Explores all possible `Next` steps (all interleavings of all processes at all labels)
3. In each state, checks your invariants
4. Over behaviors (infinite paths), checks temporal properties

The generated TLA+ contains:
- `Init` — initial state predicate
- `Next` — disjunction of all possible actions
- `Spec` — `Init /\ [][Next]_vars` (with fairness if `fair` processes)
- `vars` — tuple of all variables

## PlusCal vs Raw TLA+

| Use PlusCal when... | Use raw TLA+ when... |
|---|---|
| Imperative control flow | Complex set comprehensions |
| Modeling algorithms step-by-step | Module composition / refinement |
| Automatic interleaving of processes | CHOOSE or recursive operators |
| Quick iteration on concurrent systems | Custom per-action fairness |
| Clear sequential logic | Abstract models without control flow |

## Debugging Checklist

1. **Deadlock found?** — Missing a terminating stuttering step, or `await` conditions can never all be satisfied simultaneously
2. **Invariant violated?** — Read the error trace step by step. Which interleaving caused the bug?
3. **State space explosion?** — Reduce constants, use symmetry sets, constrain `\in` sets
4. **Liveness violated with stuttering?** — Add `fair` to your processes

## Quick Reference

| Construct | Syntax |
|---|---|
| Variable init | `variables x = 0, y \in S;` |
| Assignment | `x := expr;` |
| If | `if C then ... elsif ... else ... end if;` |
| While | `while C do ... end while;` |
| Nondeterministic choice | `either ... or ... end either;` |
| Nondeterministic select | `with v \in S do ... end with;` |
| Block until condition | `await condition;` |
| Assertion | `assert condition;` |
| Macro | `macro M(args) begin ... end macro;` |
| Procedure | `procedure P(args) variable ...; begin L: ... return; end procedure;` |
| Call procedure | `call P(args);` |
| Process set | `process P \in S variable ...; begin L: ... end process;` |
| Process single | `process P = id begin L: ... end process;` |
| Fair process | `fair process P \in S` / `fair+ process` |
| Goto | `goto LabelName;` |
| Skip | `skip;` |
| Print | `print expr;` |
