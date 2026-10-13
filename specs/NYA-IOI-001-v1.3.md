# NYA-IOI-001 / VER-IOI-001 — Inferred Ownership Intelligence Layer

**Operating Design Document and Implementation Specification — v1.3 (Synthesis-Integrated, Reconciled)**

> **Status:** Approved future scope and committed. Sequenced after the cross-document scanning contract is stable enough to emit governed bundle entities and relationships, **and after NYA-INTEL-SYNTH-001 (Deterministic Intelligence Synthesis) has shipped its first slice**. RRI (a Veredis programme) is a downstream consumer of IOI and is not a dependency of it. This is not a deferral or scope removal. v1.3 is a complete document and supersedes v1.2 and v1.1 in full; no reader needs either.

| Field | Value |
|---|---|
| Version | v1.3 — reconciled against the v1.2 architecture review and the corrected placement of RRI |
| Supersedes | v1.2 (13 October 2026); v1.1 (23 July 2026); v1.0 |
| Date | 13 October 2026 |
| Architecture owner | Nyansapo IOI bounded context |
| Synthesis role | **Upstream evidentiary baseline.** IOI consumes the current signed synthesis Assessment for a subject before any of its own acquisition. Synthesis establishes *association* propositions in its first slice; it does not adjudicate ownership or control, and IOI never treats it as if it did. Synthesis never consumes IOI output. |
| RRI role | **Veredis programme.** Consumes AOT, Synthesis and IOI outputs for relationship-risk presentation and EDD. Not a Nyansapo engine; sends no evidence into IOI. |
| Ceres role | Evidence grounding provider only; no inferred-edge ownership |
| Veredis role | Trigger policy, orchestration, consumption, rendering (including RRI) and review submission |
| Decision posture | Review-only; `CONTEXT_ONLY` maximum decision effect; composing IOI with synthesis does not raise the cap |
| Current dependencies | Cross-document scanning (in development); NYA-INTEL-SYNTH-001 first slice (v0.5.0, awaiting founder rulings; accommodations requested in the companion dev-team message v2) |

**Operating phrase:** *AOT proves. Synthesis establishes. IOI infers. Ceres grounds. RRI connects, in Veredis.*

**Three distinctions this document must never blur:** an unestablished relationship is not a disproved relationship; a closed rule precondition is not a disproved real-world relationship; an established association is not established control.

---

## Document contents

1. Executive summary
2. Revision history (v1.0 → v1.1 → v1.2 → v1.3)
3. Current-state grounding
4. Architecture decision and system placement
5. Design doctrine, vocabulary separation and non-goals
6. Responsibility and ownership matrix
7. Source family registry and analytical references
8. Professional-profile and LinkedIn source treatment
9. Source acquisition and lineage contract
10. Synthesis consumption contract
11. Proposition mapping contract (new)
12. Cross-document scanning integration
13. Nyansapo IOI bounded context
14. Ceres evidence-grounding contract
15. Relationship to AOT, Synthesis and RRI
16. Signal taxonomy, confidence and state model
17. Data model
18. Inference, contradiction and temporal lineage pipeline
19. Nyansapo API contracts
20. Veredis consumption and orchestration contract
21. Veredis output contracts and typed templates
22. User review and feedback loop
23. Security, privacy, retention and access controls
24. Auditability, observability and operations
25. Feature flags, sequencing and rollout
26. Acceptance criteria and negative tests
27. Implementation ticket breakdown
28. Founder decisions required for v1.3

- Appendix A. Candidate source inventory
- Appendix B. Payload and output examples
- Appendix C. Architecture decision record

---

## 1. Executive summary

IOI — Inferred Ownership Intelligence — is a future, review-only intelligence engine that identifies *possible* ownership, beneficial-control, proxy, nominee, successor, shadow-director, executive-control and operating-control relationships where confirmed AOT evidence is incomplete, unavailable, opaque or contradicted.

IOI is a first-class bounded context inside Nyansapo, adjacent to AOT, Synthesis and Ceres. It is not implemented inside Ceres, not inside Synthesis, and not as a Veredis inference engine. RRI is a Veredis programme downstream of all four.

Before IOI acquires any source of its own, it consults the current signed synthesis Assessment for the subject. From it IOI learns **which admissible association facts are already established, which propositions synthesis evaluated and left unresolved (and exactly what evidence was missing), and which admissible facts conflict** — and then investigates what remains. Synthesis is an evidentiary baseline and a map of gaps. It is not an arbiter of the ownership and control hypotheses IOI exists to investigate.

> **Core rule:** IOI may identify what deserves investigation. It may not decide what is legally true, write confirmed ownership, alter a synthesis assertion, or alter a deterministic Veredis decision.

### 1.1 Product promise

Where ownership cannot be confirmed by AOT, Veredis can present reviewable inferred ownership/control signals with source lineage, contradiction handling, temporal role history, cross-document context, the synthesis baseline they rest on, and explicit separation from confirmed AOT and from established synthesis associations.

### 1.2 Layer definitions

| Layer | Where | Primary function | Maximum authority |
|---|---|---|---|
| AOT | Nyansapo | Confirmed ownership/control traversal using admitted structured evidence | Deterministic only where governed policy permits |
| Synthesis | Nyansapo | Establishes, from admissible structured facts under governed rules, what is established / unresolved / closed / conflicted for a **question** about a subject. First slice: `Q-ASSOC-1`, four association predicates. Cites AOT outcomes; never computes ownership. | `CONTEXT_ONLY`; deterministic; no probability; no negative assertions |
| IOI | Nyansapo | Possible ownership/control/proxy signals where proof is missing, targeted by synthesis gaps and constrained by directly contradicting admissible evidence | Review-only; `CONTEXT_ONLY` |
| Ceres | Nyansapo | Retrieves grounded legal/context passages and source status | Context provider; no relationship decision authority |
| RRI | **Veredis** | Relationship-risk presentation and EDD over AOT, Synthesis and IOI outputs plus Nyansapo graph-projection contracts | Review, context and EDD; never an evidence source for IOI |

## 2. Revision history

### 2.1 v1.2 → v1.3 (this revision)

| # | v1.2 defect | Finding | v1.3 disposition |
|---|---|---|---|
| V1 | `CLOSED(FALSE)` forced any IOI signal on "the same proposition" to `CONTRADICTED`. | A rule closing (because a precondition was `FALSE`, `INADMISSIBLE_ONLY` or `INVALID`) establishes that *the rule did not establish its target under that binding*. It does not disprove a real-world relationship, and Q-ASSOC-1 targets association, not control. Non-overlapping directorships do not contradict an informal-control allegation. | `SYNTH_CLOSED` redefined (§10.5). Mandatory `CONTRADICTED` requires separately admissible evidence directly contradicting the **same predicate, identities and period** (§18.3). FD-IOI-4 rewritten (§28). |
| V2 | "Synthesis is the only engine that may establish or disprove relationship propositions." | Too broad; AOT holds confirmed-ownership authority; synthesis C2 forbids association→control; the first slice emits no negatives. | Synthesis authority stated per question family (§3.3, §15.2). Step-0 question reframed: *which admissible association facts relevant to this control investigation has synthesis established?* (§10.1). |
| V3 | No typed mapping between synthesis predicates and IOI signal types. | Entity overlap alone could suppress a valid investigation. | New **proposition mapping contract** with four classes: `IDENTICAL`, `SUPPORTING_CONTEXT`, `POTENTIALLY_CONTRADICTORY`, `UNRELATED` (§11). Only `IDENTICAL` suppresses a competing signal. |
| V4 | Assessment registered as source family `SYNTHESIS_ASSESSMENT_SOURCE`, band S1, one evidence item per assertion. | A derived analytical artefact is not an independent observation; the same registry row reached via synthesis and via direct retrieval would double-count. | Assessment is an **analytical reference**, not a source (§7.4, §10.3). References are excluded from independence and corroboration counts; origin clustering ties them to the underlying rows; the fact's own `ADMISSIBLE`/`ADMISSIBLE_ADVISORY` state is preserved. |
| V5 | Supersession detected by re-POSTing `/v1/intel/assess` and comparing `execution_id`. | v0.5 U1 returns the **original** assessment for a repeated request key, by design. Re-POSTing is not a freshness check. | Two operations: *retrieve existing* and *obtain current*; superseding defined as a later execution with a different input-bundle or rule-set digest; identical digest is a refresh, not supersession (§10.7). Dev-message item 5 revised. |
| V6 | `NYA_IOI_SYNTHESIS_REQUIRED=true` yet degraded mode proceeded unconstrained. | An outage must not remove a constraint that already applied. | Two states: `NO_RESULT` vs `STALE_CONSUMED`; previously consumed constraints persist; new synthesis-dependent signals fail closed or sit `PENDING_SYNTHESIS` per policy (§10.8). Flag replaced by `NYA_IOI_SYNTHESIS_POLICY` (§25). |
| V7 | No verification of the consumed artefact. | A trusted input must be authenticated. | IOI verifies signature under the published assessment key, `SERVE` mode in the signature domain, and consumer authorisation before use (§10.2). |
| V8 | `CLOSED` referenced as if it carried an `assertion_key`. | In v0.5 `CLOSED` lives in `rule_status[]` under `binding_id`. | Adapter references `(assessment_id, rule_id, rule_version, binding_id)`; never invents assertion records (§10.5, §17). |
| V9 | §20.2 example called P3 "control evidence." | P3 in rule 001 is the ≥30-day appointment-overlap condition. | All examples use real `(rule_id, rule_version, binding_id, precondition_id)` tuples with their true meaning (§19, §21, Appendix B). |
| V10 | One `confidence_band` field held LOW/MEDIUM/HIGH and CONTRADICTED/STALE/INSUFFICIENT. | Confidence and state are orthogonal; a HIGH signal can be stale. | Split into `confidence_band` and `signal_state` (§16.2, §17.2). |
| V11 | Copy guard banned the token "established" outright. | Rejects the document's own correct sentence "has not been established by Synthesis." | Typed output templates with assertion ownership replace word bans (§5.5, §21.6). |
| V12 | RRI drawn as a Nyansapo sibling sending graph features into IOI. | RRI is a Veredis programme that **consumes** AOT, Synthesis and IOI; Nyansapo's graph projection is substrate. | Four Nyansapo siblings; RRI relocated to Veredis; `RRI → IOI` evidence flow removed; substrate graph-projection contract → IOI retained (§4, §6, §15.3). |

