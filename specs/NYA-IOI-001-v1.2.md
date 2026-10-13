# NYA-IOI-001 / VER-IOI-001 — Inferred Ownership Intelligence Layer

**Operating Design Document and Implementation Specification — v1.2 (Synthesis-Integrated)**

> **Status:** Approved future scope and committed. Sequenced after RRI, after the cross-document scanning contract is stable enough to emit governed bundle entities and relationships, **and after NYA-INTEL-SYNTH-001 (Deterministic Intelligence Synthesis) has shipped its first slice**. This is not a deferral or scope removal. v1.2 is a complete document and supersedes v1.1 in full; no reader needs v1.1.

| Field | Value |
|---|---|
| Version | v1.2 — synthesis-integrated revision (complete, self-contained) |
| Supersedes | v1.1 architecture revision (23 July 2026); v1.0 |
| Date | 13 October 2026 |
| Architecture owner | Nyansapo IOI bounded context |
| Synthesis role | **Upstream evidence authority.** IOI consumes the signed synthesis Assessment for a subject before any of its own acquisition. Synthesis never consumes IOI output. |
| Ceres role | Evidence grounding provider only; no inferred-edge ownership |
| Veredis role | Trigger policy, orchestration, consumption, rendering and review submission |
| Decision posture | Review-only; `CONTEXT_ONLY` maximum decision effect; composing IOI with synthesis does not raise the cap |
| Current dependencies | Cross-document scanning (in development); NYA-INTEL-SYNTH-001 first slice (specified v0.5.0, awaiting founder rulings) |

**Operating phrase:** *AOT proves. Synthesis establishes. RRI connects. IOI infers. Ceres grounds.*

---

## Document contents

1. Executive summary
2. Revision history (v1.0 → v1.1 → v1.2)
3. Current-state grounding
4. Architecture decision and system placement
5. Design doctrine, vocabulary separation and non-goals
6. Responsibility and ownership matrix
7. Source family registry
8. Professional-profile and LinkedIn source treatment
9. Source acquisition and lineage contract
10. Synthesis consumption contract (new)
11. Cross-document scanning integration
12. Nyansapo IOI bounded context
13. Ceres evidence-grounding contract
14. Relationship to AOT, Synthesis and RRI
15. Signal taxonomy and confidence model
16. Data model
17. Inference, contradiction and temporal lineage pipeline
18. Nyansapo API contracts
19. Veredis consumption and orchestration contract
20. Veredis output contracts
21. User review and feedback loop
22. Security, privacy, retention and access controls
23. Auditability, observability and operations
24. Feature flags, sequencing and rollout
25. Acceptance criteria and negative tests
26. Implementation ticket breakdown
27. Founder decisions required for v1.2

- Appendix A. Candidate source inventory
- Appendix B. Payload and output examples
- Appendix C. Architecture decision record

---

## 1. Executive summary

IOI — Inferred Ownership Intelligence — is a future, review-only intelligence engine that identifies *possible* ownership, beneficial-control, proxy, nominee, successor, shadow-director, executive-control and operating-control relationships where confirmed AOT evidence is incomplete, unavailable, opaque or contradicted, **and where deterministic synthesis has not already established or disproved the proposition from admissible structured sources.**

IOI is a first-class bounded context inside Nyansapo, adjacent to AOT, Synthesis, RRI and Ceres. It is not implemented inside Ceres, not inside Synthesis, and not as a Veredis inference engine.

> **Core rule:** IOI may identify what deserves investigation. It may not decide what is legally true, write confirmed ownership, alter a synthesis assertion, or alter a deterministic Veredis decision.

### 1.1 Product promise

Where ownership cannot be confirmed by AOT and cannot be established by Synthesis, Veredis can present reviewable inferred ownership/control signals with source lineage, contradiction handling, temporal role history, cross-document context, the synthesis basis they rest on, and explicit separation from both confirmed AOT and established Synthesis.

### 1.2 Layer definitions

| Layer | Meaning | Primary function | Maximum authority |
|---|---|---|---|
| AOT | Automated Ownership Traversal | Confirmed ownership/control traversal using admitted structured evidence | Deterministic only where governed policy permits |
| **Synthesis** | Deterministic Intelligence Synthesis (NYA-INTEL-SYNTH-001) | Establishes, from admissible structured facts under governed rules, what is established / unresolved / disproved / conflicted for a question about a subject; emits signed Assessments | `CONTEXT_ONLY`; deterministic; no probability |
| RRI | Relationship Risk Intelligence | Broader relationship and adverse-context graph | Review, context and EDD |
| IOI | Inferred Ownership Intelligence | Possible ownership/control/proxy signals where proof is missing and synthesis is silent or unresolved | Review-only; `CONTEXT_ONLY` |
| Ceres | Legal and policy grounding | Retrieves grounded legal/context passages and source status | Context provider; no relationship decision authority |

## 2. Revision history

### 2.1 v1.1 → v1.2 (this revision)

| Area | v1.1 | v1.2 |
|---|---|---|
| Synthesis | Not mentioned (predates NYA-INTEL-SYNTH-001). | Synthesis is the **first input** to every IOI evaluation (§10). Established facts enter IOI as S1 evidence; hypotheses/indicators target IOI acquisition; closed/conflicted propositions constrain IOI signals. |
| Vocabulary | IOI used `INFERRED_*`, `ASSOCIATION_ONLY`, "inference", "evidence", "contradiction" with no separation from synthesis terms. | **Vocabulary separation is enforced on the IOI side only** (§5.5): synthesis terms are reserved; IOI renames `ASSOCIATION_ONLY` → `ASSOCIATION_SIGNAL`; consumed synthesis assertions carry `SYNTH_*` labels; the copy guard forbids cross-use. Synthesis vocabulary is unchanged. |
| Placement diagram | Four siblings (AOT, RRI, IOI, Ceres). | Five siblings; Synthesis added (§4). |
| Logical flow | Started at source discovery. | Step 0: obtain the synthesis Assessment (§12.2). |
| Data model | No synthesis linkage. | `synthesis_basis` on `ioi_inferred_edges`; `SYNTHESIS_ASSESSMENT_SOURCE` family; `ioi_synthesis_consumption` table; `ioi_ingest_candidates` (§16). |
| Reverse flow | IOI → AOT candidates only. | Adds IOI → ingest candidates (`POSSIBLE_SYNTHESIS_EVIDENCE`); never IOI → synthesis facts (§14). |
| Sequencing | After RRI and cross-doc. | Additionally after the synthesis first slice; dependency listed (§24). |
| Decisions | None open. | §27 lists the v1.2 founder decisions. |

### 2.2 v1.0 → v1.1 (retained)

System placement corrected: IOI is an independent Nyansapo bounded context, not a Ceres submodule and not Veredis-owned. Ceres returns grounded passages and source/legal status only. Veredis owns trigger policy, orchestration, rendering and review submission only. Authoritative review history and all inferred edges remain in Nyansapo. IOI waits for a stable governed cross-document output contract.

## 3. Current-state grounding

### 3.1 Nyansapo standing

- **Data substrate:** Nyansapo owns source acquisition, source lineage, canonical entity resolution, provenance, graph contracts, medallion/admissibility and AOT.
- **Confirmed traversal:** AOT remains the only confirmed ownership traversal path.
- **Deterministic establishment:** Synthesis (NYA-INTEL-SYNTH-001) is the only engine that may say a relationship proposition is *established* or *disproved* from structured evidence. Its first slice answers `Q-ASSOC-1` (source-established relationships around a subject) and emits signed, snapshot-pinned Assessments with terminal statuses per rule and binding.
- **Relationship substrate:** RRI represents broader relationships and adverse context; IOI may consume RRI features but retains separate edge types and review state.
- **Ceres:** context-only; supplies grounded legal or policy passages.
- **IOI:** new bounded context with its own schema, APIs, guardrails, audit trace and lifecycle.

### 3.2 Veredis standing

- Consumes governed Nyansapo outputs; does not write ownership or relationship truth back.
- Owns scan orchestration and deterministic user-facing outcomes; IOI cannot alter them.
- Web, PDF and structured API/VZP output must preserve identical IOI caveats, evidence summaries **and synthesis-basis labels**.
- Captures user actions but sends them to Nyansapo as review events.

### 3.3 Synthesis standing

Synthesis is specified (v0.5.0) and awaiting founder rulings FD-IS1–16. Its outputs relevant to IOI: Assessment id, execution header (snapshot, rule-set digest, `as_of`, pinned releases), assertions with class (`FACT`, `DERIVED_FACT`, `INFERENCE`, `CONFLICT`, `HYPOTHESIS`, `INDICATOR`, `GAP`, `UNKNOWN`), per-binding terminal statuses (`EMITTED`, `HYPOTHESIS`, `UNRESOLVED`, `CLOSED`, `SUPPRESSED`), and the explain payload per assertion. Synthesis exposes `/v1/intel/assess/*` under scope `INTEL_READ`. IOI's accommodation requests toward the synthesis programme are listed separately (dev-team message accompanying this document) and do not alter synthesis vocabulary.

### 3.4 Cross-document scanning standing

Cross-document scanning is in active development. IOI binds only to the stable governed contract produced after cross-document entity reconciliation and role assignment.

> **Sequencing:** IOI is approved and committed. Its synthesis adapter is sequenced after the synthesis first slice; its cross-document adapter after the cross-document contract is stable. IOI core schema, source lineage and evidence contracts may be designed independently.

## 4. Architecture decision and system placement

