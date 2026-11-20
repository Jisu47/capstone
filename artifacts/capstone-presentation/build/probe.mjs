import fs from 'node:fs/promises';
import {Presentation,PresentationFile} from 'file:///C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const p=Presentation.create({slideSize:{width:1280,height:720}});const s=p.slides.add();
s.background.fill='#205D40';const t=s.shapes.add({geometry:'textbox',position:{left:80,top:150,width:1000,height:180},fill:'none',line:{fill:'none',width:0}});t.text='STUDY FLOW\n학습 계획과 자료를 연결하다';t.text.style={fontFamily:'Malgun Gothic',fontSize:48,color:'#FFFFFF',insets:0};
await fs.writeFile(new URL('./probe.png',import.meta.url),new Uint8Array(await (await p.export({slide:s,format:'png',scale:1})).arrayBuffer()));
await (await PresentationFile.exportPptx(p)).save(new URL('./probe.pptx',import.meta.url).pathname.replace(/^\/(.:\/)/,'$1'));
console.log('ok');

