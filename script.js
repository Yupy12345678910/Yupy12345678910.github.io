const LS='bf3',$=s=>document.querySelector(s);let DB;try{DB=JSON.parse(localStorage.getItem(LS))}catch(e){}
DB=DB||(()=>{let o;try{o=JSON.parse(localStorage.getItem('bf2'))}catch(e){}const n={users:{},coins:{},posts:[],me:null};if(!o)return n;const B=['xX_Noob_Xx','BloxWhale','OderDev','RobuxRick','Tycoon_Tim','AdoptMeApe','BrookhavenBro','GiraffeGuy','SkinnySlayer','PetSimPaul'],U=o.users||{};n.me=o.me;n.users=U;
Object.values(o.coins||{}).forEach(c=>{if(!B.includes(c.creator))n.coins[c.tk]=c});n.posts=(o.posts||[]).filter(p=>!B.includes(p.u));
Object.values(U).forEach(u=>{Object.keys(u.hold).forEach(t=>{if(!n.coins[t]){u.bal+=u.cost[t]||0;delete u.hold[t];delete u.cost[t]}});u.hist=u.hist.filter(h=>n.coins[h.tk])});
Object.values(n.coins).forEach(c=>{for(const h in c.holders)if(B.includes(h))delete c.holders[h];c.trades=c.trades.filter(t=>!B.includes(t.u))});return n})();
const save=()=>{try{localStorage.setItem(LS,JSON.stringify(DB))}catch(e){}},ME=()=>DB.users[DB.me],go=h=>location.hash='#/'+h,cur=()=>(location.hash.slice(2)||'').split('/');
const px=c=>c.R/c.T,mc=c=>px(c)*1e9,pct=c=>c.grad?100:(1-c.avail/8e8)*100,GM=3000*1073e6/(273e6**2)*1e9;
const f=(n,d=0)=>Number(n).toLocaleString(undefined,{maximumFractionDigits:d});
const fc=n=>{const u=ME();if(u&&u.set.compact===false)return f(n);return n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n.toFixed(0)};
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const ago=t=>{const s=(Date.now()-t)/1e3|0;return s<60?s+'s':s<3600?(s/60|0)+'m':s<86400?(s/3600|0)+'h':(s/86400|0)+'d'};
const hue=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))%360;return h},H=s=>{let h=5381;for(const c of s)h=(h*33)^c.charCodeAt(0);return(h>>>0).toString(36)};
const AV=(n,u,z=28)=>`<span class="av" style="width:${z}px;height:${z}px;font-size:${z*.45}px;background:${u?`center/cover url('${esc(u)}'),`:''}hsl(${hue(n)} 40% 30%)">${u?'':esc(n[0]||'?').toUpperCase()}</span>`;
const CI=(c,z)=>AV(c.tk,c.img,z),UA=(n,z)=>AV(n,(DB.users[n]||{}).av,z);
const pn=n=>`<span class="${n>=0?'g':'rd'}">${n>=0?'+':''}R$ ${f(n,2)}</span>`;
let Q='',TF=15,TM='buy',CT='trades',OR=null,DR='',FF='all',VM='pulse',PT='posts',AM='in',tick=0;
function mk(n,tk,d,cr,img){const now=Date.now(),c={name:n,tk,desc:d,img:img||'',creator:cr,R:3000,T:1073e6,avail:8e8,k:3000*1073e6,vol:0,created:now,holders:{},trades:[],ticks:[[now,3000/1073e6]]};DB.coins[tk]=c;return c}
function doTrade(c,s,a,u,ts=Date.now()){let r,t;
 if(s=='buy'){t=Math.min(c.T-c.k/(c.R+a),c.avail);r=c.k/(c.T-t)-c.R;c.R+=r;c.T-=t;c.avail-=t;c.holders[u]=(c.holders[u]||0)+t}
 else{t=a;const nT=c.T+t;r=c.R-c.k/nT;c.R-=r;c.T=nT;c.avail+=t;c.holders[u]-=t}
 c.vol+=r;c.trades.unshift({s,u,r,t,ts});if(c.trades.length>60)c.trades.length=60;c.ticks.push([ts,px(c),r]);if(c.ticks.length>1500)c.ticks.shift();
 if(c.avail<1){c.avail=0;c.grad=c.grad||ts}return{r,t}}
