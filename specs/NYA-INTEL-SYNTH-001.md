# NYA-INTEL-SYNTH-001 — Deterministic Intelligence Synthesis

**Vertical slice specification · Question type Q-ASSOC-1 ("source-established relationships around X")**

| | |
|---|---|
| Document ID | NYA-INTEL-SYNTH-001 |
| Version | **DRAFT v0.2.0** — for founder review. Nothing in this document is authorised for implementation until ruled. |
| Supersedes | DRAFT v0.1.0 (2026-10-12) |
| Classification | INTERNAL |
| Programme | Nyansapo — Intelligence plane |
| Review basis | Code-grounded architecture review of v0.1.0 against `origin/main` `62ead3c54cf984c37d17d9d2b1f4d7b38d5d19ea` (11 Oct 2026), with evidence manifest `NYA-INTEL-SYNTH-001-code-evidence.json`. |
| Depends on | NYA-PROVENANCE-EXPLORER-001 PR-0; `applicability_sufficiency.py` evaluation semantics; `governed_verification_service.py`; `KeyManager`; `AuditChain`; **new ingest prerequisite IS-P0 (§5.0)** |
| Decision effect | `CONTEXT_ONLY`. `decision_effect_allowed = FALSE`, hardwired, not flag-controlled. |
| Author | Prepared with Claude for Omaida Ali, 2026-10-12 |

---

## 0. Change log — v0.1.0 → v0.2.0

The v0.1.0 draft was written without repository access and marked uncertain claims `[VERIFY]`. A code-grounded review found that several reuse claims were unsupported, two of which were **not** flagged `[VERIFY]` and were therefore errors of confidence rather than of labelling. This version corrects every finding, re-cuts the slice to what the code and data can honestly support, and records what was deferred and why. Items the review raised that this version **defers** are listed in §0.3 so they are not silently lost.

### 0.1 Corrections to false or unsupported claims

| # | v0.1.0 claim | Finding | v0.2.0 disposition |
|---|---|---|---|
| R1 | "Generalisation of AOT"; reuse of an AOT expression evaluator. | `AotPolicyEngine` implements ownership arithmetic (chain multiplication, aggregation, ceilings). No generic expression language exists. | Reframed as a **sibling question-scoped evaluator** (§1). Evaluation semantics drawn from `applicability_sufficiency.py` (`TRUE / FALSE / UNKNOWN / INVALID`), not AOT. FD-IS2 resolved: sibling. |
| R2 | Canonicalise with `canonicalize_receipt_v2`. | That function binds a fixed screening-receipt field set. Probe: two different assessments canonicalise identically. | **New** `canonicalize_assessment_v1` with strict field binding and per-field tamper tests (§11.1). Screening V2 untouched. |
| R3 | Investigations are "already dual-controlled, signed, append-only" fact overrides. | Case row is mutable; one operator concludes; signing is a later step; admin-key auth, no second reviewer on that path. | Claim removed. Overrides are a **separate, immutable, signed object** and are **deferred out of v0.2** (§12.3). v0.2 links to investigations only. |
| R4 | Public verify endpoint modelled on an Explorer precedent that checks `audit_chain` membership. | Actual route is admin-authenticated; verifies payload hash + signature only; snapshot signing does not call `AuditChain.append`. | Public verify removed. Retrieval is scoped (`INTEL_READ` + client-type audience). FD-IS6 resolved. |
| R5 | `snapshot_id` pins the fact loader for replay. | `silver_uk_companies` and `silver_uk_officers` are upserted in place; a pointer cannot reproduce former contents. | **Facts are materialised into the assessment body** and hashed (§6.4). Replay re-evaluates rules over the stored bundle. Live re-execution is a distinct operation producing a new assessment. |
| R6 | `silver_uk_officers.officer_id` identifies a person across companies. | Both writers assign the appointment self-link; it is company-scoped. | New ingest prerequisite **IS-P0**: capture the person-level Companies House officer identifier (§5.0). Rule 001 is blocked until IS-P0 lands. |
| R7 | Registered-address occupancy intervals exist. | `silver_uk_companies` holds current address only; no `valid_from/valid_to`. | Rule 002 **redefined** as point-in-time co-location at `observed_at`, emitting a `DERIVED_FACT`, not an interval inference (§5.4). Interval form deferred. |
| R8 | A degree guard passes when the count is low. | Unknown degree (partial acquisition) would silently pass a suppressing guard. | Guards are three-valued (`PASS / FAIL / UNKNOWN`); `UNKNOWN` **suppresses** (§5.2). |
| R9 | Partial fire: any ≥2 satisfied preconditions yields a hypothesis. | A `FALSE` or `INADMISSIBLE` necessary condition is a disproof, not "evidence needed." | Only preconditions evaluating `UNKNOWN` may spawn `HYPOTHESIS` + `INDICATOR`; any `FALSE` precondition closes the rule (§7). Per-rule thresholds replace the global minimum. |
| R10 | Rule 004 consumes prior `INFERENCE` outputs; loader restricted to facts. | Contradiction; no dependency ordering defined. | Typed rule dependency DAG with cycle rejection and fixed evaluation order (§5.5). |
| R11 | `MIGRATION_FILES` manual registration. | `discover_migration_files` now auto-discovers. | Dropped. Privilege manifest and role tests still required (§9.3). |
| R12 | `AuditChain.append` reused as-is. | No serialisation around read-latest/insert; cannot join the assessment insert transaction. | Serialized append under advisory lock within the assessment transaction, or outbox (§11.3). |
| R13 | Idempotency by `(subject, snapshot_id, rule_set_version)`. | Snapshot id does not freeze inputs; no DB uniqueness; null-subject collapse. | Execution identity = hash of (question, canonical subject or normalised unresolved-state, input bundle hash, rule-set digest, engine digest). DB unique constraint (§10.1). FD-IS5 resolved. |
| R14 | Benchmark targets stated as population rates. | 2/200 is an observed rate, not a 1% ceiling. | Targets restated as observed counts with Wilson intervals; guard exclusions reported separately from misses (§13). |