### 2.2 v1.1 → v1.2 (retained)

Synthesis added as upstream input (step 0); `SYNTH_*` labels; `ASSOCIATION_ONLY` → `ASSOCIATION_SIGNAL`; vocabulary separation on the IOI side; `synthesis_basis` on edges; ingest-candidate reverse channel; sequencing after the synthesis first slice. Items V1–V12 above amend that revision.

### 2.3 v1.0 → v1.1 (retained)

IOI placed as an independent Nyansapo bounded context; Ceres returns passages only; Veredis owns orchestration, rendering and review submission; authoritative review history in Nyansapo; cross-document adapter waits for a stable contract.

## 3. Current-state grounding

### 3.1 Nyansapo standing

- **Data substrate:** source acquisition, source lineage, canonical entity resolution, provenance, batch chain, signing keys, audit chain, **graph projection** (`graph_projection_edges`, evidence-backed, decision-effect bounded), medallion/admissibility, AOT.
- **Confirmed traversal:** AOT remains the only confirmed ownership traversal path.
- **Deterministic establishment:** Synthesis is the only engine that may say a **question-scoped association proposition** is established from admissible structured facts. Authority is per approved question family; the first slice's authority is limited to its four predicates.
- **Ceres:** context-only; supplies grounded legal or policy passages.
- **IOI:** new bounded context with its own schema, APIs, guardrails, audit trace and lifecycle.

### 3.2 Veredis standing

- Consumes governed Nyansapo outputs; writes no ownership or relationship truth back.
- Owns scan orchestration and deterministic user-facing outcomes; neither IOI nor Synthesis can alter them.
- **Owns RRI**: relationship-risk presentation, EDD workflow and adverse-context composition over AOT, Synthesis and IOI outputs and Nyansapo graph-projection contracts.
- Web, PDF and structured API/VZP output preserve identical IOI caveats, evidence summaries and synthesis-reference labels.
- Captures user actions and sends them to Nyansapo as review events.

### 3.3 Synthesis standing

Specified at v0.5.0, awaiting founder rulings FD-IS1–16. Relevant outputs: Assessment id and execution header (snapshot, rule-set digest, `as_of`, pinned releases, `mode`); assertions with class (`FACT`, `DERIVED_FACT`, `INFERENCE`, `CONFLICT`, `HYPOTHESIS`, `INDICATOR`, `GAP`, `UNKNOWN`) and `assertion_key`; `rule_status[]` with per-binding terminal statuses (`EMITTED`, `HYPOTHESIS`, `UNRESOLVED`, `CLOSED`, `SUPPRESSED`) keyed by `binding_id`; explain payload per assertion. **Authority:** Q-ASSOC-1 establishes `SHARED_OFFICER_ESTABLISHED`, `REGISTERED_ADDRESS_COLOCATED_IN`, `ASSOCIATION_CLUSTER_SUPPORTED` and surfaces `RELATIONSHIP_EVIDENCE_CONFLICTED`; it cites `OWNERSHIP_PATH_CITED` and `SANCTIONS_LISTING_CITED` from AOT and sanctions without computing them; it emits **no negative assertions**. Accommodations requested from the synthesis programme are in the companion dev-team message (v2) and do not alter synthesis vocabulary.

### 3.4 Cross-document scanning standing

In active development. IOI binds only to the stable governed contract produced after cross-document entity reconciliation and role assignment.

> **Sequencing:** IOI is approved and committed. Its synthesis adapter is sequenced after the synthesis first slice; its cross-document adapter after that contract is stable. IOI core schema, source lineage and evidence contracts may be designed independently. RRI is not on IOI's critical path.

## 4. Architecture decision and system placement

```
GOVERNED SOURCE ACQUISITION AND LINEAGE
  registries | court & insolvency | regulatory | filings | GLEIF | procurement | company web | media/NGO | professional profiles | archives
        │
NYANSAPO — governed intelligence substrate
  shared substrate: source lineage | resolver | golden records | provenance | batch chain | signing keys | audit chain | GRAPH PROJECTION | medallion/admissibility
  ┌────────┐  ┌───────────┐  ┌────────┐  ┌────────┐
  │  AOT   │  │ SYNTHESIS │  │  IOI   │  │ CERES  │
  │ proves │  │establishes│  │ infers │  │grounds │
  └────────┘  └─────┬─────┘  └───▲────┘  └───┬────┘
   path status      │ signed     │           │ passages
   & gaps ──────────┼────────────┤◄──────────┘
                    └─ step 0 ───┘   graph-projection features (substrate) ──►
        │ governed contracts (every output CONTEXT_ONLY except AOT where policy permits)
VEREDIS — consumer, orchestrator, presentation
  document/bundle intake | cross-document scanning | AOT·Synthesis·IOI trigger policy | RRI (relationship risk, EDD) | web/PDF/VZP render | user review submission
```

### 4.1 Why IOI belongs in Nyansapo

- IOI depends on canonical identity, source lineage, evidence hashing, resolver state, graph-projection contracts, time-aware relationship history and signed synthesis Assessments — all substrate assets.
- Confirmed (AOT), established (Synthesis) and inferred (IOI) relationships stay physically and contractually separate while resolving against the same Golden Records; no split-brain graph.
- Authoritative review history, contradiction state and confidence decay must survive across Veredis scans and future consumers.

### 4.2 Why IOI must not live inside Synthesis

Synthesis is deterministic: closed evaluator, no probability class, admissible structured sources only, no generative or ranking models, and a constitutional prohibition on promoting association to control. IOI is banded confidence over S1–S5 sources with extractor and ranker versions in its trace, existing to surface *possible* control where proof is absent. Merging them would either corrupt synthesis's contract or strip IOI of what makes it IOI.

### 4.3 Why IOI must not live inside Ceres

Ceres retrieves and grounds; it does not own probabilistic graph state and must not emit `INFERRED_CONTROLLER = true`.

### 4.4 Why Veredis must not own the engine

Veredis would duplicate identity resolution, lineage, graph persistence and evidence decay, and inference would sit next to deterministic decision rendering. RRI, which Veredis does own, is presentation and workflow over governed outputs, not inference over sources.

## 5. Design doctrine, vocabulary separation and non-goals

### 5.1 Allowed language (IOI outputs)

```
Sources suggest a possible ownership or control relationship between X and Y.
This has not been confirmed through AOT.
Synthesis has established [association predicate] between X and Y; it has not assessed control.
Synthesis did not establish [predicate] under the evaluated binding; this is not a finding against the relationship.
Review required before reliance.
```

### 5.2 Forbidden language (IOI outputs)

```
X owns Y.                    X controls Y.
Hidden owner found.          Beneficial owner confirmed.
Blocked because of IOI.
Synthesis suggests…          (synthesis does not suggest)
Synthesis disproved…         (first slice emits no negatives)
Established by IOI.          IOI inference confirmed.
```

### 5.3 Non-negotiable constraints

| Constraint | Rule |
|---|---|
| AOT isolation | IOI edges never enter confirmed AOT traversal tables or are traversed as confirmed ownership. |
| Synthesis isolation | IOI output never becomes a synthesis fact, precondition, binding or override. IOI has no write grant on `intel_*`. |
| Decision cap | `IOI_MAX_DECISION_EFFECT = CONTEXT_ONLY`. Composition with synthesis (also `CONTEXT_ONLY`) does not raise it. |
| Evidence floor | No signal without at least one admitted evidence item (not a reference) with source family, retrieval time and hash. |
| Synthesis baseline | An `EMITTED` assertion whose proposition maps `IDENTICAL` to an IOI candidate (§11) means IOI emits no competing signal and renders a reference. `SUPPORTING_CONTEXT` strengthens nothing by itself; it is cited. |
| Closed ≠ disproved | `SYNTH_CLOSED` means the rule did not establish its target under the recorded binding. It never, by itself, sets an IOI signal to `CONTRADICTED`. |
| Direct contradiction only | `signal_state = CONTRADICTED` requires separately admissible evidence that directly contradicts the same predicate, identities and relevant period. |
| Constraints persist | A constraint derived from a consumed Assessment is retained when synthesis is later unavailable (§10.8). |
| Contradiction-aware | Material contradictions (including synthesis `CONFLICT`) are retained, scored and shown. |
| User review is not truth | A user confirmation records usefulness or case judgment; it creates neither confirmed ownership nor an established fact. |
| No source laundering | Weak sources do not become primary by aggregation; a synthesis reference is never a corroboration. |
| Temporal honesty | Role and control claims are time-bounded and decay or go stale. Synthesis-derived tenures carry the Assessment's `as_of`, end kinds and `observed_through`. |
| Cross-doc restraint | Bundle co-occurrence triggers investigation; it is not ownership evidence. |

### 5.4 Non-goals

Replacing AOT or lowering its admissibility; re-implementing, extending or relabelling Synthesis; treating Synthesis as an ownership/control adjudicator; turning Ceres into an inference engine; building a generic adverse-media product; treating profiles, media or user confirmations as proof; re-implementing cross-document scanning; owning or re-implementing RRI; hidden decision effects or unreviewable model conclusions.

### 5.5 Vocabulary separation (enforced in IOI only, by typed templates)

Synthesis vocabulary is reserved and unchanged. IOI does not ban English words; it enforces **assertion ownership through typed output templates** (§21.6). Every rendered statement is produced from a template bound to its owner, and the template set is closed.

| Concept | Synthesis term (reserved) | IOI term (v1.3) |
|---|---|---|
| Rule-derived conclusion from admissible facts | `INFERENCE` (class), `EMITTED` (status) | Never produced by IOI. When referenced: `SYNTH_ESTABLISHED` |
| Possible relationship from weighted sources | — | `INFERRED_*` signal types ("inferred" in IOI = possible, banded, review-only) |
| Association without control | `ASSOCIATION_CLUSTER_SUPPORTED` | `ASSOCIATION_SIGNAL` |
| Rule did not establish its target | `CLOSED(reason)` in `rule_status[]` | When referenced: `SYNTH_CLOSED` (not a contradiction) |
| Missing evidence | `HYPOTHESIS` + `INDICATOR`, `UNRESOLVED`, `GAP` | When referenced: `SYNTH_HYPOTHESIS`, `SYNTH_UNRESOLVED`, `SYNTH_GAP`. IOI's own: `INSUFFICIENT` state |
| Contradiction between admissible facts | `CONFLICT` | When referenced: `SYNTH_CONFLICT`. IOI's own: contradiction types §18.3 |
| Evidence unit | fact (`fact_key`), assertion (`assertion_key`), evaluation (`binding_id`) | evidence item (`ioi_evidence_items.id`); analytical reference (`ioi_synthesis_references.id`) |
| Confidence | none | `confidence_band` LOW/MEDIUM/HIGH — never on a reference |
| State | terminal statuses | `signal_state` (§16.2) |
| Admissibility | `ADMISSIBLE / ADMISSIBLE_ADVISORY / INADMISSIBLE_*` | preserved verbatim on references; own sources use S1–S5 + acquisition status |