function userTrade(c,s,a,ns){const u=ME();a=+a;if(!(a>0))return toast('Enter an amount','err');
 if(!ns&&Math.random()*1.2>u.set.slip)return toast('Slippage exceeded, retry or raise tolerance','err');
 if(s=='buy'){if(c.grad)return toast('Graduated: curve closed, only selling is available','err');if(a>u.bal+.001)return toast('Insufficient balance','err');
  const x=doTrade(c,'buy',Math.min(a,u.bal),u.name);u.bal-=x.r;u.hold[c.tk]=(u.hold[c.tk]||0)+x.t;u.cost[c.tk]=(u.cost[c.tk]||0)+x.r;u.hist.unshift({s,tk:c.tk,r:x.r,t:x.t,ts:Date.now()});toast(`Bought ${fc(x.t)} $${c.tk} for R$ ${f(x.r,2)}`)}
 else{const h=u.hold[c.tk]||0;if(a>h+.01)return toast('Not enough tokens','err');a=Math.min(a,h);const x=doTrade(c,'sell',a,u.name),pt=(u.cost[c.tk]||0)*(a/h);
  u.cost[c.tk]-=pt;u.real+=x.r-pt;u.bal+=x.r;u.hold[c.tk]-=a;u.hist.unshift({s,tk:c.tk,r:x.r,t:a,ts:Date.now()});toast(`Sold ${fc(a)} $${c.tk} for R$ ${f(x.r,2)}`)}
 if(u.hist.length>200)u.hist.length=200;save();updBal();live()}
function toast(m,t){const e=$('#toast');e.textContent=m;e.className=t||'';e.style.display='block';clearTimeout(e.t);e.t=setTimeout(()=>e.style.display='none',2600)}
function modal(h){$('#modal').innerHTML=h?`<div class="mb" onclick="if(event.target==this)modal()"><div class="mc">${h}</div></div>`:''}
const updBal=()=>{const u=ME();if(!u)return;['#bal','#bl2'].forEach(s=>{const e=$(s);if(e)e.textContent=f(u.bal,2)})};
const setAcc=()=>document.documentElement.style.setProperty('--ac',ME().set.acc);
/* AUTH */
function authUI(){const a=$('#auth');a.style.display='flex';a.innerHTML=`<div class="am"><div class="lg">BLOX<span>.FUN</span></div><div class="mu">Sandbox terminal. Fake Robux; accounts are stored only in this browser.</div><div class="sg"><a class="${AM=='in'?'on':''}" onclick="AM='in';authUI()">Log in</a><a class="${AM=='up'?'on':''}" onclick="AM='up';authUI()">Sign up</a></div><input id="au" placeholder="Username" maxlength="16" autocomplete="off"><input id="ap" type="password" placeholder="Password">${AM=='up'?'<input id="aa" placeholder="Avatar image URL (optional)">':''}<div id="ae" class="err"></div><button class="bt pr" style="width:100%" onclick="doAuth()">${AM=='in'?'Log in':'Create account (R$ 25,000)'}</button></div>`}
function doAuth(){const n=$('#au').value.trim(),p=$('#ap').value,e=m=>$('#ae').textContent=m;
 if(AM=='in'){const u=DB.users[n];if(!u||u.pw!=H(p))return e('Wrong username or password')}
 else{if(!/^\w{3,16}$/.test(n))return e('Username: 3-16 letters, numbers, underscore');if(p.length<4)return e('Password needs 4+ characters');if(DB.users[n])return e('Username taken');
  DB.users[n]={name:n,pw:H(p),av:$('#aa').value.trim(),bio:'',bal:25000,hold:{},cost:{},real:0,hist:[],fol:[],joined:Date.now(),set:{slip:3,buy:500,conf:false,compact:true,acc:'#5b8cff',tf:15}}}
 DB.me=n;save();boot()}
document.addEventListener('keydown',e=>{if(e.key=='Enter'&&$('#auth').style.display=='flex')doAuth()});
/* SHELL */
function side(){const p=cur()[0],n=[['','Discover'],['feed','Feed'],['portfolio','Portfolio'],['u/'+DB.me,'Profile'],['settings','Settings']];
 $('#side').innerHTML=`<div class="lg" onclick="go('')">BLOX<span>.FUN</span></div>`+n.map(([h,l])=>`<a class="nv ${h.split('/')[0]==p?'on':''}" onclick="go('${h}')">${l}</a>`).join('')+`<button class="bt pr" onclick="launch()">+ Create Coin</button><div class="sb mu">SANDBOX / fake Robux<br>data lives in your browser</div>`}
