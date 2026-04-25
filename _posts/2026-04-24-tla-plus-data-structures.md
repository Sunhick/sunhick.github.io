---
title: "TLA+ Data Structures: Sets, Functions, Sequences, Records, and Beyond"
date: 2026-04-24 14:00:00 -0700
categories: [Formal Methods]
tags: [tla-plus, pluscal, formal-verification, distributed-systems, data-structures, model-checking]
---

TLA+ has a small number of data structures — sets, functions, sequences, and records — but they compose into surprisingly expressive models. If you've read the [introductory article]({% post_url 2026-04-11-tla-plus-and-pluscal %}) and seen the basics, this goes deeper. We'll cover each structure in detail, show how to combine them to model real systems, and call out the performance traps that blow up your state space.

Everything in TLA+ is built on sets and functions. Sequences are functions from `1..n` to values. Records are functions from field names to values. Once you internalize this, the language clicks.

## Sets

Sets are the foundation. Every other data structure is defined in terms of them.

### Construction

{% raw %}
```plaintext
\* Enumeration
S == {1, 2, 3}
Colors == {"red", "green", "blue"}

\* Range
Nums == 1..10                        \* {1, 2, 3, ..., 10}

\* Filter (set comprehension with predicate)
Evens == {x \in 1..10 : x % 2 = 0}  \* {2, 4, 6, 8, 10}

\* Map (set comprehension with transformation)
Doubled == {x * 2 : x \in 1..5}     \* {2, 4, 6, 8, 10}

\* Cartesian product
Pairs == {1, 2} \X {"a", "b"}       \* {<<1,"a">>, <<1,"b">>, <<2,"a">>, <<2,"b">>}

\* Power set (all subsets)
SUBSET {1, 2}                        \* {{}, {1}, {2}, {1, 2}}

\* UNION: flatten a set of sets
UNION {{1, 2}, {2, 3}, {3, 4}}      \* {1, 2, 3, 4}
```
{% endraw %}

### Operations

```plaintext
\* Membership
3 \in {1, 2, 3}                      \* TRUE
4 \notin {1, 2, 3}                   \* TRUE

\* Subset check
{1, 2} \subseteq {1, 2, 3}          \* TRUE

\* Union, intersection, difference
{1, 2} \cup {2, 3}                  \* {1, 2, 3}
{1, 2} \cap {2, 3}                  \* {2}
{1, 2, 3} \ {2}                     \* {1, 3}

\* Cardinality (requires EXTENDS FiniteSets)
Cardinality({1, 2, 3})              \* 3

\* Quantifiers
\A x \in S : x > 0                  \* for all x in S, x > 0
\E x \in S : x > 5                  \* there exists x in S where x > 5
```

### Modeling with Sets

Sets are the natural choice for unordered collections where duplicates don't matter.

```plaintext
\* A pool of available worker IDs
VARIABLE freeWorkers
Init == freeWorkers = {"w1", "w2", "w3"}

\* Allocate a worker
Allocate(w) ==
  /\ w \in freeWorkers
  /\ freeWorkers' = freeWorkers \ {w}

\* Release a worker
Release(w) ==
  /\ w \notin freeWorkers
  /\ freeWorkers' = freeWorkers \cup {w}
```

Sets also model network messages naturally. A set of messages means unordered delivery — which is exactly what real networks give you:

```plaintext
VARIABLE messages

\* Send: add to the set
Send(m) == messages' = messages \cup {m}

\* Receive: pick any message from the set and remove it
Receive ==
  \E m \in messages :
    /\ Process(m)
    /\ messages' = messages \ {m}
```

### Performance: SUBSET and Cardinality

`SUBSET S` generates 2^|S| elements. `SUBSET {1..20}` is over a million sets. TLC has to enumerate all of them if they appear in a quantifier or a set comprehension. Keep the base set small, or avoid `SUBSET` entirely by modeling subsets as functions to `BOOLEAN`:

