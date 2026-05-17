---
title: "Raw TLA+ Essentials: The Complete Guide to Writing Specs Without PlusCal"
date: 2026-05-16 16:00:00 -0700
categories: [Formal Methods]
tags: [tla-plus, formal-verification, distributed-systems, model-checking, raw-tla]
---

Raw TLA+ is the underlying mathematical specification language. PlusCal compiles *down* to it. Understanding raw TLA+ gives you maximum precision and unlocks refinement, module composition, and complex set-theoretic modeling that PlusCal can't express.

This is the reference I keep coming back to — every construct in the language, with the patterns that make it practical.

## The Core Mental Model

A TLA+ spec describes a state machine:

```plaintext
Spec == Init /\ [][Next]_vars
```

- **State** = assignment of values to all variables
- **Init** = predicate describing all valid initial states
- **Next** = predicate describing all valid state transitions
- **Behavior** = infinite sequence of states: s0, s1, s2, ...
- **`[][Next]_vars`** = every step either satisfies `Next` or is a stuttering step (nothing changes)

Everything else is building blocks for expressing Init and Next precisely.

## Variables and State

```plaintext
VARIABLES x, y, pc

\* Primed variables = value in the NEXT state
\* x  = value now
\* x' = value after the transition
```

The fundamental insight: an action is a predicate over pairs of states — it relates the current state to the next state using primed variables.

```plaintext
Increment == /\ x' = x + 1    \* x goes up by 1
             /\ y' = y         \* y stays the same (MUST be explicit)
```

UNCHANGED shorthand:

```plaintext
Increment == /\ x' = x + 1
             /\ UNCHANGED y    \* same as y' = y

\* For multiple variables:
Increment == /\ x' = x + 1
             /\ UNCHANGED <<y, z, pc>>
```

## Logic Operators

| Symbol | Meaning |
|--------|---------|
| `/\` | AND (conjunction) |
| `\/` | OR (disjunction) |
| `~` | NOT (negation) |
| `=>` | IMPLIES |
| `<=>` | IFF (if and only if) |
| `TRUE` | true |
| `FALSE` | false |

The formatting convention — bullet lists for conjunction and disjunction:

```plaintext
\* Conjunction list (AND):
Init == /\ x = 0
        /\ y = 1
        /\ pc = "start"

\* Disjunction list (OR):
Next == \/ ActionA
        \/ ActionB
        \/ ActionC
```

## Actions (State Transitions)

An action is a formula that relates the current state to the next state:

```plaintext
pick == /\ pc = "init"       \* guard: only enabled when pc = "init"
        /\ x' \in 0..1000    \* nondeterministic: x' can be ANY value 0-1000
        /\ pc' = "middle"    \* advance the program counter

AddOne == /\ pc = "middle"
          /\ x' = x + 1
          /\ pc' = "done"

Next == pick \/ AddOne        \* system takes ONE of these actions each step
```

An action is **enabled** in a state if there exists a next state satisfying the formula. If no action is enabled, that's a deadlock — TLC reports this.

### Action Composition Patterns

```plaintext
\* Guarded action (most common):
DoThing == /\ guard_condition      \* precondition
           /\ x' = new_value       \* effect
           /\ UNCHANGED <<y, z>>   \* frame condition

\* Nondeterministic action:
Pick == /\ x' \in SomeSet         \* TLC explores ALL choices
        /\ UNCHANGED y

\* Conditional action:
Step == /\ IF condition
              THEN x' = a
              ELSE x' = b
        /\ UNCHANGED y
```

## Quantifiers

```plaintext
\* For ALL elements in set:
\A x \in S : P(x)            \* TRUE if P holds for every x in S

\* There EXISTS an element in set:
\E x \in S : P(x)            \* TRUE if P holds for at least one x in S
```

In actions, existential quantification means nondeterminism — TLC explores all possible values:

```plaintext
Next == \E i \in 1..N :
            /\ x' = x + i
            /\ UNCHANGED y
```

Bounded quantifiers (`\A x \in S`) are what TLC can check. Unbounded quantifiers (`\A x : P(x)`) are only for proofs — TLC can't enumerate them.

## Sets

### Construction

```plaintext
{1, 2, 3}                    \* explicit enumeration
1..N                          \* integer range
S \union T                    \* union
S \intersect T                \* intersection
S \ T                         \* set difference
SUBSET S                      \* powerset (set of all subsets)
UNION S                       \* flattened union of a set of sets
```

### Filtering and Mapping

```plaintext
\* Filter: elements of S satisfying P
Evens == {x \in 1..100 : x % 2 = 0}

