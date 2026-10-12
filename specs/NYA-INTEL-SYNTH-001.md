
# NYA-INTEL-SYNTH-001 — Deterministic Intelligence Synthesis

**Vertical slice specification · Question type Q-ASSOC-1 ("source-established relationships around X")**

| | |
|---|---|
| Document ID | NYA-INTEL-SYNTH-001 |
| Status | DRAFT v0.1.0 — for founder review. Nothing in this document is authorised for implementation until ruled. |
| Classification | INTERNAL |
| Programme | Nyansapo — Intelligence plane |
| Depends on | NYA-PROVENANCE-EXPLORER-001 PR-0 (batch pinning, `golden_record_versions`, `observed_at`), AOT policy engine, `audit_chain` / `signing_keys` / `canonicalize_receipt_v2` |
| Decision effect | `CONTEXT_ONLY`. `decision_effect_allowed = FALSE`, hardwired, not flag-controlled. |
| Author | Prepared with Claude for Omaida Ali, 2026-10-12 |

---

## 0. Document control and reading guide

This specification defines the smallest unit of the intelligence layer that can be built, measured and either kept or discarded on evidence. It is deliberately narrow: **one question type, five rules, one endpoint, one explain view, no PDF, no language model.**

Sections 1–3 fix what the layer is and is forbidden to do. Sections 4–8 define the rule schema, the assessment object and the mechanics that produce hypotheses, gaps and negatives. Sections 9–12 cover storage, API, signing and Explorer integration. Section 13 is the acceptance gate the slice must pass. Section 14 lists the decisions the founder must rule before PR-1 opens.

Where this document names an existing table, module or scope, it is relying on the July–September 2026 artefact set and the 2026-10-12 Explorer state. Items marked **[VERIFY]** must be confirmed against `origin/main` before implementation.

---

## 1. Purpose and framing

Nyansapo today serves governed facts and answers one analytic question deterministically — *who owns or controls X* — through AOT. Everything else it returns is a fact, a retrieval or a resolution state. Consumers who need to know *what the admissible evidence, taken together, establishes* about a subject must assemble that picture themselves, which in practice means a human or a generative model draws the lines.

This slice adds a second analytic question alongside AOT, using AOT's governance pattern (gated, stage-capped, fail-closed, append-only audit) rather than a new plane:

> **Q-ASSOC-1:** *What source-established relationships exist around subject X, and what do they establish?*

The output is a signed, snapshot-pinned **Assessment** whose every assertion carries a defined epistemic class, a rule id and version, and the fact ids that support or contradict it. The Assessment says what is established, what is not, what conflicts, and — mechanically, from partially-satisfied rules — what evidence would change the answer.

Framing that must survive every later document in this programme:

- This is a **generalisation of AOT**, not a new subsystem. AOT answers ownership. Q-ASSOC-1 answers association. Both are instances of the same engine shape.
- The Assessment is **context**. It never carries decision effect. Veredis composes it with transaction facts and makes the decision.
- **No language model** participates in producing an Assessment. A renderer may later turn a complete Assessment into prose; the structured object remains canonical. The renderer is out of scope for this slice.

## 2. Scope

### 2.1 In scope

1. One question type, `Q-ASSOC-1`, over one subject (a `golden_id` / `canonical_id`).
2. A rule schema and five governed rules (§5) with degree guards and admissibility floors.
3. The Assessment object (§6), its epistemic classes (§4), and partial-fire mechanics for hypotheses, indicators and gaps (§7).
4. Negative-assertion gating by coverage evidence (§8).
5. Storage (§9), a trusted-service endpoint plus an explain endpoint (§10), signing (§11), and the Explorer hooks (§12).
6. An acceptance benchmark with a measured false-positive rate (§13).

### 2.2 Out of scope — explicitly

- Any question type other than `Q-ASSOC-1`. Ownership and control remain AOT's; this slice **cites** AOT outcomes as facts and never recomputes them.
- Temporal interval algebra beyond simple overlap and ordering (§5 uses overlap only).
- Analysis of competing hypotheses (ACH) matrices.
- Inference drift tracking across batches (§9.4 reserves the column; no logic).
- Prose rendering, PDF, LLM involvement of any kind.
- Public/external SDK exposure. Trusted-service only.
- Auto-filing of Explorer investigations. The slice **links** to investigations; it does not create them (§12.2 explains why this is deferred).
- Veredis-side consumption, the "Bounded Intelligence Summary" section, and anything scenario-conditioned. Nyansapo never receives scenarios.

