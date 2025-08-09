// docs/src/catan/scorePanel.js

export function createScorePanel(app, state) {
  const panel = new PIXI.Container();
  panel.zIndex = 4000;

  const bg = new PIXI.Graphics();
  panel.addChild(bg);

  const title = new PIXI.Text("Score", {
    fontFamily: "Georgia, serif",
    fontSize: 18,
    fill: 0xffffff,
    stroke: 0x000000, strokeThickness: 3
  });
  panel.addChild(title);

  const rowsC = new PIXI.Container();
  panel.addChild(rowsC);

  function layout() {
    const pad = 16;
    title.x = pad; 
    title.y = pad;

    rowsC.x = pad;
    rowsC.y = title.y + title.height + 6;

    const width = 220;
    const height = rowsC.height + title.height + pad * 2 + 8;

    bg.clear();
    bg.beginFill(0x111827, 0.85);
    bg.drawRoundedRect(0, 0, width, Math.max(80, height), 12);
    bg.endFill();
    bg.lineStyle(2, 0xffffff, 0.12);
    bg.drawRoundedRect(0, 0, width, Math.max(80, height), 12);

    // ✅ Move to bottom-right
    panel.x = app.renderer.width - width - 20; // 20px from right
    panel.y = app.renderer.height - Math.max(80, height) - 20; // 20px from bottom
  }

  layout();
  window.addEventListener("resize", layout);

  function setScores(scoreRows) {
    rowsC.removeChildren();
    let y = 0;
    scoreRows.forEach((row) => {
      const line = new PIXI.Container();
      rowsC.addChild(line);

      const name = `P${row.playerIdx+1}`;
      const label = new PIXI.Text(`${name}: ${row.total} VP`, {
        fontFamily: "Arial", fontSize: 16, fill: 0xffffaa
      });
      label.x = 0; label.y = y;
      line.addChild(label);

      const bits = [];
      if (row.settlements) bits.push(`${row.settlements}×S`);
      if (row.cities) bits.push(`${row.cities}×C`);
      if (row.devVP) bits.push(`${row.devVP}×VP`);
      if (row.hasLargestArmy) bits.push("LA+2");
      if (row.hasLongestRoad) bits.push("LR+2");

      const detail = new PIXI.Text(bits.join("  "), {
        fontFamily: "Arial", fontSize: 12, fill: 0xdddddd
      });
      detail.x = 0; detail.y = y + 20;
      line.addChild(detail);

      y += 40;
    });

    layout();
  }

  return { container: panel, setScores };
}