```
GOVERNED SOURCE ACQUISITION AND LINEAGE
  registries | court & insolvency | regulatory | filings | procurement | company web | media/NGO | professional profiles | archives
        │
NYANSAPO — governed intelligence substrate
  shared substrate: source lineage | resolver | canonical entities | provenance | graph contracts | medallion/admissibility
  ┌────────┐  ┌───────────┐  ┌────────┐  ┌────────┐  ┌────────┐
  │  AOT   │  │ SYNTHESIS │  │  RRI   │  │  IOI   │  │ CERES  │
  │ proves │  │establishes│  │connects│  │ infers │  │grounds │
  └────────┘  └─────┬─────┘  └───┬────┘  └───▲────┘  └───┬────┘
                    │ signed     │ features  │           │ passages
                    │ assessment └───────────┤           │
                    └──────────── step 0 ────┴───────────┘
        │ governed contracts
VEREDIS — consumer, orchestrator and presentation layer
  document/bundle intake | cross-document scanning | IOI trigger policy | web/PDF/API rendering | user review submission
```

### 4.1 Why IOI belongs in Nyansapo

- IOI depends on canonical identity, source lineage, evidence hashing, resolver state, graph contracts, time-aware relationship history **and signed synthesis Assessments** — all substrate assets.
- Keeping confirmed (AOT), established (Synthesis) and inferred (IOI) relationships physically and contractually separate while resolving all three against the same Golden Records prevents a split-brain graph.
- Authoritative review history, contradiction state and confidence decay must survive across Veredis scans and future consumers.

### 4.2 Why IOI must not live inside Synthesis

- Synthesis is deterministic: closed expression evaluator, no probability class, admissible structured sources only, no generative or ranking models in its production path, and a constitutional prohibition on promoting association to control (its C2).
- IOI is banded-confidence over S1–S5 sources including media, NGO reports and self-asserted profiles, uses an extractor and a ranker with model versions in its audit trace, and exists precisely to surface *possible* control where proof is absent.
- Merging them would either admit weak sources and probability into synthesis — destroying its contract — or strip IOI of confidence and weak sources, at which point it is no longer IOI.

### 4.3 Why IOI must not live inside Ceres

Ceres is a retrieval and grounding subsystem, not a probabilistic graph-state owner. Ceres may classify a passage's legal status; it must not emit `INFERRED_CONTROLLER = true`.

### 4.4 Why Veredis must not own the engine

Veredis would duplicate identity resolution, lineage, graph persistence and evidence decay; inference would sit next to deterministic decision rendering; IOI would become product-specific.

## 5. Design doctrine, vocabulary separation and non-goals

### 5.1 Allowed language (IOI outputs)

```
Sources suggest a possible ownership or control relationship between X and Y.
This has not been confirmed through AOT and has not been established by Synthesis.
Review required before reliance.
```

### 5.2 Forbidden language (IOI outputs)

```
X owns Y.
X controls Y.
Hidden owner found.
Beneficial owner confirmed.
Blocked because of IOI.
Synthesis suggests…            (synthesis does not suggest; it establishes or does not)
Established by IOI.            (IOI never establishes)
IOI inference confirmed.
```

### 5.3 Non-negotiable constraints

| Constraint | Rule |
|---|---|
| AOT isolation | IOI edges cannot enter confirmed AOT traversal tables or be traversed as confirmed ownership. |
| Synthesis isolation | IOI output never becomes a synthesis fact, precondition, binding or override. IOI never writes to `intel_*` tables. |
| Decision cap | `IOI_MAX_DECISION_EFFECT = CONTEXT_ONLY`. No BLOCK, CLEAR, ESCALATE or HOLD. Composition with synthesis (also `CONTEXT_ONLY`) does not raise the cap. |
| Evidence floor | No signal without at least one evidence item, source family, retrieval time and hash. |
| Synthesis precedence | A synthesis `CLOSED(FALSE)` on the same proposition and binding forces any IOI signal asserting it to band `CONTRADICTED`. A synthesis `EMITTED(INFERENCE)` on the same proposition means IOI emits **no competing signal**; it references the assessment instead. |
| Contradiction-aware | Material contradictions (including synthesis `CONFLICT`) must be retained, scored and shown. |
| User review is not truth | A user confirmation records usefulness or case judgment; it creates neither confirmed ownership nor an established synthesis fact. |
| No source laundering | Several weak sources do not become a primary source by aggregation; a synthesis Assessment is one S1 evidence item per cited assertion, not many. |
| Temporal honesty | Role history and control claims are time-bounded and decay or become stale. Synthesis-derived evidence carries the Assessment's `as_of` and snapshot, not IOI's retrieval time. |
| Cross-doc restraint | Bundle co-occurrence triggers investigation; it is not ownership evidence. |

### 5.4 Non-goals

- Replacing AOT or lowering AOT admissibility standards.
- Re-implementing, extending or relabelling Synthesis; changing any synthesis vocabulary.
- Turning Ceres into a general inference or graph engine.
- Building a generic adverse-media product under the IOI name.
- Treating professional profiles, media or user confirmations as ownership proof.
- Re-implementing cross-document scanning inside IOI.
- Hidden decision effects or unreviewable model conclusions.

### 5.5 Vocabulary separation (enforced in IOI only)

Synthesis is a filed programme; its vocabulary is **reserved** and unchanged. IOI adjusts on its side so that no reviewer, renderer or API consumer can confuse a deterministic synthesis result with an IOI signal.

| Concept | Synthesis term (reserved — IOI must not use for its own outputs) | IOI term (v1.2) |
|---|---|---|
| A rule-derived conclusion from admissible structured facts | `INFERENCE` (class), `EMITTED` (status) | — IOI never produces one. When consumed: `SYNTH_ESTABLISHED` |
| A possible relationship from weighted sources | — | `INFERRED_*` signal types (unchanged names; "inferred" in IOI means *possible, banded, review-only*) |
| Association without control | `ASSOCIATION_CLUSTER_SUPPORTED` | `ASSOCIATION_SIGNAL` (renamed from `ASSOCIATION_ONLY`) |
| Missing-evidence state | `HYPOTHESIS` + `INDICATOR`, `UNRESOLVED`, `GAP` | When consumed: `SYNTH_HYPOTHESIS`, `SYNTH_UNRESOLVED`, `SYNTH_GAP`. IOI's own: `INSUFFICIENT_EVIDENCE` (unchanged) |
| Disproof | `CLOSED(FALSE)` | When consumed: `SYNTH_CLOSED`. IOI's own: `CONTRADICTED_SIGNAL` |
| Contradiction between admissible facts | `CONFLICT` | When consumed: `SYNTH_CONFLICT`. IOI's own: contradiction types in §17.3 |
| Evidence unit | fact (`fact_key`), assertion (`assertion_key`) | `evidence item` (`ioi_evidence_items.id`) |
| Confidence | none (no probability class) | `confidence_band` (`LOW/MEDIUM/HIGH/CONTRADICTED/STALE/INSUFFICIENT`) — never applied to `SYNTH_*` items |
| Admissibility | `ADMISSIBLE / ADMISSIBLE_ADVISORY / INADMISSIBLE_*` | `source_reliability_band` S1–S5 and acquisition status (§9.2) |
| "Established" | reserved for synthesis `EMITTED` assertions | IOI copy guard rejects "establish" for any IOI signal |
| "Suggests / possible" | never used by synthesis | reserved for IOI signals; copy guard rejects it for `SYNTH_*` items |

Copy guard rules (build-time and request-time, see §20.6): (a) the tokens `INFERENCE`, `EMITTED`, `ESTABLISHED` may appear in IOI output only inside a `SYNTH_*` label or a verbatim synthesis assertion; (b) the words *suggests*, *possible*, *may* may not modify a `SYNTH_ESTABLISHED` item; (c) `confidence_band` must be null on every `SYNTH_*` evidence item; (d) no IOI signal type name may collide with a synthesis predicate name (CI check against the synthesis predicate enum).

## 6. Responsibility and ownership matrix

| Capability | Nyansapo IOI | Synthesis | Ceres | Veredis |
|---|---|---|---|---|
| Source acquisition and family policy | Owns (IOI families) | Owns (admissible structured families) | Selected legal-source support | No |
| Canonical entity resolution | Consumes shared resolver; owns IOI linkage | Consumes with strict floor | No | Supplies scan/bundle candidates |
| Deterministic establishment of a proposition | **No** | **Owns** | No | No |
| Grounded legal passages | Consumes | Never (C6) | Owns | No |
| Inferred-edge generation | **Owns** | No | No | No |
| Confidence, corroboration, contradiction (banded) | Owns | No (terminal statuses only) | May supply passage status | No |
| Temporal role lineage | Owns | Owns tenure model for its facts | No | No |
| Authoritative IOI graph and review history | Owns | No | No | Submits review events |
| Synthesis Assessment consumption | Consumes (step 0) | Produces | No | May request both |
| Ingest candidates from IOI findings | Files | Receives via governed source admission (not into facts) | No | No |
| Cross-document reconciliation | Consumes contract | No | No | Owns scan-side feature |
| When to request IOI | Exposes capability | No | No | Owns orchestration policy |
| Web/PDF/API presentation | Projects payload | Projects Assessment | No | Owns |
| Deterministic Veredis decision | No | No | No | Owns; neither IOI nor Synthesis can alter |

## 7. Source family registry

Every source connector is registered by family, reliability class, access method, allowed use, retention policy and extraction contract. The family identifies the evidential nature of the record; the source name identifies the specific registry, court, outlet, platform or provider.

### 7.1 Official, legal and primary-source families

