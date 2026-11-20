import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PresentationFile,FileBlob} from 'file:///C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const root='C:/GitHub/capstone/artifacts/capstone-presentation',build=path.join(root,'build/v4'),out=path.join(root,'output');
process.env.RUNTIME_NODE_MODULES='C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
await fs.mkdir(path.join(build,'previews'),{recursive:true});await fs.mkdir(path.join(build,'source-previews'),{recursive:true});
const source=path.join(out,'StudyFlow_Capstone_Draft_v3.pptx');const sourceHash=crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex');
const p=await PresentationFile.importPptx(await FileBlob.load(source));
for(const[i,s]of p.slides.items.entries())await fs.writeFile(path.join(build,'source-previews',`${i+1}.png`),new Uint8Array(await(await p.export({slide:s,format:'png',scale:1})).arrayBuffer()));
const snap=await p.inspect({kind:'slide,textbox,shape,image,table',maxChars:1000000});const entries=snap.ndjson.trim().split('\n').map(JSON.parse);
const C={frame:'#205D40',green:'#27834F',line:'#E5E7E6',muted:'#707773',ink:'#242B27'},FONT='Malgun Gothic';
function text(s,t,x,y,w,h,size=26,color=C.ink,bold=false){const a=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=t;a.text.style={typeface:FONT,fontSize:size,color,bold,insets:0,verticalAlignment:'top',wrap:'square'};return a;}
function body(n,title,label,note){const s=p.slides.items[n-1];const ids=entries.filter(r=>r.slideIndex===n-1&&/^(sh|im|tb)\//.test(r.id)&&r.position?.top>=190&&r.position?.top<662).map(r=>r.id);if(ids.length)p.delete(ids);for(const[y,t]of[[88,title],[40,label.toUpperCase()]]){const r=entries.find(r=>r.slideIndex===n-1&&r.position?.top===y&&r.kind==='textbox');if(r)p.resolve(r.id).text=t;}s.speakerNotes.text=note+'\n\n화면 근거: 원본 UI를 직접 import한 독립 Preview.\nC:/GitHub/capstone/src/components/presentation-preview/\nC:/GitHub/capstone/artifacts/presentation-preview-app/';return s;}
async function image(s,name,x,y,w,h){const b=await fs.readFile(path.join(root,'assets/v4',name));s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:'Original StudyFlow UI with sample data: '+name,fit:'contain',position:{left:x,top:y,width:w,height:h}});}
function demo(s,extra=''){text(s,'Demo data'+(extra?'   ·   '+extra:''),64,635,1152,24,16,C.muted);}

