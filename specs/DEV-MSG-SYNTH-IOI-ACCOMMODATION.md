# Message to dev team — Synthesis programme accommodations for IOI

**From:** Omaida Ali
**Re:** NYA-INTEL-SYNTH-001 (Deterministic Intelligence Synthesis) — accommodations required so that NYA-IOI-001 v1.2 can consume it
**Date:** 13 October 2026

---

Team,

IOI v1.2 is now specified as a downstream consumer of Synthesis: IOI requests the signed Assessment for a subject **before** it touches any of its own sources, treats established facts as its strongest evidence, aims its acquisition at synthesis indicators, and is constrained by what synthesis has closed or found conflicted. Synthesis never consumes anything from IOI except ingest candidates routed through governed source admission.

To make that work, the Synthesis programme needs the following accommodations. They are **additive contract and access changes only**. There are **no vocabulary changes** on the synthesis side — IOI has absorbed the vocabulary separation entirely (it relabels consumed assertions as `SYNTH_*`, renames its own `ASSOCIATION_ONLY` to `ASSOCIATION_SIGNAL`, and runs a CI check so no IOI signal type can collide with a synthesis predicate). Please do not rename, re-class or re-word anything in SYNTH-001 on IOI's account.

Please treat each item as a proposed amendment to v0.5.0 (or an early item in its backlog), to be folded into the next revision rather than applied informally.

## 1. Audience: an internal-service consumer

v0.5.0 §10 requires `INTEL_READ` **and** `require_client_type_in("FIRST_PARTY_APPLICATION")` **and** wildcard rejection, with object-level ownership keyed on `client_id`. IOI is an internal Nyansapo bounded context, not a first-party application.

**Needed:** a second permitted audience — `INTERNAL_SERVICE` (or equivalent in `api/models/admin.py`) — with its own non-wildcard credential, the same `INTEL_READ` scope requirement, and the same object-level ownership rule. IOI's assessments are IOI's; a first-party client's are theirs. No shared `client_id`. This should be its own row in the §14 decision record (an FD-IS17), not a silent widening of FD-IS12.

## 2. Structured indicators, not only free text

v0.5.0 §5.1 gives each precondition an `indicator_text`, and §7 emits one `INDICATOR` per `UNKNOWN` precondition. IOI uses indicators to **target acquisition**, so it needs machine-readable content alongside the text.

**Needed:** on every `INDICATOR` assertion, in addition to `indicator_text`: `precondition_id`, `source_families[]` (the families that could satisfy it), `unknown_reason` (`NO_CANDIDATE | FIELD_MISSING`), and the rule's `expression` summary. This is already in the rule definition; it only needs to be surfaced on the assertion. Canonicalisation covers it (so it is signed), which is what we want.

## 3. Stable, exposed per-binding statuses

IOI's constraints key on `CLOSED(FALSE)` and `CONFLICT` **per binding**. v0.5.0 §5.5/§6.2 already records `rule_status[] {rule_id, version, binding_id, binding{}, status, reason}` in the signed body.

**Needed:** confirm this is returned in full in `GET /v1/intel/assess/{id}` and that `binding{}` carries the canonical identifiers (`ch_person_id`, company numbers, release id, tenure end kinds) rather than internal row keys, so IOI can match a proposition on the same binding without re-resolving. Also confirm `assertion_key` is stable across assessments for correlation (it is per §9.1 — just confirm nothing on the IOI path changes that).

## 4. Caller context without a scan

v0.5.0 §10.1 request carries `caller_scan_id?` and `external_ref?`, both Veredis-flavoured.

**Needed:** a neutral `caller_context` object (`{consumer: "IOI", consumer_ref: "<ioi evaluation id>"}`) in the request and echoed in the envelope (non-canonical, like `external_ref`), so IOI's `ioi_synthesis_consumption` rows can be joined back without pretending to be a scan.

## 5. A cheap supersession check

IOI pins `assessment_id`/`execution_id` and must re-evaluate when a newer Assessment exists for the subject. SYNTH-004 (drift) is deferred; IOI cannot wait for it, and re-running `POST /v1/intel/assess` just to find out is wasteful and creates assessments IOI doesn't need.

**Needed:** `GET /v1/intel/assess/{assessment_id}/status` returning `{superseded: bool, latest_execution_id_for_subject, latest_as_of}` — read-only, same access boundary, no evaluation. When SYNTH-004 lands this becomes a projection of it; until then it is a single query on `intel_assessments` by `subject_key` ordered by `as_of`.

## 6. Explain payload reachable by the consumer

IOI's admin trace links each `SYNTH_*` evidence item to the synthesis explain payload (§10.3 in v0.5.0). Please confirm the explain endpoint is callable under the `INTERNAL_SERVICE` audience with object-level ownership satisfied by the consumer that created the assessment — i.e. IOI can explain its own assessments, not anyone else's.

## 7. Ingest-candidate intake (not a synthesis change, but adjacent)

IOI will file `POSSIBLE_SYNTHESIS_EVIDENCE` candidates naming a structured source family synthesis does not yet load (court registers, insolvency reports). This goes to **governed source admission**, not to the synthesis engine, and never into facts. Nothing is required of SYNTH-001 itself beyond acknowledging in §12 (or a new §12.4) that IOI is a permitted consumer and that the only reverse channel is source admission. Please add that one paragraph so the boundary is written on both sides.

## 8. Decision-effect composition note

One sentence in SYNTH-001 §3 or §12: "Assessments composed with other `CONTEXT_ONLY` outputs (IOI, RRI) in a consumer do not raise the decision-effect cap and must not be combined into a score." IOI v1.2 says the same from its side and Veredis's parity test asserts it. Having it in both documents closes the gap.

## What is explicitly **not** being asked

- No renaming of `INFERENCE`, `EMITTED`, `ASSOCIATION_CLUSTER_SUPPORTED`, or any class, status or predicate.
- No new rule family, question type, or source family for IOI's benefit.
- No relaxation of C2, C6, C7 or any constitutional prohibition.
- No acceptance of IOI output, review events, or confidence bands as synthesis inputs.
- No change to the benchmark, acceptance gate or founder decisions already proposed, except the one new FD-IS17 audience row.

## Sequencing

IOI phase 2 (synthesis adapter) cannot start until the SYNTH-001 first slice is accepted. Items 1–6 above should be in the slice's contract **before** IS-3 (routes/SDK) is cut, so they ride the same contract-completeness check rather than becoming a v1.1 of the API. Items 7–8 are documentation and can go in whenever v0.6 is drafted.

If anything here conflicts with a ruling already recorded on FD-IS1–16, the ruling wins and I'd like to hear about it rather than have it quietly worked around.

— Omaida