| Source family | Examples | IOI use | Default treatment |
|---|---|---|---|
| **SYNTHESIS_ASSESSMENT_SOURCE** (new) | Signed NYA-INTEL-SYNTH-001 Assessments | Established facts, derived facts, closed propositions, conflicts, hypotheses with indicators | **S1**; `confidence_band` null; carries synthesis `as_of`, snapshot and signature; one evidence item per cited assertion |
| CORPORATE_REGISTRY_SOURCE | National company registries, officer and beneficial-owner filings | Directors, officers, PSCs, charges, historical filings | High; structured ownership may become AOT candidate; where synthesis already consumes the same registry release, IOI cites the synthesis fact rather than re-reading the row |
| LEI_RELATIONSHIP_SOURCE | GLEIF Level 2 and related LEI records | Parent, child, entity lineage | High for declared relationships |
| SECURITIES_FILING_SOURCE | Annual reports, major holdings, related-party and issuer filings | Ownership, subsidiaries, officers, related parties | High |
| COURT_RECORD_SOURCE | Judgments, pleadings, asset recovery, civil and criminal proceedings | Alter ego, nominee, shadow control, ownership allegations or findings | High but legal-status aware |
| BANKRUPTCY_INSOLVENCY_SOURCE | Petitions, insolvency reports, administrator statements | Hidden interests, creditor influence, related-party transfers | High if official |
| REGULATORY_ENFORCEMENT_SOURCE | Regulator findings, sanctions notices, asset freezes | Evasion networks, control findings, restricted-party links | High |
| PROCUREMENT_SOURCE | Awards, supplier records, contracting notices | Repeated related-party suppliers, operating networks | Medium/high |
| ASSET_REGISTRY_SOURCE | Land, vessel, aircraft, mining, licence records | Asset control and beneficial-interest indicators | Medium/high |

### 7.2 Open intelligence and contextual families

| Source family | Examples | IOI use | Default treatment |
|---|---|---|---|
| COMPANY_WEB_SOURCE | Leadership, board, founder, team pages | Executive role lineage, self-published operating roles | Medium/high |
| MEDIA_SOURCE | Investigative media, reputable adverse media, trade press | Control allegations, successor entities, historic lineage | Medium/high if corroborated |
| NGO_REPORT_SOURCE | Anti-corruption, sanctions-evasion, kleptocracy reports | Network and control allegations | Medium/high |
| ARCHIVED_WEB_SOURCE | Historical company pages, removed biographies | Historical role continuity, successor signals | Medium; staleness-aware |
| BUSINESS_DIRECTORY_SOURCE | Industry and chamber directories | Weak role or association evidence | Low/medium |
| PROFESSIONAL_PROFILE_SOURCE | Executive profiles, business-network platforms | Self-asserted roles, founder claims, board history, affiliations | Medium but capped |
| SEARCH_DISCOVERY_SOURCE | Search results, index metadata | Discovery only until the underlying source is retrieved | Not evidence |

### 7.3 Reliability bands

| Band | Meaning | Examples | Effect |
|---|---|---|---|
| S1 | Primary official/legal, or signed synthesis Assessment | Registry filing, judgment, regulator decision, issuer filing, synthesis assertion | Strong IOI support; registry rows may create separately validated AOT candidates; synthesis items are never re-banded |
| S2 | Official self-published | Company site, annual report, official biography | Strong role signal; source-specific caveat |
| S3 | Reputable secondary | Investigative media, trade press, NGO report | Corroborated and contradiction-aware |
| S4 | Self-asserted professional | Professional profile or executive network | Confidence-capped; role signal, not ownership proof |
| S5 | Discovery or weak | Search snippet, directory, mirror | Discovery or low confidence only |

## 8. Professional-profile and LinkedIn source treatment

Professional-profile data is valuable for executive role chronology, founder identity, board participation, employment overlap and company affiliation. It is not inherently ownership evidence. IOI treats it as a source family with explicit acquisition lineage and confidence caps.

### 8.1 Source types

```
SELF_ASSERTED_FOUNDER
SELF_ASSERTED_OWNER
SELF_ASSERTED_EXECUTIVE
SELF_ASSERTED_BOARD_MEMBER
SELF_ASSERTED_COMPANY_AFFILIATION
EXECUTIVE_ROLE_LINEAGE
FOUNDER_SUCCESSOR_SIGNAL
```

### 8.2 Access lineage classes

| Access class | Meaning | Treatment |
|---|---|---|
| OFFICIAL_API_APPROVED | Platform API access approved for the use and storage pattern | Ingest only within granted limits |
| LICENSED_PROVIDER | Contract permits downstream professional/company data use | Ingest under licence and lineage reference |
| USER_SUPPLIED_EXPORT | Customer or subject supplies an export or evidence | Ingest with consent/attestation reference |
| MANUAL_REVIEW_CAPTURE | Analyst records a limited case-level role fact | Case-level evidence; not bulk assumption |
| GOVERNED_WEB_ACQUISITION | Collection method approved under source policy for the specific source | Ingest with access method and policy decision recorded |
| SEARCH_DISCOVERY_ONLY | Search result identifies a potential profile or company page | Discovery only |
| PROHIBITED_OR_UNAPPROVED | Method lacks source-policy approval | Reject or quarantine |

### 8.3 Confidence caps

| Claim | IOI classification | Maximum without corroboration |
|---|---|---|
| CEO / Managing Director / President | SELF_ASSERTED_EXECUTIVE | LOW or ASSOCIATION_SIGNAL |
| Founder / Co-founder | SELF_ASSERTED_FOUNDER | MEDIUM; not proof of current ownership |
| Owner / Principal / Managing Partner | SELF_ASSERTED_OWNER or POSSIBLE_CONTROL | MEDIUM; review-only |
| Board member / Chair | GOVERNANCE_INFLUENCE_SIGNAL | MEDIUM |
| Advisor / Consultant | ASSOCIATION_SIGNAL | LOW |
| Connections, likes, comments or endorsements | Out of scope | Reject |

A self-asserted role that synthesis has already **established** from a registry appointment (`SYNTH_ESTABLISHED` on the same person/company/role) is recorded as *corroborated by synthesis* and does not need its own cap; a self-asserted role that synthesis has **closed** (e.g. the registry shows the appointment resigned before the claimed period) is `CONTRADICTED`.

## 9. Source acquisition and lineage contract

The acquisition method is part of the evidence chain. An IOI evidence item is invalid if the system cannot state where it came from, how it was accessed, when it was retrieved, what claim was extracted and which versions resolved the entities.

### 9.1 Required lineage fields

```
source_family
source_name
source_record_id              # for SYNTHESIS_ASSESSMENT_SOURCE: "<assessment_id>/<assertion_key>"
source_url_hash
source_url_redacted
access_method                 # for synthesis items: "INTERNAL_SERVICE:/v1/intel/assess"
access_authority_or_policy_ref
source_reliability_band
retrieval_timestamp
publication_date              # for synthesis items: the Assessment's as_of
evidence_hash                 # for synthesis items: the Assessment's canonical_sha256
claim_text_redacted
language
translated_claim_text_redacted
extraction_method             # for synthesis items: "SYNTH_ASSERTION_PASSTHROUGH"
extractor_version
resolver_version              # for synthesis items: the binding is inherited, not re-resolved
supports_or_contradicts
allowed_use_classification
retention_expires_at
synth_label                   # SYNTH_ESTABLISHED | SYNTH_HYPOTHESIS | SYNTH_UNRESOLVED | SYNTH_GAP | SYNTH_CLOSED | SYNTH_CONFLICT | null
```

### 9.2 Acquisition statuses

| Status | Meaning | Pipeline effect |
|---|---|---|
| ADMITTED | Source and acquisition method satisfy policy and parsing requirements | Eligible for scoring |
| REVIEW_REQUIRED | Source or access method needs analyst/policy review | Quarantine from automated inference |
| DISCOVERY_ONLY | Reference exists but underlying evidence is not retrieved | May launch retrieval; no signal support |
| REJECTED | Source is unreliable, unverifiable, prohibited or corrupt | Excluded |
| STALE | Evidence is expired or superseded | Confidence capped and surfaced |
| SYNTH_SUPERSEDED | The synthesis Assessment consumed has been superseded by a later execution for the subject | IOI signal flagged for re-evaluation; see §10.6 |

## 10. Synthesis consumption contract (new)

Synthesis is the first input to every IOI evaluation. The flow is strictly one-way for facts and one narrow channel for ingest candidates.

### 10.1 Step 0 — obtain the Assessment

Before any source discovery, IOI requests the current synthesis Assessment for the subject (`POST /v1/intel/assess`, question `Q-ASSOC-1` in the first slice; further question types as synthesis adds them). IOI is an internal Nyansapo service and calls synthesis through the same scoped boundary any trusted consumer uses (`INTEL_READ`, internal-service audience, object-level ownership of the assessments it creates). IOI records the consumption in `ioi_synthesis_consumption` (§16) with `assessment_id`, `execution_id`, `snapshot_id`, `rule_set_sha256`, `as_of`.

If synthesis is unavailable, IOI proceeds in **degraded mode**: every signal carries `synthesis_basis = null` and `synthesis_status = UNAVAILABLE`, rendering states that established-fact grounding was not possible, and no `SYNTH_*` constraints are applied. IOI does not fabricate a synthesis result.

### 10.2 Established facts become S1 evidence

Each synthesis assertion of class `FACT`, `DERIVED_FACT` or `INFERENCE` (status `EMITTED`) becomes one `ioi_evidence_items` row: family `SYNTHESIS_ASSESSMENT_SOURCE`, band S1, `synth_label = SYNTH_ESTABLISHED`, `evidence_hash = canonical_sha256`, `publication_date = as_of`, `confidence_band = null`. The binding (`ch_person_id`, company numbers, tenures) is inherited verbatim; IOI's resolver does not re-resolve identities that arrive this way.

Where an IOI candidate relationship is **the same proposition** as a `SYNTH_ESTABLISHED` assertion on the same binding, IOI emits **no competing signal**. The rendered output references the synthesis assertion (`see established fact asm-…/assertion_key`) and IOI's own signal, if any, is limited to what synthesis did not cover (e.g. a *control* inference layered on a synthesis-established *association*).

### 10.3 Hypotheses and indicators target acquisition

