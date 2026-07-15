# Release Security Scan Dashboard — Leadership Demo Deck

`[PLACEHOLDER: confirm official product name / working title]`

Format: one slide per `##` section, separated by `---`. Built for you to present live and switch out to the running app at the marked demo slides. Keep each slide's on-screen text to the bullets shown — the talking happens live, the slide is the visual anchor.

---

## Slide 1 — Title

**Visual:** `[PLACEHOLDER: company/team logo, hero screenshot of the release list page]`

- **Release Security Scan Dashboard**
- One place to see every release, every vulnerability, every fix
- Presented by `[PLACEHOLDER: your name / team]` — `[PLACEHOLDER: date]`

---

## Slide 2 — Agenda

**Visual:** simple 4-icon row (problem / solution / demo / impact)

1. The problem today
2. What we built
3. Live demo
4. Impact & what's next

---

## Slide 3 — The Problem

**Visual:** `[PLACEHOLDER: photo/illustration of someone juggling multiple browser tabs — or a screenshot collage of ADO + Mend + Fortify + Wiz dashboards side by side]`

- Every release touches **multiple repos, multiple builds, multiple security tools**
- Mend, Fortify, and Wiz each have their **own dashboard, own login, own format**
- No single view ties a vulnerability back to **which release it blocks**
- Release readiness is decided **by manually cross-checking tabs**

---

## Slide 4 — Pain Points Today

**Visual:** icon list, red/orange accent color

- **Manual & slow** — checking 3 tools per repo, per build, per release
- **Error-prone** — easy to miss a critical finding buried in a long list
- **No context** — a CVE ID doesn't tell a release manager "is this safe to ship?"
- **No ownership path** — finding a vulnerability ≠ knowing how to fix it
- **Delayed releases** — when in doubt, teams wait, escalate, or ship blind

`[PLACEHOLDER: quote or anecdote from a release manager about a real delayed release]`

---

## Slide 5 — Business Impact

**Visual:** `[CHART PLACEHOLDER: bar chart — releases delayed due to security review last quarter]`

- Security review is a **recurring bottleneck** on the release calendar
- Manual cross-checking = **engineering hours spent on lookup, not fixing**
- Inconsistent review = **compliance and audit risk**
- Vulnerabilities found late = **more expensive to fix than caught early**

`[PLACEHOLDER: cost-of-delay or cost-per-incident figure if available]`

---

## Slide 6 — Introducing the Dashboard

**Visual:** `[PLACEHOLDER: architecture-lite diagram — ADO → Orchestrator → Mend/Fortify/Wiz → Dashboard]`

- One button starts a scan across **every upcoming release**
- Pulls straight from **Azure DevOps** — no manual list building
- Aggregates findings from **Mend (live), Fortify & Wiz (rolling out)**
- Surfaces a **plain-language, AI-generated summary** — not just raw CVE dumps

---

## Slide 7 — How It Works (High Level)

**Visual:** left-to-right flow diagram, 4 steps, minimal text

1. **Scan** — pulls release work items and builds from ADO
2. **Correlate** — maps each repo to its security scan results
3. **Summarize** — AI explains what's found, in plain English
4. **Act** — drill down to the exact issue, get a suggested fix

*(Keep this slide light — one sentence per step, no code, no jargon)*

---

## Slide 8 — Key Capabilities

**Visual:** 2×3 feature grid with icons

| | |
|---|---|
| 📋 Release-level dashboard | See every upcoming release and its risk at a glance |
| 🔎 Drill-down navigation | Release → Build → Issue, three clicks deep |
| 🎯 Critical/High focus | Don't drown in noise — see what actually matters first |
| 🤖 AI summaries | Plain-language explanation, not raw scanner output |
| 🔍 Search, sort, filter | Find the one issue that matters in seconds |
| 🛠️ AI-suggested fixes | See the exact code change, not just the CVE |

---

## Slide 9 — AI-Powered Insights

**Visual:** `[PLACEHOLDER: screenshot of the AI summary card on the release list / build page]`

- Every release and every build gets an **AI-written summary**
  - *"1 critical vulnerability found — a known RCE in a logging library. Recommend patching before this build ships."*
- No need to read raw scanner output to know if you're at risk
- Built for **release managers and scrum masters**, not just engineers

---

## Slide 10 — 🔴 LIVE DEMO — Part 1: The Dashboard

**Visual:** *(switch to live application)*

Walkthrough:
- Start a scan
- Release list — severity at a glance
- Drill into a release → a build → the issue table

`[Presenter note: this is where you tab out to the running app]`

---

## Slide 11 — AI-Suggested Fixes

**Visual:** `[PLACEHOLDER: screenshot of the code-fix diff modal]`

- Click **"View fix"** on any issue with a known remediation
- See the exact diff — file, line, before → after — like a code review
- One click to **open a pull request** with the fix applied

`[PLACEHOLDER: note current status — this flow is demoed with representative examples today; production PR automation against ADO Repos is the next build phase]`

---

## Slide 12 — 🔴 LIVE DEMO — Part 2: Fix It

**Visual:** *(switch to live application)*

Walkthrough:
- Open the fix modal on a critical issue
- Walk through the diff
- Click "Open pull request"

`[Presenter note: second demo break]`

---

## Slide 13 — The New Workflow

**Visual:** before/after two-column comparison

| Before | After |
|---|---|
| Log into 3+ tools per release | One dashboard, one login |
| Manually cross-reference repos & builds | Automatic ADO correlation |
| Read raw CVE lists | Plain-language AI summary |
| Escalate to find out "is this fixable?" | See the fix inline |
| Hours of manual review | `[PLACEHOLDER: X minutes]` |

---

## Slide 14 — Time & Effort Saved

**Visual:** `[CHART PLACEHOLDER: hours spent on manual security review, before vs. after — bar or line chart]`

- `[PLACEHOLDER: hours saved per release]`
- `[PLACEHOLDER: number of releases per month/quarter this applies to]`
- `[PLACEHOLDER: estimated engineering hours reclaimed per quarter]`
- `[PLACEHOLDER: reduction in time-to-detect for critical vulnerabilities]`

*(Numbers TBD — pull from a pilot period or team survey before presenting)*

---

## Slide 15 — Security Coverage

**Visual:** simple status table

| Tool | Status |
|---|---|
| Mend | ✅ Live |
| Fortify | 🔜 In progress |
| Wiz | 🔜 In progress |

- Built to be **pluggable** — adding a new scanner is a small, contained change
- No workflow disruption as coverage expands

---

## Slide 16 — What's Next (Roadmap)

**Visual:** simple horizontal timeline

- `[PLACEHOLDER: Fortify + Wiz integration — target date]`
- `[PLACEHOLDER: Automated PR creation against ADO Repos — target date]`
- `[PLACEHOLDER: Slack/Teams notifications for new critical findings]`
- `[PLACEHOLDER: Historical trend dashboard — risk over time]`
- `[PLACEHOLDER: Release-date field sourced directly from ADO]`

---

## Slide 17 — What We Need From You

**Visual:** clean 3-bullet ask, no clutter

- `[PLACEHOLDER: pilot team / group to onboard first]`
- `[PLACEHOLDER: approval for production backend deployment]`
- `[PLACEHOLDER: budget/licensing confirmation for Fortify & Wiz API access]`

---

## Slide 18 — Thank You / Q&A

**Visual:** `[PLACEHOLDER: team contact info, Slack channel, or feedback form link]`

- Questions?
- `[PLACEHOLDER: link to request access / pilot sign-up]`