## 3. Constitutional prohibitions

These are invariants, enforced in code and tests, not guidance. A PR that weakens any of them fails review regardless of its other merits.

| # | Prohibition | Enforcement |
|---|---|---|
| C1 | No assertion may carry `decision_effect` other than `NONE`. | Hardcoded on the model; no flag. Test asserts the field is a `Literal["NONE"]`. |
| C2 | Association is never promoted to ownership or control. No rule in the `ASSOC` family may emit an assertion whose predicate is in the `CONTROL` or `OWNERSHIP` family. | Rule loader rejects cross-family predicates. |
| C3 | Intent, purpose or culpability is never inferred. No predicate vocabulary exists for them. | Predicate enum is closed (§4.3). |
| C4 | Graph proximity is not evidence. No rule may fire on path length alone. | Rule schema requires ≥1 non-topological precondition. |
| C5 | An absent record is not evidence unless a coverage record admits it (§8). | Negative assertions without a `coverage_ref` are rejected at construction. |
| C6 | A Ceres passage is never a fact. Ceres is not a fact source for this engine. | Fact ids are validated against fact tables only; `retrieval_chunks` is not one. |
| C7 | No generative model in the production path. | No LLM client importable from `api/services/intel/`. CI grep gate. |
| C8 | An Assessment is reproducible from `(snapshot_id, rule_set_version)` alone. | Replay test regenerates a stored Assessment byte-for-byte. |
| C9 | Every inference inherits the weakest admissible supporting fact. An assertion's `admissibility_state` may not exceed the minimum of its supports. | Computed, not supplied; assertion constructor enforces. |
| C10 | Rules are governed objects: versioned, dual-signed, immutable once active. | Same control as CGC corpora (`CCG_*_REVIEWER` pattern). |

## 4. Epistemic model

### 4.1 Assertion classes

Every assertion in an Assessment belongs to exactly one class.

| Class | Definition | Produced by |
|---|---|---|
| `FACT` | Directly supported by an admissible source record. | Fact loader (§6.3); never by a rule. |
| `DERIVED_FACT` | Deterministic transformation of facts with no judgement content (e.g. two intervals overlap; two normalised addresses are equal). | Derivation functions, each with a stable id. |
| `INFERENCE` | Conclusion produced by a governed rule whose preconditions are all satisfied. | Rule engine. |
| `CONFLICT` | Two or more admissible facts assert incompatible values for the same predicate. | Rule engine conflict pass. |
| `HYPOTHESIS` | A rule whose preconditions are partially satisfied (§7). Carries the rule id and the satisfied/unsatisfied preconditions. | Rule engine, partial fire only. |
| `INDICATOR` | The specific unsatisfied precondition of a `HYPOTHESIS`, stated as the evidence that would satisfy it. | Rule engine, derived from the rule definition. |
| `GAP` | A required source is unavailable, stale, or its coverage of the subject population is unknown. | Coverage check (§8). |
| `UNKNOWN` | The question cannot be answered for a stated structural reason (e.g. subject unresolved). | Engine entry gate. |

There is no `PROBABLE`, `LIKELY` or `SUSPECTED` class. Uncertainty is expressed only by the class an assertion holds and by the admissibility state of its supports.

### 4.2 Admissibility states

Each fact and each assertion carries one:

| State | Meaning |
|---|---|
| `ADMISSIBLE` | Identity confirmed; source `AUTHORITATIVE`; freshness `CURRENT_WITH_UPSTREAM`; row release current. |
| `ADMISSIBLE_ADVISORY` | As above but source tier `ADVISORY` (per `JURISDICTION_RESOLUTION_V2` semantics). |
| `INADMISSIBLE_IDENTITY` | Identity link below floor (§5.3) or unresolved. |
| `INADMISSIBLE_STALE` | Freshness or row release not current. |
| `INADMISSIBLE_OVERRIDDEN` | A concluded Explorer investigation has set this fact aside (§12.3). |

Rules consume only `ADMISSIBLE` and `ADMISSIBLE_ADVISORY` facts. An assertion built on any `ADMISSIBLE_ADVISORY` support is itself at most `ADMISSIBLE_ADVISORY` (C9).

