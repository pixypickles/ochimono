const W=8,H=16,CELL=40,COLORS=['#36c978','#9b6de3','#ff963d'];
const WILD=3, WILD_RATE=0.08;
const SHAPES=[[[0,0]],[[0,0],[1,0]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[1,1]],[[0,0],[0,1],[0,2],[1,2]]];
const cv=document.querySelector('#game'),ctx=cv.getContext('2d'),nv=document.querySelector('#next'),nx=nv.getContext('2d');
let board,piece,queue,score,enclosures,over,last=0,acc=0,interval=650;
function rndPiece(){let s=SHAPES[Math.floor(Math.random()*SHAPES.length)];return {cells:s.map(p=>[...p]),color:Math.random()<WILD_RATE?WILD:Math.floor(Math.random()*3),x:0,y:0}}
function spawn(){while(queue.length<4)queue.push(rndPiece());piece=queue.shift();piece.x=Math.floor((W-width(piece.cells))/2);piece.y=-minY(piece.cells);if(collide(piece,0,0))over=true}
function width(c){return Math.max(...c.map(p=>p[0]))+1} function minY(c){return Math.min(...c.map(p=>p[1]) )}
function collide(p,dx,dy,cells=p.cells){return cells.some(([x,y])=>{x+=p.x+dx;y+=p.y+dy;return x<0||x>=W||y>=H||(y>=0&&board[y][x]!=null)})}
function rotate(dir=1){if(over)return;let r=piece.cells.map(([x,y])=>dir>0?[-y,x]:[y,-x]);let minx=Math.min(...r.map(p=>p[0])),miny=Math.min(...r.map(p=>p[1]));r=r.map(([x,y])=>[x-minx,y-miny]);for(const kick of [0,-1,1,-2,2])if(!collide(piece,kick,0,r)){piece.x+=kick;piece.cells=r;break}}
function move(dx){if(!over&&!collide(piece,dx,0))piece.x+=dx}
function down(){if(over)return;if(!collide(piece,0,1))piece.y++;else lock()}
function hard(){if(over)return;while(!collide(piece,0,1)){piece.y++;score+=1}lock()}
function lock(){for(const [x,y] of piece.cells){let X=x+piece.x,Y=y+piece.y;if(Y<0){over=true;return}board[Y][X]=piece.color}score+=piece.cells.length;resolve();spawn();sync()}
function resolve(){
  let chain=0;
  while(true){
    const found=findEnclosures();
    if(!found.length)break;
    chain++;
    enclosures+=found.length;
    const del=new Set();
    found.forEach(comp=>comp.forEach(([x,y])=>del.add(x+','+y)));
    score+=del.size*20*chain;
    del.forEach(k=>{const[x,y]=k.split(',').map(Number);board[y][x]=null});
    gravity();
  }
}

// A color is erased when one connected mass of that color completely surrounds
// at least one locked block of another color. Empty cells may exist inside the loop.
// Wild cells can act as any enclosing color and are consumed when that enclosure clears.
function findEnclosures(){
  const results=[];
  for(let target=0;target<3;target++){
    const seen=Array.from({length:H},()=>Array(W).fill(false));
    for(let sy=0;sy<H;sy++)for(let sx=0;sx<W;sx++){
      if(seen[sy][sx]||!isWallColor(sx,sy,target))continue;
      const comp=[], stack=[[sx,sy]]; seen[sy][sx]=true;
      while(stack.length){
        const [x,y]=stack.pop(); comp.push([x,y]);
        for(const[dx,dy]of DIRS){
          const X=x+dx,Y=y+dy;
          if(X>=0&&X<W&&Y>=0&&Y<H&&!seen[Y][X]&&isWallColor(X,Y,target)){
            seen[Y][X]=true; stack.push([X,Y]);
          }
        }
      }
      if(componentEnclosesOtherColor(comp,target))results.push(comp);
    }
  }
  return results;
}
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
function isWallColor(x,y,target){return board[y][x]===target||board[y][x]===WILD}
function componentEnclosesOtherColor(comp,target){
  // Work on a one-cell padded board so the real board edge never counts as part of a loop.
  const PW=W+2,PH=H+2;
  const wall=Array.from({length:PH},()=>Array(PW).fill(false));
  comp.forEach(([x,y])=>wall[y+1][x+1]=true);
  const outside=Array.from({length:PH},()=>Array(PW).fill(false));
  const q=[[0,0]]; outside[0][0]=true;
  for(let qi=0;qi<q.length;qi++){
    const[x,y]=q[qi];
    for(const[dx,dy]of DIRS){
      const X=x+dx,Y=y+dy;
      if(X>=0&&X<PW&&Y>=0&&Y<PH&&!outside[Y][X]&&!wall[Y][X]){
        outside[Y][X]=true;q.push([X,Y]);
      }
    }
  }
  // Only another locked color counts as prey. An empty hole alone does not clear the ring.
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(outside[y+1][x+1])continue;
    const c=board[y][x];
    if(c!=null&&c!==target&&c!==WILD)return true;
  }
  return false;
}
function gravity(){for(let x=0;x<W;x++){let vals=[];for(let y=H-1;y>=0;y--)if(board[y][x]!=null)vals.push(board[y][x]);for(let y=H-1,i=0;y>=0;y--)board[y][x]=i<vals.length?vals[i++]:null}}
function cell(g,x,y,c,a=1,size=CELL,merged=false){
  g.save();g.globalAlpha=a;
  if(c===WILD){
    let grad=g.createLinearGradient(x*size,y*size,(x+1)*size,(y+1)*size);
    grad.addColorStop(0,'#36c978');grad.addColorStop(.5,'#9b6de3');grad.addColorStop(1,'#ff963d');
    g.fillStyle=grad;g.shadowColor='#fff';g.shadowBlur=7;
  }else g.fillStyle=COLORS[c];
  const inset=merged?0:2;
  g.fillRect(x*size+inset,y*size+inset,size-inset*2,size-inset*2);
  if(c===WILD&&!merged){g.strokeStyle='#fff';g.lineWidth=2;g.strokeRect(x*size+4,y*size+4,size-8,size-8)}
  g.restore();
}
function sameLockedColor(x,y,c){return x>=0&&x<W&&y>=0&&y<H&&board[y][x]===c}
function drawLockedCell(x,y,c){
  // Locked cells of the same color visually fuse into one continuous mass.
  // Different colors keep a dark seam, so the player's eye follows color networks instead of rows.
  cell(ctx,x,y,c,1,CELL,true);
  ctx.save();ctx.strokeStyle='#181c24';ctx.lineWidth=4;ctx.beginPath();
  if(!sameLockedColor(x-1,y,c)){ctx.moveTo(x*CELL,y*CELL);ctx.lineTo(x*CELL,(y+1)*CELL)}
  if(!sameLockedColor(x+1,y,c)){ctx.moveTo((x+1)*CELL,y*CELL);ctx.lineTo((x+1)*CELL,(y+1)*CELL)}
  if(!sameLockedColor(x,y-1,c)){ctx.moveTo(x*CELL,y*CELL);ctx.lineTo((x+1)*CELL,y*CELL)}
  if(!sameLockedColor(x,y+1,c)){ctx.moveTo(x*CELL,(y+1)*CELL);ctx.lineTo((x+1)*CELL,(y+1)*CELL)}
  ctx.stroke();ctx.restore();
}