Each synthesis `HYPOTHESIS` with its `INDICATOR`s becomes (a) an evidence item `SYNTH_HYPOTHESIS` and (b) one or more **targeted acquisition jobs** in `ioi_acquisition_jobs` with `triggered_by {assessment_id, assertion_key, precondition_id, indicator_text, source_families}`. IOI's weaker-source acquisition is thereby aimed at closing a specific named gap. The resulting IOI signal, if any, must state which indicator it addresses and that synthesis could not establish the proposition because that evidence was missing from admissible structured sources.

### 10.4 Closed propositions and conflicts constrain signals

- A `CLOSED(FALSE)` terminal status on a binding becomes a `SYNTH_CLOSED` evidence item with `supports_or_contradicts = CONTRADICTS`. Any IOI signal asserting the same proposition on the same binding **must** carry `confidence_band = CONTRADICTED`, with the synthesis assertion listed first among contradicting items. IOI never suppresses the signal silently and never overrides the synthesis disproof.
- A synthesis `CONFLICT` assertion becomes a `SYNTH_CONFLICT` evidence item and a source-contradiction entry (§17.3). IOI does not attempt to resolve it.
- `UNRESOLVED`, `GAP` and `UNKNOWN` become `SYNTH_UNRESOLVED` / `SYNTH_GAP` items; IOI proceeds normally and records that synthesis was silent on the proposition.

### 10.5 Reverse channel — ingest candidates only