function topbar(){const u=ME();$('#top').innerHTML=`<input id="q" placeholder="Search name, ticker or creator" value="${esc(Q)}" oninput="Q=this.value;cur()[0]?go(''):vw()"><button class="bt" style="margin-left:auto" onclick="dep()">R$ <b id="bal">${f(u.bal,2)}</b> +</button><div class="uc" onclick="go('u/${u.name}')">${AV(u.name,u.av,22)}<b>${u.name}</b></div>`}
function route(){if(!ME())return;side();vw();window.scrollTo(0,0)}
function vw(){const p=cur(),v=$('#view');({'':vDisc,coin:()=>vCoin(p[1]),feed:vFeed,portfolio:vPort,u:()=>vProf(p[1]),settings:vSet}[p[0]]||vDisc)()}
function boot(){if(!ME()){authUI();return}$('#auth').style.display='none';TF=ME().set.tf;setAcc();topbar();route()}
const sn=(base,it,c)=>`<div>${it.map(([k,l])=>`<a class="nv ${c==k?'on':''}" onclick="go('${base}/${k}')">${l}</a>`).join('')}</div>`;
/* DISCOVER */
const card=c=>`<div class="cc" onclick="go('coin/${c.tk}')">${CI(c,56)}<div class="ci"><div><b>${esc(c.name)}</b> <span class="mu">$${c.tk}</span><span class="mu fr">${ago(c.created)}</span></div><div class="mu">by <a onclick="event.stopPropagation();go('u/${c.creator}')">${c.creator}</a> / ${Object.values(c.holders).filter(v=>v>1).length} holders</div><div class="r3"><span>MC <b class="g">R$ ${fc(mc(c))}</b></span><span>Vol <b>${fc(c.vol)}</b></span></div><div class="bar"><i style="width:${pct(c)}%"></i></div></div></div>`;
function vDisc(){const q=Q.toLowerCase(),A=Object.values(DB.coins),L=A.filter(c=>!q||(c.name+c.tk+c.creator).toLowerCase().includes(q)),k=A.filter(c=>!c.grad).sort((a,b)=>mc(b)-mc(a))[0];
 const col=(t,l)=>`<div class="col"><div class="cH">${t}<span class="mu">${l.length}</span></div>${l.map(card).join('')||'<div class="em">No coins yet. Create the first one.</div>'}</div>`;
 const tb=`<table class="tbl"><tr><th>Coin<th>Price<th>MCap<th>Vol<th>Holders<th>Curve<th>Age</tr>${L.sort((a,b)=>mc(b)-mc(a)).map(c=>`<tr class="k" onclick="go('coin/${c.tk}')"><td><span style="display:flex;gap:8px;align-items:center">${CI(c,24)}<b>${esc(c.name)}</b> <span class="mu">$${c.tk}</span></span><td>${px(c).toFixed(8)}<td class="g">R$ ${fc(mc(c))}<td>${fc(c.vol)}<td>${Object.values(c.holders).filter(v=>v>1).length}<td>${pct(c).toFixed(0)}%<td class="mu">${ago(c.created)}</tr>`).join('')}</table>`;
 $('#view').innerHTML=`<div class="hd"><h1>Discover</h1><div class="sg"><a class="${VM=='pulse'?'on':''}" onclick="VM='pulse';vw()">Pulse</a><a class="${VM=='table'?'on':''}" onclick="VM='table';vw()">Table</a></div></div>`+
 (k?`<div class="king" onclick="go('coin/${k.tk}')">${CI(k,44)}<div><div class="mu">KING OF THE HILL</div><b>${esc(k.name)}</b> $${k.tk}</div><div>MC <b class="g">R$ ${fc(mc(k))}</b></div></div>`:'')+
 (VM=='pulse'?`<div class="cols">${col('New Pairs',L.filter(c=>!c.grad&&pct(c)<40).sort((a,b)=>b.created-a.created))}${col('Final Stretch',L.filter(c=>!c.grad&&pct(c)>=40).sort((a,b)=>pct(b)-pct(a)))}${col('Graduated',L.filter(c=>c.grad))}</div>`:`<div class="pn">${tb}</div>`)}
