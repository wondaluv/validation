# Message to dev team — Synthesis programme accommodations for IOI (v2)

**From:** Omaida Ali
**Re:** NYA-INTEL-SYNTH-001 (Deterministic Intelligence Synthesis) — accommodations required so that NYA-IOI-001 v1.3 can consume it
**Date:** 13 October 2026 · supersedes v1 of this message

---

Team,

IOI v1.3 is specified as a downstream consumer of Synthesis. IOI obtains the current signed Assessment for a subject **before** it touches any of its own sources; treats established association facts as analytical references (not sources, not corroboration); aims its acquisition at synthesis indicators; and reads closed evaluations as "the rule did not establish X under this binding" — never as disproof. Synthesis never consumes anything from IOI except ingest candidates routed through governed source admission. RRI is a Veredis programme downstream of both and needs nothing from you.

The items below are **additive contract and access changes only**. There are **no vocabulary changes** on the synthesis side; IOI absorbs the separation through typed output templates and a proposition-mapping contract. Please do not rename, re-class or re-word anything in SYNTH-001 on IOI's account.

Treat each as a proposed amendment to v0.5.0, to be folded into the next revision. Items 1–7 should be in the slice's API contract before IS-3 cuts routes; 8–10 are documentation.

## 1. Internal-service audience, with public-key distribution

v0.5.0 §10 admits `FIRST_PARTY_APPLICATION` only. IOI is an internal Nyansapo bounded context.

**Needed:** an `INTERNAL_SERVICE` audience (own non-wildcard credential, same `INTEL_READ` scope, same object-level ownership; new FD-IS17, not a widening of FD-IS12). **And** publication of the `assessment_snapshot` public key(s) with their active/retired status so an internal consumer can verify signature, `SERVE` mode in the signature domain, and `canonical_sha256` before trusting an Assessment. IOI never holds the signing key.

## 2. Structured indicators

On every `INDICATOR` assertion, alongside `indicator_text`: `rule_id`, `rule_version`, `binding_id`, `precondition_id`, `unknown_reason` (`NO_CANDIDATE | FIELD_MISSING`), `source_families[]`. All already exist in the rule definition and `rule_status[]`; surface them on the assertion and let canonicalisation sign them.

## 3. Addressable closed evaluations

IOI must reference a `CLOSED` evaluation as `(assessment_id, rule_id, rule_version, binding_id, reason)` without inventing an assertion. **Needed:** confirm `rule_status[]` is returned in full by `GET /v1/intel/assess/{id}`, that `binding{}` carries canonical identifiers (`ch_person_id`, company numbers, release id, tenure end kinds, `observed_through`) rather than internal row keys, and that `binding_id` is stable across executions for the same bound values (it is, per §5.5 — confirm nothing on this path changes it).

## 4. Predicate manifest

**Needed:** a machine-readable manifest of the active rule set's predicates (`rule_set_sha256` → list of predicate names with their semantic class: association / cited / conflict) at a read-only route. IOI's CI uses it to forbid signal-type name collisions, and IOI's proposition-mapping table is versioned against it. Adding a predicate on your side should fail IOI's CI until a mapping version exists — that is the intended coupling.

## 5. Two operations: retrieve existing vs obtain current (replaces v1 item 5)

v0.5.0 U1 deliberately returns the **original** assessment for a repeated request key. That is correct for retries and it means re-POSTing is not a freshness check. IOI needs:

- **Retrieve existing** — `GET /v1/intel/assess/{assessment_id}`; already specified.
- **Obtain current** — `GET /v1/intel/assess/current?subject=…&question=Q-ASSOC-1`: returns the latest eligible `SERVE` assessment for the subject/question **at the currently pinned sealed releases**, or `404 NO_CURRENT` if none exists at those releases. Read-only; no evaluation; same access boundary.
- **New execution** — an explicit path (a request parameter or a distinct route; your call) that creates a fresh evaluation against current admitted inputs with a **new** request key, so it is retry-safe without colliding with the original mapping.
- **Supersession definition** in the contract: `B` supersedes `A` iff same subject and question, `B.as_of > A.as_of`, and (`B.input_bundle_sha256 ≠ A.input_bundle_sha256` or `B.rule_set_sha256 ≠ A.rule_set_sha256`). Identical digests = refresh, not supersession. Until SYNTH-004 (drift) exists, IOI applies exactly this and nothing finer.

IOI will not create signed assessments merely to discover whether anything changed.

## 6. Caller context without a scan

A neutral `caller_context {consumer: "IOI", consumer_ref}` in the request, echoed non-canonically in the envelope, in place of `caller_scan_id` for non-scan consumers.

## 7. Explain reachable by the consumer

Confirm `GET …/explain/{assertion_key}` is callable under `INTERNAL_SERVICE` with object-level ownership satisfied by the consumer that created the assessment. IOI uses it to inspect the admissible facts behind a closed evaluation when its mapping class is `POTENTIALLY_CONTRADICTORY`.

## 8. Authority statement per question family (documentation)

One paragraph in SYNTH-001 §1 or §3: the first slice's authority is limited to its four association predicates; it cites AOT and sanctions outcomes; it emits no negative assertions; a `CLOSED` status means the rule did not establish its target under the recorded binding and is not a finding about the real-world relationship. IOI v1.3 states the same from its side; both documents should carry it.

## 9. Permitted-consumer paragraph (documentation)

In §12 or a new §12.4: IOI is a permitted consumer under `INTEL_READ`; the only reverse channel is governed source admission (ingest candidates); RRI consumes Assessments through Veredis, not directly from the synthesis service.

## 10. Decision-effect composition (documentation)

One sentence: Assessments composed with other `CONTEXT_ONLY` outputs in a consumer do not raise the decision-effect cap and must not be combined into a score.

## What is explicitly not being asked

- No renaming of any class, status or predicate; no new rule family or question type for IOI's benefit.
- No relaxation of C2, C6, C7 or any constitutional prohibition.
- No acceptance of IOI output, review events or confidence bands as synthesis inputs.
- No negative assertions — IOI does not need them and must not be given them by proxy.
- No change to the benchmark, acceptance gate or the proposed founder decisions except the new FD-IS17 audience row.

If anything here conflicts with a ruling already recorded on FD-IS1–16, the ruling wins and I'd like to hear about it rather than have it quietly worked around.

— Omaida
