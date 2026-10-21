/** API y registro compartido del maratón. Ejecutar configurar desde el editor. */
const BOOK_ID = '1vP0E4cjGDby7yTPLtd5mnZsuuWbbu18bMqsKqAzJZQI';
const HEADERS = {
  Peliculas: ['Pélicula','Mayor Número de Votos ','ID','Estado'],
  Seleccionados: ['Ronda','ID película','Película','Votos ganadores','Fecha de cierre','Resultados de la ronda'],
  Usuario: ['Nombre','Nombre normalizado','Huella de acceso','Fecha de registro'],
  Votos: ['Ronda','Usuario normalizado','ID película','Fecha','ID voto']
};
function configurar() {
  const ss = SpreadsheetApp.openById(BOOK_ID);
  Object.keys(HEADERS).forEach(name => {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    HEADERS[name].forEach((h,i) => { if (!sh.getRange(1,i+1).getValue()) sh.getRange(1,i+1).setValue(h); });
    sh.setFrozenRows(1);
  });
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ADMIN_KEY')) props.setProperty('ADMIN_KEY', Utilities.getUuid()+Utilities.getUuid());
  SpreadsheetApp.getUi().alert('Clave privada para cerrar rondas (guárdala; no va en GitHub):\n\n'+props.getProperty('ADMIN_KEY'));
}
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Vote').setTitle('Maratón terrorífico')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
/** POST opcional para clientes no navegador; el iframe usa google.script.run. */
function doPost(e) {
  let result;
  try { result = api(JSON.parse(e.postData.contents)); }
  catch (_) { result = {ok:false,error:'Solicitud inválida.'}; }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
function api(input) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return {ok:false,error:'Otra operación está en curso. Intenta de nuevo.'};
  try {
    if (!input || typeof input !== 'object') throw new Error('Solicitud inválida.');
    const ss = SpreadsheetApp.openById(BOOK_ID);
    if (!PropertiesService.getScriptProperties().getProperty('ADMIN_KEY')) throw new Error('El organizador debe ejecutar configurar.');
    const model = model_(ss);
    if (input.action === 'login') return login_(ss,model,input);
    const user = authenticate_(model,input);
    if (input.action === 'state') return state_(model,user);
    if (input.action === 'vote') {
      if (Number(input.round) !== model.round) throw new Error('La ronda cambió. Actualiza antes de votar.');
      const movie = model.available.find(m=>m.id===input.movieId);
      if (!movie) throw new Error('Esa película no está disponible para votar.');
      const previous = model.votes.find(v=>Number(v[0])===model.round && v[1]===user.key);
      if (previous) {
        if (previous[2] === movie.id) return state_(model,user); // Retry without duplicate write.
        throw new Error('Ya emitiste tu voto en esta ronda.');
      }
      ss.getSheetByName('Votos').appendRow([model.round,user.key,movie.id,new Date().toISOString(),Utilities.getUuid()]);
      return state_(model_(ss),user);
    }
    if (input.action === 'close') {
      if (!input.adminKey || input.adminKey!==PropertiesService.getScriptProperties().getProperty('ADMIN_KEY')) throw new Error('Clave del organizador incorrecta.');
      if (Number(input.round)!==model.round) throw new Error('Esta ronda ya fue cerrada. Actualiza el histórico.');
      const ranked = rank_(model);
      if (!ranked.length || ranked[0].votes===0) throw new Error('No se puede cerrar una ronda sin votos.');
      if (ranked.length>1 && ranked[0].votes===ranked[1].votes) throw new Error('Hay empate. Faltan votos para definir una ganadora.');
      if (input.movieId!==ranked[0].id) throw new Error('La película líder cambió. Actualiza y revisa la ganadora.');
      const w = ranked[0];
      // History is the authoritative commit: round and exclusions derive from it.
      // A retry after this write cannot close the same round or reselect the winner.
      ss.getSheetByName('Seleccionados').appendRow([model.round,w.id,safeCell_(w.title),w.votes,new Date().toISOString(),JSON.stringify(ranked)]);
      return state_(model_(ss),user);
    }
    throw new Error('Acción desconocida.');
  } catch (e) { return {ok:false,error:e.message || 'No se pudo completar la operación.'}; }
  finally { lock.releaseLock(); }
}
function normal_(value) { return String(value || '').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('es'); }
function safeCell_(value) { const s=String(value); return /^[=+@-]/.test(s)?"'"+s:s; }
function hash_(value) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value))); }
function rows_(ss,name) {
  const sh=ss.getSheetByName(name);
  if (!sh) throw new Error('Falta la pestaña '+name+'. Ejecuta configurar.');
  return sh.getLastRow()<2?[]:sh.getRange(2,1,sh.getLastRow()-1,HEADERS[name].length).getValues();
}
function model_(ss) {
  const history = rows_(ss,'Seleccionados').filter(r=>r[0] && r[1]);
  const round = history.reduce((n,r)=>Math.max(n,Number(r[0])||0),0)+1;
  const selected = new Set(history.map(r=>String(r[1])));
  const movieRows=rows_(ss,'Peliculas'),movies=[],seenNames=new Set(),seenIds=new Set();
  movieRows.forEach((r,i)=>{
    const title=String(r[0]||'').trim();if(!title)return;
    const key=normal_(title);if(seenNames.has(key))throw new Error('Película duplicada en la hoja: '+title);
    seenNames.add(key);
    let id=String(r[2]||'');
    if(!id){id=Utilities.getUuid();ss.getSheetByName('Peliculas').getRange(i+2,3).setValue(id);}
    if(seenIds.has(id))throw new Error('ID de película duplicado. Revisa la hoja.');seenIds.add(id);
    movies.push({id,title,row:i+2});
  });
  const model={movies,available:movies.filter(m=>!selected.has(m.id)),history,round,votes:rows_(ss,'Votos'),users:rows_(ss,'Usuario')};
  const ranked=rank_(model);
  movies.forEach(movie=>{
    const prior=history.find(r=>String(r[1])===movie.id);
    const votes=prior?Number(prior[3]):ranked.find(r=>r.id===movie.id).votes;
    const status=prior?'Seleccionada · bloqueada':'Disponible';
    const old=movieRows[movie.row-2];
    if(old[1]!==votes)ss.getSheetByName('Peliculas').getRange(movie.row,2).setValue(votes);
    if(old[3]!==status)ss.getSheetByName('Peliculas').getRange(movie.row,4).setValue(status);
  });
  return model;
}
function rank_(m) {
  return m.available.map(movie=>({...movie,votes:m.votes.filter(v=>Number(v[0])===m.round && v[2]===movie.id).length}))
    .sort((a,b)=>b.votes-a.votes || a.row-b.row);
}
function login_(ss,m,p) {
  const name=String(p.name||'').normalize('NFKC').trim().replace(/\s+/g,' ');
  if(!/^[\p{L}\p{N} ._-]{2,60}$/u.test(name))throw new Error('Escribe un nombre de 2 a 60 caracteres, sin símbolos especiales.');
  const key=normal_(name),matches=m.users.map((r,i)=>({r,i})).filter(x=>normal_(x.r[0])===key);
  if(matches.length>1)throw new Error('Este nombre está duplicado en Usuario; pide al organizador que lo revise.');
  if(matches.length && matches[0].r[2]) {
    if(!p.token || hash_(p.token)!==matches[0].r[2])throw new Error('Este nombre ya está registrado en otro acceso. Usa tu código de acceso original.');
    return {...state_(m,{key,name}),token:p.token};
  }
  const token=Utilities.getUuid()+Utilities.getUuid(),record=[safeCell_(name),key,hash_(token),new Date().toISOString()];
  if(matches.length)ss.getSheetByName('Usuario').getRange(matches[0].i+2,1,1,4).setValues([record]);
  else ss.getSheetByName('Usuario').appendRow(record);
  return {...state_(m,{key,name}),token};
}
function authenticate_(m,p) {
  const key=normal_(p.name),record=m.users.find(r=>normal_(r[0])===key);
  if(!record || !p.token || hash_(p.token)!==record[2])throw new Error('Introduce tu nombre y código de acceso.');
  return {key,name:String(record[0])};
}
function state_(m,user) {
  const movies=rank_(m),ownVote=m.votes.find(v=>Number(v[0])===m.round && v[1]===user.key);
  const tied=movies.length>1 && movies[0].votes>0 && movies[0].votes===movies[1].votes;
  const leader=movies.length && movies[0].votes>0 && !tied?movies[0]:null;
  return {ok:true,round:m.round,user:user.name,movies:movies.map(({id,title,votes})=>({id,title,votes})),votedMovieId:ownVote?ownVote[2]:null,tied,leaderId:leader?leader.id:null,
    history:m.history.map(r=>({round:Number(r[0]),movieId:String(r[1]),title:String(r[2]),votes:Number(r[3]),closedAt:r[4] instanceof Date?r[4].toISOString():String(r[4])}))};
}
