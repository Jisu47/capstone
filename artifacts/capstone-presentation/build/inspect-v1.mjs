import fs from 'node:fs/promises';
import {PresentationFile,FileBlob} from 'file:///C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const root='C:/GitHub/capstone/artifacts/capstone-presentation';
const p=await PresentationFile.importPptx(await FileBlob.load(root+'/output/StudyFlow_Capstone_Draft_v1.pptx'));
await fs.mkdir(root+'/build/v2/source-previews',{recursive:true});
for(const [i,s] of p.slides.items.entries()){
 await fs.writeFile(root+`/build/v2/source-previews/${i+1}.png`,new Uint8Array(await (await p.export({slide:s,format:'png',scale:1})).arrayBuffer()));
 if(i===1)console.log(s.shapes.items.map(x=>({id:x.id,position:x.position,text:String(x.text)})));
}
await fs.writeFile(root+'/build/v2/source-proto.json',JSON.stringify(p.toProto()));
console.log('slides',p.slides.items.length,'size',p.slides.items[0].size,'masters',p.masters.items.length);
