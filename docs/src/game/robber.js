export function enterRobberMove({ app, boardC, hud, state, tileSprites, robberSpriteRef }, onDone) {
  const interactiveLayer = new PIXI.Container();
  boardC.addChild(interactiveLayer);

  function clear() {
    interactiveLayer.removeChildren();
    boardC.removeChild(interactiveLayer);
  }

  tileSprites.forEach((tileG, idx) => {
    if (idx === state.robberTile) return;

    const hit = new PIXI.Graphics();
    hit.beginFill(0x000000, 0.001);
    hit.drawCircle(tileG.center.x, tileG.center.y, 64);
    hit.endFill();
    hit.eventMode = 'static';
    hit.cursor = 'pointer';

    const ring = new PIXI.Graphics();
    ring.lineStyle({ width: 4, color: 0x000000, alpha: 0.25 });
    ring.drawCircle(tileG.center.x, tileG.center.y, 60);
    boardC.addChild(ring);

    hit.on('pointertap', () => {
      robberSpriteRef.sprite.x = tileG.center.x;
      robberSpriteRef.sprite.y = tileG.center.y;
      state.robberTile = idx;

      boardC.removeChild(ring);
      clear();
      onDone?.();
    });

    interactiveLayer.addChild(hit);
  });
}
