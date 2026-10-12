# NYA-INTEL-SYNTH-001 — Deterministic Intelligence Synthesis

**Vertical slice specification · Question type Q-ASSOC-1 ("source-established relationships around X")**

| | |
|---|---|
| Document ID | NYA-INTEL-SYNTH-001 |
| Version | **DRAFT v0.3.0** — for founder review. Nothing in this document is authorised for implementation until ruled. |
| Supersedes | DRAFT v0.2.0; DRAFT v0.1.0 (both 2026-10-12) |
| Classification | INTERNAL |
| Programme | Nyansapo — Intelligence plane |
| Review basis | Code-grounded reviews of v0.1.0 and v0.2.0 against `origin/main` `62ead3c54cf984c37d17d9d2b1f4d7b38d5d19ea` (11 Oct 2026); evidence manifests `NYA-INTEL-SYNTH-001-code-evidence.json`, `NYA-INTEL-SYNTH-001-v02-evidence.json`. Live data, deployed state and the published PR bytes were not verified by either review. |
| Depends on | NYA-PROVENANCE-EXPLORER-001 PR-0; `applicability_sufficiency.py` evaluation semantics; `governed_verification_service.py`; `KeyManager`; `AuditChain`; ingest prerequisites **IS-P0, IS-P2, IS-P3** (§5.0) |
| Decision effect | `CONTEXT_ONLY`. `decision_effect_allowed = FALSE`, hardwired, not flag-controlled. |
| Author | Prepared with Claude for Omaida Ali, 2026-10-12 |

---

## 0. Change log

### 0.1 v0.2.0 → v0.3.0 (follow-up review)

| # | v0.2.0 defect | Finding | v0.3.0 disposition |
|---|---|---|---|
| S1 | Signed body omitted the execution header; §6.1 and §10.1 disagreed on where `as_of` lives. | Replay of a stored bundle must bind everything evaluation consumed. | Execution header (`question_type`, `subject_key`, `as_of`, rule-set/engine/policy/normalisation digests) is **inside** the canonicalised body (§6.2). |
| S2 | Bundle stored facts but not the decisions made over them. | Normalisation, admissibility, freshness, degree observations and guard inputs were recomputed at replay from live state. | Bundle stores **decisions as well as facts** (§6.4). Replay makes no live DB, clock, investigation or coverage lookup (C8 restated). |
| S3 | `engine_sha256` over a source directory. | Evaluator imports normalisation/policy code from elsewhere; a directory digest does not identify the executable closure. | Replay evaluator depends only on the stored bundle and retained rule definitions. `engine_artifact_sha256` identifies a locked, retrievable build artifact (§6.1). |
| S4 | Below-floor evidence classified `UNKNOWN`, which could spawn a hypothesis; contradicted C11. | Inadmissible evidence is not silence. | New precondition value `INADMISSIBLE_ONLY`; closes the rule; never a hypothesis. Aggregation rule when admissible and inadmissible candidates coexist defined (§4.2). |
| S5 | Failed `DOWNGRADE` guard emitted a hypothesis with no `UNKNOWN` precondition. | A disqualification is not an evidence gap. | `DOWNGRADE_TO_HYPOTHESIS` removed from the schema. All guard failures suppress in v0.3 (§5.2). |
| S6 | Rule 004 treated an upstream rule that emitted nothing as `UNKNOWN`. | A dependency suppressed or disproved upstream would be re-hypothesised downstream. | Upstream status propagates through the DAG: `CLOSED` and `SUPPRESSED` are distinct dependency values that close/suppress the consumer (§5.5). |
| S7 | Rule 002 required a common `observed_at = t` supplied by the request's `as_of`. | Independently acquired current rows do not become contemporaneous by being stamped with one timestamp. | Co-location is evaluated **within a named admitted company release**; `t` is that release's snapshot boundary. Historical `as_of` earlier than the latest admitted release of any required source is **rejected** (§5.4, §10.1). |
| S8 | Appointment interval semantics only covered both-ends-open. | A missing start with a known end was unspecified. | Full date semantics declared: missing start → `UNKNOWN`; missing end → current as of the officer release snapshot (source semantics) (§5.4). |
| S9 | Degree guard relied on "population completeness asserted" via `registry_source_releases`. | Ledger has `row_count` and `PASSED`, but no reconciliation against an upstream population; officer backfill is unpaginated. | New prerequisite **IS-P2** (degree evidence): officer degree from a fully paginated `/officers/{id}/appointments` with `total_results`; address degree from a bulk company release with explicit population and snapshot boundary. Frozen into the bundle. Release admission ≠ completeness (§5.0, §5.2). |
| S10 | `execution_id UNIQUE` globally vs per-client rows. | Second client's row rejected (demonstrated). | `UNIQUE (client_id, execution_id)` (§9.1). |
| S11 | `assertion_id` global PK hashed only `(rule, version, subject_refs, predicate)`. | Collides across repeated assessments; indicators not distinct. | Assessment-scoped composite PK; `assertion_key` binds class, precondition/guard id, temporal scope (§9.1). |
| S12 | POST inserted a row before evaluating/signing. | Runtime has no `UPDATE` grant; a reserved row cannot be completed. | Compute the complete immutable row, then one atomic insert; on conflict, retrieve the authorised existing row (§10.1). |
| S13 | Server-defaulted `as_of` at request time breaks retries. | Each retry gets a new execution id. | Response returns the pinned `as_of`; retries must resend it; unspecified `as_of` is truncated to the minute (§10.1). |
| S14 | Advisory lock on assessment appends only. | Legacy `AuditChain.append` callers do not take it; forks remain possible. | The lock moves **into** `AuditChain.append`; every writer to the chain takes it; concurrency test (§11.3). |
| S15 | `require_client_type_in({...})` with a set; wildcard `'*'` bundles bypass audience. | Helper is variadic; wildcard admin keys would pass. | Variadic call; explicit rejection of wildcard bundles; FD-IS12 (§10). |
| S16 | "Active key" asserted; `KeyManager.load_key()` picks newest PEM by mtime. | No purpose/active-status enforcement. | Purpose-aware selection wrapper required; signing refuses without a DB-active `assessment_snapshot` key (§11.2). |
| S17 | `investigation_ref` joined on synthesis fact ids. | Investigations index entities and fields, not fact ids. | Correlation by entity/field, labelled `correlation: ENTITY_FIELD`, carried in the **envelope** (non-canonical) or null (§12.2). |
| S18 | A4 assumed every IS-P0 support reaches a signed batch. | Stream/backfill writers do not route via `raw_entities → batch_provenance`. | New prerequisite **IS-P3**: officer acquisition provenance, or A4 narrows to what is actually batch-bound (§5.0, §13.1). |
| S19 | Engine reads `ACTIVE` rules; phasing activates only after benchmark. | Draft rules could not be benchmarked. | `BENCHMARK` execution mode with a pinned candidate rule set, isolated from the activation boundary, never served to clients (§13.0). |
| S20 | Deferred register implied authority to postpone. | Deferral is sequencing, not approval. | Register carries an approval state per item (§0.3). FD-IS2/FD-IS6 marked *recommended, awaiting ruling*, not resolved. |
| S21 | Statement that "every rule suppresses" without completeness. | Rule 005 is not degree-guarded. | Corrected: only degree-guarded rules (001, 002, hence 004) suppress; 005 runs. |