Template ownership rules: (a) a `SYNTH_*` reference is rendered only by a synthesis-owned template, which may say *established*, *did not establish*, *unresolved*, *conflicted* and never *suggests* or *possible*; (b) an IOI signal is rendered only by an IOI-owned template, which may say *suggests*, *possible*, *may* and never *established* as a claim about the signal; (c) the sentence "has not been established by Synthesis" is a synthesis-owned negation template and is permitted; (d) no IOI signal type name equals a synthesis predicate (CI check against the synthesis predicate manifest).

## 6. Responsibility and ownership matrix

| Capability | Nyansapo IOI | Synthesis | Ceres | Veredis (incl. RRI) |
|---|---|---|---|---|
| Source acquisition and family policy | Owns (IOI families) | Owns (admissible structured families) | Selected legal-source support | No |
| Canonical entity resolution | Consumes shared resolver; owns IOI linkage | Consumes with strict floor | No | Supplies scan/bundle candidates |
| Establishing a question-scoped association proposition | No | **Owns** (per approved question family) | No | No |
| Confirmed ownership/control | No | No (cites AOT) | No | No (consumes AOT) |
| Grounded legal passages | Consumes | Never (C6) | Owns | No |
| Inferred-edge generation | **Owns** | No | No | No |
| Confidence, corroboration, contradiction (banded) | Owns | No | May supply passage status | No |
| Temporal role lineage | Owns | Owns tenure model for its facts | No | No |
| Authoritative IOI graph and review history | Owns | No | No | Submits review events |
| Synthesis Assessment consumption | Consumes (step 0) | Produces | No | May consume directly for its own summary |
| Proposition mapping (synthesis predicate ↔ IOI signal) | **Owns** (§11) | No | No | No |
| Ingest candidates from IOI findings | Files | Receives via governed source admission | No | No |
| Graph-projection features | Consumes (substrate contract) | Consumes | No | Consumes (RRI) |
| Relationship-risk presentation and EDD (RRI) | No | No | No | **Owns** |
| Cross-document reconciliation | Consumes contract | No | No | Owns scan-side feature |
| When to request IOI | Exposes capability | No | No | Owns orchestration policy |
| Web/PDF/API presentation | Projects payload | Projects Assessment | No | Owns |
| Deterministic Veredis decision | No | No | No | Owns; nothing upstream can alter |

## 7. Source family registry and analytical references

Every source connector is registered by family, reliability class, access method, allowed use, retention policy and extraction contract. The family identifies the evidential nature of the record; the source name identifies the specific registry, court, outlet, platform or provider.

### 7.1 Official, legal and primary-source families

| Source family | Examples | IOI use | Default treatment |
|---|---|---|---|
| CORPORATE_REGISTRY_SOURCE | National company registries, officer and beneficial-owner filings | Directors, officers, PSCs, charges, history | High; structured ownership may become AOT candidate; where synthesis already established a proposition from the same release, IOI cites the reference and clusters the row with it (no double count) |
| LEI_RELATIONSHIP_SOURCE | GLEIF Level 2 | Parent, child, entity lineage | High for declared relationships |
| SECURITIES_FILING_SOURCE | Annual reports, major holdings, related-party filings | Ownership, subsidiaries, officers, related parties | High |
| COURT_RECORD_SOURCE | Judgments, pleadings, asset recovery | Alter ego, nominee, shadow control, ownership allegations or findings | High but legal-status aware |
| BANKRUPTCY_INSOLVENCY_SOURCE | Petitions, insolvency reports, administrator statements | Hidden interests, creditor influence, related-party transfers | High if official |
| REGULATORY_ENFORCEMENT_SOURCE | Regulator findings, sanctions notices, asset freezes | Evasion networks, control findings, restricted-party links | High |
| PROCUREMENT_SOURCE | Awards, supplier records | Repeated related-party suppliers, operating networks | Medium/high |
| ASSET_REGISTRY_SOURCE | Land, vessel, aircraft, mining, licence records | Asset control and beneficial-interest indicators | Medium/high |

### 7.2 Open intelligence and contextual families

| Source family | Examples | IOI use | Default treatment |
|---|---|---|---|
| COMPANY_WEB_SOURCE | Leadership, board, founder, team pages | Executive role lineage, self-published roles | Medium/high |
| MEDIA_SOURCE | Investigative media, reputable adverse media, trade press | Control allegations, successor entities, historic lineage | Medium/high if corroborated |
| NGO_REPORT_SOURCE | Anti-corruption, sanctions-evasion, kleptocracy reports | Network and control allegations | Medium/high |
| ARCHIVED_WEB_SOURCE | Historical pages, removed biographies | Role continuity, successor signals | Medium; staleness-aware |
| BUSINESS_DIRECTORY_SOURCE | Industry and chamber directories | Weak role or association evidence | Low/medium |
| PROFESSIONAL_PROFILE_SOURCE | Executive profiles, business-network platforms | Self-asserted roles, founder claims, board history | Medium but capped |
| SEARCH_DISCOVERY_SOURCE | Search results, index metadata | Discovery only | Not evidence |

### 7.3 Reliability bands

| Band | Meaning | Examples | Effect |
|---|---|---|---|
| S1 | Primary official/legal | Registry filing, judgment, regulator decision, issuer filing | Strong IOI support; registry rows may create separately validated AOT candidates |
| S2 | Official self-published | Company site, annual report, official biography | Strong role signal; source-specific caveat |
| S3 | Reputable secondary | Investigative media, trade press, NGO report | Corroborated and contradiction-aware |
| S4 | Self-asserted professional | Professional profile | Confidence-capped; role signal, not ownership proof |
| S5 | Discovery or weak | Search snippet, directory, mirror | Discovery or low confidence only |

### 7.4 Analytical references (not sources)

A **synthesis Assessment is an analytical reference**: a signed, derived conclusion over admissible facts that IOI may rely on within the conclusion's stated scope. It is not a source family, has no reliability band, and is never counted as an independent observation. References live in `ioi_synthesis_references` (§17.4), not in `ioi_evidence_items`. Each reference preserves the underlying facts' own `ADMISSIBLE` / `ADMISSIBLE_ADVISORY` state and, via origin clustering, is tied to the same origin as the registry rows it rests on, so a registry row reached both directly and through synthesis counts once.

## 8. Professional-profile and LinkedIn source treatment

Professional-profile data is valuable for executive role chronology, founder identity, board participation, employment overlap and company affiliation. It is not inherently ownership evidence. IOI treats it as a source family with explicit acquisition lineage and confidence caps.

### 8.1 Source types

```
SELF_ASSERTED_FOUNDER · SELF_ASSERTED_OWNER · SELF_ASSERTED_EXECUTIVE · SELF_ASSERTED_BOARD_MEMBER
SELF_ASSERTED_COMPANY_AFFILIATION · EXECUTIVE_ROLE_LINEAGE · FOUNDER_SUCCESSOR_SIGNAL
```

### 8.2 Access lineage classes

| Access class | Meaning | Treatment |
|---|---|---|
| OFFICIAL_API_APPROVED | Platform API access approved for the use and storage pattern | Ingest only within granted limits |
| LICENSED_PROVIDER | Contract permits downstream data use | Ingest under licence and lineage reference |
| USER_SUPPLIED_EXPORT | Customer or subject supplies an export | Ingest with consent/attestation reference |
| MANUAL_REVIEW_CAPTURE | Analyst records a limited case-level role fact | Case-level evidence only |
| GOVERNED_WEB_ACQUISITION | Collection method approved under source policy | Ingest with method and policy decision recorded |
| SEARCH_DISCOVERY_ONLY | Search result identifies a potential page | Discovery only |
| PROHIBITED_OR_UNAPPROVED | Method lacks approval | Reject or quarantine |

### 8.3 Confidence caps

| Claim | IOI classification | Maximum without corroboration |
|---|---|---|
| CEO / Managing Director / President | SELF_ASSERTED_EXECUTIVE | LOW or ASSOCIATION_SIGNAL |
| Founder / Co-founder | SELF_ASSERTED_FOUNDER | MEDIUM; not proof of current ownership |
| Owner / Principal / Managing Partner | SELF_ASSERTED_OWNER or POSSIBLE_CONTROL | MEDIUM; review-only |
| Board member / Chair | GOVERNANCE_INFLUENCE_SIGNAL | MEDIUM |
| Advisor / Consultant | ASSOCIATION_SIGNAL | LOW |
| Connections, likes, endorsements | Out of scope | Reject |

A self-asserted appointment that synthesis has established from a registry row (an `IDENTICAL` mapping to `SHARED_OFFICER_ESTABLISHED` or to its underlying appointment fact) is recorded as *corroborated by registry via synthesis* and needs no cap; a self-asserted appointment whose period the registry shows as resigned is `CONTRADICTED` by the **registry row** (direct evidence), not by the synthesis status.

## 9. Source acquisition and lineage contract

The acquisition method is part of the evidence chain. An IOI evidence item is invalid if the system cannot state where it came from, how it was accessed, when it was retrieved, what claim was extracted and which versions resolved the entities.

### 9.1 Required lineage fields (evidence items)

```
source_family · source_name · source_record_id · source_url_hash · source_url_redacted
access_method · access_authority_or_policy_ref · source_reliability_band
retrieval_timestamp · publication_date · evidence_hash
claim_text_redacted · language · translated_claim_text_redacted
extraction_method · extractor_version · resolver_version
supports_or_contradicts · allowed_use_classification · retention_expires_at
origin_cluster_id                 # shared with any synthesis reference resting on the same row
```

### 9.2 Acquisition statuses