\* Map: transform each element
Squares == {x * x : x \in 1..10}

\* Combined (all pairs):
Products == {x * y : x \in 1..3, y \in 1..3}
```

### Predicates

```plaintext
x \in S                       \* membership
x \notin S                    \* non-membership
S \subseteq T                 \* subset or equal
Cardinality(S)                \* requires EXTENDS FiniteSets
IsFiniteSet(S)                \* requires EXTENDS FiniteSets
```

## Functions (The Universal Data Structure)

In TLA+, a function maps every element of its domain to a value. This is how you model arrays, maps, dictionaries, and records.

### Construction

```plaintext
\* Function from domain to value:
f == [x \in 1..3 |-> x * 2]          \* f[1]=2, f[2]=4, f[3]=6

\* Multi-argument:
g == [x \in 1..3, y \in 1..3 |-> x + y]

\* Constant function:
zeros == [x \in 1..N |-> 0]

\* Function as record:
msg == [type |-> "request", from |-> 1, to |-> 2, val |-> 42]
```

### Access and Domain

```plaintext
f[key]                        \* apply function to argument
DOMAIN f                      \* the set of keys
msg.type                      \* syntactic sugar for msg["type"]
```

### Update with EXCEPT

```plaintext
\* Single update:
f' = [f EXCEPT ![3] = 99]    \* f[3] becomes 99, rest unchanged

\* Multiple updates:
f' = [f EXCEPT ![1] = 10, ![2] = 20]

\* Self-referential update (@ = old value):
f' = [f EXCEPT ![k] = @ + 1] \* increment f[k]

\* Nested update:
f' = [f EXCEPT ![i][j] = v]  \* for 2D functions
f' = [f EXCEPT ![i].field = v]  \* for records in functions
```

### Function Sets

```plaintext
\* [S -> T] = set of ALL functions from S to T
[1..3 -> BOOLEAN]             \* 8 total functions (2^3)

\* Used in type invariants:
TypeOK == /\ states \in [1..N -> {"follower","candidate","leader"}]
          /\ votes  \in [1..N -> 0..N]
```

## Records

Records are functions with string domains:

```plaintext
\* Construction:
msg == [type |-> "ack", sender |-> 2, term |-> 5]

\* Access:
msg.type          \* "ack"
msg.sender        \* 2

\* Set of all records with given shape:
Messages == [type : {"req", "ack"}, sender : 1..N, term : Nat]
```

Note the syntax difference: `|->` constructs a specific record, `:` defines a set of records.

## Sequences (Tuples)

Requires `EXTENDS Sequences`:

```plaintext
<<1, 2, 3>>                   \* a sequence (1-indexed)
<<>>                          \* empty sequence

Head(s)                       \* first element
Tail(s)                       \* all but first
Append(s, e)                  \* add to end
Len(s)                        \* length
s[i]                          \* i-th element (1-indexed)
SubSeq(s, m, n)               \* subsequence from index m to n
s \o t                        \* concatenation
Seq(S)                        \* set of ALL finite sequences over S
                              \* WARNING: infinite — TLC can't enumerate
```

## CHOOSE — Deterministic Selection

```plaintext
\* Picks ONE fixed value satisfying P (always the same value):
min(S) == CHOOSE x \in S : \A y \in S : x <= y
max(S) == CHOOSE x \in S : \A y \in S : x >= y
```

CHOOSE vs `\E`:
- `\E x \in S : P(x)` — nondeterministic, TLC explores all possibilities
- `CHOOSE x \in S : P(x)` — deterministic, TLC picks one fixed value

Use CHOOSE for helper operators where the result is uniquely determined. Use `\E` for modeling nondeterministic behavior.

## LET/IN — Local Definitions

```plaintext
Next == LET half == x \div 2
            double == x * 2
        IN  /\ x' = IF x > 10 THEN half ELSE double
            /\ UNCHANGED y
```

## IF/THEN/ELSE and CASE

```plaintext
\* As an expression:
x' = IF y > 0 THEN y - 1 ELSE 0

\* CASE expression:
result == CASE x = 1 -> "one"
            [] x = 2 -> "two"
            [] x = 3 -> "three"
            [] OTHER -> "unknown"
```

## The Spec Formula

```plaintext
\* Standard spec:
Spec == Init /\ [][Next]_vars

