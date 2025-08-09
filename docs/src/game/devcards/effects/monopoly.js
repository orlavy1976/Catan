import { makeBigButton, makeChip } from "../ui.js";

export function playMonopoly({ app, hud, state, resPanel }) {
  const RES = ["brick","wood","wheat","sheep","ore"];
  const overlay = new PIXI.Container(); overlay.zIndex = 10000;
  const dim = new PIXI.Graphics(); dim.beginFill(0x000000, 0.5).drawRect(0,0,app.renderer.width, app.renderer.height).endFill();
  overlay.addChild(dim);

  const panel = new PIXI.Container(); overlay.addChild(panel);
  const bg = new PIXI.Graphics();
  bg.beginFill(0x1f2937, 0.96).drawRoundedRect(0,0,480,220,16).endFill();
  bg.lineStyle({ width:2, color:0xffffff, alpha:0.18 }).drawRoundedRect(0,0,480,220,16);
  panel.addChild(bg);

  const title = new PIXI.Text("Monopoly — choose a resource", { fontFamily:"Georgia, serif", fontSize:20, fill:0xffffff });
  title.x = 20; title.y = 14; panel.addChild(title);

  let chosen = null;
  RES.forEach((k,i) => {
    const c = makeChip(k, () => { chosen = k; hud.showResult(`Monopoly: ${k}`); });
    c.container.x = 20 + i*90; c.container.y = 80;
    panel.addChild(c.container);
  });

  const confirm = makeBigButton("Confirm", () => {
    if (!chosen) { hud.showResult("Pick a resource."); return; }
    const meIdx = state.currentPlayer - 1;
    const me = state.players[meIdx];
    let taken = 0;
    state.players.forEach((p,i) => {
      if (i === meIdx) return;
      const amt = p.resources[chosen] || 0;
      if (amt > 0) {
        p.resources[chosen] -= amt;
        me.resources[chosen] = (me.resources[chosen]||0) + amt;
        taken += amt;
      }
    });
    resPanel?.updateResources?.(state.players);
    close();
    hud.showResult(`Monopoly: took ${taken} ${chosen} from others`);
  });
  confirm.x = 340; confirm.y = 170; panel.addChild(confirm);

  const cancel = makeBigButton("Cancel", () => close());
  cancel.x = 220; cancel.y = 170; panel.addChild(cancel);

  panel.x = (app.renderer.width - 480) / 2;
  panel.y = (app.renderer.height - 220) / 2;

  function close(){ app.stage.removeChild(overlay); }
  app.stage.addChild(overlay);
}