```plaintext
\* Instead of: chosen \in SUBSET Server
\* Use: chosen \in [Server -> BOOLEAN]
\* where chosen[s] = TRUE means s is in the subset

\* This is equivalent but TLC handles it more efficiently
\* for larger sets because it avoids materializing the power set
```

`Cardinality` from `FiniteSets` is fine for checking properties, but avoid it in enabling conditions of actions if the set is large — TLC recomputes it at every state.

## Functions

Functions in TLA+ are total mappings from a domain to a range. They're the workhorse for modeling state that's indexed by something — per-process state, per-node state, lookup tables.

### Construction

```plaintext
\* Function from domain to computed value
square == [x \in 1..5 |-> x * x]
\* square[1] = 1, square[2] = 4, ..., square[5] = 25

\* Constant function
zeros == [s \in Server |-> 0]

\* The set of ALL functions from domain D to range R
[D -> R]
\* [1..3 -> BOOLEAN] is the set of all functions mapping {1,2,3} to {TRUE, FALSE}
\* That's 2^3 = 8 functions

\* DOMAIN: get the domain of a function
DOMAIN square                        \* 1..5
```

### Updating with EXCEPT

Since TLA+ is functional (no mutation), you create new functions that differ from old ones:

```plaintext
\* Single update
f' = [f EXCEPT ![3] = 99]
\* f' is identical to f except f'[3] = 99

\* Multiple updates
f' = [f EXCEPT ![1] = 10, ![3] = 30]

\* Self-referential update (@ refers to the old value)
f' = [f EXCEPT ![3] = @ + 1]
\* f'[3] = f[3] + 1

\* Nested update (for functions of functions)
state' = [state EXCEPT ![server].term = @ + 1]
\* state'[server].term = state[server].term + 1
\* all other fields and servers unchanged
```

The `@` symbol is underused. It saves you from writing the full path to the old value:

```plaintext
\* Without @
log' = [log EXCEPT ![s] = Append(log[s], entry)]

\* With @
log' = [log EXCEPT ![s] = Append(@, entry)]
```

### Modeling with Functions

Per-process state is the most common use:

```plaintext
CONSTANTS Server
VARIABLES
  currentTerm,  \* [Server -> Nat]
  state,        \* [Server -> {"follower", "candidate", "leader"}]
  votedFor      \* [Server -> Server \cup {"none"}]

Init ==
  /\ currentTerm = [s \in Server |-> 0]
  /\ state = [s \in Server |-> "follower"]
  /\ votedFor = [s \in Server |-> "none"]
```

Lookup tables and caches:

```plaintext
\* A DNS cache: hostname -> IP address (or "miss")
VARIABLE cache

Init == cache = [h \in Hostnames |-> "miss"]

CacheHit(h) ==
  /\ cache[h] /= "miss"
  /\ result' = cache[h]

CacheFill(h, ip) ==
  cache' = [cache EXCEPT ![h] = ip]

CacheEvict(h) ==
  cache' = [cache EXCEPT ![h] = "miss"]
```

### Function Sets and Type Invariants

The set `[D -> R]` is all possible functions from `D` to `R`. This is essential for type invariants:

```plaintext
TypeOK ==
  /\ currentTerm \in [Server -> Nat]
  /\ state \in [Server -> {"follower", "candidate", "leader"}]
  /\ votedFor \in [Server -> Server \cup {"none"}]
```

It's also how you model nondeterministic initialization or choices:

```plaintext
\* Each server starts with an arbitrary term (for testing robustness)
Init == currentTerm \in [Server -> 0..3]
\* TLC will explore all possible initial assignments
```

### Performance: Function Sets

`[D -> R]` has `|R|^|D|` elements. `[1..5 -> BOOLEAN]` is 32 functions — fine. `[1..10 -> 1..10]` is 10 billion — not fine. Avoid quantifying over large function sets. If you need to pick an arbitrary function, constrain it:

```plaintext
\* Bad: TLC enumerates all possible vote assignments
\E votes \in [Server -> Server \cup {"none"}] : ...

\* Better: build the vote assignment incrementally through actions
\* Each server votes in its own action, one at a time
```

## Sequences

Sequences are ordered, indexed collections — TLA+'s version of arrays or lists. They're functions from `1..n` to values, with extra operations from the `Sequences` module.

### Construction and Operations

```plaintext
EXTENDS Sequences

\* Literal
seq == <<1, 2, 3>>

\* Empty
empty == <<>>

\* Basic operations
Head(<<1, 2, 3>>)                    \* 1
Tail(<<1, 2, 3>>)                    \* <<2, 3>>
Len(<<1, 2, 3>>)                     \* 3
Append(<<1, 2>>, 3)                  \* <<1, 2, 3>>

\* Concatenation
<<1, 2>> \o <<3, 4>>                 \* <<1, 2, 3, 4>>

\* Index access (1-based)
seq[1]                                \* 1
seq[3]                                \* 3

\* SubSeq(seq, start, end)
SubSeq(<<1, 2, 3, 4, 5>>, 2, 4)     \* <<2, 3, 4>>

\* SelectSeq(seq, Test) — filter elements
\* (requires a one-argument operator that returns BOOLEAN)
IsEven(x) == x % 2 = 0
SelectSeq(<<1, 2, 3, 4>>, IsEven)   \* <<2, 4>>
```

### Sequences as Queues, Stacks, and Logs

Sequences are the go-to for ordered data:

```plaintext
\* --- FIFO Queue ---
VARIABLE queue
Init == queue = <<>>

Enqueue(v) == queue' = Append(queue, v)

Dequeue ==
  /\ queue /= <<>>
  /\ queue' = Tail(queue)

Front == Head(queue)

\* --- Stack (LIFO) ---
VARIABLE stack
Init == stack = <<>>

Push(v) == stack' = <<v>> \o stack

Pop ==
  /\ stack /= <<>>
  /\ stack' = Tail(stack)

Top == Head(stack)

\* --- Append-only Log ---
VARIABLE log
Init == log = <<>>

AppendEntry(entry) == log' = Append(log, entry)

\* Get the last entry
LastEntry == log[Len(log)]

\* Check if two logs agree up to index i
LogsAgree(log1, log2, i) ==
  /\ i <= Len(log1)
  /\ i <= Len(log2)
  /\ SubSeq(log1, 1, i) = SubSeq(log2, 1, i)
```

### Modeling Message Channels

Sequences give you ordered, FIFO delivery — unlike sets which model unordered delivery:

```plaintext
\* Per-pair FIFO channels
VARIABLE network  \* [Server \X Server -> Seq(Message)]

Init == network = [pair \in Server \X Server |-> <<>>]

\* Send from src to dst
Send(src, dst, msg) ==
  network' = [network EXCEPT ![<<src, dst>>] = Append(@, msg)]

\* Receive at dst from src (FIFO order)
Receive(src, dst) ==
  /\ Len(network[<<src, dst>>]) > 0
  /\ LET msg == Head(network[<<src, dst>>])
     IN  /\ ProcessMessage(msg)
         /\ network' = [network EXCEPT ![<<src, dst>>] = Tail(@)]
```

Choose between sets and sequences based on what you're modeling:

| Model | Use | Delivery semantics |
|-------|-----|--------------------|
| Set of messages | `messages \cup {m}` | Unordered, deduplicated |
| Sequence per pair | `Append(chan[<<s,d>>], m)` | FIFO per pair |
| Sequence (global) | `Append(chan, m)` | Total order |
| Bag (multiset) | See Bags section below | Unordered, allows duplicates |

### Performance: Sequences

