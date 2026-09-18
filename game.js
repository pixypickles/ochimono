const W=8,H=16,C=40, canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const colors=[{n:'LIME',v:'#79d84b'},{n:'PURPLE',v:'#9b4de0'},{n:'ORANGE',v:'#ff8a2b'},{n:'SKY',v:'#2aaee8'}];
const SHAPES=[[[0,0],[1,0],[0,1],[1,1]],[[0,0],[-1,0],[1,0],[0,1]],[[0,0],[0,1],[0,2],[1,2]],[[0,0],[-1,0],[1,0],[1,1]],[[0,0],[-1,0],[0,1],[1,1]],[[0,0],[1,0],[-1,1],[0,1]],[[0,0],[-1,0],[1,0],[2,0]]];
let board,cur,next=[],score,food,over=false,busy=false,last=0,dropMs=1800,groupSeq=1;
let FEAST_PIECES=16; let feastCount=FEAST_PIECES, feastPending=false;
let gameRunning=false, difficulty='normal';
const DIFFICULTIES={easy:{feast:20,drop:2400},normal:{feast:16,drop:1800},hard:{feast:12,drop:1200}};
let eater={active:false,x:-60,mouth:0};
function rand(n){return Math.floor(Math.random()*n)}
function piece(){let s=SHAPES[rand(SHAPES.length)].map(p=>[...p]);let purpleSlot=rand(s.length);let cols=s.map((_,i)=>i===purpleSlot?1:(Math.random()<0.10?1:[0,2,3][rand(3)]));return {s,cols,x:Math.floor(W/2),y:-2,g:groupSeq++}}
function reset(){last=0; gameRunning=true; board=Array.from({length:H},()=>Array(W).fill(null));score=0;food=1;over=false;busy=false;feastPending=false;feastCount=FEAST_PIECES;eater={active:false,x:-60,mouth:0};next=[piece(),piece(),piece()];spawn();ui();draw()}
function spawn(){cur=next.shift();next.push(piece());cur.x=Math.floor(W/2);cur.y=-2;if(collide(cur,0,1)) over=true}
function cells(p=cur){return p.s.map(([x,y],i)=>[p.x+x,p.y+y,p.cols[i]])}
function collide(p,dx=0,dy=0,s=p.s){for(let i=0;i<s.length;i++){let x=p.x+s[i][0]+dx,y=p.y+s[i][1]+dy;if(x<0||x>=W||y>=H)return true;if(y>=0&&board[y][x]!=null)return true}return false}
function move(dx,dy){if(over||busy)return;if(!collide(cur,dx,dy)){cur.x+=dx;cur.y+=dy;draw()}else if(dy>0) lock()}
function rotate(dir){if(over||busy)return;let ns=cur.s.map(([x,y])=>dir>0?[-y,x]:[y,-x]);for(let kick of [0,-1,1,-2,2])if(!collide(cur,kick,0,ns)){cur.s=ns;cur.x+=kick;draw();return}}
function hard(){if(over||busy)return;while(!collide(cur,0,1))cur.y++;lock()}
async function lock(){if(busy)return;for(let [x,y,c] of cells())if(y>=0)board[y][x]={c,g:cur.g}; if(cells().some(c=>c[1]<0)){over=true;draw();return}
 cur=null; feastCount--; ui(); draw();
 busy=true; await resolveNormal(); busy=false;
 if(feastCount<=0&&!over){feastPending=true;await feast();return}
 if(!over)spawn();ui();draw()}