### 0.2 v0.1.0 → v0.2.0 (first review) — retained for the record

R1 sibling evaluator, not AOT generalisation · R2 new assessment canonicaliser · R3 investigations are not dual-controlled overrides; overrides deferred · R4 public verify removed · R5 facts materialised for replay (Silver is upserted in place) · R6 `officer_id` is the appointment self-link; IS-P0 person id · R7 no address occupancy intervals; rule 002 → point-in-time · R8 three-valued guards · R9 only `UNKNOWN` spawns hypotheses · R10 rule DAG · R11 migrations auto-discovered · R12 serialised audit append · R13 execution identity by input hash · R14 benchmark rates with intervals.

### 0.3 Deferred register with approval state

| Item | Dependency | Approval state |
|---|---|---|
| Negative assertions + population coverage model (NYA-INTEL-SYNTH-002) | Predicate/population/time completeness evidence | **Awaiting founder decision** on sequencing after this slice |
| Immutable signed override objects (NYA-INTEL-SYNTH-003) | Reviewer-authority model; fact-id-level investigation targeting | **Awaiting founder decision** |
| Registered-address occupancy intervals (IS-P1) | AD01 parsing or snapshot-succession derivation | **Blocked by named dependency** |
| Inference drift (NYA-INTEL-SYNTH-004) | First slice landed; schema carries predecessor and digest columns from day one | **Architectural objective committed; implementation authorisation pending** |
| Public supplied-receipt verifier (NYA-INTEL-SYNTH-005) | Key distribution, revocation semantics, bounded input | **Awaiting founder decision** |
| Agent / virtual-office address classifier | No classifier exists in code | **Blocked by named dependency**; degree guard only |
| IOI / RRI | Separate commitments; RRI risk-neighbourhood route is 501 | **Unaffected by this document**; never used as rule preconditions |

---

## 1. Purpose and framing

Nyansapo serves governed facts and answers one analytic question deterministically — *who owns or controls X* — through AOT. A second evaluator, `applicability_sufficiency.py`, answers legal-applicability questions with typed `TRUE / FALSE / UNKNOWN / INVALID` outcomes. Consumers who need to know *what the admissible evidence, taken together, establishes* about a subject must assemble that picture themselves.

This slice adds a third evaluator alongside those two:

> **A question-scoped deterministic synthesis capability, implemented alongside AOT and legal applicability, reusing compatible governed infrastructure (identity references, signing primitive, audit chain, governed verification, scope enforcement) while preserving each evaluator's evidence vocabulary and authority boundary.**

Its single question in this slice:

> **Q-ASSOC-1:** *What source-established relationships exist around subject X, and what do they establish?*

Output: a signed **Assessment** containing the facts *and decisions* it was computed from, every assertion with a defined epistemic class, a rule id and version, and the fact ids that support or contradict it. The Assessment says what is established, what conflicts, and — mechanically, from rule preconditions that evaluated `UNKNOWN` — what evidence would change the answer. It says nothing negative in this slice.

Framing that must survive every later document:

- AOT's ownership arithmetic and the applicability evaluator's legal-effect precedence are **not** extended. Synthesis cites their outcomes and never recomputes them.
- The Assessment is **context**. It never carries decision effect.
- **No language model** participates in producing an Assessment.
- Replay is **analytic replay of a stored bundle**, not reproduction of acquisition or identity resolution.

## 2. Scope

### 2.1 In scope

1. One question type, `Q-ASSOC-1`, over one subject.
2. Ingest prerequisites IS-P0 (person identity), IS-P2 (degree evidence), IS-P3 (officer acquisition provenance) (§5.0).
3. Rule schema; four governed rules (§5.4); three-valued guards; identity admissibility floor.
4. The Assessment object with execution header and decision-bearing input bundle (§6); epistemic classes (§4); `UNKNOWN`-only partial fire with DAG status propagation (§5.5, §7).
5. Storage (§9); scoped trusted-service endpoints (§10); canonicalisation, purpose-aware signing, chain-wide serialised audit append (§11); Explorer link-only hooks (§12).
6. `BENCHMARK` execution mode and the acceptance gate (§13).

### 2.2 Out of scope — explicitly