/* COIN */
const stats=c=>{const t=c.ticks.find(x=>x[0]>Date.now()-3e5),ch=t?(px(c)/t[1]-1)*100:0;return[['Price',px(c).toFixed(9)],['MCap','R$ '+fc(mc(c))],['Volume','R$ '+fc(c.vol)],['5m',`<span class="${ch>=0?'g':'rd'}">${ch>=0?'+':''}${ch.toFixed(1)}%</span>`],['Holders',Object.values(c.holders).filter(v=>v>1).length]].map(([l,v])=>`<div><span class="mu">${l}</span><b>${v}</b></div>`).join('')};
const bond=c=>`<div class="cH">Bonding curve</div><div style="padding:12px"><div class="mu">${c.grad?'Graduated to BloxSwap':pct(c).toFixed(1)+'% sold, graduates when the curve sells out'}</div><div class="bar big"><i style="width:${pct(c)}%"></i></div><div class="kv"><span class="mu">Reserve</span><b>R$ ${f(c.R)}</b></div><div class="kv"><span class="mu">Left on curve</span><b>${fc(c.avail)}</b></div><div class="kv"><span class="mu">Graduates at</span><b>~R$ ${fc(GM)} MC</b></div></div>`;
function ctab(c){if(CT=='trades')return`<div class="tr5 h"><span>Type<span></span></span><span>User</span><span>R$</span><span>Tokens</span><span>Age</span></div>`+(c.trades.slice(0,40).map(t=>`<div class="tr5"><b class="${t.s=='buy'?'t-b':'t-s'}">${t.s.toUpperCase()}</b><span>${esc(t.u)}</span><span>${f(t.r)}</span><span>${fc(t.t)}</span><span class="mu">${ago(t.ts)}</span></div>`).join('')||'<div class="em">No trades</div>');
 if(CT=='holders'){const h=Object.entries(c.holders).filter(x=>x[1]>1).sort((a,b)=>b[1]-a[1]).slice(0,20);return h.map(([n,v],i)=>`<div class="tr5" style="grid-template-columns:30px 1fr 1fr 60px"><span class="mu">${i+1}</span><a onclick="go('u/${n}')">${esc(n)}</a><span>${fc(v)}</span><span>${(v/1e7).toFixed(2)}%</span></div>`).join('')||'<div class="em">No holders</div>'}
 return`<div style="padding:12px"><textarea id="tr2" placeholder="Post about $${c.tk}..." maxlength="280"></textarea><div class="row"><span class="mu">Auto-tags $${c.tk}</span><button class="bt pr" onclick="newPost('tr2','${c.tk}')">Post</button></div></div>`+(DB.posts.filter(p=>p.text.toUpperCase().includes('$'+c.tk)).slice(0,40).map(post).join('')||'<div class="em">No posts yet</div>')}
function vCoin(tk){const c=DB.coins[tk],u=ME();if(!c)return $('#view').innerHTML='<div class="em">Coin not found</div>';const h=u.hold[tk]||0;
 $('#view').innerHTML=`<div class="cp"><div><div class="pn ch">${CI(c,48)}<div><b class="lh">${esc(c.name)}</b> <span class="mu">$${c.tk}</span><div class="mu">by <a onclick="go('u/${c.creator}')">${c.creator}</a> / ${ago(c.created)} ago</div></div><div class="cs" id="cs">${stats(c)}</div></div>
 <div class="pn"><div class="tb">${[5,15,60,300].map(t=>`<a class="${TF==t?'on':''}" onclick="TF=${t};vw()">${t<60?t+'s':t/60+'m'}</a>`).join('')}</div><div id="cv"></div></div>
 <div class="pn"><div class="tb">${['trades','holders','thread'].map(t=>`<a class="${CT==t?'on':''}" onclick="CT='${t}';vw()">${t}</a>`).join('')}</div><div id="ctab" style="padding:0!important">${ctab(c)}</div></div></div>
 <div><div class="pn"><div class="sw"><a class="${TM=='buy'?'b':''}" onclick="TM='buy';vw()">BUY</a><a class="${TM=='sell'?'s':''}" onclick="TM='sell';vw()">SELL</a></div><div>
 <div class="row mu" style="margin-bottom:6px"><span>${TM=='buy'?'Amount (R$)':'Amount ($'+c.tk+')'}</span><span>${TM=='buy'?'Bal R$ <span id="bl2">'+f(u.bal,2)+'</span>':'Held '+fc(h)}</span></div>
 <input id="amt" type="number" min="0" value="${TM=='buy'?u.set.buy:0}" oninput="est()">
 <div class="ps">${TM=='buy'?[100,500,1000,5000].map(n=>`<button class="bt" onclick="setAmt(${n})">${fc(n)}</button>`).join(''):[25,50,75,100].map(n=>`<button class="bt" onclick="setPct(${n})">${n}%</button>`).join('')}</div>
 <div class="kv"><span class="mu">You receive</span><b id="est">0</b></div><div class="kv"><span class="mu">Slippage</span><b>${u.set.slip}% <a onclick="go('settings/trading')">edit</a></b></div>
 <button class="bt ${TM=='buy'?'buy':'sell'}" style="width:100%;margin-top:8px;padding:11px" onclick="ex()">${TM=='buy'?'Buy':'Sell'} $${c.tk}</button></div></div>
 <div class="pn" id="cb">${bond(c)}</div><div class="pn"><div class="cH">About</div><div style="padding:12px">${esc(c.desc)}</div></div></div></div>`;est();draw(c)}