### 0.2 Scope reductions in v0.2.0

- **No negative assertions are emitted.** `ASSOCIATION_CLUSTER_NOT_ESTABLISHED` is removed from the v0.2 predicate set. C5 remains as a prohibition; the coverage model (§8) is specified as a dependency and not built in this slice.
- **No investigation-derived overrides.** Link only.
- **No public verification surface.**
- **Rule 003 removed** as a standalone rule; temporal overlap is a derivation inside rule 001.
- Rule 002 downgraded from interval inference to point-in-time derived fact.

### 0.3 Deferred, tracked, not cancelled

| Item | Reason deferred | Tracked as |
|---|---|---|
| Negative assertions + population coverage model | Requires predicate/population/time completeness evidence that does not exist. | NYA-INTEL-SYNTH-002 (coverage) |
| Immutable signed override objects from investigations | Requires reviewer-authority model and fact-id-level targeting the investigation schema lacks. | NYA-INTEL-SYNTH-003 (overrides) |
| Registered-address occupancy intervals | Requires AD01 parsing or snapshot-succession derivation. | IS-P1 (ingest) |
| Inference drift | Architectural objective committed; sequenced after first slice. Schema carries `supersedes_assessment_id`, `input_bundle_sha256`, `rule_set_sha256`, `engine_sha256` from day one. | NYA-INTEL-SYNTH-004 |
| Public supplied-receipt verifier | New security surface; needs key distribution, revocation semantics, bounded input. | NYA-INTEL-SYNTH-005 |
| Agent / virtual-office address classifier | Not found in code (ECI party-role vocabulary is not a classifier). | Degree guard only in v0.2 |

---

## 1. Purpose and framing

Nyansapo serves governed facts and answers one analytic question deterministically — *who owns or controls X* — through AOT. A second evaluator, `applicability_sufficiency.py`, answers legal-applicability questions with typed `TRUE / FALSE / UNKNOWN / INVALID` outcomes. Everything else Nyansapo returns is a fact, a retrieval or a resolution state. Consumers who need to know *what the admissible evidence, taken together, establishes* about a subject must assemble that picture themselves.

This slice adds a third evaluator alongside those two:

> **A question-scoped deterministic synthesis capability, implemented alongside AOT and legal applicability, reusing compatible governed infrastructure (identity references, signing primitive, audit chain, governed verification, scope enforcement) while preserving each evaluator's evidence vocabulary and authority boundary.**

Its single question in this slice:

> **Q-ASSOC-1:** *What source-established relationships exist around subject X, and what do they establish?*

Output: a signed **Assessment** containing the materialised facts it was computed from, every assertion with a defined epistemic class, a rule id and version, and the fact ids that support or contradict it. The Assessment says what is established, what conflicts, and — mechanically, from rule preconditions that evaluated `UNKNOWN` — what evidence would change the answer. It says nothing negative in this slice.

Framing that must survive every later document:

- AOT's ownership arithmetic and the applicability evaluator's legal-effect precedence are **not** extended. Synthesis cites their outcomes as facts and never recomputes them.
- The Assessment is **context**. It never carries decision effect. Veredis composes it with transaction facts and makes the decision.
- **No language model** participates in producing an Assessment.

## 2. Scope

### 2.1 In scope

1. One question type, `Q-ASSOC-1`, over one subject.
2. Ingest prerequisite IS-P0: person-level officer identifier (§5.0).
3. Rule schema; four governed rules (§5.4) with three-valued guards and an identity admissibility floor.
4. The Assessment object with materialised input bundle (§6); epistemic classes (§4); `UNKNOWN`-driven partial fire (§7).
5. Storage (§9); scoped trusted-service endpoints (§10); assessment canonicalisation, signing and serialised audit append (§11); Explorer link-only hooks (§12).
6. Acceptance benchmark with interval-reported rates (§13).

### 2.2 Out of scope — explicitly

- Any other question type. Ownership and control remain AOT's.
- Negative assertions and the coverage model (§0.3).
- Investigation-derived overrides (§0.3).
- Public verification (§0.3).
- Address occupancy intervals; two-hop clusters; ACH matrices; drift logic.
- Prose rendering, PDF, LLM involvement.
- External SDK exposure. Trusted-service only.
- Veredis-side consumption and anything scenario-conditioned.

## 3. Constitutional prohibitions

Invariants enforced in code and tests. A PR that weakens any of them fails review.