### 4.3 Predicate vocabulary (closed)

The slice ships exactly these predicates. Adding one is a rule-set version change.

```
ASSOCIATION_CLUSTER_SUPPORTED
ASSOCIATION_CLUSTER_NOT_ESTABLISHED
SHARED_OFFICER_ESTABLISHED
SHARED_REGISTERED_ADDRESS_ESTABLISHED
TEMPORAL_OVERLAP_ESTABLISHED
OWNERSHIP_PATH_CITED            (cites an AOT outcome; never computed here)
SANCTIONS_LISTING_CITED         (cites sanctions_entity_v1; never computed here)
RELATIONSHIP_EVIDENCE_CONFLICTED
```

Predicates ending `_CITED` are pass-throughs: the engine includes the upstream outcome as a `FACT` and may use it as a precondition, but never produces or modifies it.

## 5. Rules

### 5.1 Rule schema

```yaml
rule_id: NYA-INT-ASSOC-001
version: 1
family: ASSOC
predicate: SHARED_OFFICER_ESTABLISHED
status: DRAFT | ACTIVE | RETIRED
preconditions:
  - id: P1
    kind: fact | derived | cited
    source_families: [uk_ch_officers]          # which fact tables may satisfy it
    expression: "<deterministic predicate over fact fields>"
    admissibility_floor: ADMISSIBLE_ADVISORY   # minimum state a satisfying fact may hold
    indicator_text: "<what evidence would satisfy this precondition>"
guards:
  - id: G1
    kind: degree | class | temporal
    expression: "<deterministic guard>"
    on_fail: SUPPRESS | DOWNGRADE_TO_HYPOTHESIS
emits_on_full_match: INFERENCE
emits_on_partial_match: HYPOTHESIS    # with INDICATOR per unsatisfied precondition
min_preconditions_for_hypothesis: 2
signatures:
  - role: INTEL_RULE_AUTHOR
  - role: INTEL_RULE_REVIEWER
```

Expressions are evaluated by a small, closed expression evaluator over typed fact fields — comparison, boolean, set membership, interval overlap, count. No arbitrary code, no regex over free text. **[DECISION FD-IS2]** whether to reuse the AOT policy-engine evaluator or write a sibling.

### 5.2 Degree and class guards — why they exist

On UK Companies House data, naïve "shared address" and "shared officer" rules fire on formation agents and nominee directors. Single registered addresses carry thousands of companies; nominee officers sit on thousands of boards. Without guards the slice produces millions of clusters and proves nothing. Guards are therefore part of the rule and versioned with it.

| Guard | Definition | Default |
|---|---|---|
| `address_degree` | Number of distinct active companies registered at the normalised address at `observed_at`. | Suppress above **50** [DECISION FD-IS3] |
| `address_class` | Address tagged `REGISTERED_AGENT`, `FORMATION_AGENT`, `VIRTUAL_OFFICE` by a governed classifier **[VERIFY: does one exist; if not, degree guard only]**. | Suppress if tagged |
| `officer_degree` | Number of distinct active appointments for the resolved person at `observed_at`. | Suppress above **20** [DECISION FD-IS3] |
| `officer_role_class` | Role is `SECRETARY` or corporate secretary service. | Downgrade to `HYPOTHESIS` |
| `temporal_overlap_min_days` | Overlap of appointment/occupancy intervals. | Require ≥ **30** days |

Thresholds are founder-ruled constants in the rule definition, not environment variables. Changing one is a rule version bump.

### 5.3 Identity admissibility floor

A person or company match is admissible for this engine only if the lineage record's `match_method` is in the **exact-identifier** strategy set (registration number, LEI, officer id, PSC id) **or** `match_confidence ≥ 0.90` under a name strategy **and** the record carries `CONFIRMED_REGISTRY_IDENTITY` where the registry provides it. Fuzzy and alias-reversed strategies (`STRATEGY_7R_ALIAS_REVERSED` and similar) are **inadmissible** for association rules in this slice. [DECISION FD-IS4 — the 0.90 figure.]

Rationale: association clusters amplify resolver error. A weak identity match at one hop becomes an "established" association two hops away. The floor is set high and may be relaxed later on measured evidence, not the reverse.

### 5.4 The five rules

