---
title: "Property-Based Testing with Hypothesis and fast-check"
date: 2026-04-12 14:00:00 -0700
categories: [Testing]
tags: [property-based-testing, hypothesis, fast-check, python, typescript, testing, formal-methods]
---

Unit tests check that your code does the right thing for specific inputs you thought of. Property-based tests check that your code does the right thing for hundreds or thousands of inputs the computer thought of. You describe *what should be true* about your code, and the framework generates random inputs to try to prove you wrong.

This is the practical middle ground between writing a handful of example-based tests and doing full formal verification with something like TLA+. You get much broader coverage than unit tests with far less effort than a formal spec.

## The Core Idea

A traditional unit test says: "given input X, expect output Y."

A property-based test says: "for all valid inputs, this property holds."

The difference is subtle but powerful. Instead of testing `sort([3, 1, 2]) == [1, 2, 3]`, you test:

- For any list of integers, sorting it produces a list of the same length
- For any list of integers, every element in the sorted output is less than or equal to the next
- For any list of integers, the sorted output contains exactly the same elements as the input

These properties hold for every possible list — empty lists, single-element lists, lists with duplicates, lists with negative numbers, lists with a million elements. The framework generates all of these and checks.

## Hypothesis (Python)

[Hypothesis](https://hypothesis.readthedocs.io/) is the gold standard for property-based testing in Python. It integrates with pytest and generates test cases using a strategy-based system.

### Setup

```bash
pip install hypothesis
```

### A First Example: Testing a Sort Function

```python
from hypothesis import given
from hypothesis import strategies as st


@given(st.lists(st.integers()))
def test_sort_preserves_length(xs):
    assert len(sorted(xs)) == len(xs)


@given(st.lists(st.integers()))
def test_sort_is_ordered(xs):
    result = sorted(xs)
    for i in range(len(result) - 1):
        assert result[i] <= result[i + 1]


@given(st.lists(st.integers()))
def test_sort_preserves_elements(xs):
    assert sorted(sorted(xs)) == sorted(xs)
```

Run these with `pytest` and Hypothesis will generate 100 random lists per test (by default), including edge cases like empty lists, single elements, and lists with duplicate values.

### Strategies: Describing Your Inputs

Strategies are how you tell Hypothesis what kind of data to generate. They compose like building blocks.

```python
from hypothesis import strategies as st

# Primitives
st.integers()                          # Any integer
st.integers(min_value=0, max_value=100)  # Bounded
st.floats(allow_nan=False)             # Floats without NaN
st.text()                              # Unicode strings
st.text(min_size=1, max_size=50)       # Bounded strings
st.booleans()                          # True or False
st.none()                              # Always None
st.binary()                            # Bytes

# Collections
st.lists(st.integers())               # List of ints
st.lists(st.integers(), min_size=1)    # Non-empty list
st.sets(st.text())                     # Set of strings
st.dictionaries(st.text(), st.integers())  # Dict[str, int]
st.tuples(st.integers(), st.text())    # Tuple[int, str]

# Combining strategies
st.one_of(st.integers(), st.text())    # Int or string
st.integers() | st.none()              # Int or None (shorthand)

# Filtering
st.integers().filter(lambda x: x != 0)  # Non-zero integers

# Mapping (transform generated values)
st.integers(min_value=1, max_value=12).map(
    lambda m: f"2026-{m:02d}-01"
)  # Date strings like "2026-03-01"
```

### Composite Strategies: Building Complex Data

When you need structured test data, use `@st.composite`:

```python
from dataclasses import dataclass
from hypothesis import strategies as st


@dataclass
class User:
    name: str
    age: int
    email: str


@st.composite
def users(draw):
    name = draw(st.text(min_size=1, max_size=50))
    age = draw(st.integers(min_value=0, max_value=150))
    email = draw(
        st.from_regex(r"[a-z]{3,10}@[a-z]{3,10}\.[a-z]{2,4}", fullmatch=True)
    )
    return User(name=name, age=age, email=email)


@given(users())
def test_user_display_name_not_empty(user):
    assert len(user.name) > 0
```

### Shrinking: Finding Minimal Failing Cases

When Hypothesis finds a failing input, it doesn't just report it — it *shrinks* it to the smallest, simplest input that still triggers the failure. This is one of the most valuable features.

Say your function fails on a list of 47 elements. Hypothesis will automatically try smaller lists, smaller numbers, and simpler combinations until it finds the minimal reproducing case — maybe `[0, 1]` or `[-1]`.

```python
from hypothesis import given
from hypothesis import strategies as st


def encode(data: bytes) -> bytes:
    """Run-length encoding with a bug."""
    result = bytearray()
    i = 0
    while i < len(data):
        count = 1
        while i + count < len(data) and data[i + count] == data[i]:
            count += 1
        # Bug: count can exceed 255 but we store it in one byte
        result.append(count)
        result.append(data[i])
        i += count
    return bytes(result)


def decode(data: bytes) -> bytes:
    result = bytearray()
    for i in range(0, len(data), 2):
        count = data[i]
        value = data[i + 1]
        result.extend([value] * count)
    return bytes(result)


@given(st.binary())
def test_encode_decode_roundtrip(data):
    assert decode(encode(data)) == data
```

Hypothesis will find that 256 identical bytes breaks the roundtrip, then shrink it to exactly 256 copies of `\x00` — the minimal case that overflows the count byte.

### Stateful Testing

Hypothesis can also test stateful systems by generating sequences of operations. This is where it gets close to model checking.

```python
from hypothesis.stateful import RuleBasedStateMachine, rule, precondition
from hypothesis import strategies as st


class SetModel(RuleBasedStateMachine):
    """Test a custom set implementation against Python's built-in set."""

    def __init__(self):
        super().__init__()
        self.model = set()        # The reference (what it should do)
        self.actual = MyCustomSet()  # The implementation under test

    @rule(value=st.integers())
    def add(self, value):
        self.model.add(value)
        self.actual.add(value)
        assert value in self.actual

    @rule(value=st.integers())
    def remove(self, value):
        if value in self.model:
            self.model.remove(value)
            self.actual.remove(value)
        assert value not in self.actual or value not in self.model

    @rule()
    def check_length(self):
        assert len(self.actual) == len(self.model)

    @rule()
    def check_contents(self):
        for item in self.model:
            assert item in self.actual


TestSetModel = SetModel.TestCase
```

Hypothesis generates random sequences of `add`, `remove`, `check_length`, and `check_contents` calls, looking for a sequence that violates an assertion. If it finds one, it shrinks the sequence to the shortest failing example.

## fast-check (TypeScript / JavaScript)

[fast-check](https://fast-check.dev/) is the equivalent library for the TypeScript/JavaScript ecosystem. Same concepts, different syntax.

### Setup

```bash
npm install --save-dev fast-check
```

### Basic Properties

```typescript
import fc from "fast-check";

// Using fast-check's built-in test runner
fc.assert(
  fc.property(fc.array(fc.integer()), (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted.length === arr.length;
  })
);

// With a test framework (Jest/Vitest)
describe("sort", () => {
  it("preserves length", () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const sorted = [...arr].sort((a, b) => a - b);
        expect(sorted).toHaveLength(arr.length);
      })
    );
  });

  it("produces ordered output", () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const sorted = [...arr].sort((a, b) => a - b);
        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i]).toBeLessThanOrEqual(sorted[i + 1]);
        }
      })
    );
  });
});
```

### Arbitraries: fast-check's Strategies

fast-check calls its generators "arbitraries." Same idea as Hypothesis strategies.

```typescript
import fc from "fast-check";

// Primitives
fc.integer();                          // Any safe integer
fc.integer({ min: 0, max: 100 });     // Bounded
fc.float();                            // Floating point
fc.string();                           // Unicode string
fc.string({ minLength: 1, maxLength: 50 });
fc.boolean();                          // true or false
fc.constant(null);                     // Always null
fc.uint8Array();                       // Typed array

// Collections
fc.array(fc.integer());               // number[]
fc.array(fc.integer(), { minLength: 1 });  // Non-empty
fc.uniqueArray(fc.integer());          // No duplicates
fc.dictionary(fc.string(), fc.integer());  // Record<string, number>
fc.tuple(fc.integer(), fc.string());   // [number, string]

// Combining
fc.oneof(fc.integer(), fc.string());   // number | string
fc.option(fc.integer());               // number | null

// Filtering
fc.integer().filter((x) => x !== 0);   // Non-zero

// Mapping
fc.integer({ min: 1, max: 12 }).map(
  (m) => `2026-${String(m).padStart(2, "0")}-01`
);
```

### Building Complex Objects

```typescript
import fc from "fast-check";

interface User {
  name: string;
  age: number;
  email: string;
  roles: string[];
}

const userArbitrary: fc.Arbitrary<User> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  age: fc.integer({ min: 0, max: 150 }),
  email: fc.emailAddress(),
  roles: fc.array(fc.constantFrom("admin", "user", "viewer"), {
    minLength: 1,
    maxLength: 3,
  }),
});

fc.assert(
  fc.property(userArbitrary, (user) => {
    expect(user.roles.length).toBeGreaterThan(0);
    expect(user.age).toBeGreaterThanOrEqual(0);
  })
);
```

### Model-Based Testing

fast-check supports model-based testing similar to Hypothesis's stateful testing:

```typescript
import fc from "fast-check";

type Model = { items: Set<number> };
type Real = MyCustomSet;

class AddCommand implements fc.Command<Model, Real> {
  constructor(readonly value: number) {}
  check(_m: Readonly<Model>) {
    return true;
  }
  run(m: Model, r: Real) {
    m.items.add(this.value);
    r.add(this.value);
    expect(r.has(this.value)).toBe(true);
  }
  toString() {
    return `add(${this.value})`;
  }
}

class DeleteCommand implements fc.Command<Model, Real> {
  constructor(readonly value: number) {}
  check(m: Readonly<Model>) {
    return m.items.has(this.value);
  }
  run(m: Model, r: Real) {
    m.items.delete(this.value);
    r.delete(this.value);
    expect(r.has(this.value)).toBe(false);
  }
  toString() {
    return `delete(${this.value})`;
  }
}

class SizeCommand implements fc.Command<Model, Real> {
  check(_m: Readonly<Model>) {
    return true;
  }
  run(m: Model, r: Real) {
    expect(r.size).toBe(m.items.size);
  }
  toString() {
    return "size()";
  }
}

const allCommands = [
  fc.integer().map((v) => new AddCommand(v)),
  fc.integer().map((v) => new DeleteCommand(v)),
  fc.constant(new SizeCommand()),
];

fc.assert(
  fc.property(fc.commands(allCommands, { maxCommands: 50 }), (cmds) => {
    const model: Model = { items: new Set() };
    const real = new MyCustomSet();
    fc.modelRun(() => ({ model, real }), cmds);
  })
);
```

fast-check generates random sequences of commands, runs them against both the model and the real implementation, and shrinks to the minimal failing sequence.

## Common Property Patterns

These patterns work in both Hypothesis and fast-check. They're the building blocks for most property-based tests.

### Roundtrip (Encode/Decode)

The most common and most useful property: if you encode then decode, you get back the original.

```python
# Python
@given(st.binary())
def test_compress_decompress_roundtrip(data):
    assert decompress(compress(data)) == data

@given(st.dictionaries(st.text(), st.integers()))
def test_json_roundtrip(d):
    assert json.loads(json.dumps(d)) == d
```

```typescript
// TypeScript
fc.assert(
  fc.property(fc.string(), (s) => {
    expect(decodeURIComponent(encodeURIComponent(s))).toBe(s);
  })
);
```

This catches encoding bugs, off-by-one errors, boundary conditions, and character handling issues that you'd never think to write example tests for.

### Idempotence

Applying an operation twice gives the same result as applying it once.

```python
@given(st.text())
def test_normalize_is_idempotent(s):
    assert normalize(normalize(s)) == normalize(s)

@given(st.lists(st.integers()))
def test_sort_is_idempotent(xs):
    assert sorted(sorted(xs)) == sorted(xs)

@given(st.lists(st.integers()))
def test_deduplicate_is_idempotent(xs):
    assert deduplicate(deduplicate(xs)) == deduplicate(xs)
```

### Invariants

Some property of the output is always true, regardless of input.

```python
@given(st.integers(), st.integers())
def test_addition_commutative(a, b):
    assert a + b == b + a

@given(st.lists(st.integers(), min_size=1))
def test_max_is_in_list(xs):
    assert max(xs) in xs

@given(st.lists(st.integers()))
def test_length_after_append(xs):
    assert len(xs + [0]) == len(xs) + 1
```

### Oracle / Reference Implementation

Test your optimized implementation against a known-correct (but slow) reference.

```python
def naive_is_sorted(xs):
    return all(xs[i] <= xs[i + 1] for i in range(len(xs) - 1))

@given(st.lists(st.integers()))
def test_is_sorted_matches_reference(xs):
    assert fast_is_sorted(xs) == naive_is_sorted(xs)
```

```typescript
fc.assert(
  fc.property(fc.array(fc.integer()), (arr) => {
    const expected = naiveFlatten(arr);
    const actual = optimizedFlatten(arr);
    expect(actual).toEqual(expected);
  })
);
```

### Symmetry

Two different paths to the same result should agree.

```python
@given(st.lists(st.integers()))
def test_reverse_reverse(xs):
    assert list(reversed(list(reversed(xs)))) == xs

@given(st.integers(), st.integers())
def test_insert_then_delete(a, b):
    tree = BinaryTree()
    tree.insert(a)
    tree.insert(b)
    tree.delete(a)
    assert a not in tree
    assert b in tree
```

### Hard to Compute, Easy to Verify

Some results are hard to produce but easy to check.

```python
@given(st.integers(min_value=2, max_value=1000))
def test_factorize(n):
    factors = factorize(n)
    # Easy to verify: product of factors equals n
    product = 1
    for f in factors:
        product *= f
    assert product == n
    # And all factors are prime
    assert all(is_prime(f) for f in factors)
```

## Practical Tips

### Start with Roundtrips

If your code has any serialize/deserialize, encode/decode, or parse/format pair, write a roundtrip property test first. These find more bugs per line of test code than almost anything else.

### Use `assume()` Sparingly

Both frameworks let you skip invalid inputs with `assume()` (Hypothesis) or `fc.pre()` (fast-check). But if you're filtering out most generated inputs, you're wasting cycles. Build a better strategy/arbitrary instead.

```python
# Bad: filters out most inputs
@given(st.text())
def test_parse_email(s):
    assume("@" in s and "." in s)
    parse_email(s)

# Better: generate valid-ish emails directly
@given(st.from_regex(r"[a-z]+@[a-z]+\.[a-z]{2,4}", fullmatch=True))
def test_parse_email(s):
    parse_email(s)
```

### Reproduce Failures Deterministically

Both frameworks save failing examples so they're replayed on the next run.

Hypothesis stores them in `.hypothesis/examples/` in your project directory. fast-check prints the seed in the failure output — pass it back with `{ seed }` to reproduce:

```typescript
fc.assert(
  fc.property(fc.integer(), (n) => {
    // ...
  }),
  { seed: 1234567890 }  // Reproduce a specific failure
);
```

### Control the Number of Runs

```python
# Hypothesis: via settings
from hypothesis import settings

@settings(max_examples=500)
@given(st.lists(st.integers()))
def test_with_more_examples(xs):
    ...
```

```typescript
// fast-check: via parameters
fc.assert(
  fc.property(fc.array(fc.integer()), (arr) => {
    // ...
  }),
  { numRuns: 500 }
);
```

More runs means more coverage but slower tests. 100 is a reasonable default for CI. Crank it up for critical code paths.

### Don't Replace Unit Tests — Complement Them

Property-based tests are great at finding edge cases you didn't think of. Unit tests are great at documenting specific expected behaviors. Use both.

```python
# Unit test: documents specific behavior
def test_sort_empty_list():
    assert sorted([]) == []

# Property test: checks general invariant
@given(st.lists(st.integers()))
def test_sort_is_ordered(xs):
    result = sorted(xs)
    for i in range(len(result) - 1):
        assert result[i] <= result[i + 1]
```

## Where Property-Based Testing Shines

- Serialization/deserialization — roundtrip properties catch encoding bugs that example tests miss
- Data structure implementations — test against a reference implementation (e.g., your custom map vs. the standard library)
- Parsers — generate random valid and invalid inputs, check that parsing never crashes and roundtrips correctly
- State machines — model-based testing finds sequences of operations that leave your system in an inconsistent state
- Numeric code — edge cases around overflow, precision loss, and boundary values
- Anything with a clear contract — if you can state "for all valid inputs, this property holds," you can test it

## Where It Doesn't Help Much

- UI rendering — hard to express visual correctness as a property
- Integration tests with external services — you can't generate random API responses meaningfully without mocking
- Tests where the expected output is the whole point — "given this specific config, the system should produce this exact output"

## Wrapping Up

Property-based testing sits in a sweet spot. It's more thorough than example-based tests — you're checking invariants across thousands of inputs instead of the three cases you thought of. And it's far more practical than formal verification — you don't need to learn TLA+ or model your entire system as a state machine. Write a property, let the framework find the counterexample, fix the bug. The shrinking alone is worth the setup cost — instead of debugging a failure on a 500-element list, you get the minimal 2-element case that breaks your code.

