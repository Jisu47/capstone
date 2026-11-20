import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PresentationFile,FileBlob} from 'file:///C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const root='C:/GitHub/capstone/artifacts/capstone-presentation',build=path.join(root,'build/final-v1'),source=path.join(root,'output/StudyFlow_Capstone_Draft_v6.pptx');
process.env.RUNTIME_NODE_MODULES='C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
await fs.mkdir(path.join(build,'previews'),{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sourceHash=hash(await fs.readFile(source));
const p=await PresentationFile.importPptx(await FileBlob.load(source));
const snapshot=await p.inspect({kind:'slide,textbox,shape,image',maxChars:1000000});const rows=snapshot.ndjson.trim().split('\n').map(JSON.parse);
function replace(n,old,next){const r=rows.find(r=>r.slideIndex===n-1&&r.kind==='textbox'&&r.text===old);if(!r)throw Error('Missing text on '+n+': '+old);if(next===null)p.delete([r.id]);else p.resolve(r.id).text=next;}
function text(s,t,x,y,w,h,size=20,color='#205D40'){const a=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=t;a.text.style={typeface:'Malgun Gothic',fontSize:size,color,insets:0,wrap:'square'};}
async function replaceImages(n,names){const images=rows.filter(r=>r.slideIndex===n-1&&r.kind==='image').sort((a,b)=>a.position.left-b.position.left);if(images.length!==names.length)throw Error('Image count on '+n);p.delete(images.map(r=>r.id));for(let i=0;i<names.length;i++){const b=await fs.readFile(path.join(root,'assets/live',names[i]));p.slides.items[n-1].images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/jpeg',alt:(names[i].includes('example')?'Original StudyFlow UI with illustrative sample data: ':'Authenticated StudyFlow service capture, personal identifiers excluded: ')+names[i],fit:'contain',position:n===9?{left:i===0?64:700,top:430,width:i===0?530:516,height:180}:n===6&&i===0?{left:426,top:307,width:380,height:312}:images[i].position});}}
await replaceImages(5,['group-example.jpg','reference-input.jpg','materials-example.jpg','todo-settings.jpg']);
await replaceImages(6,['plan-agent.jpg','plan-edit.jpg']);
await replaceImages(7,['materials-upload-example.jpg','materials-chat-example.jpg']);
await replaceImages(9,['shared-plan.jpg','personal-review.jpg']);
replace(5,'Demo data','Group·Materials: 예시 데이터 / Plan·Todo: 실제 로그인 화면');
replace(6,'AI 대화·초안 반영','실제 계획 요청·응답');
replace(6,'Demo data · 예시 초안 · 최종 적용은 사용자 확인 후','실제 서비스의 기존 AI 응답 · 최종 적용은 사용자 확인 후');
replace(7,'Demo data · 현재: 제목·요약 기반 응답 / 향후: 원문 검색 RAG','예시 자료·예시 응답 · 현재: 제목·요약 기반 / 향후: 원문 검색 RAG');
replace(9,'Demo data · 복습 후보는 설정 간격 후 데이터 갱신 과정에서 Todo로 연결','복습 후보는 설정 간격 후 데이터 갱신 과정에서 Todo로 연결');
text(p.slides.items[8],'공동 계획',64,398,530,24);text(p.slides.items[8],'개인 Todo · 복습 Todo',700,398,516,24);
replace(14,'소스 코드와 저장 구조 확인\n예시 데이터로 원본 UI 확인\n실제 AI·DB 동작 평가와 구분','소스 코드와 저장 구조 확인\nPlan·Todo: 실제 로그인 UI\nGroup·Materials: 예시 화면\n전체 기능·AI 품질 평가는 별도');
const common='\n캡처 근거: 사용자가 직접 로그인한 실제 로컬 서비스 http://127.0.0.1:3000. 인증 우회나 presentation-preview를 사용하지 않았다. 개인정보가 보이는 인사말·프로필·업로더는 캡처 영역에서 제외했다. 화면 캡처는 논문의 기능별 검증·학습 효과 평가 완료를 의미하지 않는다.';
p.slides.items[4].speakerNotes.text='Plan의 진도표와 Todo 설정은 사용자가 직접 로그인한 실제 서비스 캡처다. Group과 Materials 화면은 사용자의 후속 요청에 따라 실제 UI 컴포넌트의 중립적인 예시 데이터를 사용한다. 실제 그룹은 1인 구성이고 예시 화면만 3명으로 제시했다. 실제 계정에 팀원을 추가하지 않았다. 기존 연구 개념과 사용자 흐름은 그대로 유지한다.';
p.slides.items[5].speakerNotes.text='기존 그룹에 저장된 Plan AI 대화와 미리보기 편집 UI다. 기존 응답을 미리보기에만 반영했고 공동 계획에 최종 적용하거나 저장하지 않았다. 진도표 분석→초안→수정→적용이라는 기존 설계 설명은 유지한다.'+common;
p.slides.items[6].speakerNotes.text='실제 자료 업로드 시 서버의 사용자 인증 확인 오류로 저장되지 않았다. 사용자가 자료 AI는 기존 발표처럼 예시로 작성하도록 명시적으로 요청하여 기존 원본 MaterialsScreen에 예시 자료와 고정 응답을 넣은 캡처를 유지했다. 실제 업로드나 라이브 Gemini 성공 결과로 제시하지 않는다. 현재 제목·요약 기반 맥락을 사용하는 설계와 원문 검색 RAG가 향후 과제라는 설명은 유지한다.';
p.slides.items[8].speakerNotes.text='원래 존재한 공동 계획과 개인 Todo 및 복습에서 연결된 Todo를 캡처했다. 구성원별 완료와 이해도의 분리 저장 구조 설명은 유지한다. 복습 예정 후보가 비어 있어 예시 모달을 재사용하지 않고 실제로 생성되어 있던 복습 Todo를 보여준다.'+common;
p.slides.items[13].speakerNotes.text=p.slides.items[13].speakerNotes.text.replaceAll('발표 캡처는 독립 Preview에서 실제 컴포넌트에 mock 데이터를 주입한 결과다.','Plan AI·공동 계획·개인 Todo·복습은 실제 로그인한 서비스 캡처다. Group의 3인 구성과 Materials는 사용자가 요청한 예시 화면이다.').replaceAll('코드 구현 및 예시 UI 확인과 연구의 기능 평가를 분리한다.','코드 구현 및 실제·예시 UI 확인과 연구의 기능 평가를 분리한다.');
const final=await p.inspect({kind:'textbox',maxChars:1000000});await fs.writeFile(path.join(build,'content.ndjson'),final.ndjson);
for(const[i,slide]of p.slides.items.entries())await fs.writeFile(path.join(build,'previews',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await(await p.export({slide,format:'png',scale:1})).arrayBuffer()));
const candidate=path.join(build,'draft-final-v1.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);
const skill='C:/Users/김지윤/.codex/plugins/cache/openai-primary-runtime/presentations/26.1110.11613/skills/presentations';const{finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:path.join(root,'output/StudyFlow_Capstone_Final_v1.pptx'),pythonExecutable:'C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:15,requiredNativeTableOwnerSlides:[],fontPolicy:{basis:'reference',families:['Malgun Gothic'],referencePath:source,referenceSha256:sourceHash},verifyArtifactToolImport:true,receiptPath:path.join(build,'validation-final-v1-reviewed.json')});
if(hash(await fs.readFile(source))!==sourceHash)throw Error('V6 changed');console.log('DONE Final v1; V6 preserved');