**NYA-INT-ASSOC-001 — `SHARED_OFFICER_ESTABLISHED`**
P1: person *p* has admissible appointment at company A.
P2: *p* has admissible appointment at company B, B ≠ A.
P3 (derived): appointment intervals overlap ≥ 30 days.
Guards: `officer_degree ≤ 20` (suppress); `officer_role_class ∉ {SECRETARY}` (downgrade).
Full match → `INFERENCE`. P1+P2 without P3 → `HYPOTHESIS`, indicator: "appointment dates establishing ≥30-day overlap".

**NYA-INT-ASSOC-002 — `SHARED_REGISTERED_ADDRESS_ESTABLISHED`**
P1: A has registered address *a* with admissible occupancy interval.
P2: B has registered address *a*, B ≠ A.
P3 (derived): intervals overlap ≥ 30 days.
Guards: `address_degree ≤ 50` (suppress); `address_class` not agent/virtual (suppress).
Partial: P1+P2 without P3 → `HYPOTHESIS`.

**NYA-INT-ASSOC-003 — `TEMPORAL_OVERLAP_ESTABLISHED`**
Derived-only rule. Emits a `DERIVED_FACT` for any pair of admissible intervals from 001/002 that overlap. Exists so overlap is a citable object with its own id, not an implicit computation.

**NYA-INT-ASSOC-004 — `ASSOCIATION_CLUSTER_SUPPORTED`**
P1: `SHARED_OFFICER_ESTABLISHED(A,B)` as `INFERENCE`.
P2: `SHARED_REGISTERED_ADDRESS_ESTABLISHED(A,B)` as `INFERENCE`.
P3: both overlaps intersect (the officer overlap and the address overlap share ≥ 30 days).
Full match → `INFERENCE ASSOCIATION_CLUSTER_SUPPORTED(A,B)`.
P1 xor P2 → `HYPOTHESIS`, indicator naming the missing one.
Neither → engine emits `ASSOCIATION_CLUSTER_NOT_ESTABLISHED(A,B)` **only** if §8 coverage permits; otherwise `GAP`.
This rule never consults ownership (C2). If an AOT outcome exists it is attached as `OWNERSHIP_PATH_CITED` alongside, never inside.

**NYA-INT-ASSOC-005 — `RELATIONSHIP_EVIDENCE_CONFLICTED`**
P1: two admissible facts assert incompatible values for the same (subject, predicate, interval) — e.g. two current registered addresses from two authoritative sources, or an appointment both current and resigned at the same `observed_at`.
Emits `CONFLICT`, cites both facts, and attaches `investigation_ref` if an Explorer investigation already exists for either fact (§12.2). The engine does not attempt to resolve the conflict.

## 6. The Assessment object

### 6.1 Identity and pinning

```
assessment_id        asm-YYYY-MMDD-NNNNNN
question_type        Q-ASSOC-1
subject_ref          nya:entity:v1:<32hex>
snapshot_id          <from envelope; batch chain head seq at run>
source_snapshot_hash <from envelope>
rule_set_version     <integer; monotonic; maps to the set of ACTIVE rule versions>
engine_version       <semver of api/services/intel/>
created_at           ISO-8601 UTC
request_id           <correlation>
caller_scan_id       <optional; Veredis>
external_ref         <optional; consumer filing reference>
decision_effect      "NONE"          # Literal, C1
```

### 6.2 Body

```
subject
  canonical_id, golden_id, entity_type, identifiers[], jurisdictions[], aliases[],
  identity_state (CONFIRMED_REGISTRY_IDENTITY | ...), admissibility_state

facts[]                      # class FACT and DERIVED_FACT
  fact_id, class, predicate, subject_refs[], value, observed_at,
  valid_from, valid_to, source_id, source_family, authority_tier,
  freshness_state, row_release_current, lineage_ref (golden→lineage→raw→batch),
  admissibility_state, admissibility_reason

assertions[]                 # class INFERENCE | CONFLICT | HYPOTHESIS | INDICATOR | GAP | UNKNOWN
  assertion_id, class, predicate, subject_refs[],
  rule_id, rule_version,
  preconditions[{id, satisfied: bool, satisfied_by: fact_id | null, indicator_text}],
  guards[{id, passed: bool, observed_value}],
  supporting_fact_ids[], contradicting_fact_ids[],
  temporal_scope {from, to}, jurisdiction_scope[],
  admissibility_state,          # computed per C9
  coverage_ref                  # required for *_NOT_ESTABLISHED (C5)
  investigation_ref             # optional; CONFLICT only
  decision_effect "NONE"

coverage[]                   # §8
  source_id, population_def, completeness_state, as_of

counts
  facts_admissible, facts_inadmissible_by_reason{}, assertions_by_class{}

proof
  canonical_sha256, signature, signing_key_id, audit_chain_seq
```