function setAmt(n){$('#amt').value=n;est()}function setPct(p){const h=ME().hold[cur()[1]]||0;$('#amt').value=Math.floor(h*p)/100;est()}
function est(){const c=DB.coins[cur()[1]],v=+($('#amt')||{}).value||0,e=$('#est');if(!c||!e)return;e.textContent=TM=='buy'?f(Math.min(c.T-c.k/(c.R+v),c.avail))+' $'+c.tk:'R$ '+f(c.R-c.k/(c.T+v),2)}
function ex(){const c=DB.coins[cur()[1]],v=$('#amt').value;if(ME().set.conf&&!confirm(`${TM} ${v} on $${c.tk}?`))return;userTrade(c,TM,v)}
let CH,SR,VR,CE;
function draw(c){const el=$('#cv');if(!el||typeof LightweightCharts=='undefined')return;
 if(!CH||CE!==el){try{CH&&CH.remove()}catch(e){}CE=el;CH=LightweightCharts.createChart(el,{width:el.clientWidth,height:el.clientHeight,layout:{background:{color:'#0f1116'},textColor:'#778095',fontFamily:'ui-monospace,monospace'},grid:{vertLines:{color:'#161a22'},horzLines:{color:'#161a22'}},crosshair:{mode:0},rightPriceScale:{borderColor:'#1e222c',scaleMargins:{top:.08,bottom:.25}},timeScale:{borderColor:'#1e222c',timeVisible:true,secondsVisible:true}});
  SR=CH.addCandlestickSeries({upColor:'#2bd67b',downColor:'#f2466d',borderUpColor:'#2bd67b',borderDownColor:'#f2466d',wickUpColor:'#2bd67b',wickDownColor:'#f2466d',priceFormat:{type:'price',precision:9,minMove:1e-9}});
  VR=CH.addHistogramSeries({priceFormat:{type:'volume'},priceScaleId:'vol'});CH.priceScale('vol').applyOptions({scaleMargins:{top:.8,bottom:0}})}
 CH.applyOptions({width:el.clientWidth});const m=new Map();
 for(const[t,p,v]of c.ticks){const k=Math.floor(t/1e3/TF)*TF,o=m.get(k);if(o){o.high=Math.max(o.high,p);o.low=Math.min(o.low,p);o.close=p;o.v+=v||0}else m.set(k,{time:k,open:p,high:p,low:p,close:p,v:v||0})}
 const K=[...m.values()].sort((a,b)=>a.time-b.time);for(let i=1;i<K.length;i++){K[i].open=K[i-1].close;K[i].high=Math.max(K[i].high,K[i].open);K[i].low=Math.min(K[i].low,K[i].open)}
 SR.setData(K.map(({time,open,high,low,close})=>({time,open,high,low,close})));VR.setData(K.map(k=>({time:k.time,value:k.v,color:k.close>=k.open?'#2bd67b66':'#f2466d66'})));if(!el.dataset.f){CH.timeScale().fitContent();el.dataset.f=1}}
/* POSTS */
const fmt=t=>esc(t).replace(/\$([A-Za-z0-9]{1,8})/g,(m,k)=>DB.coins[k.toUpperCase()]?`<a class="tg" onclick="go('coin/${k.toUpperCase()}')">$${k.toUpperCase()}</a>`:m).replace(/@(\w{2,16})/g,'<a class="mn" onclick="go(\'u/$1\')">@$1</a>');
function post(p){const m=p.text.match(/\$([A-Za-z0-9]{1,8})/),cn=m&&DB.coins[m[1].toUpperCase()],me=DB.me;
 return`<div class="po"><div class="pa" onclick="go('u/${p.u}')">${UA(p.u,36)}</div><div class="pb"><div><b onclick="go('u/${p.u}')">${esc(p.u)}</b> <span class="mu">${ago(p.ts)}</span>${p.u==me?`<a class="mu fr" onclick="delPost(${p.id})">delete</a>`:''}</div><div class="pt">${fmt(p.text)}</div>
 ${cn?`<div class="mini" onclick="go('coin/${cn.tk}')">${CI(cn,22)}<b>${esc(cn.name)}</b><span class="mu">$${cn.tk}</span><span class="g">MC R$ ${fc(mc(cn))}</span></div>`:''}
 <div class="pf"><a class="${p.likes.includes(me)?'on':''}" onclick="like(${p.id})">&#9829; ${p.likes.length}</a><a onclick="tgR(${p.id})">Reply ${p.rep.length}</a></div>
 ${OR==p.id?`<div class="rp">${p.rep.map(r=>`<div><b>${esc(r.u)}</b> <span class="mu">${ago(r.ts)}</span><div>${fmt(r.text)}</div></div>`).join('')}<div class="row" style="margin-top:8px"><input id="ri" placeholder="Reply..." maxlength="200" style="margin:0"><button class="bt pr" onclick="reply(${p.id})">Send</button></div></div>`:''}</div></div>`}
