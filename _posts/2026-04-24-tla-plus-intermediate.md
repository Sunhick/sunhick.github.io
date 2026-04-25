---
title: "TLA+ in Practice: Refinement, Composition, and Real Protocol Verification"
date: 2026-04-24 10:00:00 -0700
categories: [Formal Methods]
tags: [tla-plus, pluscal, formal-verification, distributed-systems, model-checking, refinement, consensus]
---

The [introductory article]({% post_url 2026-04-11-tla-plus-and-pluscal %}) covered the fundamentals — state machines, PlusCal syntax, invariants, and basic model checking. This picks up where that left off. We'll get into refinement mappings, spec composition, modeling real protocols with nuance, and the practical techniques that separate a toy spec from one that actually catches bugs in production designs.

## Refinement: Connecting Specs at Different Abstraction Levels

The most powerful idea in TLA+ that most introductions skip is refinement. You write a high-level spec that captures *what* the system should do, then a lower-level spec that describes *how* it does it, and you prove the lower-level spec implements the higher-level one.

This is how you manage complexity. You don't verify a full Raft implementation against raw safety properties — you verify that Raft refines a simpler consensus spec.

### The Idea

A spec `L` (low-level) refines spec `H` (high-level) if every behavior of `L` is also a behavior of `H`, after mapping `L`'s variables to `H`'s variables. That mapping is the refinement mapping.

```plaintext
---- MODULE AbstractQueue ----
VARIABLE queue

Init == queue = <<>>

Enqueue(v) == queue' = Append(queue, v)

Dequeue == queue /= <<>> /\ queue' = Tail(queue)

Next == (\E v \in {"a", "b", "c"} : Enqueue(v)) \/ Dequeue

Spec == Init /\ [][Next]_queue
====
```

Now a concrete implementation using a circular buffer:

```plaintext
---- MODULE CircularBuffer ----
EXTENDS Integers, Sequences

CONSTANTS Size

VARIABLES buf, head, tail, count

Init ==
  /\ buf = [i \in 1..Size |-> "empty"]
  /\ head = 1
  /\ tail = 1
  /\ count = 0

Enqueue(v) ==
  /\ count < Size
  /\ buf' = [buf EXCEPT ![tail] = v]
  /\ tail' = (tail % Size) + 1
  /\ count' = count + 1
  /\ UNCHANGED head

Dequeue ==
  /\ count > 0
  /\ head' = (head % Size) + 1
  /\ count' = count - 1
  /\ UNCHANGED <<buf, tail>>

Next == (\E v \in {"a", "b", "c"} : Enqueue(v)) \/ Dequeue

Spec == Init /\ [][Next]_<<buf, head, tail, count>>

\* --- Refinement mapping ---
\* Reconstruct the abstract queue from the circular buffer state
AbstractQueue == INSTANCE AbstractQueue WITH
  queue <- IF count = 0
           THEN <<>>
           ELSE [i \in 1..count |->
                   buf[((head + i - 2) % Size) + 1]]
====
```

The `INSTANCE ... WITH` statement is the refinement mapping. It says: "take the `AbstractQueue` module and substitute its `queue` variable with this expression computed from my concrete state." If TLC can verify that `AbstractQueue!Spec` holds under this mapping, then `CircularBuffer` correctly implements `AbstractQueue`.

You check this by adding `AbstractQueue!Spec` as a temporal property in your TLC model for `CircularBuffer`.

### Why This Matters

Refinement lets you:

- Verify a complex protocol against a simple, obviously-correct spec
- Build confidence incrementally — verify each layer against the one above
- Separate concerns — the abstract spec captures safety properties, the concrete spec captures the mechanism
- Reuse specs — multiple implementations can refine the same abstract spec

In practice, you'll often have three levels:

1. A safety spec (just the properties, almost trivially correct)
2. A protocol spec (the algorithm, verified against the safety spec)
3. An implementation-level spec (closer to real code, verified against the protocol spec)

## Spec Composition with INSTANCE

Real systems are built from components. TLA+ handles this through `INSTANCE`, which lets you import and parameterize other specifications.

### Parameterized Modules

```plaintext
---- MODULE Channel ----
\* A generic reliable FIFO channel
CONSTANTS Message

VARIABLE chan

Init == chan = <<>>

Send(m) == m \in Message /\ chan' = Append(chan, m)

Receive(m) ==
  /\ chan /= <<>>
  /\ m = Head(chan)
  /\ chan' = Tail(chan)

Next == \E m \in Message : Send(m) \/ Receive(m)
====
```

Now use it in a larger spec:

```plaintext
---- MODULE ClientServer ----
EXTENDS Integers

CONSTANTS Request, Response

VARIABLES reqChan, respChan, serverState

ReqChannel == INSTANCE Channel WITH
  Message <- Request, chan <- reqChan

RespChannel == INSTANCE Channel WITH
  Message <- Response, chan <- respChan

Init ==
  /\ ReqChannel!Init
  /\ RespChannel!Init
  /\ serverState = "idle"

ClientSend ==
  \E r \in Request :
    /\ ReqChannel!Send(r)
    /\ UNCHANGED <<respChan, serverState>>

ServerProcess ==
  \E r \in Request, resp \in Response :
    /\ ReqChannel!Receive(r)
    /\ RespChannel!Send(resp)
    /\ serverState' = "processing"

ClientReceive ==
  \E resp \in Response :
    /\ RespChannel!Receive(resp)
    /\ UNCHANGED <<reqChan, serverState>>

Next == ClientSend \/ ServerProcess \/ ClientReceive

Spec == Init /\ [][Next]_<<reqChan, respChan, serverState>>
====
```

This is modular specification. The `Channel` module knows nothing about clients or servers. `ClientServer` composes two channel instances with application logic. You can swap `Channel` for an `UnreliableChannel` to model network failures without touching the rest of the spec.

### Naming Conventions for Multi-Module Specs

When your spec grows beyond a single file, keep things navigable:

- One module per file, file name matches module name
- Prefix instance names with their role: `ReqChannel`, `RespChannel`, not `C1`, `C2`
- Put the top-level spec (the one TLC checks) in a module named after the system
- Put the model configuration in `MC.tla` and `MC.cfg`

## Modeling Real Protocols: Raft Consensus (Simplified)

Let's model the leader election portion of Raft. This is more involved than the Two-Phase Commit example from the intro article, and it shows how to handle message-based protocols with multiple message types.

```plaintext
---- MODULE RaftLeaderElection ----
EXTENDS Integers, FiniteSets, Sequences, TLC

CONSTANTS Server, MaxTerm

VARIABLES
  currentTerm,   \* [Server -> Int] each server's current term
  votedFor,      \* [Server -> Server \cup {"none"}] who each server voted for
  state,         \* [Server -> {"follower", "candidate", "leader"}]
  messages       \* Set of messages in the network

vars == <<currentTerm, votedFor, state, messages>>

\* Message types
RequestVote(src, dst, term) ==
  [type |-> "RequestVote", src |-> src, dst |-> dst, term |-> term]

VoteGranted(src, dst, term) ==
  [type |-> "VoteGranted", src |-> src, dst |-> dst, term |-> term]

\* --- Initial state ---
Init ==
  /\ currentTerm = [s \in Server |-> 0]
  /\ votedFor = [s \in Server |-> "none"]
  /\ state = [s \in Server |-> "follower"]
  /\ messages = {}

\* --- Actions ---

\* A server times out and starts an election
StartElection(s) ==
  /\ state[s] \in {"follower", "candidate"}
  /\ currentTerm[s] < MaxTerm
  /\ currentTerm' = [currentTerm EXCEPT ![s] = currentTerm[s] + 1]
  /\ votedFor' = [votedFor EXCEPT ![s] = s]  \* vote for self
  /\ state' = [state EXCEPT ![s] = "candidate"]
  /\ messages' = messages \cup
       {RequestVote(s, t, currentTerm[s] + 1) : t \in Server \ {s}}

\* A server handles a RequestVote
HandleRequestVote(s) ==
  \E m \in messages :
    /\ m.type = "RequestVote"
    /\ m.dst = s
    /\ \/ /\ m.term > currentTerm[s]
          \* Higher term: update term, grant vote
          /\ currentTerm' = [currentTerm EXCEPT ![s] = m.term]
          /\ votedFor' = [votedFor EXCEPT ![s] = m.src]
          /\ state' = [state EXCEPT ![s] = "follower"]
          /\ messages' = (messages \ {m}) \cup
               {VoteGranted(s, m.src, m.term)}
       \/ /\ m.term = currentTerm[s]
          /\ votedFor[s] \in {"none", m.src}
          \* Same term, haven't voted or already voted for this candidate
          /\ votedFor' = [votedFor EXCEPT ![s] = m.src]
          /\ messages' = (messages \ {m}) \cup
               {VoteGranted(s, m.src, m.term)}
          /\ UNCHANGED <<currentTerm, state>>
       \/ /\ m.term < currentTerm[s]
          \* Stale term: reject (just consume the message)
          /\ messages' = messages \ {m}
          /\ UNCHANGED <<currentTerm, votedFor, state>>

\* A candidate collects enough votes to become leader
BecomeLeader(s) ==
  /\ state[s] = "candidate"
  /\ LET voteCount ==
       Cardinality({m \in messages :
         m.type = "VoteGranted" /\ m.dst = s /\ m.term = currentTerm[s]})
     IN
       \* Majority: votes received + self-vote
       voteCount + 1 > Cardinality(Server) \div 2
  /\ state' = [state EXCEPT ![s] = "leader"]
  /\ UNCHANGED <<currentTerm, votedFor, messages>>

\* A server discovers a higher term and steps down
StepDown(s) ==
  \E m \in messages :
    /\ m.dst = s
    /\ m.term > currentTerm[s]
    /\ currentTerm' = [currentTerm EXCEPT ![s] = m.term]
    /\ state' = [state EXCEPT ![s] = "follower"]
    /\ votedFor' = [votedFor EXCEPT ![s] = "none"]
    /\ UNCHANGED messages

Next ==
  \E s \in Server :
    \/ StartElection(s)
    \/ HandleRequestVote(s)
    \/ BecomeLeader(s)
    \/ StepDown(s)

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

\* --- Properties ---

\* Safety: at most one leader per term
ElectionSafety ==
  \A s1, s2 \in Server :
    (state[s1] = "leader" /\ state[s2] = "leader" /\ currentTerm[s1] = currentTerm[s2])
      => s1 = s2

\* Type invariant
TypeOK ==
  /\ currentTerm \in [Server -> 0..MaxTerm]
  /\ votedFor \in [Server -> Server \cup {"none"}]
  /\ state \in [Server -> {"follower", "candidate", "leader"}]
====
```

