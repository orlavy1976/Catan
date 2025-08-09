// ------- Config -------
const HEX_R = 58;                   // hex radius in px
const TILE_TYPES = ["field","pasture","forest","hill","mountain","desert"];

// ------- Pixi App -------
const app = new PIXI.Application({ background: "#0e0f12", antialias: true });
document.body.appendChild(app.view);

// Root containers (create BEFORE wiring resize)
const stage = app.stage;
const board = new PIXI.Container();
stage.addChild(board);

// Wire resize after board exists
addEventListener('resize', resize);

// ------- Axial hex math (flat-topped) -------
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

// ------- Create Catan-shaped layout (3-4-5-4-3) -------
function catanAxials(){
  const rows = [
    {r:-2, n:3},
    {r:-1, n:4},
    {r: 0, n:5},
    {r: 1, n:4},
    {r: 2, n:3},
  ];
  const list = [];
  for(const {r,n} of rows){
    const qStart = -Math.floor((n-1)/2);
    for(let i=0;i<n;i++){
      list.push({ q: qStart + i, r });
    }
  }
  return list;
}

// Simple color map (replace with textures later)
const COLORS = {
  field:"#c8e16b", pasture:"#a6d67a", forest:"#3e7b3f",
  hill:"#c4824a", mountain:"#8f8f8f", desert:"#e2cd8f"
};

// ------- Model -------
let tiles = catanAxials().map((ax,i)=>({
  id:`${ax.q},${ax.r}`,
  ...ax,
  type: TILE_TYPES[i % TILE_TYPES.length], // placeholder assignment
  number: null,
}));

// ------- Draw -------
const gfxById = new Map();

function drawBoard(){
  board.removeChildren();
  gfxById.clear();

  // center the board on screen
  const positions = tiles.map(t => axialToPixel(t.q, t.r));
  const minX = Math.min(...positions.map(p => p.x-HEX_R));
  const maxX = Math.max(...positions.map(p => p.x+HEX_R));
  const minY = Math.min(...positions.map(p => p.y-HEX_R));
  const maxY = Math.max(...positions.map(p => p.y+HEX_R));
  const boardCenter = { x: (minX+maxX)/2, y: (minY+maxY)/2 };

  const screenCenter = { x: app.renderer.width/2, y: app.renderer.height/2 };
  const offset = { x: screenCenter.x - boardCenter.x, y: screenCenter.y - boardCenter.y };

  for(const t of tiles){
    const {x,y} = axialToPixel(t.q, t.r);
    const g = new PIXI.Graphics();
    g.eventMode = 'static';
    g.cursor = 'pointer';
    g.position.set(x+offset.x, y+offset.y);

    // tile fill
    g.beginFill(COLORS[t.type] ? PIXI.utils.string2hex(COLORS[t.type]) : 0x888888);
    g.lineStyle(3, 0x000000, 0.45);
    g.drawPolygon(polygonPoints(0,0,HEX_R));
    g.endFill();

    // hover outline
    g.on('pointerover', ()=>{
      g.lineStyle(5, 0xffffff, 0.8);
      g.clear();
      g.beginFill(COLORS[t.type] ? PIXI.utils.string2hex(COLORS[t.type]) : 0x888888);
      g.drawPolygon(polygonPoints(0,0,HEX_R));
      g.endFill();
      hint(`(${t.q},${t.r}) ${t.type}`);
    });
    g.on('pointerout', ()=>{
      g.clear();
      g.beginFill(COLORS[t.type] ? PIXI.utils.string2hex(COLORS[t.type]) : 0x888888);
      g.lineStyle(3, 0x000000, 0.45);
      g.drawPolygon(polygonPoints(0,0,HEX_R));
      g.endFill();
      hint('');
    });

    // click to rotate terrain (placeholder action)
    g.on('pointertap', ()=>{
      const i = TILE_TYPES.indexOf(t.type);
      t.type = TILE_TYPES[(i+1)%TILE_TYPES.length];
      drawBoard();
    });

    // label
    const label = new PIXI.Text({
      text: t.type,
      style: { fill:"#111", fontSize: 14, fontFamily:"system-ui", fontWeight: "600" }
    });
    label.anchor.set(0.5);
    g.addChild(label);

    board.addChild(g);
    gfxById.set(t.id, g);
  }
}

function resize(){
  // Guard in case resize fires very early
  if (!app?.renderer || !board) return;
  app.renderer.resize(innerWidth, innerHeight);
  drawBoard();
}

// UI wire-up
const shuffleBtn = document.getElementById('shuffle');
if (shuffleBtn){
  shuffleBtn.onclick = ()=>{
    tiles = tiles.map(t => ({...t, type: TILE_TYPES[Math.floor(Math.random()*TILE_TYPES.length)]}));
    drawBoard();
  };
}

function hint(s){
  const el = document.getElementById('hint');
  if (el) el.textContent = s;
}

// boot
resize();