function newPost(id,tk){const el=$('#'+id);let t=el.value.trim();if(!t)return;if(tk&&!new RegExp('\\$'+tk,'i').test(t))t='$'+tk+' '+t;DB.posts.unshift({id:Date.now()*1000+(Math.random()*1000|0),u:DB.me,text:t.slice(0,280),ts:Date.now(),likes:[],rep:[]});DR='';save();vw()}
const fp=id=>DB.posts.find(x=>x.id==id);
function like(id){const p=fp(id),i=p.likes.indexOf(DB.me);i<0?p.likes.push(DB.me):p.likes.splice(i,1);save();vw()}
function tgR(id){OR=OR==id?null:id;vw()}function reply(id){const v=$('#ri').value.trim();if(!v)return;fp(id).rep.push({u:DB.me,text:v,ts:Date.now()});save();vw()}
function delPost(id){DB.posts=DB.posts.filter(p=>p.id!=id);save();vw()}
function vFeed(){const u=ME();let L=DB.posts;if(FF=='fol')L=L.filter(p=>u.fol.includes(p.u)||p.u==u.name);if(FF=='men')L=L.filter(p=>p.text.includes('@'+u.name));
 $('#view').innerHTML=`<div class="fd"><div><div class="pn cmp">${UA(u.name,36)}<div style="flex:1"><textarea id="dr" maxlength="280" placeholder="What's happening? Tag coins with $TICKER and people with @username" oninput="DR=this.value">${esc(DR)}</textarea><div class="row"><span class="mu">280 max</span><button class="bt pr" onclick="newPost('dr')">Post</button></div></div></div>
 <div class="sg" style="margin-bottom:12px">${[['all','All'],['fol','Following'],['men','Mentions']].map(([k,l])=>`<a class="${FF==k?'on':''}" onclick="FF='${k}';vw()">${l}</a>`).join('')}</div>${L.slice(0,80).map(post).join('')||'<div class="em">No posts here yet</div>'}</div>
 <div><div class="pn"><div class="cH">Trending coins</div>${Object.values(DB.coins).sort((a,b)=>b.vol-a.vol).slice(0,6).map(c=>`<div class="tr" onclick="go('coin/${c.tk}')">${CI(c,28)}<b>$${c.tk}</b><span class="g" style="margin-left:auto">R$ ${fc(mc(c))}</span></div>`).join('')}</div></div></div>`}
/* PORTFOLIO */
function qs(tk,p){const h=ME().hold[tk]||0;userTrade(DB.coins[tk],'sell',Math.floor(h*p)/100,1)}
function vPort(){const u=ME(),s=cur()[1]||'overview',Hd=Object.keys(u.hold).filter(t=>u.hold[t]>.0001&&DB.coins[t]);
 const val=Hd.reduce((a,t)=>a+u.hold[t]*px(DB.coins[t]),0),cost=Hd.reduce((a,t)=>a+(u.cost[t]||0),0),sx=(l,v)=>`<div><span class="mu">${l}</span><b>${v}</b></div>`;let b='';
 if(s=='overview')b=`<div class="stats">${sx('Cash','R$ '+f(u.bal,2))+sx('Holdings value','R$ '+f(val,2))+sx('Net worth','R$ '+f(u.bal+val,2))+sx('Unrealized PnL',pn(val-cost))+sx('Realized PnL',pn(u.real))}</div><div class="pn"><div class="cH">Top positions</div>${Hd.sort((a,b)=>u.hold[b]*px(DB.coins[b])-u.hold[a]*px(DB.coins[a])).slice(0,5).map(t=>`<div class="tr" onclick="go('coin/${t}')">${CI(DB.coins[t],26)}<b>$${t}</b><span style="margin-left:auto">R$ ${f(u.hold[t]*px(DB.coins[t]),2)}</span></div>`).join('')||'<div class="em">No positions yet</div>'}</div>`;
 if(s=='holdings')b=`<div class="pn"><table class="tbl"><tr><th>Coin<th>Balance<th>Value<th>Cost<th>PnL<th></tr>${Hd.map(t=>{const v=u.hold[t]*px(DB.coins[t]);return`<tr><td><a onclick="go('coin/${t}')">$${t}</a><td>${fc(u.hold[t])}<td>R$ ${f(v,2)}<td>R$ ${f(u.cost[t]||0,2)}<td>${pn(v-(u.cost[t]||0))}<td><button class="bt" onclick="qs('${t}',50)">50%</button> <button class="bt sell" onclick="qs('${t}',100)">Sell all</button></tr>`}).join('')||'<tr><td colspan="6" class="em">No positions</tr>'}</table></div>`;
 if(s=='history')b=`<div class="pn"><table class="tbl"><tr><th>Side<th>Coin<th>R$<th>Tokens<th>Age</tr>${u.hist.slice(0,100).map(h=>`<tr><td class="${h.s=='buy'?'t-b':'t-s'}"><b>${h.s.toUpperCase()}</b><td>$${h.tk}<td>${f(h.r,2)}<td>${fc(h.t)}<td class="mu">${ago(h.ts)}</tr>`).join('')||'<tr><td colspan="5" class="em">No trades yet</tr>'}</table></div>`;
 if(s=='created')b=`<div class="pn">${Object.values(DB.coins).filter(c=>c.creator==u.name).map(card).join('')||'<div class="em">You have not launched a coin</div>'}</div>`;
 $('#view').innerHTML=`<div class="hd"><h1>Portfolio</h1></div><div class="lay">${sn('portfolio',[['overview','Overview'],['holdings','Holdings'],['history','History'],['created','Created']],s)}<div>${b}</div></div>`}