- Any other question type. Ownership and control remain AOT's.
- Negative assertions and the coverage model.
- Investigation-derived overrides.
- Public verification.
- Address occupancy intervals; two-hop clusters; ACH; drift logic.
- Prose rendering, PDF, LLM involvement.
- External SDK exposure. Trusted-service only.
- Veredis-side consumption and anything scenario-conditioned.

## 3. Constitutional prohibitions

| # | Prohibition | Enforcement |
|---|---|---|
| C1 | No assertion may carry `decision_effect` other than `NONE`. | `Literal["NONE"]`; test. |
| C2 | Association is never promoted to ownership or control. | Rule loader rejects cross-family predicates. |
| C3 | Intent, purpose or culpability is never inferred. | Closed predicate enum. |
| C4 | Graph proximity is not evidence. | Rule schema requires ≥1 non-topological precondition. |
| C5 | An absent record is not evidence. No negative assertion without a validated coverage record. | No negative predicate exists in v0.3; constructor rejects `*_NOT_ESTABLISHED`. |
| C6 | A Ceres passage is never a fact. | Fact ids validated against fact tables only. |
| C7 | No generative model in the production path. | CI grep gate on `api/services/intel_synthesis/`. |
| C8 | The conclusion body is replayable byte-for-byte from the stored bundle and retained rule definitions, with **no live lookup of any kind** (database, clock, investigations, coverage, policy tables). | Replay test runs with the DB connection and clock stubbed to fail. |
| C9 | Every inference inherits the weakest admissible supporting fact. | Computed in the assertion constructor. |
| C10 | Rules are governed objects: versioned, dual-approved via `governed_verification_service`, immutable once active. | Governed activation gate (§9.2). |
| C11 | A `FALSE`, `INADMISSIBLE_ONLY` or `INVALID` necessary precondition closes a rule; none ever becomes an indicator. | Evaluator semantics (§4.2, §7). |
| C12 | An unknown guard value suppresses; a failed guard suppresses. | Three-valued guards; no downgrade path (§5.2). |
| C13 | A suppressed or closed upstream rule never appears as `UNKNOWN` to a dependent rule. | DAG status propagation (§5.5). |
| C14 | `as_of` never predates the latest admitted release of any required source. | Request gate (§10.1). |

## 4. Epistemic model

### 4.1 Assertion classes

| Class | Definition | Produced by |
|---|---|---|
| `FACT` | Directly supported by an admissible source record in the bundle. | Fact loader. |
| `DERIVED_FACT` | Deterministic transformation of facts (interval overlap; normalised-address equality within one release). | Derivation functions with stable ids. |
| `INFERENCE` | Rule with all preconditions `TRUE` and all guards `PASS`. | Rule engine. |
| `CONFLICT` | Admissible facts assert incompatible values for the same predicate/scope. | Rule 005. |
| `HYPOTHESIS` | Rule with no closing precondition, ≥ its `hypothesis_min_true` `TRUE`, ≥1 `UNKNOWN`, all guards `PASS`. | Rule engine, §7. |
| `INDICATOR` | `indicator_text` of each `UNKNOWN` precondition of a `HYPOTHESIS`. | Rule engine. |
| `GAP` | A required source family was unavailable or stale at `as_of` (dependency gap, not coverage gap). | Fact loader. |
| `UNKNOWN` | The question cannot be answered for a stated structural reason. | Engine entry gate. |

### 4.2 Precondition evaluation values

| Value | Meaning | Effect |
|---|---|---|
| `TRUE` | ≥1 **admissible** candidate fact satisfies the expression and no admissible candidate disproves it. | Counts toward full match. |
| `FALSE` | ≥1 admissible candidate disproves it. If admissible candidates both satisfy and disprove, the value is `FALSE` (fail closed) and the pair is handed to rule 005. | Closes the rule. |
| `UNKNOWN` | **No candidate fact at all** in the bundle for the precondition's source families. | May spawn `HYPOTHESIS`/`INDICATOR`. |
| `INADMISSIBLE_ONLY` | Candidates exist but **every** one is below the admissibility floor. | Closes the rule; `data_warnings` entry naming the floor failure. Never a hypothesis. |
| `INVALID` | Cannot be evaluated (schema mismatch, malformed fact). | Closes the rule; `data_warnings`; engine warning counter. |

Aggregation rule: admissible candidates decide; inadmissible candidates are ignored when at least one admissible candidate exists, and are recorded in the bundle with their admissibility reason either way.

### 4.3 Dependency values (consumer rules only)

| Value | Meaning for the dependent precondition |
|---|---|
| `TRUE` | Upstream emitted its `INFERENCE`/`DERIVED_FACT`. |
| `UNKNOWN` | Upstream emitted a `HYPOTHESIS` (genuine silence upstream). |
| `CLOSED` | Upstream closed (`FALSE`, `INADMISSIBLE_ONLY`, `INVALID`). Dependent rule **closes**. |
| `SUPPRESSED` | Upstream suppressed by a guard. Dependent rule **suppresses**. |

### 4.4 Admissibility states

`ADMISSIBLE` · `ADMISSIBLE_ADVISORY` · `INADMISSIBLE_IDENTITY` · `INADMISSIBLE_STALE`. (`INADMISSIBLE_OVERRIDDEN` reserved for NYA-INTEL-SYNTH-003.) The state and its reason are **decided at evaluation and stored in the bundle**; replay reads them, it does not recompute them.

### 4.5 Predicate vocabulary (closed)

```
SHARED_OFFICER_ESTABLISHED             (rule 001; INFERENCE)
REGISTERED_ADDRESS_COLOCATED_IN        (rule 002; DERIVED_FACT, within one company release)
ASSOCIATION_CLUSTER_SUPPORTED          (rule 004; INFERENCE)
RELATIONSHIP_EVIDENCE_CONFLICTED       (rule 005; CONFLICT)
OWNERSHIP_PATH_CITED                   (pass-through of a bounded AOT outcome)
SANCTIONS_LISTING_CITED                (pass-through of sanctions_entity_v1)
```

