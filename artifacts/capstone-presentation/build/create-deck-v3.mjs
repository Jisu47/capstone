import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PresentationFile,FileBlob} from 'file:///C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const root='C:/GitHub/capstone/artifacts/capstone-presentation',build=path.join(root,'build/v3'),out=path.join(root,'output');
process.env.RUNTIME_NODE_MODULES='C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
await fs.mkdir(path.join(build,'previews'),{recursive:true});await fs.mkdir(path.join(build,'source-previews'),{recursive:true});
const source=path.join(out,'StudyFlow_Capstone_Draft_v2.pptx');
const hash=crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex');
const p=await PresentationFile.importPptx(await FileBlob.load(source));
for(const[i,s]of p.slides.items.entries())await fs.writeFile(path.join(build,'source-previews',`${i+1}.png`),new Uint8Array(await(await p.export({slide:s,format:'png',scale:1})).arrayBuffer()));
const snap=await p.inspect({kind:'slide,textbox,shape,image,table',maxChars:1000000});const entries=snap.ndjson.trim().split('\n').map(JSON.parse);
const old=JSON.parse(await fs.readFile(path.join(root,'build/v2/research-v2.json'),'utf8'));
const C={frame:'#205D40',green:'#27834F',soft:'#EEF7F1',line:'#E5E7E6',ink:'#242B27',muted:'#707773',white:'#FFFFFF',stage:'#FAFCFB'},FONT='Malgun Gothic';const records=[];
function box(s,x,y,w,h,fill=C.white,stroke='none',sw=0){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:sw,style:'solid'}});}
function txt(s,t,x,y,w,h,size=26,color=C.ink,bold=false){const a=box(s,x,y,w,h,'none');a.text=t;a.text.style={typeface:FONT,fontSize:size,color,bold,insets:0,verticalAlignment:'top',wrap:'square'};return a;}
function line(s,x,y,w,c=C.line){box(s,x,y,w,1,c);}
function chrome(s,n,title,label){box(s,0,0,1280,12,C.frame);txt(s,label.toUpperCase(),64,40,1152,24,14,C.green,true);txt(s,title,64,88,1152,78,44,C.ink,true);line(s,64,662,1152);txt(s,'STUDY FLOW',64,678,500,20,12,C.muted,true);txt(s,String(n).padStart(2,'0'),1160,674,56,28,18,C.frame,true);}
function slide(n,title,label,note,oldIndex=n){let s;
 if(n<=13){s=p.slides.items[n-1];const ids=entries.filter(r=>r.slideIndex===n-1&&/^(sh|im|tb)\//.test(r.id)&&r.position?.top>=190&&r.position?.top<662).map(r=>r.id);if(ids.length)p.delete(ids);
 for(const[y,t]of[[88,title],[40,label.toUpperCase()]]){const r=entries.find(r=>r.slideIndex===n-1&&r.position?.top===y&&r.kind==='textbox');if(r)p.resolve(r.id).text=t;}
 }else{s=p.slides.add();s.background.fill=C.white;chrome(s,n,title,label);}
 const o=old.slides.find(x=>x.slide===oldIndex);s.speakerNotes.text=note+'\n\n'+(o?.note??'')+'\n\n근거: '+(o?.sources??[]).join('\n');records.push({slide:n,title,label,note});return s;}
function node(s,label,desc,x,y,w,h=124,fill=C.white){box(s,x,y,w,h,fill,C.line,1);txt(s,label,x+20,y+20,w-40,44,27,C.frame,true);if(desc)txt(s,desc,x+20,y+72,w-40,h-78,21,C.muted);}
function connector(s,x,y,w){box(s,x,y,w,2,C.green);}
async function img(s,name,x,y,w,h){const b=await fs.readFile(path.join(root,'assets/v3',name));s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:'실제 로컬 화면: '+name,fit:'contain',position:{left:x,top:y,width:w,height:h}});}
function missing(s,label,route,x,y,w,h){box(s,x,y,w,h,C.stage,C.line,1);txt(s,'SCREENSHOT PLACEHOLDER',x+24,y+24,w-48,30,18,C.muted,true);txt(s,label,x+24,y+h/2-30,w-48,96,32,C.frame,true);txt(s,route,x+24,y+h-80,w-48,30,18,C.muted);txt(s,'인증 후 실제 화면 캡처 필요',x+24,y+h-44,w-48,25,17,C.muted);}