Sequences are the most common source of state space explosion. Every distinct ordering is a distinct state. A queue that can hold 5 messages from a set of 3 message types has hundreds of possible states — just for that one variable.

Bound your sequences:

```plaintext
\* In the spec: guard against unbounded growth
Enqueue(v) ==
  /\ Len(queue) < MaxQueueLen
  /\ queue' = Append(queue, v)

\* In the TLC model config:
CONSTRAINT
  \A s1, s2 \in Server : Len(network[<<s1, s2>>]) <= 3
```

Also avoid `Seq(S)` in type invariants if possible — it's the set of all finite sequences over `S`, which is infinite. TLC can check membership but can't enumerate it. Use a bounded version:

```plaintext
\* Bounded sequence type
BoundedSeq(S, n) == UNION {[1..i -> S] : i \in 0..n}

TypeOK == queue \in BoundedSeq(Message, MaxQueueLen)
```

## Records

Records are functions from string field names to values. They're TLA+'s structs.

### Construction and Access

```plaintext
\* Create a record
msg == [type |-> "request", src |-> "client1", seq |-> 42]

\* Access fields
msg.type                              \* "request"
msg.src                               \* "client1"

\* Update a field
msg' == [msg EXCEPT !.seq = msg.seq + 1]
\* or with @
msg' == [msg EXCEPT !.seq = @ + 1]

\* Record set: all possible records with these field types
MessageType == [
  type : {"request", "response"},
  src  : Server,
  seq  : Nat
]
\* This is the set of all records with field "type" in {"request","response"},
\* field "src" in Server, and field "seq" in Nat
```

Note the syntax difference: `|->` constructs a specific record, `:` defines a set of records.

### Nested Records

```plaintext
\* Node state with nested structure
nodeState == [
  id     |-> "node1",
  term   |-> 3,
  log    |-> <<[term |-> 1, cmd |-> "x=1"], [term |-> 3, cmd |-> "y=2"]>>,
  config |-> [votingMembers |-> {"n1", "n2", "n3"}, learners |-> {}]
]

\* Access nested fields
nodeState.config.votingMembers       \* {"n1", "n2", "n3"}
nodeState.log[2].cmd                 \* "y=2"

\* Update nested fields
nodeState' == [nodeState EXCEPT !.config.learners = @ \cup {"n4"}]
```

### Modeling with Records

Records are ideal for structured messages and complex per-entity state:

```plaintext
\* Protocol messages with different shapes
RequestVote == [
  type |-> "RequestVote",
  term : Nat,
  candidateId : Server,
  lastLogIndex : Nat,
  lastLogTerm : Nat
]

AppendEntries == [
  type |-> "AppendEntries",
  term : Nat,
  leaderId : Server,
  prevLogIndex : Nat,
  prevLogTerm : Nat,
  entries : Seq(LogEntry),
  leaderCommit : Nat
]

\* All message types
Message == RequestVote \cup AppendEntries

\* Dispatch on message type
HandleMessage(m) ==
  \/ m.type = "RequestVote" /\ HandleVote(m)
  \/ m.type = "AppendEntries" /\ HandleAppend(m)
```

### Records vs. Tuples

Tuples (`<<a, b, c>>`) are positional. Records (`[x |-> a, y |-> b]`) are named. Use records when the fields have distinct meanings — they make the spec self-documenting:

```plaintext
\* Hard to read: what's <<3, "node1", TRUE>>?
state == <<3, "node1", TRUE>>

\* Clear: term is 3, leader is node1, active is TRUE
state == [term |-> 3, leader |-> "node1", active |-> TRUE]
```

Use tuples for homogeneous ordered data (coordinates, pairs of related values) and records for heterogeneous named fields.

## Bags (Multisets)

The `Bags` module provides multisets — collections where elements can appear more than once. This is useful for modeling networks where the same message can be in flight multiple times.

