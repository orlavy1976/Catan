// ------- Config -------
const HEX_R = 48;                   // hex radius in px
const COLS = 5, ROWS = 5;           // board size (adjust to Catan layout later)
const TILE_TYPES = ["field","pasture","forest","hill","mountain","desert","sea"];
// quick colors; replace with textures when you add assets
const COLORS = {
  field:"#c8e16b", pasture:"#a6d67a", forest:"#3e7b3f",
  hill:"#c4824a", mountain:"#8f8f8f", desert:"#e2cd8f", sea:"#4aa6d6"
};

// ------- Pixi App -------
const app = new PIXI.Application();
document.body.appendChild(app.view);
resize(); addEventListener('resize', resize);

const stage = app.stage;
stage.eventMode = 'static';
stage.hitArea = app.screen;

// ------- Axial hex math -------
function axialToPixel(q,r){
  const x = HEX_R * (Math.sqrt(3)*q + Math.sqrt(3)/2*r);
  const y = HEX_R * (3/2*r);
  return {x,y};
}
function polygonPoints(cx,cy,r){
  const pts=[];
  for(let i=0;i<6;i++){
    const a = Math.PI/6 + i * Math.PI/3; // flat-topped
    pts.push(cx + r*Math.cos(a), cy + r*Math.sin(a));
  }
  return pts;
}
function cubeRound(x,y,z){
  let rx=Math.round(x), ry=Math.round(y), rz=Math.round(z);
  const x_diff=Math.abs(rx-x), y_diff=Math.abs(ry-y), z_diff=Math.abs(rz-z);
  if(x_diff>y_diff && x_diff>z_diff) rx = -ry-rz;
  else if(y_diff>z_diff)            ry = -rx-rz;
  else                              rz = -rx-ry;
  return {x:rx,y:ry,z:rz};
}
function pixelToAxial(px,py){
  const q = (Math.sqrt(3)/3*px - 1/3*py)/HEX_R;
  const r = (2/3*py)/HEX_R;
  const cube = cubeRound(q, -q-r, r);
  return {q:cube.x, r:cube.z};
}

// ------- Board model -------
let tiles = makeBoard();
function makeBoard(){
  // Simple diamond/rect grid; swap to exact Catan layout later
  const list=[];
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const q = c - Math.floor(r/2);
      const type = TILE_TYPES[(r*COLS+c)%TILE_TYPES.length];
      list.push({id:`${q},${r}`, q, r, type, number:null});
    }
  }
  return list;
}

// ------- Render tiles -------
const board = new PIXI.Container();
stage.addChild(board);
const gfxById = new Map();

function drawBoard(){
  board.removeChildren();
  gfxById.clear();
  const center = {x: app.screen.width/2, y: app.screen.height/2};
  const bounds = getBoardBounds(tiles);
  const offset = {x: center.x - (bounds.minX+bounds.maxX)/2, y: center.y - (bounds.minY+bounds.maxY)/2};

  for(const t of tiles){
    const {x,y} = axialToPixel(t.q, t.r);
    const g = new PIXI.Graphics();
    g.cursor = 'pointer';
    g.eventMode = 'static';
    g.position.set(x+offset.x, y+offset.y);

    // fill
    g.beginFill(PIXI.Color.from(COLORS[t.type] || "#888"));
    g.lineStyle(2, 0x000000, 0.35);
    g.drawPolygon(polygonPoints(0,0,HEX_R));
    g.endFill();

    // label
    const label = new PIXI.Text({text: t.type, style: {fill:"#111", fontSize: 12, fontFamily:"system-ui"}});
    label.anchor.set(0.5); label.position.set(0, 0);
    g.addChild(label);

    // hover glow
    g.on('pointerover', () => {
      g.filters = [new PIXI.filters.GlowFilter({distance:8, outerStrength:2})];
      hint(`(${t.q},${t.r}) ${t.type}`);
    });
    g.on('pointerout', () => { g.filters = null; hint(''); });

    // select
    g.on('pointertap', () => {
      // Example action: toggle to next terrain (placeholder for real rules)
      const idx = TILE_TYPES.indexOf(t.type);
      t.type = TILE_TYPES[(idx+1)%TILE_TYPES.length];
      drawBoard();
    });

    board.addChild(g);
    gfxById.set(t.id, g);
  }
}
function getBoardBounds(list){
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const t of list){
    const p = axialToPixel(t.q,t.r);
    minX = Math.min(minX, p.x-HEX_R); maxX=Math.max(maxX, p.x+HEX_R);
    minY = Math.min(minY, p.y-HEX_R); maxY=Math.max(maxY, p.y+HEX_R);
  }
  return {minX,maxX,minY,maxY};
}

drawBoard();

// ------- UI -------
document.getElementById('shuffle').onclick = () => {
  tiles = tiles.map(t => ({...t, type: TILE_TYPES[Math.floor(Math.random()*TILE_TYPES.length)]}));
  drawBoard();
};
function hint(s){ document.getElementById('hint').textContent = s; }

// ------- Resize -------
function resize(){
  const w = innerWidth, h = innerHeight;
  app.renderer.resize(w, h);
  if(board) drawBoard();
}
