import { RES_KEYS } from "../config/constants.js";
import { createBigButton, createMiniButton } from "../catan/ui/materialButton.js";
import { 
  showMaterialChoiceDialog, 
  showMaterialConfirmDialog,
  createMaterialChoice, 
  createMaterialDialog 
} from "../utils/materialDialog.js";
import { createMaterialText } from "../utils/materialUI.js";
import { showTradeMenu } from "./dialogs/tradeMenu.js";

/* ===============================================
   Trade Menu (Bank vs Players) - New Modular System
   =============================================== */
export function startTradeMenu({ app, hud, state, resPanel, graph }) {
  showTradeMenu({ app, hud, state, resPanel, graph });
}

/* ===============================================
   Legacy Functions - Keep for compatibility
   =============================================== */
function confirmOfferWithTarget({ app, hud, state, resPanel, fromIdx, toIdx, offer, want }) {
  const title = `Trade Offer: ${playerLabel(fromIdx, state.players)} → ${playerLabel(toIdx, state.players)}`;
  const message = `${formatOfferSummary(offer, want)}\n\nAccept only if you have the requested cards.`;
  
  showMaterialConfirmDialog(app, {
    title,
    message,
    confirmText: "Accept",
    cancelText: "Decline",
    onShow: () => {
      // Block other actions during trade confirmation
      hud.setEndEnabled(false);
      hud.setBuildRoadEnabled(false);
      hud.setBuildSettlementEnabled(false);
      hud.setBuildCityEnabled(false);
      hud.setTradeEnabled(false);
    },
    onConfirm: () => {
      const from = state.players[fromIdx];
      const to   = state.players[toIdx];

      // Real-time validation: do both players still have enough?
      if (!hasAtLeast(from.resources, offer)) { 
        hud.showResult("Offerer no longer has enough resources."); 
        restoreHUD();
        return; 
      }
      if (!hasAtLeast(to.resources, want)) { 
        hud.showResult("Target doesn't have enough resources to give."); 
        restoreHUD();
        return; 
      }

      // Transfer cards: from gives "offer", to gives "want"
      subResources(from.resources, offer);
      addResources(to.resources,   offer);

      subResources(to.resources,   want);
      addResources(from.resources, want);

      resPanel?.updateResources?.(state.players);
      hud.showResult(`Trade done: ${playerLabel(fromIdx, state.players)} ⇄ ${playerLabel(toIdx, state.players)}`);
      restoreHUD();
    },
    onCancel: () => { 
      hud.showResult("Offer declined."); 
      restoreHUD();
    }
  });

  function restoreHUD() {
    hud.setEndEnabled(true);
    hud.setBuildRoadEnabled(true);
    hud.setBuildSettlementEnabled(true);
    hud.setBuildCityEnabled(true);
    hud.setTradeEnabled(true);
  }
}

/* ===============================================
   Shared UI helpers
   =============================================== */
function makeResourceButtons(keys, onPick, x, y) {
  const buttons = [];
  const gap = 6;
  let cx = x;
  keys.forEach(k => {
    const b = makeChip(k, () => onPick(k));
    b.container.x = cx; b.container.y = y; cx += b.container.width + gap;
    buttons.push(b.container);
  });
  return buttons;
}

function makeChip(label, onClick) {
  const container = new PIXI.Container();

  const g = new PIXI.Graphics();
  g.beginFill(0xffffff, 0.12); g.drawRoundedRect(0, 0, 88, 32, 10); g.endFill();
  g.lineStyle({ width: 1, color: 0xffffff, alpha: 0.35 }); g.drawRoundedRect(0, 0, 88, 32, 10);
  container.addChild(g);

  const t = new PIXI.Text(label, { fontFamily: "Arial", fontSize: 14, fill: 0xffffff });
  t.x = 10; t.y = 8; container.addChild(t);

  container.eventMode = "static"; container.cursor = "pointer";
  container.on("pointertap", onClick);

  function setAlpha(a){ container.alpha = a; }
  return { container, setAlpha };
}



function makeSmallLink(label, onClick) {
  const c = new PIXI.Container();
  const t = new PIXI.Text(label, { fontFamily: "Arial", fontSize: 13, fill: 0xffffff });
  c.addChild(t);
  c.eventMode = "static"; c.cursor = "pointer";
  c.on("pointertap", onClick);
  return c;
}

/* ===============================================
   Logic helpers (bank ports + p2p)
   =============================================== */
function computeEffectiveRatesForCurrentPlayer(state, graph) {
  const me = state.players[state.currentPlayer - 1];
  const myVertices = new Set([...(me.settlements || []), ...(me.cities || [])]);
  const ports = state.ports || [];
  const defaultRates = { brick:4, wood:4, wheat:4, sheep:4, ore:4 };
  if (!graph || !graph.vertices || ports.length === 0 || myVertices.size === 0) return defaultRates;

  const portVertices = ports.map(p => {
    const vA = nearestVertexId(graph, p.edgePixels?.v1 || {x:0,y:0});
    const vB = nearestVertexId(graph, p.edgePixels?.v2 || {x:0,y:0});
    return new Set([vA, vB]);
  });

  let hasAnyPort = false;
  const hasResPort = { brick:false, wood:false, wheat:false, sheep:false, ore:false };

  ports.forEach((p, i) => {
    const verts = portVertices[i];
    for (const v of verts) {
      if (myVertices.has(v)) {
        if (p.type === "any") hasAnyPort = true;
        else if (hasResPort[p.type] !== undefined) hasResPort[p.type] = true;
        break;
      }
    }
  });

  const rates = { ...defaultRates };
  for (const k of Object.keys(rates)) {
    if (hasResPort[k]) rates[k] = 2;
    else if (hasAnyPort) rates[k] = 3;
  }
  return rates;
}

function nearestVertexId(graph, pt) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < graph.vertices.length; i++) {
    const v = graph.vertices[i];
    const dx = v.x - pt.x, dy = v.y - pt.y;
    const d = dx*dx + dy*dy;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

function initZeroQtyMap() {
  const m = {}; RES_KEYS.forEach(k => (m[k] = 0)); return m;
}
function compactQty(m) {
  const out = {}; for (const k of RES_KEYS) if (m[k] > 0) out[k] = m[k]; return out;
}
function hasAtLeast(res, need) {
  for (const k in need) if ((res[k] || 0) < need[k]) return false;
  return true;
}
function addResources(res, add) {
  for (const k in add) res[k] = (res[k] || 0) + add[k];
}
function subResources(res, sub) {
  for (const k in sub) res[k] = (res[k] || 0) - sub[k];
}
function formatOfferSummary(offer, want) {
  const fmt = obj => Object.keys(obj).length ? Object.entries(obj).map(([k,v])=>`${v}×${k}`).join(", ") : "—";
  return `You give: ${fmt(offer)}\nYou get: ${fmt(want)}`;
}
function playerLabel(i, players) {
  const n = i + 1;
  const color = players?.[i]?.colorIdx ?? null;
  return color != null ? `P${n}` : `P${n}`;
}
function formatRates(r) {
  return `B:${r.brick} Wd:${r.wood} Wh:${r.wheat} Sh:${r.sheep} Or:${r.ore}`;
}
