export function enterRobberMove({ app, boardC, hud, state, tileSprites, robberSpriteRef }, onDone) {
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
    ring.lineStyle({ width: 4, color: 0x000000, alpha: 0.25 });
    ring.drawCircle(tileG.center.x, tileG.center.y, 60);
    boardC.addChild(ring);

    // hit
    const hit = new PIXI.Graphics();
    hit.beginFill(0x000000, 0.001);
    hit.drawCircle(tileG.center.x, tileG.center.y, 64);
    hit.endFill();
    hit.eventMode = "static";
    hit.cursor = "pointer";

    hit.on("pointertap", () => {
      // אם אין ספרייט (במקרה קצה), אלתר אחד קטן שחור
      let robber = robberSpriteRef.sprite;
      if (!robber) {
        robber = new PIXI.Graphics();
        robber.beginFill(0x000000);
        robber.drawCircle(0, 0, 14);
        robber.endFill();
        robberSpriteRef.sprite = robber;
        boardC.addChild(robber);
      }

      // מיקום + העלאה לראש
      robber.x = tileG.center.x;
      robber.y = tileG.center.y;
      robber.zIndex = 9999;         // מעל כל הגוסטס/טיילים
      boardC.addChild(robber);      // bring-to-front
      state.robberTile = idx;

      // ניקוי
      boardC.removeChild(ring);
      clear();

      onDone?.();
    });

    interactiveLayer.addChild(hit);
  });
}