The AOT adapter inspects the bounded outcome and pinned policy context of the `aot_path_audit` entry; a rejected or insufficient traversal is not cited.

## 5. Rules

### 5.0 Ingest prerequisites

**IS-P0 — person-level officer identity.** Both writers retain raw JSON (`ukch_stream_silver.py::_handle_officer` stores the event envelope; `ukch_officers_charges_backfill.py::_upsert_officer_item` stores the item). Add `silver_uk_officers.ch_person_id` (nullable) extracted from `raw_payload.data.links.officer.appointments` (stream rows) or `raw_payload.links.officer.appointments` (backfill rows), retaining the original link string and its source path. The existing `officer_id` (appointment self-link) is **not** repurposed. Backfill locally where the payload carries the link; a read-only census first classifies rows as *link retained / link absent / malformed / conflicting*, and only the absent class is a candidate for re-fetch. Tests: same person across two companies → one key; two same-name people → two keys; missing link; malformed link; UPDATE path preserves the key. `ch_person_id` is treated as a **source-qualified identifier**, not a proof that every record of one real person shares it.

**IS-P2 — degree evidence.** `registry_source_releases` carries `row_count`, `dlq_count`, `reconciliation_status`; `record_reconciliation` accepts whatever its caller passes and `admit_release` requires only `PASSED` + a timestamp. That is an admission record, not a completeness proof, and the officer backfill makes one unpaginated call (`_ch_get`, no pagination loop; `None` on failure coerced to `{}`). Therefore:

- *Officer degree* is evidenced per person by a **fully paginated** acquisition of `/officers/{ch_person_id}/appointments`, storing `total_results`, pages fetched, `items_per_page`, acquisition timestamp and HTTP outcome per page. Degree = count of active appointments in that list at the officer release snapshot. If any page failed or `total_results` ≠ items acquired → degree `UNKNOWN`.
- *Address degree* is evidenced against a **named bulk company release** with explicit population definition (`population_def`), snapshot boundary (`snapshot_at`), artifact checksum and row count. Degree = count of active companies at the normalised address in that release. If the release lacks any of those fields → `UNKNOWN`.
- Fix the officer backfill to paginate and to distinguish *empty* from *failed*.
- The degree observation (value, method, evidence refs, population, snapshot) is frozen into the bundle.

**IS-P3 — officer acquisition provenance.** The stream and backfill writers do not route through `raw_entities → batch_provenance`. Either (a) wrap IS-P0 acquisition in a signed batch so each officer row has a `batch_id`, or (b) A4 narrows to "every support that is batch-bound leads to a signed batch; supports that are not are listed with `provenance: UNBATCHED`". **[FD-IS15]** — (a) recommended; (b) is the honest fallback and must not be hidden.

### 5.1 Rule schema

```yaml
rule_id: NYA-INT-ASSOC-001
version: 1
family: ASSOC
predicate: SHARED_OFFICER_ESTABLISHED
status: DRAFT | ACTIVE | RETIRED
depends_on: []
preconditions:
  - id: P1
    kind: fact | derived | cited | dependency
    source_families: [uk_ch_officers]
    expression: "<closed evaluator expression>"
    admissibility_floor: ADMISSIBLE_ADVISORY
    necessary: true
    indicator_text: "<evidence that would satisfy this precondition>"
guards:
  - id: G1
    kind: degree | class | temporal
    expression: "<closed evaluator expression>"
    on_fail: SUPPRESS            # the only value in v0.3
    on_unknown: SUPPRESS         # the only value in v0.3
emits_on_full_match: INFERENCE | DERIVED_FACT
hypothesis_min_true: <int>
governance:
  verification_subject_table: intel_rules
  author_role: INTEL_RULE_AUTHOR
  reviewer_role: INTEL_RULE_REVIEWER
```

The expression evaluator is a sibling of `applicability_sufficiency.py`'s predicate evaluator: closed, typed, no free text; comparison, boolean, set membership, interval overlap, count; the five precondition values and three guard values. Shares test patterns with `tests/nyansapo/test_applicability_sufficiency_v2_001.py`; extends neither that module nor AOT.

### 5.2 Guards — three-valued, suppress-only

| Guard | Definition | Value |
|---|---|---|
| `officer_degree` | Active appointments for `ch_person_id` per IS-P2 officer evidence. | `PASS` ≤ 20; `FAIL` > 20; `UNKNOWN` if evidence incomplete. |
| `address_degree` | Active companies at the normalised address in the named company release per IS-P2. | `PASS` ≤ 50; `FAIL` > 50; `UNKNOWN` if release lacks population/snapshot/checksum. |
| `officer_role_class` | Role ∈ {`secretary`, corporate secretary service}. | `PASS` otherwise; `FAIL` if in set; `UNKNOWN` if role missing. |
| `temporal_overlap_min_days` | Overlap of appointment intervals per §5.4 date semantics. | `PASS` ≥ 30; `FAIL` < 30; `UNKNOWN` if either interval is `UNKNOWN`. |

`FAIL` and `UNKNOWN` both suppress. Guard inputs and outcomes are frozen in the bundle. [FD-IS3.]

### 5.3 Identity admissibility floor

Person: admissible only via `ch_person_id` (IS-P0). Company: `entity_lineage` method in an explicit **allow table** (registration number, LEI) or name method with `match_confidence ≥ 0.90` **and** `registry_status_code = CONFIRMED_REGISTRY_IDENTITY`; methods in the **deny table** (including `alias_canonical_rev`) are inadmissible. The decision and its basis are stored per fact in the bundle. [FD-IS4.]

