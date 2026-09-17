const W=8,H=16,CELL=40,COLORS=['#ff5353','#4f8cff','#ffd34e','#53d27c'];
const SHAPES=[[[0,0]],[[0,0],[1,0]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[1,1]],[[0,0],[0,1],[0,2],[1,2]]];
const cv=document.querySelector('#game'),ctx=cv.getContext('2d'),nv=document.querySelector('#next'),nx=nv.getContext('2d');
let board,piece,queue,score,bridges,over,last=0,acc=0,interval=650;
function rndPiece(){let s=SHAPES[Math.floor(Math.random()*SHAPES.length)];return {cells:s.map(p=>[...p]),color:Math.floor(Math.random()*4),x:0,y:0}}
function spawn(){while(queue.length<4)queue.push(rndPiece());piece=queue.shift();piece.x=Math.floor((W-width(piece.cells))/2);piece.y=-minY(piece.cells);if(collide(piece,0,0))over=true}
function width(c){return Math.max(...c.map(p=>p[0]))+1} function minY(c){return Math.min(...c.map(p=>p[1]))}
function collide(p,dx,dy,cells=p.cells){return cells.some(([x,y])=>{x+=p.x+dx;y+=p.y+dy;return x<0||x>=W||y>=H||(y>=0&&board[y][x]!=null)})}
function rotate(){if(over)return;let r=piece.cells.map(([x,y])=>[-y,x]);let minx=Math.min(...r.map(p=>p[0])),miny=Math.min(...r.map(p=>p[1]));r=r.map(([x,y])=>[x-minx,y-miny]);for(const kick of [0,-1,1,-2,2])if(!collide(piece,kick,0,r)){piece.x+=kick;piece.cells=r;break}}
function move(dx){if(!over&&!collide(piece,dx,0))piece.x+=dx}
function down(){if(over)return;if(!collide(piece,0,1))piece.y++;else lock()}
function hard(){if(over)return;while(!collide(piece,0,1)){piece.y++;score+=1}lock()}
function lock(){for(const [x,y] of piece.cells){let X=x+piece.x,Y=y+piece.y;if(Y<0){over=true;return}board[Y][X]=piece.color}score+=piece.cells.length;resolve();spawn();sync()}
function resolve(){let chain=0;while(true){let found=findBridges();if(!found.length)break;chain++;bridges+=found.length;let del=new Set();found.forEach(comp=>comp.forEach(([x,y])=>del.add(x+','+y)));score+=del.size*20*chain;del.forEach(k=>{let[x,y]=k.split(',').map(Number);board[y][x]=null});gravity();}}
function findBridges(){let seen=Array.from({length:H},()=>Array(W).fill(false)),out=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(seen[y][x]||board[y][x]==null)continue;let col=board[y][x],q=[[x,y]],comp=[],left=false,right=false;seen[y][x]=true;while(q.length){let [a,b]=q.pop();comp.push([a,b]);if(a===0)left=true;if(a===W-1)right=true;for(const[d,e]of[[1,0],[-1,0],[0,1],[0,-1]]){let X=a+d,Y=b+e;if(X>=0&&X<W&&Y>=0&&Y<H&&!seen[Y][X]&&board[Y][X]===col){seen[Y][X]=true;q.push([X,Y])}}}if(left&&right)out.push(comp)}return out}
function gravity(){for(let x=0;x<W;x++){let vals=[];for(let y=H-1;y>=0;y--)if(board[y][x]!=null)vals.push(board[y][x]);for(let y=H-1,i=0;y>=0;y--)board[y][x]=i<vals.length?vals[i++]:null}}
function cell(g,x,y,c,a=1){g.globalAlpha=a;g.fillStyle=COLORS[c];g.fillRect(x*CELL+2,y*CELL+2,CELL-4,CELL-4);g.globalAlpha=1}
function draw(){ctx.clearRect(0,0,cv.width,cv.height);ctx.strokeStyle='#252b37';ctx.lineWidth=1;for(let x=1;x<W;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,H*CELL);ctx.stroke()}for(let y=1;y<H;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(W*CELL,y*CELL);ctx.stroke()}for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(board[y][x]!=null)cell(ctx,x,y,board[y][x]);if(piece&&!over){let ghost=0;while(!collide(piece,0,ghost+1))ghost++;for(const[x,y]of piece.cells)if(y+piece.y+ghost>=0)cell(ctx,x+piece.x,y+piece.y+ghost,piece.color,.18);for(const[x,y]of piece.cells)if(y+piece.y>=0)cell(ctx,x+piece.x,y+piece.y,piece.color)}if(over){ctx.fillStyle='#000b';ctx.fillRect(0,0,cv.width,cv.height);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 30px system-ui';ctx.fillText('GAME OVER',cv.width/2,cv.height/2)}drawNext()}
function drawNext(){nx.clearRect(0,0,nv.width,nv.height);queue.slice(0,3).forEach((p,i)=>{let sc=22,ox=12,oy=12+i*65;for(const[x,y]of p.cells){nx.fillStyle=COLORS[p.color];nx.fillRect(ox+x*sc,oy+y*sc,sc-3,sc-3)}})}
function sync(){document.querySelector('#score').textContent=score;document.querySelector('#bridges').textContent=bridges}
function reset(){board=Array.from({length:H},()=>Array(W).fill(null));queue=[];score=bridges=0;over=false;spawn();sync()}
function loop(t){let dt=t-last;last=t;acc+=dt;if(acc>interval){acc=0;down()}draw();requestAnimationFrame(loop)}
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);if(e.key==='ArrowDown')down();if(e.key==='ArrowUp')rotate();if(e.key===' ')hard()});
document.querySelectorAll('[data-a]').forEach(b=>b.addEventListener('pointerdown',()=>({left:()=>move(-1),right:()=>move(1),rotate,down,drop:hard}[b.dataset.a]())));document.querySelector('#restart').onclick=reset;reset();requestAnimationFrame(loop);
