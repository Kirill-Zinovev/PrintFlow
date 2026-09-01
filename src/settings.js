const SETTINGS_API=window.location.protocol==='file:'||window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1'?'http://127.0.0.1:4174':window.location.protocol+'//'+window.location.hostname+':4174';

const settingsStyle=document.createElement('style');
settingsStyle.textContent=`
.path-dialog{position:fixed;inset:0;background:#18223555;display:grid;place-items:center;z-index:30;padding:16px}
.path-card{width:min(680px,100%);background:#fff;border:1px solid #dfe6f0;border-radius:16px;padding:25px;box-shadow:0 20px 60px #18223530}
.path-card h3{margin:0;font:700 20px 'Space Grotesk',sans-serif;color:#152034}
.path-card p{margin:7px 0 21px;color:#73819a;font:12px 'DM Sans',sans-serif;line-height:1.5}
.path-card label{display:block;margin:0 0 17px;color:#667289;font:700 11px 'DM Sans',sans-serif}
.path-input-row{display:flex;gap:8px;margin-top:7px}
.path-card input{display:block;min-width:0;flex:1;height:42px;padding:0 11px;border:1px solid #dfe6f0;border-radius:10px;color:#253149;font:500 12px 'DM Sans',sans-serif;outline:0}
.path-card input:focus{border-color:#f26b47;box-shadow:0 0 0 4px #f26b471c}
.path-check{flex:0 0 auto;height:42px;padding:0 12px;border:1px solid #dfe6f0;border-radius:10px;background:#f8fafc;color:#526078;font:700 11px 'DM Sans',sans-serif;cursor:pointer}
.path-check:hover{border-color:#f3b09c;background:#fff8f5;color:#d85f3e}
.path-check:disabled{opacity:.65;cursor:wait}
.path-status{min-height:16px;margin:6px 0 0;color:#9aa5b5;font:500 11px 'DM Sans',sans-serif}
.path-status.available{color:#279968}.path-status.missing{color:#b37a35}.path-status.invalid,.path-status.file,.path-status.unavailable{color:#c7644c}.path-status.pending{color:#73819a}
.path-error{min-height:18px;margin:0 0 10px;color:#c7644c;font:500 11px 'DM Sans',sans-serif}
.path-actions{display:flex;justify-content:flex-end;align-items:center;gap:8px;border-top:1px solid #edf1f6;padding-top:17px;margin-top:2px}
.path-actions button{height:38px;border-radius:10px;padding:0 14px;font:700 11px 'DM Sans',sans-serif;cursor:pointer}
.path-cancel,.path-check-all{border:1px solid #dfe6f0;background:#fff;color:#667289}.path-check-all:hover,.path-cancel:hover{border-color:#f3b09c;background:#fff8f5;color:#d85f3e}
.path-save{border:0;background:#f26b47;color:#fff;box-shadow:0 6px 14px #f26b4730}.path-save:hover{background:#e55d3b}.path-save:disabled{opacity:.65;cursor:wait}
@media(max-width:600px){.path-card{padding:19px}.path-input-row{display:block}.path-check{width:100%;margin-top:7px}.path-actions{flex-wrap:wrap}.path-actions button{flex:1}}
`;
document.head.append(settingsStyle);

function closePathDialog(){document.querySelector('.path-dialog')?.remove()}

function setPathStatus(form,name,kind,message){const status=form.querySelector(`[data-status="${name}"]`);if(!status)return;status.className=`path-status ${kind}`;status.textContent=message}

async function checkPath(form,name){const input=form.elements[name],button=form.querySelector(`[data-check="${name}"]`),value=String(input.value||'').trim();if(!value){setPathStatus(form,name,'invalid','Введите путь для проверки');return false}button.disabled=true;setPathStatus(form,name,'pending','Проверяю доступность папки…');try{const response=await fetch(SETTINGS_API+'/api/settings/check-path',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:value})});const result=await response.json();if(!response.ok)throw new Error(result.message||'Не удалось проверить путь');setPathStatus(form,name,result.status,result.message);return Boolean(result.ok)}catch(error){setPathStatus(form,name,'unavailable',error.message||'Не удалось проверить путь');return false}finally{button.disabled=false}}

async function openPathDialog(){closePathDialog();const d=document.createElement('div');d.className='path-dialog';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','Папки назначения');d.innerHTML='<form class="path-card"><h3>Папки назначения</h3><p>Укажите сетевые или локальные пути. Новые задания будут сохраняться туда автоматически.</p><label>Путь для WB<div class="path-input-row"><input name="wbRoot" autocomplete="off" spellcheck="false"><button type="button" class="path-check" data-check="wbRoot">Проверить</button></div><div class="path-status" data-status="wbRoot" aria-live="polite">Путь ещё не проверен</div></label><label>Путь для Ozon<div class="path-input-row"><input name="ozonRoot" autocomplete="off" spellcheck="false"><button type="button" class="path-check" data-check="ozonRoot">Проверить</button></div><div class="path-status" data-status="ozonRoot" aria-live="polite">Путь ещё не проверен</div></label><div class="path-error" role="alert"></div><div class="path-actions"><button type="button" class="path-check-all">Проверить оба</button><button type="button" class="path-cancel">Отмена</button><button type="submit" class="path-save">Сохранить</button></div></form>';document.body.append(d);const form=d.querySelector('form'),error=d.querySelector('.path-error');try{const data=await fetch(SETTINGS_API+'/api/settings').then(r=>r.json());form.elements.wbRoot.value=data.wbRoot||'';form.elements.ozonRoot.value=data.ozonRoot||''}catch{error.textContent='Не удалось загрузить текущие настройки'}form.querySelector('[data-check="wbRoot"]').onclick=()=>checkPath(form,'wbRoot');form.querySelector('[data-check="ozonRoot"]').onclick=()=>checkPath(form,'ozonRoot');form.querySelector('.path-check-all').onclick=async()=>{error.textContent='';await Promise.all([checkPath(form,'wbRoot'),checkPath(form,'ozonRoot')])};form.querySelector('.path-cancel').onclick=closePathDialog;form.onsubmit=async e=>{e.preventDefault();const save=form.querySelector('.path-save');save.disabled=true;error.textContent='';try{const response=await fetch(SETTINGS_API+'/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({wbRoot:form.elements.wbRoot.value,ozonRoot:form.elements.ozonRoot.value})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Не удалось сохранить настройки');closePathDialog()}catch(err){error.textContent=err.message;save.disabled=false}};d.onclick=e=>{if(e.target===d)closePathDialog()};form.elements.wbRoot.focus()}

function bindSettings(){const button=[...document.querySelectorAll('.admin-controls button')].find(x=>x.textContent.trim()==='Настройки');if(button&&!button.dataset.pathSettings){button.dataset.pathSettings='1';button.onclick=openPathDialog}}
new MutationObserver(bindSettings).observe(document.body,{childList:true,subtree:true});setTimeout(bindSettings,350);
