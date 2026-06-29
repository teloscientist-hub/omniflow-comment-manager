# UI & Schema Specification: SMM & OmniFlow API-First Integration (2026)

This proposal details the **data schema fields**, **API endpoints**, and **UI tab/field updates** needed in both the **SMM Dashboard** and **OmniFlow AI** to automate our attribution and campaign provisioning loops.

---

## Part 1: Relational Schema & Registry Specs

To maintain lineage from Trend Discovery -> Content Draft -> Published Post -> DM Trigger -> Enriched Lead -> E-commerce Conversion, the systems must share the following keys.

### 1. SMM Derivative Registry Schema (`derivative-registry.json`)
The registry mapping derivative works back to trend sources must incorporate OmniFlow triggers:
```json
{
  "derivative_id": "ig_post_178272562799",
  "source_id": "youtube-6f68ec98a476",
  "brand": "MML",
  "published_url": "https://instagram.com/p/C9x81a...",
  "published_at": "2026-06-29T10:00:00Z",
  "omniflow_provisioned": true,
  "automation": {
    "trigger_keyword": "GROWTH",
    "flow_id": "flow_mml_growth_book_v2"
  },
  "metrics": {
    "views": 12500,
    "opt_ins": 420,
    "sales_revenue": 18490.00
  }
}
```

### 2. OmniFlow Resolved Lead Schema
The lead database must store the matching post ID and original trend source ID:
```json
{
  "lead_id": "lead_98a72bf3",
  "resolved_name": "John Doe",
  "email": "john.doe@gmail.com",
  "phone": "+14153829021",
  "origin_post_id": "ig_post_178272562799",
  "origin_source_id": "youtube-6f68ec98a476",
  "opt_in_keyword": "GROWTH",
  "status": "Converted",
  "value_usd": 97.00
}
```

---

## Part 2: SMM Dashboard UI Updates (Upstream)

To support this integration, the SMM Dashboard requires modifications in three views:

### 1. Staging & Approval Queue Panel
Add an **"OmniFlow Automation Setup"** section to the staging candidate card before publication:

```text
+--------------------------------------------------------------+
| [SMM Approval Card]                                          |
| Candidate: "GaryVee Social Media Strategy Breakdown"          |
|                                                              |
| [ ] ENABLE DM AUTOMATION TRIGGER                             |
|     Keyword Trigger: [ GROWTH             ]                  |
|     OmniFlow Sequence: [ MML Growth Book Flow (ID: flow_2) v] |
|                                                              |
| [ APPROVE & PUBLISH ]                                        |
+--------------------------------------------------------------+
```

* **Functional Logic:**
  * When *"Enable DM Automation"* is checked, SMM calls OmniFlow's API (`GET /api/flows`) to populate the dropdown.
  * On approval, the publish webhook triggers, sending the post ID and the automation configuration to OmniFlow.

### 2. Calendar View
* **Update:** Display a lightning bolt badge icon (`⚡`) on scheduled post cards that have an active OmniFlow automation trigger assigned.
* **Hover Action:** Hovering over the badge displays: `Trigger: "GROWTH" | Flow: MML Growth Book`.

### 3. Analytics Panel
* **Update:** Add columns measuring lower-funnel performance directly on each post card:
  - **Enriched Leads:** Number of visitor contacts resolved (clicking the count opens OmniFlow's Lead panel).
  - **Direct Sales:** Total checkout revenue tracked by OmniFlow DMs.
  - **Origin Trend:** Clickable link pointing to the original Trend Intelligence scanner transcript card.

---

## Part 3: OmniFlow AI UI Updates (Downstream)

OmniFlow requires modifications across its layout tabs to represent and manage SMM connections:

### 1. Visual Flow Builder Node Panel
* **Node Updates:** Add an **"Attribution Tag"** logic block:
  - When dragged into the workspace, this block allows you to attach custom database tags based on SMM post parameters (e.g., `Tag: {smm.source_id}`).
  - When the flow executes, this tag is applied to the resolved lead profile.

### 2. Unified Inbox Profile Panel (Right Panel)
Add an **"Attribution & Lineage"** details card to display the lead's history:

```text
+--------------------------------------------------------------+
| [Customer Profile Card]                                      |
| John Doe (@johndoe_creative)                                 |
|                                                              |
| Identity Enrichment                                          |
|   Email: john.doe@gmail.com                                  |
|   Phone: +1 (415) 382-9021                                   |
|                                                              |
| SMM Attribution Lineage                                      |
|   Trigger Post: "GaryVee Social Media Strategy Breakdown"    |
|   Keyword used: "GROWTH"                                     |
|   Origin Video: [ GaryVee Ultimate Strategy (YT: lqmA-Lr) ]  |
+--------------------------------------------------------------+
```

* **Functional Logic:** Clicking the *Origin Video* link redirects the user directly to the SMM Dashboard Trend Scanner transcript and metadata page for that video.

### 3. Lead Enrichment Table
* **New Column:** Add **"Origin Video Source"**. Shows the title of the original YouTube/TikTok video that inspired the post. Clicking it opens the transcript analysis card.

### 4. Integration Settings Panel (New Card)
Add a connection status card to monitor the bridge:
* **Endpoint Checklist:** Confirms connectivity to the local SMM API (`GET /api/smm/status`).
* **Trigger Registry Log:** Displays a table of active post IDs, their registered keyword listeners, and the sync timestamps.

---

## Part 4: API Endpoint Specifications

The bridge communicates via these four REST API routes:

### 1. Register Trigger Keyword (SMM -> OmniFlow)
* **Route:** `POST http://localhost:8888/api/triggers/register`
* **Payload:**
  ```json
  {
    "post_id": "ig_post_178272562799",
    "source_id": "youtube-6f68ec98a476",
    "trigger_keyword": "GROWTH",
    "flow_id": "flow_mml_growth_book_v2"
  }
  ```

### 2. Fetch Active Flows (SMM <- OmniFlow)
* **Route:** `GET http://localhost:8888/api/flows`
* **Response:**
  ```json
  [
    { "id": "flow_1", "name": "Free PDF Checklist Flow" },
    { "id": "flow_2", "name": "MML Growth Book Flow" }
  ]
  ```

### 3. Send Conversion Metric (OmniFlow -> SMM)
* **Route:** `POST http://localhost:8766/api/analytics/conversion`
* **Payload:**
  ```json
  {
    "post_id": "ig_post_178272562799",
    "lead_id": "lead_98a72bf3",
    "revenue_usd": 97.00,
    "timestamp": "2026-06-29T10:14:00Z"
  }
  ```

### 4. Fetch Trend Source Metadata (OmniFlow <- SMM)
* **Route:** `GET http://localhost:8766/api/trends/source-metadata?source_id=youtube-6f68ec98a476`
* **Response:**
  ```json
  {
    "source_id": "youtube-6f68ec98a476",
    "title": "The Ultimate Social Media Marketing Strategy",
    "creator": "GaryVee",
    "url": "https://www.youtube.com/watch?v=lqmA-LrQzcY"
  }
  ```