| # | Prohibition | Enforcement |
|---|---|---|
| C1 | No assertion may carry `decision_effect` other than `NONE`. | `Literal["NONE"]` on the model; test asserts. |
| C2 | Association is never promoted to ownership or control. No `ASSOC` rule may emit a `CONTROL`/`OWNERSHIP` predicate. | Rule loader rejects cross-family predicates. |
| C3 | Intent, purpose or culpability is never inferred. | Closed predicate enum (§4.3). |
| C4 | Graph proximity is not evidence. | Rule schema requires ≥1 non-topological precondition. |
| C5 | An absent record is not evidence. No negative assertion may be emitted without a validated coverage record. | v0.2: no negative predicates exist in the enum. Constructor rejects any `*_NOT_ESTABLISHED` predicate. |
| C6 | A Ceres passage is never a fact. | Fact ids validated against fact tables only. |
| C7 | No generative model in the production path. | CI grep gate on `api/services/intel_synthesis/`. |
| C8 | An Assessment is replayable from its stored input bundle, rule-set digest and engine digest, byte-for-byte on the conclusion body. | Replay test (§13.1 A1). |
| C9 | Every inference inherits the weakest admissible supporting fact. | Computed in the assertion constructor. |
| C10 | Rules are governed objects: versioned, dual-approved via `governed_verification_service`, immutable once active. | Activation only via governed gate (§9.2). |
| C11 | A `FALSE` or inadmissible necessary precondition closes a rule; it never becomes an indicator. | Evaluator semantics (§7). |
| C12 | An unknown guard value suppresses. | Three-valued guards (§5.2). |

## 4. Epistemic model

### 4.1 Assertion classes

| Class | Definition | Produced by |
|---|---|---|
| `FACT` | Directly supported by an admissible source record in the input bundle. | Fact loader; never a rule. |
| `DERIVED_FACT` | Deterministic transformation of facts with no judgement content (interval overlap; normalised-address equality at a time). | Derivation functions with stable ids. |
| `INFERENCE` | Conclusion of a rule whose preconditions all evaluated `TRUE` and whose guards all `PASS`. | Rule engine. |
| `CONFLICT` | Admissible facts assert incompatible values for the same predicate/scope. | Rule 005. |
| `HYPOTHESIS` | A rule with no `FALSE` precondition, at least its per-rule minimum `TRUE`, and ≥1 `UNKNOWN`. | Rule engine, §7. |
| `INDICATOR` | The `indicator_text` of each `UNKNOWN` precondition of a `HYPOTHESIS`. | Rule engine, from the rule definition. |
| `GAP` | A required source family was unavailable or stale at evaluation time (a *dependency* gap, not a *coverage* gap). | Fact loader. |
| `UNKNOWN` | The question cannot be answered for a stated structural reason (subject unresolved, IS-P0 identity absent). | Engine entry gate. |

No class expresses probability.

### 4.2 Precondition evaluation values

Adopted from `applicability_sufficiency.py`:

| Value | Meaning | Effect on rule |
|---|---|---|
| `TRUE` | Satisfied by ≥1 admissible fact. | Counts toward full match. |
| `FALSE` | An admissible fact disproves it. | **Closes the rule** (C11). Nothing emitted for it. |
| `UNKNOWN` | No admissible fact either way; source family present but silent, or fact present but below admissibility floor. | May spawn `HYPOTHESIS`/`INDICATOR`. |
| `INVALID` | Precondition cannot be evaluated (schema mismatch, malformed fact). | Rule closes; `data_warnings` entry; engine warning counter. |

### 4.3 Admissibility states

| State | Meaning |
|---|---|
| `ADMISSIBLE` | Identity confirmed per §5.3; source `AUTHORITATIVE`; `evaluate_source_freshness` at pinned `as_of` is current; row release current. |
| `ADMISSIBLE_ADVISORY` | As above but authority tier `ADVISORY`. |
| `INADMISSIBLE_IDENTITY` | Identity binding below floor. |
| `INADMISSIBLE_STALE` | Freshness or row release not current at `as_of`. |

(`INADMISSIBLE_OVERRIDDEN` is reserved for NYA-INTEL-SYNTH-003 and not emitted in v0.2.)

### 4.4 Predicate vocabulary (closed, v0.2)

```
SHARED_OFFICER_ESTABLISHED             (rule 001)
REGISTERED_ADDRESS_COLOCATED_AT        (rule 002; DERIVED_FACT, point-in-time)
ASSOCIATION_CLUSTER_SUPPORTED          (rule 004)
RELATIONSHIP_EVIDENCE_CONFLICTED       (rule 005)
OWNERSHIP_PATH_CITED                   (pass-through of a bounded AOT outcome)
SANCTIONS_LISTING_CITED                (pass-through of sanctions_entity_v1)
```

`_CITED` predicates include the upstream outcome as a `FACT`. The AOT adapter inspects the actual bounded outcome and pinned policy context of the `aot_path_audit` entry; a rejected or insufficient traversal is **not** cited as an ownership path.

## 5. Rules

### 5.0 Ingest prerequisite IS-P0 — person-level officer identity

