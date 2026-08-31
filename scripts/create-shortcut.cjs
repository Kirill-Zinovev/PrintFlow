const {spawnSync}=require('node:child_process');
const path=require('node:path');

if(process.platform!=='win32')process.exit(0);

const projectRoot=path.resolve(__dirname,'..');
const ps=path.join(__dirname,'create-shortcut.ps1');
const result=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',ps,'-ProjectRoot',projectRoot],{stdio:'inherit',windowsHide:true});
if(result.error||result.status!==0){console.warn('Не удалось создать ярлык PrintFlow. Его можно создать вручную через файл «Запустить PrintFlow.bat».')}
