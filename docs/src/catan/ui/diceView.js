export function makeDiceView() {
  const container = new PIXI.Container();

  function drawDie(val, x) {
    const c = new PIXI.Container();
    c.x = x; c.y = 70; // מיקום פנימי של כל קובייה בתוך ה-container של הקוביות

    const g = new PIXI.Graphics();
    g.beginFill(0xf1f1f1);
    g.drawRoundedRect(-28, -28, 56, 56, 10);
    g.endFill();
    g.lineStyle({ width: 2, color: 0x222222, alpha: 0.35 });
    g.drawRoundedRect(-28, -28, 56, 56, 10);
    c.addChild(g);

    const pip = (px, py) => {
      const p = new PIXI.Graphics();
      p.beginFill(0x222222);
      p.drawCircle(px, py, 4);
      p.endFill();
      c.addChild(p);
    };

    const map = {
      1: [[0,0]],
      2: [[-12,-12],[12,12]],
      3: [[-12,-12],[0,0],[12,12]],
      4: [[-12,-12],[12,-12],[-12,12],[12,12]],
      5: [[-12,-12],[12,-12],[0,0],[-12,12],[12,12]],
      6: [[-12,-12],[12,-12],[-12,0],[12,0],[-12,12],[12,12]],
    };
    map[val].forEach(([px,py]) => pip(px,py));
    return c;
  }

  let shaker = null;
  let pendingValues = null; // Store values to set after shake completes

  async function shake(ms = 600, finalD1 = null, finalD2 = null) {
    const start = performance.now();
    container.removeChildren();
    container.addChild(drawDie(1, 40), drawDie(1, 110));

    if (!shaker) shaker = new PIXI.Ticker();
    shaker.add(() => {
      const t = (performance.now() - start) / 1000;
      const v1 = 1 + ((Math.random()*6)|0);
      const v2 = 1 + ((Math.random()*6)|0);
      container.removeChildren();
      container.addChild(drawDie(v1, 40), drawDie(v2, 110));
      container.scale.set(1 + Math.sin(t*20)*0.02);
    });
    shaker.start();
    await new Promise(r => setTimeout(r, ms));
    shaker.stop();
    shaker = null; // Reset shaker
    container.scale.set(1);
    
    // Set final values if provided, or use pending values
    const d1 = finalD1 !== null ? finalD1 : pendingValues?.d1;
    const d2 = finalD2 !== null ? finalD2 : pendingValues?.d2;
    
    if (d1 !== null && d1 !== undefined && d2 !== null && d2 !== undefined) {
      container.removeChildren();
      container.addChild(drawDie(d1, 40), drawDie(d2, 110));
      pendingValues = null; // Clear pending values
    }
  }

  function set(d1, d2) {
    if (shaker && shaker.started) {
      // If shake is in progress, store values to set after shake completes
      pendingValues = { d1, d2 };
      return;
    }
    
    // Set immediately if not shaking
    container.removeChildren();
    container.addChild(drawDie(d1, 40), drawDie(d2, 110));
  }

  function clear() {
    container.removeChildren();
  }

  return { container, shake, set, clear };
}