function groups(excludeFood=true){let seen=Array.from({length:H},()=>Array(W).fill(false)),out=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){let cell=board[y][x],c=cell?.c;if(cell==null||seen[y][x]||(excludeFood&&c===food))continue;let q=[[x,y]],g=[];seen[y][x]=true;while(q.length){let [a,b]=q.pop();g.push([a,b]);for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let nx=a+dx,ny=b+dy;if(nx>=0&&nx<W&&ny>=0&&ny<H&&!seen[ny][nx]&&board[ny][nx]?.c===c){seen[ny][nx]=true;q.push([nx,ny])}}}if(g.length>=3)out.push(g)}return out}
async function resolveNormal(){let ch=0;while(true){let gs=groups(true);if(!gs.length)break;ch++;document.querySelector('#chain').textContent=ch;let n=0;for(let g of gs)for(let [x,y] of g){if(board[y][x]!=null){board[y][x]=null;n++}}score+=n*100*ch;draw();await wait(140);gravity();draw();await wait(140)}document.querySelector('#chain').textContent=ch}
async function feast(){
 if(over)return;
 if(busy){feastPending=true;return}
 feastPending=false; busy=true;
 // 盤面を横切る紫の「食べる生き物」。通過した列の紫から順に消す。
 eater.active=true; eater.x=-C*1.2;
 const duration=1050, start=performance.now(), endX=W*C+C*1.2;
 let eaten=0;
 await new Promise(resolve=>{
   function step(now){
     let t=Math.min(1,(now-start)/duration);
     eater.x=-C*1.2+(endX+C*1.2)*t;
     eater.mouth=0.18+0.22*(0.5+0.5*Math.sin(now/55));
     for(let y=0;y<H;y++)for(let x=0;x<W;x++){
       if(board[y][x]?.c===food && x*C+C/2<=eater.x){board[y][x]=null;eaten++}
     }
     draw();
     if(t<1)requestAnimationFrame(step);else resolve();
   }
   requestAnimationFrame(step);
 });
 eater.active=false;
 score+=eaten*75; draw(); await wait(120);
 gravity(); draw(); await wait(180);
 await resolveNormal();
 busy=false;
 feastCount=FEAST_PIECES; feastPending=false;
 if(!over){
   // 捕食中に操作中ピースは存在しない設計。必要なら新しいピースを出す。
   if(!cur || cells(cur).some(([x,y])=>y>=0&&board[y]&&board[y][x]!=null)) spawn();
 }
 ui(); draw();
}
function gravity(){for(let x=0;x<W;x++){let w=H-1;for(let y=H-1;y>=0;y--)if(board[y][x]!=null){let cell=board[y][x];board[y][x]=null;board[w--][x]=cell}}}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
function fruit(x,y,c,ghost=false,small=false){
 const cx=x*C+C/2,cy=y*C+C/2,r=small?C*.30:C*.36;
 ctx.save();ctx.globalAlpha=ghost?0.30:1;
 if(c===food){
   // Purple fruit: a hard thorny shell. It never pops from normal 3-match clears.
   const spikes=10, outer=r+6, inner=r+1;
   ctx.fillStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.arc(cx,cy,outer+3,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#7133a8';ctx.beginPath();
   for(let i=0;i<spikes*2;i++){
     const a=-Math.PI/2+i*Math.PI/spikes, rr=i%2===0?outer:inner;
     const px=cx+Math.cos(a)*rr, py=cy+Math.sin(a)*rr;
     if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
   }
   ctx.closePath();ctx.fill();
   // inner edible fruit peeking through the shell
   ctx.fillStyle=colors[c].v;ctx.beginPath();ctx.arc(cx,cy,r*.78,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='rgba(255,255,255,.32)';ctx.beginPath();ctx.ellipse(cx-r*.20,cy-r*.22,r*.13,r*.09,-.5,0,Math.PI*2);ctx.fill();
 }else{
   ctx.fillStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.arc(cx,cy,r+3,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=colors[c].v;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='rgba(255,255,255,.28)';ctx.beginPath();ctx.ellipse(cx-r*.28,cy-r*.30,r*.16,r*.11,-.5,0,Math.PI*2);ctx.fill();
 }
 // tiny stem/leaf
 ctx.strokeStyle='rgba(58,76,42,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy-r+2);ctx.quadraticCurveTo(cx+2,cy-r-5,cx+7,cy-r-7);ctx.stroke();
 ctx.fillStyle='rgba(105,170,72,.9)';ctx.beginPath();ctx.ellipse(cx+8,cy-r-7,5,2.5,.35,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function vineBetween(x1,y1,x2,y2,alpha=1){
 ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle='rgba(113,91,61,.72)';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1*C+C/2,y1*C+C/2);ctx.lineTo(x2*C+C/2,y2*C+C/2);ctx.stroke();ctx.restore();
}
function drawGroupVines(){
 const by=new Map();for(let y=0;y<H;y++)for(let x=0;x<W;x++){let cell=board[y][x];if(cell){if(!by.has(cell.g))by.set(cell.g,[]);by.get(cell.g).push([x,y])}}
 for(let arr of by.values()){let set=new Set(arr.map(([x,y])=>x+','+y));for(let [x,y] of arr)for(let [dx,dy] of [[1,0],[0,1]])if(set.has((x+dx)+','+(y+dy)))vineBetween(x,y,x+dx,y+dy,.8)}
}
function drawPieceVines(p,gy=null,alpha=1){let pts=p.s.map(([sx,sy])=>[p.x+sx,(gy??p.y)+sy]);let set=new Set(pts.map(([x,y])=>x+','+y));for(let [x,y] of pts)for(let [dx,dy] of [[1,0],[0,1]])if(set.has((x+dx)+','+(y+dy)))vineBetween(x,y,x+dx,y+dy,alpha)}
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);let bg=ctx.createLinearGradient(0,0,0,canvas.height);bg.addColorStop(0,'#182219');bg.addColorStop(.55,'#0d1510');bg.addColorStop(1,'#080d09');ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='rgba(142,185,88,.035)';for(let i=0;i<18;i++){ctx.beginPath();ctx.arc((i*83)%320,(i*137)%640,18+(i%4)*9,0,Math.PI*2);ctx.fill()}ctx.strokeStyle='rgba(224,242,184,.035)';for(let x=1;x<W;x++){ctx.beginPath();ctx.moveTo(x*C,0);ctx.lineTo(x*C,H*C);ctx.stroke()}for(let y=1;y<H;y++){ctx.beginPath();ctx.moveTo(0,y*C);ctx.lineTo(W*C,y*C);ctx.stroke()}
 drawGroupVines();for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(board[y][x]!=null)fruit(x,y,board[y][x].c);
 if(cur&&!over){let gy=cur.y;while(!collide({...cur,y:gy},0,1))gy++;drawPieceVines(cur,gy,.25);for(let i=0;i<cur.s.length;i++){let [sx,sy]=cur.s[i],x=cur.x+sx,y=gy+sy;if(y>=0)fruit(x,y,cur.cols[i],true)}drawPieceVines(cur,null,1);for(let [x,y,c] of cells())if(y>=0)fruit(x,y,c)}if(eater.active){drawEater()}if(over){ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(0,250,320,100);ctx.fillStyle='white';ctx.font='bold 26px system-ui';ctx.textAlign='center';ctx.fillText('GAME OVER',160,305)}}
function drawEater(){
 const x=eater.x,y=H*C-34,r=28;
 ctx.save();ctx.translate(x,y);
 // ぷるっとした紫の本体
 ctx.fillStyle='#a75be8';ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
 // 進行方向にパクパクする口（背景色で切り抜く）
 const a=eater.mouth*Math.PI;
 ctx.fillStyle='#080a0f';ctx.beginPath();ctx.moveTo(2,0);ctx.arc(0,0,r+1,-a,a);ctx.closePath();ctx.fill();
 // 目
 ctx.fillStyle='white';ctx.beginPath();ctx.arc(-4,-12,6,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#17131f';ctx.beginPath();ctx.arc(-2,-11,2.5,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function ui(){document.querySelector('#score').textContent=score;document.querySelector('#count').textContent=feastCount;let el=document.querySelector('#foodName');el.textContent=colors[food].n;el.style.color=colors[food].v;let beast=document.querySelector('#beast'),mood=document.querySelector('#mood');beast.classList.toggle('hungry',feastCount<=5);beast.classList.toggle('danger',feastCount<=2);mood.textContent=feastCount<=2?'もう待てない！':feastCount<=5?'おなかすいた…':feastCount<=9?'そろそろ…':'まだまだ…';drawNext()}
function drawNext(){
 let c=document.querySelector('#next'),x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);
 function miniFruit(cx,cy,col){
   if(col===food){
     x.fillStyle='#7133a8';x.beginPath();const spikes=8;
     for(let i=0;i<spikes*2;i++){let a=-Math.PI/2+i*Math.PI/spikes,rr=i%2===0?10:7.5,px=cx+Math.cos(a)*rr,py=cy+Math.sin(a)*rr;if(i===0)x.moveTo(px,py);else x.lineTo(px,py)}x.closePath();x.fill();
     x.fillStyle=colors[col].v;x.beginPath();x.arc(cx,cy,5.8,0,Math.PI*2);x.fill();
   }else{x.fillStyle=colors[col].v;x.beginPath();x.arc(cx,cy,7.5,0,Math.PI*2);x.fill()}
 }
 next.forEach((p,k)=>{let ox=75,oy=30+k*58,sz=18;let set=new Set(p.s.map(([a,b])=>a+','+b));x.strokeStyle='rgba(113,91,61,.75)';x.lineWidth=3;x.lineCap='round';p.s.forEach(([a,b])=>[[1,0],[0,1]].forEach(([dx,dy])=>{if(set.has((a+dx)+','+(b+dy))){x.beginPath();x.moveTo(ox+a*sz,oy+b*sz);x.lineTo(ox+(a+dx)*sz,oy+(b+dy)*sz);x.stroke()}}));p.s.forEach(([a,b],i)=>miniFruit(ox+a*sz,oy+b*sz,p.cols[i]))})
}
function act(a){if(a==='left')move(-1,0);if(a==='right')move(1,0);if(a==='down')move(0,1);if(a==='rotL')rotate(-1);if(a==='rotR')rotate(1);if(a==='drop')hard()}
function startGame(mode){difficulty=mode;const d=DIFFICULTIES[mode];FEAST_PIECES=d.feast;dropMs=d.drop;document.querySelector('#titleScreen').classList.add('hidden');document.querySelector('#gameScreen').classList.remove('hidden');reset()}
function showTitle(){gameRunning=false;busy=false;over=false;cur=null;document.querySelector('#gameScreen').classList.add('hidden');document.querySelector('#titleScreen').classList.remove('hidden')}
document.querySelectorAll('[data-difficulty]').forEach(b=>b.addEventListener('click',()=>startGame(b.dataset.difficulty)));
document.querySelector('#toTitle').onclick=showTitle;

document.querySelectorAll('[data-a]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();act(b.dataset.a)}));document.querySelector('#restart').onclick=reset;
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' ','z','Z','x','X'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')act('left');if(e.key==='ArrowRight')act('right');if(e.key==='ArrowDown')act('down');if(e.key==='ArrowUp'||e.key==='x'||e.key==='X')act('rotR');if(e.key==='z'||e.key==='Z')act('rotL');if(e.key===' ')act('drop')});
function loop(t){if(gameRunning){if(!last)last=t;if(t-last>dropMs&&!busy&&!over){move(0,1);last=t}draw()}requestAnimationFrame(loop)}requestAnimationFrame(loop);
