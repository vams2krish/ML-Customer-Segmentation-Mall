export const fields = ['age', 'income', 'score'];
export function parseCustomers(csv) {
  const [header, ...lines] = csv.trim().split(/\r?\n/);
  if (header !== 'CustomerID,Genre,Age,Annual Income (k$),Spending Score (1-100)') throw Error('Unexpected dataset columns');
  const ids = new Set();
  return lines.map(line => {
    const [id, , age, income, score, ...extra] = line.split(',');
    if (!id || ids.has(id) || extra.length) throw Error('Invalid customer row');
    ids.add(id);
    if ([age,income,score].some(x => !x?.trim() || !Number.isFinite(Number(x)))) throw Error('Missing or invalid feature');
    return {id, age:+age, income:+income, score:+score};
  });
}
const sq = (a,b) => a.reduce((s,x,i)=>s+(x-b[i])**2,0);
const closest = (p,cs) => cs.reduce((i,c,j)=>sq(p,c)<sq(p,cs[i])?j:i,0);
export function fit(rows,k) {
  if (!Number.isInteger(k) || k<2 || k>rows.length) throw RangeError('Invalid cluster count');
  const raw=rows.map(r=>fields.map(f=>r[f]));
  if(raw.some(p=>p.some(x=>!Number.isFinite(x))) || new Set(raw.map(p=>p.join(','))).size<k) throw Error('Insufficient distinct valid customers');
  const mean=fields.map((_,i)=>raw.reduce((a,p)=>a+p[i],0)/raw.length);
  const sd=mean.map((m,i)=>Math.sqrt(raw.reduce((a,p)=>a+(p[i]-m)**2,0)/raw.length)||1);
  const scale=p=>p.map((x,i)=>(x-mean[i])/sd[i]);
  const points=raw.map(scale);
  let seed=42;
  const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  let best;
  for(let restart=0;restart<20;restart++){
    let centers=[points[Math.floor(rand()*points.length)]];
    while(centers.length<k){
      const weights=points.map(p=>Math.min(...centers.map(c=>sq(p,c))));
      let pick=rand()*weights.reduce((a,b)=>a+b,0);
      centers.push(points[weights.findIndex(w=>(pick-=w)<0)] ?? points[weights.findLastIndex(w=>w>0)]);
    }
    for(let step=0;step<300;step++){
      const groups=Array.from({length:k},()=>[]);
      points.forEach(p=>groups[closest(p,centers)].push(p));
      if(groups.some(g=>!g.length)) break;
      const next=groups.map(g=>mean.map((_,i)=>g.reduce((s,p)=>s+p[i],0)/g.length));
      const stable=next.every((c,i)=>sq(c,centers[i])<1e-14);
      centers=next;
      if(stable) break;
    }
    const labels=points.map(p=>closest(p,centers));
    if(new Set(labels).size!==k) continue;
    const inertia=points.reduce((s,p,i)=>s+sq(p,centers[labels[i]]),0);
    if(!best || inertia<best.inertia) best={centers,inertia};
  }
  if(!best) throw Error('Unable to fit nonempty clusters');
  best.centers.sort((a,b)=>a[1]-b[1] || a[2]-b[2] || a[0]-b[0]);
  const segments=best.centers.map((c,i)=>{
    const center=Object.fromEntries(fields.map((f,j)=>[f,c[j]*sd[j]+mean[j]]));
    return {i,center,count:0};
  });
  const customers=rows.map((row,i)=>({...row,segment:closest(points[i],best.centers)}));
  customers.forEach(r=>segments[r.segment].count++);
  return {...best, segments, customers, predict(row){
    const p=fields.map(f=>row[f]);
    if(!p.every(Number.isFinite)) throw Error('Enter a valid number for each feature');
    return segments[closest(scale(p),best.centers)];
  }};
}