| Status | Meaning | Pipeline effect |
|---|---|---|
| ADMITTED | Source and method satisfy policy and parsing | Eligible for scoring |
| REVIEW_REQUIRED | Source or method needs review | Quarantined from automated inference |
| DISCOVERY_ONLY | Reference exists; evidence not retrieved | May launch retrieval; no support |
| REJECTED | Unreliable, unverifiable, prohibited or corrupt | Excluded |
| STALE | Expired or superseded | Confidence capped and surfaced |

## 10. Synthesis consumption contract

### 10.1 The step-0 question

Before any source discovery IOI obtains the **current** synthesis Assessment for the subject (§10.7) and asks:

> *Which admissible association facts relevant to this control investigation has synthesis established; which propositions did it evaluate and leave unresolved, and what evidence was missing; and which admissible facts conflict?*

It does **not** ask whether synthesis has established or disproved control. Synthesis's first slice has no authority over that proposition, and IOI must not treat it as if it did. Each later synthesis question family extends step 0 only to the propositions that family is approved to establish.

### 10.2 Verification before use

IOI treats an Assessment as trusted input only after verifying: the signature under the published `assessment_snapshot` public key; `mode = SERVE` in the signature domain and the execution header; that the consumer is authorised for the assessment (object-level ownership); and that `canonical_sha256` matches the body. Failure is `NO_RESULT`, never a silent fallback.

### 10.3 Established facts become analytical references

Each assertion of class `FACT`, `DERIVED_FACT` or `INFERENCE` becomes one `ioi_synthesis_references` row: `(assessment_id, assertion_key, predicate, binding, admissibility_state_of_supports, as_of, canonical_sha256, label = SYNTH_ESTABLISHED)`. References are **not** evidence items: they carry no reliability band, no confidence, are excluded from `source_count`, `corroboration_count` and independence, and share `origin_cluster_id` with the underlying registry rows. IOI may rely on the reference within its predicate's scope. The binding's identifiers (`ch_person_id`, company numbers, release id, tenure end kinds, `observed_through`) are inherited; IOI's resolver does not re-resolve them.

### 10.4 Hypotheses and indicators target acquisition

Each `HYPOTHESIS` with its `INDICATOR`s becomes a reference labelled `SYNTH_HYPOTHESIS` and one **targeted acquisition job** per indicator: `triggered_by {assessment_id, rule_id, rule_version, binding_id, precondition_id, unknown_reason, source_families[], indicator_text}`. The resulting IOI signal, if any, states which indicator it addresses and that synthesis could not establish the proposition because that evidence was absent from admissible structured sources.

### 10.5 Closed evaluations are information, not disproof

A `rule_status[]` entry with status `CLOSED(reason)` is referenced as `(assessment_id, rule_id, rule_version, binding_id, reason)` with label `SYNTH_CLOSED`. No assertion record is invented. Meaning: **the governed rule did not establish its target proposition under the recorded binding and conditions.** Consequences:

- It never sets `signal_state = CONTRADICTED` by itself.
- It is rendered through the synthesis-owned negation template ("Synthesis did not establish *predicate* under the evaluated binding; this is not a finding against the relationship").
- Where the mapping (§11) is `POTENTIALLY_CONTRADICTORY`, IOI inspects the **underlying admissible facts** the rule evaluated (via the explain payload); if one of them directly contradicts the IOI candidate's predicate, identities and period, *that fact* — as an admitted evidence item in its own right — is the contradicting evidence. Example: an IOI candidate asserting P was a director of B in 2021; the registry appointment fact shows P's appointment at B began in 2024. The registry row contradicts; the `CLOSED` status merely pointed to it.

### 10.6 Conflicts and silence

A synthesis `CONFLICT` assertion becomes a `SYNTH_CONFLICT` reference and a source-contradiction entry (§18.3); IOI does not resolve it. `UNRESOLVED`, `GAP` and `UNKNOWN` become `SYNTH_UNRESOLVED` / `SYNTH_GAP` references; IOI proceeds and records that synthesis was silent on the proposition.

### 10.7 Retrieve vs obtain current; supersession

Two distinct operations against synthesis:

| Operation | Behaviour IOI relies on |
|---|---|
| **Retrieve existing** (`GET /v1/intel/assess/{assessment_id}`) | Returns the original signed result without recomputation. Used to re-read a pinned basis. |
| **Obtain current** (`GET /v1/intel/assess/current?subject&question`, or an explicit new-execution request) | Returns the latest eligible `SERVE` assessment for the subject/question at the currently pinned releases, or creates a new evaluation against current admitted inputs. Never satisfied by re-POSTing the original request key, which by design returns the original. |

**Superseding** is defined conservatively until NYA-INTEL-SYNTH-004 (drift) exists: an assessment `B` supersedes consumed `A` iff same subject and question, `B.as_of > A.as_of`, and (`B.input_bundle_sha256 ≠ A.input_bundle_sha256` **or** `B.rule_set_sha256 ≠ A.rule_set_sha256`). A later execution with identical digests is a refresh, not supersession, and does not re-queue signals. IOI records consumption in `ioi_synthesis_consumption` and, on supersession, sets affected signals to `signal_state = SYNTH_SUPERSEDED` and re-evaluates against `B`. IOI never creates new signed assessments merely to discover whether anything changed.

### 10.8 Unavailability — two states, constraints persist

| State | Meaning | IOI behaviour |
|---|---|---|
| `NO_RESULT` | No verified assessment has ever been consumed for this subject (service down, verification failed, subject unresolved) | Per `NYA_IOI_SYNTHESIS_POLICY` (§25): `REQUIRED_FAIL_CLOSED` → no synthesis-dependent signal is emitted; `REQUIRED_PENDING` → signals are created with `signal_state = PENDING_SYNTHESIS` and are not projected; `OPTIONAL` → proceed with `synthesis_status = NO_RESULT` stated in every output. |
| `STALE_CONSUMED` | A verified assessment was consumed earlier but cannot now be refreshed | All references, targets and constraints from the consumed assessment **remain in force**. New signals are evaluated against it with `synthesis_status = STALE_CONSUMED` stated. Nothing is discarded because the service is unreachable. |

IOI never fabricates a synthesis result in either state.

### 10.9 Reverse channel — ingest candidates only

IOI output never becomes a synthesis fact, precondition, binding or override. When IOI admits an evidence item from a **structured** source family synthesis does not yet ingest, it files `ioi_ingest_candidates {candidate_type: POSSIBLE_SYNTHESIS_EVIDENCE, source_family, source_name, evidence_item_id, rationale}` to governed source admission — a request to consider adding a source family. Never a fact; never bypasses synthesis admissibility.

### 10.10 Decision-effect composition

Assessments and IOI signals are both `CONTEXT_ONLY`. Veredis must not compute any combined score from a `SYNTH_ESTABLISHED` reference and an IOI `confidence_band`.

## 11. Proposition mapping contract (new)

Entity overlap is not proposition identity. Before any synthesis reference can suppress, constrain or support an IOI candidate, IOI classifies the relationship between the **synthesis proposition** (predicate + binding + period) and the **IOI candidate** (signal type + identities + period) under a versioned, typed mapping.

### 11.1 Mapping classes

| Class | Definition | Effect on the IOI candidate |
|---|---|---|
| `IDENTICAL` | Same predicate semantics, same identities, overlapping period | `SYNTH_ESTABLISHED` → no competing signal; reference rendered. `SYNTH_CLOSED` → candidate proceeds; closure rendered as "did not establish". |
| `SUPPORTING_CONTEXT` | Synthesis proposition is a necessary or typical component of the IOI candidate, not the candidate itself (e.g. shared officer under a control hypothesis) | Cited in the signal's basis; adds no confidence by itself; never suppresses. |
| `POTENTIALLY_CONTRADICTORY` | A fact the synthesis rule evaluated could, if directly contradicting, bear on the candidate's predicate/identities/period | Underlying admissible fact inspected (§10.5); the **fact**, not the status, may contradict. |
| `UNRELATED` | Different identities, non-overlapping period, or predicate with no bearing | No effect; not cited. |

### 11.2 First-slice mapping table (Q-ASSOC-1 → IOI)

| Synthesis predicate | IOI signal type | Class |
|---|---|---|
| `SHARED_OFFICER_ESTABLISHED(p,A,B)` | `EXECUTIVE_ROLE_LINEAGE(p,A)` / `(p,B)` with overlapping period | `IDENTICAL` |
| `SHARED_OFFICER_ESTABLISHED(p,A,B)` | `INFERRED_CONTROLLER`, `INFERRED_SHADOW_DIRECTOR`, `INFERRED_BENEFICIAL_OWNER` (p over A or B) | `SUPPORTING_CONTEXT` |
| `REGISTERED_ADDRESS_COLOCATED_IN(A,B,R)` | `ASSOCIATION_SIGNAL(A,B)` at `t_R` | `IDENTICAL` |
| `REGISTERED_ADDRESS_COLOCATED_IN(A,B,R)` | any `INFERRED_*` between A and B | `SUPPORTING_CONTEXT` |
| `ASSOCIATION_CLUSTER_SUPPORTED(A,B)` | `ASSOCIATION_SIGNAL(A,B)` | `IDENTICAL` |
| `ASSOCIATION_CLUSTER_SUPPORTED(A,B)` | `INFERRED_PROXY_ENTITY`, `INFERRED_TRADE_PROXY`, `INFERRED_PAYMENT_PROXY` (A↔B) | `SUPPORTING_CONTEXT` |
| `RELATIONSHIP_EVIDENCE_CONFLICTED` | any candidate on the conflicted identities/period | `POTENTIALLY_CONTRADICTORY` |
| `CLOSED` on rule 001/002/004 for (p/A/B) | any `INFERRED_*` on the same identities | `POTENTIALLY_CONTRADICTORY` (inspect facts) — never `IDENTICAL` for a control signal |
| `OWNERSHIP_PATH_CITED` (AOT) | `INFERRED_BENEFICIAL_OWNER`, `INFERRED_CONTROLLER` on the same path | `IDENTICAL` **via AOT**: IOI defers to the confirmed path; no signal |
| anything | candidate with different identities or non-overlapping period | `UNRELATED` |