### 6.3 Fact loading

Facts are loaded from fact tables only, by `golden_id`, at the pinned snapshot. For the slice: `silver_uk_officers`, `silver_uk_companies` (registered address + status), `silver_uk_psc` (read for PSC-id identity only, not for ownership), `gleif` LEI/RR for identity corroboration, `golden_records` and `entity_lineage` for identity state, `aot_path_audit` for `OWNERSHIP_PATH_CITED`, and the sanctions gold profile for `SANCTIONS_LISTING_CITED`. **[VERIFY all table names against current schema.]**

The loader walks **one hop** from the subject (companies sharing an officer or address with the subject) and no further. Two-hop clusters are a later question type.

## 7. Partial-fire mechanics

This is the mechanism that produces hypotheses, indicators and gaps without any authored judgement.

1. For each ACTIVE rule, evaluate every precondition independently against the admissible fact set.
2. If all preconditions are satisfied and all `SUPPRESS` guards pass → emit the rule's `INFERENCE`. If a `DOWNGRADE` guard fails → emit `HYPOTHESIS` instead, with the guard recorded.
3. If at least `min_preconditions_for_hypothesis` are satisfied but not all → emit one `HYPOTHESIS` carrying the full precondition table, and one `INDICATOR` per unsatisfied precondition using that precondition's `indicator_text`.
4. If an unsatisfied precondition's `source_families` are all in a `GAP` coverage state for the subject (§8), additionally emit a `GAP` assertion pointing at the indicator. The analyst sees: *this is missing, and here is why we couldn't have found it.*
5. If fewer than `min_preconditions_for_hypothesis` are satisfied → emit nothing for that rule.

No hypothesis can exist without a rule id and a concrete list of what would satisfy it. No indicator is free text authored at run time; it is the rule's own `indicator_text`.

## 8. Negative assertions and coverage

A negative (`*_NOT_ESTABLISHED`) is a claim about the world, not about the engine's evidence. Doctrine: *missing ≠ innocence*. The engine therefore emits a negative only when it can cite a **coverage record** showing that the sources which *would* contain the evidence (a) were available at the snapshot, (b) are current, and (c) cover the population the subject belongs to.

```
coverage_record
  source_id
  population_def        e.g. "UK-registered companies, active or dissolved ≤ 20y"
  completeness_state    COMPLETE | PARTIAL | UNKNOWN
  completeness_basis    e.g. "bulk mirror, row count reconciled to upstream manifest"
  as_of
```

For the slice, coverage records are **static, founder-declared** rows per source in a new `source_coverage` table (§9.2), not computed. Computing coverage is a separate programme. If a required source has `completeness_state ≠ COMPLETE` for the subject's population, the engine emits `GAP` with that coverage record, not a negative.

Consequence for the worked example in the ChatGPT discussion: "No admissible evidence establishes ownership of A by B" is **not** emittable by this slice at all — ownership is AOT's, and the only negative this slice may emit is `ASSOCIATION_CLUSTER_NOT_ESTABLISHED`, with coverage.

## 9. Data model

### 9.1 New tables

```
intel_rules
  rule_id, version, family, predicate, status, definition_jsonb, definition_sha256,
  author_sig, reviewer_sig, activated_at, retired_at
  PK (rule_id, version); partial unique index on (rule_id) WHERE status='ACTIVE'

intel_rule_sets
  rule_set_version (PK), rule_versions_jsonb, sha256, activated_at

intel_assessments
  assessment_id (PK), question_type, subject_golden_id, snapshot_id, source_snapshot_hash,
  rule_set_version, engine_version, body_jsonb, canonical_sha256,
  signature, signing_key_id, audit_chain_seq, created_at, request_id,
  caller_scan_id, external_ref
  -- append-only; no UPDATE grant to any runtime role

intel_assertions
  assertion_id (PK), assessment_id (FK), class, predicate, rule_id, rule_version,
  admissibility_state, subject_refs_jsonb, supporting_fact_ids_jsonb,
  contradicting_fact_ids_jsonb, coverage_ref, investigation_ref
  -- denormalised from body for query; same append-only grant

source_coverage
  source_id, population_def, completeness_state, completeness_basis, as_of, declared_by
```

