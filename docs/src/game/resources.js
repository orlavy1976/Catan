const KEYS = ["brick","wood","wheat","sheep","ore"];

export function distributeResources({ sum, state, layout, graph }) {
  const eligible = [];
  for (let i = 0; i < layout.length; i++) {
    if (i === state.robberTile) continue;
    const t = layout[i];
    if (t.token === sum && t.kind !== "desert") eligible.push(i);
  }

  const ownerByVertex = new Map();
  state.players.forEach((p, idx) => {
    p.settlements.forEach(vId => ownerByVertex.set(vId, idx));
  });

  const gainByPlayer = [initRes(), initRes(), initRes(), initRes()];
  eligible.forEach(tileIdx => {
    const kind = layout[tileIdx].kind;
    graph.vertices.forEach(v => {
      if (!v.tiles.has(tileIdx)) return;
      const owner = ownerByVertex.get(v.id);
      if (owner != null) gainByPlayer[owner][kind] += 1; // settlement=1 (cities later)
    });
  });

  state.players.forEach((p, idx) => {
    KEYS.forEach(k => p.resources[k] += gainByPlayer[idx][k]);
  });

  return gainByPlayer;
}

export function summarizeGain(gainByPlayer){
  const parts = [];
  gainByPlayer.forEach((g, idx) => {
    const arr = Object.entries(g).filter(([_,v]) => v>0).map(([k,v]) => `${v} ${k}`);
    if (arr.length) parts.push(`P${idx+1}: ` + arr.join(", "));
  });
  return parts.length ? `Resources — ${parts.join(" | ")}` : "No one produced.";
}

function initRes(){ return { brick:0, wood:0, wheat:0, sheep:0, ore:0 }; }
