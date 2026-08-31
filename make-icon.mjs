import {Jimp} from 'jimp';import pngToIco from 'png-to-ico';import fs from 'node:fs';
const im=new Jimp({width:256,height:256,color:0x111827ff}),orange=0xf06b46ff,white=0xffffffff;
for(let y=24;y<232;y++)for(let x=24;x<232;x++){const dx=x-128,dy=y-128;if(dx*dx+dy*dy<104*104)im.setPixelColor(orange,x,y)}
for(let y=74;y<184;y++)for(let x=92;x<111;x++)im.setPixelColor(white,x,y);
for(let y=74;y<94;y++)for(let x=105;x<151;x++)im.setPixelColor(white,x,y);
for(let y=94;y<116;y++)for(let x=137;x<151;x++)im.setPixelColor(white,x,y);
for(let y=116;y<136;y++)for(let x=105;x<145;x++)im.setPixelColor(white,x,y);
for(let y=136;y<158;y++)for(let x=137;x<151;x++)im.setPixelColor(white,x,y);
for(let y=158;y<180;y++)for(let x=105;x<151;x++)im.setPixelColor(white,x,y);
const b=await im.getBuffer('image/png');fs.writeFileSync('printflow.png',b);fs.writeFileSync('printflow.ico',await pngToIco(b));