The table is a governed artefact (`ioi_proposition_mappings`, versioned, digest in each signal's `synthesis_basis`). Adding a synthesis question family requires a new mapping version before IOI may consume it.

## 12. Cross-document scanning integration

### 12.1 Boundary

Cross-document scanning is upstream of IOI for transaction-bundle cases. Veredis reconciles document parties and discrepancies, then sends the governed bundle context to Nyansapo IOI. IOI performs source-backed investigation against the resolved entities; it does not reparse or reconcile the bundle. For bundle-triggered evaluations IOI still performs step 0 for each resolved `golden_id`.

### 12.2 Governed input contract

```
bundle_id · documents[] · reconciled_entities[] · party_role_assignments[] · cross_doc_relationships[]
bundle_discrepancy_findings[] · entity_resolution_candidates[] · source_document_pointers[] · audit_trace_id
```

### 12.3 Trigger patterns

| Cross-doc pattern | IOI investigation question | Allowed result |
|---|---|---|
| Supplier differs from payment beneficiary | Is the payee an affiliate, proxy, nominee or controlled entity? | INFERRED_PAYMENT_PROXY only with external evidence |
| Shipper differs from seller | Is the shipper in the same operating/control network? | INFERRED_TRADE_PROXY or ASSOCIATION_SIGNAL |
| Consignee differs from buyer | Related party or hidden intermediary? | POSSIBLE_CONTROL or ASSOCIATION_SIGNAL |
| Repeated unknown intermediary | Recurring facilitator or front? | INFERRED_PROXY_ENTITY if corroborated |
| Executive name in certificate or declaration | Linked to one or more bundle entities? | EXECUTIVE_ROLE_LINEAGE (or `IDENTICAL` reference to a synthesis-established appointment) |
| Shared bank, address or contact details | Common control or service-provider overlap? | ASSOCIATION_SIGNAL unless corroborated; cite `REGISTERED_ADDRESS_COLOCATED_IN` if established |

> **Hard gate:** Transaction-bundle co-occurrence is not ownership evidence. A cross-document finding may trigger IOI retrieval; an inferred edge requires independent admitted evidence.

## 13. Nyansapo IOI bounded context

### 13.1 Component layout

```
nyansapo/ioi/
  source_registry/        # family definitions, reliability and policy
  synthesis_adapter/      # obtain-current, verify, reference mapping, supersession, policy states
  proposition_mapping/    # §11 classes and versioned mapping table
  acquisition/            # governed adapters; indicator-targeted jobs
  evidence/               # evidence items, origin clustering, provenance
  resolution/             # Golden Record and person/entity linking (inherits synthesis bindings)
  candidate_generation/   # possible relationship candidates (excludes IDENTICAL-established propositions)
  temporal_lineage/       # role history, start/end, succession
  scoring/                # confidence bands over evidence items only (references excluded)
  contradiction/          # direct-contradiction evaluation, supersession, decay
  graph/                  # isolated inferred edges
  review/                 # review events and pattern feedback
  projections/            # Veredis-safe response contracts (consumed by RRI among others)
  api/                    # entity, bundle, review, admin, ingest-candidate endpoints
  audit/                  # immutable trace payloads
  guards/                 # AOT isolation, synthesis isolation, decision cap, template ownership
```

### 13.2 Logical flow

```
golden_id or governed bundle context
  -> STEP 0: obtain current Assessment; verify; map propositions (§10, §11)
  -> source discovery and source-policy validation (indicator-targeted first)
  -> governed acquisition
  -> evidence extraction, legal-status annotation, origin clustering
  -> entity/person resolution (synthesis bindings inherited)
  -> relationship candidate generation (skip IDENTICAL-established)
  -> temporal alignment
  -> corroboration (evidence items only) and direct-contradiction evaluation
  -> confidence banding and signal state
  -> isolated IOI edge and audit trace (synthesis_basis, mapping version)
  -> ingest-candidate filing where applicable
  -> Veredis-safe projection (typed templates)
```

### 13.3 Persistence boundary

IOI owns inferred edges, evidence items, references and links in isolated tables. IOI never writes to confirmed ownership tables or `intel_*` tables. IOI references Golden IDs and synthesis identifiers; it creates no second identity universe. Bundle-only unresolved entities may be referenced temporarily. Authoritative review events are stored in Nyansapo and projected to Veredis.

## 14. Ceres evidence-grounding contract

Ceres is a provider to IOI, not the owner of IOI conclusions. It retrieves legal, regulatory, policy or court passages and returns provenance, passage location, source status and legal posture.

**Ceres may return:** `{document_id, source_family, passages[{text_redacted, source_location, legal_status: ALLEGATION|FINDING|JUDGMENT|GUIDANCE, entities[], supports_or_contradicts: UNASSESSED}]}`.

**Ceres must not return:** `INFERRED_CONTROLLER = true`, `CONFIRMED_OWNER = true`, `DECISION_EFFECT = BLOCK`, `PROMOTE_TO_AOT = true`, `SYNTH_ESTABLISHED = true`.

**IOI use:** resolves named entities against canonical records; determines support/contradiction/mention; combines with non-Ceres families; preserves source location and legal status. A Ceres passage is never a synthesis fact and never relabelled `SYNTH_*`.

## 15. Relationship to AOT, Synthesis and RRI

### 15.1 AOT boundary

AOT remains the confirmed ownership traversal engine. IOI may create a separately typed investigation candidate (`POSSIBLE_AOT_EVIDENCE`, status `NEEDS_STRUCTURED_VALIDATION`, `allowed_decision_effect: NONE`) — a work item, never a promoted edge. Where an `OWNERSHIP_PATH_CITED` reference covers an IOI candidate (`IDENTICAL` via AOT), IOI defers and emits no signal.

### 15.2 Synthesis boundary

| Direction | Allowed data flow |
|---|---|
| SYNTH → IOI | Current signed Assessment: established association facts (references), hypotheses + indicators (targets), closed evaluations (information, by `binding_id`), conflicts (contradiction entries), unresolved/gap (silence), explain payloads. |
| IOI → SYNTH | **Ingest candidates only**, via governed source admission. Never facts, preconditions, bindings or overrides. |
| Authority | Synthesis establishes only the propositions its approved question families cover. For Q-ASSOC-1 that is association. IOI never asks it about control. |

### 15.3 RRI boundary (Veredis)

RRI is a Veredis programme. It **consumes** AOT outcomes, synthesis Assessments, IOI projections and Nyansapo graph-projection contracts to present relationship risk, compose adverse context and run EDD workflow. It sends **no evidence** into IOI.

| Direction | Allowed data flow |
|---|---|
| Nyansapo graph projection → IOI | Substrate features (shared addresses, officers, enforcement associations) under the graph contract — these are substrate, not RRI |
| IOI → RRI (via Veredis projection) | Typed review-only inferred edges, states, synthesis references, caveats |
| Synthesis → RRI | Assessments (Veredis consumes directly) |
| RRI → IOI | **Trigger and context pointers only**, through the Veredis trigger policy (§20.2) — never evidence items, never confidence |
| RRI → AOT / Synthesis | Nothing |

## 16. Signal taxonomy, confidence and state model

### 16.1 Signal types

```
INFERRED_BENEFICIAL_OWNER · INFERRED_CONTROLLER · INFERRED_NOMINEE_OWNER · INFERRED_PROXY_ENTITY
INFERRED_FAMILY_CONTROL · INFERRED_SHADOW_DIRECTOR · INFERRED_FINANCIER_CONTROL · INFERRED_ASSET_CONTROL
INFERRED_SUCCESSOR_ENTITY · INFERRED_EXECUTIVE_CONTROL · INFERRED_TRADE_PROXY · INFERRED_PAYMENT_PROXY
EXECUTIVE_ROLE_LINEAGE · ASSOCIATION_SIGNAL
```

CI check: no signal type equals any synthesis predicate (read from the synthesis predicate manifest).

### 16.2 Confidence band and signal state (two fields)

| `confidence_band` | Meaning |
|---|---|
| LOW | Weak, single-source or limited-corroboration |
| MEDIUM | Credible with some independent corroboration |
| HIGH | Strong multi-source, still unconfirmed by AOT |

| `signal_state` | Meaning | Rendering rule |
|---|---|---|
| ACTIVE | Evaluated; no blocking condition | Render with band, basis, caveat |
| CONTRADICTED | Directly contradicting admissible evidence on the same predicate/identities/period (§18.3) | Contradiction first; cap reliance |
| STALE | Evidence outdated or superseded | Label; reduce reliance |
| INSUFFICIENT | Mention exists; does not support inference | No active edge |
| PENDING_SYNTHESIS | Awaiting step 0 under `REQUIRED_PENDING` policy | Not projected |
| SYNTH_SUPERSEDED | Consumed assessment superseded (§10.7) | Not projected until re-evaluated |

A signal always has one band and one state. References never carry either.

### 16.3 Evidence dimensions

source_reliability · independence (origin clustering; references excluded) · entity_resolution_confidence (inherited for synthesis bindings) · relationship_extraction_confidence · legal_status · recency and temporal fit · corroboration and direct contradiction · source-access status · synthesis basis and mapping class · review history.

## 17. Data model

### 17.1 Core tables

| Table | Purpose |
|---|---|
| ioi_inferred_edges | Authoritative isolated inferred edge (band, state, synthesis_basis) |
| ioi_evidence_items | Admitted source evidence with lineage, legal status, origin cluster |
| ioi_edge_evidence_links | Many-to-many with support/contradiction role and weight |
| **ioi_synthesis_references** | Analytical references to synthesis assertions and closed evaluations; never evidence |
| **ioi_edge_reference_links** | Signal ↔ reference with mapping class |
| **ioi_proposition_mappings** | Versioned §11 mapping table |
| ioi_temporal_roles | Role history, start/end, source support |
| ioi_review_events | Immutable review actions |
| ioi_pattern_feedback | Aggregate feedback for ranking/suppression |
| ioi_bundle_context_links | Signal ↔ cross-document trigger and pointers |
| ioi_aot_candidates | Work queue for structured AOT validation |
| ioi_synthesis_consumption | Step-0 consumption: subject, question, assessment_id, execution_id, snapshot_id, input_bundle_sha256, rule_set_sha256, as_of, verified_at, superseded_by |
| ioi_acquisition_jobs | Work items incl. `triggered_by` for indicator-targeted jobs |
| ioi_ingest_candidates | `POSSIBLE_SYNTHESIS_EVIDENCE` requests |

### 17.2 ioi_inferred_edges

```
id UUID PK · from_golden_id · to_golden_id · from_bundle_entity_id · to_bundle_entity_id
inferred_relationship_type TEXT NOT NULL
confidence_band TEXT NOT NULL CHECK (confidence_band IN ('LOW','MEDIUM','HIGH'))
signal_state TEXT NOT NULL CHECK (signal_state IN ('ACTIVE','CONTRADICTED','STALE','INSUFFICIENT','PENDING_SYNTHESIS','SYNTH_SUPERSEDED'))
internal_score NUMERIC · decision_effect TEXT NOT NULL DEFAULT 'CONTEXT_ONLY' CHECK (decision_effect='CONTEXT_ONLY')
source_count INT · corroboration_count INT · contradiction_count INT      -- evidence items only
earliest_evidence_date · latest_evidence_date · effective_from · effective_to
review_status TEXT NOT NULL DEFAULT 'PENDING'
synthesis_basis JSONB NULL   -- {assessment_id, execution_id, snapshot_id, input_bundle_sha256, rule_set_sha256, as_of,
                             --  mapping_version, addresses_indicator: {rule_id, rule_version, binding_id, precondition_id}|null}
synthesis_status TEXT NOT NULL CHECK (synthesis_status IN ('CONSUMED','STALE_CONSUMED','NO_RESULT'))
created_at · updated_at
```

### 17.3 ioi_evidence_items

As §9.1 plus `origin_cluster_id`, `legal_status`, `excerpt_redacted`, `translated_excerpt_redacted`. No `synth_label`; no `confidence_band`.

### 17.4 ioi_synthesis_references

```
id UUID PK
assessment_id TEXT NOT NULL · execution_id TEXT NOT NULL · as_of TIMESTAMP NOT NULL · canonical_sha256 TEXT NOT NULL
kind TEXT NOT NULL CHECK (kind IN ('ASSERTION','EVALUATION'))
assertion_key TEXT NULL           -- kind = ASSERTION
rule_id TEXT NULL · rule_version INT NULL · binding_id TEXT NULL · reason TEXT NULL   -- kind = EVALUATION
label TEXT NOT NULL CHECK (label IN ('SYNTH_ESTABLISHED','SYNTH_HYPOTHESIS','SYNTH_UNRESOLVED','SYNTH_GAP','SYNTH_CLOSED','SYNTH_CONFLICT'))
predicate TEXT NULL · binding JSONB NULL
supports_admissibility TEXT NULL  -- ADMISSIBLE | ADMISSIBLE_ADVISORY, preserved from the assessment
origin_cluster_ids JSONB NULL     -- clusters of the underlying rows
CHECK ((kind='ASSERTION' AND assertion_key IS NOT NULL) OR (kind='EVALUATION' AND binding_id IS NOT NULL))
```

### 17.5 Review actions

```
CONFIRM_SIGNAL_USEFUL · DENY_SIGNAL · MARK_ASSOCIATION_SIGNAL · REQUEST_MORE_EVIDENCE
ESCALATE_TO_EDD · ATTACH_SUPPORTING_EVIDENCE · SUPPRESS_SIMILAR_SIGNAL
```

## 18. Inference, contradiction and temporal lineage pipeline

### 18.1 Candidate generation

Generate candidates only after entity resolution reaches threshold or the binding is inherited; use typed patterns (role history, formal/claimed ownership, nominee language, de facto control, related-party finance, asset control, proxy operation); keep association candidates separate from ownership/control; skip candidates whose proposition is `IDENTICAL` to a `SYNTH_ESTABLISHED` reference; prefer candidates that address a `SYNTH_HYPOTHESIS` indicator.

### 18.2 Corroboration independence

Syndicated or copied claims are one origin. Origin clustering retains citation ancestry. A synthesis reference is never a corroboration; the rows it rests on share its origin cluster, so a row reached directly and via synthesis counts once.

### 18.3 Contradiction handling

| Contradiction type | Example | Effect |
|---|---|---|
| **Direct admissible contradiction** | Registry appointment at B begins 2024; candidate asserts P directed B in 2021 | `signal_state = CONTRADICTED`; contradicting evidence item listed first |
| Synthesis conflict | `RELATIONSHIP_EVIDENCE_CONFLICTED` on the identities/period | `SYNTH_CONFLICT` surfaced; IOI does not resolve |
| Synthesis closure | `CLOSED` on rule 001 for (p,A,B) | **Not a contradiction.** Rendered as "did not establish"; underlying facts inspected under `POTENTIALLY_CONTRADICTORY` |
| Identity contradiction | Two similar-name people conflated | Reject or cap until resolved |
| Temporal contradiction | Profile role ended before alleged control period | Cap or mark STALE |
| Source contradiction | Registry/company filing denies or supersedes media claim | CONTRADICTED; surface both |
| Legal-status contradiction | Allegation later dismissed | Update status; retain history |
| Relationship contradiction | Evidence supports employment only | Downgrade to ASSOCIATION_SIGNAL |

### 18.4 Temporal lineage

All role and control signals are time-bounded where dates exist. Old evidence must not imply present control. Synthesis-derived tenures carry `RESIGNED`/`CENSORED` end kinds and per-item `observed_through`; IOI does not re-derive them.

## 19. Nyansapo API contracts

### 19.1 Entity-level signals — `GET /v1/entities/{golden_id}/ioi-signals`

```json
{
  "entity_id": "golden_123",
  "module": "IOI",
  "decision_effect": "CONTEXT_ONLY",
  "confirmed_ownership": false,
  "synthesis_basis": {
    "assessment_id": "asm-2026-1013-000042", "execution_id": "…", "as_of": "2026-10-13T09:00Z",
    "mapping_version": 1, "synthesis_status": "CONSUMED"
  },
  "synthesis_references": [
    {"kind": "ASSERTION", "assertion_key": "ak_7f3…", "label": "SYNTH_ESTABLISHED",
     "predicate": "SHARED_OFFICER_ESTABLISHED",
     "binding": {"ch_person_id": "ch_p_9a1…", "company_a": "12345678", "company_b": "87654321", "overlap_days": 412},
     "mapping_class": "SUPPORTING_CONTEXT"},
    {"kind": "EVALUATION", "rule_id": "NYA-INT-ASSOC-002", "rule_version": 1, "binding_id": "b_4c2…",
     "label": "SYNTH_CLOSED", "reason": "INADMISSIBLE_ONLY", "mapping_class": "POTENTIALLY_CONTRADICTORY"}
  ],
  "signals": [
    {
      "signal_id": "ioi_sig_001",
      "relationship_type": "INFERRED_CONTROLLER",
      "from": {"golden_id": "person_456", "display_name": "Person A"},
      "to": {"golden_id": "company_123", "display_name": "Company B"},
      "confidence_band": "MEDIUM",
      "signal_state": "ACTIVE",
      "review_status": "PENDING",
      "source_basis": ["COURT_RECORD_SOURCE", "COMPANY_WEB_SOURCE", "MEDIA_SOURCE"],
      "corroboration_count": 2, "contradiction_count": 0,
      "addresses_indicator": {"rule_id": "NYA-INT-ASSOC-001", "rule_version": 1, "binding_id": "b_1e9…",
                              "precondition_id": "P3", "indicator_text": "appointment dates establishing >=30-day overlap"},
      "summary_template": "IOI_POSSIBLE_CONTROL_WITH_SYNTH_ASSOCIATION",
      "required_copy": "Review-only. Does not establish confirmed ownership."
    }
  ]
}
```

### 19.2 Transaction-bundle evaluation — `POST /v1/ioi/transaction-bundles/evaluate`
Governed cross-document contract only; IOI performs step 0 per resolved `golden_id`.

### 19.3 Review event — `POST /v1/ioi/signals/{signal_id}/reviews`
`{action, reason, veredis_scan_id, reviewer_tenant_id}`.

### 19.4 Admin trace — `GET /admin/v1/ioi/signals/{signal_id}/trace`
Includes consumed assessment, verification result, references with mapping classes, indicator addressed, synthesis explain links.

### 19.5 Ingest candidate (internal) — `POST /admin/v1/ioi/ingest-candidates`

## 20. Veredis consumption and orchestration contract

### 20.1 Veredis owns the experience, not the inference

Determine whether scan policy requires an IOI request; supply resolved entity IDs and governed cross-document context; render the IOI projection without changing semantics; render synthesis references through synthesis-owned templates, visually and textually distinct from IOI signals; expose evidence, contradictions, the indicator addressed, and mandatory caveats; capture user actions and submit them; preserve deterministic decision independence. RRI composes these outputs for relationship-risk presentation and EDD; it does not add evidence to IOI.

### 20.2 Trigger policy

| Trigger | Request IOI? |
|---|---|
| AOT returns a complete confirmed path | Optional context only |
| AOT returns no path or incomplete upstream ownership | Yes |
| Synthesis returns `HYPOTHESIS`/`UNRESOLVED` on a material association | Yes (indicator-targeted) |
| Synthesis returns `EMITTED` on an `IDENTICAL` proposition | Optional; IOI references, does not compete |
| Cross-doc supplier/payee or seller/shipper mismatch | Yes when policy threshold met |
| Repeated unknown intermediary | Yes |
| RRI (Veredis) flags a material control-adjacent relationship | Yes — trigger with context pointers, no evidence |
| Controlled-goods or sanctions context | Yes, context-only |
| No gap and no trigger | No or tenant-policy controlled |

### 20.3 Consumption flow

```
Veredis intake -> cross-document reconciliation -> entity resolution (Nyansapo) -> AOT request
  -> (Synthesis request, if Veredis consumes it directly) -> trigger policy (incl. RRI triggers)
  -> Nyansapo IOI evaluation (own step 0) -> Veredis render (RRI composition, Web/PDF/API)
  -> user review action -> Nyansapo IOI review event
```

## 21. Veredis output contracts and typed templates

### 21.1 Dashboard
Separate **Established by Synthesis** block (synthesis-owned templates) above a review-only **IOI** section; blocks never merged; cross-document triggers; review controls; mandatory disclaimer; RRI may embed both blocks unchanged.

### 21.2 Entity result — text contract (real tuples)

```
ESTABLISHED BY SYNTHESIS (asm-2026-1013-000042, as of 2026-10-13)
  SHARED_OFFICER_ESTABLISHED: Person A — Company A / Company B (appointments overlap 412 days)
  Synthesis did not establish REGISTERED_ADDRESS_COLOCATED_IN under the evaluated binding
  (rule NYA-INT-ASSOC-002 v1, binding b_4c2…, reason INADMISSIBLE_ONLY). This is not a finding against the relationship.

IOI — Inferred Ownership Signals                              REVIEW-ONLY

Possible control signal · Person A -> Company B
Confidence: Medium · State: Active
Addresses synthesis indicator: NYA-INT-ASSOC-001 v1 / b_1e9… / P3 — appointment dates establishing >=30-day overlap
Evidence: Court record, company website, investigative media · Contradictions: 0
Status: Pending review

Sources suggest Person A may exercise informal control or influence over Company B.
This has not been confirmed through AOT. Synthesis has established a shared-officer association; it has not assessed control.

[Confirm useful signal] [Deny] [Association signal] [Request more evidence] [Escalate to EDD]
```

### 21.3 Cross-document result — text contract

```
Cross-document trigger: Supplier differs from payment beneficiary · Supplier A <-> Payee C
Synthesis: REGISTERED_ADDRESS_COLOCATED_IN unresolved (Payee C absent from release R)
IOI signal: Possible payment proxy relationship · Confidence: Low · State: Active
Source basis: Company website and historical media · Decision effect: CONTEXT_ONLY
Transaction-bundle co-occurrence is not ownership evidence. This signal requires user review.
```

### 21.4 PDF dossier block
Same structure and labels as 21.2 with the synthesis block first; "Established facts from Nyansapo Synthesis are listed separately and are not IOI signals."

### 21.5 Structured output

```json
{
  "synthesis": {"assessment_id": "asm-2026-1013-000042", "established": ["ak_7f3…"], "closed_evaluations": [{"rule_id":"NYA-INT-ASSOC-002","rule_version":1,"binding_id":"b_4c2…","reason":"INADMISSIBLE_ONLY"}], "decision_effect": "CONTEXT_ONLY"},
  "ioi": {"status": "SIGNALS_FOUND", "decision_effect": "CONTEXT_ONLY", "confirmed_ownership": false, "established_by_synthesis": false, "review_required": true, "signals": ["ioi_sig_001"]}
}
```

### 21.6 Typed template guard

A closed template set with an owner per template (`SYNTH_*` templates: established / did-not-establish / unresolved / conflicted; `IOI_*` templates: possible-control, possible-association, addresses-indicator, contradicted, stale, insufficient, pending, superseded; `VER_*` templates: disclaimer, availability). Rendering accepts only template ids plus typed slots; free text is rejected. Web, PDF and structured outputs use the same template set (parity test §26.3). No combined score field exists in any template.

## 22. User review and feedback loop

Review improves usefulness, ranking and suppression. It does not convert a signal into confirmed ownership, does not create or alter a synthesis fact, and does not permit decision effects. Actions as §17.5 with the state effects of v1.2 §21 (`MARK_ASSOCIATION_SIGNAL` downgrades class; `ESCALATE_TO_EDD` is RRI/case workflow only).

> **Hard distinction:** A user-confirmed IOI signal is neither AOT-confirmed ownership nor a synthesis-established fact.

## 23. Security, privacy, retention and access controls

Data minimisation as v1.2 §22.1; synthesis assessments stored by reference (`assessment_id`, keys, `canonical_sha256`), never copied in full. Access: service roles separate ingestion, IOI read, IOI review, admin trace, synthesis consumption (`INTEL_READ`, internal-service audience); IOI holds the synthesis public verification key, never the signing key; no write grant on `intel_*` (zero-grant CI). Retention and decay as v1.2 §22.3; `SYNTH_SUPERSEDED` triggers re-evaluation; `STALE_CONSUMED` never discards constraints.

## 24. Auditability, observability and operations

### 24.1 Audit trace

```json
{
  "module": "IOI", "signal_id": "ioi_sig_001", "decision_effect": "CONTEXT_ONLY",
  "confirmed_ownership": false, "established_by_synthesis": false,
  "synthesis_basis": {"assessment_id": "asm-…", "execution_id": "…", "verified": true, "mode": "SERVE", "synthesis_status": "CONSUMED", "mapping_version": 1},
  "references": {"established": 1, "hypothesis": 1, "closed": 1, "conflict": 0, "mapping_classes": {"SUPPORTING_CONTEXT": 1, "POTENTIALLY_CONTRADICTORY": 1}},
  "sources_evaluated": 12, "sources_admitted": 4,
  "model_versions": {"extractor": "ioi-rel-v1", "resolver": "resolver-current", "ranker": "ioi-ranker-v1"},
  "guards": {"aot_write_blocked": true, "synth_write_blocked": true, "decision_cap_enforced": true, "template_ownership_enforced": true, "references_excluded_from_corroboration": true}
}
```

### 24.2 Operational metrics

ioi_candidates_generated_total · ioi_signals_admitted_total · ioi_signals_by_state_total · ioi_signals_directly_contradicted_total · ioi_signals_addressing_indicator_total · ioi_identical_suppressions_total · ioi_synth_no_result_total · ioi_synth_stale_consumed_total · ioi_synth_verification_fail_total · ioi_synth_superseded_total · ioi_ingest_candidates_filed_total · ioi_entity_resolution_reject_total · ioi_source_policy_quarantine_total · ioi_review_outcomes_total · ioi_aot_write_attempt_block_total · ioi_synth_write_attempt_block_total · ioi_decision_cap_violation_total · ioi_template_guard_fail_total · ioi_projection_parity_fail_total

### 24.3 Failure posture

IOI unavailable: Veredis continues and states it; no fabrication. Synthesis `NO_RESULT` / `STALE_CONSUMED`: §10.8. Ceres unavailable: legal-source-dependent signals incomplete. Cross-doc contract unavailable: bundle-triggered IOI not called. Guard failure: fail closed and alert.

## 25. Feature flags, sequencing and rollout

### 25.1 Nyansapo flags

```
NYA_IOI_ENABLED=false
NYA_IOI_SYNTHESIS_CONSUMPTION_ENABLED=false
NYA_IOI_SYNTHESIS_POLICY=REQUIRED_FAIL_CLOSED      # REQUIRED_FAIL_CLOSED | REQUIRED_PENDING | OPTIONAL (§10.8)
NYA_IOI_PROPOSITION_MAPPING_VERSION=1
NYA_IOI_SOURCE_ACQUISITION_ENABLED=false
NYA_IOI_CERES_GROUNDING_ENABLED=false
NYA_IOI_GRAPH_PROJECTION_INPUT_ENABLED=false
NYA_IOI_ENTITY_SIGNALS_ENABLED=false
NYA_IOI_TRANSACTION_BUNDLE_ENABLED=false
NYA_IOI_PROFESSIONAL_PROFILE_SOURCE_ENABLED=false
NYA_IOI_REVIEW_LOOP_ENABLED=false
NYA_IOI_INGEST_CANDIDATES_ENABLED=false
NYA_IOI_PUBLIC_API_ENABLED=false
NYA_IOI_MAX_DECISION_EFFECT=CONTEXT_ONLY
```

### 25.2 Veredis flags

```
VER_IOI_CONSUMPTION_ENABLED=false · VER_IOI_TRIGGER_POLICY_ENABLED=false · VER_IOI_WEB_RENDER_ENABLED=false
VER_IOI_PDF_RENDER_ENABLED=false · VER_IOI_STRUCTURED_OUTPUT_ENABLED=false · VER_IOI_REVIEW_ACTIONS_ENABLED=false
VER_IOI_CROSS_DOC_BUNDLE_ENABLED=false · VER_IOI_SYNTH_REFERENCE_RENDER_ENABLED=false · VER_RRI_IOI_COMPOSITION_ENABLED=false
```

### 25.3 Sequencing

| Phase | Scope | Dependency/status |
|---|---|---|
| 0 — Boundary and contract seal | Architecture, template ownership, mapping contract, source registry, schemas, API contracts | Approved future scope; design may proceed |
| 1 — Nyansapo core | Isolated schema, guards, evidence lineage, origin clustering, admin trace | After current higher-severity committed work |
| 2 — Synthesis adapter | Obtain-current, verification, references, mapping, supersession, policy states | **After NYA-INTEL-SYNTH-001 first slice accepted and dev-message v2 items landed** |
| 3 — Source prototype | Court, insolvency, registry, company web, media adapters; indicator-targeted jobs | Source-specific approval |
| 4 — Ceres adapter | Grounded passages | Ceres contract stable |
| 5 — Graph-projection adapter | Substrate features under graph contract | Graph contract stable |
| 6 — Cross-doc adapter | Governed bundle entities and triggers | Cross-doc contract stable |
| 7 — Ingest-candidate channel | Reverse channel | Source admission process ready |
| 8 — Veredis internal UAT | Rendering, RRI composition, review loop | APIs and template guard sealed |
| 9 — External UAT | Selected users | Internal UAT accepted |
| 10 — Controlled release | Specific tenants under flags | Governance approval |

## 26. Acceptance criteria and negative tests

### 26.1 Architecture acceptance

| Test | Expected result |
|---|---|
| IOI placement | Independent Nyansapo context; not under Ceres, Synthesis or Veredis |
| RRI placement | Veredis programme; no evidence path RRI → IOI exists in code |
| Ceres response | Passages and status only |
| Veredis role | Requests, renders, submits review; no edge generation |
| AOT write attempt / `intel_*` write attempt | Blocked and audited |
| Decision above CONTEXT_ONLY | Blocked and audited |
| Signal type equals synthesis predicate | CI fails |
| Unverified or non-SERVE assessment | Rejected; `NO_RESULT` |

### 26.2 Evidence and inference tests

| Scenario | Expected result |
|---|---|
| Synthesis `EMITTED` `SHARED_OFFICER_ESTABLISHED(p,A,B)`; IOI candidate `EXECUTIVE_ROLE_LINEAGE(p,B)` same period | `IDENTICAL`; no IOI signal; reference rendered |
| Same `EMITTED`; IOI candidate `INFERRED_CONTROLLER(p,B)` with court + media | `SUPPORTING_CONTEXT`; signal emitted; reference cited; corroboration_count unchanged by the reference |
| Rule 001 `CLOSED(FALSE)` because P's tenures at A (2020) and B (2024) do not overlap; IOI has evidence of P's informal control over B in 2025 | Signal emitted `ACTIVE`; `SYNTH_CLOSED` rendered as "did not establish"; **not** CONTRADICTED |
| Same closure; IOI candidate asserts P directed B in 2021 | Registry appointment fact (2024 start) is direct contradicting evidence → `CONTRADICTED`; contradicting item is the registry row, not the status |
| Rule 001 `CLOSED(INADMISSIBLE_ONLY)` | Rendered as "did not establish (inadmissible evidence only)"; no effect on IOI state |
| Registry row reached directly and via synthesis reference | One origin cluster; counted once |
| One Assessment citing six facts | Six references; zero corroborations |
| Re-POST of original request key | Original returned; IOI does not treat as freshness check |
| New execution, identical digests | Refresh; no `SYNTH_SUPERSEDED` |
| New execution, different bundle digest | `SYNTH_SUPERSEDED`; re-evaluation queued |
| Synthesis unreachable after prior consumption | `STALE_CONSUMED`; constraints retained |
| Synthesis unreachable, never consumed, policy `REQUIRED_FAIL_CLOSED` | No synthesis-dependent signal |
| HIGH-band signal with superseded evidence | `confidence_band = HIGH`, `signal_state = STALE` |
| Single weak blog claims X owns Y | LOW or INSUFFICIENT |
| Professional profile says owner | Self-asserted; capped; review-only |
| Ten syndicated articles | One origin |
| Same address only | ASSOCIATION_SIGNAL unless corroborated; `IDENTICAL` reference if synthesis established co-location |
| Cross-doc mismatch only | Trigger; no edge without external evidence |
| User confirms signal | Remains IOI |

### 26.3 Veredis output tests

| Test | Expected |
|---|---|
| Web / PDF / structured | Same template ids, slots, references, bands, states, caveats |
| Synthesis block vs IOI section | Separate; never merged; RRI composition preserves both |
| Free text or wrong-owner template | Template guard rejects |
| "has not been established by Synthesis" | Accepted (synthesis-owned negation template) |
| Combined score | Absent; parity test asserts |
| Unavailability | Availability state shown; nothing fabricated |

## 27. Implementation ticket breakdown

### 27.1 Nyansapo

```
NYA-IOI-001            Bounded-context architecture and ADR (v1.3)
NYA-IOI-VOCAB-001      Template ownership, SYNTH_* labels, ASSOCIATION_SIGNAL rename, predicate-collision CI
NYA-IOI-MAP-001        Proposition mapping contract and versioned table (§11)
NYA-IOI-SCHEMA-001     Isolated schema incl. references, reference links, mapping, consumption, jobs, ingest candidates; band/state split
NYA-IOI-GUARDS-001     AOT isolation, synthesis isolation, decision cap, template guard, references-excluded-from-corroboration
NYA-IOI-SYNTH-001      Synthesis adapter: obtain-current, verification, references, closed-evaluation refs, supersession, policy states
NYA-IOI-SOURCE-REG-001 Source family registry and admission policy
NYA-IOI-ACQ-001        Governed acquisition; indicator-targeted jobs
NYA-IOI-EVIDENCE-001   Evidence lineage and origin clustering (incl. synthesis-underlying rows)
NYA-IOI-RESOLVE-001    Entity linkage; inherited synthesis bindings
NYA-IOI-TEMPORAL-001   Role/control timeline; synthesis tenure passthrough
NYA-IOI-EXTRACT-001    Relationship extraction and typed candidates
NYA-IOI-SCORE-001      Confidence bands; direct-contradiction evaluation; states
NYA-IOI-CERES-001      Ceres grounding adapter
NYA-IOI-GRAPH-001      Graph-projection feature adapter (substrate)
NYA-IOI-XDOC-001       Cross-document adapter
NYA-IOI-INGEST-001     Ingest-candidate reverse channel
NYA-IOI-REVIEW-001     Review events and pattern feedback
NYA-IOI-API-001        Endpoints
NYA-IOI-AUDIT-001      Trace and metrics
```

### 27.2 Veredis

```
VER-IOI-001            IOI client and consumption contract
VER-IOI-TRIGGER-001    Orchestration policy incl. synthesis-status and RRI triggers (context pointers only)
VER-IOI-WEB-001        Established-by-synthesis block + IOI section + review UI
VER-IOI-PDF-001        PDF parity
VER-IOI-API-001        Structured/VZP output
VER-IOI-XDOC-001       Cross-document presentation
VER-IOI-REVIEW-001     Review actions submission
VER-IOI-TEMPLATE-001   Typed template set and guard
VER-RRI-IOI-001        RRI composition of AOT, Synthesis and IOI outputs (no evidence back-flow)
VER-IOI-QA-001         QA/UAT pack and parity gates
```

### 27.3 Shared contracts

```
NYA-CERES-IOI-GROUND-001   Passage grounding contract
NYA-GRAPH-IOI-TYPES-001    Typed inferred-edge projection contract
NYA-GRAPH-FEATURES-001     Graph-projection feature contract (substrate → IOI, RRI)
NYA-XDOC-IOI-HANDOFF-001   Bundle-entity and trigger handoff
NYA-SYNTH-IOI-CONSUME-001  Synthesis consumption contract (accommodations in dev-message v2; no synthesis vocabulary change)
```

## 28. Founder decisions required for v1.3

| ID | Decision | Recommendation |
|---|---|---|
| FD-IOI-1 | Adopt v1.3 as the complete replacement for v1.2 and v1.1. | Yes, conditional on the companion dev-message v2 items being accepted into the synthesis programme. |
| FD-IOI-2 | Synthesis as mandatory step 0 with verification, obtain-current semantics and the two unavailability states. | Yes. |
| FD-IOI-3 | Vocabulary separation on the IOI side via typed template ownership (not word bans). | Yes. |
| **FD-IOI-4 (amended)** | `SYNTH_CLOSED` means the rule did not establish its target under the recorded binding; it never by itself contradicts an IOI signal. `CONTRADICTED` requires separately admissible, directly contradicting evidence on the same predicate, identities and period. `SYNTH_ESTABLISHED` suppresses a competing signal only under an `IDENTICAL` mapping. | Yes. |
| FD-IOI-5 | Reverse channel limited to ingest candidates. | Yes. |
| FD-IOI-6 | Sequencing after the synthesis first slice; RRI not on the critical path. | Yes. |
| FD-IOI-7 | No combined score across synthesis and IOI. | Yes. |
| **FD-IOI-8 (new)** | Proposition mapping contract (§11) as a governed, versioned artefact; adding a synthesis question family requires a mapping version. | Yes. |
| **FD-IOI-9 (new)** | Synthesis Assessment is an analytical reference, not a source; excluded from independence and corroboration; underlying admissibility preserved. | Yes. |
| **FD-IOI-10 (new)** | RRI is a Veredis programme consuming AOT, Synthesis and IOI; no evidence path from RRI into IOI; Nyansapo graph projection is substrate. | Yes. |
| **FD-IOI-11 (new)** | `NYA_IOI_SYNTHESIS_POLICY` default `REQUIRED_FAIL_CLOSED`. | Yes. |

## Appendix A. Candidate source inventory

As v1.2 Appendix A with the Synthesis row **removed** (it is a reference, not a source) and Company registries amended: "cite the synthesis reference and cluster the row with it where the same release is already consumed."

## Appendix B. Payload and output examples

### B.1 Cross-document request

```json
{"bundle_id":"txn_bundle_2026_001","reconciled_entities":[{"bundle_entity_id":"be_supplier","role":"supplier","golden_id":"golden_123"},{"bundle_entity_id":"be_payee","role":"payment_beneficiary","golden_id":null}],"cross_doc_relationships":[{"relationship_type":"SUPPLIER_DIFFERS_FROM_PAYEE","from":"be_supplier","to":"be_payee"}],"audit_trace_id":"xdoc_trace_001"}
```

### B.2 IOI response

```json
{"bundle_id":"txn_bundle_2026_001","module":"IOI","decision_effect":"CONTEXT_ONLY",
 "synthesis_basis":{"golden_123":{"assessment_id":"asm-…","synthesis_status":"CONSUMED","mapping_version":1},"be_payee":{"synthesis_status":"NO_RESULT","reason":"UNRESOLVED_SUBJECT"}},
 "signals":[{"signal_id":"ioi_sig_txn_001","relationship_type":"INFERRED_PAYMENT_PROXY","confidence_band":"LOW","signal_state":"ACTIVE","cross_doc_trigger":"SUPPLIER_DIFFERS_FROM_PAYEE","summary_template":"IOI_POSSIBLE_PROXY_XDOC","review_status":"PENDING"}]}
```

### B.3 No-signal response

```json
{"status":"NO_REVIEWABLE_SIGNALS","decision_effect":"CONTEXT_ONLY","confirmed_ownership":false,"synthesis_references":["ak_7f3…"],"required_copy_template":"VER_NO_IOI_SIGNALS_WITH_SYNTH_REFERENCES"}
```

## Appendix C. Architecture decision record

| ADR field | Decision |
|---|---|
| Title | Place IOI as an independent Nyansapo bounded context that consumes Synthesis as an evidentiary baseline, with RRI downstream in Veredis |
| Status | Accepted for future implementation; sequenced after cross-doc and the synthesis first slice; not deferred |
| Context | IOI needs source lineage, canonical identity, temporal graph state, contradiction handling, review persistence and a deterministic baseline of what is already established and where the gaps are. Synthesis establishes association, not control; its closures are information, not disproof. RRI is presentation and workflow, not inference. |
| Decision | Nyansapo owns IOI. Synthesis supplies references, targets and conflicts under a typed proposition mapping; it never adjudicates control. Ceres supplies passages. Veredis owns request policy, rendering, review submission and RRI. Vocabulary separation by template ownership on the IOI side. |
| Consequences | No split-brain graph; no second "inference" meaning; no double-counting; no false contradictions from closed rules; IOI cannot ship before the synthesis slice; RRI unaffected. |
| Rejected | IOI inside Ceres; IOI in Veredis; IOI inside Synthesis as a confidence rule family; synthesis `CLOSED` as disproof; Assessment as an S1 source; RRI as a Nyansapo engine feeding IOI. |

> **Final design position:** IOI is a Nyansapo intelligence engine adjacent to AOT, Synthesis and Ceres. Synthesis establishes what admissible evidence permits and maps the gaps; IOI investigates what remains possible but unconfirmed, cites what synthesis established, treats what synthesis closed as information, and is contradicted only by directly contradicting admissible evidence. Ceres grounds. Veredis orchestrates, renders and runs RRI. IOI remains review-only, source-backed and isolated from confirmed ownership, established facts and deterministic decision effects.

---

*v1.3 generated 13 October 2026. Complete document; supersedes v1.2 and v1.1. Confidential working specification — IOI is review-only and CONTEXT_ONLY.*