/* PROFILE */
function follow(n){const u=ME(),i=u.fol.indexOf(n);i<0?u.fol.push(n):u.fol.splice(i,1);save();vw()}
function vProf(n){const u=DB.users[n],me=ME(),P=DB.posts.filter(p=>p.u==n),C=Object.values(DB.coins).filter(c=>c.creator==n),fl=Object.values(DB.users).filter(x=>x.fol.includes(n)).length;
 $('#view').innerHTML=`<div class="pn"><div class="ch" style="padding:16px">${UA(n,64)}<div><h1>${esc(n)}</h1><div class="mu">${u?esc(u.bio)||'No bio yet':'Anonymous trader'}</div></div>${n==me.name?`<button class="bt fr" style="margin-left:auto" onclick="go('settings/profile')">Edit profile</button>`:`<button class="bt ${me.fol.includes(n)?'':'pr'}" style="margin-left:auto" onclick="follow('${n}')">${me.fol.includes(n)?'Unfollow':'Follow'}</button>`}</div>
 <div class="stats" style="padding:0 12px;margin:0">${[['Posts',P.length],['Coins created',C.length],['Followers',fl],['Following',u?u.fol.length:0]].map(([l,v])=>`<div><span class="mu">${l}</span><b>${v}</b></div>`).join('')}</div><div class="tb">${['posts','coins'].map(t=>`<a class="${PT==t?'on':''}" onclick="PT='${t}';vw()">${t}</a>`).join('')}</div></div>
 ${PT=='posts'?P.map(post).join('')||'<div class="em">No posts</div>':`<div class="pn">${C.map(card).join('')||'<div class="em">No coins</div>'}</div>`}`}
/* SETTINGS */
function vSet(){const u=ME(),s=cur()[1]||'profile',o=(v,a)=>`<option value="${v}" ${a==v?'selected':''}>${v}${typeof v=='number'&&v<10?'%':''}</option>`;let b='';
 if(s=='profile')b=`<label>Username</label><input id="s1" value="${u.name}" maxlength="16"><label>Avatar image URL</label><input id="s2" value="${esc(u.av)}"><label>Bio</label><textarea id="s3" maxlength="120">${esc(u.bio)}</textarea><button class="bt pr" onclick="saveProf()">Save profile</button>`;
 if(s=='trading')b=`<label>Slippage tolerance</label><select id="s1">${[.5,1,3,5].map(v=>`<option value="${v}" ${u.set.slip==v?'selected':''}>${v}%</option>`).join('')}</select><label>Default buy amount (R$)</label><input id="s2" type="number" value="${u.set.buy}"><label>Default chart timeframe</label><select id="s3">${[5,15,60,300].map(v=>`<option value="${v}" ${u.set.tf==v?'selected':''}>${v<60?v+'s':v/60+'m'}</option>`).join('')}</select><div class="chk"><input id="s4" type="checkbox" ${u.set.conf?'checked':''}> Confirm every trade</div><button class="bt pr" onclick="saveTrade()">Save trading settings</button>`;
 if(s=='appearance')b=`<label>Accent color</label><div class="sws">${['#5b8cff','#8b5cf6','#2bd67b','#f5a524','#f2466d'].map(c=>`<a class="${u.set.acc==c?'on':''}" style="background:${c}" onclick="ME().set.acc='${c}';save();setAcc();vw()"></a>`).join('')}</div><div class="chk"><input type="checkbox" ${u.set.compact?'checked':''} onchange="ME().set.compact=this.checked;save()"> Compact numbers (1.2K instead of 1,200)</div>`;
 if(s=='account')b=`<div class="kv"><span class="mu">Joined</span><b>${new Date(u.joined).toLocaleDateString()}</b></div><br><button class="bt" onclick="dep()">Robux faucet</button> <button class="bt" onclick="expo()">Export data</button> <button class="bt" onclick="DB.me=null;save();location.hash='';boot()">Log out</button><br><br><button class="bt" onclick="if(confirm('Reset balance, holdings and history?')){Object.assign(ME(),{bal:25000,hold:{},cost:{},real:0,hist:[]});save();topbar();vw()}">Reset account</button> <button class="bt sell" onclick="if(confirm('Delete account permanently?')){delete DB.users[DB.me];DB.me=null;save();boot()}">Delete account</button>`;
 $('#view').innerHTML=`<div class="hd"><h1>Settings</h1></div><div class="lay">${sn('settings',[['profile','Profile'],['trading','Trading'],['appearance','Appearance'],['account','Account']],s)}<div class="pn set"><div>${b}</div></div></div>`}
