import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PresentationFile,FileBlob} from 'file:///C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const root='C:/GitHub/capstone/artifacts/capstone-presentation',build=path.join(root,'build/final-v2'),source=path.join(root,'output/StudyFlow_Capstone_Final_v1.pptx');
process.env.RUNTIME_NODE_MODULES='C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
await fs.mkdir(path.join(build,'previews'),{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sourceHash=hash(await fs.readFile(source));
const p=await PresentationFile.importPptx(await FileBlob.load(source));
const snap=await p.inspect({kind:'image',maxChars:1000000});const rows=snap.ndjson.trim().split('\n').map(JSON.parse);
const b=await fs.readFile(path.join(root,'assets/live/home-today-todo.jpg'));
for(const n of [5,9]){
 const r=rows.filter(r=>r.slideIndex===n-1&&r.kind==='image').sort((a,b)=>a.position.left-b.position.left).at(-1);
 if(!r)throw Error('Missing Todo image');p.delete([r.id]);
 p.slides.items[n-1].images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/jpeg',alt:'Actual authenticated group home: today tasks, personal identifiers excluded',fit:'contain',position:n===9?{left:700,top:430,width:516,height:200}:{left:952,top:274,width:264,height:288}});
}
p.slides.items[4].speakerNotes.text=p.slides.items[4].speakerNotes.text.replace('Todo 설정','홈의 오늘 할 일');
p.slides.items[8].speakerNotes.text='공동 계획 화면과 실제 로그인된 그룹 홈의 오늘 할 일 영역을 함께 보여준다. 오늘 할 일에는 공동 계획 항목, 개인 Todo와 복습에서 연결된 Todo 및 완료 상태가 표시된다. 원래 존재한 데이터를 캡처했으며 완료 여부나 계획을 수정하지 않았다. 구성원별 완료와 이해도의 분리 저장 구조 설명은 유지한다. 이름·프로필·사용자 ID가 보이는 홈 상단은 제외했다. 캡처 route: /group/[id]. 기존 연구의 기능 검증 완료를 주장하지 않는다.';
for(const[i,slide]of p.slides.items.entries())await fs.writeFile(path.join(build,'previews',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await(await p.export({slide,format:'png',scale:1})).arrayBuffer()));
const candidate=path.join(build,'draft-final-v2.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);
const skill='C:/Users/김지윤/.codex/plugins/cache/openai-primary-runtime/presentations/26.1110.11613/skills/presentations';const{finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:path.join(root,'output/StudyFlow_Capstone_Final_v2.pptx'),pythonExecutable:'C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:15,requiredNativeTableOwnerSlides:[],fontPolicy:{basis:'reference',families:['Malgun Gothic'],referencePath:source,referenceSha256:sourceHash},verifyArtifactToolImport:true,receiptPath:path.join(build,'validation-final-v2-reviewed.json')});
if(hash(await fs.readFile(source))!==sourceHash)throw Error('Source changed');console.log('DONE Final v2; original preserved');