### What This Catches

Run with `Server = {s1, s2, s3}` and `MaxTerm = 3`. TLC will verify `ElectionSafety` across all interleavings — including scenarios like:

- Two servers start elections simultaneously in the same term
- A server receives a stale vote from a previous term
- A leader is elected, then another election starts before the leader can act
- Network delivers messages out of order

If you accidentally allow a server to vote twice in the same term, TLC will find the exact trace where two leaders get elected.

### Modeling Choices Worth Noting

A few things about how this spec is structured:

The network is modeled as a set of messages, not per-pair queues. This naturally models reordering (sets are unordered) and makes it easy to model message loss (just don't add the message) or duplication (add it twice, though sets deduplicate — use a bag/multiset if you need duplication).

Messages are consumed explicitly (`messages \ {m}`). This prevents a server from processing the same message twice. If you want to model at-least-once delivery, leave the message in the set.

`MaxTerm` bounds the state space. Without it, terms grow unboundedly and TLC never terminates. The art is choosing a bound large enough to exercise interesting behaviors but small enough for TLC to finish. For leader election, `MaxTerm = 3` is usually sufficient — most bugs manifest within 2-3 term transitions.

## Advanced PlusCal Patterns

### Procedures and Macros

PlusCal supports code reuse through macros and procedures:

```plaintext
\* Macros expand inline — no extra labels, no overhead
macro SendMsg(src, dst, body) begin
  messages := messages \cup {[src |-> src, dst |-> dst, body |-> body]};
end macro;

\* Procedures are like function calls — they introduce labels
\* and can have local variables
procedure HandleTimeout(server)
variables newTerm;
begin
  ht1:
    newTerm := currentTerm[server] + 1;
  ht2:
    currentTerm[server] := newTerm;
    state[server] := "candidate";
    return;
end procedure;
```

The key difference: macros are atomic within the enclosing label, procedures introduce their own labels (and thus their own atomicity boundaries). Use macros for simple state updates, procedures when you need multi-step operations that other processes can interleave with.

### Modeling Data Structures

TLA+ functions are more general than you might expect. They're total functions from a domain to a range, which means you can model:

```plaintext
\* A log (sequence of entries)
log = [s \in Server |-> <<>>]

\* Append to a server's log
log' = [log EXCEPT ![s] = Append(log[s], entry)]

\* A map of maps (nested state)
nodeState = [s \in Server |->
  [term |-> 0, voted |-> FALSE, log |-> <<>>]]

\* Update a nested field
nodeState' = [nodeState EXCEPT ![s].term = nodeState[s].term + 1]

\* A set of records (like a database table)
users == {
  [id |-> 1, name |-> "alice", role |-> "admin"],
  [id |-> 2, name |-> "bob", role |-> "user"]
}

\* Query: find all admins
admins == {u \in users : u.role = "admin"}
```

### Nondeterminism for Fault Injection

The `either/or` and `with` constructs in PlusCal are your primary tools for modeling faults:

```plaintext
\* Model a network partition that heals
fair process NetworkController = "net"
variables partitioned = {};
begin
  ctrl:
    while TRUE do
      either
        \* Create a partition
        with pair \in (Server \X Server) \ partitioned do
          partitioned := partitioned \cup {pair};
        end with;
      or
        \* Heal a partition
        with pair \in partitioned do
          partitioned := partitioned \ {pair};
        end with;
      or
        \* Do nothing (stable network)
        skip;
      end either;
    end while;
end process;
```

Then guard your message delivery on the partition state:

```plaintext
macro SendIfNotPartitioned(src, dst, msg) begin
  if <<src, dst>> \notin partitioned then
    network[dst] := Append(network[dst], msg);
  end if;
end macro;
```

TLC will explore all possible partition patterns — including the pathological ones your testing would never generate.

## State Space Explosion: Practical Techniques

Every TLA+ practitioner hits the state space wall. Here's what actually works.

### Symmetry Sets

If your servers are interchangeable (same code, same initial state), declare them as a symmetry set in TLC's model configuration:

```
SYMMETRY Permutations(Server)
```

With 5 servers, this reduces the state space by up to 5! = 120x. TLC recognizes that a state where `s1` is leader and `s2` is follower is equivalent to `s2` being leader and `s1` being follower, and only explores one.

Symmetry only works when the servers are truly interchangeable. If one server has a distinguished role (like a designated initial leader), you can't use symmetry for that constant.

### State Constraints vs. Action Constraints

```
\* State constraint: prune states where any term exceeds 3
\* (TLC won't explore successors of pruned states)
STATE_CONSTRAINT
  \A s \in Server : currentTerm[s] <= 3

\* Action constraint: only allow transitions where the term
\* doesn't jump by more than 1
ACTION_CONSTRAINT
  \A s \in Server : currentTerm'[s] <= currentTerm[s] + 1
```

State constraints are more aggressive — they cut off entire branches of the state graph. Action constraints are finer-grained. Use state constraints to bound the model, action constraints to eliminate unrealistic transitions.

### View Mapping (Abstraction)

Sometimes you have auxiliary variables that don't affect correctness but inflate the state space. A view mapping tells TLC which variables matter for state comparison:

```
VIEW
  <<currentTerm, state, votedFor>>
```

TLC will treat two states as identical if they agree on these variables, even if other variables differ. This is useful when you have debugging variables or counters that don't affect the protocol.

Be careful — if you exclude a variable that actually matters, TLC might miss bugs.

### Simulation Mode

When exhaustive checking is infeasible, TLC's simulation mode randomly samples execution traces:

```bash
java -jar tla2tools.jar -simulate num=10000 MC.tla
```

This runs 10,000 random traces. It won't prove your spec correct, but it's remarkably good at finding bugs — most bugs manifest in short traces, and random exploration covers a lot of ground quickly. Use simulation for early development and switch to exhaustive checking once the state space is manageable.

## Writing Good Invariants

Invariants are the whole point. A spec without invariants is just a state machine that does stuff — it doesn't tell you whether the stuff is correct.

### Type Invariants

Always start with a type invariant. It catches modeling errors early:

```plaintext
TypeOK ==
  /\ currentTerm \in [Server -> Nat]
  /\ state \in [Server -> {"follower", "candidate", "leader"}]
  /\ votedFor \in [Server -> Server \cup {"none"}]
  /\ messages \subseteq MessageType
```

If `TypeOK` fails, you have a bug in your state transitions, not your protocol logic. Fix it before checking anything else.

### Inductive Invariants

An invariant `I` is inductive if:
1. `Init => I` (it holds initially)
2. `I /\ Next => I'` (if it holds before a step, it holds after)

TLC checks invariants by exploring reachable states, so non-inductive invariants work fine for model checking. But inductive invariants are important for two reasons:

- They're needed for TLAPS (the TLA+ proof system) if you want machine-checked proofs
- They help you understand *why* your protocol is correct, not just *that* it is

Finding inductive invariants is hard. The typical workflow:

1. Write the safety property you care about (e.g., `ElectionSafety`)
2. Run TLC — it verifies the property
3. Try to prove it with TLAPS — the proof fails because the invariant isn't inductive
4. Strengthen the invariant by adding conjuncts that capture protocol structure
5. Repeat until the invariant is inductive

For Raft leader election, the inductive invariant includes things like:

```plaintext
\* If a server voted for someone, it's in the right term
VoteInvariant ==
  \A s \in Server :
    votedFor[s] /= "none" =>
      \E t \in Server : votedFor[s] = t

\* A leader must have received a majority of votes
LeaderHasMajority ==
  \A s \in Server :
    state[s] = "leader" =>
      Cardinality({v \in Server : votedFor[v] = s /\ currentTerm[v] = currentTerm[s]}) * 2
        > Cardinality(Server)
```

### Debugging Invariant Violations

When TLC reports a violation, the error trace is your primary debugging tool. But traces can be long and confusing. Some techniques:

- Add `Print` statements to your spec to log intermediate values
- Use TLC's `-dump` option to write all states to a file
- Add a "ghost variable" that tracks information useful for debugging but doesn't affect the protocol:

```plaintext
\* Ghost variable: track who voted for whom in each term
VARIABLE voteHistory  \* [Server -> [Nat -> Server \cup {"none"}]]

\* Update in the voting action
voteHistory' = [voteHistory EXCEPT ![s][currentTerm[s]] = candidate]
```

Ghost variables increase the state space, so remove them once you've found the bug.

## Liveness: Getting It Right

Liveness properties are harder than safety properties because they involve reasoning about infinite behaviors.

### Common Liveness Patterns

```plaintext
\* Termination: the system eventually reaches a final state
Termination == <>(pc = "Done")

\* Responsiveness: every request eventually gets a response
Responsiveness ==
  \A c \in Client :
    [](request[c] = TRUE ~> response[c] = TRUE)

\* Progress: the system doesn't get stuck
Progress ==
  []<>(\E s \in Server : state[s] = "leader")

\* Starvation freedom: every client eventually gets served
StarvationFreedom ==
  \A c \in Client :
    []<>(served[c] = TRUE)
```

### Fairness Pitfalls

The most common liveness bug isn't in your protocol — it's in your fairness assumptions.

Weak fairness (`WF`) says: if an action is continuously enabled from some point on, it eventually executes. This is appropriate for most process actions.

Strong fairness (`SF`) says: if an action is enabled infinitely often (but maybe not continuously), it eventually executes. You need this for actions that can be repeatedly enabled and disabled, like receiving a message that keeps getting sent.

```plaintext
\* Weak fairness is usually sufficient for process actions
Spec == Init /\ [][Next]_vars
  /\ \A s \in Server : WF_vars(StartElection(s))
  /\ \A s \in Server : WF_vars(HandleRequestVote(s))
  /\ \A s \in Server : WF_vars(BecomeLeader(s))

\* Strong fairness needed when messages can be repeatedly available
\* but the receive action keeps getting preempted
SpecSF == Init /\ [][Next]_vars
  /\ \A s \in Server : SF_vars(HandleRequestVote(s))
```

If TLC reports a liveness violation with a "stuttering" suffix in the trace, it means some action was enabled but never taken — you probably need fairness on that action.

If TLC reports a liveness violation with a "back to state" loop, it means the system can cycle forever without making progress. This is a real bug — your protocol has a livelock.

## Practical Workflow Tips

### Iterative Development

Don't try to write the complete spec in one go. Build it up:

1. Model a single process, check type invariants
2. Add a second process, check safety
3. Add failure modes one at a time
4. Add liveness properties last
5. Increase constants gradually

Each step should pass TLC before you move to the next. If you add everything at once and TLC finds a bug, you won't know which part introduced it.

### Spec Hygiene

```plaintext
\* Separate your spec into sections with clear comments

\* --- Constants and Variables ---
\* --- Type Definitions ---
\* --- Initial State ---
\* --- Actions ---
\* --- Next-State Relation ---
\* --- Specification ---
\* --- Type Invariants ---
\* --- Safety Properties ---
\* --- Liveness Properties ---
\* --- Refinement ---
```

### When to Stop

You can always make a spec more detailed. The question is when it's detailed enough. Some guidelines:

- If you're modeling a protocol, stop when you've captured all the message types and state transitions. Don't model serialization or network buffers.
- If you're modeling a data structure, stop when you've captured the operations and their preconditions. Don't model memory allocation.
- If TLC finishes in under a minute with your target constants, you probably have room to add more detail.
- If TLC takes hours, you've probably modeled too much — abstract away some detail.

The spec should answer specific questions about your design. Once it's answered them, it's done.

## Wrapping Up

Refinement and composition are what make TLA+ scale beyond toy examples. Refinement lets you verify that your clever protocol actually implements the simple thing you want. Composition lets you build specs from reusable pieces. And the practical techniques for managing state space — symmetry, constraints, simulation — are what make model checking feasible on real designs.

The pattern is always the same: start abstract, add detail, verify at each level. The bugs TLC finds at the intermediate levels — where the protocol logic lives — are the ones that would have taken months to find in production.
