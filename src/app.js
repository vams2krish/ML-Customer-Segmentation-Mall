import {segmentName} from './segment-name.js';
import './style.css';
import {help} from './help.js';
import csv from '../archive/Mall_Customers.csv?raw';
import {fit,parseCustomers} from './model.js';
const rows=parseCustomers(csv);
const colors=['#b5ed78','#72d8ff','#bdabff','#ffbe81','#ff8cb4','#76e2c4','#e7db8a','#9bb2ff'];
const names=['Overview','Segments','Predict'];
let model=fit(rows,5),active='Overview',filter=null;
const fmt=n=>Math.round(n).toLocaleString('en-US');
const root=document.querySelector('#app');
const avg=key=>fmt(rows.reduce((a,r)=>a+r[key],0)/rows.length);
root.innerHTML=`<aside><div class="brand"><span class="mark">◈</span><div>Segment Studio<small>RETAIL INTELLIGENCE</small></div></div><div class="nav-title">WORKSPACE</div><nav aria-label="Workspace">${names.map((n,i)=>`<button data-tab="${n}"><span aria-hidden="true">${['◫','◉','↗'][i]}</span>${n}</button>`).join('')}</nav><div class="aside-foot"><i></i> SAMPLE DATASET<small>Mall customers · 200 records</small></div></aside><main><header><div>Workspace <b>/</b> Customer analytics</div><span><i></i> K-MEANS MODEL</span></header><div id="view"></div><footer>SEGMENT STUDIO <span>Exploratory ML · Sample dataset</span></footer></main><dialog id="help-dialog" aria-labelledby="help-title" aria-describedby="help-text"><div class="eyebrow">SEGMENT STUDIO / FIELD GUIDE</div><h2 id="help-title"></h2><p id="help-text"></p><form method="dialog"><button class="primary" autofocus>Got it</button></form></dialog>`;
const view=document.querySelector('#view');
const dialog=document.querySelector('#help-dialog');
const hint=key=>`<button class="hint" type="button" data-help="${key}" aria-label="Help: ${key}" aria-haspopup="dialog">?</button>`;
let helpTrigger;
dialog.addEventListener('close',()=>helpTrigger?.focus());
const flow=()=>`<section class="panel flow"><div class="panel-head"><div><div class="eyebrow">MODEL IN MOTION</div><h2>How a segment is made ${hint('Model walkthrough')}</h2></div><span class="flow-badge">UNSUPERVISED ML</span></div><ol>${[['◫','01 / INPUT','Read the sample','200 customers · 3 features'],['⇄','02 / SCALE','Compare like for like','Scale each feature to comparable units'],['◉','03 / CLUSTER','Fit the groups',model.segments.length+' groups · 20 initializations'],['↗','04 / MATCH','Assign a profile','Nearest group center']].map(([icon,tag,title,detail])=>`<li><span class="flow-icon" aria-hidden="true">${icon}</span><small>${tag}</small><b>${title}</b><span>${detail}</span></li>`).join('')}</ol></section>`;
const heading=(tag,title,description)=>`<div class="intro"><div class="eyebrow">${tag}</div><h1 tabindex="-1">${title}</h1><p>${description}</p></div>`;
const chip=(i)=>`<i style="--segment:${colors[i]}"></i>`;
function scatter(){
  const x=v=>62+(v-10)*4.66,y=v=>296-v*2.55;
  const line=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const ticks=(v,a,b)=>`<text x="${a}" y="${b}">${v}</text>`;
  return `<svg class="scatter" viewBox="0 0 740 360" role="img" aria-label="Customer scatter plot: annual income versus spending score"><g class="grid">${[0,25,50,75,100].map(v=>line(62,y(v),690,y(v))).join('')}${[20,40,60,80,100,120,140].map(v=>line(x(v),41,x(v),296)).join('')}</g><g class="ticks">${[0,25,50,75,100].map(v=>ticks(v,39,y(v)+4)).join('')}${[20,40,60,80,100,120,140].map(v=>ticks(v,x(v),317)).join('')}${ticks('Annual income ($k)',376,345)}<text transform="translate(16 171) rotate(-90)">Spending score</text></g><g>${model.customers.map(r=>`<circle cx="${x(r.income)}" cy="${y(r.score)}" r="4.2" fill="${colors[r.segment]}" opacity="${filter===null||r.segment===filter?0.86:0.10}"/>`).join('')}${model.segments.map(s=>filter===null||s.i===filter?`<rect x="${x(s.center.income)-5}" y="${y(s.center.score)-5}" width="10" height="10" rx="2" fill="${colors[s.i]}" stroke="#101725" stroke-width="2" transform="rotate(45 ${x(s.center.income)} ${y(s.center.score)})"/>`:'').join('')}</g></svg>`;
}
function overview(){
  return `${heading('01 / MODEL OVERVIEW','Mall customer segments','Explore how 200 customers group by age, annual income, and spending score.')}<div class="metrics">${[['Customers',rows.length,'Dataset size'],['Active segments',model.segments.length,'Configured clusters'],['Avg. annual income','$'+avg('income')+'k','Across all customers'],['Avg. spending score',avg('score')+'/100','Across all customers']].map(([a,b,c])=>`<div class="panel stat"><span>${a} ${hint(a)}</span><strong>${b}</strong><small>${c}</small></div>`).join('')}</div><div class="dashboard"><section class="panel chart"><div class="panel-head"><div><h2>Customer landscape ${hint('Customer landscape')}</h2><p>Income and spending, colored by segment</p></div><div class="control"><label for="clusters">Clusters</label>${hint('Clusters')}<select id="clusters">${[2,3,4,5,6,7,8].map(k=>`<option ${k===model.segments.length?'selected':''}>${k}</option>`).join('')}</select></div></div><div id="plot">${scatter()}</div><div class="legend">${hint('Segment filter')}<button aria-pressed="${filter===null}" data-filter="all">All</button>${model.segments.map(s=>`<button aria-pressed="${filter===s.i}" data-filter="${s.i}">${chip(s.i)} ${segmentName(s.center)}</button>`).join('')}</div></section><section class="panel breakdown"><h2>Segment mix ${hint('Segment mix')}</h2><p>Share of the customer sample</p><div class="bars">${model.segments.map(s=>`<div><div class="bar-label"><span>${chip(s.i)} ${segmentName(s.center)}</span><b>${s.count} <small>/ ${rows.length}</small></b></div><div class="track"><div style="width:${s.count/rows.length*100}%;background:${colors[s.i]}"></div></div></div>`).join('')}</div><button class="secondary" data-tab="Segments">Explore segment profiles ↗</button></section></div><div class="note"><b>About this view</b> The chart shows two dimensions. Age also influences the clustering. Diamonds mark each segment’s average income and spending score.</div>${flow()}`;
}
function profiles(){
  return `${heading('02 / SEGMENT PROFILES','Compare your segments','Read each group’s size and centroid in the original customer units.')}<div class="profiles">${model.segments.map(s=>`<section class="panel profile"><div class="panel-head"><h2>${chip(s.i)} ${segmentName(s.center)} ${hint('Segment profile')}</h2><span>${(s.count/rows.length*100).toFixed(1)}% of sample ${hint('Sample share')}</span></div><strong>${s.count} <small>customers ${hint('Segment size')}</small></strong><dl><div><dt>Average age ${hint('Average age')}</dt><dd>${fmt(s.center.age)} years</dd></div><div><dt>Annual income ${hint('Annual income')}</dt><dd>$${fmt(s.center.income)}k</dd></div><div><dt>Spending score ${hint('Spending score')}</dt><dd>${fmt(s.center.score)}/100</dd></div></dl></section>`).join('')}</div><div class="note"><b>How to read these profiles</b> Names summarize each group’s average age, income, and spending score. Changing the cluster count can change the groups and their names.</div>`;
}
function predict(){
 return `${heading('03 / CUSTOMER ASSIGNMENT','Assign a customer','Enter a customer profile to find the nearest segment in the current model.')}<div class="prediction"><form class="panel" id="predict"><h2>Customer profile ${hint('Customer profile')}</h2><p>Using the current ${model.segments.length}-cluster model.</p><div class="field"><div><label for="age">Age (years)</label> ${hint('Age (years)')}</div><input id="age" name="age" type="number" min="0" max="120" step="1" required value="32"></div><div class="field"><div><label for="income">Annual income ($k)</label> ${hint('Annual income ($k)')}</div><input id="income" name="income" type="number" min="0" max="10000" step="any" required value="88"></div><div class="field"><div><label for="score">Spending score (1–100)</label> ${hint('Spending score (1–100)')}</div><input id="score" name="score" type="number" min="1" max="100" step="1" required value="78"></div><button class="primary" type="submit">Assign segment →</button></form><section class="panel result" aria-live="polite" id="result"><div class="mark">◈</div><h2>Assignment result ${hint('Assignment result')}</h2><p>Submit a customer profile to see its nearest segment and typical values.</p></section></div><div class="note"><b>Model scope</b> This demo uses a small sample. Inputs far outside the observed ranges may receive an assignment that is difficult to interpret.</div>`;
}
function show(focus=false){
  document.querySelectorAll('nav button').forEach(b=>{if(b.dataset.tab===active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  view.innerHTML=({Overview:overview,Segments:profiles,Predict:predict})[active]();
  if(focus) view.querySelector('h1').focus();
}
root.addEventListener('click',event=>{
  const b=event.target.closest('button');
  if(b?.dataset.help){
    helpTrigger=b;
    dialog.querySelector('#help-title').textContent=b.dataset.help;
    dialog.querySelector('#help-text').textContent=help[b.dataset.help];
    dialog.showModal();
  }
  if(b?.dataset.tab){active=b.dataset.tab;show(true);window.scrollTo(0,0);}
  if(b?.dataset.filter){
    filter=b.dataset.filter==='all'?null:+b.dataset.filter;
    document.querySelector('#plot').innerHTML=scatter();
    view.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button===b)));
  }
});
root.addEventListener('change',event=>{
  if(event.target.id==='clusters'){
    model=fit(rows,+event.target.value);filter=null;show();document.querySelector('#clusters').focus();
  }
});
root.addEventListener('submit',event=>{
  if(event.target.id!=='predict')return;
  event.preventDefault();
  const input=Object.fromEntries(Array.from(new FormData(event.target),([k,v])=>[k,Number(v)]));
  const s=model.predict(input), result=document.querySelector('#result');
  result.innerHTML=`<div class="eyebrow">NEAREST SEGMENT</div><h2>${chip(s.i)} ${segmentName(s.center)} ${hint('Assignment result')}</h2><p>${s.count} of ${rows.length} sample customers · ${model.segments.length} clusters</p><dl><div><dt>Average age ${hint('Average age')}</dt><dd>${fmt(s.center.age)} years</dd></div><div><dt>Annual income ${hint('Annual income')}</dt><dd>$${fmt(s.center.income)}k</dd></div><div><dt>Spending score ${hint('Spending score')}</dt><dd>${fmt(s.center.score)}/100</dd></div></dl>`;
});
show();