\* With fairness:
Spec == Init /\ [][Next]_vars /\ WF_vars(Next)
```

Breaking it down:
- `Init` — initial state predicate
- `[][Next]_vars` — every step either satisfies Next or is a stuttering step
- `WF_vars(Next)` — weak fairness: if Next is continuously enabled, it must eventually happen

Why allow stuttering? It enables refinement — a high-level spec can "do nothing" while a low-level spec takes multiple steps for one logical operation.

## Temporal Logic

| Symbol | Name | Meaning |
|--------|------|---------|
| `[]P` | Always | P is true in every state |
| `<>P` | Eventually | P becomes true at some point |
| `[]<>P` | Infinitely Often | P is true infinitely often |
| `<>[]P` | Stability | P eventually becomes and stays true |
| `P ~> Q` | Leads-to | Whenever P is true, Q eventually becomes true |

### Safety vs Liveness

```plaintext
\* SAFETY: "bad things never happen" — checked as invariants
TypeOK == x \in Nat /\ y \in Nat
MutualExclusion == ~(pc[1] = "cs" /\ pc[2] = "cs")

\* LIVENESS: "good things eventually happen" — checked as properties
Termination == <>(pc = "Done")
Progress == [](request => <>response)
NoStarvation == \A p \in Procs : []<>(pc[p] = "cs")
```

## Fairness

Without fairness, the system can stutter forever — liveness properties would be trivially violated.

```plaintext
\* WEAK FAIRNESS — WF_vars(A):
\* If action A is CONTINUOUSLY enabled, it must eventually happen

\* STRONG FAIRNESS — SF_vars(A):
\* If action A is REPEATEDLY enabled (even if not continuously),
\* it must eventually happen

\* Per-action fairness:
Spec == Init /\ [][Next]_vars
        /\ WF_vars(ActionA)
        /\ SF_vars(ActionB)

\* Global fairness (common):
Spec == Init /\ [][Next]_vars /\ WF_vars(Next)
```

When to use which:
- WF: the action, once enabled, stays enabled until taken
- SF: the action flickers on/off (e.g., message arrives but might get lost before read)

## Constants and ASSUME

```plaintext
CONSTANTS N, MaxBuf, Null

ASSUME N \in Nat \ {0}
ASSUME MaxBuf \in Nat \ {0}
ASSUME Null \notin 1..N
```

## Module System

### EXTENDS (import everything)

```plaintext
---- MODULE MySpec ----
EXTENDS Integers, Sequences, FiniteSets, TLC
```

Standard modules: `Naturals`, `Integers`, `Reals`, `Sequences`, `FiniteSets`, `Bags`, `TLC`.

### INSTANCE (import with substitution)

```plaintext
---- MODULE MCfoo ----
EXTENDS TLC, Naturals

VARIABLE n
f == INSTANCE foo       \* import foo module, prefix with "f!"

Init == n = 2
Next == n' = IF n <= 1000 THEN f!Cube(n) - f!Square(n) ELSE n
Spec == Init /\ [][Next]_<<n>>
====
```

With variable/constant substitution:

```plaintext
I == INSTANCE OtherSpec WITH x <- myX, N <- myN
\* Now use: I!SomeOperator, I!SomeAction
```

Use cases: reusable operators, refinement mapping, decomposing large specs.

## Refinement

The killer feature of raw TLA+. Proving that a detailed spec implements a simpler spec.

```plaintext
---- MODULE LowLevel ----
VARIABLES x, y, tmp

Init == x = 0 /\ y = 0 /\ tmp = 0
Step1 == /\ tmp' = x + 1
         /\ UNCHANGED <<x, y>>
Step2 == /\ x' = tmp
         /\ tmp' = 0
         /\ UNCHANGED y
Next == Step1 \/ Step2
====

---- MODULE HighLevel ----
VARIABLES x, y

Init == x = 0 /\ y = 0
Increment == /\ x' = x + 1
             /\ UNCHANGED y
Next == Increment
====

---- MODULE Refinement ----
EXTENDS LowLevel
H == INSTANCE HighLevel WITH x <- x, y <- y
THEOREM Spec => H!Spec
====
```

In TLC, check `H!Spec` as a temporal property of the low-level spec.

## Recursive Operators and Functions

```plaintext
RECURSIVE Sum(_)
Sum(S) == IF S = {} THEN 0
          ELSE LET x == CHOOSE x \in S : TRUE
               IN  x + Sum(S \ {x})