Current writers (`scripts/ukch_stream_silver.py`, `etl/workers/ukch_officers_charges_backfill.py`) populate `silver_uk_officers.officer_id` with the appointment self-link, which is company-scoped. Companies House exposes a person-level identifier through the officer's appointments link (`links.officer.appointments` → `/officers/{officer_id}/appointments`).

IS-P0 adds `silver_uk_officers.ch_person_id` (nullable), populated from that link by both writers, backfilled for existing rows where the source payload retains it, and surfaced to the fact loader as the **only** admissible person key for rule 001. Rows with null `ch_person_id` are `INADMISSIBLE_IDENTITY` for association purposes.

Acceptance for IS-P0: fixtures proving (a) the same person across two companies resolves to one `ch_person_id`; (b) two distinct people with identical names at different companies resolve to two. Rule 001 does not activate until IS-P0 is accepted.

### 5.1 Rule schema

```yaml
rule_id: NYA-INT-ASSOC-001
version: 1
family: ASSOC
predicate: SHARED_OFFICER_ESTABLISHED
status: DRAFT | ACTIVE | RETIRED
depends_on: []                         # rule ids whose INFERENCE outputs this rule may consume
preconditions:
  - id: P1
    kind: fact | derived | cited | inference
    source_families: [uk_ch_officers]
    expression: "<closed evaluator expression>"
    admissibility_floor: ADMISSIBLE_ADVISORY
    necessary: true                    # FALSE here closes the rule
    indicator_text: "<evidence that would satisfy this precondition>"
guards:
  - id: G1
    kind: degree | class | temporal
    expression: "<closed evaluator expression>"
    on_fail: SUPPRESS | DOWNGRADE_TO_HYPOTHESIS
    on_unknown: SUPPRESS               # C12; the only permitted value in v0.2
emits_on_full_match: INFERENCE | DERIVED_FACT
hypothesis_min_true: <int>             # per-rule, replaces the global minimum
governance:
  verification_subject_table: intel_rules
  author_role: INTEL_RULE_AUTHOR
  reviewer_role: INTEL_RULE_REVIEWER
```

The expression evaluator is a **sibling** of `applicability_sufficiency.py`'s predicate evaluator: closed, typed, no free text, supporting comparison, boolean, set membership, interval overlap, count, and the four evaluation values. It shares test patterns with `tests/nyansapo/test_applicability_sufficiency_v2_001.py` and does not extend that module's legal vocabulary.

### 5.2 Guards — three-valued

| Guard | Definition | Value | Default |
|---|---|---|---|
| `officer_degree` | Distinct active appointments for `ch_person_id` at `as_of`, counted over the **complete** admitted officer population for the source release. | `PASS` ≤ 20; `FAIL` > 20; `UNKNOWN` if population completeness for the release is not asserted. | FAIL → SUPPRESS; UNKNOWN → SUPPRESS |
| `address_degree` | Distinct active companies with the same normalised registered address at `as_of`, over the complete admitted company population. | `PASS` ≤ 50; `FAIL` > 50; `UNKNOWN` if completeness not asserted. | FAIL → SUPPRESS; UNKNOWN → SUPPRESS |
| `officer_role_class` | Role ∈ {`secretary`, corporate secretary service}. | `PASS` / `FAIL` / `UNKNOWN` (role missing). | FAIL → DOWNGRADE; UNKNOWN → SUPPRESS |
| `temporal_overlap_min_days` | Overlap of appointment intervals. | `PASS` ≥ 30; `FAIL` < 30; `UNKNOWN` if either interval is open-ended at both ends. | FAIL → close rule; UNKNOWN → precondition `UNKNOWN` |

"Population completeness asserted" means the source release row (`registry_source_releases`) carries a reconciled row count against the upstream manifest. Where it does not, degree is `UNKNOWN` and the guard suppresses. This makes partial acquisitions fail closed. [FD-IS3 covers thresholds and this completeness rule.]

### 5.3 Identity admissibility floor

A person is admissible for rule 001 only via `ch_person_id` (IS-P0). A company is admissible only when its `entity_lineage` row carries an exact-identifier method (registration number, LEI) **or** `match_confidence ≥ 0.90` under a name method **and** `registry_status_code = CONFIRMED_REGISTRY_IDENTITY`. The actual method strings emitted by `etl/pipeline.py` (e.g. `alias_canonical_rev`) are mapped in an explicit allow/deny table in the rule set, not matched by prefix. Alias-reversed methods are denied. [FD-IS4.]

### 5.4 The four rules

**NYA-INT-ASSOC-001 — `SHARED_OFFICER_ESTABLISHED(A, B)`** — emits `INFERENCE`
P1 (necessary): `ch_person_id` *p* has admissible appointment at A with interval `[from_a, to_a)`.
P2 (necessary): *p* has admissible appointment at B ≠ A with interval `[from_b, to_b)`.
P3: derived overlap of the two intervals ≥ 30 days. Open-ended `to` is treated as `as_of`. Both ends open → `UNKNOWN`.
Guards: `officer_degree`, `officer_role_class`.
`hypothesis_min_true: 2`. P1 ∧ P2 `TRUE`, P3 `UNKNOWN` → `HYPOTHESIS` with indicator "appointment dates establishing ≥30-day overlap". Any `FALSE` → closed.