function saveProf(){const u=ME(),n=$('#s1').value.trim();if(n!=u.name){if(!/^\w{3,16}$/.test(n))return toast('Invalid username','err');if(DB.users[n])return toast('Username taken','err');const o=u.name;
 DB.users[n]=u;delete DB.users[o];u.name=n;DB.me=n;Object.values(DB.users).forEach(x=>x.fol=x.fol.map(y=>y==o?n:y));
 Object.values(DB.coins).forEach(c=>{if(c.creator==o)c.creator=n;if(o in c.holders){c.holders[n]=c.holders[o];delete c.holders[o]}c.trades.forEach(t=>{if(t.u==o)t.u=n})});
 DB.posts.forEach(p=>{if(p.u==o)p.u=n;p.rep.forEach(r=>{if(r.u==o)r.u=n});p.likes=p.likes.map(y=>y==o?n:y)})}
 u.av=$('#s2').value.trim();u.bio=$('#s3').value.trim();save();topbar();side();toast('Profile saved')}
function saveTrade(){const s=ME().set;s.slip=+$('#s1').value;s.buy=+$('#s2').value||500;s.tf=TF=+$('#s3').value;s.conf=$('#s4').checked;save();toast('Saved')}
function expo(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(ME(),null,1)],{type:'application/json'}));a.download='bloxfun-account.json';a.click()}
/* MODALS */
function dep(){modal(`<h2>Robux faucet</h2><p class="mu" style="margin-bottom:12px">Sandbox top-up. No real money involved.</p><div class="ps" style="grid-template-columns:1fr 1fr">${[1000,5000,25000,100000].map(n=>`<button class="bt" onclick="ME().bal+=${n};save();updBal();modal()">+R$ ${f(n)}</button>`).join('')}</div>`)}
function launch(){modal(`<h2>Create coin</h2><input id="ln" placeholder="Name" maxlength="24"><input id="lt" placeholder="Ticker (2-8 letters/numbers)" maxlength="8"><textarea id="ld" placeholder="Description"></textarea><input id="li" placeholder="Image URL (optional)"><label class="mu">Dev buy (R$, optional)</label><input id="lb" type="number" value="0" min="0"><div class="row"><button class="bt" onclick="modal()">Cancel</button><button class="bt pr" onclick="mkCoin()">Launch</button></div>`)}
function mkCoin(){const n=$('#ln').value.trim(),t=$('#lt').value.trim().toUpperCase(),b=+$('#lb').value||0,u=ME();
 if(!n||!/^[A-Z0-9]{2,8}$/.test(t))return toast('Enter a name and a 2-8 char ticker','err');if(DB.coins[t])return toast('Ticker exists','err');if(b>u.bal)return toast('Insufficient balance','err');
 const c=mk(n,t,$('#ld').value.trim()||'No description.',u.name,$('#li').value.trim());modal();if(b>0)userTrade(c,'buy',b,1);save();go('coin/'+t)}
/* LOOP */
function live(){const p=cur(),u=ME();if(!u)return;updBal();
 if(p[0]=='coin'){const c=DB.coins[p[1]];if(!c||!$('#cs'))return;$('#cs').innerHTML=stats(c);draw(c);$('#cb').innerHTML=bond(c);if(CT!='thread')$('#ctab').innerHTML=ctab(c);est()}
 else if(!(++tick%3)&&document.activeElement.id!='q'&&(p[0]==''||(p[0]=='portfolio'&&p[1]!='created')))vw()}
setInterval(()=>{if(ME())live()},3000);
onhashchange=route;boot();
