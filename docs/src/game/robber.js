import { makeButton } from "../catan/ui/materialButton.js";
import { RES_KEYS } from "../config/constants.js";

export function enterRobberMove({ app, boardC, hud, state, tileSprites, robberSpriteRef, graph, layout, resPanel }, onDone) {
  const interactiveLayer = new PIXI.Container();
  boardC.addChild(interactiveLayer);

  // לוודא שניתן לשלוט בסדר ציור
  boardC.sortableChildren = true;

  function clear() {
    interactiveLayer.removeChildren();
    boardC.removeChild(interactiveLayer);
  }

  tileSprites.forEach((tileG, idx) => {
    if (idx === state.robberTile) return;

    // היילייט
    const ring = new PIXI.Graphics();
    ring.lineStyle({ width: 4, color: 0x000000, alpha: 0.35 });
    ring.drawCircle(tileG.center.x, tileG.center.y, 56);
    ring.alpha = 0.8;
    interactiveLayer.addChild(ring);

    // שכבת היטים
    const hit = new PIXI.Graphics();
    hit.beginFill(0x000000, 0.001);
    hit.drawCircle(tileG.center.x, tileG.center.y, 60);
    hit.endFill();
    hit.interactive = true;
    hit.buttonMode = true;
    hit.on("pointertap", () => {
      // להזיז את השודד
      const robber = robberSpriteRef.sprite;
      robber.x = tileG.center.x;
      robber.y = tileG.center.y;
      robber.zIndex = 9999;
      boardC.addChild(robber);
      state.robberTile = idx;

      // ניקוי
      boardC.removeChild(ring);
      clear();

      // אחרי הזזה — גניבה (מעבירים גם app כדי להוסיף overlay לבמה)
      handleSteal({ app, hud, state, tileIdx: idx, graph, resPanel }, () => {
        onDone?.();
      });
    });

    interactiveLayer.addChild(hit);
  });
}

function handleSteal({ app, hud, state, tileIdx, graph, resPanel }, done) {
  const currentIdx = state.currentPlayer - 1;

  // מציאת שחקנים צמודים לטייל
  const vertexIds = [];
  for (let vid = 0; vid < graph.vertices.length; vid++) {
    const v = graph.vertices[vid];
    if (v.tiles && v.tiles.has && v.tiles.has(tileIdx)) {
      vertexIds.push(vid);
    }
  }

  const owners = new Set();
  state.players.forEach((p, idx) => {
    p.settlements.forEach(v => { if (vertexIds.includes(v)) owners.add(idx); });
    (p.cities || []).forEach(v => { if (vertexIds.includes(v)) owners.add(idx); });
  });

  // מסננים את השחקן הנוכחי, ומשאירים רק מי שיש לו קלפים
  const candidates = Array.from(owners)
    .filter(idx => idx !== currentIdx && totalCards(state.players[idx].resources) > 0);

  if (candidates.length === 0) {
    hud.showResult("Robber moved — no one to steal from.");
    done?.();
    return;
  }

  if (candidates.length === 1) {
    performSteal(state, currentIdx, candidates[0], resPanel, hud);
    done?.();
    return;
  }

  // בחירת קורבן כשהרבה מועמדים: כפתורים זמניים על הבמה
  hud.setBottom("Choose a player to steal from");
  const overlay = new PIXI.Container();
  overlay.zIndex = 10000;

  const startX = 240, startY = 100, gap = 12;
  candidates.forEach((idx, i) => {
    const btn = makeButton(`Steal from P${idx+1}`, 200);
    btn.container.x = startX + i*(btn.width + gap);
    btn.container.y = startY;
    btn.onClick(() => {
      app.stage.removeChild(overlay);
      performSteal(state, currentIdx, idx, resPanel, hud);
      done?.();
    });
    overlay.addChild(btn.container);
  });

  // הוספת ה-Overlay לבמה — כאן היה הבאג (app היה undefined)
  app.stage.addChild(overlay);
}

function performSteal(state, fromIdx, toIdx, resPanel, hud) {
  // מגרילים משאב אקראי מהקורבן
  const victim = state.players[toIdx];
  const thief = state.players[fromIdx];
  const bag = [];
  RES_KEYS.forEach(k => {
    for (let n = 0; n < (victim.resources[k] || 0); n++) bag.push(k);
  });
  if (bag.length === 0) {
    hud.showResult(`Robber: P${toIdx+1} had no cards.`);
    return;
  }
  const pick = bag[Math.floor(Math.random() * bag.length)];
  victim.resources[pick]--;
  thief.resources[pick] = (thief.resources[pick] || 0) + 1;

  resPanel?.update?.(state.players);
  hud.showResult(`Robber: stole 1 ${pick} from P${toIdx+1}`);
}

function totalCards(res) {
  let t = 0;
  RES_KEYS.forEach(k => t += res[k] || 0);
  return t;
}
