import { PLAYER_COLORS } from "../config/constants.js";
import { patch } from "./stateStore.js";
import { updateLongestRoad } from "./longestRoad.js";

// צבע לשם לצורך באנר
function colorName(idx){ return ["Red","Blue","Orange","Green"][idx] || "P"; }

export function startSetupPhase({
  app, boardC, hud, resPanel, graph, builder, layout, state, onFinish, continueFromSave = false
}) {
  // מצב פתיחה של השלב (רק אם לא ממשיכים מעדכון שמור)
  if (!continueFromSave) {
    patch(s => {
      s.phase = "setup";
      s.setup.placing = "settlement";
      s.setup.lastSettlementVertex = null;
    });
  }

  hud.setBanner(`Setup — Player ${state.currentPlayer} (${colorName(currentPlayer().colorIdx)})`);
  hud.setBottom(`Setup: Place Settlement`);
  hud.setRollEnabled(false);
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);

  // אוספים מקומיים להצבה
  const occupiedVertices = new Set();
  const occupiedEdges = new Set();
  const interactiveLayer = new PIXI.Container();
  boardC.addChild(interactiveLayer);

  // אתחול רכיבי המצב מהנתונים הקיימים (ליעדכונים שמורים)
  state.players.forEach(player => {
    player.settlements?.forEach(vId => {
      occupiedVertices.add(vId);
      builder.placeSettlement(vId, player.colorIdx);
    });
    player.roads?.forEach(eId => {
      occupiedEdges.add(eId);
      builder.placeRoad(eId, player.colorIdx);
    });
  });

  function clearInteractions(){
    interactiveLayer.removeChildren();
    builder.clearGhosts();
  }

  function currentPlayer(s = state) {
    return s.players[s.currentPlayer - 1];
  }

  // תחליף לפנייה ראשונה - בדיקה איך לוגיקה להמשך מצב שמור
  if (continueFromSave && state.setup.placing) {
    if (state.setup.placing === "settlement") {
      hud.setBottom(`Setup: Place Settlement`);
      drawSettlementChoices();
    } else if (state.setup.placing === "road") {
      hud.setBottom(`Setup: Place Road`);
      drawRoadChoices();
    }
  } else {
    // ללא עדכון שמור - התחלה רגילה
    drawSettlementChoices();
  }

  // סדר נחש: 1→2→3→4→4→3→2→1
  function nextPlayerSetup() {
    let finished = false;

    patch(s => {
      const p = s.currentPlayer;
      if (s.setup.round === 1) {
        if (p < s.players.length) {
          s.currentPlayer++;
        } else {
          s.setup.round = 2;
          s.currentPlayer = s.players.length; // מתחילים הפוך מהאחרון
        }
      } else {
        if (p > 1) {
          s.currentPlayer--;
        } else {
          finished = true; // סימון סיום לפני שנוגעים ב-placing
        }
      }

      if (!finished) {
        s.setup.placing = "settlement";
        s.setup.lastSettlementVertex = null;
      }
    });

    if (finished) {
      return finishSetup(); // יפעיל onFinish ב-main וידליק את ה-Roll
    }

    hud.setBanner(`Setup — Player ${state.currentPlayer} (${colorName(currentPlayer().colorIdx)})`);
    hud.setBottom(`Setup: Place Settlement`);
    drawSettlementChoices();
  }


  function finishSetup() {
    clearInteractions();
    onFinish?.(); // main מטפל בהמשך המעבר ל-"play"
  }

  function drawSettlementChoices(){
    clearInteractions();
    hud.setRollEnabled(false);
    hud.setEndEnabled(false);

    const legals = builder.legalSettlementVertices(occupiedVertices);

    // היילייט
    legals.forEach(vId =>
      builder.drawSettlementGhost(vId, PLAYER_COLORS[currentPlayer().colorIdx], 0.35)
    );

    // האזנה להיטים
    legals.forEach(vId => {
      const v = graph.vertices[vId];
      const hit = new PIXI.Graphics();
      hit.beginFill(0x000000, 0.001);
      hit.drawCircle(v.x, v.y, 18);
      hit.endFill();
      hit.eventMode = 'static';
      hit.cursor = 'pointer';
      hit.on('pointertap', () => {
        // שמירה ב-state (דרך patch) + ציור
        patch(s => {
          s.players[s.currentPlayer - 1].settlements.push(vId);
          s.setup.placing = "road";
          s.setup.lastSettlementVertex = vId;
        });
        builder.placeSettlement(vId, currentPlayer().colorIdx);
        occupiedVertices.add(vId);

        // יישוב שני מקבל משאבים מיד
        if (state.setup.round === 2) {
          awardInitialResourcesForSettlement({ vertexId: vId, layout, graph, state, hud });
        }

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
        patch(s => { s.players[s.currentPlayer - 1].roads.push(eId); });
        builder.placeRoad(eId, currentPlayer().colorIdx);
        occupiedEdges.add(eId);
        
        // Update longest road calculation after placing setup road
        const { changed, owner, length } = updateLongestRoad(state, graph);
        if (changed) {
          console.log(`🛤️ Setup: Longest road updated: Player ${(owner ?? -1) + 1} with ${length} roads`);
        }
        
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

  // מעניק משאבי פתיחה אחרי היישוב השני — דרך patch בלבד
  function awardInitialResourcesForSettlement({ vertexId, layout, graph, state, hud }) {
    const v = graph.vertices[vertexId];
    const gained = { brick:0, wood:0, wheat:0, sheep:0, ore:0 };

    v.tiles.forEach(tileIdx => {
      const kind = layout[tileIdx].kind;
      if (kind === "desert") return;
      gained[kind] += 1;
    });

    patch(s => {
      const p = s.players[s.currentPlayer - 1];
      for (const k in gained) p.resources[k] += gained[k];
    });

    const parts = Object.entries(gained)
      .filter(([,n]) => n > 0)
      .map(([k,n]) => `${n} ${k}`);
    if (parts.length) hud.showResult(`Setup gain — P${state.currentPlayer}: ${parts.join(", ")}`);
  }

  // סטארט
  drawSettlementChoices();
}