**NYA-INT-ASSOC-002 — `REGISTERED_ADDRESS_COLOCATED_AT(A, B, t)`** — emits `DERIVED_FACT`
P1 (necessary): A's current registered address at `observed_at = t`, normalised, admissible.
P2 (necessary): B's current registered address at the same `t`, normalised, equal to A's.
Guard: `address_degree` at `t`.
No hypothesis form; this rule is `TRUE` or not. It asserts co-location at an instant and nothing about duration.

**NYA-INT-ASSOC-004 — `ASSOCIATION_CLUSTER_SUPPORTED(A, B)`** — emits `INFERENCE`
`depends_on: [001, 002]`.
P1 (necessary): `SHARED_OFFICER_ESTABLISHED(A,B)` present as `INFERENCE`.
P2 (necessary): `REGISTERED_ADDRESS_COLOCATED_AT(A,B,t)` present as `DERIVED_FACT` with `t` inside the 001 overlap interval.
`hypothesis_min_true: 1`. Exactly one of P1/P2 `TRUE` and the other `UNKNOWN` → `HYPOTHESIS` naming the missing one. Either `FALSE` → closed. Never consults ownership (C2); an AOT outcome, if present, is attached alongside as `OWNERSHIP_PATH_CITED`.

**NYA-INT-ASSOC-005 — `RELATIONSHIP_EVIDENCE_CONFLICTED`** — emits `CONFLICT`
P1 (necessary): two admissible facts in the bundle assert incompatible values for the same (subject, predicate, `observed_at`) — e.g. two current registered addresses from two authoritative sources; an appointment both current and resigned at the same `observed_at`.
Emits `CONFLICT` citing both facts, attaching `investigation_ref` if an investigation already references either fact id (§12.2). Does not resolve.

### 5.5 Dependency DAG and evaluation order

The rule loader builds a DAG from `depends_on`, rejects cycles, and fixes evaluation order topologically with rule id as tiebreak. Rule 004 therefore always sees 001 and 002 outputs. A rule may consume only `INFERENCE`/`DERIVED_FACT` outputs of rules it declares, never `HYPOTHESIS`. Lineage closure: the supporting-fact set of 004 is the union of the supporting sets of the 001 and 002 assertions it consumed.

## 6. The Assessment object

### 6.1 Identity

```
assessment_id         asm-YYYY-MMDD-NNNNNN         (storage id; outside the conclusion body)
execution_id          sha256 over (question_type, subject_key, input_bundle_sha256,
                                   rule_set_sha256, engine_sha256, as_of)
question_type         Q-ASSOC-1
subject_key           entity_ref nya:entity:v1:<hex>  |  unresolved:{normalised request + identity state}
as_of                 ISO-8601 UTC; the effective evaluation time passed to freshness and guards
rule_set_version      integer;  rule_set_sha256  digest of the ACTIVE rule definitions
engine_sha256         digest of api/services/intel_synthesis/ at build
decision_effect       "NONE"
supersedes_assessment_id   NULL in v0.2 (reserved for drift)
```

### 6.2 Conclusion body (canonicalised and signed)

```
subject            canonical_id, golden_id, entity_type, identifiers[], identity_state, admissibility_state
input_bundle       §6.4 — the facts, verbatim, as loaded
derived[]          DERIVED_FACT entries with derivation id and input fact ids
assertions[]       assertion_id (deterministic: hash of rule_id, version, subject_refs, predicate),
                   class, predicate, subject_refs[], rule_id, rule_version,
                   preconditions[{id, value: TRUE|FALSE|UNKNOWN|INVALID, satisfied_by: fact_id|null, indicator_text}],
                   guards[{id, value: PASS|FAIL|UNKNOWN, observed_value, population_complete: bool|null}],
                   supporting_fact_ids[], contradicting_fact_ids[],
                   temporal_scope, admissibility_state, investigation_ref|null, decision_effect "NONE"
gaps[]             source_family, reason (UNAVAILABLE | STALE), freshness_state
counts             facts_by_admissibility{}, assertions_by_class{}, guards_suppressed{}
```

### 6.3 Request and audit envelope (outside the signed body)

`assessment_id`, `request_id`, `created_at`, `caller_scan_id`, `external_ref`, `client_id`, `audit_chain_seq`, `signing_key_id`, `signature`, `canonical_sha256`.

### 6.4 Input bundle — materialised facts

Because Silver rows are upserted in place, the bundle stores each fact **as loaded**: source table, row key, full typed field set used by any precondition or guard, `observed_at`, source release id, freshness state at `as_of`, lineage ref (golden → lineage → raw → batch), and the lineage `match_method` string. `input_bundle_sha256` is computed over the canonicalised bundle. Replay (C8) re-runs the rule set over the stored bundle and must reproduce the conclusion body byte-for-byte. Re-execution against live tables is a **new** assessment with its own `execution_id`.

Loader scope: one hop. Companies sharing a `ch_person_id` or a normalised registered address with the subject at `as_of`. Fact tables: `silver_uk_officers` (with `ch_person_id`), `silver_uk_companies`, `golden_records`, `entity_lineage`, `registry_source_releases` (for completeness assertions), `aot_path_audit` (via the bounded-outcome adapter), sanctions gold profile.

## 7. Partial-fire mechanics