```plaintext
EXTENDS Bags

\* A bag is a function from elements to their count
\* EmptyBag: no elements
\* SetToBag(S): each element of S appears once
\* BagToSet(B): the set of elements in B (ignoring counts)
\* BagIn(e, B): TRUE if e appears in B (count > 0)
\* BagUnion(B1, B2): combine bags (counts add)
\* BagOfAll(F, B): apply F to each element

VARIABLE msgBag

Init == msgBag = EmptyBag

\* Send: increment the count of this message
Send(m) == msgBag' = msgBag (+) SetToBag({m})

\* Receive: decrement the count (consume one copy)
Receive(m) ==
  /\ BagIn(m, msgBag)
  /\ msgBag' = msgBag (-) SetToBag({m})

\* Duplicate: add another copy
Duplicate(m) ==
  /\ BagIn(m, msgBag)
  /\ msgBag' = msgBag (+) SetToBag({m})
```

Bags model at-least-once delivery naturally. With a set, sending the same message twice is a no-op (sets deduplicate). With a bag, you get two copies, and a receiver can process each independently.

### When to Use Bags vs. Sets vs. Sequences

| Scenario | Data structure | Why |
|----------|---------------|-----|
| Messages can be lost, not duplicated | Set | Deduplication is fine, order doesn't matter |
| Messages can be duplicated | Bag | Need to track multiple copies |
| Messages delivered in FIFO order | Sequence | Order matters |
| Messages delivered in total order | Single sequence | Global ordering |
| At-most-once delivery | Set, remove on receive | Natural dedup |
| At-least-once delivery | Bag | Duplicates are the point |
| Exactly-once delivery | Set + processed tracking | Need both dedup and delivery guarantee |

## Structs of Arrays vs. Arrays of Structs

This is a modeling choice that comes up constantly. Say you have per-server state with a term, a role, and a log. Two ways to model it:

### Separate Variables (Structs of Arrays)

```plaintext
VARIABLES currentTerm, state, log

Init ==
  /\ currentTerm = [s \in Server |-> 0]
  /\ state = [s \in Server |-> "follower"]
  /\ log = [s \in Server |-> <<>>]

\* Update one field for one server
BecomeCandidate(s) ==
  /\ currentTerm' = [currentTerm EXCEPT ![s] = @ + 1]
  /\ state' = [state EXCEPT ![s] = "candidate"]
  /\ UNCHANGED log
```

### Single Variable (Array of Structs)

```plaintext
VARIABLE serverState

Init ==
  serverState = [s \in Server |->
    [term |-> 0, role |-> "follower", log |-> <<>>]]

\* Update one field for one server
BecomeCandidate(s) ==
  serverState' = [serverState EXCEPT
    ![s].term = @ + 1,
    ![s].role = "candidate"]
  \* log is implicitly unchanged (not mentioned in EXCEPT)
```

### Trade-offs

Separate variables:
- Easier `UNCHANGED` declarations — just list the variables that don't change
- TLC can sometimes optimize better because it tracks variable-level changes
- More verbose for actions that update multiple fields

Single variable:
- Cleaner when most actions touch multiple fields of the same entity
- Fewer `UNCHANGED` clauses (fields not in `EXCEPT` are automatically unchanged)
- Harder to use with `UNCHANGED` at the variable level (the whole record changes even if only one field did)

In practice, separate variables are more common in published TLA+ specs. The `UNCHANGED` ergonomics matter more than you'd think when you have 15 actions and 8 variables.

## Combining Data Structures: A Key-Value Store

Here's a practical example that combines everything — a linearizable key-value store with replication:

