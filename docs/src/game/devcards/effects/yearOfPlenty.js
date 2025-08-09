import { makeBigButton, makeChip } from "../ui.js";

export function playYearOfPlenty({ app, hud, state, resPanel }) {
  const RES = ["brick","wood","wheat","sheep","ore"];
  const overlay = new PIXI.Container(); overlay.zIndex = 10000;
  const dim = new PIXI.Graphics(); dim.beginFill(0x000000, 0.5).drawRect(0,0,app.renderer.width, app.renderer.height).endFill();
  overlay.addChild(dim);

  const panel = new PIXI.Container(); overlay.addChild(panel);
  const bg = new PIXI.Graphics();
  bg.beginFill(0x1f2937, 0.96).drawRoundedRect(0,0,480,260,16).endFill();
  bg.lineStyle({ width:2, color:0xffffff, alpha:0.18 }).drawRoundedRect(0,0,480,260,16);
  panel.addChild(bg);

  const title = new PIXI.Text("Year of Plenty — pick 2 resources", { fontFamily:"Georgia, serif", fontSize:20, fill:0xffffff });
  title.x = 20; title.y = 14; panel.addChild(title);

  let picks = [];
  RES.forEach((k,i) => {
    const c = makeChip(k, () => {
      if (picks.length >= 2) return;
      picks.push(k);
      hud.showResult(`Picked: ${picks.join(", ")}`);
    });
    c.container.x = 20 + i*90; c.container.y = 80;
    panel.addChild(c.container);
  });

  const confirm = makeBigButton("Confirm", () => {
    if (picks.length < 2) { hud.showResult("Pick two resources."); return; }
    const me = state.players[state.currentPlayer - 1];
    picks.forEach(k => { me.resources[k] = (me.resources[k]||0)+1; });
    resPanel?.updateResources?.(state.players);
    close();
    hud.showResult(`Year of Plenty: +1 ${picks[0]}, +1 ${picks[1]}`);
  });
  confirm.x = 340; confirm.y = 210; panel.addChild(confirm);

  const cancel = makeBigButton("Cancel", () => close());
  cancel.x = 220; cancel.y = 210; panel.addChild(cancel);

  panel.x = (app.renderer.width - 480) / 2;
  panel.y = (app.renderer.height - 260) / 2;

  function close(){ app.stage.removeChild(overlay); }
  app.stage.addChild(overlay);
}