1. For each rule in DAG order, evaluate every precondition to `TRUE / FALSE / UNKNOWN / INVALID` and every guard to `PASS / FAIL / UNKNOWN`.
2. Any necessary precondition `FALSE` or `INVALID` → rule closed; nothing emitted (C11). `INVALID` additionally writes a `data_warnings` entry.
3. Any guard `FAIL` with `SUPPRESS`, or any guard `UNKNOWN` → rule suppressed; a `guards_suppressed` count increments; nothing emitted (C12).
4. All preconditions `TRUE`, guards `PASS` → emit the rule's declared class. A `DOWNGRADE` guard `FAIL` → emit `HYPOTHESIS` instead, with the guard recorded.
5. No `FALSE`, ≥ `hypothesis_min_true` `TRUE`, ≥1 `UNKNOWN` → emit one `HYPOTHESIS` with the full precondition table and one `INDICATOR` per `UNKNOWN` precondition using its `indicator_text`.
6. Otherwise emit nothing for that rule.

A hypothesis therefore arises only from silence in the evidence, never from contradiction.

## 8. Coverage (dependency, not built)

Negative assertions require a coverage record proving that the sources which *would* contain the evidence were available, current, and complete for the subject's population at `as_of`. `api/models/coverage.py::DimensionCoverage` provides a presence/dimension model that is the correct base; it does not provide population-wide predicate completeness. NYA-INTEL-SYNTH-002 will extend it with predicate, population, temporal scope, acquisition completeness and inspectable basis. Until it exists, no negative predicate is in the enum (C5). The §5.2 "population completeness asserted" check is the only completeness notion v0.2 uses, and it is used to **suppress**, never to assert.

## 9. Data model

### 9.1 Tables (additive migration, auto-discovered)

```
intel_rules
  rule_id, version, family, predicate, status, definition_jsonb, definition_sha256,
  verification_request_id (FK governed verification), activated_at, retired_at
  PK (rule_id, version); partial unique on (rule_id) WHERE status='ACTIVE'

intel_rule_sets
  rule_set_version PK, rule_versions_jsonb, rule_set_sha256, activated_at

intel_assessments
  assessment_id PK, execution_id UNIQUE, question_type, subject_key, as_of,
  rule_set_version, rule_set_sha256, engine_sha256, input_bundle_sha256,
  body_jsonb, canonical_sha256, signature, signing_key_id, audit_chain_seq,
  created_at, request_id, client_id, caller_scan_id, external_ref,
  supersedes_assessment_id NULL

intel_assertions
  assertion_id PK, assessment_id FK, class, predicate, rule_id, rule_version,
  admissibility_state, subject_refs_jsonb, supporting_fact_ids_jsonb,
  contradicting_fact_ids_jsonb, investigation_ref
```

### 9.2 Grants and governance

Runtime role: `SELECT` all; `INSERT` on `intel_assessments`, `intel_assertions`; **no** `UPDATE`/`DELETE`. Rule rows are written only by the governed activation route. Activation reuses `governed_verification_service` (`create_verification_request` → two typed-role `submit_review`s under `INTEL_RULE_AUTHOR` / `INTEL_RULE_REVIEWER`) and then the stage-advancement gate pattern from `aot_admin_operations_stage_advancement` (env freshness, expected prior state, confirmation phrase, FAILED-row audit) adapted to `intel_rules.status`. "Dual-approved" means two recorded typed-role approvals; it does **not** claim two Ed25519 signatures. [FD-IS8.]

### 9.3 Migration

Additive. Privilege manifest and zero-grant CI gate updated; role tests added. "No existing table change" is a constraint verified by the migration test, not assumed. IS-P0 is a separate, earlier migration on `silver_uk_officers`.

## 10. API

Trusted-service surface. Scope **`INTEL_READ`** added to the closed scope catalogue in `api/models/admin.py`; `require_scope("INTEL_READ")` **and** `require_client_type_in({FIRST_PARTY_APPLICATION})` both applied. Object-level access: an assessment is readable only by the `client_id` that created it. Execution-identity deduplication (§10.1) never returns another client's assessment; a second client with the same execution identity gets its own row referencing the same `execution_id` family **[FD-IS5 variant: or is refused — founder to rule]**.

Route prefix `/v1/intel/assess/*` — no collision with the two existing `api/routes/intel.py` handlers at the inspected revision; re-check against the generated catalogue at wiring time.

### 10.1 `POST /v1/intel/assess`

Request: `{question_type, subject: {golden_id | canonical_id | company_number}, as_of?, caller_scan_id?, external_ref?}`. `as_of` defaults to request time and is pinned into the body.

Behaviour: resolve subject (fail-closed; unresolved → `UNKNOWN` assessment, HTTP 200); load one-hop facts at `as_of`; compute `input_bundle_sha256`; compute `execution_id`; **within one transaction**: insert on `execution_id` unique (on conflict → return existing for this `client_id`), evaluate, canonicalise, sign, serialised `audit_chain` append (§11.3), commit. Returns the Assessment in `StandardEnvelope`; every `INADMISSIBLE_*` and every suppressed guard appears in `data_warnings` with `client_action`.

### 10.2 `GET /v1/intel/assess/{assessment_id}`
Stored body, byte-identical. Same scope, audience and object-level checks.