```plaintext
---- MODULE KVStore ----
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS Key, Value, Server, Nil

VARIABLES
  store,       \* [Server -> [Key -> Value \cup {Nil}]]
  opLog,       \* [Server -> Seq([key: Key, val: Value, op: {"put","get"}])]
  pending,     \* Set of in-flight operations (records)
  committed    \* Sequence of committed operations (total order)

vars == <<store, opLog, pending, committed>>

NullStore == [k \in Key |-> Nil]

Init ==
  /\ store = [s \in Server |-> NullStore]
  /\ opLog = [s \in Server |-> <<>>]
  /\ pending = {}
  /\ committed = <<>>

\* Client submits a put operation
ClientPut(k, v) ==
  /\ LET op == [key |-> k, val |-> v, op |-> "put"]
     IN  pending' = pending \cup {op}
  /\ UNCHANGED <<store, opLog, committed>>

\* Leader commits an operation
LeaderCommit ==
  /\ pending /= {}
  /\ \E op \in pending :
       /\ committed' = Append(committed, op)
       /\ pending' = pending \ {op}
       /\ UNCHANGED <<store, opLog>>

\* A server applies the next committed operation
Apply(s) ==
  /\ Len(opLog[s]) < Len(committed)
  /\ LET idx == Len(opLog[s]) + 1
         op  == committed[idx]
     IN
       /\ opLog' = [opLog EXCEPT ![s] = Append(@, op)]
       /\ IF op.op = "put"
          THEN store' = [store EXCEPT ![s][op.key] = op.val]
          ELSE UNCHANGED store
  /\ UNCHANGED <<pending, committed>>

Next ==
  \/ \E k \in Key, v \in Value : ClientPut(k, v)
  \/ LeaderCommit
  \/ \E s \in Server : Apply(s)

Spec == Init /\ [][Next]_vars

\* --- Properties ---

\* All servers that have applied up to index i agree on the store
Consistency ==
  \A s1, s2 \in Server :
    LET minLen == IF Len(opLog[s1]) <= Len(opLog[s2])
                  THEN Len(opLog[s1]) ELSE Len(opLog[s2])
    IN  minLen > 0 =>
          \* Servers that have applied the same prefix agree on state
          (SubSeq(opLog[s1], 1, minLen) = SubSeq(opLog[s2], 1, minLen))

\* Type invariant
TypeOK ==
  /\ store \in [Server -> [Key -> Value \cup {Nil}]]
  /\ opLog \in [Server -> Seq([key : Key, val : Value, op : {"put", "get"}])]
  /\ committed \in Seq([key : Key, val : Value, op : {"put", "get"}])
====
```

This spec uses:
- Functions for per-server state (`store`, `opLog`)
- Nested functions for the key-value mapping (`[Key -> Value]`)
- Records for operations (`[key |-> k, val |-> v, op |-> "put"]`)
- Sequences for ordered logs (`opLog`, `committed`)
- Sets for unordered pending operations (`pending`)

## CHOOSE: Picking a Value

`CHOOSE` selects an arbitrary element satisfying a predicate. It's deterministic — for the same predicate, it always returns the same value — but you don't know which one.

```plaintext
\* Pick the minimum of a set
Min(S) == CHOOSE x \in S : \A y \in S : x <= y

\* Pick any element from a non-empty set
Pick(S) == CHOOSE x \in S : TRUE

\* Pick a server with the highest term
MostCurrentServer ==
  CHOOSE s \in Server :
    \A t \in Server : currentTerm[s] >= currentTerm[t]
```

### CHOOSE Pitfalls

`CHOOSE` is not nondeterministic — it's a fixed but unknown choice. If you want TLC to explore all possibilities, use existential quantification or PlusCal's `with`:

```plaintext
\* WRONG: CHOOSE picks one fixed server, TLC doesn't explore others
HandleNext == LET s == CHOOSE s \in Server : TRUE
              IN DoSomething(s)

\* RIGHT: TLC explores all possible servers
HandleNext == \E s \in Server : DoSomething(s)

\* RIGHT (PlusCal): explores all choices
with s \in Server do
  DoSomething(s);
end with;
```

`CHOOSE` is fine for helper operators (like `Min`) where the result is uniquely determined. It's wrong for modeling nondeterministic behavior.

