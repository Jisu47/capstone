import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PresentationFile,FileBlob} from 'file:///C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const root='C:/GitHub/capstone/artifacts/capstone-presentation',build=path.join(root,'build/v6'),source=path.join(root,'output/StudyFlow_Capstone_Draft_v5.pptx');
process.env.RUNTIME_NODE_MODULES='C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');const sourceHash=hash(await fs.readFile(source));
await fs.mkdir(path.join(build,'previews'),{recursive:true});
const p=await PresentationFile.importPptx(await FileBlob.load(source));
const snapshot=await p.inspect({kind:'slide,textbox,shape,image',maxChars:1000000});const rows=snapshot.ndjson.trim().split('\n').map(JSON.parse);
function replace(n,old,next){const r=rows.find(r=>r.slideIndex===n-1&&r.kind==='textbox'&&r.text===old);if(!r)throw Error('Missing text on '+n+': '+old);p.resolve(r.id).text=next;}
replace(12,'Plan AI · 진도표 분석 · 초안 편집\n공동 계획 · 개인 Todo · 복습\nGemini 연동 · AI 응답 처리\nAGENTS.md · Design Preview','Plan AI · 진도표 분석 · 초안 편집\n공동 계획 · 개인 Todo · 복습\nGemini 연동 · AI 응답 처리\nAGENTS.md · 최종 Design System');
p.slides.items[11].speakerNotes.text=p.slides.items[11].speakerNotes.text.replaceAll('Design Preview','Design System')+'\n현재 UI 기준은 최종 Design System으로 채택되었다. 초기 UI 기준 구축 담당은 기존에 사용자 확인을 받은 Git 기준 팀원 A로 유지한다. 새 DESIGN_SYSTEM.md의 개인별 작성 기여는 기록으로 확인되지 않아 별도 단독 실적으로 추가하지 않는다. 서비스 UI 전체 마이그레이션 완료를 의미하지 않는다.\n현재 기준: C:/GitHub/capstone/DESIGN_SYSTEM.md';
replace(14,'Plan AI · Material AI 연동\n공동 계획·개인 Todo·복습\nSupabase 저장·Design Preview','Plan AI · Material AI 연동\n공동 계획·개인 Todo·복습\nSupabase 저장 구조\nDesign System 기준 확정');
p.slides.items[13].speakerNotes.text+='\n최신 디자인 시스템 상태: DESIGN_SYSTEM.md에 따라 공식 공통 UI 기준을 확정했다. 실제 서비스 UI의 일괄 마이그레이션은 하지 않았으며 공통 UI부터 단계적으로 적용하는 과제는 남아 있다. 이 갱신은 기존 논문의 기능 평가 상태를 변경하지 않는다.\nC:/GitHub/capstone/DESIGN_SYSTEM.md';
const s=p.slides.items[12];
replace(13,'협업 과정의 UI 기준 정리','최종 Design System과 공통 UI 기준');
replace(13,'Overview → Detail','Overview → Button Detail');
replace(13,'기능별 AI 개발의 UI 해석 차이\n중복 구조·공유 파일 충돌 예방','기능별 AI 개발의 UI 해석 차이\n중복 구조·공유 파일 충돌 예방');
replace(13,'AGENTS.md: 재사용·공유 파일 규칙\nPreview: Foundations / Components\n팀원이 같은 기준으로 UI 검토','AGENTS.md · DESIGN_SYSTEM.md\nFoundations / Components 기준 확정\n팀·AI agent가 동일한 UI 기준 공유');
const desc=rows.find(r=>r.slideIndex===12&&r.text==='AGENTS.md: 재사용·공유 파일 규칙\nPreview: Foundations / Components\n팀원이 같은 기준으로 UI 검토');p.resolve(desc.id).text.style={typeface: "Malgun Gothic",fontSize:22,color:"#205D40",insets:0,verticalAlignment:"top",wrap:"square"};
replace(13,'팀원 A의 UI 기준 정리 → 기능별 구현의 일관성 검토 · 서비스 전체 적용은 진행 과제','최종 기준 확정 → 기존 컴포넌트 재사용 → 실제 서비스 UI에 단계적 적용 예정');
const imageRows=rows.filter(r=>r.slideIndex===12&&r.kind==='image');if(imageRows.length!==2)throw Error('Expected two Design System images');p.delete(imageRows.map(r=>r.id));
for(const[name,x,y,w,h]of[['design-overview.png',64,211,650,408],['design-button-crop.png',774,254,442,133]]){const b=await fs.readFile(path.join(root,'assets/v6',name));s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:'Official StudyFlow Design System: '+name,fit:'contain',position:{left:x,top:y,width:w,height:h}});}
s.speakerNotes.text='기능별 AI 개발'+'에서 발생할 수 있는 UI 해석 차이, 중복 구조, 구현 방식 차이와 공유 파일 충돌 가능성을 줄이기 위한 보조 개발 결과물이다. AGENTS.md는 개발·협업 규칙, DESIGN_SYSTEM.md는 최종 UI 기준의 사용 규칙을 설명한다. 시각적 기준은 공식 route /design-preview-v2의 실제 구현이다. route 명은 호환성을 위해 유지되지만 실험·비교 단계가 아니라 최종 Design System으로 채택되었다. Foundations는 Colors, Typography, Spacing, Radius, Border이고 Components는 Button, Input, Card, Modal, Tabs다. Overview와 Button Detail의 최신 실제 화면을 사용했다. Detail은 같은 route의 로컬 선택 상태다. 이 표본은 서비스용 공통 컴포넌트의 행동 명세 완성이나 서비스 전체 UI 적용을 의미하지 않는다. 기존 서비스 컴포넌트를 재사용하며 승인된 범위 안에서 단계적으로 적용할 기반이다.\n근거: C:/GitHub/capstone/DESIGN_SYSTEM.md\nC:/GitHub/capstone/AGENTS.md\nC:/GitHub/capstone/src/components/design-preview-v2/\n최종 화면: http://127.0.0.1:3000/design-preview-v2';
const after=await p.inspect({kind:'textbox',maxChars:1000000});await fs.writeFile(path.join(build,'content.ndjson'),after.ndjson);
for(const[i,slide]of p.slides.items.entries()){await fs.writeFile(path.join(build,'previews',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await(await p.export({slide,format:'png',scale:1})).arrayBuffer()));}
const candidate=path.join(build,'draft-v6.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);
const skill='C:/Users/김지윤/.codex/plugins/cache/openai-primary-runtime/presentations/26.1110.11613/skills/presentations';const{finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:path.join(root,'output/StudyFlow_Capstone_Draft_v6.pptx'),pythonExecutable:'C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:15,requiredNativeTableOwnerSlides:[],fontPolicy:{basis:'reference',families:['Malgun Gothic'],referencePath:source,referenceSha256:sourceHash},verifyArtifactToolImport:true,receiptPath:path.join(build,'validation-v6.json')});
if(sourceHash!==hash(await fs.readFile(source)))throw Error('Source modified');console.log('DONE V6; V5 preserved; edited slides 12,13,14 only');