### 9.2 Grants

Runtime API role: `SELECT` on all; `INSERT` on `intel_assessments`, `intel_assertions`. No `UPDATE`/`DELETE` anywhere. Rule activation is an admin-route operation under the same governed-gate pattern as `NYA_AOT_STAGE` advancement (confirmation phrase, `env_guard`, FAILED-row audit). The zero-grant CI gate from VER-NYA-CUSTOMS-NEXT A1 applies.

### 9.3 Migration

One migration, additive only. No change to any existing table. `MIGRATION_FILES` registration per current convention **[VERIFY convention still applies]**.

### 9.4 Reserved, not implemented

`intel_assessments.supersedes_assessment_id` — nullable, reserved for drift tracking. The slice writes NULL.

## 10. API

Trusted-service surface only. Scope **`INTEL_READ`** (new, internal; never granted to external client types). Routes are `/v1/intel/assess/*` — **[VERIFY: `/v1/intel/*` currently hosts `intel_service` "full quad" routes; confirm no collision, else use `/v1/synthesis/*`]**.

### 10.1 `POST /v1/intel/assess`

Request:
```json
{
  "question_type": "Q-ASSOC-1",
  "subject": { "golden_id": 123456 } | { "canonical_id": "nya-…" } | { "company_number": "12345678" },
  "caller_scan_id": "optional",
  "external_ref": "optional"
}
```

Behaviour: resolves the subject (fail-closed; unresolved → `UNKNOWN` Assessment, HTTP 200, not 404), loads facts at the current snapshot, runs the ACTIVE rule set, builds, canonicalises, signs and appends the Assessment, returns it in `StandardEnvelope`. Idempotency: same `(subject, snapshot_id, rule_set_version)` returns the existing Assessment rather than creating a duplicate. [DECISION FD-IS5 — whether to expose an explicit `Idempotency-Key` header instead.]

Response `data`: the Assessment (§6). Envelope carries `snapshot_id`, `source_snapshot_hash`, `data_warnings[]` (every `INADMISSIBLE_*` reason appears as a warning with `client_action`).

### 10.2 `GET /v1/intel/assess/{assessment_id}`

Returns the stored Assessment. Byte-identical to the original response body.

### 10.3 `GET /v1/intel/assess/{assessment_id}/explain/{assertion_id}`

Returns the rule definition at the cited version, the precondition table with the satisfying fact for each, guard observations, and each supporting fact with its full lineage chain (reusing `ReceiptBuilder` / Explorer reconstruction). This is the machine form of the Explorer's "why" view.

### 10.4 `GET /v1/intel/assess/{assessment_id}/verify`

Public-verify pattern as `/v1/provenance/snapshots/{id}/verify`: recomputes canonical hash, checks signature and `audit_chain` membership. No scope required **[DECISION FD-IS6 — public or `INTEL_READ`]**.

### 10.5 Errors

Standard: 401/403/422/429/503. Note: an unresolved subject or an empty fact set is **not** an error; it is an `UNKNOWN` or empty Assessment. The engine never 404s on "nothing found."

## 11. Signing and audit

- Canonicalisation: `canonicalize_receipt_v2` (sorted keys, pruned nulls) over the Assessment minus `proof`.
- Signature: Ed25519 under a **new** key purpose `assessment_snapshot` in `signing_keys`. Separate from `investigation_snapshot` so either can be rotated or revoked independently.
- `audit_chain`: append `ASSESSMENT_SIGNED {assessment_id, sha256, rule_set_version, snapshot_id}`.
- Rule activation and retirement are also `audit_chain` events (`INTEL_RULE_ACTIVATED`, `INTEL_RULE_RETIRED`).
- Key custody: inherits whatever the Aqueduct amendment settled for private-key mounting. This slice does not re-open that question but does not ship until an `assessment_snapshot` key exists in the target environment.

## 12. Provenance Explorer integration

### 12.1 Search and explain

