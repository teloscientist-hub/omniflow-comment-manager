const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const exchange = require("../_shared/exchange/exchange.js");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const STATE_PATH = path.join(DATA_DIR, "omniflow-state.json");
const SMM_IMPORTS_DIR = path.join(ROOT, "..", "smm-dashboard", "dashboard", "data", "imports");
const PORT = Number(process.env.PORT || 8888);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

async function readState() {
  const raw = await fs.readFile(STATE_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeState(state) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  state.generated_at = new Date().toISOString();
  await fs.writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function normalizeTrigger(payload) {
  const postId = String(payload.post_id || "").trim();
  const triggerKeyword = String(payload.trigger_keyword || "").trim();
  const flowId = String(payload.flow_id || "").trim();

  if (!postId) throw new Error("post_id is required");
  if (!triggerKeyword) throw new Error("trigger_keyword is required");
  if (!flowId) throw new Error("flow_id is required");

  return {
    id: String(payload.id || `trigger_${randomUUID()}`),
    post_id: postId,
    source_id: payload.source_id || null,
    trigger_keyword: triggerKeyword,
    flow_id: flowId,
    flow_name: payload.flow_name || null,
    status: payload.status || "active",
    registered_at: payload.registered_at || new Date().toISOString(),
    last_checked_at: payload.last_checked_at || null,
  };
}

function normalizeMessage(payload) {
  const text = String(payload.text || "").trim();
  if (!text) throw new Error("text is required");
  return {
    type: payload.type === "incoming" ? "incoming" : "outgoing",
    text,
    time: payload.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isAI: Boolean(payload.isAI),
  };
}

function normalizeConversion(payload) {
  const postId = String(payload.post_id || "").trim();
  const leadId = String(payload.lead_id || "").trim();
  const revenueUsd = Number(payload.revenue_usd || 0);

  if (!postId) throw new Error("post_id is required");
  if (!leadId) throw new Error("lead_id is required");
  if (!Number.isFinite(revenueUsd) || revenueUsd < 0) throw new Error("revenue_usd must be a non-negative number");

  return {
    id: String(payload.id || `conversion_${randomUUID()}`),
    post_id: postId,
    lead_id: leadId,
    revenue_usd: revenueUsd,
    currency: payload.currency || "USD",
    source_id: payload.source_id || null,
    flow_id: payload.flow_id || null,
    trigger_keyword: payload.trigger_keyword || null,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}

function normalizeContentRequest(payload) {
  const topic = String(payload.topic || "").trim();
  if (!topic) throw new Error("topic is required");

  return {
    id: String(payload.id || `request_${randomUUID()}`),
    topic,
    source: "OmniFlow Inbox",
    conversation_id: payload.conversation_id || null,
    requester: payload.requester || null,
    message_excerpt: payload.message_excerpt || null,
    count: Number(payload.count || 1),
    priority: payload.priority || "medium",
    status: payload.status || "new",
    created_at: payload.created_at || new Date().toISOString(),
  };
}

function resolveLeadForConversation(state, conversation) {
  state.leads ||= [];
  
  let lead = null;
  const email = (conversation.email || "").trim().toLowerCase();
  const phone = (conversation.phone || "").trim();
  const handle = (conversation.name || "").trim();
  const platform = conversation.platform;
  
  if (email) {
    lead = state.leads.find(l => l.email && l.email.toLowerCase() === email);
  }
  if (!lead && phone) {
    lead = state.leads.find(l => l.phone && l.phone === phone);
  }
  if (!lead && handle) {
    lead = state.leads.find(l => l.channels && l.channels.some(c => c.platform === platform && c.handle === handle));
  }
  
  if (!lead) {
    lead = {
      id: `lead_${randomUUID()}`,
      full_name: conversation.fullName || conversation.name,
      email: conversation.email || null,
      phone: conversation.phone || null,
      location: conversation.location || null,
      tags: conversation.tags || [],
      channels: [{ platform, handle }],
      attribution: conversation.attribution || {},
      timeline: [
        {
          event: "Lead profile created",
          detail: `Initial contact on ${platform} (${handle})`,
          timestamp: new Date().toISOString()
        }
      ],
      created_at: new Date().toISOString()
    };
    state.leads.push(lead);
  } else {
    if (!lead.email && conversation.email) {
      lead.email = conversation.email;
      lead.timeline.push({
        event: "Email resolved",
        detail: `Added email: ${conversation.email}`,
        timestamp: new Date().toISOString()
      });
    }
    if (!lead.phone && conversation.phone) {
      lead.phone = conversation.phone;
      lead.timeline.push({
        event: "Phone resolved",
        detail: `Added phone: ${conversation.phone}`,
        timestamp: new Date().toISOString()
      });
    }
    
    const channelExists = lead.channels.some(c => c.platform === platform && c.handle === handle);
    if (!channelExists) {
      lead.channels.push({ platform, handle });
      lead.timeline.push({
        event: "Linked channel",
        detail: `Connected ${platform} handle @${handle}`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (conversation.tags) {
      conversation.tags.forEach(t => {
        if (!lead.tags.includes(t)) lead.tags.push(t);
      });
    }
  }
  
  conversation.lead_id = lead.id;
  return lead;
}

function ensureCollections(state) {
  state.triggers ||= [];
  state.conversations ||= [];
  state.conversions ||= [];
  state.content_requests ||= [];
  state.drafts ||= [];
  state.leads ||= [];
  return state;
}

function buildSmmExports(state) {
  const generatedAt = new Date().toISOString();
  return {
    flows: {
      schema_version: 1,
      generated_at: generatedAt,
      source_app: "omniflow",
      description: "OmniFlow flow catalog available for SMM post trigger setup.",
      flows: state.flows,
    },
    conversions: {
      schema_version: 1,
      generated_at: generatedAt,
      source_app: "omniflow",
      description: "OmniFlow conversion events attributed to SMM posts.",
      conversions: state.conversions,
    },
    content_requests: {
      schema_version: 1,
      generated_at: generatedAt,
      source_app: "omniflow",
      description: "Repeated inbox questions and content requests from OmniFlow.",
      requests: state.content_requests,
    },
    inbox_summary: {
      schema_version: 1,
      generated_at: generatedAt,
      source_app: "omniflow",
      description: "OmniFlow inbox summary records for SMM operational awareness.",
      conversations: state.conversations.map((conversation) => {
        const attribution = conversation.attribution || {};
        return {
          id: conversation.id,
          requester: conversation.fullName || conversation.name,
          handle: conversation.name,
          platform: conversation.platform,
          channel: conversation.channel,
          status: conversation.status,
          last_activity: conversation.lastActivity,
          tags: conversation.tags || [],
          origin_post_id: attribution.origin_post_id || null,
          origin_source_id: attribution.origin_source_id || null,
          trigger_keyword: attribution.trigger_keyword || null,
          flow_id: attribution.flow_id || null,
          flow_name: attribution.flow_name || null,
          revenue_usd: attribution.revenue_usd || 0,
          message_count: Array.isArray(conversation.messages) ? conversation.messages.length : 0,
        };
      }),
    },
  };
}

async function writeSmmExports(state) {
  const exports = buildSmmExports(state);

  // Publish to Exchange Bus
  try {
    exchange.publish("message-manager", "flows", exports.flows.flows);
    exchange.publish("message-manager", "conversions", exports.conversions.conversions);
    exchange.publish("message-manager", "content_requests", exports.content_requests.requests);
    exchange.publish("message-manager", "inbox_summary", exports.inbox_summary.conversations);
  } catch (exc) {
    console.warn("Warning: Failed to publish Message Manager exports to Exchange Bus:", exc.message);
  }

  await fs.mkdir(SMM_IMPORTS_DIR, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(SMM_IMPORTS_DIR, "omniflow-flows.json"), `${JSON.stringify(exports.flows, null, 2)}\n`, "utf8"),
    fs.writeFile(path.join(SMM_IMPORTS_DIR, "omniflow-conversions.json"), `${JSON.stringify(exports.conversions, null, 2)}\n`, "utf8"),
    fs.writeFile(path.join(SMM_IMPORTS_DIR, "omniflow-content-requests.json"), `${JSON.stringify(exports.content_requests, null, 2)}\n`, "utf8"),
    fs.writeFile(path.join(SMM_IMPORTS_DIR, "omniflow-inbox-summary.json"), `${JSON.stringify(exports.inbox_summary, null, 2)}\n`, "utf8"),
  ]);
  return exports;
}

async function handleApi(req, res, url) {
  const state = ensureCollections(await readState());

  let stateModified = false;
  if (state.conversations) {
    state.conversations.forEach(c => {
      if (!c.lead_id) {
        resolveLeadForConversation(state, c);
        stateModified = true;
      }
    });
  }
  if (stateModified) {
    await writeState(state);
  }

  if (req.method === "GET" && url.pathname === "/api/status") {
    return sendJson(res, 200, {
      status: "ok",
      generated_at: state.generated_at,
      summary: {
        flows: state.flows.length,
        triggers: state.triggers.length,
        conversations: state.conversations.length,
        conversions: state.conversions.length,
        content_requests: state.content_requests.length,
      },
    });
  }

  if (req.method === "GET" && url.pathname === "/api/flows") {
    return sendJson(res, 200, state.flows);
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/flows/")) {
    const id = url.pathname.split("/").pop();
    const flow = state.flows.find((item) => item.id === id);
    if (!flow) return sendError(res, 404, "flow not found");
    return sendJson(res, 200, flow);
  }

  if (req.method === "POST" && url.pathname === "/api/flows") {
    const payload = await readJsonBody(req);
    const flow = {
      id: payload.id || `flow_${randomUUID()}`,
      name: payload.name || "Unnamed Flow",
      default_trigger_keyword: payload.default_trigger_keyword || "TRIGGER",
      status: payload.status || "active",
      response_text: payload.response_text || "Thank you for connecting!"
    };
    state.flows.push(flow);
    await writeState(state);
    return sendJson(res, 201, flow);
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/flows/")) {
    const id = url.pathname.split("/").pop();
    const existingIndex = state.flows.findIndex((item) => item.id === id);
    if (existingIndex < 0) return sendError(res, 404, "flow not found");
    const payload = await readJsonBody(req);
    state.flows[existingIndex] = {
      ...state.flows[existingIndex],
      ...payload
    };
    await writeState(state);
    return sendJson(res, 200, state.flows[existingIndex]);
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/flows/")) {
    const id = url.pathname.split("/").pop();
    const existingIndex = state.flows.findIndex((item) => item.id === id);
    if (existingIndex < 0) return sendError(res, 404, "flow not found");
    const deleted = state.flows.splice(existingIndex, 1)[0];
    await writeState(state);
    return sendJson(res, 200, deleted);
  }

  if (req.method === "GET" && url.pathname === "/api/triggers") {
    return sendJson(res, 200, {
      generated_at: state.generated_at,
      summary: {
        flows: state.flows.length,
        triggers: state.triggers.length,
        active: state.triggers.filter((trigger) => trigger.status === "active").length,
        planned: state.triggers.filter((trigger) => trigger.status === "planned").length,
      },
      flows: state.flows,
      triggers: state.triggers,
    });
  }

  if (req.method === "POST" && url.pathname === "/api/triggers/register") {
    const payload = await readJsonBody(req);
    const trigger = normalizeTrigger(payload);
    const flow = state.flows.find((item) => item.id === trigger.flow_id);
    trigger.flow_name = trigger.flow_name || flow?.name || trigger.flow_id;

    const existingIndex = state.triggers.findIndex((item) => item.post_id === trigger.post_id && item.flow_id === trigger.flow_id);
    if (existingIndex >= 0) {
      state.triggers[existingIndex] = { ...state.triggers[existingIndex], ...trigger };
    } else {
      state.triggers.push(trigger);
    }

    await writeState(state);
    return sendJson(res, 201, trigger);
  }

  if (req.method === "GET" && url.pathname === "/api/leads") {
    return sendJson(res, 200, state.leads);
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/leads/")) {
    const id = url.pathname.split("/").pop();
    const lead = state.leads.find((item) => item.id === id);
    if (!lead) return sendError(res, 404, "lead not found");
    return sendJson(res, 200, lead);
  }

  if (req.method === "POST" && url.pathname === "/api/leads/merge") {
    const payload = await readJsonBody(req);
    const primaryId = payload.primary_lead_id;
    const secondaryId = payload.secondary_lead_id;
    
    if (!primaryId || !secondaryId) {
      return sendError(res, 400, "primary_lead_id and secondary_lead_id are required");
    }
    
    const primaryIndex = state.leads.findIndex(l => l.id === primaryId);
    const secondaryIndex = state.leads.findIndex(l => l.id === secondaryId);
    
    if (primaryIndex < 0 || secondaryIndex < 0) {
      return sendError(res, 404, "One or both leads not found");
    }
    
    const primaryLead = state.leads[primaryIndex];
    const secondaryLead = state.leads.splice(secondaryIndex, 1)[0];
    
    secondaryLead.channels.forEach(ch => {
      if (!primaryLead.channels.some(pc => pc.platform === ch.platform && pc.handle === ch.handle)) {
        primaryLead.channels.push(ch);
      }
    });
    
    secondaryLead.tags.forEach(tag => {
      if (!primaryLead.tags.includes(tag)) {
        primaryLead.tags.push(tag);
      }
    });
    
    if (!primaryLead.email) primaryLead.email = secondaryLead.email;
    if (!primaryLead.phone) primaryLead.phone = secondaryLead.phone;
    if (!primaryLead.location) primaryLead.location = secondaryLead.location;
    
    primaryLead.timeline.push({
      event: "Profiles Merged",
      detail: `Merged secondary profile ${secondaryLead.full_name} (${secondaryLead.id})`,
      timestamp: new Date().toISOString()
    });
    primaryLead.timeline = primaryLead.timeline.concat(secondaryLead.timeline || []);
    
    state.conversations.forEach(c => {
      if (c.lead_id === secondaryId) {
        c.lead_id = primaryId;
      }
    });
    
    await writeState(state);
    return sendJson(res, 200, primaryLead);
  }

  if (req.method === "GET" && url.pathname === "/api/conversations") {
    return sendJson(res, 200, state.conversations);
  }

  if (req.method === "GET" && url.pathname === "/api/conversions") {
    return sendJson(res, 200, state.conversions);
  }

  if (req.method === "POST" && url.pathname === "/api/conversions") {
    const payload = await readJsonBody(req);
    const conversion = normalizeConversion(payload);
    const existingIndex = state.conversions.findIndex((item) => item.id === conversion.id);
    if (existingIndex >= 0) {
      state.conversions[existingIndex] = conversion;
    } else {
      state.conversions.push(conversion);
    }
    await writeState(state);
    return sendJson(res, 201, conversion);
  }

  if (req.method === "GET" && url.pathname === "/api/content-requests") {
    return sendJson(res, 200, state.content_requests);
  }

  if (req.method === "POST" && url.pathname === "/api/content-requests") {
    const payload = await readJsonBody(req);
    const contentRequest = normalizeContentRequest(payload);
    state.content_requests.push(contentRequest);
    await writeState(state);
    return sendJson(res, 201, contentRequest);
  }

  if (req.method === "GET" && url.pathname === "/api/smm/exports") {
    return sendJson(res, 200, buildSmmExports(state));
  }

  if (req.method === "POST" && url.pathname === "/api/smm/export") {
    const exports = await writeSmmExports(state);
    return sendJson(res, 200, {
      status: "exported",
      target_dir: SMM_IMPORTS_DIR,
      files: [
        "omniflow-flows.json",
        "omniflow-conversions.json",
        "omniflow-content-requests.json",
        "omniflow-inbox-summary.json",
      ],
      summary: {
        flows: exports.flows.flows.length,
        conversions: exports.conversions.conversions.length,
        content_requests: exports.content_requests.requests.length,
        conversations: exports.inbox_summary.conversations.length,
      },
    });
  }

  const conversationMatch = url.pathname.match(/^\/api\/conversations\/([^/]+)\/messages$/);
  if (conversationMatch && req.method === "POST") {
    const conversationId = decodeURIComponent(conversationMatch[1]);
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation) return sendError(res, 404, "conversation not found");

    const payload = await readJsonBody(req);
    const message = normalizeMessage(payload);
    conversation.messages.push(message);
    conversation.lastActivity = "now";

    await writeState(state);
    return sendJson(res, 201, { conversation, message });
  }

  const draftsConvMatch = url.pathname.match(/^\/api\/conversations\/([^/]+)\/drafts$/);
  if (draftsConvMatch && req.method === "GET") {
    const conversationId = decodeURIComponent(draftsConvMatch[1]);
    const list = state.drafts.filter(d => d.conversation_id === conversationId);
    return sendJson(res, 200, list);
  }

  if (draftsConvMatch && req.method === "POST") {
    const conversationId = decodeURIComponent(draftsConvMatch[1]);
    const payload = await readJsonBody(req);
    const text = String(payload.text || "").trim();
    if (!text) return sendError(res, 400, "text is required");
    
    const draft = {
      id: `draft_${randomUUID()}`,
      conversation_id: conversationId,
      text,
      created_at: new Date().toISOString()
    };
    state.drafts.push(draft);
    await writeState(state);
    return sendJson(res, 201, draft);
  }

  const draftMatch = url.pathname.match(/^\/api\/conversations\/([^/]+)\/drafts\/([^/]+)$/);
  if (draftMatch && req.method === "PATCH") {
    const draftId = decodeURIComponent(draftMatch[2]);
    const existingIndex = state.drafts.findIndex(d => d.id === draftId);
    if (existingIndex < 0) return sendError(res, 404, "draft not found");
    
    const payload = await readJsonBody(req);
    if (payload.text) {
      state.drafts[existingIndex].text = String(payload.text).trim();
    }
    await writeState(state);
    return sendJson(res, 200, state.drafts[existingIndex]);
  }

  if (draftMatch && req.method === "DELETE") {
    const draftId = decodeURIComponent(draftMatch[2]);
    const existingIndex = state.drafts.findIndex(d => d.id === draftId);
    if (existingIndex < 0) return sendError(res, 404, "draft not found");
    
    const deleted = state.drafts.splice(existingIndex, 1)[0];
    await writeState(state);
    return sendJson(res, 200, deleted);
  }

  const approveMatch = url.pathname.match(/^\/api\/conversations\/([^/]+)\/drafts\/([^/]+)\/approve$/);
  if (approveMatch && req.method === "POST") {
    const conversationId = decodeURIComponent(approveMatch[1]);
    const draftId = decodeURIComponent(approveMatch[2]);
    
    const existingIndex = state.drafts.findIndex(d => d.id === draftId);
    if (existingIndex < 0) return sendError(res, 404, "draft not found");
    
    const draft = state.drafts.splice(existingIndex, 1)[0];
    
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation) return sendError(res, 404, "conversation not found");
    
    const message = {
      type: "outgoing",
      text: draft.text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isAI: true
    };
    conversation.messages.push(message);
    conversation.lastActivity = "now";
    
    await writeState(state);
    return sendJson(res, 200, { ok: true, message });
  }

  return sendError(res, 404, "api route not found");
}

async function serveStatic(res, url) {
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(ROOT, requested));

  if (!filePath.startsWith(ROOT)) {
    return sendError(res, 403, "forbidden");
  }

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "content-type": MIME_TYPES[ext] || "application/octet-stream",
    });
    res.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      return sendError(res, 404, "file not found");
    }
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(res, url);
  } catch (error) {
    const status = error instanceof SyntaxError ? 400 : 500;
    sendError(res, status, error.message || "server error");
  }
});

server.listen(PORT, () => {
  console.log(`Message Manager running at http://localhost:${PORT}`);
});
