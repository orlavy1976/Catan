// Boots Pixi and exports the app + a root container we can scale/position.
export let app;
export let root;

export function initApp() {
  const viewParent = document.getElementById('app');

  app = new PIXI.Application({
    resizeTo: window,
    antialias: true,
    background: 0x1e293b, // Enhanced darker background that complements dialog colors
  });

  viewParent.appendChild(app.view);

  root = new PIXI.Container();
  app.stage.addChild(root);

  return { app, root };
}