IOI output never becomes a synthesis fact, precondition, binding or override (constraint table §5.3). The sole reverse channel: when IOI admits an evidence item from a **structured** source family that synthesis does not yet ingest (e.g. a court register, an insolvency administrator's report), IOI files `ioi_ingest_candidates` row `{candidate_type: POSSIBLE_SYNTHESIS_EVIDENCE, source_family, source_name, evidence_item_id, rationale}`. This is routed to governed source admission as a **request to consider adding a source family** to the synthesis loader. It is never a fact and never bypasses synthesis admissibility.

### 10.6 Pinning and supersession

Every IOI signal carries `synthesis_basis {assessment_id, execution_id, snapshot_id, rule_set_sha256, as_of}` or null. IOI periodically checks whether a newer synthesis execution exists for the subject; when one does, affected signals are marked `SYNTH_SUPERSEDED` and queued for re-evaluation against the newer Assessment. Until synthesis provides drift (NYA-INTEL-SYNTH-004), IOI performs this check itself by re-requesting an Assessment and comparing `execution_id`.

### 10.7 Decision-effect composition

Synthesis Assessments and IOI signals are both `CONTEXT_ONLY`. Presenting them together in Veredis does not raise the cap. Veredis must not compute any combined score from a `SYNTH_ESTABLISHED` item and an IOI `confidence_band`.

## 11. Cross-document scanning integration

### 11.1 Boundary

Cross-document scanning is upstream of IOI for transaction-bundle cases. Veredis reconciles document parties and discrepancies, then sends the governed bundle context to Nyansapo IOI. IOI performs source-backed investigation against the resolved entities; it does not reparse or reconcile the bundle. For bundle-triggered evaluations IOI still performs step 0 (§10.1) for each resolved `golden_id`.

### 11.2 Governed input contract

```
bundle_id
documents[]
reconciled_entities[]
party_role_assignments[]
cross_doc_relationships[]
bundle_discrepancy_findings[]
entity_resolution_candidates[]
source_document_pointers[]
audit_trace_id
```

### 11.3 Trigger patterns

| Cross-doc pattern | IOI investigation question | Allowed result |
|---|---|---|
| Supplier differs from payment beneficiary | Is the payee an affiliate, proxy, nominee or controlled entity? | INFERRED_PAYMENT_PROXY only with external evidence |
| Shipper differs from seller | Is the shipper part of the same operating/control network? | INFERRED_TRADE_PROXY or ASSOCIATION_SIGNAL |
| Consignee differs from buyer | Is the consignee a related party or hidden intermediary? | POSSIBLE_CONTROL or ASSOCIATION_SIGNAL |
| Repeated unknown intermediary | Is the intermediary a recurring facilitator or front? | INFERRED_PROXY_ENTITY if corroborated |
| Executive name appears in certificate or declaration | Is the person linked to one or more bundle entities? | EXECUTIVE_ROLE_LINEAGE (or reference to SYNTH_ESTABLISHED appointment) |
| Shared bank, address or contact details | Common control or service-provider overlap? | ASSOCIATION_SIGNAL unless corroborated; if synthesis established co-location in release R, reference it |

> **Hard gate:** Transaction-bundle co-occurrence is not ownership evidence. A cross-document finding may trigger IOI retrieval, but an inferred edge requires independent admitted evidence.

## 12. Nyansapo IOI bounded context

### 12.1 Component layout

```
nyansapo/ioi/
  source_registry/        # family definitions, reliability and policy
  synthesis_adapter/      # step-0 request, SYNTH_* mapping, supersession check, ingest-candidate filing
  acquisition/            # governed adapters and retrieval jobs (incl. indicator-targeted jobs)
  evidence/               # evidence items and provenance
  resolution/             # Golden Record and person/entity linking (never re-resolves SYNTH_* bindings)
  candidate_generation/   # possible relationship candidates
  temporal_lineage/       # role history, start/end and succession
  scoring/                # evidence weighting and confidence bands (SYNTH_* items excluded from banding)
  contradiction/          # conflicts, supersession and decay (incl. SYNTH_CLOSED / SYNTH_CONFLICT)
  graph/                  # isolated inferred edges
  review/                 # review events and pattern feedback
  projections/            # Veredis/RRI-safe response contracts
  api/                    # entity, bundle, review and admin endpoints
  audit/                  # immutable trace payloads
  guards/                 # AOT isolation, synthesis isolation, decision caps, copy guard
```

### 12.2 Logical flow

```
golden_id or governed bundle context
  -> STEP 0: synthesis Assessment request and consumption (§10.1–10.4)
  -> source discovery and source-policy validation (indicator-targeted first)
  -> governed acquisition
  -> evidence extraction and legal-status annotation
  -> entity/person resolution (SYNTH_* bindings inherited)
  -> relationship candidate generation (excluding propositions SYNTH_ESTABLISHED on the same binding)
  -> temporal alignment
  -> corroboration and contradiction analysis (SYNTH_CLOSED forces CONTRADICTED)
  -> confidence banding (SYNTH_* items unbanded)
  -> isolated IOI edge and audit trace (with synthesis_basis)
  -> ingest-candidate filing where applicable (§10.5)
  -> Veredis-safe projection
```

### 12.3 Persistence boundary

- IOI owns inferred edges and evidence links in isolated tables or schema.
- IOI never writes into confirmed ownership tables or into synthesis `intel_*` tables.
- IOI references canonical Golden IDs and synthesis `assessment_id`/`assertion_key`; it creates no second identity universe.
- Bundle-only unresolved entities may be referenced temporarily until resolver status changes.
- Authoritative review events are stored in Nyansapo and projected to Veredis.

## 13. Ceres evidence-grounding contract

Ceres is a provider to IOI, not the owner of IOI conclusions. It retrieves relevant legal, regulatory, policy or court passages and returns provenance, passage location, source status and legal posture.

### 13.1 Ceres may return

```json
{
  "document_id": "court_record_123",
  "source_family": "COURT_RECORD_SOURCE",
  "passages": [
    {
      "text_redacted": "The respondent exercised de facto control ...",
      "source_location": "paragraph 47",
      "legal_status": "ALLEGATION | FINDING | JUDGMENT | GUIDANCE",
      "entities": ["Person A", "Company B"],
      "supports_or_contradicts": "UNASSESSED"
    }
  ]
}
```

### 13.2 Ceres must not return

```
INFERRED_CONTROLLER = true
CONFIRMED_OWNER = true
DECISION_EFFECT = BLOCK
PROMOTE_TO_AOT = true
SYNTH_ESTABLISHED = true        # only a signed synthesis Assessment can carry this label
```

### 13.3 IOI use of Ceres output

IOI resolves the named entities against canonical records; determines whether a passage supports, contradicts or merely mentions a relationship; combines the passage with non-Ceres evidence families; preserves Ceres source location and legal status in the evidence trail. A Ceres passage is never a synthesis fact and is never relabelled `SYNTH_*`.

## 14. Relationship to AOT, Synthesis and RRI

### 14.1 AOT boundary

AOT remains the confirmed ownership traversal engine. IOI may create a separately typed investigation candidate when evidence appears capable of validation through official structured sources. The candidate is a work item, not a promoted edge.

```json
{
  "candidate_type": "POSSIBLE_AOT_EVIDENCE",
  "origin": "IOI",
  "status": "NEEDS_STRUCTURED_VALIDATION",
  "allowed_decision_effect": "NONE"
}
```

### 14.2 Synthesis boundary

| Direction | Allowed data flow |
|---|---|
| SYNTH → IOI | Signed Assessment: established facts (S1 evidence), hypotheses + indicators (targeted acquisition), closed propositions and conflicts (constraints), unresolved/gap (silence). Explain payloads for rendering lineage. |
| IOI → SYNTH | **Ingest candidates only** (`POSSIBLE_SYNTHESIS_EVIDENCE`), routed through governed source admission. Never facts, preconditions, bindings or overrides. |

### 14.3 RRI boundary

RRI and IOI are adjacent, not hierarchical. RRI may provide graph features such as common addresses, officers, co-defendants, enforcement associations or shared service providers. IOI determines whether those features, together with source evidence and the synthesis basis, support an ownership/control-specific inference. RRI may later render IOI as a typed sublayer, but IOI retains its own state and caveats.

| Direction | Allowed data flow |
|---|---|
| RRI → IOI | Relationship candidates, graph features, adverse context and source pointers |
| IOI → RRI | Typed review-only inferred-control edges for optional rendering |
| IOI → AOT | Investigation candidate only; never a direct confirmed edge |
| AOT → IOI | Confirmed path status, gaps, unknown upstream nodes and superseding evidence |

## 15. Signal taxonomy and confidence model

### 15.1 Signal types

```
INFERRED_BENEFICIAL_OWNER
INFERRED_CONTROLLER
INFERRED_NOMINEE_OWNER
INFERRED_PROXY_ENTITY
INFERRED_FAMILY_CONTROL
INFERRED_SHADOW_DIRECTOR
INFERRED_FINANCIER_CONTROL
INFERRED_ASSET_CONTROL
INFERRED_SUCCESSOR_ENTITY
INFERRED_EXECUTIVE_CONTROL
INFERRED_TRADE_PROXY
INFERRED_PAYMENT_PROXY
EXECUTIVE_ROLE_LINEAGE
ASSOCIATION_SIGNAL              # renamed from ASSOCIATION_ONLY (§5.5)
INSUFFICIENT_EVIDENCE
CONTRADICTED_SIGNAL
```

CI check: no signal type name may equal any synthesis predicate (`SHARED_OFFICER_ESTABLISHED`, `REGISTERED_ADDRESS_COLOCATED_IN`, `ASSOCIATION_CLUSTER_SUPPORTED`, `RELATIONSHIP_EVIDENCE_CONFLICTED`, `OWNERSHIP_PATH_CITED`, `SANCTIONS_LISTING_CITED`, and any later addition read from the synthesis rule-set manifest).

### 15.2 Confidence bands

| Band | Meaning | Rendering rule |
|---|---|---|
| LOW | Weak, single-source or limited-corroboration signal | Display only when materially relevant; ask for more evidence |
| MEDIUM | Credible signal with some corroboration | Display source basis, dates and contradictions |
| HIGH | Strong multi-source signal but still unconfirmed and not established by synthesis | Remain review-only; never render as proof |
| CONTRADICTED | Material contradictory evidence exists (including any `SYNTH_CLOSED` on the same binding) | Show contradiction prominently; cap reliance |
| STALE | Evidence is outdated or superseded | Label and reduce confidence |
| INSUFFICIENT | Mention exists but does not support inference | No active edge; retain rejected candidate only if useful |

`SYNTH_*` evidence items never carry a band. A signal resting **only** on `SYNTH_ESTABLISHED` items is not an IOI signal at all — it is a reference to synthesis and is rendered as such.

### 15.3 Evidence dimensions

| Dimension | Purpose |
|---|---|
| source_reliability | Weight primary, official, self-published, secondary and self-asserted sources appropriately; S1 synthesis items are fixed-weight |
| independence | Prevent copied or syndicated claims counting as independent corroboration |
| entity_resolution_confidence | Ensure the claim refers to the correct person/company; inherited for `SYNTH_*` bindings |
| relationship_extraction_confidence | Whether text actually states or implies the typed relation |
| legal_status | Allegation, finding, judgment, guidance, self-assertion |
| recency and temporal fit | Align evidence dates with the claimed control period; synthesis items use the Assessment `as_of` |
| corroboration and contradiction | Count supporting and conflicting independent evidence; `SYNTH_CLOSED` is a mandatory contradiction |
| source-access status | Evidence admitted under source policy |
| synthesis basis | Whether and how the signal rests on, addresses, or is constrained by a synthesis Assessment |
| review history | Record user/admin outcomes without turning them into legal truth |

## 16. Data model

### 16.1 Core tables

| Table | Purpose |
|---|---|
| ioi_inferred_edges | Authoritative isolated inferred relationship edge (with `synthesis_basis`) |
| ioi_evidence_items | Source evidence, claims, hashes, access lineage, legal status, `synth_label` |
| ioi_edge_evidence_links | Many-to-many with support/contradiction role and weight |
| ioi_temporal_roles | Person/entity role history, start/end dates and source support |
| ioi_review_events | Immutable user/admin review actions |
| ioi_pattern_feedback | Aggregate feedback for ranking or suppression policy |
| ioi_bundle_context_links | Links signal to governed cross-document trigger and document pointers |
| ioi_aot_candidates | Separate work queue for possible structured AOT validation |
| **ioi_synthesis_consumption** (new) | One row per step-0 consumption: subject, assessment_id, execution_id, snapshot_id, rule_set_sha256, as_of, consumed_at, superseded_by |
| **ioi_acquisition_jobs** (new) | Acquisition work items incl. `triggered_by` (assessment/assertion/precondition) for indicator-targeted jobs |
| **ioi_ingest_candidates** (new) | `POSSIBLE_SYNTHESIS_EVIDENCE` requests to governed source admission |

### 16.2 ioi_inferred_edges

```
id UUID PRIMARY KEY
from_golden_id TEXT NULL
to_golden_id TEXT NULL
from_bundle_entity_id TEXT NULL
to_bundle_entity_id TEXT NULL
inferred_relationship_type TEXT NOT NULL
confidence_band TEXT NOT NULL
internal_score NUMERIC NULL
status TEXT NOT NULL DEFAULT 'ACTIVE'
decision_effect TEXT NOT NULL DEFAULT 'CONTEXT_ONLY'
source_count INTEGER NOT NULL DEFAULT 0
corroboration_count INTEGER NOT NULL DEFAULT 0
contradiction_count INTEGER NOT NULL DEFAULT 0
earliest_evidence_date DATE NULL
latest_evidence_date DATE NULL
effective_from DATE NULL
effective_to DATE NULL
review_status TEXT NOT NULL DEFAULT 'PENDING'
synthesis_basis JSONB NULL          -- {assessment_id, execution_id, snapshot_id, rule_set_sha256, as_of, addresses_indicator: {assertion_key, precondition_id} | null, constrained_by: [assertion_key...]}
synthesis_status TEXT NOT NULL      -- CONSUMED | UNAVAILABLE | SUPERSEDED
created_at TIMESTAMP NOT NULL
updated_at TIMESTAMP NOT NULL
CHECK (decision_effect = 'CONTEXT_ONLY')
```

### 16.3 ioi_evidence_items

```
id UUID PRIMARY KEY
source_family TEXT NOT NULL
source_name TEXT NOT NULL
source_record_id TEXT NULL
source_url_hash TEXT NULL
source_url_redacted TEXT NULL
access_method TEXT NOT NULL
access_authority_or_policy_ref TEXT NULL
source_reliability_band TEXT NOT NULL
publication_date DATE NULL
retrieval_date TIMESTAMP NOT NULL
evidence_hash TEXT NOT NULL
excerpt_redacted TEXT NULL
language TEXT NULL
translated_excerpt_redacted TEXT NULL
extraction_method TEXT NOT NULL
extractor_version TEXT NULL
resolver_version TEXT NULL
legal_status TEXT NULL
allowed_use_classification TEXT NOT NULL
retention_expires_at TIMESTAMP NULL
synth_label TEXT NULL               -- SYNTH_ESTABLISHED | SYNTH_HYPOTHESIS | SYNTH_UNRESOLVED | SYNTH_GAP | SYNTH_CLOSED | SYNTH_CONFLICT
confidence_band TEXT NULL
CHECK (synth_label IS NULL OR confidence_band IS NULL)
CHECK (synth_label IS NULL OR source_family = 'SYNTHESIS_ASSESSMENT_SOURCE')
```

### 16.4 Review actions

```
CONFIRM_SIGNAL_USEFUL
DENY_SIGNAL
MARK_ASSOCIATION_SIGNAL          # renamed from MARK_ASSOCIATION_ONLY
REQUEST_MORE_EVIDENCE
ESCALATE_TO_EDD
ATTACH_SUPPORTING_EVIDENCE
SUPPRESS_SIMILAR_SIGNAL
```

## 17. Inference, contradiction and temporal lineage pipeline

### 17.1 Candidate generation

- Generate candidates only after entity resolution reaches the required threshold (or the binding is inherited from synthesis).
- Use explicit typed patterns: role history, formal/claimed ownership, nominee language, de facto control, related-party finance, asset control and proxy operation.
- Keep association candidates separate from ownership/control candidates.
- Do not generate a candidate for a proposition that is `SYNTH_ESTABLISHED` on the same binding; reference the Assessment instead.
- Prefer candidates that address a `SYNTH_HYPOTHESIS` indicator.

### 17.2 Corroboration independence

IOI must identify syndicated or copied claims. Ten articles repeating one investigation are one origin, not ten independent corroborations. Evidence lineage retains origin clustering and citation ancestry where detectable. A synthesis Assessment counts as **one** S1 item per cited assertion, never as multiple corroborations because it cites multiple facts.

### 17.3 Contradiction handling

| Contradiction type | Example | Effect |
|---|---|---|
| Synthesis closure | Synthesis `CLOSED(FALSE)` on the same proposition/binding | **Mandatory** `CONTRADICTED`; synthesis assertion listed first |
| Synthesis conflict | Synthesis `CONFLICT` between admissible facts | Surface as `SYNTH_CONFLICT`; IOI does not resolve |
| Identity contradiction | Two people with similar names are conflated | Reject or cap until resolved |
| Temporal contradiction | Profile says role ended before alleged control period | Cap or mark stale |
| Source contradiction | Registry/company filing denies or supersedes media claim | Mark CONTRADICTED and surface both |
| Legal-status contradiction | Allegation is later dismissed or overturned | Update status; retain history |
| Relationship contradiction | Evidence supports employment only, not control | Downgrade to ASSOCIATION_SIGNAL |

### 17.4 Temporal lineage

All role and control signals are time-bounded where dates are available. IOI must be able to state that a person was associated with an entity during a defined period and that current ownership remains unknown. Old evidence must not silently imply present control. Synthesis-derived tenures carry the Assessment's `RESIGNED`/`CENSORED` end kinds and `observed_through`; IOI does not re-derive them.

## 18. Nyansapo API contracts

### 18.1 Entity-level signals

`GET /v1/entities/{golden_id}/ioi-signals`

```json
{
  "entity_id": "golden_123",
  "module": "IOI",
  "decision_effect": "CONTEXT_ONLY",
  "confirmed_ownership": false,
  "synthesis_basis": {
    "assessment_id": "asm-2026-1013-000042",
    "execution_id": "…",
    "snapshot_id": "…",
    "as_of": "2026-10-13T09:00Z",
    "status": "CONSUMED"
  },
  "synthesis_references": [
    {"assertion_key": "…", "label": "SYNTH_ESTABLISHED", "predicate": "SHARED_OFFICER_ESTABLISHED", "subjects": ["person_456", "company_123"]}
  ],
  "signals": [
    {
      "signal_id": "ioi_sig_001",
      "relationship_type": "INFERRED_CONTROLLER",
      "from": {"golden_id": "person_456", "display_name": "Person A"},
      "to": {"golden_id": "company_123", "display_name": "Company B"},
      "confidence_band": "MEDIUM",
      "review_status": "PENDING",
      "source_basis": ["COURT_RECORD_SOURCE", "COMPANY_WEB_SOURCE", "MEDIA_SOURCE"],
      "corroboration_count": 2,
      "contradiction_count": 1,
      "addresses_indicator": {"assertion_key": "…", "precondition_id": "P3"},
      "constrained_by": [],
      "summary": "Sources suggest possible control. Ownership is not confirmed and control is not established by Synthesis.",
      "required_copy": "Review-only. Does not establish confirmed ownership."
    }
  ]
}
```

### 18.2 Transaction-bundle evaluation

`POST /v1/ioi/transaction-bundles/evaluate` — request contains only the governed cross-document contract, resolved parties, trigger types and evidence pointers. Raw documents remain in the Veredis scan pipeline. IOI performs step 0 per resolved `golden_id`.

### 18.3 Review event

`POST /v1/ioi/signals/{signal_id}/reviews`

```json
{
  "action": "MARK_ASSOCIATION_SIGNAL",
  "reason": "Known logistics relationship; no ownership connection",
  "veredis_scan_id": "scan_001",
  "reviewer_tenant_id": "tenant_123"
}
```

### 18.4 Admin trace

`GET /admin/v1/ioi/signals/{signal_id}/trace` — includes the consumed `assessment_id`, the `SYNTH_*` items, the indicator addressed, and a link to the synthesis explain payload for each referenced assertion.

### 18.5 Ingest candidate (internal)

`POST /admin/v1/ioi/ingest-candidates` — IOI → governed source admission; body `{candidate_type: "POSSIBLE_SYNTHESIS_EVIDENCE", source_family, source_name, evidence_item_id, rationale}`.

## 19. Veredis consumption and orchestration contract

### 19.1 Veredis owns the experience, not the inference

- Determine whether scan policy requires an IOI request.
- Supply resolved entity IDs and governed cross-document context.
- Render the returned IOI projection without changing signal semantics; render `synthesis_references` as established facts, visually and textually distinct from IOI signals.
- Expose evidence, contradictions, the indicator addressed, and mandatory caveats.
- Capture user actions and submit them to Nyansapo.
- Preserve deterministic decision independence: neither IOI nor Synthesis can override or alter the scan verdict.

### 19.2 Trigger policy

| Trigger | Request IOI? |
|---|---|
| AOT returns a complete confirmed path | Optional context only |
| AOT returns no path or incomplete upstream ownership | Yes |
| Synthesis returns `HYPOTHESIS`/`UNRESOLVED` on a material proposition | Yes (indicator-targeted) |
| Synthesis returns `EMITTED` on the material proposition | Optional; IOI will reference, not compete |
| Cross-doc finds supplier/payee or seller/shipper mismatch | Yes when policy threshold is met |
| Repeated unknown intermediary across bundle documents | Yes |
| RRI returns a material control-adjacent relationship | Yes |
| Controlled-goods or sanctions context creates enhanced review need | Yes, context-only |
| No ownership gap and no relationship trigger | No or tenant-policy controlled |

### 19.3 Consumption flow

```
Veredis document/bundle intake
  -> cross-document reconciliation
  -> entity resolution through Nyansapo
  -> AOT request
  -> (Synthesis request, if Veredis consumes it directly for its own Bounded Intelligence Summary)
  -> Veredis IOI trigger policy
  -> Nyansapo IOI evaluation (IOI performs its own step-0 synthesis consumption)
  -> Veredis Web/PDF/API rendering
  -> user review action
  -> Nyansapo IOI review event
```

## 20. Veredis output contracts

### 20.1 Dashboard

A separate review-only IOI module: signals list, highest band, contradictions, review status; a distinct **Established by Synthesis** block above the IOI signals listing `synthesis_references` with their predicates and the Assessment id; cross-document triggers; review controls; mandatory disclaimer. The two blocks must not be visually merged.

### 20.2 Entity result — text contract

```
ESTABLISHED (Synthesis asm-2026-1013-000042, as of 2026-10-13)
  SHARED_OFFICER_ESTABLISHED: Person A — Company B (appointments overlap 412 days)

IOI — Inferred Ownership Signals                              REVIEW-ONLY

Possible control signal
Person A -> Company B
Confidence: Medium
Addresses synthesis indicator: P3 (control evidence not present in admissible structured sources)
Evidence: Court record, company website, investigative media
Contradictions: 1
Status: Pending review

Sources suggest Person A may exercise informal control or influence over Company B.
This has not been confirmed through AOT and has not been established by Synthesis.

[Confirm useful signal] [Deny] [Association signal] [Request more evidence] [Escalate to EDD]
```

### 20.3 Cross-document result — text contract

```
Cross-document trigger: Supplier differs from payment beneficiary
Supplier A <-> Payee C
Synthesis: no established relationship (UNRESOLVED — address evidence absent in release R)
IOI signal: Possible payment proxy relationship
Confidence: Low
Source basis: Company website and historical media
Decision effect: CONTEXT_ONLY

Transaction-bundle co-occurrence is not ownership evidence.
This signal requires user review.
```

### 20.4 PDF dossier block

```
Inferred Ownership Signals

This section contains review-only inferred ownership/control signals produced by Nyansapo IOI.
Established facts from Nyansapo Synthesis are listed separately above and are not IOI signals.
The signals do not establish confirmed ownership and do not alter the deterministic Veredis decision.

Signal IOI-001
Relationship type: Inferred Controller
Confidence: Medium
Synthesis basis: asm-2026-1013-000042 (addresses indicator P3)
Evidence basis: Court record; company leadership page; media report
Contradictions: 1
Decision effect: Context only
Recommended action: Review supporting evidence before reliance.
```

### 20.5 Structured output

```json
{
  "synthesis": {
    "assessment_id": "asm-2026-1013-000042",
    "established": ["<assertion_key>"],
    "decision_effect": "CONTEXT_ONLY"
  },
  "ioi": {
    "status": "SIGNALS_FOUND",
    "decision_effect": "CONTEXT_ONLY",
    "confirmed_ownership": false,
    "established_by_synthesis": false,
    "review_required": true,
    "signals": ["ioi_sig_001"]
  }
}
```

### 20.6 Copy guard

Build-time and request-time enforcement of §5.1, §5.2 and §5.5: forbidden phrases fail the build; cross-vocabulary misuse (an IOI signal described as *established*; a `SYNTH_ESTABLISHED` item described as *possible*; a band on a `SYNTH_*` item) fails the request. Web, PDF and structured outputs must pass the same guard with identical results (parity test §25.3).

## 21. User review and feedback loop

The review loop improves usefulness, ranking and suppression patterns. It does not convert a signal into confirmed ownership, does not create or alter a synthesis fact, and does not permit deterministic decision effects.

| Action | Meaning | State effect |
|---|---|---|
| CONFIRM_SIGNAL_USEFUL | Reviewer considers the signal relevant for the case | Records usefulness; remains IOI |
| DENY_SIGNAL | Reviewer finds the inference incorrect | Records rejection and reason |
| MARK_ASSOCIATION_SIGNAL | Relationship exists but does not support control/ownership | Downgrades relationship class |
| REQUEST_MORE_EVIDENCE | Evidence is insufficient | Queues retrieval or analyst work |
| ESCALATE_TO_EDD | Reviewer opens enhanced due diligence | Case workflow only; not IOI decision authority |
| ATTACH_SUPPORTING_EVIDENCE | Reviewer supplies additional material | New evidence enters validation pipeline |
| SUPPRESS_SIMILAR_SIGNAL | Reviewer requests suppression of a pattern or source combination | Policy-scoped; audited |

> **Hard distinction:** A user-confirmed IOI signal is neither AOT-confirmed ownership nor a synthesis-established fact. Only separately admitted evidence and AOT governance can create a confirmed ownership edge; only synthesis rules over admissible structured facts can establish a proposition.

## 22. Security, privacy, retention and access controls

### 22.1 Data minimisation

- Collect business-role and relationship evidence required for IOI; exclude irrelevant private-life data.
- Redact personal contact details unless independently necessary and policy-approved.
- Store source URLs in hashed/redacted form where appropriate while preserving retrievability under controlled access.
- Keep raw Veredis transaction documents outside IOI persistence unless a separate evidence-admission contract applies.
- Synthesis Assessments are stored by reference (`assessment_id`, `assertion_key`, `canonical_sha256`); IOI does not copy full Assessment bodies.

### 22.2 Access control

- Nyansapo service roles separate source ingestion, IOI read, IOI review, admin trace, and synthesis consumption (`INTEL_READ`, internal-service audience).
- Veredis receives only tenant-safe projected evidence and cannot query unrestricted source corpora.
- Analyst/admin evidence access is audited.
- Professional-profile and sensitive-source adapters are individually feature-flagged.
- IOI has no write grant on any `intel_*` table (CI zero-grant check).

### 22.3 Retention and decay

- Each source family defines default retention and revalidation intervals.
- Role and control signals expire, decay or become STALE when unsupported by current evidence; `SYNTH_SUPERSEDED` triggers re-evaluation.
- Review events are retained as immutable audit history.
- Erasure, suppression and correction workflows must not destroy the audit reason for a decision unless legally required.

## 23. Auditability, observability and operations

### 23.1 Audit trace

```json
{
  "module": "IOI",
  "signal_id": "ioi_sig_001",
  "decision_effect": "CONTEXT_ONLY",
  "confirmed_ownership": false,
  "established_by_synthesis": false,
  "synthesis_basis": {"assessment_id": "asm-…", "execution_id": "…", "status": "CONSUMED"},
  "sources_evaluated": 12,
  "sources_admitted": 4,
  "synth_items": {"established": 2, "hypothesis": 1, "closed": 0, "conflict": 0},
  "model_versions": {"extractor": "ioi-rel-v1", "resolver": "resolver-current", "ranker": "ioi-ranker-v1"},
  "guards": {"aot_write_blocked": true, "synth_write_blocked": true, "decision_cap_enforced": true, "review_only_copy_enforced": true, "vocabulary_guard_enforced": true}
}
```

### 23.2 Operational metrics

| Metric | Purpose |
|---|---|
| ioi_candidates_generated_total | Candidate volume by source family and relationship type |
| ioi_signals_admitted_total | Signals surviving evidence and policy gates |
| ioi_signals_contradicted_total | Contradiction rate and source-quality indicator |
| ioi_signals_synth_constrained_total | Signals forced `CONTRADICTED` by a synthesis closure |
| ioi_signals_addressing_indicator_total | Signals that target a synthesis indicator |
| ioi_synth_unavailable_total | Step-0 failures; degraded-mode evaluations |
| ioi_synth_superseded_total | Signals re-queued after a newer Assessment |
| ioi_ingest_candidates_filed_total | Reverse-channel volume |
| ioi_entity_resolution_reject_total | Identity quality and false-link prevention |
| ioi_source_policy_quarantine_total | Unapproved or review-required acquisitions |
| ioi_review_outcomes_total | User/admin review outcome distribution |
| ioi_aot_write_attempt_block_total | Critical isolation guard |
| ioi_synth_write_attempt_block_total | Critical isolation guard |
| ioi_decision_cap_violation_total | Critical decision-effect guard |
| ioi_vocabulary_guard_fail_total | Cross-vocabulary misuse caught |
| ioi_projection_parity_fail_total | Web/PDF/API contract divergence |

### 23.3 Failure posture

- IOI unavailable: Veredis continues without IOI and states that inferred intelligence is unavailable; it does not fabricate a result.
- Synthesis unavailable: IOI runs in degraded mode (§10.1) and says so; no `SYNTH_*` constraints applied; signals flagged `synthesis_status = UNAVAILABLE`.
- Ceres unavailable: IOI may use other sources, but legal-source-dependent signals remain incomplete.
- Cross-doc contract unavailable: entity-level IOI may operate; bundle-triggered IOI is not called.
- Guard failure: fail closed for IOI output and alert operations.

## 24. Feature flags, sequencing and rollout

### 24.1 Nyansapo flags

```
NYA_IOI_ENABLED=false
NYA_IOI_SYNTHESIS_CONSUMPTION_ENABLED=false
NYA_IOI_SYNTHESIS_REQUIRED=true           # when true, step-0 failure = degraded mode with explicit status; never silent
NYA_IOI_SOURCE_ACQUISITION_ENABLED=false
NYA_IOI_CERES_GROUNDING_ENABLED=false
NYA_IOI_RRI_FEATURE_INPUT_ENABLED=false
NYA_IOI_ENTITY_SIGNALS_ENABLED=false
NYA_IOI_TRANSACTION_BUNDLE_ENABLED=false
NYA_IOI_PROFESSIONAL_PROFILE_SOURCE_ENABLED=false
NYA_IOI_REVIEW_LOOP_ENABLED=false
NYA_IOI_INGEST_CANDIDATES_ENABLED=false
NYA_IOI_PUBLIC_API_ENABLED=false
NYA_IOI_MAX_DECISION_EFFECT=CONTEXT_ONLY
```

### 24.2 Veredis flags

```
VER_IOI_CONSUMPTION_ENABLED=false
VER_IOI_TRIGGER_POLICY_ENABLED=false
VER_IOI_WEB_RENDER_ENABLED=false
VER_IOI_PDF_RENDER_ENABLED=false
VER_IOI_STRUCTURED_OUTPUT_ENABLED=false
VER_IOI_REVIEW_ACTIONS_ENABLED=false
VER_IOI_CROSS_DOC_BUNDLE_ENABLED=false
VER_IOI_SYNTH_REFERENCE_RENDER_ENABLED=false
```

### 24.3 Sequencing

| Phase | Scope | Dependency/status |
|---|---|---|
| 0 — Boundary and contract seal | Architecture, vocabulary separation, copy rules, source registry, schemas, API contracts | Approved future scope; design may proceed |
| 1 — Nyansapo core | Isolated schema, guards (incl. synthesis isolation and vocabulary guard), evidence lineage, admin trace | After current higher-severity committed work |
| 2 — Synthesis adapter | Step-0 consumption, `SYNTH_*` mapping, constraints, supersession check, degraded mode | **After NYA-INTEL-SYNTH-001 first slice is accepted** |
| 3 — Source prototype | Court, insolvency, registry, company web and media adapters; indicator-targeted jobs | Source-specific approval |
| 4 — Ceres adapter | Grounded legal passages into IOI evidence contract | Ceres contract stable |
| 5 — RRI feature adapter | Consume approved relationship features | RRI contract stable |
| 6 — Cross-doc adapter | Consume governed bundle entities and trigger patterns | Cross-document contract stable |
| 7 — Ingest-candidate channel | Reverse channel to governed source admission | Source admission process ready |
| 8 — Veredis internal UAT | Web/PDF/API rendering incl. synthesis-reference block, review loop | Nyansapo APIs and copy guard sealed |
| 9 — External UAT | Selected users; review-only controls and monitoring | Internal UAT accepted |
| 10 — Controlled release | Specific tenants/use cases under feature flags | Governance approval |

## 25. Acceptance criteria and negative tests

### 25.1 Architecture acceptance

| Test | Expected result |
|---|---|
| IOI module placement | Independent Nyansapo bounded context; not under Ceres, Synthesis or Veredis |
| Ceres response | Passages and source status only; no inferred relationship verdict |
| Veredis role | Requests, renders and submits review; no edge generation |
| Review persistence | Authoritative event stored in Nyansapo |
| AOT write attempt | Blocked and audited |
| Synthesis write attempt (any `intel_*` table) | Blocked and audited |
| IOI decision above CONTEXT_ONLY | Blocked and audited |
| Signal type name equals a synthesis predicate | CI fails |

### 25.2 Evidence and inference tests

| Scenario | Expected result |
|---|---|
| Synthesis `EMITTED` shared-officer on (A,B); IOI has media claiming the same | No IOI signal for that proposition; `synthesis_references` lists the assertion; media item stored as corroborated-by-synthesis |
| Synthesis `CLOSED(FALSE)` on (A,B); IOI has two S3 sources asserting it | IOI signal emitted with `CONTRADICTED`; synthesis assertion first in contradictions; never suppressed silently |
| Synthesis `HYPOTHESIS` with indicator P3; IOI finds a court passage addressing P3 | Signal carries `addresses_indicator = P3`; copy states synthesis could not establish because P3 evidence was absent |
| Synthesis unavailable | Degraded mode; `synthesis_status = UNAVAILABLE`; no fabricated basis; rendering states it |
| Newer Assessment supersedes the consumed one | Signal → `SYNTH_SUPERSEDED`; re-evaluation queued |
| `SYNTH_*` item given a confidence band | DB check constraint rejects |
| Single weak blog claims X owns Y | Reject or LOW; no HIGH signal |
| Professional profile says CEO | Executive affiliation only |
| Professional profile says owner | Review-only self-asserted ownership; confidence capped |
| Court pleading alleges control without judgment | Legal status = ALLEGATION; review-only |
| Allegation later dismissed | Contradiction/supersession displayed |
| Ten syndicated articles repeat one source | One origin cluster, not ten corroborations |
| One Assessment citing six facts | One S1 item per cited assertion; not six corroborations of each other |
| Same address only | ASSOCIATION_SIGNAL unless corroborated; synthesis co-location in release R referenced if present |
| Cross-doc supplier/payee mismatch only | Trigger evaluation; no inferred edge without external evidence |
| User confirms signal | Remains IOI; no AOT promotion; no synthesis fact |
| Old founder profile only | STALE or historical role; no current-control assertion |

### 25.3 Veredis output tests

| Test | Expected result |
|---|---|
| Web output | Separate "Established by Synthesis" block and separate IOI section with mandatory review-only caveat |
| PDF output | Same structure, labels, confidence, evidence and caveat as Web |
| Structured output | `decision_effect=CONTEXT_ONLY`; `confirmed_ownership=false`; `established_by_synthesis=false` on every IOI signal |
| Contradiction present | Prominently rendered; synthesis closure first |
| IOI unavailable / Synthesis unavailable | No fabricated signals or basis; availability state shown |
| Forbidden phrase or cross-vocabulary misuse generated | Copy/vocabulary guard fails build/request |
| Combined score across synthesis and IOI | Not computed; parity test asserts absence |

## 26. Implementation ticket breakdown

### 26.1 Nyansapo

```
NYA-IOI-001              IOI bounded-context architecture and ADR (v1.2)
NYA-IOI-VOCAB-001        Vocabulary separation, SYNTH_* labels, rename ASSOCIATION_ONLY → ASSOCIATION_SIGNAL, CI predicate-collision check
NYA-IOI-SCHEMA-001       Isolated schema incl. synthesis_basis, synth_label constraints, consumption/jobs/ingest-candidate tables
NYA-IOI-GUARDS-001       AOT isolation, synthesis isolation (zero intel_* grants), decision-effect cap, vocabulary guard
NYA-IOI-SYNTH-001        Synthesis adapter: step-0 request, SYNTH_* mapping, constraints, degraded mode, supersession check
NYA-IOI-SOURCE-REG-001   Source family registry and admission policy (incl. SYNTHESIS_ASSESSMENT_SOURCE)
NYA-IOI-ACQ-001          Governed source acquisition adapters; indicator-targeted jobs
NYA-IOI-EVIDENCE-001     Evidence lineage and origin clustering
NYA-IOI-RESOLVE-001      Person/company entity linkage; inherited SYNTH bindings
NYA-IOI-TEMPORAL-001     Executive role and control timeline; synthesis tenure passthrough
NYA-IOI-EXTRACT-001      Relationship extraction and typed candidates (excluding SYNTH_ESTABLISHED propositions)
NYA-IOI-SCORE-001        Confidence, corroboration and contradiction (SYNTH_CLOSED mandatory CONTRADICTED)
NYA-IOI-CERES-001        Ceres evidence-grounding adapter
NYA-IOI-RRI-001          RRI graph-feature adapter
NYA-IOI-XDOC-001         Cross-document governed-context adapter
NYA-IOI-INGEST-001       Ingest-candidate reverse channel to governed source admission
NYA-IOI-REVIEW-001       Review events and pattern feedback
NYA-IOI-API-001          Entity, bundle, review, admin and ingest-candidate endpoints
NYA-IOI-AUDIT-001        Audit trace and operational metrics
```

### 26.2 Veredis

```
VER-IOI-001              Nyansapo IOI client and consumption contract
VER-IOI-TRIGGER-001      Entity and bundle IOI orchestration policy (incl. synthesis-status triggers)
VER-IOI-WEB-001          Web output: established-by-synthesis block + IOI section + evidence review UI
VER-IOI-PDF-001          PDF dossier rendering parity
VER-IOI-API-001          Structured/VZP output
VER-IOI-XDOC-001         Cross-document IOI presentation
VER-IOI-REVIEW-001       User review actions and feedback submission
VER-IOI-COPY-GUARD-001   Forbidden wording, vocabulary separation and caveat enforcement
VER-IOI-QA-001           QA/UAT test pack and parity gates (incl. no-combined-score assertion)
```

### 26.3 Shared contracts

```
NYA-CERES-IOI-GROUND-001   Passage grounding contract for IOI
NYA-GRAPH-IOI-TYPES-001    Typed inferred-edge projection contract
NYA-XDOC-IOI-HANDOFF-001   Stable bundle-entity and trigger handoff contract
NYA-SYNTH-IOI-CONSUME-001  Synthesis consumption contract (accommodations requested from the synthesis programme are listed in the accompanying dev-team message; none change synthesis vocabulary)
```

## 27. Founder decisions required for v1.2

| ID | Decision | Recommendation |
|---|---|---|
| FD-IOI-1 | Adopt v1.2 as the complete replacement for v1.1 (no reader needs v1.1). | Yes. |
| FD-IOI-2 | Synthesis as mandatory step 0, with degraded mode (never silent) when unavailable. | Yes; `NYA_IOI_SYNTHESIS_REQUIRED=true`. |
| FD-IOI-3 | Vocabulary separation enforced on the IOI side only; synthesis vocabulary untouched. Rename `ASSOCIATION_ONLY` → `ASSOCIATION_SIGNAL`; `SYNTH_*` labels; CI predicate-collision check. | Yes. |
| FD-IOI-4 | Synthesis `CLOSED(FALSE)` forces `CONTRADICTED`; synthesis `EMITTED` suppresses a competing IOI signal in favour of a reference. | Yes. |
| FD-IOI-5 | Reverse channel limited to ingest candidates through governed source admission. | Yes. |
| FD-IOI-6 | IOI sequenced after the synthesis first slice (in addition to RRI and cross-doc). | Yes; dependency recorded in §24.3 phase 2. |
| FD-IOI-7 | Veredis must not compute any combined score across synthesis and IOI. | Yes; parity test. |

## Appendix A. Candidate source inventory

| Source class | Typical content | IOI treatment |
|---|---|---|
| Synthesis Assessments | Established/closed/conflicted propositions; hypotheses with indicators | S1; unbanded; references and constraints |
| Company registries | Officers, directors, beneficial-owner filings, charges, status and history | AOT candidate or IOI support; cite synthesis fact where the same release is already consumed |
| GLEIF/LEI | Declared parent and relationship records | Entity lineage and corroboration |
| Securities filings | Issuer reports, holdings, related parties and subsidiaries | High-value ownership and control evidence |
| Court records | Judgments, pleadings, asset tracing and de facto control language | Legal-status-aware IOI evidence; ingest-candidate source |
| Insolvency/bankruptcy | Administrator reports, creditor structures and related-party transactions | Hidden interest and control signals; ingest-candidate source |
| Regulatory enforcement | Enforcement findings, sanctions evasion and asset freezes | High-value network/control evidence |
| Procurement | Awards, contractors and recurring supplier relationships | Operating-network signals |
| Asset registries | Vessels, aircraft, land, concessions and licences | Asset-control signals |
| Company websites | Leadership, founder and board pages | Official self-published role lineage |
| Media and trade press | Investigations, interviews and historic company narratives | Corroborated secondary evidence |
| NGO reports | Anti-corruption and sanctions-evasion investigations | Network/control allegations |
| Professional profiles | Role chronology, founder and board claims | Self-asserted, confidence-capped |
| Archived web | Removed biographies and historical company pages | Temporal continuity and succession |
| Business directories | Public executive/company listings | Weak support or discovery |
| Search indexes | Discovery of underlying sources | Never evidence by itself |

## Appendix B. Payload and output examples

### B.1 Cross-document request

```json
{
  "bundle_id": "txn_bundle_2026_001",
  "reconciled_entities": [
    {"bundle_entity_id": "be_supplier", "role": "supplier", "golden_id": "golden_123"},
    {"bundle_entity_id": "be_payee", "role": "payment_beneficiary", "golden_id": null}
  ],
  "cross_doc_relationships": [
    {"relationship_type": "SUPPLIER_DIFFERS_FROM_PAYEE", "from": "be_supplier", "to": "be_payee"}
  ],
  "audit_trace_id": "xdoc_trace_001"
}
```

### B.2 IOI response

```json
{
  "bundle_id": "txn_bundle_2026_001",
  "module": "IOI",
  "decision_effect": "CONTEXT_ONLY",
  "synthesis_basis": {"golden_123": {"assessment_id": "asm-…", "status": "CONSUMED"}, "be_payee": null},
  "signals": [
    {
      "signal_id": "ioi_sig_txn_001",
      "relationship_type": "INFERRED_PAYMENT_PROXY",
      "confidence_band": "LOW",
      "cross_doc_trigger": "SUPPLIER_DIFFERS_FROM_PAYEE",
      "summary": "External evidence suggests a possible operating relationship. Ownership is not confirmed and no relationship is established by Synthesis.",
      "review_status": "PENDING"
    }
  ]
}
```

### B.3 No-signal response

```json
{
  "status": "NO_REVIEWABLE_SIGNALS",
  "decision_effect": "CONTEXT_ONLY",
  "confirmed_ownership": false,
  "synthesis_references": ["<assertion_key>"],
  "required_copy": "No reviewable inferred ownership signals were identified from admitted sources. Established facts, if any, are listed under Synthesis."
}
```

## Appendix C. Architecture decision record

| ADR field | Decision |
|---|---|
| Title | Place IOI as an independent Nyansapo bounded context that consumes Synthesis first |
| Status | Accepted for future implementation; sequenced after RRI, cross-doc and the synthesis first slice; not deferred |
| Context | IOI requires source lineage, canonical identity, temporal graph state, contradiction handling, review persistence and a deterministic baseline of what is already established or disproved. Ceres is too narrow; Veredis is too downstream; Synthesis is deterministic and must not absorb banded confidence or weak sources. |
| Decision | Nyansapo owns IOI. Synthesis supplies the signed established/closed baseline and the indicators IOI targets. Ceres supplies grounded passages. Veredis owns request policy, rendering and review submission. Vocabulary separation is enforced on the IOI side. |
| Consequences | No split-brain graph; no second "inference" meaning; stronger AOT and synthesis isolation; additional adapter, schema and guard work; IOI cannot ship before the synthesis slice. |
| Rejected option 1 | Implement IOI inside Ceres — Ceres is retrieval/grounding, not probabilistic graph-state ownership. |
| Rejected option 2 | Implement IOI in Veredis — duplicates substrate responsibilities and sits next to deterministic decisions. |
| Rejected option 3 | Implement IOI inside Synthesis as a rule family with confidence — would admit S3/S4 sources, probability and ranking models into the deterministic engine and break its constitutional prohibitions. |

> **Final design position:** IOI is a Nyansapo intelligence engine adjacent to AOT, Synthesis, RRI and Ceres. Synthesis establishes; IOI infers only where synthesis is silent or unresolved, is constrained by what synthesis has closed, and never feeds synthesis anything but ingest candidates. Ceres grounds. Veredis orchestrates and renders. IOI remains review-only, source-backed and isolated from confirmed ownership, established facts and deterministic decision effects.

---

*v1.2 generated 13 October 2026. Complete document; supersedes v1.1. Confidential working specification — IOI is review-only and CONTEXT_ONLY.*