### 5.4 The four rules

**Date semantics (all rules).** Appointment interval `[appointed_on, resigned_on)`. `resigned_on` absent → interval ends at the **officer release snapshot time** (Companies House semantics: an appointment without a resignation is current as of the snapshot). `appointed_on` absent → interval `UNKNOWN`; no start is ever invented. Both absent → `UNKNOWN`. Dates are ISO-8601 at day precision; overlap is computed in whole days.

**Observation contract (rules 002, 004).** Current registered addresses are compared **only within one named, admitted company release** `R` with snapshot boundary `t_R`. Equality asserts co-location *as of* `t_R`. The request's `as_of` does not reinterpret current rows as historical observations (C14).

**NYA-INT-ASSOC-001 — `SHARED_OFFICER_ESTABLISHED(A, B)`** — `INFERENCE`
P1 (necessary): `ch_person_id` *p* has admissible appointment at A with interval `I_A`.
P2 (necessary): *p* has admissible appointment at B ≠ A with interval `I_B`.
P3 (necessary): derived overlap `I_A ∩ I_B` ≥ 30 days; `UNKNOWN` if either interval is `UNKNOWN`.
Guards: `officer_degree`, `officer_role_class`.
`hypothesis_min_true: 2`. P1 ∧ P2 `TRUE`, P3 `UNKNOWN` → `HYPOTHESIS`, indicator "appointment dates establishing ≥30-day overlap".

**NYA-INT-ASSOC-002 — `REGISTERED_ADDRESS_COLOCATED_IN(A, B, R)`** — `DERIVED_FACT`
P1 (necessary): A's registered address in release `R`, normalised under `normalization_version`, admissible.
P2 (necessary): B's registered address in the same `R`, normalised, equal to A's.
Guard: `address_degree` in `R`.
No hypothesis form.

**NYA-INT-ASSOC-004 — `ASSOCIATION_CLUSTER_SUPPORTED(A, B)`** — `INFERENCE`
`depends_on: [001, 002]`.
P1 (necessary, dependency): rule 001 for (A,B).
P2 (necessary, dependency): rule 002 for (A,B) in release `R` **and** `t_R ∈ I_A ∩ I_B`.
`hypothesis_min_true: 1`. One dependency `TRUE`, the other `UNKNOWN` → `HYPOTHESIS` naming the missing one. Either `CLOSED` → closed; either `SUPPRESSED` → suppressed (C13). Never consults ownership (C2).

**NYA-INT-ASSOC-005 — `RELATIONSHIP_EVIDENCE_CONFLICTED`** — `CONFLICT`
P1 (necessary): two admissible facts in the bundle assert incompatible values for the same (subject, predicate, release/snapshot), or a precondition elsewhere evaluated `FALSE` with both satisfying and disproving admissible candidates (§4.2). Emits `CONFLICT` citing both facts. Not degree-guarded. Does not resolve.

### 5.5 Dependency DAG and status propagation

Loader builds the DAG from `depends_on`, rejects cycles, evaluates topologically (rule id tiebreak). Each rule's terminal status — `EMITTED(class)`, `HYPOTHESIS`, `CLOSED(reason)`, `SUPPRESSED(guard)` — is recorded in the bundle and mapped to the dependency values of §4.3 for consumers. Lineage closure: a consumer's supporting-fact set is the union of its dependencies' supporting sets.

## 6. The Assessment object

### 6.1 Identity (outside the signed body)

```
assessment_id              asm-YYYY-MMDD-NNNNNN
client_id                  owner; object-level access key
execution_id               sha256(canonical execution header ‖ input_bundle_sha256)
mode                       SERVE | BENCHMARK
created_at, request_id, caller_scan_id, external_ref
audit_chain_seq, signing_key_id, signature, canonical_sha256
investigation_correlations[]   {assertion_key, investigation_id, correlation: ENTITY_FIELD}   # non-canonical, §12.2
supersedes_assessment_id   NULL in v0.3
```

### 6.2 Signed conclusion body (canonicalised)

```
canonicalization_version   "assessment-v1"
execution_header
  question_type            Q-ASSOC-1
  subject_key              nya:entity:v1:<hex> | unresolved:{normalised request, identity_state}
  as_of                    ISO-8601 UTC, minute precision
  rule_set_version, rule_set_sha256
  engine_artifact_sha256   digest of the locked build artifact (wheel + lockfile), not a directory
  normalization_version    address/name normaliser version
  admissibility_policy_version
  required_releases[]      {source_family, release_id, snapshot_at, artifact_checksum}
subject                    canonical_id, golden_id, entity_type, identifiers[], identity_state, admissibility_state, admissibility_basis
input_bundle               §6.4
derived[]                  DERIVED_FACT entries with derivation id and input fact keys
rule_status[]              {rule_id, version, status, reason}            # §5.5
assertions[]               assertion_key, class, predicate, subject_refs[], rule_id, rule_version,
                           preconditions[{id, value, satisfied_by: fact_key|null, indicator_text}],
                           guards[{id, value, observed_value, evidence_ref}],
                           supporting_fact_keys[], contradicting_fact_keys[],
                           temporal_scope, admissibility_state, decision_effect "NONE"
gaps[]                     source_family, reason, freshness_state
counts                     facts_by_admissibility{}, assertions_by_class{}, rules_closed{}, rules_suppressed{}
```

### 6.3 Replay contract

Replay = re-run the retained rule definitions (by `rule_set_sha256`) over the stored `input_bundle` and `execution_header`, with **no** database, clock, investigation, coverage or policy-table access (C8). The replay evaluator is a pure function of (bundle, rules). Any decision that would otherwise need live state is stored in the bundle (§6.4). The digest `engine_artifact_sha256` must resolve to a retrievable artifact in the release store.

