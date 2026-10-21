const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
class Sheet {
 constructor(rows){this.rows=rows;}
 getLastRow(){return this.rows.length;}
 appendRow(row){this.rows.push([...row]);}
 getRange(r,c,n=1,w=1){const sh=this;return {getValue:()=>sh.rows[r-1]?.[c-1]??'',getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:w},(_,j)=>sh.rows[r-1+i]?.[c-1+j]??'')),setValue:v=>{while(sh.rows.length<r)sh.rows.push([]);sh.rows[r-1][c-1]=v;},setValues:rs=>{rs.forEach((row,i)=>row.forEach((v,j)=>sh.getRange(r+i,c+j).setValue(v)));}}}
}
const sheets={Peliculas:new Sheet([['Película','Votos','ID','Estado'],['A',0,'a',''],['B',0,'b',''],['C',0,'c','']]),Seleccionados:new Sheet([['Ronda','ID','Película','Votos','Fecha','Resultados']]),Usuario:new Sheet([['Nombre','Normalizado','Hash','Fecha']]),Votos:new Sheet([['Ronda','Usuario','Película','Fecha','ID']])};
let locked=false,forceBusy=false;
const ctx=vm.createContext({console,Set,Date,JSON,Error,Number,String,PropertiesService:{getScriptProperties:()=>({getProperty:k=>k==='ADMIN_KEY'?'secret':null})},SpreadsheetApp:{openById:()=>({getSheetByName:n=>sheets[n]})},Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,v)=>crypto.createHash('sha256').update(v).digest(),base64EncodeWebSafe:v=>Buffer.from(v).toString('base64url')},LockService:{getScriptLock:()=>({tryLock:()=>{if(locked||forceBusy)return false;locked=true;return true;},releaseLock:()=>locked=false})}});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../apps-script/Code.gs'),'utf8'),ctx);
const api=p=>ctx.api(p);const login=name=>{const r=api({action:'login',name});assert.equal(r.ok,true,r.error);return {name,token:r.token}};
const a=login('Rafa'),b=login('Ana'),c=login('Dany');
assert.equal(api({action:'state',name:'Rafa',token:'wrong'}).ok,false);
assert.equal(api({action:'login',name:'  RAFA  '}).ok,false);
assert.equal(api({action:'login',name:'  RAFA  ',token:a.token}).ok,true);
assert.equal(api({...a,action:'close',round:1,movieId:'a',adminKey:'secret'}).ok,false,'No zero-vote closure');
assert.equal(api({...a,action:'vote',round:1,movieId:'a'}).ok,true);
assert.equal(api({...a,action:'vote',round:1,movieId:'a'}).ok,true);
assert.equal(sheets.Votos.rows.length,2,'Retry must not duplicate vote');
assert.equal(api({...a,action:'vote',round:1,movieId:'b'}).ok,false);
assert.equal(api({...b,action:'vote',round:1,movieId:'b'}).ok,true);
assert.equal(api({...a,action:'close',round:1,movieId:'a',adminKey:'secret'}).ok,false,'Tie is not resolved arbitrarily');
assert.equal(api({...c,action:'vote',round:1,movieId:'a'}).ok,true);
assert.equal(sheets.Peliculas.rows[1][1],2,'Sheet totals reflect real votes');
assert.equal(api({...a,action:'close',round:1,movieId:'a',adminKey:'wrong'}).ok,false);
assert.equal(api({...a,action:'close',round:1,movieId:'b',adminKey:'secret'}).ok,false,'Wrong leader rejected');
const closed=api({...a,action:'close',round:1,movieId:'a',adminKey:'secret'});assert.equal(closed.ok,true,closed.error);assert.equal(closed.round,2);assert.equal(closed.movies.some(m=>m.id==='a'),false);assert.equal(closed.history.length,1);assert.equal(closed.history[0].votes,2);assert.equal(closed.movies.every(m=>m.votes===0),true);assert.equal(sheets.Peliculas.rows[1][3],'Seleccionada · bloqueada');
assert.equal(api({...a,action:'close',round:1,movieId:'a',adminKey:'secret'}).ok,false);assert.equal(sheets.Seleccionados.rows.length,2);
assert.equal(api({...b,action:'vote',round:1,movieId:'c'}).ok,false,'Stale round rejected');
assert.equal(api({...a,action:'vote',round:2,movieId:'a'}).ok,false,'Winner excluded');
assert.equal(api({...a,action:'vote',round:2,movieId:'c'}).ok,true,'A user votes again in the next round');
forceBusy=true;assert.equal(api({...a,action:'state'}).ok,false);forceBusy=false;
assert.equal(sheets.Votos.rows.length,5,'History retains previous rounds');
console.log('PASS: identity, duplicate votes, sheet totals, ties, admin gate, leader check, idempotent close, winner exclusion, fresh rounds, lock contention, vote history');