function draw(){
  ctx.clearRect(0,0,cv.width,cv.height);
  // Subtle grid only in empty space. Locked same-color cells cover it completely.
  ctx.strokeStyle='#252b37';ctx.lineWidth=1;
  for(let x=1;x<W;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,H*CELL);ctx.stroke()}
  for(let y=1;y<H;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(W*CELL,y*CELL);ctx.stroke()}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(board[y][x]!=null)drawLockedCell(x,y,board[y][x]);
  if(piece&&!over){
    let ghost=0;while(!collide(piece,0,ghost+1))ghost++;
    for(const[x,y]of piece.cells)if(y+piece.y+ghost>=0)cell(ctx,x+piece.x,y+piece.y+ghost,piece.color,.18);
    for(const[x,y]of piece.cells)if(y+piece.y>=0)cell(ctx,x+piece.x,y+piece.y,piece.color);
  }
  if(over){ctx.fillStyle='#000b';ctx.fillRect(0,0,cv.width,cv.height);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 30px system-ui';ctx.fillText('GAME OVER',cv.width/2,cv.height/2)}
  drawNext();
}
function drawNext(){nx.clearRect(0,0,nv.width,nv.height);queue.slice(0,3).forEach((p,i)=>{let sc=22,ox=12,oy=12+i*65;for(const[x,y]of p.cells){if(p.color===WILD){let grad=nx.createLinearGradient(ox+x*sc,oy+y*sc,ox+(x+1)*sc,oy+(y+1)*sc);grad.addColorStop(0,'#36c978');grad.addColorStop(.5,'#9b6de3');grad.addColorStop(1,'#ff963d');nx.fillStyle=grad}else nx.fillStyle=COLORS[p.color];nx.fillRect(ox+x*sc,oy+y*sc,sc-3,sc-3)}})}
function sync(){document.querySelector('#score').textContent=score;document.querySelector('#enclosures').textContent=enclosures}
function reset(){board=Array.from({length:H},()=>Array(W).fill(null));queue=[];score=enclosures=0;over=false;spawn();sync()}
function loop(t){let dt=t-last;last=t;acc+=dt;if(acc>interval){acc=0;down()}draw();requestAnimationFrame(loop)}
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);if(e.key==='ArrowDown')down();if(e.key==='ArrowUp')rotate(1);if(e.key==='z'||e.key==='Z')rotate(-1);if(e.key==='x'||e.key==='X')rotate(1);if(e.key===' ')hard()});
document.querySelectorAll('[data-a]').forEach(b=>b.addEventListener('pointerdown',()=>({left:()=>move(-1),right:()=>move(1),rotL:()=>rotate(-1),rotR:()=>rotate(1),down,drop:hard}[b.dataset.a]())));document.querySelector('#restart').onclick=reset;reset();requestAnimationFrame(loop);