- New search tab **ASSESSMENT** accepting `asm-…` and assertion ids.
- Assessment page: subject header, assertions grouped by class, each assertion expandable to the §10.3 explain payload, each fact linking to the existing lineage graph.
- New lifeline lane **ASSESSMENTS** on the entity result page, one marker per Assessment for the subject.
- Stage chain gains a final stage **synthesis** after *gold projection*; a `DERIVED_FACT` or `INFERENCE` carries a divergence pin at that stage by definition.

### 12.2 Investigations — link only, in this slice

`CONFLICT` assertions attach `investigation_ref` if an OPEN/IN_PROGRESS/CONCLUDED investigation already references either contradicting fact. The engine does **not** file investigations. Reason: filing at engine scale before humans have concluded a meaningful number by hand produces a backlog that nobody adjudicates, and an unadjudicated backlog is indistinguishable from no governance. Auto-filing is the first candidate for the slice after this one, gated on a measured conclusion rate.

### 12.3 Investigation outcomes as admissibility overrides

Concluded investigations feed the fact loader as overrides:

| Outcome | Effect on the cited fact(s) |
|---|---|
| `STALE_SOURCE` | `INADMISSIBLE_OVERRIDDEN` |
| `ENTITY_RESOLUTION_ERROR` | `INADMISSIBLE_OVERRIDDEN`; any identity link through the fact is severed for this run |
| `SOURCE_CLASSIFICATION_ERROR` | `INADMISSIBLE_OVERRIDDEN` |
| `DIFFERENT_SEMANTIC_MEANING` | Both facts remain admissible; the pair is excluded from rule 005 (no conflict) |
| `CONFLICT_CONFIRMED` | Both facts remain admissible; rule 005 emits `CONFLICT` with the `investigation_ref`; rule 004 treats the pair as unsatisfied |
| `CONFLICT_DISPROVED` | Per the investigation's recorded resolution; the disproved fact becomes `INADMISSIBLE_OVERRIDDEN` |
| `INSUFFICIENT_EVIDENCE` | No change |

This is the only path by which a human changes what the engine may conclude, and it is already dual-controlled, signed and append-only. The engine never writes to investigations.

## 13. Acceptance gate

The slice is kept only if it passes all of the following on QA data. Results are recorded in a signed acceptance manifest per existing convention.

### 13.1 Correctness

- **A1 Replay.** 100 stored Assessments regenerate byte-identical from `(subject, snapshot_id, rule_set_version)`.
- **A2 Constitution.** Tests for C1–C10 exist and pass; C7 enforced by a CI grep gate on `api/services/intel/`.
- **A3 Explain completeness.** Every `INFERENCE` and `HYPOTHESIS` in a 500-Assessment sample has a resolvable explain payload with lineage to a signed batch for every supporting fact.

### 13.2 Analytic quality — the number that decides

- **A4 Negative control.** A frozen benchmark of **200 company pairs** selected to be unrelated (different formation agents, no shared officers by exact id, different cities; selection script and seed committed). Run Q-ASSOC-1 on each left-hand subject. Target: **≤ 2 pairs** (1%) receive `ASSOCIATION_CLUSTER_SUPPORTED` involving the right-hand company.
- **A5 Positive control.** A frozen benchmark of **200 company pairs** with hand-verified shared officer **and** shared registered address with overlap (verification notes committed). Target: **≥ 180** (90%) receive `ASSOCIATION_CLUSTER_SUPPORTED`; of the remainder, every miss is explained by a guard suppression or an identity floor failure that a reviewer agrees was correct.
- **A6 Guard effect.** Report cluster count with guards disabled vs enabled over a 10,000-company random sample. The ratio is recorded; there is no target, but if the guarded count is still in the hundreds of thousands the thresholds in FD-IS3 are re-ruled before activation.
- **A7 Reviewer agreement.** Two reviewers independently classify 50 random `HYPOTHESIS` assertions as *useful / not useful*. Target ≥ 80% agreement that the indicator text names the right missing evidence.

### 13.3 Operational

- **A8** p95 latency for `POST /v1/intel/assess` on a subject with ≤ 50 one-hop neighbours ≤ 2.0 s on QA.
- **A9** Zero `UPDATE`/`DELETE` grants on `intel_*` tables verified by the zero-grant gate.
- **A10** QA/UAT image digests match at the slice's commit.