### 10.3 `GET /v1/intel/assess/{assessment_id}/explain/{assertion_id}`
Rule definition at the cited version; precondition and guard tables; each supporting fact from the stored bundle with its lineage chain resolved via `provenance_explorer_service.get_raw_chain`. Same access boundary.

### 10.4 `GET /v1/intel/assess/{assessment_id}/verify`
**Scoped**, not public. Recomputes `canonical_sha256` from the stored body, verifies the Ed25519 signature under the recorded `signing_key_id` (purpose `assessment_snapshot`), and checks that the recorded `audit_chain_seq` entry carries this assessment's digest. Cryptographic validity is reported separately from factual correctness.

### 10.5 Errors
401/403/422/429/503. Unresolved subject or empty fact set is a 200 with an `UNKNOWN` or empty assessment.

## 11. Canonicalisation, signing, audit

### 11.1 `canonicalize_assessment_v1`
New function. Explicit field schema for the conclusion body (§6.2); sorted keys; nulls pruned; arrays ordered by deterministic ids (`assertion_id`, fact row key); numbers as decimal strings; dates ISO-8601 UTC with fixed precision. `canonicalization_version: "assessment-v1"` is the first bound field. Tests: for every decision-relevant field, mutating it changes the digest; two distinct assessments never canonicalise identically; a stored body re-canonicalises to its stored digest.

### 11.2 Signing
`KeyManager.sign/verify` as-is. New `signing_keys.purpose = 'assessment_snapshot'`, isolated from `investigation_snapshot`. Signature over the canonical bytes with a domain-separation prefix `NYA-ASSESSMENT-V1\0`. Key provisioning in the target environment is a release-readiness receipt, not a code property; the slice does not sign in an environment without an active key — it refuses with 503 and never emits an unsigned assessment.

### 11.3 Audit chain
`AuditChain.append` has no serialisation around read-latest/insert and opens its own connection. v0.2 adds an `append_in_tx(conn, event)` variant that takes `pg_advisory_xact_lock(<chain id>)` and runs inside the assessment transaction, so an assessment and its `ASSESSMENT_SIGNED` event commit or roll back together. Event payload: `{assessment_id, execution_id, canonical_sha256, rule_set_sha256}`. Rule activation/retirement are also events.

## 12. Provenance Explorer integration (link only)

### 12.1 Read surfaces
New search tab **ASSESSMENT**; assessment page with assertions by class and the §10.3 explain payload; **ASSESSMENTS** lifeline lane; **synthesis** stage appended to the stage chain. All admin-authenticated as the Explorer already is.

### 12.2 Investigations — link only
Rule 005 attaches `investigation_ref` when an existing investigation references either contradicting fact id. The engine never files investigations.

### 12.3 Overrides — deferred to NYA-INTEL-SYNTH-003
Investigation outcomes do **not** alter admissibility in v0.2. The future override object will be immutable, signed, name fact ids/hashes, target predicates, effect, reviewer authority and effective time, and will be pinned into the input bundle; only `SIGNED` investigations will be eligible to source one.

## 13. Acceptance gate

### 13.1 Correctness
- **A1 Replay.** 100 stored assessments regenerate a byte-identical conclusion body from their stored input bundle, rule-set digest and engine digest. Stored signature verifies separately.
- **A2 Constitution.** Tests for C1–C12 pass; C7 CI grep gate present.
- **A3 Canonicaliser.** Per-field tamper tests pass; distinct-assessment collision test passes.
- **A4 Explain.** Every `INFERENCE`/`HYPOTHESIS` in a 500-assessment sample resolves to a complete explain payload with lineage to a signed batch for every supporting fact.
- **A5 IS-P0 identity fixtures** pass (§5.0).

### 13.2 Analytic quality — the number that decides
Frozen benchmark: selection script, seed, labels, identity evidence and input bundles committed.

- **A6 Negative control.** 200 company pairs selected as unrelated (different `ch_person_id` sets, different normalised addresses, different towns) plus **50 hard negatives** (same formation agent address, degree > 50; same nominee director, degree > 20). Report the count receiving `ASSOCIATION_CLUSTER_SUPPORTED` with a 95% Wilson interval. Gate: observed ≤ 2 of 200 on the plain set **and** 0 of 50 on the hard set (every hard negative must show a guard suppression, not a near miss).
- **A7 Positive control.** 200 pairs hand-verified to share a `ch_person_id` with ≥30-day overlap and to be co-located at a `t` inside it. Report hits with interval. Gate: observed ≥ 180. Report separately: (i) misses due to guard suppression — each reviewed and agreed correct; (ii) misses due to identity floor; (iii) genuine misses. Suppressions do not count as hits.
- **A8 Predicate-level accuracy.** Same sets, reported per rule (001, 002) before compound 004.
- **A9 Guard effect.** Cluster count over a 10,000-company random sample, guards off vs on, with `UNKNOWN`-suppression count shown separately. No target; informs FD-IS3 v2.
- **A10 Reviewer agreement.** Two reviewers classify 50 random `HYPOTHESIS` assertions as useful / not useful. Gate ≥ 80% agreement that the indicator names the right missing evidence.

