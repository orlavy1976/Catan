// Procedural textures using Pixi RenderTextures – no external images.
export function createTextures(app) {
  const makeRT = (w, h, drawFn) => {
    const g = new PIXI.Graphics();
    drawFn(g);
    const rt = PIXI.RenderTexture.create({ width: w, height: h });
    app.renderer.render(g, { renderTexture: rt });
    g.destroy(true);
    return rt;
  };

  const noiseDot = (g, w, h, density = 0.12, minA = 0.02, maxA = 0.08) => {
    for (let i = 0; i < w * h * density; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const a = minA + Math.random() * (maxA - minA);
      g.beginFill(0x000000, a);
      g.drawRect(x, y, 1, 1);
      g.endFill();
    }
  };

  // --- WATER ---
  const water = makeRT(256, 256, (g) => {
    // base gradient
    const base = new PIXI.Graphics();
    const c1 = 0x4e97c1, c2 = 0x6fb7dd;
    // simple vertical gradient via stripes
    for (let y = 0; y < 256; y++) {
      const t = y / 255;
      const r = ((c1>>16)&255)*(1-t) + ((c2>>16)&255)*t;
      const gg = ((c1>>8)&255)*(1-t) + ((c2>>8)&255)*t;
      const b = (c1&255)*(1-t) + (c2&255)*t;
      base.beginFill((r<<16)|(gg<<8)|b);
      base.drawRect(0, y, 256, 1);
      base.endFill();
    }
    // ripple lines
    g.addChild(base);
    g.lineStyle({ width: 1, color: 0xffffff, alpha: 0.08 });
    for (let i = 0; i < 18; i++) {
      const y0 = Math.random()*256;
      g.moveTo(0, y0);
      for (let x = 0; x <= 256; x += 8) {
        const yy = y0 + Math.sin(x/18 + i) * 2;
        g.lineTo(x, yy);
      }
    }
    // noise
    noiseDot(g, 256, 256, 0.06, 0.02, 0.05);
  });

  // --- DESERT (dunes) ---
  const desert = makeRT(256, 256, (g) => {
    const c1 = 0xdcc99b, c2 = 0xcbb481;
    for (let y = 0; y < 256; y++) {
      const t = y/255;
      const mix = (a,b)=>Math.round(a*(1-t)+b*t);
      const col = (mix(c1>>16,c2>>16)<<16)|(mix((c1>>8)&255,(c2>>8)&255)<<8)|mix(c1&255,c2&255);
      g.beginFill(col);
      g.drawRect(0, y, 256, 1);
      g.endFill();
    }
    g.lineStyle({width:2, color:0x9d8653, alpha:0.15});
    for (let y=30; y<256; y+=36){
      g.moveTo(0,y);
      for (let x=0; x<=256; x+=8){
        g.lineTo(x, y + Math.sin((x+y)/40)*4);
      }
    }
    noiseDot(g,256,256,0.08,0.02,0.06);
  });

  // --- WOOD (grain) ---
  const wood = makeRT(256, 256, (g) => {
    g.beginFill(0x2a6e3a); g.drawRect(0,0,256,256); g.endFill();
    g.lineStyle({ width: 3, color: 0x184b26, alpha: 0.35 });
    for (let y=0; y<256; y+=10){
      g.moveTo(0,y);
      for (let x=0; x<=256; x+=8){
        g.lineTo(x, y + Math.sin(x/20 + y/60)*2);
      }
    }
    noiseDot(g,256,256,0.06,0.02,0.05);
  });

  // --- SHEEP (pasture with grass and sheep) ---
  const sheep = makeRT(256, 256, (g) => {
    // רקע ירוק בהיר של כרי דשא כמו בתמונה
    g.beginFill(0x8fcc5f); g.drawRect(0,0,256,256); g.endFill();
    
    // שכבת דשא כהה יותר לעומק ופתלתלות
    g.beginFill(0x6fa83d);
    for (let i=0; i<200; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 4 + 1;
      g.drawEllipse(x, y, size, size * 0.8);
    }
    g.endFill();
    
    // פסי דשא אופקיים לאפקט של שדה מעובד
    g.lineStyle({ width: 1.5, color: 0x7ab04a, alpha: 0.7 });
    for (let y = 15; y < 256; y += 20) {
      g.moveTo(0, y);
      for (let x = 0; x <= 256; x += 6) {
        const wave = y + Math.sin((x + y) / 20) * 3;
        g.lineTo(x, wave);
      }
    }
    
    // שביל דשא דק יותר בין הפסים
    g.lineStyle({ width: 0.8, color: 0x9ed56f, alpha: 0.5 });
    for (let y = 25; y < 256; y += 20) {
      g.moveTo(0, y);
      for (let x = 0; x <= 256; x += 4) {
        const wave = y + Math.sin((x + y) / 15) * 1.5;
        g.lineTo(x, wave);
      }
    }
    
    // כבשים גדולות יותר פזורות על השדה
    g.lineStyle({ width: 0 });
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * 240 + 8; // מרחק מהקצוות
      const y = Math.random() * 240 + 8;
      
      // גוף הכבשה - גדול יותר עם אפקט צמר
      g.beginFill(0xf8f5f0, 0.95);
      g.drawEllipse(x, y, 9, 7); // הגדלתי פי 2
      g.endFill();
      
      // פרטי צמר גדולים יותר
      g.beginFill(0xfefcfa, 0.9);
      g.drawCircle(x - 2.5, y - 1, 2.5);
      g.drawCircle(x + 2.5, y - 1, 2.5);
      g.drawCircle(x, y + 1.5, 2.2);
      g.drawCircle(x - 1, y + 2.5, 2);
      g.drawCircle(x + 1, y + 2.5, 2);
      g.endFill();
      
      // ראש גדול יותר וברור
      g.beginFill(0xe5e0d5, 0.95);
      g.drawEllipse(x - 5.5, y - 1, 3.5, 4);
      g.endFill();
      
      // אוזניים
      g.beginFill(0xd8d0c0, 0.8);
      g.drawEllipse(x - 6.5, y - 3, 1.5, 2);
      g.drawEllipse(x - 4.5, y - 3, 1.5, 2);
      g.endFill();
      
      // עיניים קטנות
      g.beginFill(0x2c2c2c, 0.9);
      g.drawCircle(x - 6, y - 1.5, 0.8);
      g.drawCircle(x - 5, y - 1.5, 0.8);
      g.endFill();
      
      // רגליים ברורות יותר
      g.beginFill(0xd8d0c0, 0.8);
      g.drawRect(x - 3, y + 4.5, 1.5, 3);
      g.drawRect(x - 1, y + 4.5, 1.5, 3);
      g.drawRect(x + 1, y + 4.5, 1.5, 3);
      g.drawRect(x + 3, y + 4.5, 1.5, 3);
      g.endFill();
      
      // זנב קטן
      g.beginFill(0xf0ebe0, 0.7);
      g.drawCircle(x + 4.5, y + 1, 1.2);
      g.endFill();
    }
    
    // צללים של עשב גבוה יותר לעומק
    g.lineStyle({ width: 1.2, color: 0x5c8a35, alpha: 0.4 });
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const height = Math.random() * 12 + 6;
      g.moveTo(x, y);
      g.lineTo(x + Math.sin(x / 25) * 1.5, y - height);
    }
    
    // פרחים קטנים פזורים (נקודות צבעוניות)
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const colors = [0xffffff, 0xffd700, 0xff69b4, 0x87ceeb];
      const color = colors[Math.floor(Math.random() * colors.length)];
      g.beginFill(color, 0.6);
      g.drawCircle(x, y, Math.random() * 1.5 + 0.5);
      g.endFill();
    }
    
    // רעש עדין לטקסטורה טבעית
    noiseDot(g,256,256,0.025,0.01,0.025);
  });

  // --- WHEAT (stalks) ---
  const wheat = makeRT(256, 256, (g) => {
    g.beginFill(0xd9bb49); g.drawRect(0,0,256,256); g.endFill();
    g.lineStyle({ width: 1, color: 0xa8882b, alpha: 0.5 });
    for (let i=0;i<160;i++){
      const x = Math.random()*256;
      const y = 256 - Math.random()*128;
      const h = Math.random()*22+10;
      g.moveTo(x,y); g.lineTo(x+Math.sin(x/30)*2, y-h);
    }
    noiseDot(g,256,256,0.05,0.02,0.05);
  });

  // --- BRICK (rows + variation) ---
  const brick = makeRT(256, 256, (g) => {
    g.beginFill(0xb24d3d); g.drawRect(0,0,256,256); g.endFill();
    const bw=22,bh=12;
    for (let y=0; y<256; y+=bh){
      const offset = (y/bh)%2===0?0: bw/2;
      for (let x=-offset; x<256; x+=bw){
        const shade = (Math.random()*20-10)|0;
        const base = 0xb24d3d;
        const r = Math.max(0, Math.min(255, ((base>>16)&255)+shade));
        const gg = Math.max(0, Math.min(255, ((base>>8)&255)+shade));
        const b = Math.max(0, Math.min(255, (base&255)+shade));
        g.lineStyle({width:1, color:0x6a2c22, alpha:0.5});
        g.beginFill((r<<16)|(gg<<8)|b);
        g.drawRect(x+1, y+1, bw-2, bh-2);
        g.endFill();
      }
    }
    noiseDot(g,256,256,0.04,0.02,0.05);
  });

  // --- ORE (speckles) ---
  const ore = makeRT(256, 256, (g) => {
    g.beginFill(0x6c707d); g.drawRect(0,0,256,256); g.endFill();
    for (let i=0;i<300;i++){
      const x=Math.random()*256, y=Math.random()*256;
      const col = Math.random()<0.6?0x3f424b:0x9aa0ac;
      g.beginFill(col, Math.random()*0.8+0.2);
      g.drawCircle(x,y, Math.random()*2.5+0.8);
      g.endFill();
    }
    noiseDot(g,256,256,0.05,0.02,0.06);
  });

  return {
    water, desert, wood, sheep, wheat, brick, ore
  };
}