### 6.4 Input bundle — facts and decisions

Per fact: source table, row key, full typed field set consumed by any precondition or guard, raw `observed`/release reference, `ch_person_id` and original link (officers), lineage ref and `match_method` string, **and the decisions**: admissibility state + reason, freshness state at `as_of` (output of `evaluate_source_freshness` with injected time), normalised values + `normalization_version`. Per guard: observed value, method, evidence refs (paginated appointments summary; company release fields), outcome. Per release: id, snapshot, checksum, population definition.

`input_bundle_sha256` is computed over the canonicalised bundle. Loader scope: one hop — companies sharing a `ch_person_id` or a normalised registered address (within the named release) with the subject.

## 7. Partial-fire mechanics

1. For each rule in DAG order, evaluate preconditions (§4.2/§4.3) and guards (§5.2).
2. Any necessary precondition `FALSE`, `INADMISSIBLE_ONLY`, `INVALID` or `CLOSED` → rule `CLOSED(reason)`; nothing emitted (C11, C13).
3. Any guard `FAIL`/`UNKNOWN`, or any dependency `SUPPRESSED` → rule `SUPPRESSED(guard)`; nothing emitted (C12, C13).
4. All preconditions `TRUE`, all guards `PASS` → emit declared class.
5. No closing value, ≥ `hypothesis_min_true` `TRUE`, ≥1 `UNKNOWN`, all guards `PASS` → emit one `HYPOTHESIS` with the full precondition table and one `INDICATOR` per `UNKNOWN` precondition.
6. Otherwise nothing.

A hypothesis arises only from silence in the evidence, after every guard has passed; never from contradiction, inadmissibility or disqualification.

## 8. Coverage (dependency, not built)

Negative assertions require coverage evidence that does not exist. `api/models/coverage.py::DimensionCoverage` is the correct base and will be extended in NYA-INTEL-SYNTH-002. v0.3 emits no negatives (C5). The IS-P2 completeness notions are used only to **suppress**.

## 9. Data model

### 9.1 Tables (additive migration, auto-discovered)

```
intel_rules
  rule_id, version, family, predicate, status, definition_jsonb, definition_sha256,
  verification_request_id, activated_at, retired_at
  PK (rule_id, version); partial unique (rule_id) WHERE status='ACTIVE'

intel_rule_sets
  rule_set_version PK, rule_versions_jsonb, rule_set_sha256, activated_at, mode (ACTIVE | BENCHMARK)

intel_assessments
  assessment_id PK, client_id, execution_id, mode, question_type, subject_key, as_of,
  rule_set_version, rule_set_sha256, engine_artifact_sha256, input_bundle_sha256,
  body_jsonb, canonical_sha256, signature, signing_key_id, audit_chain_seq,
  created_at, request_id, caller_scan_id, external_ref, investigation_correlations_jsonb,
  supersedes_assessment_id NULL
  UNIQUE (client_id, execution_id)

intel_assertions
  assessment_id FK, assertion_ordinal, assertion_key, class, predicate, rule_id, rule_version,
  precondition_or_guard_id NULL, temporal_scope_jsonb, admissibility_state,
  subject_refs_jsonb, supporting_fact_keys_jsonb, contradicting_fact_keys_jsonb
  PK (assessment_id, assertion_ordinal); INDEX (assertion_key)
```

`assertion_key = sha256(rule_id, version, class, predicate, subject_refs, precondition_or_guard_id, temporal_scope)`; stable across assessments for correlation, unique only within one.

### 9.2 Grants and governance

Runtime role: `SELECT` all; `INSERT` on `intel_assessments`, `intel_assertions`; no `UPDATE`/`DELETE`. Rule rows written only by the governed activation route: `governed_verification_service` (`create_verification_request` → two typed-role `submit_review`s under `INTEL_RULE_AUTHOR` / `INTEL_RULE_REVIEWER`), then a stage-advancement-style gate adapted to `intel_rules.status`. "Dual-approved" = two recorded typed-role approvals, not two cryptographic signatures. [FD-IS8.]

### 9.3 Migration

Additive. Privilege manifest, zero-grant gate, role tests. IS-P0/IS-P2 migrations on `silver_uk_officers` and a new `ukch_officer_appointments_evidence` table are separate and earlier.

## 10. API

Trusted-service surface. Scope **`INTEL_READ`** added to the closed catalogue; `require_scope("INTEL_READ")` **and** `require_client_type_in("FIRST_PARTY_APPLICATION")` (variadic) **and** an explicit check rejecting wildcard `'*'` bundles (the helper bypasses audience for them, `auth.py:650–681`). [FD-IS12.] Object-level: readable only by the owning `client_id`. Route prefix `/v1/intel/assess/*` (no collision at inspected revision; re-check at wiring).

### 10.1 `POST /v1/intel/assess`

Request: `{question_type, subject: {golden_id | canonical_id | company_number}, as_of?, caller_scan_id?, external_ref?}`.

Gate: `as_of` defaults to request time truncated to the minute; the response returns the pinned value and **retries must resend it**. `as_of` earlier than the latest admitted release of any required source → 422 (C14).

Behaviour: resolve subject (fail-closed); load one-hop facts and decisions; build bundle and header; compute `execution_id`; evaluate; canonicalise; sign; **then** in one transaction: insert the complete row (on `UNIQUE (client_id, execution_id)` conflict → return the existing authorised row), `AuditChain.append` under the chain lock (§11.3), commit. No row is ever reserved and completed later. Returns the Assessment in `StandardEnvelope`; every inadmissible fact, closed rule and suppressed guard appears in `data_warnings` with `client_action`.

### 10.2 `GET /v1/intel/assess/{assessment_id}` — stored body, byte-identical; same access boundary.