### 13.3 Operational
- **A11** p95 `POST /v1/intel/assess` ≤ 2.0 s on QA for subjects with ≤ 50 one-hop neighbours.
- **A12** Zero-grant gate passes for `intel_*`.
- **A13** QA/UAT digests match at the slice commit.
- **A14 Signing readiness receipt**: an `assessment_snapshot` key active in the target environment, one assessment signed, verified via §10.4, and its `ASSESSMENT_SIGNED` event present in `audit_chain`, recorded in the acceptance manifest. Code presence is not evidence of this.

If A6 or A7 fail: thresholds re-ruled, rule versions bump, benchmark re-runs. After two re-rulings still failing, the rule family is retired and redesigned. That is a success of the method.

## 14. Decisions required before IS-1

| ID | Decision | Recommendation |
|---|---|---|
| FD-IS1 | Confirm Q-ASSOC-1 and IS-P0 as prerequisite. | Yes. Without person identity there is no association question. |
| FD-IS2 | Evaluator. | **Resolved: sibling**, semantics from `applicability_sufficiency.py`; no extension of AOT or applicability vocabularies. |
| FD-IS3 | Guard thresholds (20 / 50 / 30 d) **and** the rule that unasserted population completeness → `UNKNOWN` → suppress. | Accept both for v1; A9 informs v2. |
| FD-IS4 | Identity floor with an explicit method allow/deny table rather than a bare 0.90. | Accept; `alias_canonical_rev` denied. |
| FD-IS5 | Execution identity = hash of inputs; DB unique; cross-client dedup refused or separate row. | Separate row per client, same `execution_id` family; never cross-client disclosure. |
| FD-IS6 | Verify endpoint. | **Resolved: scoped.** Public verifier is NYA-INTEL-SYNTH-005. |
| FD-IS7 | Route prefix. | `/v1/intel/assess/*`; no collision at inspected revision. |
| FD-IS8 | Rule governance meaning of "dual-approved". | Two typed-role approvals via `governed_verification_service`; not two cryptographic signatures. New roles `INTEL_RULE_AUTHOR` / `INTEL_RULE_REVIEWER`. |
| FD-IS9 | Coverage. | **Deferred** to NYA-INTEL-SYNTH-002; v0.2 emits no negatives. |
| FD-IS10 | Rule 002 as point-in-time co-location rather than interval. | Accept; name says `_AT`; interval form after IS-P1. |
| FD-IS11 | Refuse (503) rather than emit unsigned when no active key. | Accept. |

## 15. Phasing

| Phase | Content | Exit |
|---|---|---|
| IS-P0 | Ingest: `ch_person_id` capture + backfill; identity fixtures. | A5. |
| IS-0 | Migration; `intel_rules`, rule loader, DAG, sibling evaluator; four rules in DRAFT; governed-verification wiring. | Rules load; cycle and cross-family rejection tests. |
| IS-1 | Fact loader at `as_of`; input bundle + hash; admissibility; three-valued guards; AOT bounded-outcome adapter. | Loader tests; C9, C12 enforced. |
| IS-2 | Engine incl. partial fire; assessment construction; `canonicalize_assessment_v1`; signing; serialised audit append in-tx. | A1, A2, A3. |
| IS-3 | Routes; `INTEL_READ` + audience + object-level checks; trusted-service SDK `assess()` Python/TS; parity gate. | Contract-complete per catalogue generator. |
| IS-4 | Explorer tab, lane, stage, explain view. | A4. |
| IS-5 | Benchmarks A6–A10; signing receipt A14; acceptance manifest; founder ruling keep / re-rule / retire. | Ruling recorded. |

No phase begins before FD-IS1–IS11 are ruled. IS-0 may begin before IS-P0 completes; IS-1 may not. Rule activation (DRAFT → ACTIVE) only in IS-5 after the benchmark, under the governed gate.

## 16. Glossary

| Term | Meaning |
|---|---|
| Assessment | Signed output of one question over one subject, containing its own input bundle. `asm-` id; `execution_id` for identity. |
| Input bundle | Facts materialised verbatim at evaluation; hashed; basis for replay. |
| Execution identity | Hash of question, subject key, bundle hash, rule-set digest, engine digest, `as_of`. |
| `TRUE / FALSE / UNKNOWN / INVALID` | Precondition evaluation values; only `UNKNOWN` can spawn a hypothesis. |
| `PASS / FAIL / UNKNOWN` | Guard values; `UNKNOWN` suppresses. |
| `ch_person_id` | Person-level Companies House officer identifier captured by IS-P0. |
| Population completeness asserted | Source release row count reconciled to upstream manifest; prerequisite for a degree guard to `PASS`. |
| Sibling evaluator | The synthesis expression evaluator; shares semantics and test patterns with `applicability_sufficiency.py`, extends neither it nor AOT. |
| `_CITED` predicate | Pass-through of a bounded upstream outcome (AOT, sanctions), never computed here. |
| C1–C12 | Constitutional prohibitions. |
| FD-IS1–11 | Founder decisions required. |
| A1–A14 | Acceptance criteria. |
| NYA-INTEL-SYNTH-002/003/004/005 | Deferred: coverage/negatives; overrides; drift; public verifier. |

---

*v0.2.0 generated 2026-10-12. DRAFT — not authorised for implementation.*
