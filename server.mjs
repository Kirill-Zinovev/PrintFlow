import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import XLSX from 'xlsx';
let LegacyDatabase=null; try{LegacyDatabase=(await import('better-sqlite3')).default}catch{}

const app=express(); app.use(cors()); app.use(express.json());
const BASE='\\\\Zzz\\проекты\\база1';
const PRINT='\\\\Zzz\\печать\\WB';
const DEFAULT_WB_ROOT=path.join(PRINT,'!1.СРОЧНО WB','срочка за 28.08');
const DEFAULT_OZON_ROOT=path.join(PRINT,'!2. Срочно OZON','СРОЧНО за 29.08');
const MAP=path.join(process.cwd(),'Расширения.xlsx');
const allowed=new Set(['.cdr','.tif']);
const articleRe=/([A-Za-z]{2,4}[0-9]{3,4}\.A[0-9]+)\(([^)]+)\)/i;
let jobs=[]; let WB_ROOT=DEFAULT_WB_ROOT; let OZON_ROOT=DEFAULT_OZON_ROOT;
const DATA=path.join(process.cwd(),'data'); const DB_FILE=path.join(DATA,'printflow.sqlite'); const JOBS_FILE=path.join(DATA,'jobs.json'); const AUDIT_FILE=path.join(DATA,'audit.json'); const SETTINGS_FILE=path.join(DATA,'settings.json');
function validRoot(value){const p=String(value||'').trim();return p.length>=3&&(path.isAbsolute(p)||p.startsWith('\\\\'))}
async function loadSettings(){try{const saved=JSON.parse(await fs.readFile(SETTINGS_FILE,'utf8'));if(validRoot(saved.wbRoot))WB_ROOT=path.normalize(saved.wbRoot);if(validRoot(saved.ozonRoot))OZON_ROOT=path.normalize(saved.ozonRoot)}catch{}}
async function saveSettings(){await fs.mkdir(DATA,{recursive:true});await fs.writeFile(SETTINGS_FILE,JSON.stringify({wbRoot:WB_ROOT,ozonRoot:OZON_ROOT},null,2),'utf8')}
function inside(child,parent){const c=path.resolve(child).toLowerCase(),p=path.resolve(parent).toLowerCase();return c===p||c.startsWith(p+path.sep)}
async function loadJobs(){await fs.mkdir(DATA,{recursive:true});if(LegacyDatabase&&await fs.access(DB_FILE).then(()=>true).catch(()=>false)){const db=new LegacyDatabase(DB_FILE);db.exec('CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, data TEXT NOT NULL)');jobs=db.prepare('SELECT data FROM jobs ORDER BY rowid DESC').all().map(x=>JSON.parse(x.data)).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));db.close();await saveJobs();return}try{const saved=JSON.parse(await fs.readFile(JOBS_FILE,'utf8'));jobs=Array.isArray(saved)?saved.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)):[]}catch{jobs=[]}}
async function saveJobs(){await fs.mkdir(DATA,{recursive:true});await fs.writeFile(JOBS_FILE,JSON.stringify(jobs,null,2),'utf8')}
async function auditCopy(article,destination){let rows=[];try{const saved=JSON.parse(await fs.readFile(AUDIT_FILE,'utf8'));if(Array.isArray(saved))rows=saved}catch{}rows.unshift({id:Date.now(),action:'copy',article,destination,created_at:new Date().toISOString()});await fs.writeFile(AUDIT_FILE,JSON.stringify(rows.slice(0,500),null,2),'utf8')}
async function renamedFilesExist(j){const root=String(j.market).toUpperCase()==='OZON'?OZON_ROOT:(j.files?.[0]?path.dirname(j.files[0]):'');if(!root)return false;const wanted=path.extname(j.files?.[0]||'').toLowerCase();const files=await walk(root);return files.filter(f=>path.basename(f).toUpperCase().includes(j.article)&&(!wanted||path.extname(f).toLowerCase()===wanted)).length>=Number(j.qty||1)}
async function watchJobs(){let changed=false;for(const j of jobs){const renamed=await renamedFilesExist(j);if(j.status==='Забрано'&&renamed){j.status='Ожидает';delete j.takenAt;changed=true;continue}if(j.status==='Ожидает'||j.status==='В печати'){let exists=0;for(const f of j.files||[]){try{await fs.access(f);exists++}catch{}}if((j.files||[]).length&&exists===0&&!renamed){j.status='Забрано';j.takenAt=new Date().toISOString();changed=true}}}if(changed)await saveJobs()}

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
app.get('/api/health',(req,res)=>res.json({ok:true,base:BASE,print:PRINT,wbPrint:WB_ROOT,ozonPrint:OZON_ROOT}));
app.get('/api/audit',async(req,res)=>{try{const rows=JSON.parse(await fs.readFile(AUDIT_FILE,'utf8'));res.json(Array.isArray(rows)?rows.slice(0,200):[])}catch{res.json([])}});
app.get('/api/settings',async(req,res)=>res.json({base:BASE,print:PRINT,map:MAP,allowed:[...allowed],refreshSeconds:5,wbRoot:WB_ROOT,ozonRoot:OZON_ROOT}));
app.post('/api/settings',async(req,res)=>{const wbRoot=String(req.body?.wbRoot||'').trim(),ozonRoot=String(req.body?.ozonRoot||'').trim();if(!validRoot(wbRoot)||!validRoot(ozonRoot))return res.status(422).json({error:'Укажите корректные локальные или сетевые пути для WB и Ozon'});WB_ROOT=path.normalize(wbRoot);OZON_ROOT=path.normalize(ozonRoot);await saveSettings();res.json({ok:true,wbRoot:WB_ROOT,ozonRoot:OZON_ROOT})});
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
async function createJob({article,market='WB',qty=1}){
  const n=Math.max(1,Number(qty)||1); const clean=String(article||'').trim().toUpperCase();
  if(!clean)throw new Error('Укажите артикул'); if(!['WB','OZON'].includes(String(market).toUpperCase()))throw new Error('Неизвестный маркетплейс');
  const maps=readMap(); const files=await findArticleFiles(clean); const candidates=files.map(f=>({path:f,...articleInfo(f)})).filter(x=>x.article===clean); if(!candidates.length)throw new Error('Артикул не найден в базе');
  const chosen=candidates[0], folder=maps[chosen.ext]; if(!folder)throw new Error(`Для расширения ${chosen.ext} нет папки в Расширения.xlsx`);
  const isOzon=String(market).toUpperCase()==='OZON'; const marketRoot=isOzon?OZON_ROOT:WB_ROOT; if(!validRoot(marketRoot))throw new Error('Защита: запрещённая папка назначения'); await fs.mkdir(marketRoot,{recursive:true}); const dirs=await fs.readdir(marketRoot,{withFileTypes:true}).catch(()=>[]); let targetDir=dirs.find(d=>d.isDirectory()&&d.name.trim().toLowerCase()===folder.trim().toLowerCase()); if(!targetDir){const newDir=path.join(marketRoot,folder);if(!inside(newDir,marketRoot))throw new Error('Защита: запрещённый путь назначения');await fs.mkdir(newDir,{recursive:true});targetDir={name:folder}}
  if(!inside(chosen.path,BASE))throw new Error('Защита: исходный файл находится вне базы макетов'); const dest=path.join(marketRoot,targetDir.name); if(!inside(dest,marketRoot))throw new Error('Защита: запрещённый путь назначения'); const ext=path.extname(chosen.path); const created=[]; for(let i=1;i<=n;i++){let name=path.basename(chosen.path,ext)+(n>1?`_${i}`:'')+ext; let target=path.join(dest,name); let k=1; while(true){try{await fs.access(target); target=path.join(dest,path.basename(chosen.path,ext)+(n>1?`_${i}`:'')+`_${k++}`+ext)}catch{break}} await fs.copyFile(chosen.path,target); created.push(target)} await auditCopy(clean,dest);
  const job={id:Date.now()+Math.random(),article:clean,ext:chosen.ext,market:String(market).toUpperCase(),qty:n,folder:targetDir.name,status:'Ожидает',time:new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}),createdAt:new Date().toISOString(),files:created}; jobs=[job,...jobs]; await saveJobs(); return job;
}
app.post('/api/jobs',async(req,res)=>{try{res.json(await createJob(req.body||{}))}catch(e){res.status(422).json({error:e.message})}});
app.post('/api/batch-preview',async(req,res)=>{
  const input=Array.isArray(req.body?.rows)?req.body.rows:[]; const maps=readMap(); const out=[];
  for(let i=0;i<input.length;i++){const raw=input[i]||{}, article=String(raw.article??raw['Артикул']??'').trim().toUpperCase(), qty=Number(raw.qty??raw['Количество']), market=String(raw.market??raw['Маркетплейс']??'').trim().toUpperCase(); let item={row:i+2,article,qty,market,ok:false,error:''};
    if(!article||!Number.isInteger(qty)||qty<1||!['WB','OZON'].includes(market)){item.error='Проверьте артикул, количество и маркетплейс';out.push(item);continue}
    const files=await findArticleFiles(article), candidates=files.map(f=>({path:f,...articleInfo(f)})).filter(x=>x.article===article); if(!candidates.length){item.error='Артикул не найден в базе';out.push(item);continue}
    const chosen=candidates[0], folder=maps[chosen.ext]; if(!folder){item.error=`Нет папки для расширения ${chosen.ext}`;out.push(item);continue}
    item={...item,ok:true,ext:chosen.ext,folder,source:path.basename(chosen.path)};out.push(item);
  } res.json(out);
});
app.post('/api/batch-jobs',async(req,res)=>{const rows=Array.isArray(req.body?.rows)?req.body.rows:[]; if(!rows.length)return res.status(400).json({error:'Нет строк для печати'}); try{const created=[];for(const row of rows){if(row.ok===false)throw new Error(`Строка ${row.row}: ${row.error}`);created.push(await createJob({article:row.article,qty:row.qty,market:row.market}))}res.json({jobs:created})}catch(e){res.status(422).json({error:e.message})}});
app.post('/api/jobs/:id/status',async(req,res)=>{const j=jobs.find(x=>String(x.id)===String(req.params.id));if(!j)return res.status(404).json({error:'Задание не найдено'});const status=String(req.body?.status||'');if(!['Ожидает','В печати','Забрано','Напечатано','Ошибка'].includes(status))return res.status(400).json({error:'Недопустимый статус'});j.status=status;await saveJobs();res.json(j)});
app.delete('/api/jobs/:id',async(req,res)=>{const before=jobs.length;jobs=jobs.filter(x=>String(x.id)!==String(req.params.id));if(jobs.length===before)return res.status(404).json({error:'Запись не найдена'});await saveJobs();res.json({ok:true})});
app.delete('/api/jobs/by-key',async(req,res)=>{const {article,time}=req.body||{},normalizedArticle=String(article||'').trim().toUpperCase();let i=jobs.findIndex(x=>x.article===normalizedArticle&&x.time===time);if(i<0)i=jobs.findIndex(x=>x.article===normalizedArticle);if(i<0)return res.status(404).json({error:'Запись не найдена'});jobs.splice(i,1);await saveJobs();res.json({ok:true})});
app.delete('/api/jobs',async(req,res)=>{jobs=[];await saveJobs();res.json({ok:true})});
app.get('/api/jobs',async(req,res)=>{await watchJobs();let out=[...jobs].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));const q=String(req.query.q||'').trim().toUpperCase(),market=String(req.query.market||'').toUpperCase(),status=String(req.query.status||'');if(q)out=out.filter(j=>j.article.includes(q));if(market&&market!=='ALL')out=out.filter(j=>j.market===market);if(status&&status!=='ALL')out=out.filter(j=>j.status===status);res.json(out)});
await loadSettings(); await loadJobs(); setInterval(watchJobs,5000); app.listen(4174,'0.0.0.0',()=>console.log('PrintFlow API on 4174'));