### 10.3 `GET /v1/intel/assess/{assessment_id}/explain/{assertion_key}` — rule definition at the cited version; precondition/guard tables; supporting facts from the stored bundle with lineage via `provenance_explorer_service.get_raw_chain`; `provenance: UNBATCHED` shown where IS-P3(b) applies.

### 10.4 `GET /v1/intel/assess/{assessment_id}/verify` — scoped. Recomputes `canonical_sha256`, verifies signature under the recorded key, checks the `audit_chain` event at `audit_chain_seq` carries this digest. Cryptographic validity reported separately from factual correctness.

### 10.5 Errors — 401/403/422/429/503. Unresolved subject or empty fact set → 200 with `UNKNOWN`/empty assessment.

## 11. Canonicalisation, signing, audit

### 11.1 `canonicalize_assessment_v1`
Explicit field schema for §6.2; sorted keys; nulls pruned; arrays ordered by deterministic keys; numbers as decimal strings; dates ISO-8601 UTC at declared precision. Tests: per-field tamper changes the digest; two distinct assessments never collide; stored body re-canonicalises to its stored digest; the header is covered.

### 11.2 Signing
`KeyManager.sign/verify` as-is for the primitive. `load_key()` selects by filesystem mtime and ignores purpose and DB status, so a **purpose-aware selection wrapper** is required: it resolves the DB-active `signing_keys` row with `purpose='assessment_snapshot'`, loads exactly that key, and refuses (503, no unsigned output) if none is active. Domain separation prefix `NYA-ASSESSMENT-V1\0`. Rotation policy: new key activated → old key retained for verify only. [FD-IS11.]

