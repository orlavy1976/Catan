import { RES_KEYS } from "../config/constants.js";
import { patch } from "./stateStore.js";

export function distributeResources({ sum, state, layout, graph }) {
  const eligible = [];
  for (let i = 0; i < layout.length; i++) {
    if (i === state.robberTile) continue;
    const t = layout[i];
    if (t.token === sum && t.kind !== "desert") eligible.push(i);
  }

  // ownerByVertex -> { owner, mult }  (settlement=1, city=2)
  const vertexInfo = new Map();
  state.players.forEach((p, idx) => {
    p.settlements.forEach(vId => vertexInfo.set(vId, { owner: idx, mult: 1 }));
    p.cities?.forEach(vId => vertexInfo.set(vId, { owner: idx, mult: 2 }));
  });

  const gainByPlayer = [initRes(), initRes(), initRes(), initRes()];

  eligible.forEach(tileIdx => {
    const kind = layout[tileIdx].kind;
    graph.vertices.forEach(v => {
      if (!v.tiles.has(tileIdx)) return;
      const info = vertexInfo.get(v.id);
      if (!info) return;
      gainByPlayer[info.owner][kind] += info.mult;
    });
  });

  patch(s => {
    s.players.forEach((p, idx) => {
      RES_KEYS.forEach(k => p.resources[k] += gainByPlayer[idx][k]);
    });
  });

  return gainByPlayer;
}

export function summarizeGain(gainByPlayer){
  const parts = [];
  gainByPlayer.forEach((g, idx) => {
    const arr = Object.entries(g).filter(([,v]) => v>0).map(([k,v]) => `${v} ${k}`);
    if (arr.length) parts.push(`P${idx+1}: ` + arr.join(", "));
  });
  return parts.length ? `Resources — ${parts.join(" | ")}` : "No one produced.";
}

function initRes(){ return { brick:0, wood:0, wheat:0, sheep:0, ore:0 }; }
