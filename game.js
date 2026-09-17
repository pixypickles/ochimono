const W=8,H=16,C=40, canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const colors=[{n:'GREEN',v:'#39c56b'},{n:'PURPLE',v:'#a75be8'},{n:'ORANGE',v:'#f28b35'},{n:'CYAN',v:'#35bcd4'}];
const SHAPES=[[[0,0],[1,0],[0,1],[1,1]],[[0,0],[-1,0],[1,0],[0,1]],[[0,0],[0,1],[0,2],[1,2]],[[0,0],[-1,0],[1,0],[1,1]],[[0,0],[-1,0],[0,1],[1,1]],[[0,0],[1,0],[-1,1],[0,1]],[[0,0],[-1,0],[1,0],[2,0]]];
let board,cur,next=[],score,food,count,over=false,busy=false,last=0,dropMs=700;
function rand(n){return Math.floor(Math.random()*n)}
function piece(){let s=SHAPES[rand(SHAPES.length)].map(p=>[...p]);return {s,cols:s.map(()=>rand(4)),x:Math.floor(W/2),y:-2}}
function reset(){board=Array.from({length:H},()=>Array(W).fill(null));score=0;food=rand(4);count=8;over=false;busy=false;next=[piece(),piece(),piece()];spawn();ui();draw()}
function spawn(){cur=next.shift();next.push(piece());cur.x=Math.floor(W/2);cur.y=-2;if(collide(cur,0,1)) over=true}
function cells(p=cur){return p.s.map(([x,y],i)=>[p.x+x,p.y+y,p.cols[i]])}
function collide(p,dx=0,dy=0,s=p.s){for(let i=0;i<s.length;i++){let x=p.x+s[i][0]+dx,y=p.y+s[i][1]+dy;if(x<0||x>=W||y>=H)return true;if(y>=0&&board[y][x]!=null)return true}return false}
function move(dx,dy){if(over||busy)return;if(!collide(cur,dx,dy)){cur.x+=dx;cur.y+=dy;draw()}else if(dy>0) lock()}
function rotate(dir){if(over||busy)return;let ns=cur.s.map(([x,y])=>dir>0?[-y,x]:[y,-x]);for(let kick of [0,-1,1,-2,2])if(!collide(cur,kick,0,ns)){cur.s=ns;cur.x+=kick;draw();return}}
function hard(){if(over||busy)return;while(!collide(cur,0,1))cur.y++;lock()}
async function lock(){if(busy)return;for(let [x,y,c] of cells())if(y>=0)board[y][x]=c; if(cells().some(c=>c[1]<0)){over=true;draw();return}
 busy=true; count--; await resolveNormal(); if(count<=0) await feast(); busy=false; if(!over)spawn();ui();draw()}
function groups(excludeFood=true){let seen=Array.from({length:H},()=>Array(W).fill(false)),out=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){let c=board[y][x];if(c==null||seen[y][x]||(excludeFood&&c===food))continue;let q=[[x,y]],g=[];seen[y][x]=true;while(q.length){let [a,b]=q.pop();g.push([a,b]);for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let nx=a+dx,ny=b+dy;if(nx>=0&&nx<W&&ny>=0&&ny<H&&!seen[ny][nx]&&board[ny][nx]===c){seen[ny][nx]=true;q.push([nx,ny])}}}if(g.length>=3)out.push(g)}return out}
async function resolveNormal(){let ch=0;while(true){let gs=groups(true);if(!gs.length)break;ch++;document.querySelector('#chain').textContent=ch;let n=0;for(let g of gs)for(let [x,y] of g){if(board[y][x]!=null){board[y][x]=null;n++}}score+=n*100*ch;draw();await wait(140);gravity();draw();await wait(140)}document.querySelector('#chain').textContent=ch}
async function feast(){let eaten=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(board[y][x]===food){board[y][x]=null;eaten++}score+=eaten*75;draw();await wait(280);gravity();draw();await wait(180);await resolveNormal();let old=food;do food=rand(4);while(food===old);count=6+rand(5);ui()}
function gravity(){for(let x=0;x<W;x++){let w=H-1;for(let y=H-1;y>=0;y--)if(board[y][x]!=null){let c=board[y][x];board[y][x]=null;board[w--][x]=c}}}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
function block(x,y,c,ghost=false){ctx.globalAlpha=ghost?.28:1;ctx.fillStyle=colors[c].v;ctx.fillRect(x*C+2,y*C+2,C-4,C-4);ctx.globalAlpha=1;ctx.strokeStyle='rgba(255,255,255,.14)';ctx.strokeRect(x*C+2,y*C+2,C-4,C-4)}
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#080a0f';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#171a22';for(let x=1;x<W;x++){ctx.beginPath();ctx.moveTo(x*C,0);ctx.lineTo(x*C,H*C);ctx.stroke()}for(let y=1;y<H;y++){ctx.beginPath();ctx.moveTo(0,y*C);ctx.lineTo(W*C,y*C);ctx.stroke()}for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(board[y][x]!=null)block(x,y,board[y][x]);if(cur&&!over){let gy=cur.y;while(!collide({...cur,y:gy},0,1))gy++;for(let i=0;i<cur.s.length;i++){let [sx,sy]=cur.s[i],x=cur.x+sx,y=gy+sy;if(y>=0)block(x,y,cur.cols[i],true)}for(let [x,y,c] of cells())if(y>=0)block(x,y,c)}if(over){ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(0,250,320,100);ctx.fillStyle='white';ctx.font='bold 26px system-ui';ctx.textAlign='center';ctx.fillText('GAME OVER',160,305)}}
function ui(){document.querySelector('#score').textContent=score;document.querySelector('#count').textContent=count;let el=document.querySelector('#foodName');el.textContent=colors[food].n;el.style.color=colors[food].v;drawNext()}
function drawNext(){let c=document.querySelector('#next'),x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);next.forEach((p,k)=>{let ox=75,oy=30+k*58,sz=18;p.s.forEach(([a,b],i)=>{x.fillStyle=colors[p.cols[i]].v;x.fillRect(ox+a*sz-sz/2,oy+b*sz,sz-2,sz-2)})})}
function act(a){if(a==='left')move(-1,0);if(a==='right')move(1,0);if(a==='down')move(0,1);if(a==='rotL')rotate(-1);if(a==='rotR')rotate(1);if(a==='drop')hard()}
document.querySelectorAll('[data-a]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();act(b.dataset.a)}));document.querySelector('#restart').onclick=reset;
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' ','z','Z','x','X'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')act('left');if(e.key==='ArrowRight')act('right');if(e.key==='ArrowDown')act('down');if(e.key==='ArrowUp'||e.key==='x'||e.key==='X')act('rotR');if(e.key==='z'||e.key==='Z')act('rotL');if(e.key===' ')act('drop')});
function loop(t){if(!last)last=t;if(t-last>dropMs&&!busy&&!over){move(0,1);last=t}draw();requestAnimationFrame(loop)}reset();requestAnimationFrame(loop);