If A4 or A5 fail, the slice is **not** widened or tuned in place: thresholds are re-ruled, the rule versions bump, and the benchmark re-runs. If after two re-rulings A4/A5 still fail, the slice is retired and the rule family is redesigned. That outcome is a success of the method, not a failure of the programme.

## 14. Decisions required before PR-1

| ID | Decision | Recommendation |
|---|---|---|
| FD-IS1 | Confirm Q-ASSOC-1 as the first question type (not ownership, not sanctions network). | Yes — ownership is AOT; association is the one with the highest false-positive risk and therefore the most informative test of the method. |
| FD-IS2 | Reuse AOT policy-engine expression evaluator or write a sibling. | Reuse if its expression surface covers interval overlap and count; else sibling with a shared test suite. Do not fork. |
| FD-IS3 | Guard thresholds: `address_degree` 50, `officer_degree` 20, overlap 30 days. | Accept as v1; A6 will inform v2. |
| FD-IS4 | Identity floor: exact-id strategies, or name strategies ≥ 0.90 with registry confirmation. | Accept; relax only on measured evidence. |
| FD-IS5 | Idempotency by `(subject, snapshot, rule_set)` vs explicit header. | Tuple; it is the honest key and needs no client cooperation. |
| FD-IS6 | Verify endpoint public or scoped. | Public, matching snapshot verify; a proof nobody can check is not a proof. |
| FD-IS7 | Route prefix `/v1/intel/assess/*` vs `/v1/synthesis/*`. | Whichever avoids collision with existing `intel_service` routes. |
| FD-IS8 | Rule author/reviewer roles: new `INTEL_RULE_*` or reuse `CCG_*_REVIEWER`. | New roles, same mechanism. Rules are not substances. |
| FD-IS9 | `source_coverage` initial rows: who declares, on what basis. | Founder declares for `uk_ch_*` and `gleif` only; everything else `UNKNOWN`, which blocks negatives — correctly. |

## 15. Phasing

| Phase | Content | Exit |
|---|---|---|
| IS-0 | Migration; `intel_rules` + rule loader + expression evaluator; five rules in DRAFT; `source_coverage` rows. | Rules load, validate, and reject cross-family predicates. |
| IS-1 | Fact loader at snapshot; admissibility computation; investigation overrides. | Loader tests; C9 enforced. |
| IS-2 | Rule engine incl. partial-fire; Assessment construction; canonicalisation; signing; `audit_chain`. | A1, A2 pass. |
| IS-3 | Routes 10.1–10.4; scope `INTEL_READ`; trusted-service SDK method `assess()` in Python and TS; parity gate. | Contract-complete per catalogue generator; SDK parity passes. |
| IS-4 | Explorer tab, lane, explain view. | A3 passes. |
| IS-5 | Benchmarks A4–A7; acceptance manifest; founder ruling: keep / re-rule / retire. | Ruling recorded. |

No phase begins before FD-IS1–IS9 are ruled. No phase after IS-2 begins before A1–A2 pass. Rule activation (DRAFT → ACTIVE) happens only in IS-5 after the benchmark, under the governed gate.

## 16. Glossary

| Term | Meaning |
|---|---|
| Assessment | Signed, snapshot-pinned output of one question over one subject. `asm-` id. |
| Assertion | One classified statement inside an Assessment. |
| Q-ASSOC-1 | The slice's single question type: source-established relationships around X. |
| Rule set version | Integer identifying the exact set of ACTIVE rule versions used for a run. |
| Partial fire | A rule with some but not all preconditions satisfied; produces `HYPOTHESIS` + `INDICATOR`. |
| Degree guard | Suppression when an address or person is shared by too many entities to be evidentially meaningful. |
| Admissibility floor | Minimum identity/freshness/authority state a fact must hold to be consumed by a rule. |
| Coverage record | Founder-declared statement of a source's completeness for a population; prerequisite for any negative. |
| `_CITED` predicate | Pass-through of an upstream outcome (AOT, sanctions) that this engine never computes. |
| C1–C10 | Constitutional prohibitions (§3). |
| FD-IS* | Founder decisions required (§14). |
| A1–A10 | Acceptance criteria (§13). |

---

*Generated 2026-10-12. DRAFT — not authorised for implementation.*
