import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import XLSX from 'xlsx';
let LegacyDatabase=null; try{LegacyDatabase=(await import('better-sqlite3')).default}catch{}

const app=express(); app.use(cors()); app.use(express.json());
const PORT=Number(process.env.PRINTFLOW_PORT||4174); const WEB_PORT=Number(process.env.PRINTFLOW_WEB_PORT||80);
const BASE='\\\\Zzz\\проекты\\база1';
const PRINT='\\\\Zzz\\печать\\WB';
const DEFAULT_WB_ROOT=path.join(PRINT,'!1.СРОЧНО WB','срочка за 28.08');
const DEFAULT_OZON_ROOT=path.join(PRINT,'!2. Срочно OZON','СРОЧНО за 29.08');
const APP_ROOT=process.env.PRINTFLOW_APP_ROOT||process.cwd(); const DIST=path.join(APP_ROOT,'dist');
const MAP=process.env.PRINTFLOW_MAP||path.join(APP_ROOT,'Расширения.xlsx');
const DEFAULT_STOCKS_FILE='\\\\Zzz\\проекты\\менеджеры\\FBS\\!!!Остатки Калейдоскоп (Актуальный).xlsx';
const allowed=new Set(['.cdr','.tif']);
const articleRe=/([A-Za-z]{2,4}[0-9]{3,4}\.A[0-9]+)\(([^)]+)\)/i;
let jobs=[]; let WB_ROOT=DEFAULT_WB_ROOT; let OZON_ROOT=DEFAULT_OZON_ROOT; let STOCKS_FILE=DEFAULT_STOCKS_FILE;
let jobsWriteChain=Promise.resolve();
let printJobChain=Promise.resolve();
let stockWriteChain=Promise.resolve();
const DATA=process.env.PRINTFLOW_DATA_DIR||path.join(APP_ROOT,'data'); const DB_FILE=path.join(DATA,'printflow.sqlite'); const JOBS_FILE=path.join(DATA,'jobs.json'); const AUDIT_FILE=path.join(DATA,'audit.json'); const SETTINGS_FILE=path.join(DATA,'settings.json'); const USERS_FILE=path.join(DATA,'users.json');
const SESSION_TTL=12*60*60*1000;
let users=[]; const sessions=new Map();
function cleanName(value){return String(value||'').trim().replace(/\s+/g,' ').slice(0,48)}
function validPin(value){return /^\d{4,8}$/.test(String(value||''))}
function userView(user){return {id:user.id,name:user.name,role:user.role,active:user.active!==false,createdAt:user.createdAt}}
function userKey(name){return cleanName(name).toLocaleLowerCase('ru-RU')}
function pinRecord(pin){const salt=randomBytes(16).toString('hex'),hash=scryptSync(String(pin),salt,32).toString('hex');return {pinSalt:salt,pinHash:hash}}
function pinMatches(pin,user){try{const actual=Buffer.from(scryptSync(String(pin),user.pinSalt,32).toString('hex'),'hex'),expected=Buffer.from(String(user.pinHash||''),'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected)}catch{return false}}
async function loadUsers(){await fs.mkdir(DATA,{recursive:true});try{const saved=JSON.parse(await fs.readFile(USERS_FILE,'utf8'));users=Array.isArray(saved)?saved.filter(user=>user?.id&&cleanName(user.name)&&user.pinSalt&&user.pinHash):[]}catch{users=[]}}
async function saveUsers(){await fs.mkdir(DATA,{recursive:true});await fs.writeFile(USERS_FILE,JSON.stringify(users,null,2),'utf8')}
function issueSession(user){const token=randomBytes(32).toString('base64url');sessions.set(token,{userId:user.id,expiresAt:Date.now()+SESSION_TTL});return token}
function sessionUser(req){const token=String(req.get('x-printflow-token')||'');const session=sessions.get(token);if(!session||session.expiresAt<Date.now()){if(token)sessions.delete(token);return null}const user=users.find(item=>item.id===session.userId&&item.active!==false);if(!user){sessions.delete(token);return null}return user}
function requireAuth(req,res,next){const user=sessionUser(req);if(!user)return res.status(401).json({error:'Войдите в PrintFlow'});req.user=user;next()}
function requireAdmin(req,res,next){if(req.user?.role!=='admin')return res.status(403).json({error:'Доступно только администратору'});next()}
function validRoot(value){const p=String(value||'').trim();return p.length>=3&&(path.isAbsolute(p)||p.startsWith('\\\\'))}
function validFilePath(value){const p=String(value||'').trim();return p.length>=5&&(path.isAbsolute(p)||p.startsWith('\\\\'))}
async function loadSettings(){try{const saved=JSON.parse(await fs.readFile(SETTINGS_FILE,'utf8'));if(validRoot(saved.wbRoot))WB_ROOT=path.normalize(saved.wbRoot);if(validRoot(saved.ozonRoot))OZON_ROOT=path.normalize(saved.ozonRoot);if(validFilePath(saved.stocksFile))STOCKS_FILE=path.normalize(saved.stocksFile)}catch{}}
async function saveSettings(){await fs.mkdir(DATA,{recursive:true});await fs.writeFile(SETTINGS_FILE,JSON.stringify({wbRoot:WB_ROOT,ozonRoot:OZON_ROOT,stocksFile:STOCKS_FILE},null,2),'utf8')}
async function inspectPath(value){const raw=String(value||'').trim();if(!validRoot(raw))return {ok:false,status:'invalid',message:'Укажите корректный локальный или сетевой путь'};const target=path.normalize(raw);try{const stat=await fs.stat(target);if(!stat.isDirectory())return {ok:false,status:'file',path:target,message:'По этому адресу находится файл, а не папка'};await fs.access(target,fsConstants.R_OK|fsConstants.W_OK);return {ok:true,status:'available',path:target,message:'Папка доступна для чтения и записи'}}catch(error){if(error?.code==='ENOENT'){try{await fs.access(path.dirname(target),fsConstants.R_OK|fsConstants.W_OK);return {ok:false,status:'missing',creatable:true,path:target,message:'Папка не найдена — будет создана при печати'}}catch{}}return {ok:false,status:'unavailable',path:target,message:'Папка недоступна или нет прав на запись'}}}
async function inspectFile(value){const raw=String(value||'').trim();if(!validFilePath(raw))return {ok:false,status:'invalid',message:'Укажите корректный путь к файлу'};const target=path.normalize(raw);try{const stat=await fs.stat(target);if(!stat.isFile())return {ok:false,status:'file',path:target,message:'По этому адресу находится папка, а не файл'};await fs.access(target,fsConstants.R_OK);return {ok:true,status:'available',path:target,message:'Файл доступен для чтения'}}catch(error){if(error?.code==='ENOENT')return {ok:false,status:'missing',path:target,message:'Файл не найден'};return {ok:false,status:'unavailable',path:target,message:'Файл недоступен или нет прав на чтение'}}}
function normalizeStockText(value){return String(value??'').trim().toLocaleLowerCase('ru-RU').replace(/[\s_./\\-]+/g,'')}
function findStockColumn(headers,patterns){return headers.findIndex(header=>patterns.some(pattern=>pattern.test(normalizeStockText(header))))}
function readStockTable(){
  const workbook=XLSX.readFile(STOCKS_FILE,{cellDates:false});
  const sheetName=workbook.SheetNames[0];
  const sheet=workbook.Sheets[sheetName];
  const matrix=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:true});
  const headerIndex=matrix.findIndex(row=>{const headers=row.map(value=>normalizeStockText(value));return headers.some(value=>/артикул|article/.test(value))&&headers.some(value=>/количество|колво|qty|quantity/.test(value))});
  if(headerIndex<0)throw new Error('В таблице остатков не найдены колонки «Артикул» и «Количество»');
  const headers=matrix[headerIndex]||[];
  const columns={article:findStockColumn(headers,[/артикул|article/]),quantity:findStockColumn(headers,[/количество|колво|qty|quantity/]),market:findStockColumn(headers,[/маркетплейс|market/]),box:findStockColumn(headers,[/^коробка$|^box$/]),level:findStockColumn(headers,[/этажбокс|этаж|уровень|level/])};
  const rows=matrix.slice(headerIndex+1).map((values,index)=>{const article=String(values[columns.article]??'').trim().toUpperCase(),qty=Number(values[columns.quantity]);if(!article||!Number.isFinite(qty)||qty<=0)return null;return {rowNumber:headerIndex+2+index,sheetRowIndex:headerIndex+1+index,article,qty,market:columns.market>=0?String(values[columns.market]??'').trim().toUpperCase():'',box:columns.box>=0?String(values[columns.box]??'').trim():'',level:columns.level>=0?String(values[columns.level]??'').trim():''}}).filter(Boolean);
  return {workbook,sheetName,sheet,matrix,headerIndex,columns,rows};
}
function sameStockLocation(actual,expected){return !expected||normalizeStockText(actual)===normalizeStockText(expected)}
function removeWorksheetRow(sheet,rowIndex){
  const ref=sheet['!ref'];
  if(!ref)return;
  const range=XLSX.utils.decode_range(ref);
  if(rowIndex<range.s.r||rowIndex>range.e.r)return;
  for(let row=rowIndex;row<range.e.r;row++){
    for(let col=range.s.c;col<=range.e.c;col++){
      const from=XLSX.utils.encode_cell({r:row+1,c:col}),to=XLSX.utils.encode_cell({r:row,c:col});
      if(sheet[from])sheet[to]=sheet[from];else delete sheet[to];
    }
  }
  for(let col=range.s.c;col<=range.e.c;col++)delete sheet[XLSX.utils.encode_cell({r:range.e.r,c:col})];
  range.e.r-=1; sheet['!ref']=XLSX.utils.encode_range(range);
  if(Array.isArray(sheet['!rows']))sheet['!rows'].splice(rowIndex,1);
}
function stockBackupPath(){const stamp=new Date().toISOString().replace(/[:.]/g,'-');return `${STOCKS_FILE}.backup-${stamp}`}
function stockLockPaths(){const parsed=path.parse(STOCKS_FILE);return [path.join(parsed.dir,`~$${parsed.base}`),path.join(parsed.dir,`.~lock.${parsed.base}#`)]}
async function inspectStockWriteAccess(){
  let lockExists=false;
  for(const lockPath of stockLockPaths())try{const stat=await fs.stat(lockPath);if(stat.isFile()){lockExists=true;break}}catch(error){if(error?.code!=='ENOENT')throw error}
  try{await fs.access(STOCKS_FILE,fsConstants.R_OK|fsConstants.W_OK)}catch(error){
    if(error?.code==='ENOENT')return {ok:false,locked:false,writable:false,message:'Файл остатков не найден'};
    return {ok:false,locked:lockExists,writable:false,message:'Файл остатков недоступен для записи — проверьте права или атрибут «Только чтение»'};
  }
  if(lockExists)return {ok:false,locked:true,writable:true,message:'Таблица остатков открыта другим пользователем. Закройте Excel и нажмите «Обновить»'};
  return {ok:true,locked:false,writable:true,message:'Файл доступен для записи'};
}
async function assertStockWritable(){const status=await inspectStockWriteAccess();if(!status.ok)throw new Error(status.message);return status}
function inside(child,parent){const c=path.resolve(child).toLowerCase(),p=path.resolve(parent).toLowerCase();return c===p||c.startsWith(p+path.sep)}
async function loadJobs(){await fs.mkdir(DATA,{recursive:true});if(LegacyDatabase&&await fs.access(DB_FILE).then(()=>true).catch(()=>false)){const db=new LegacyDatabase(DB_FILE);db.exec('CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, data TEXT NOT NULL)');jobs=db.prepare('SELECT data FROM jobs ORDER BY rowid DESC').all().map(x=>JSON.parse(x.data)).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));db.close();await saveJobs();return}try{const saved=JSON.parse(await fs.readFile(JOBS_FILE,'utf8'));jobs=Array.isArray(saved)?saved.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)):[]}catch{jobs=[]}}
function saveJobs(){
  const snapshot=JSON.stringify(jobs,null,2);
  const write=jobsWriteChain.then(async()=>{
    await fs.mkdir(DATA,{recursive:true});
    const temp=`${JOBS_FILE}.${process.pid}.tmp`;
    await fs.writeFile(temp,snapshot,'utf8');
    try{await fs.rename(temp,JOBS_FILE)}catch{await fs.writeFile(JOBS_FILE,snapshot,'utf8');await fs.rm(temp,{force:true})}
  });
  jobsWriteChain=write.catch(()=>{});
  return write;
}
function enqueuePrintJob(task){
  const result=printJobChain.then(task);
  printJobChain=result.catch(()=>{});
  return result;
}
function enqueueStockWrite(task){
  const result=stockWriteChain.then(task);
  stockWriteChain=result.catch(()=>{});
  return result;
}
async function appendAudit(entry){let rows=[];try{const saved=JSON.parse(await fs.readFile(AUDIT_FILE,'utf8'));if(Array.isArray(saved))rows=saved}catch{}rows.unshift({id:Date.now()+Math.random(),created_at:new Date().toISOString(),...entry});await fs.writeFile(AUDIT_FILE,JSON.stringify(rows.slice(0,500),null,2),'utf8')}
async function auditCopy(article,destination,user){await appendAudit({action:'copy',article,destination,createdById:user?.id||null,createdByName:user?.name||'Без автора'})}
async function renamedFilesExist(j){const root=String(j.market).toUpperCase()==='OZON'?OZON_ROOT:(j.files?.[0]?path.dirname(j.files[0]):'');if(!root)return false;const wanted=path.extname(j.files?.[0]||'').toLowerCase();const files=await walk(root);return files.filter(f=>path.basename(f).toUpperCase().includes(j.article)&&(!wanted||path.extname(f).toLowerCase()===wanted)).length>=Number(j.qty||1)}
async function watchJobs(){let changed=false;for(const j of jobs){const renamed=await renamedFilesExist(j);if(j.status==='Забрано'&&renamed){j.status='Ожидает';delete j.takenAt;changed=true;continue}if(j.status==='Ожидает'||j.status==='В печати'){let exists=0;for(const f of j.files||[]){try{await fs.access(f);exists++}catch{}}if((j.files||[]).length&&exists===0&&!renamed){j.status='Забрано';j.takenAt=new Date().toISOString();changed=true}}}if(changed)await saveJobs()}
function localDayKey(value){const d=value instanceof Date?value:new Date(value);if(Number.isNaN(d.getTime()))return '';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function isArchivedJob(job,now=new Date()){const created=new Date(job.createdAt||0);if(Number.isNaN(created.getTime()))return false;if(localDayKey(created)!==localDayKey(now))return true;const cutoff=new Date(now);cutoff.setHours(20,0,0,0);return now>=cutoff&&created<cutoff}

function readMap(){
  const wb=XLSX.readFile(MAP,{cellDates:false}); const ws=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''}); const out={};
  for(const row of rows.slice(1)){const key=String(row[0]||'').trim().toUpperCase(); const folder=String(row[1]||'').trim(); if(key&&folder)out[key]=folder}
  return out;
}
async function walk(dir,out=[]){let ents=[]; try{ents=await fs.readdir(dir,{withFileTypes:true})}catch{return out}; for(const e of ents){const p=path.join(dir,e.name); if(e.isDirectory())await walk(p,out); else if(allowed.has(path.extname(e.name).toLowerCase()))out.push(p)} return out}
function articleInfo(file){
  const name=path.basename(file);
  const m=name.match(articleRe);
  if(m)return {article:m[1].toUpperCase(),ext:m[2].toUpperCase()};
  const fallback=name.match(/^([A-Za-z]{2,4}[0-9]{4}\.A[0-9]+)\(([^)]+)\)/i);
  return fallback?{article:fallback[1].toUpperCase(),ext:fallback[2].toUpperCase()}:null;
}
async function findArticleFiles(article){const m=article.match(/^([A-Za-z]{2,4}[0-9]{3,4})\.((?:A)[0-9]+)$/i); if(!m)return []; const dir=path.join(BASE,m[1].toUpperCase(),m[2].toUpperCase()); return walk(dir)}
app.get('/api/auth/bootstrap',(req,res)=>res.json({needsSetup:users.length===0}));
app.post('/api/auth/setup',async(req,res)=>{if(users.length)return res.status(409).json({error:'Главный аккаунт уже создан'});const name=cleanName(req.body?.name),pin=String(req.body?.pin||'');if(!name)return res.status(422).json({error:'Введите имя администратора'});if(!validPin(pin))return res.status(422).json({error:'PIN должен состоять из 4–8 цифр'});const admin={id:`user-${Date.now()}-${randomBytes(4).toString('hex')}`,name,role:'admin',active:true,createdAt:new Date().toISOString(),...pinRecord(pin)};users=[admin];await saveUsers();const token=issueSession(admin);res.status(201).json({token,user:userView(admin)})});
app.post('/api/auth/login',(req,res)=>{const name=cleanName(req.body?.name),pin=String(req.body?.pin||''),user=users.find(item=>item.active!==false&&userKey(item.name)===userKey(name));if(!user||!pinMatches(pin,user))return res.status(401).json({error:'Неверное имя или PIN'});const token=issueSession(user);res.json({token,user:userView(user)})});
app.post('/api/auth/logout',(req,res)=>{const token=String(req.get('x-printflow-token')||'');if(token)sessions.delete(token);res.json({ok:true})});
app.use('/api',(req,res,next)=>req.path.startsWith('/auth/')?next():requireAuth(req,res,next));
app.get('/api/auth/me',requireAuth,(req,res)=>res.json({user:userView(req.user)}));
app.get('/api/users',requireAdmin,(req,res)=>res.json(users.map(userView)));
app.post('/api/users',requireAdmin,async(req,res)=>{const name=cleanName(req.body?.name),pin=String(req.body?.pin||'');if(!name)return res.status(422).json({error:'Введите имя пользователя'});if(!validPin(pin))return res.status(422).json({error:'PIN должен состоять из 4–8 цифр'});if(users.some(item=>userKey(item.name)===userKey(name)))return res.status(409).json({error:'Пользователь с таким именем уже есть'});const user={id:`user-${Date.now()}-${randomBytes(4).toString('hex')}`,name,role:'operator',active:true,createdAt:new Date().toISOString(),...pinRecord(pin)};users.push(user);await saveUsers();res.status(201).json({user:userView(user)})});
app.patch('/api/users/:id',requireAdmin,async(req,res)=>{const user=users.find(item=>item.id===req.params.id);if(!user)return res.status(404).json({error:'Пользователь не найден'});const nextName=req.body?.name===undefined?user.name:cleanName(req.body.name);if(!nextName)return res.status(422).json({error:'Введите имя пользователя'});if(users.some(item=>item.id!==user.id&&userKey(item.name)===userKey(nextName)))return res.status(409).json({error:'Пользователь с таким именем уже есть'});if(req.body?.active!==undefined&&user.id===req.user.id&&!req.body.active)return res.status(422).json({error:'Нельзя заблокировать свой главный аккаунт'});user.name=nextName;if(req.body?.active!==undefined)user.active=Boolean(req.body.active);if(req.body?.pin!==undefined){if(!validPin(req.body.pin))return res.status(422).json({error:'PIN должен состоять из 4–8 цифр'});Object.assign(user,pinRecord(req.body.pin))}await saveUsers();res.json({user:userView(user)})});
app.get('/api/health',(req,res)=>res.json({ok:true,base:BASE,print:PRINT,wbPrint:WB_ROOT,ozonPrint:OZON_ROOT}));
app.get('/api/audit',async(req,res)=>{try{const rows=JSON.parse(await fs.readFile(AUDIT_FILE,'utf8'));res.json(Array.isArray(rows)?rows.slice(0,200):[])}catch{res.json([])}});
app.get('/api/settings',requireAdmin,async(req,res)=>res.json({base:BASE,print:PRINT,map:MAP,allowed:[...allowed],refreshSeconds:5,wbRoot:WB_ROOT,ozonRoot:OZON_ROOT,stocksFile:STOCKS_FILE}));
app.post('/api/settings/check-path',requireAdmin,async(req,res)=>res.json(await inspectPath(req.body?.path)));
app.post('/api/settings/check-file',requireAdmin,async(req,res)=>res.json(await inspectFile(req.body?.path)));
app.post('/api/settings',requireAdmin,async(req,res)=>{const wbRoot=String(req.body?.wbRoot||'').trim(),ozonRoot=String(req.body?.ozonRoot||'').trim(),stocksFile=String(req.body?.stocksFile||'').trim();if(!validRoot(wbRoot)||!validRoot(ozonRoot)||!validFilePath(stocksFile))return res.status(422).json({error:'Укажите корректные пути для WB, Ozon и файла остатков'});WB_ROOT=path.normalize(wbRoot);OZON_ROOT=path.normalize(ozonRoot);STOCKS_FILE=path.normalize(stocksFile);await saveSettings();res.json({ok:true,wbRoot:WB_ROOT,ozonRoot:OZON_ROOT,stocksFile:STOCKS_FILE})});
app.get('/api/stock-rows',async(req,res)=>{try{const q=String(req.query.q||'').trim().toUpperCase(),box=String(req.query.box||'').trim().toUpperCase(),table=readStockTable(),rows=table.rows.filter(row=>(!q||row.article.includes(q))&&(!box||`${row.box} ${row.level}`.toUpperCase().includes(box))).map(({sheetRowIndex,...row})=>row);res.json({rows,total:rows.length})}catch(error){res.status(500).json({error:`Не удалось прочитать таблицу остатков: ${error.message}`})}});
app.get('/api/stock-lock',async(req,res)=>{try{res.json(await inspectStockWriteAccess())}catch(error){res.status(500).json({ok:false,locked:false,writable:false,message:`Не удалось проверить доступ к файлу остатков: ${error.message}`})}});
app.use('/api/stock-writeoff',requireAdmin,async(req,res,next)=>{try{await assertStockWritable();next()}catch(error){res.status(422).json({error:error.message||'Файл остатков недоступен для записи'})}});
app.post('/api/stock-writeoff',requireAdmin,async(req,res)=>{const input=Array.isArray(req.body?.items)?req.body.items:[];if(!input.length)return res.status(400).json({error:'Выберите хотя бы одну строку и укажите количество'});try{const result=await enqueueStockWrite(async()=>{const table=readStockTable(),byRow=new Map();for(const raw of input){const rowNumber=Number(raw.rowNumber),qty=Number(raw.qty);if(!Number.isInteger(rowNumber)||rowNumber<1||!Number.isInteger(qty)||qty<1)throw new Error('Количество списания должно быть целым числом от 1');const current=byRow.get(rowNumber)||{rowNumber,qty:0,article:String(raw.article||''),box:String(raw.box||''),level:String(raw.level||''),market:String(raw.market||'')};current.qty+=qty;byRow.set(rowNumber,current)}const changes=[...byRow.values()].sort((a,b)=>b.rowNumber-a.rowNumber).map(request=>{const current=table.rows.find(row=>row.rowNumber===request.rowNumber);if(!current)throw new Error(`Строка ${request.rowNumber} больше не найдена в таблице остатков`);if(String(request.article||'').trim()&&current.article!==String(request.article).trim().toUpperCase())throw new Error(`Строка ${request.rowNumber} изменилась — обновите список`);if(!sameStockLocation(current.box,request.box)||!sameStockLocation(current.level,request.level)||!sameStockLocation(current.market,request.market))throw new Error(`Строка ${request.rowNumber} изменилась — обновите список`);if(current.qty<request.qty)throw new Error(`${current.article}: нельзя списать ${request.qty} шт., доступно только ${current.qty} шт.`);return {...request,before:current.qty,after:current.qty-request.qty,sheetRowIndex:current.sheetRowIndex}});for(const change of changes){if(change.after===0)removeWorksheetRow(table.sheet,change.sheetRowIndex);else{const cell=XLSX.utils.encode_cell({r:change.sheetRowIndex,c:table.columns.quantity});table.sheet[cell]={...(table.sheet[cell]||{}),v:change.after,t:'n'};}}const backup=stockBackupPath(),temp=`${STOCKS_FILE}.${process.pid}.${Date.now()}.tmp`;await fs.copyFile(STOCKS_FILE,backup);try{const extension=path.extname(STOCKS_FILE).toLowerCase();XLSX.writeFile(table.workbook,temp,{bookType:extension==='.xls'?'biff8':'xlsx'});await fs.copyFile(temp,STOCKS_FILE)}finally{await fs.rm(temp,{force:true})}try{await appendAudit({action:'stock_writeoff',file:STOCKS_FILE,backup,items:changes.map(({rowNumber,article,box,level,before,after,qty})=>({rowNumber,article,box,level,before,after,qty})),createdById:req.user?.id||null,createdByName:req.user?.name||'Без автора'})}catch{}return {backup,changes:changes.map(({rowNumber,article,box,level,before,after,qty})=>({rowNumber,article,box,level,before,after,qty}))}});res.json({ok:true,...result})}catch(error){res.status(422).json({error:error.message||'Не удалось списать остатки'})}});
app.get('/api/stock-search',async(req,res)=>{const article=String(req.query.article||'').trim().toUpperCase();if(!article)return res.json([]);try{const wb=XLSX.readFile(STOCKS_FILE,{cellDates:false}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{defval:''}),byLocation=new Map();for(const row of rows){if(String(row['Артикул']||'').trim().toUpperCase()!==article)continue;const box=String(row['Коробка']||'').trim(),level=String(row['Этаж/БОКС']||'').trim(),key=box+'|'+level,previous=byLocation.get(key)||{article,stock:0,box,level};previous.stock+=Number(row['Количество']||0)||0;byLocation.set(key,previous)}res.json([...byLocation.values()])}catch(error){res.status(500).json({error:`Не удалось открыть таблицу остатков: ${error.message}`})}});
app.post('/api/stock-search-batch',async(req,res)=>{const articles=[...new Set((Array.isArray(req.body?.articles)?req.body.articles:[]).map(value=>String(value||'').trim().toUpperCase()).filter(Boolean))];if(!articles.length)return res.json({});try{const wanted=new Set(articles),wb=XLSX.readFile(STOCKS_FILE,{cellDates:false}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{defval:''}),byArticle=new Map();for(const row of rows){const article=String(row['Артикул']||'').trim().toUpperCase();if(!wanted.has(article))continue;const box=String(row['Коробка']||'').trim(),level=String(row['Этаж/БОКС']||'').trim(),key=box+'|'+level,locations=byArticle.get(article)||new Map(),previous=locations.get(key)||{article,stock:0,box,level};previous.stock+=Number(row['Количество']||0)||0;locations.set(key,previous);byArticle.set(article,locations)}res.json(Object.fromEntries(articles.map(article=>[article,[...(byArticle.get(article)?.values()||[])].filter(location=>location.stock>0)])))}catch(error){res.status(500).json({error:`Не удалось открыть таблицу остатков: ${error.message}`})}});
app.post('/api/stock-analyze',async(req,res)=>{const input=Array.isArray(req.body?.rows)?req.body.rows:[];if(!input.length)return res.status(400).json({error:'В Excel нет строк для анализа'});try{const wb=XLSX.readFile(STOCKS_FILE,{cellDates:false}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{defval:''}),byArticle=new Map();for(const row of rows){const article=String(row['Артикул']||'').trim().toUpperCase();if(!article)continue;const box=String(row['Коробка']||'').trim(),level=String(row['Этаж/БОКС']||'').trim(),key=box+'|'+level,locations=byArticle.get(article)||new Map(),previous=locations.get(key)||{box,level,stock:0};previous.stock+=Number(row['Количество']||0)||0;locations.set(key,previous);byArticle.set(article,locations)}const grouped=new Map();for(const raw of input){const article=String(raw.article??raw['Артикул']??'').trim().toUpperCase(),market=String(raw.market??raw['Маркетплейс']??'').trim().toUpperCase(),qty=Number(raw.qty??raw['Количество']);if(!article)continue;const key=article+'|'+market,previous=grouped.get(key)||{article,market,requestedQty:0};previous.requestedQty+=Number.isFinite(qty)&&qty>0?qty:0;grouped.set(key,previous)}res.json([...grouped.values()].map(item=>{const locations=[...(byArticle.get(item.article)?.values()||[])].filter(location=>location.stock>0);return {...item,found:Boolean(locations.length),availableQty:locations.reduce((sum,location)=>sum+location.stock,0),locations}}))}catch(error){res.status(500).json({error:`Не удалось проанализировать остатки: ${error.message}`})}});
app.get('/api/report',(req,res)=>{const from=String(req.query.from||'').trim(),to=String(req.query.to||'').trim();const list=jobs.filter(j=>{const d=new Date(j.createdAt||0);return(!from||d>=new Date(from+'T00:00:00'))&&(!to||d<=new Date(to+'T23:59:59'))});const total=list.reduce((s,j)=>s+j.qty,0);res.json({total,wb:list.filter(j=>j.market==='WB').reduce((s,j)=>s+j.qty,0),ozon:list.filter(j=>j.market==='OZON').reduce((s,j)=>s+j.qty,0),waiting:list.filter(j=>j.status==='Ожидает'||j.status==='В печати').reduce((s,j)=>s+j.qty,0),taken:list.filter(j=>j.status==='Забрано').reduce((s,j)=>s+j.qty,0),done:list.filter(j=>j.status==='Напечатано').reduce((s,j)=>s+j.qty,0),errors:list.filter(j=>j.status==='Ошибка').length,rows:list.length})});
app.get('/api/template.xlsx',(req,res)=>{
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([['Артикул','Количество','Маркетплейс'],['AS0003.A5865(G)',1,'WB']]);
  ws['!cols']=[{wch:24},{wch:14},{wch:18}];
  XLSX.utils.book_append_sheet(wb,ws,'Задания');
  const info=XLSX.utils.aoa_to_sheet([['Инструкция'],['Заполните строки на листе «Задания».'],['Маркетплейс: WB или OZON.'],['Количество — целое число от 1.']]);
  XLSX.utils.book_append_sheet(wb,info,'Инструкция');
  const data=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
  res.setHeader('Content-Disposition','attachment; filename="PrintFlow_template.xlsx"');res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(data);
});
app.get('/api/mappings',(req,res)=>{try{res.json(readMap())}catch(e){res.status(500).json({error:'Не удалось прочитать Расширения.xlsx'})}});
app.get('/api/search',async(req,res)=>{const q=String(req.query.article||'').trim().toUpperCase(); if(!q)return res.json([]); const files=await findArticleFiles(q); const found=files.map(f=>({path:f,...articleInfo(f)})).filter(x=>x.article===q); res.json(found.slice(0,50));});
async function createJob({article,market='WB',qty,user}){
  const parsedQty=Number(qty); if(!Number.isInteger(parsedQty)||parsedQty<1)throw new Error('Количество должно быть целым числом от 1'); const n=parsedQty; const clean=String(article||'').trim().toUpperCase();
  if(!clean)throw new Error('Укажите артикул'); if(!['WB','OZON'].includes(String(market).toUpperCase()))throw new Error('Неизвестный маркетплейс');
  const maps=readMap(); const files=await findArticleFiles(clean); const candidates=files.map(f=>({path:f,...articleInfo(f)})).filter(x=>x.article===clean); if(!candidates.length)throw new Error('Артикул не найден в базе');
  const chosen=candidates[0], folder=maps[chosen.ext]; if(!folder)throw new Error(`Для расширения ${chosen.ext} нет папки в Расширения.xlsx`);
  const isOzon=String(market).toUpperCase()==='OZON'; const marketRoot=isOzon?OZON_ROOT:WB_ROOT; if(!validRoot(marketRoot))throw new Error('Защита: запрещённая папка назначения'); await fs.mkdir(marketRoot,{recursive:true}); const dirs=await fs.readdir(marketRoot,{withFileTypes:true}).catch(()=>[]); let targetDir=dirs.find(d=>d.isDirectory()&&d.name.trim().toLowerCase()===folder.trim().toLowerCase()); if(!targetDir){const newDir=path.join(marketRoot,folder);if(!inside(newDir,marketRoot))throw new Error('Защита: запрещённый путь назначения');await fs.mkdir(newDir,{recursive:true});targetDir={name:folder}}
  if(!inside(chosen.path,BASE))throw new Error('Защита: исходный файл находится вне базы макетов'); const dest=path.join(marketRoot,targetDir.name); if(!inside(dest,marketRoot))throw new Error('Защита: запрещённый путь назначения'); const ext=path.extname(chosen.path); const created=[]; for(let i=1;i<=n;i++){let name=path.basename(chosen.path,ext)+(n>1?`_${i}`:'')+ext; let target=path.join(dest,name); let k=1; while(true){try{await fs.access(target); target=path.join(dest,path.basename(chosen.path,ext)+(n>1?`_${i}`:'')+`_${k++}`+ext)}catch{break}} await fs.copyFile(chosen.path,target); created.push(target)} await auditCopy(clean,dest,user);
  const job={id:Date.now()+Math.random(),article:clean,ext:chosen.ext,market:String(market).toUpperCase(),qty:n,folder:targetDir.name,status:'Ожидает',time:new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}),createdAt:new Date().toISOString(),createdById:user?.id||null,createdByName:user?.name||'Без автора',files:created}; jobs=[job,...jobs]; await saveJobs(); return job;
}
app.post('/api/jobs',async(req,res)=>{try{res.json(await enqueuePrintJob(()=>createJob({...req.body,user:req.user})))}catch(e){res.status(422).json({error:e.message})}});
app.post('/api/batch-preview',async(req,res)=>{
  const input=Array.isArray(req.body?.rows)?req.body.rows:[]; const maps=readMap(); const out=[];
  for(let i=0;i<input.length;i++){const raw=input[i]||{}, article=String(raw.article??raw['Артикул']??'').trim().toUpperCase(), qty=Number(raw.qty??raw['Количество']), market=String(raw.market??raw['Маркетплейс']??'').trim().toUpperCase(); let item={row:i+2,article,qty,market,ok:false,error:''};
    if(!article||!Number.isInteger(qty)||qty<1||!['WB','OZON'].includes(market)){item.error='Проверьте артикул, количество и маркетплейс';out.push(item);continue}
    const files=await findArticleFiles(article), candidates=files.map(f=>({path:f,...articleInfo(f)})).filter(x=>x.article===article); if(!candidates.length){item.error='Артикул не найден в базе';out.push(item);continue}
    const chosen=candidates[0], folder=maps[chosen.ext]; if(!folder){item.error=`Нет папки для расширения ${chosen.ext}`;out.push(item);continue}
    item={...item,ok:true,ext:chosen.ext,folder,source:path.basename(chosen.path)};out.push(item);
  } res.json(out);
});
app.post('/api/batch-jobs',async(req,res)=>{const rows=Array.isArray(req.body?.rows)?req.body.rows:[]; if(!rows.length)return res.status(400).json({error:'Нет строк для печати'}); try{const created=await enqueuePrintJob(async()=>{const result=[];for(const row of rows){if(row.ok===false)throw new Error(`Строка ${row.row}: ${row.error}`);result.push(await createJob({article:row.article,qty:row.qty,market:row.market,user:req.user}))}return result});res.json({jobs:created})}catch(e){res.status(422).json({error:e.message})}});
app.post('/api/jobs/:id/status',async(req,res)=>{const j=jobs.find(x=>String(x.id)===String(req.params.id));if(!j)return res.status(404).json({error:'Задание не найдено'});const status=String(req.body?.status||'');if(!['Ожидает','В печати','Забрано','Напечатано','Ошибка'].includes(status))return res.status(400).json({error:'Недопустимый статус'});j.status=status;await saveJobs();res.json(j)});
app.delete('/api/jobs/:id',requireAdmin,async(req,res)=>{const before=jobs.length;jobs=jobs.filter(x=>String(x.id)!==String(req.params.id));if(jobs.length===before)return res.status(404).json({error:'Запись не найдена'});await saveJobs();res.json({ok:true})});
app.delete('/api/jobs/by-key',requireAdmin,async(req,res)=>{const {article,time}=req.body||{},normalizedArticle=String(article||'').trim().toUpperCase();let i=jobs.findIndex(x=>x.article===normalizedArticle&&x.time===time);if(i<0)i=jobs.findIndex(x=>x.article===normalizedArticle);if(i<0)return res.status(404).json({error:'Запись не найдена'});jobs.splice(i,1);await saveJobs();res.json({ok:true})});
app.delete('/api/jobs',requireAdmin,async(req,res)=>{const historyOnly=String(req.query.scope||'')==='history';jobs=historyOnly?jobs.filter(job=>!isArchivedJob(job)):[];await saveJobs();res.json({ok:true})});
app.get('/api/jobs',async(req,res)=>{await watchJobs();let out=[...jobs].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));const q=String(req.query.q||'').trim().toUpperCase(),market=String(req.query.market||'').toUpperCase(),status=String(req.query.status||'');if(q)out=out.filter(j=>j.article.includes(q));if(market&&market!=='ALL')out=out.filter(j=>j.market===market);if(status&&status!=='ALL')out=out.filter(j=>j.status===status);res.json(out.map(j=>({...j,createdByName:j.createdByName||'Без автора',archived:isArchivedJob(j)})))});
app.use(express.static(DIST));
await loadUsers(); await loadSettings(); await loadJobs(); setInterval(watchJobs,5000); app.listen(PORT,'0.0.0.0',()=>console.log(`PrintFlow API on ${PORT}`)); if(WEB_PORT!==PORT){const webServer=app.listen(WEB_PORT,'0.0.0.0',()=>console.log(`PrintFlow web on ${WEB_PORT}`));webServer.on('error',error=>console.warn(`PrintFlow web port ${WEB_PORT} is unavailable: ${error.message}`))}