{
 const s=body(4,'그룹에서 계획·자료·학습 수행까지','Overall service flow','원본 GroupHomeScreen, PlanAgentScreen, MaterialsScreen, PlanFlowScreen을 예시 데이터 adapter로 렌더링한 실제 브라우저 캡처입니다. 그룹 목표와 진도를 확인하고 계획을 구성한 뒤 자료를 활용하고 개인 Todo와 복습을 관리하는 사용자 흐름을 보여줍니다. 네트워크 기반 AI나 DB 저장을 검증한 시연은 아닙니다.');
 await image(s,'group-top.png',64,211,264,384);await image(s,'plan-agent.png',360,211,264,384);await image(s,'materials-chat.png',656,211,264,384);await image(s,'personal-items.png',952,211,264,182);await image(s,'review.png',952,407,264,188);
 ['01  Group','02  Plan AI','03  Materials','04  Todo / Review'].forEach((t,i)=>text(s,t,64+i*296,601,264,36,23,C.frame,true));demo(s);
}
{
 const s=body(5,'Plan AI: 입력·분석·초안·적용','Core feature / Plan AI','왼쪽은 원본 PlanFlowScreen의 진도표 입력 UI, 가운데는 PlanAgentScreen의 대화 UI, 오른쪽은 같은 화면의 실제 초안 편집·적용 UI입니다. 화면을 새로 디자인하지 않고 원본 컴포넌트와 원본 CSS를 재사용했습니다. 진도표 데이터, AI 메시지와 구조화된 초안은 고정 예시입니다. 라이브 Gemini 생성이나 실제 공동 계획 저장을 확인한 결과는 아닙니다. 현재 production 코드의 이미지 분석·초안 정규화·미리보기 편집·적용 구조를 시각적으로 설명합니다.');
 await image(s,'reference-input.png',64,242,342,325);await image(s,'plan-agent.png',454,205,342,373);await image(s,'plan-edit.png',850,205,366,373);
 text(s,'01  진도표 입력',64,590,342,35,24,C.frame,true);text(s,'02  분석·초안 생성',454,590,342,35,24,C.frame,true);text(s,'03  수정·공동 계획 적용',850,590,366,35,24,C.frame,true);demo(s,'AI 응답은 고정 예시');
}
{
 const s=body(6,'Material AI: 자료 목록과 대화','Core feature / Material AI','MaterialsScreen의 원본 자료 목록과 자료 선택 후 AI 패널을 직접 캡처했습니다. 업로드 버튼과 선택 상태, 예시 질문·응답·자료 요약 출처 UI가 보입니다. 현재 구현은 자료 제목·요약을 맥락으로 사용하는 방식이며 원문 검색 RAG 완성본이 아닙니다. 캡처의 응답과 자료 정보는 예시 데이터이며 네트워크 요청을 하지 않습니다.');
 text(s,'업로드·자료 선택',64,205,510,38,27,C.frame,true);await image(s,'materials-list.png',64,256,522,350);
 text(s,'질문·자료 정보 기반 응답',704,205,512,38,27,C.frame,true);await image(s,'materials-chat.png',704,250,512,369);
 text(s,'자료 요약 맥락 기반 응답 / 원문 검색 RAG는 향후 과제',64,610,1152,27,20,C.muted);demo(s);
}
{
 const s=body(8,'공동 계획·개인 Todo·복습','Group / Shared × Personal learning','왼쪽은 PlanFlowScreen의 공동 계획, 가운데는 같은 화면의 개인 할 일, 오른쪽은 실제 복습 예정 항목 모달입니다. 공동 계획의 완료 상태와 이해도는 구성원별로 저장하는 production 구조이며, 낮은 이해도 항목은 복습 후보를 거쳐 개인 Todo로 연결됩니다. 여기 표시한 완료 상태·복습 날짜는 예시 데이터입니다. 정시 스케줄러나 푸시 알림을 구현했다는 의미는 아닙니다.');
 const xs=[64,460,856];['Shared','Personal','Review'].forEach((t,i)=>text(s,t,xs[i],210,360,40,28,C.frame,true));
 await image(s,'shared-plan.png',64,272,352,276);await image(s,'personal-items.png',460,272,352,276);await image(s,'review.png',856,260,360,290);
 text(s,'같은 계획, 개별 완료',64,578,352,40,23,C.frame,true);text(s,'개인별 추가·수정·완료',460,578,352,40,23,C.frame,true);text(s,'낮은 이해도 항목 재학습',856,578,360,40,23,C.frame,true);demo(s);
}
{
 const s=body(12,'핵심 기능 구현 화면','Implementation / Demo summary','로그인·회원가입 대신 원본 핵심 서비스 UI를 예시 데이터로 렌더링한 캡처를 모았습니다. PlanAgentScreen, MaterialsScreen, GroupHomeScreen, PlanFlowScreen의 개인 Todo와 복습 모달입니다. UI 렌더링과 로컬 상호작용은 확인했으나 논문의 주요 기능 실행 평가, 실제 Gemini 품질, Supabase 권한 검증이나 사용자 평가는 여전히 완료된 결과로 제시하지 않습니다.');
 await image(s,'plan-edit.png',64,210,264,380);await image(s,'materials-chat.png',360,210,264,380);await image(s,'group-top.png',656,210,264,380);await image(s,'personal-items.png',952,210,264,182);await image(s,'review.png',952,407,264,183);
 ['Plan','Material AI','Group','Todo / Review'].forEach((t,i)=>text(s,t,64+i*296,602,264,35,25,C.frame,true));demo(s,'기능·AI 품질·사용자 평가는 후속 과제');
}
// Preserve the entire Design System slide and correct its notes to its own evidence.
p.slides.items[10].speakerNotes.text='실제 /design-preview-v2 Overview와 Button Detail 캡처를 유지합니다. Foundations / Components 기준, 요소별 상세 비교, AGENTS.md와 함께 UI·AI 협업 기준을 공유하는 보조 개발 구조를 소개합니다. 임시 탐색 시안이며 서비스 전체 적용 완료로 표현하지 않습니다.\n근거: src/components/design-preview-v2/, AGENTS.md';
// Keep the closing composition, replacing the entry screenshot with the group UI.
{
 const s=p.slides.items[13];const oldImage=entries.filter(r=>r.slideIndex===13&&r.kind==='image').map(r=>r.id);if(oldImage.length)p.delete(oldImage);await image(s,'group-top.png',950,200,266,426);text(s,'Demo data',950,638,266,18,13,C.muted);
 s.speakerNotes.text='공동 자료와 계획을 개인의 수행·복습으로 연결하는 프로젝트 목표입니다. 오른쪽은 원본 그룹 홈 UI를 예시 데이터로 렌더링한 캡처입니다. 학습 효과나 서비스 전체 검증을 완료했다고 주장하지 않습니다.';
}

const finalSnapshot=await p.inspect({kind:'textbox',maxChars:1000000});if(finalSnapshot.ndjson.includes('SCREENSHOT PLACEHOLDER'))throw new Error('Unresolved screenshot placeholder');
await fs.writeFile(path.join(build,'preview-evidence.json'),JSON.stringify({source,sourceHash,totalSlides:14,changedSlides:[4,5,6,8,12,14],designSystemSlide:11,origin:'http://127.0.0.1:3100',routes:['/presentation-preview/plan','/presentation-preview/materials','/presentation-preview/todo','/presentation-preview/review','/presentation-preview/group'],reuse:['PlanAgentScreen','MaterialsScreen','PlanFlowScreen','GroupHomeScreen','AppShell','GroupPageHeader','BottomNavigation','WeeklyPlanTabs','ProfileAvatar','PlanReferenceViewerDialog'],sampleData:'캡스톤 스터디 / 머신러닝 중간고사 / 세 구성원 / 3개 학습 단위 / 7개 주간 항목 / 2개 자료 / 개인 Todo 및 복습 후보',productionFilesModified:false,liveAIOrDatabaseValidation:false},null,2));
for(const[i,s]of p.slides.items.entries()){await fs.writeFile(path.join(build,'previews',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await(await p.export({slide:s,format:'png',scale:1})).arrayBuffer()));console.log('rendered',i+1);}
const candidate=path.join(build,'draft-v4.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);
const skill='C:/Users/김지윤/.codex/plugins/cache/openai-primary-runtime/presentations/26.1110.11613/skills/presentations';const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:path.join(out,'StudyFlow_Capstone_Draft_v4.pptx'),pythonExecutable:'C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:14,requiredNativeTableOwnerSlides:[],fontPolicy:{basis:'reference',families:[FONT],referencePath:source,referenceSha256:sourceHash},verifyArtifactToolImport:true,receiptPath:path.join(build,'validation-v4-final.json')});
if(crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex')!==sourceHash)throw new Error('V3 changed');console.log('DONE V4; V3 preserved');