RECURSIVE Factorial(_)
Factorial(n) == IF n = 0 THEN 1 ELSE n * Factorial(n - 1)
```

Recursive functions (TLC has limited support — prefer recursive operators):

```plaintext
Fib == [n \in Nat |-> IF n <= 1 THEN n
                      ELSE Fib[n-1] + Fib[n-2]]
```

## Higher-Order Operators

```plaintext
\* Operator that takes an operator as argument:
Apply(Op(_), x) == Op(x)
MapSet(Op(_), S) == {Op(x) : x \in S}
```

## Type Invariants

TLA+ is untyped. The convention is to write a `TypeOK` invariant that catches modeling errors early:

```plaintext
TypeOK == /\ x \in Nat
          /\ pc \in {"init", "middle", "done"}
          /\ buffer \in Seq(1..100)
          /\ Len(buffer) <= MaxBuf
          /\ states \in [1..N -> {"follower","candidate","leader"}]
          /\ votes \in [1..N -> 0..N]
          /\ leader \in (1..N) \union {Null}
```

## Common Patterns

### Explicit Program Counter

```plaintext
VARIABLES x, pc

Init == /\ x = 0
        /\ pc = "init"

ActionA == /\ pc = "init"
           /\ x' \in 0..1000
           /\ pc' = "middle"

ActionB == /\ pc = "middle"
           /\ x' = x + 1
           /\ pc' = "done"

Next == ActionA \/ ActionB
```

### Message Passing

```plaintext
VARIABLE messages

Send(m) == messages' = messages \union {m}
Receive(m) == /\ m \in messages
              /\ messages' = messages \ {m}
```

### History Variable

```plaintext
VARIABLE history

ActionWithHistory == /\ x' = x + 1
                     /\ history' = Append(history, x')
                     /\ UNCHANGED other_vars

MonotonicallyIncreasing ==
    \A i \in 1..(Len(history)-1) : history[i] < history[i+1]
```

## When Raw TLA+ is Essential

| Scenario | Why PlusCal can't do it |
|----------|------------------------|
| Refinement proofs | Need INSTANCE with substitution |
| Complex invariants with quantifiers | PlusCal's define block is limited |
| Custom fairness per-action | PlusCal only supports per-process fairness |
| Abstract models (no sequential flow) | No meaningful program counter |
| Composition of independent specs | Module system |
| Nondeterministic initial states | Init can express things PlusCal can't |

## TLC Model Checking Tips

```plaintext
\* Symmetry sets (reduces state space by N!):
\* In .cfg: SYMMETRY Permutations(1..N)

\* State constraint (limits exploration):
\* In .cfg: CONSTRAINT StateConstraint
StateConstraint == x < 100 /\ Len(buffer) < 10

\* Deadlock checking:
\* In .cfg: CHECK_DEADLOCK TRUE
```

## Operator Precedence (high to low)

1. `[]`, `<>` (temporal)
2. `~` (not)
3. `/\` (and)
4. `\/` (or)
5. `=>` (implies)
6. `<=>` (iff)
7. `~>` (leads-to)

When in doubt, use parentheses.

## The Spec Skeleton

```plaintext
---- MODULE MySystem ----
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS N, MaxVal, Null
ASSUME N \in Nat \ {0}

VARIABLES x, y, messages, pc
vars == <<x, y, messages, pc>>

\* --- Type invariant ---
TypeOK == /\ x \in 0..MaxVal
          /\ y \in 0..MaxVal
          /\ messages \subseteq [type : {"req","ack"}, val : 0..MaxVal]
          /\ pc \in [1..N -> {"idle","working","done"}]

\* --- Initial state ---
Init == /\ x = 0
        /\ y = 0
        /\ messages = {}
        /\ pc = [i \in 1..N |-> "idle"]

\* --- Actions ---
DoWork(i) == /\ pc[i] = "idle"
             /\ x' = x + 1
             /\ pc' = [pc EXCEPT ![i] = "working"]
             /\ UNCHANGED <<y, messages>>

Finish(i) == /\ pc[i] = "working"
             /\ y' = y + x
             /\ pc' = [pc EXCEPT ![i] = "done"]
             /\ UNCHANGED <<x, messages>>

\* --- Next state ---
Next == \E i \in 1..N : DoWork(i) \/ Finish(i)

\* --- Spec with fairness ---
Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

\* --- Properties ---
Safety == x + y <= MaxVal * N
Liveness == \A i \in 1..N : <>(pc[i] = "done")

====
```
