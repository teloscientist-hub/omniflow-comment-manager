# Message Manager

Message Manager is a unified omnichannel chat automation, identity resolution, and sales attribution platform. It coordinates automated DM sequencing, captures visitor contacts, and tracks sales logs.

---

## 1. Setup & Installation

To launch the local Node-backed prototype:
1. Navigate to this directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open `http://localhost:8888` in your browser.

---

## 2. Core Functional Layouts

### Analytics & Operations Center
The top header provides the operational controls:
* **Interactive Time Range**: Toggle between **7d**, **30d**, and **All Time** range presets. Selecting a period instantly updates the operational metrics and trends.
* **Operational Stats Cards**:
  * **Triggers & Flows Active**: Tracks active webhook automation rules, webhook status, and system error logs.
  * **Operator Handled DMs**: Displays active inbox counts needing support attention, along with average operator response latencies.
  * **SMM Handoff Requests**: Shows content requests compiled and waiting for Exchange Bus sync.
  * **Conversion E-commerce Sales**: Displays total attributed sales volume and conversion percentages.

### Lead & Conversation Statuses
All conversation records are resolved and marked with consistent status badges:
* **CONVERTED** (Success Green): Leads that completed a Stripe checkout or conversion sequence.
* **AI HANDLED** (Info Blue/Cyan): Conversations currently managed by automated chat sequences.
* **ENRICHED** (Warning Yellow): Profiles with parsed/resolved contact info waiting for manual sync.
* **OPEN** (Neutral Grey): Active conversations waiting for manual operator response.

### Small-Screen Viewport Scroll
The layout includes styling overrides that automatically disable `overflow: hidden; height: 100vh` rules on small viewport sizes (less than 900px wide or 700px high). The application stacks the sidebar and allows responsive scrolling on mobile devices.

---

## 3. Integration Data Sync (Exchange Bus)
Persistent chat state is stored in `data/omniflow-state.json`. Message Manager automatically publishes event outputs to the local Exchange Bus directories:
* `smm/exchange/message-manager/inbox_summary.json`
* `smm/exchange/message-manager/conversions.json`
* `smm/exchange/message-manager/content_requests.json`