## Recursive Operators and Functions

TLA+ supports recursion, but TLC needs help with it.

### Recursive Operators

```plaintext
\* Sum of a set (recursive)
RECURSIVE SumSet(_)
SumSet(S) ==
  IF S = {} THEN 0
  ELSE LET x == CHOOSE x \in S : TRUE
       IN  x + SumSet(S \ {x})

\* Flatten a sequence of sequences
RECURSIVE Flatten(_)
Flatten(seqs) ==
  IF seqs = <<>> THEN <<>>
  ELSE Head(seqs) \o Flatten(Tail(seqs))
```

### Recursive Functions

```plaintext
\* Factorial
Factorial[n \in Nat] ==
  IF n = 0 THEN 1 ELSE n * Factorial[n - 1]

\* Fibonacci
Fib[n \in Nat] ==
  IF n <= 1 THEN n ELSE Fib[n - 1] + Fib[n - 2]
```

### Performance Warning

TLC doesn't memoize recursive operators (it does memoize recursive functions). Deep recursion is slow. For model checking, prefer iterative constructions when possible:

```plaintext
\* Instead of recursive sum, use a fold-like pattern
\* or just use the built-in operators when they exist

\* Sum of 1..n without recursion
Sum(n) == n * (n + 1) \div 2
```

If you must use recursion, keep the depth small and the base case tight.

## Operator Patterns for Clean Specs

### Helper Operators as Abstractions

Define operators to name your data access patterns:

```plaintext
\* Instead of repeating this everywhere:
\* currentTerm[s] > currentTerm[t]

\* Define once:
HasHigherTerm(s, t) == currentTerm[s] > currentTerm[t]
IsLeader(s) == state[s] = "leader"
Quorum == {Q \in SUBSET Server : Cardinality(Q) * 2 > Cardinality(Server)}
HasQuorum(votes) == \E Q \in Quorum : Q \subseteq votes
```

### Operator Overloading with LET

`LET ... IN` is your local binding — use it to avoid recomputing expressions and to name intermediate values:

```plaintext
HandleVote(s, m) ==
  LET newTerm   == IF m.term > currentTerm[s] THEN m.term ELSE currentTerm[s]
      grantVote == m.term >= currentTerm[s] /\ votedFor[s] \in {"none", m.src}
  IN
    /\ currentTerm' = [currentTerm EXCEPT ![s] = newTerm]
    /\ IF grantVote
       THEN /\ votedFor' = [votedFor EXCEPT ![s] = m.src]
            /\ Reply(s, m.src, [type |-> "VoteGranted", term |-> newTerm])
       ELSE /\ UNCHANGED votedFor
            /\ Reply(s, m.src, [type |-> "VoteRejected", term |-> newTerm])
```

### Type-Checking Operators

Build operators that serve as documentation and catch modeling errors:

```plaintext
\* Message constructors (ensure consistent structure)
MkRequestVote(term, candidate, lastIdx, lastTerm) ==
  [type         |-> "RequestVote",
   term         |-> term,
   candidateId  |-> candidate,
   lastLogIndex |-> lastIdx,
   lastLogTerm  |-> lastTerm]

\* Use the constructor instead of inline records
\* This way, if you add a field, you update one place
Send(s, t, MkRequestVote(currentTerm[s], s, Len(log[s]), LastTerm(s)))
```

## Wrapping Up

TLA+'s data structures are few but composable. Sets for unordered collections and membership tests. Functions for indexed state and mappings. Sequences for ordered data, queues, and logs. Records for structured entities. Bags when you need multiset semantics. The art is choosing the right combination for your model — and keeping the state space bounded so TLC can actually check it.

The performance traps are real: `SUBSET` on anything larger than ~15 elements, unbounded sequences, large function sets in quantifiers. Bound everything, use symmetry where you can, and start with the smallest constants that exercise your protocol's interesting behaviors.
