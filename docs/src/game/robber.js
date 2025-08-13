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

    // היילייט עם Material Design עם אפקט זוהר
    const ring = new PIXI.Graphics();
    
    // צל חיצוני לעומק
    ring.lineStyle({ width: 6, color: 0x000000, alpha: 0.15 });
    ring.drawCircle(tileG.center.x, tileG.center.y, 58);
    
    // קו עיקרי בצבע חם
    ring.lineStyle({ width: 3, color: 0xff6b35, alpha: 0.9 });
    ring.drawCircle(tileG.center.x, tileG.center.y, 56);
    
    // קו פנימי בהיר לאפקט זוהר
    ring.lineStyle({ width: 1, color: 0xffa726, alpha: 0.7 });
    ring.drawCircle(tileG.center.x, tileG.center.y, 54);
    
    ring.alpha = 0.0; // התחלה שקופה לאנימציה
    interactiveLayer.addChild(ring);
    
    // אנימציית fade-in חלקה
    let fadeProgress = 0;
    const fadeIn = () => {
      fadeProgress += 0.05;
      ring.alpha = Math.min(fadeProgress, 0.85);
      if (fadeProgress < 0.85) {
        requestAnimationFrame(fadeIn);
      }
    };
    requestAnimationFrame(fadeIn);

    // שכבת היטים
    const hit = new PIXI.Graphics();
    hit.beginFill(0x000000, 0.001);
    hit.drawCircle(tileG.center.x, tileG.center.y, 60);
    hit.endFill();
    hit.interactive = true;
    hit.buttonMode = true;
    hit.on("pointertap", () => {
      // אנימציה חלקה להזזת השודד
      const robber = robberSpriteRef.sprite;
      const startX = robber.x;
      const startY = robber.y;
      const targetX = tileG.center.x;
      const targetY = tileG.center.y;
      
      // אנימציה של תזוזה עם easing
      const animationDuration = 300; // ms
      let startTime = null;
      
      const animateRobber = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        // לרפרף את השודד במהלך התנועה
        robber.alpha = 0.7 + Math.sin(elapsed * 0.02) * 0.1;
        
        // חישוב מיקום נוכחי
        robber.x = startX + (targetX - startX) * easeOut;
        robber.y = startY + (targetY - startY) * easeOut;
        
        if (progress < 1) {
          requestAnimationFrame(animateRobber);
        } else {
          // סיום האנימציה עם אפקט הופעה דרמטי
          robber.x = targetX;
          robber.y = targetY;
          robber.alpha = 1;
          robber.zIndex = 9999;
          boardC.addChild(robber);
          state.robberTile = idx;

          // אפקט זוהר רגעי במיקום החדש
          const flashEffect = new PIXI.Graphics();
          flashEffect.beginFill(0xff4444, 0.6);
          flashEffect.drawCircle(targetX, targetY, 30);
          flashEffect.endFill();
          boardC.addChild(flashEffect);
          
          // אנימציית דהייה של האפקט
          let flashAlpha = 0.6;
          const fadeFlash = () => {
            flashAlpha -= 0.03;
            flashEffect.alpha = flashAlpha;
            flashEffect.scale.x = flashEffect.scale.y = 1 + (0.6 - flashAlpha) * 2;
            
            if (flashAlpha <= 0) {
              boardC.removeChild(flashEffect);
            } else {
              requestAnimationFrame(fadeFlash);
            }
          };
          requestAnimationFrame(fadeFlash);

          // ניקוי
          boardC.removeChild(ring);
          clear();

          // אחרי הזזה — גניבה (מעבירים גם app כדי להוסיף overlay לבמה)
          handleSteal({ app, hud, state, tileIdx: idx, graph, resPanel }, () => {
            onDone?.();
          });
        }
      };
      
      requestAnimationFrame(animateRobber);
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
