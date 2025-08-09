import { PLAYER_COLORS } from "../catan/build.js";

// צבע לשם לצורך באנר
function colorName(idx){ return ["Red","Blue","Orange","Green"][idx] || "P"; }

export function startSetupPhase({
  app, boardC, hud, resPanel, graph, builder, layout, state, onFinish
}) {
  state.phase = "setup";
  hud.setBanner(`Setup — Player ${state.currentPlayer} (${colorName(currentPlayer(state).colorIdx)})`);
  hud.setBottom(`Setup: Place Settlement`);
  hud.setRollEnabled(false);
  hud.setEndEnabled(false);

  const occupiedVertices = new Set();
  const occupiedEdges = new Set();
  const interactiveLayer = new PIXI.Container();
  boardC.addChild(interactiveLayer);

  function clearInteractions(){
    interactiveLayer.removeChildren();
    builder.clearGhosts();
  }

  function currentPlayer(stateRef = state) {
    return stateRef.players[stateRef.currentPlayer - 1];
  }

  function nextPlayerSetup() {
    const p = state.currentPlayer;
    if (state.setup.round === 1) {
      if (p < state.players.length) state.currentPlayer++;
      else { state.setup.round = 2; state.currentPlayer = state.players.length; }
    } else {
      if (p > 1) state.currentPlayer--;
      else return finishSetup();
    }
    resPanel.setCurrent(state.currentPlayer - 1);
    state.setup.placing = "settlement";
    state.setup.lastSettlementVertex = null;
    hud.setBanner(`Setup — Player ${state.currentPlayer} (${colorName(currentPlayer().colorIdx)})`);
    hud.setBottom(`Setup: Place Settlement`);
    drawSettlementChoices();
  }

  function finishSetup() {
    clearInteractions();
    onFinish?.();
  }

  function drawSettlementChoices(){
    clearInteractions();
    hud.setRollEnabled(false);
    hud.setEndEnabled(false);

    const legals = builder.legalSettlementVertices(occupiedVertices);
    legals.forEach(vId =>
      builder.drawSettlementGhost(vId, PLAYER_COLORS[currentPlayer().colorIdx], 0.35)
    );

    legals.forEach(vId => {
      const v = graph.vertices[vId];
      const hit = new PIXI.Graphics();
      hit.beginFill(0x000000, 0.001);
      hit.drawCircle(v.x, v.y, 18);
      hit.endFill();
      hit.eventMode = 'static';
      hit.cursor = 'pointer';
      hit.on('pointertap', () => {
        builder.placeSettlement(vId, currentPlayer().colorIdx);
        currentPlayer().settlements.push(vId);
        occupiedVertices.add(vId);

        // ביישוב השני מקבלים משאבים
        if (state.setup.round === 2) {
          awardInitialResourcesForSettlement({ vertexId: vId, layout, graph, state, hud, resPanel });
        }

        state.setup.placing = "road";
        state.setup.lastSettlementVertex = vId;
        hud.setBottom(`Setup: Place Road`);
        drawRoadChoices();
      });
      interactiveLayer.addChild(hit);
    });
  }

  function drawRoadChoices(){
    clearInteractions();
    hud.setRollEnabled(false);
    hud.setEndEnabled(false);

    const vId = state.setup.lastSettlementVertex;
    const legals = builder.legalRoadEdges(occupiedEdges, occupiedVertices, vId);
    legals.forEach(eId =>
      builder.drawRoadGhost(eId, PLAYER_COLORS[currentPlayer().colorIdx], 0.35)
    );

    legals.forEach(eId => {
      const e = graph.edges[eId];
      const a = graph.vertices[e.a], b = graph.vertices[e.b];

      const hit = makeThickEdgeHit(a, b, 10);
      hit.eventMode = 'static';
      hit.cursor = 'pointer';
      hit.on('pointertap', () => {
        builder.placeRoad(eId, currentPlayer().colorIdx);
        currentPlayer().roads.push(eId);
        occupiedEdges.add(eId);
        nextPlayerSetup();
      });
      interactiveLayer.addChild(hit);
    });
  }

  function makeThickEdgeHit(a, b, half=10){
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len;
    const p1 = [a.x + nx*half, a.y + ny*half];
    const p2 = [b.x + nx*half, b.y + ny*half];
    const p3 = [b.x - nx*half, b.y - ny*half];
    const p4 = [a.x - nx*half, a.y - ny*half];
    const poly = new PIXI.Polygon([...p1, ...p2, ...p3, ...p4]);
    const g = new PIXI.Graphics();
    g.hitArea = poly;
    g.beginFill(0x000000, 0.001);
    g.drawPolygon(poly.points);
    g.endFill();
    return g;
  }

  // award function (לשימוש פנימי כאן)
  function awardInitialResourcesForSettlement({ vertexId, layout, graph, state, hud, resPanel }) {
    const v = graph.vertices[vertexId];
    const p = currentPlayer();
    const gained = { brick:0, wood:0, wheat:0, sheep:0, ore:0 };
    v.tiles.forEach(tileIdx => {
      const kind = layout[tileIdx].kind;
      if (kind === "desert") return;
      gained[kind] += 1;
      p.resources[kind] += 1;
    });
    resPanel.updateResources(state.players);
    const parts = ["brick","wood","wheat","sheep","ore"]
      .filter(k => gained[k] > 0)
      .map(k => `${gained[k]} ${k}`);
    if (parts.length) hud.showResult(`Setup gain — P${p.id}: ${parts.join(", ")}`);
  }

  // start
  drawSettlementChoices();
}