### 11.3 Audit chain — chain-wide serialisation
Advisory locks coordinate only callers that take them. Therefore the lock is taken **inside** `AuditChain.append` itself (`pg_advisory_xact_lock(<chain id>)` on the caller's transaction), so every writer to the shared chain — legacy and synthesis — serialises identically. A `append_in_tx(conn, event)` entry point lets the assessment insert and its `ASSESSMENT_SIGNED` event commit atomically. Concurrency test: N parallel writers, chain verifies, no forked predecessor. [FD-IS13: single-writer alternative.]

## 12. Provenance Explorer integration (link only)

### 12.1 Read surfaces — ASSESSMENT search tab; assessment page; ASSESSMENTS lifeline lane; **synthesis** stage on the stage chain. Admin-authenticated.

### 12.2 Investigations — correlation, not join
Investigations index entities and fields, not synthesis fact keys. v0.3 correlates a `CONFLICT` assertion to open/concluded investigations by (entity ref, field name) and stores the result in the **envelope** as `investigation_correlations[] {assertion_key, investigation_id, correlation: ENTITY_FIELD}`. It is non-canonical, not signed, and may be recomputed on read. The engine never files investigations.

### 12.3 Overrides — deferred to NYA-INTEL-SYNTH-003. Investigation outcomes do not alter admissibility in v0.3.

## 13. Benchmark mode and acceptance gate

### 13.0 `BENCHMARK` mode
The engine normally reads the `ACTIVE` rule set. For acceptance, a pinned **candidate** rule set (`intel_rule_sets.mode = BENCHMARK`, digest recorded) is evaluated by an isolated runner that writes `intel_assessments.mode = BENCHMARK` rows. Benchmark rows are never served by §10 routes (query predicate `mode = SERVE` is hardwired), never appended to the production `audit_chain` (benchmark chain id), and are purged by an admin route after the acceptance manifest is signed. Activation (DRAFT → ACTIVE) remains a separate governed act after the benchmark.

### 13.1 Correctness
- **A1 Replay.** 100 stored assessments regenerate a byte-identical conclusion body with DB and clock stubbed to fail.
- **A2 Constitution.** C1–C14 tests pass; C7 grep gate present.
- **A3 Canonicaliser.** Tamper, collision, header-coverage tests pass.
- **A4 Explain and provenance.** Every `INFERENCE`/`HYPOTHESIS` in a 500-assessment sample resolves to a complete explain payload. Under IS-P3(a), every support leads to a signed batch; under IS-P3(b), every support is either batch-bound or labelled `UNBATCHED`, and the count of `UNBATCHED` supports is reported.
- **A5 IS-P0 fixtures** (§5.0) pass, including missing/malformed link and UPDATE path.
- **A5b IS-P2 fixtures**: paginated acquisition with a failed page yields `UNKNOWN` degree; `total_results` mismatch yields `UNKNOWN`; a release missing population/snapshot/checksum yields `UNKNOWN`.

### 13.2 Analytic quality — the number that decides
Frozen benchmark: selection script, seed, labels, identity evidence, degree evidence and input bundles committed; candidate rule set digest recorded.

- **A6 Negative control.** 200 pairs selected as unrelated + 50 hard negatives (same formation-agent address with degree > 50; same nominee director with degree > 20). Report counts receiving `ASSOCIATION_CLUSTER_SUPPORTED` with 95% Wilson intervals. Gate: ≤ 2/200 on the plain set; 0/50 on the hard set, each showing a guard suppression.
- **A7 Positive control.** 200 pairs hand-verified to share a `ch_person_id` with ≥30-day overlap and to be co-located in a release whose `t_R` lies inside the overlap. Gate: ≥ 180 hits. Report separately: misses by guard suppression (each reviewed), by identity floor, by `INADMISSIBLE_ONLY`, and genuine misses. Suppressions are not hits.
- **A8 Predicate-level accuracy** per rule (001, 002) before compound 004.
- **A9 Guard effect** over a 10,000-company random sample: guards off vs on; `UNKNOWN` suppressions reported separately. No target; informs FD-IS3 v2.
- **A10 Reviewer agreement** on 50 random `HYPOTHESIS` assertions: ≥ 80% agree the indicator names the right missing evidence.

### 13.3 Operational
- **A11** p95 `POST` ≤ 2.0 s on QA for ≤ 50 one-hop neighbours (excluding IS-P2 acquisition, which is asynchronous).
- **A12** Zero-grant gate passes for `intel_*`.
- **A13** QA/UAT digests match at the slice commit.
- **A14 Signing readiness receipt**: DB-active `assessment_snapshot` key, one assessment signed and verified via §10.4, event present in `audit_chain`; recorded in the acceptance manifest.
- **A15 Chain concurrency** test passes with both legacy and synthesis writers.

If A6 or A7 fail: thresholds re-ruled, rule versions bump, benchmark re-runs. After two re-rulings still failing, the rule family is retired and redesigned.

## 14. Decisions required before IS-1

Technical resolution of a decision in this document is a **recommendation**; none is a ruling until the founder records it.

| ID | Decision | Recommendation |
|---|---|---|
| FD-IS1 | Confirm Q-ASSOC-1 with IS-P0, IS-P2, IS-P3 as prerequisites. | Yes. The critical path is person identity **plus** degree evidence **plus** observation timing. |
| FD-IS2 | Evaluator. | Sibling; semantics from `applicability_sufficiency.py`. *Awaiting ruling.* |
| FD-IS3 | Guard thresholds (20 / 50 / 30 d); `UNKNOWN` suppresses. | Accept for v1. |
| FD-IS4 | Identity floor with explicit allow/deny method tables. | Accept; `alias_canonical_rev` denied. |
| FD-IS5 | Per-client rows; `UNIQUE (client_id, execution_id)`. | Accept. |
| FD-IS6 | Verify endpoint scoped. | Scoped. *Awaiting ruling.* |
| FD-IS7 | Route prefix `/v1/intel/assess/*`. | Accept, re-check at wiring. |
| FD-IS8 | "Dual-approved" = two typed-role approvals. | Accept; new roles. |
| FD-IS9 | Coverage deferred; no negatives. | Accept as sequencing. *Awaiting ruling.* |
| FD-IS10 | Rule 002 as within-release co-location. | Accept; name says `_IN`. |
| FD-IS11 | Refuse rather than emit unsigned; purpose-aware key wrapper. | Accept. |
| FD-IS12 | Wildcard `'*'` admin bundles excluded from synthesis. | Exclude. |
| FD-IS13 | Chain-wide advisory lock inside `AuditChain.append` vs single writer. | Lock inside `append`; single writer if the concurrency test fails. |
| FD-IS14 | Observation contract: within-release equality; reject historical `as_of`. | Accept. |
| FD-IS15 | IS-P3 (a) batch-wrap officer acquisition vs (b) label `UNBATCHED`. | (a); (b) only as a declared fallback. |

## 15. Phasing

| Phase | Content | Exit |
|---|---|---|
| IS-P0 | `ch_person_id` extraction + census + backfill; identity fixtures. | A5. |
| IS-P2 | Paginated appointments evidence; company-release population fields; backfill pagination fix. | A5b. |
| IS-P3 | Officer acquisition provenance per FD-IS15. | A4 definition fixed. |
| IS-0 | Migration; `intel_rules`, loader, DAG, sibling evaluator; four rules DRAFT; governed-verification wiring. | Cycle/cross-family rejection tests. |
| IS-1 | Fact + decision loader at `as_of`; bundle + header + hash; admissibility; guards; AOT adapter. | C9, C12, C13 enforced. |
| IS-2 | Engine; assessment construction; `canonicalize_assessment_v1`; purpose-aware signing; chain-wide lock; atomic insert. | A1, A2, A3, A15. |
| IS-3 | Routes; `INTEL_READ` + audience + wildcard rejection + object-level; SDK `assess()`; parity gate. | Contract-complete per catalogue generator. |
| IS-4 | Explorer tab, lane, stage, explain view, correlations. | A4. |
| IS-5 | `BENCHMARK` mode; A6–A10; A14; acceptance manifest; founder ruling keep / re-rule / retire. | Ruling recorded. |

No phase begins before FD-IS1–IS15 are ruled. IS-0 may begin before IS-P0/P2/P3 complete; IS-1 may not.

## 16. Glossary

| Term | Meaning |
|---|---|
| Assessment | Signed output of one question over one subject, carrying its execution header and decision-bearing input bundle. |
| Execution header | Canonical block binding question, subject, `as_of`, rule-set, engine-artifact, policy and normalisation digests, and required releases. |
| Input bundle | Facts **and the decisions made over them** (admissibility, freshness, normalisation, degree, guard outcomes), materialised at evaluation. |
| Analytic replay | Re-evaluation of retained rules over the stored bundle with no live lookup; not reproduction of acquisition or resolution. |
| `TRUE / FALSE / UNKNOWN / INADMISSIBLE_ONLY / INVALID` | Precondition values; only `UNKNOWN` can spawn a hypothesis. |
| `TRUE / UNKNOWN / CLOSED / SUPPRESSED` | Dependency values seen by consumer rules. |
| `PASS / FAIL / UNKNOWN` | Guard values; `FAIL` and `UNKNOWN` suppress. |
| `ch_person_id` | Source-qualified person-level Companies House officer identifier (IS-P0). |
| Degree evidence | Paginated appointments list (officer) or named bulk release with population/snapshot/checksum (address) (IS-P2). |
| Release `R`, `t_R` | A named admitted company release and its snapshot boundary; the only context in which addresses are compared. |
| `BENCHMARK` mode | Isolated evaluation of a pinned candidate rule set; never served; separate chain. |
| C1–C14 · FD-IS1–15 · A1–A15 | Prohibitions · founder decisions · acceptance criteria. |

---

*v0.3.0 generated 2026-10-12. DRAFT — not authorised for implementation.*