// Cover is retained as imported, with all native objects.
records.push({slide:1,title:'STUDY FLOW'});
{
 const s=slide(2,'흩어진 정보, 서로 다른 학습 진도','Background / Problem','논문의 문제 정의를 자료·계획·진도라는 세 관계로 요약한 개념도입니다. 아이콘이나 화면처럼 보이는 가짜 UI를 사용하지 않았습니다.');
 const xs=[64,464,864];['자료 분산','계획 분산','개인별 진도 차이'].forEach((t,i)=>{txt(s,String(i+1).padStart(2,'0'),xs[i],218,340,60,48,C.green,true);txt(s,t,xs[i],303,340,52,32,C.frame,true);});
 node(s,'학습 자료','공유 위치가 다름',64,405,240,116);node(s,'일정·할 일','계획 조정이 필요',464,405,240,116);node(s,'완료·이해도','개인별 확인이 필요',864,405,352,116);
 txt(s,'공동 목표를 실제 학습 수행으로 연결하는 관리 구조가 필요하다',64,583,1152,46,28,C.ink,true);
}
{
 const s=slide(3,'계획과 자료를 동일한 학습 맥락으로','Proposed solution','그룹 목표와 공동·개인 학습이라는 맥락 안에서 Plan AI와 Material AI의 역할을 구분합니다. 자동 주차별 자료 매칭이나 RAG 구현 완료를 뜻하지 않습니다.');
 node(s,'그룹의 학습 목표','공동 목표·진도·자료 맥락',64,219,1152,112,C.soft);
 node(s,'Plan AI','계획 초안 생성·조정',64,406,344,139);node(s,'Material AI','자료 정보 기반 질문 응답',468,406,344,139);node(s,'Learning Progress','공동 계획·개인 Todo·복습',872,406,344,139);
 [236,640,1044].forEach(x=>box(s,x,331,2,75,C.green));
}
{
 const s=slide(4,'로그인부터 학습·복습까지','Overall service flow','왼쪽은 실제 로컬 로그인 캡처입니다. 오른쪽은 코드와 논문에 근거한 이후 사용자 흐름의 개념도입니다. 사용자의 지시에 따라 로그인 없이 진행했으며 그룹·계획·자료 화면을 직접 확인한 것으로 표현하지 않습니다.',4);
 await img(s,'login.png',64,199,272,430);line(s,384,214,832);
 node(s,'01  그룹 생성·참여','공동 목표 설정',408,238,354,126);node(s,'02  계획 준비','AI 초안 수정·적용',844,238,372,126);connector(s,762,299,82);
 node(s,'03  자료 활용','업로드·AI 질문',408,448,354,126);node(s,'04  Todo·복습','학습 수행·이해도 기록',844,448,372,126,C.soft);connector(s,762,509,82);
 txt(s,'로그인: 실제 캡처 / 이후 단계: 서비스 흐름도',408,612,808,28,18,C.muted);
}
{
 const s=slide(5,'Plan AI: 입력에서 공동 계획 적용까지','Core feature / Plan AI','진도표 이미지 분석, 학습 단위와 그룹 맥락을 반영한 주간 계획 생성, 사용자 수정 후 공동 계획 적용 흐름입니다. 인증 없이 진행하므로 화면 영역은 캡처 필요 상태로 유지합니다. AI가 제안한 초안과 DB에 적용한 계획을 구분합니다.',5);
 missing(s,'Plan AI Agent\n계획 초안·미리보기','/group/[id]/plan/agent',64,210,803,418);
 ['01  진도표 입력','02  학습 단위 분석','03  계획 초안 생성','04  수정·공동 계획 적용'].forEach((t,i)=>txt(s,t,919,232+i*94,297,74,27,C.frame,true));
}
{
 const s=slide(6,'Material AI: 자료 정보로 질문에 응답','Core feature / Material AI','현재 방식은 자료 원본을 Storage에 저장하고 제목·축약된 요약을 Gemini 맥락에 넣는 방식입니다. 원문 검색 기반 RAG는 후속 과제입니다. 자료 목록과 AI 대화는 현재 인증 세션이 없어 캡처하지 않았습니다.',6);
 missing(s,'자료 목록 / Material AI 대화','/group/[id]/materials',64,210,1152,330);
 const labels=['업로드','자료 정보 저장','질문 맥락 구성','Gemini 응답'];labels.forEach((t,i)=>{txt(s,t,64+i*296,565,264,44,27,C.frame,true);if(i<3)connector(s,328+i*296,587,32);});
 txt(s,'현재: 자료 요약 맥락 기반 / 향후: 원문 검색 RAG',64,620,1152,28,19,C.muted);
}
{
 const s=slide(7,'계획과 자료의 연결 구조','Plan × Material','현재 계획 기준 자료의 학습 단위를 로드맵과 주간 계획에서 참조하며, 공용 자료 요약과 주간 계획은 자료 AI의 맥락으로 공유합니다. 주간 계획의 낮은 이해도 항목은 복습 후보를 거쳐 개인 Todo로 연결됩니다. 일반적인 모든 공동 계획이 자동으로 개인 Todo로 복제되는 구조로 설명하지 않습니다.',7);
 const w=264;[['진도표·목차','계획 기준 자료'],['학습 단위','순서·제목·설명'],['주간 계획','단위 참조'],['개인 Todo','낮은 이해도 복습']].forEach((a,i)=>{node(s,a[0],a[1],64+i*296,226,w,143,i===3?C.soft:C.white);if(i<3)connector(s,328+i*296,298,32);});
 txt(s,'복습 후보·설정 간격을 거쳐 연결',856,390,360,32,18,C.muted);
 node(s,'공용 학습 자료','제목·요약',64,458,400,130);node(s,'Material AI context','자료 정보 + 현재 주간 계획',640,458,576,130,C.soft);connector(s,464,522,176);
 txt(s,'향후 과제: 공용 자료와 주차별 계획의 명시적 연결',64,621,1152,28,19,C.muted);
}
{
 const s=slide(8,'공동 학습과 개인 학습의 연결','Group / Shared × Personal learning','공동 계획 항목과 구성원별 완료·이해도는 분리 저장합니다. 개인 Todo는 별도 관리하며, 낮은 이해도는 복습 후보가 되고 설정 시점 경과 후 데이터 갱신 과정에서 개인 Todo에 추가됩니다. 인증이 필요한 화면은 실제 캡처로 대체하지 않았습니다.',9);
 missing(s,'공동 계획 / 개인 Todo / 복습 예정','/group/[id]/plan',64,211,744,413);
 node(s,'공동 계획','모든 구성원에게 공유',864,211,352,111);node(s,'개인 Todo','추가·수정·완료',864,356,352,111);node(s,'복습','낮은 이해도 항목 재학습',864,501,352,123,C.soft);
}
{
 const s=slide(9,'StudyFlow 시스템 구조','System architecture','사용자 인터페이스는 React·TypeScript, AI·업로드 서버 기능은 Next.js Route Handlers, 인증·데이터·파일 저장은 Supabase, AI 분석과 응답은 Gemini가 담당합니다. 브라우저에서 Supabase를 직접 조회·저장하는 현재 구조도 유지해서 표시합니다.',8);
 node(s,'Client','React / TypeScript',64,220,352,170,C.soft);node(s,'Next.js API','AI 요청·파일 처리',496,220,352,170);node(s,'Gemini','이미지 분석·응답',928,220,288,170,C.soft);connector(s,416,303,80);connector(s,848,303,80);
 node(s,'Supabase','Auth   /   Database   /   Storage',64,510,1152,111);
 box(s,240,390,2,120,C.green);box(s,672,390,2,120,C.green);txt(s,'브라우저 SDK',272,435,230,32,20,C.muted);txt(s,'서버 SDK',704,435,230,32,20,C.muted);
}
{
 const s=slide(10,'AI 처리와 데이터 반영','AI / Data flow','PrototypeProvider가 입력과 그룹 맥락을 서버 API로 전달합니다. 목적별 맥락과 대화 이력을 Gemini에 보내고 응답을 처리합니다. 계획 초안은 사용자가 편집·적용해야 공동 계획에 저장하며, 자료 응답과 대화 기록은 별도로 관리합니다.',10);
 [['사용자 입력','질문·진도표'],['그룹 맥락','목표·계획·자료'],['Route Handler','요청·맥락 처리'],['Gemini','응답 생성']].forEach((a,i)=>{node(s,a[0],a[1],64+i*296,222,264,134,i===3?C.soft:C.white);if(i<3)connector(s,328+i*296,289,32);});
 txt(s,'PLAN AI',64,429,246,36,21,C.green,true);node(s,'계획 초안','사용자 검토·수정',352,402,264,122);node(s,'공동 계획 저장','적용 확인 후 DB 반영',792,402,424,122,C.soft);connector(s,616,462,176);
 txt(s,'MATERIAL AI',64,578,246,36,21,C.green,true);txt(s,'자료 정보 기반 응답',352,578,450,45,30,C.frame,true);txt(s,'대화 기록 저장',864,583,352,38,24,C.muted);
}
{
 const s=slide(11,'Design System과 개발 일관성','Development consistency','실제 /design-preview-v2의 Overview와 Button Detail 핵심 영역을 캡처했습니다. Foundations와 Components를 탐색하고 상세 예시를 비교하는 개발 지원 페이지입니다. AGENTS.md와 함께 UI와 AI 협업 기준을 공유하는 맥락으로 소개합니다. 임시 탐색 시안이며 전 서비스 적용 완료나 협업 효율 개선이 측정되었다는 뜻은 아닙니다.',9);
 await img(s,'design-overview.png',64,195,720,431);await img(s,'design-detail-crop.png',824,240,392,157);
 txt(s,'Button Detail',824,205,392,40,25,C.frame,true);
 txt(s,'Foundations / Components',824,439,392,35,24,C.frame,true);txt(s,'요소별 상세 비교',824,490,392,35,24,C.frame,true);txt(s,'AGENTS.md와 UI 기준 공유',824,541,392,70,24,C.frame,true);
}
{
 const s=slide(12,'구현 화면과 현재 확인 범위','Implementation / Demo summary','왼쪽 세 이미지는 실제 공개 화면인 서비스 진입·로그인·회원가입입니다. 오른쪽은 인증이 필요한 그룹·계획·자료·개인 학습의 코드상 구현 범위이며 실제 UI 시연을 확인했다는 뜻이 아닙니다. 논문 표 2의 계획 생성·적용, 공동 학습, 개인 Todo, 복습, 자료 AI 6개 실행 평가 항목은 모두 미평가 상태입니다.',11);
 const names=['entry.png','login.png','signup.png'];for(let i=0;i<3;i++){await img(s,names[i],64+i*240,210,208,356);txt(s,['서비스 진입','로그인','회원가입'][i],64+i*240,584,208,40,23,C.frame,true);}
 line(s,816,211,400);txt(s,'인증 후 캡처 필요',848,244,368,40,27,C.frame,true);txt(s,'그룹 / Plan / Materials\n개인 Todo / 복습',848,313,368,102,26,C.ink);txt(s,'코드 구현 확인\n기능 실행·AI 품질 평가 미완료',848,489,368,101,23,C.muted);
}
{
 const s=slide(13,'한계와 향후 과제','Limitation / Future work','논문은 주차별 계획·자료 연결, RAG 도입 검토, 시나리오 검증과 사용자 평가를 후속 연구로 제시합니다. 현재 코드 기준으로 문서 추출 품질과 인증·권한·RLS 검증도 보완 대상입니다. 현재 성과를 과장하지 않도록 실행 평가 미완료 상태를 유지합니다.',12);
 [['01','주차별 계획·자료 연결'],['02','원문 검색 기반 RAG'],['03','기능·AI 품질·사용자 평가'],['04','인증·권한·RLS 검증']].forEach((a,i)=>{txt(s,a[0],64,219+i*100,72,48,30,C.green,true);txt(s,a[1],200,219+i*100,1016,53,35,C.frame,true);if(i<3)line(s,200,288+i*100,1016);});
}
{
 const s=slide(14,'함께 실행하는 학습으로','Conclusion','공동 계획과 자료 활용을 개인의 학습 수행·복습으로 잇는 StudyFlow의 목표를 정리합니다. 오른쪽은 실제 서비스 진입 화면입니다. 현재 구현은 사용자 시나리오 검증과 평가를 남겨 둔 개발 단계입니다.',13);
 box(s,64,225,832,342,C.frame);txt(s,'함께 쓰는 자료가\n함께 실행하는\n학습 계획으로 이어지도록',96,276,764,242,43,C.white,true);await img(s,'entry.png',950,200,266,426);
 txt(s,'STUDY FLOW',64,600,832,40,26,C.frame,true);
}
const sourceText=entries.filter(x=>x.kind==='textbox').map(x=>x.text??'').join('');
const v3inspect=await p.inspect({kind:'textbox',maxChars:1000000});const v3text=v3inspect.ndjson.trim().split('\n').map(JSON.parse).map(x=>x.text??'').join('');
await fs.writeFile(path.join(build,'research-v3.json'),JSON.stringify({source,sourceHash:hash,slides:records,actualScreens:['서비스 진입','로그인','회원가입','Design Preview Overview','Button Detail'],missingScreens:['그룹 생성·참여/메인','Plan AI·초안','공동 계획·개인 Todo·복습','Materials·업로드·대화'],userPreference:'로그인 없이 확보 가능한 화면으로 진행',textCharacters:{v2:sourceText.length,v3:v3text.length},designSystemSlide:11},null,2));
for(const[i,s]of p.slides.items.entries()){await fs.writeFile(path.join(build,'previews',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await(await p.export({slide:s,format:'png',scale:1})).arrayBuffer()));console.log('rendered',i+1);}
const candidate=path.join(build,'draft-v3.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);
const skill='C:/Users/김지윤/.codex/plugins/cache/openai-primary-runtime/presentations/26.1110.11613/skills/presentations';const{finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:path.join(out,'StudyFlow_Capstone_Draft_v3.pptx'),pythonExecutable:'C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:14,requiredNativeTableOwnerSlides:[],fontPolicy:{basis:'reference',families:[FONT],referencePath:source,referenceSha256:hash},verifyArtifactToolImport:true,receiptPath:path.join(build,'validation-v3.json')});
if(crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex')!==hash)throw new Error('V2 changed');console.log('DONE V3; V2 preserved');

