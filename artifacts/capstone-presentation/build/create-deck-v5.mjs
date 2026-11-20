import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PresentationFile,FileBlob} from 'file:///C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const root='C:/GitHub/capstone/artifacts/capstone-presentation',build=path.join(root,'build/v5'),out=path.join(root,'output');
process.env.RUNTIME_NODE_MODULES='C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
await fs.mkdir(path.join(build,'previews'),{recursive:true});
const source=path.join(out,'StudyFlow_Capstone_Draft_v4.pptx');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourceHash=hash(await fs.readFile(source));
const p=await PresentationFile.importPptx(await FileBlob.load(source));
const snap=await p.inspect({kind:'slide,textbox,shape,image,table',maxChars:1000000});
const entries=snap.ndjson.trim().split('\n').map(JSON.parse);
const C={frame:'#205D40',green:'#27834F',line:'#E5E7E6',muted:'#707773',ink:'#242B27',soft:'#EEF7F1',white:'#FFFFFF'},FONT='Malgun Gothic';
const paper='C:/GitHub/capstone/docs/(초안) StudyFlow 두단_논문_양식.hwp';
function text(s,t,x,y,w,h,size=26,color=C.ink,bold=false){const a=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=t;a.text.style={typeface:FONT,fontSize:size,color,bold,insets:0,verticalAlignment:'top',wrap:'square'};return a;}
function rect(s,x,y,w,h,fill='none',stroke=C.line){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:stroke==='none'?0:1}});}
function line(s,x,y,w,h=1,color=C.line){return rect(s,x,y,w,h,color,'none');}
function box(s,title,sub,x,y,w,h=110,fill=C.white){rect(s,x,y,w,h,fill);text(s,title,x+20,y+18,w-40,40,28,C.frame,true);if(sub)text(s,sub,x+20,y+66,w-40,h-70,22,C.muted);}
function note(s,body,files=[]){s.speakerNotes.text=body+'\n\n논문: '+paper+'\n코드 근거:\n'+files.map(f=>'C:/GitHub/capstone/'+f).join('\n');}
function body(n,title,label,notes,files=[]){let s=p.slides.items[n-1];if(s){const ids=entries.filter(r=>r.slideIndex===n-1&&/^(sh|im|tb)\//.test(r.id)&&r.position?.top>=190&&r.position?.top<662).map(r=>r.id);if(ids.length)p.delete(ids);for(const[y,t]of[[88,title],[40,label.toUpperCase()]]){const r=entries.find(r=>r.slideIndex===n-1&&r.position?.top===y&&r.kind==='textbox');if(r)p.resolve(r.id).text=t;}const page=entries.find(r=>r.slideIndex===n-1&&r.kind==='textbox'&&r.position?.left===1160);if(page)p.resolve(page.id).text=String(n).padStart(2,'0');}else{s=p.slides.add();s.background.fill=C.white;rect(s,0,0,1280,12,C.frame,'none');text(s,label.toUpperCase(),64,40,1152,24,14,C.green,true);text(s,title,64,88,1152,78,44,C.ink,true);line(s,64,662,1152);text(s,'STUDY FLOW',64,678,280,20,12,C.muted,true);text(s,String(n).padStart(2,'0'),1160,674,56,26,18,C.frame,true);}note(s,notes,files);return s;}
async function image(s,name,x,y,w,h,folder='v5'){const b=await fs.readFile(path.join(root,'assets',folder,name));s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:(folder==='v5'?'Original StudyFlow UI, neutral sample data: ':'Design Preview V2: ')+name,fit:'contain',position:{left:x,top:y,width:w,height:h}});}
function demo(s,extra=''){text(s,'Demo data'+(extra?' · '+extra:''),64,635,1152,24,16,C.muted);}

// Retain the V4 cover composition, palette and type hierarchy.
{
 const s=p.slides.items[0];
 for(const r of entries.filter(r=>r.slideIndex===0&&r.kind==='textbox')){
  if(r.text==='CAPSTONE DESIGN')p.resolve(r.id).text='졸업작품 발표회 · 설계 및 구현';
  if((r.text??'').includes('팀명 [입력]'))p.resolve(r.id).text='팀명 [입력]     팀원 A · 팀원 B     소속 [입력]';
 }
 note(s,'StudyFlow의 연구 설계와 실제 구현을 함께 소개한다. 팀원은 개인정보 노출을 피하기 위해 A/B로 표기한다. 팀명·소속의 최종 표기는 발표자가 입력한다. 논문은 단독 저자 초안이지만 작품은 2인 팀 프로젝트라는 사용자 설명에 따른다.');
}
{
 const s=body(2,'공동 학습과 개인 수행 사이의 단절','Research background / Problem','논문 1장 연구 배경: 자료 공유·일정·진도 확인이 분산되어 공동 계획과 개인 수행을 연계하기 어렵고 팀장의 지속적 조정 부담이 발생할 수 있다. 이는 연구 문제 정의이며 사용자 조사나 비교 성능 측정으로 입증한 수치가 아니다.');
 const xs=[64,464,864],heads=['자료·계획의 분산','진도·이해도 차이','반복적인 계획 조정'],subs=['공유 자료와 학습 일정이\n서로 다른 도구에 존재','같은 계획을 수행해도\n개인의 학습 상태는 다름','팀장이 구성원 상태를\n확인하며 계획을 조율'];
 xs.forEach((x,i)=>{text(s,'0'+(i+1),x,225,352,54,48,C.green,true);text(s,heads[i],x,310,352,42,30,C.frame,true);text(s,subs[i],x,379,352,88,25,C.muted);});
 line(s,64,510,1152);text(s,'연구 질문',64,542,170,32,22,C.green,true);text(s,'계획·자료·개인 학습 진행을 하나의 흐름으로 연결할 수 있는가?',64,584,1152,44,29,C.ink,true);
}
{
 const s=body(3,'공동 계획이 개인의 수행과 복습으로','Research goal / Proposed system','논문 1장·2.1·3.1장: 계획 AI와 자료 AI의 목적을 구분하고 공통 계획과 개인별 학습 상태를 연계하는 시스템을 제안한다. 기존 연구 대비 초점의 차이를 설명하는 것이며 학습 효과나 성능 우위를 검증한 결과는 아니다.');
 text(s,'계획과 자료를 동일한 학습 맥락으로 연결한다',64,204,1152,56,34,C.frame,true);
 box(s,'그룹 학습 맥락','공동 목표 · 진도표 · 현재 주간 계획 · 공유 자료',64,294,1152,112,C.soft);
 const xs=[64,464,864];for(const x of xs)line(s,x+172,406,1,58,C.green);
 box(s,'Plan AI','계획 초안 생성·조정',64,464,352,126);
 box(s,'Material AI','자료 정보 기반 질의응답',464,464,352,126);
 box(s,'Learning Progress','개별 완료·Todo·복습',864,464,352,126);
 text(s,'연구 초점: 공동 학습 운영과 개인의 학습 활동을 함께 관리하는 구조',64,622,1152,28,21,C.muted);
}
{
 const s=body(4,'Plan AI와 Material AI의 역할','AI role / Functional design','논문 3.1장과 현재 Gemini context·system instruction에 근거한다. Plan AI는 목표·진도표 분석 단위·기존 계획·요청을 이용해 주간 초안을 생성하고, Material AI는 그룹 목표·현재 계획과 자료 제목·요약을 이용해 응답한다. 현재 원문 검색 기반 RAG나 검색 정확도 평가를 완료한 시스템이 아니다.',['src/lib/gemini.ts','src/lib/api-contracts.ts','src/lib/plan-flow.ts']);
 text(s,'Plan AI',230,205,420,46,33,C.frame,true);text(s,'Material AI',740,205,476,46,33,C.frame,true);
 const rows=[['목적','공동 계획 생성·조정','자료를 활용한 학습 질문 지원'],['입력','그룹 목표 · 진도표 / 목차\n기존 계획 · 사용자 요청','자료 제목·요약 · 그룹 목표\n현재 주간 계획 · 사용자 질문'],['처리','이미지에서 학습 단위 분석\n주간 계획 초안 생성','학습 맥락 구성\nGemini 응답 생성'],['출력','요일 · 할 일 · 예상 시간\n사용자가 수정할 공동 계획 초안','자료 정보 기반 학습 응답']];
 const ys=[279,351,452,553];rows.forEach(([a,b,c],i)=>{line(s,64,ys[i]-13,1152);text(s,a,64,ys[i],130,36,21,C.green,true);text(s,b,230,ys[i],450,76,23);text(s,c,740,ys[i],476,76,23);});
 text(s,'현재 Material AI: 제목·요약 맥락 기반 / 원문 검색 RAG는 향후 과제',64,635,1152,24,18,C.muted);
}
{
 const s=body(5,'그룹에서 계획·자료·학습 수행까지','Overall service flow','논문의 그룹 중심 사용자 흐름과 원본 UI의 대응이다. 네 화면은 GroupHomeScreen, PlanFlowScreen 진도표 입력, MaterialsScreen 자료 목록, PlanFlowScreen 개인 Todo 영역이다. 발표 전용 mock 데이터이며 실제 사용자 개인정보, 라이브 Gemini 실행 또는 DB 저장의 검증 결과가 아니다.',['src/components/group-home-screen.tsx','src/components/plan-screen.tsx','src/components/materials-screen.tsx','src/components/presentation-preview/demo-data.ts']);
 const xs=[64,360,656,952],labels=['01  Group','02  Plan','03  Materials','04  Todo'],caps=['목표·진행 상태 확인','진도표로 계획 준비','자료 등록·질문 시작','개인의 학습 수행'];
 const names=['group-flow.png','reference-flow.png','materials-flow.png','todo-flow.png'];
 for(let i=0;i<4;i++){text(s,labels[i],xs[i],210,264,40,28,C.frame,true);await image(s,names[i],xs[i],274,264,288);text(s,caps[i],xs[i],588,264,32,21,C.ink,true);if(i<3)text(s,'→',xs[i]+268,218,26,28,23,C.green);}
 demo(s);
}
{
 const s=body(6,'Plan AI: 설계 흐름과 구현','Research design × Implementation / Plan AI','논문 3.1·3.2장: 진도표 이미지 분석과 기존 계획을 참고해 주간 초안을 생성하고 사용자가 수정한 뒤 공동 계획에 반영한다. 현재 코드의 /api/plan-reference/analyze, /api/ai/chat scope plan-agent와 PlanAgentScreen을 연결해 설명한다. 대화·편집 화면은 원본 UI에 고정 예시 초안을 렌더링한 것이며 실제 AI 생성 성공을 평가한 캡처가 아니다.',['src/components/plan-agent-screen.tsx','src/app/api/plan-reference/analyze/route.ts','src/app/api/ai/chat/route.ts','src/lib/plan-flow.ts']);
 text(s,'RESEARCH / DESIGN',64,208,330,24,16,C.green,true);
 const steps=['진도표·목표 입력','학습 단위 분석','주간 계획 초안','사용자 수정','공동 계획 적용'];
 steps.forEach((t,i)=>{text(s,String(i+1).padStart(2,'0'),64,262+i*65,44,35,23,C.green,true);text(s,t,120,262+i*65,267,38,25,C.ink,i===4);if(i<4)line(s,83,300+i*65,1,21,C.line);});
 text(s,'IMPLEMENTATION',426,208,790,24,16,C.green,true);
 text(s,'AI 대화·초안 반영',426,250,390,35,25,C.frame,true);await image(s,'plan-agent.png',426,307,380,337);
 text(s,'미리보기 수정·적용',856,250,360,35,25,C.frame,true);await image(s,'plan-edit.png',856,292,360,338);
 demo(s,'예시 초안 · 최종 적용은 사용자 확인 후');
}
{
 const s=body(7,'Material AI: 자료 정보에서 학습 응답으로','Research design × Implementation / Material AI','논문 3.1·3.2장: 그룹 자료 제목과 요약을 Gemini 맥락에 포함해 질의응답을 수행한다. 업로드 서버에 파일 저장·기본 텍스트 추출·요약 생성 코드가 있고, 현재 Gemini materials scope는 제목·요약과 현재 주간 계획을 사용한다. PDF 원문 검색, 임베딩 검색이나 RAG 완성을 의미하지 않는다. 원본 MaterialsScreen의 업로드 안내 및 대화 화면에 예시 데이터를 사용했다.',['src/components/materials-screen.tsx','src/lib/server/material-upload.ts','src/lib/gemini.ts','src/app/api/groups/[id]/materials/route.ts']);
 text(s,'RESEARCH / DESIGN',64,208,590,24,16,C.green,true);
 ['자료 업로드·Storage 저장','자료 제목·요약 관리','그룹 목표·현재 계획으로 맥락 구성','Gemini 응답'].forEach((t,i)=>{text(s,String(i+1).padStart(2,'0'),64,255+i*44,44,32,21,C.green,true);text(s,t,120,255+i*44,520,34,24);});
 text(s,'자료 업로드 UI',64,435,560,30,23,C.frame,true);await image(s,'materials-upload.png',64,473,530,150);
 text(s,'IMPLEMENTATION',710,208,506,24,16,C.green,true);await image(s,'materials-chat.png',710,243,506,372);
 demo(s,'현재: 제목·요약 기반 응답 / 향후: 원문 검색 RAG');
}
{
 const s=body(8,'계획과 자료가 공유하는 학습 맥락','Plan × Material / Data relationship','논문 3.1과 4장, 현재 plan-flow·gemini 코드에 근거한다. 진도표의 추출 단위와 주간 계획의 참조 필드가 있고, 공용 자료의 제목·요약과 현재 계획은 자료 AI 맥락에 함께 들어간다. 계획과 자료를 주차별로 직접 연결하거나 누적 자동 연결하는 기능은 현재 구현 완료로 제시하지 않는다. 낮은 이해도 항목은 복습 후보와 설정 간격을 거쳐 데이터 갱신 시 개인 Todo로 연결된다.',['src/lib/plan-flow.ts','src/lib/gemini.ts','src/lib/prototype-repository.ts']);
 const xs=[64,360,656,952];[['진도표·목차','계획 기준 자료'],['학습 단위','순서 · 제목 · 설명'],['주간 계획','학습 단위 참조'],['개인 Todo','수행 · 이해도 · 복습']].forEach(([a,b],i)=>{box(s,a,b,xs[i],217,264,128,i===3?C.soft:C.white);if(i<3)line(s,xs[i]+264,281,32,1,C.green);});
 box(s,'공용 학습 자료','제목·요약 정보',64,438,400,124);
 box(s,'Material AI context','자료 정보 + 그룹 목표 + 현재 주간 계획',640,438,576,124,C.soft);
 line(s,464,500,176,1,C.green);line(s,788,345,1,93,C.green);text(s,'현재 계획을 맥락으로 활용',814,371,402,30,20,C.muted);
 text(s,'향후 과제: 공용 자료 ↔ 주차별 계획의 명시적 연결',64,615,1152,30,23,C.muted);
}
{
 const s=body(9,'공동 계획과 개인 학습 상태의 분리','Shared × Personal learning','논문 3.1장: 공통 계획은 동일하되 완료 상태와 이해도는 구성원별로 독립 저장한다. 개인 Todo는 직접 추가하거나 복습 항목에서 연결한다. 낮은 이해도 → review_candidates → 설정 간격 경과 → 데이터 갱신 시 personal_plan_items 추가이다. 정시 스케줄러·푸시 알림 구현으로 표현하지 않는다. 두 캡처는 원본 PlanFlowScreen의 개인 Todo와 실제 복습 예정 항목 모달이다.',['src/lib/prototype-repository.ts','src/lib/plan-flow.ts','src/components/plan-screen.tsx','supabase/bootstrap.sql']);
 const xs=[64,464,864];[['Shared Plan','동일한 학습 항목 공유'],['Personal Todo','개인별 추가·수정·완료'],['Review','낮은 이해도 항목 재학습']].forEach(([a,b],i)=>{box(s,a,b,xs[i],207,352,114,i===1?C.soft:C.white);if(i<2)line(s,xs[i]+352,263,48,1,C.green);});
 text(s,'완료 상태·이해도는 사용자별로 저장',64,348,1152,39,28,C.frame,true);
 await image(s,'personal-items.png',64,413,530,188);await image(s,'review.png',700,399,516,218);
 demo(s,'복습 후보는 설정 간격 후 데이터 갱신 과정에서 Todo로 연결');
}
{
 const s=body(10,'StudyFlow 시스템 구조','System architecture','논문 2.2·3.1장의 UI–데이터–AI 계층과 코드의 대응이다. React/TypeScript UI, Next.js App Router/Route Handlers, Gemini, Supabase Auth/Database/Storage로 구성한다. 모든 데이터가 서버 API만 통과하는 구조는 아니며 일부 그룹·학습 데이터는 브라우저 Supabase SDK에서 직접 접근한다.',['src/app/layout.tsx','src/app/api/ai/chat/route.ts','src/lib/gemini.ts','src/lib/prototype-repository.ts','src/lib/supabase/browser.ts','supabase/bootstrap.sql']);
 box(s,'Client','React / TypeScript\n학습 UI · 사용자 상호작용',64,220,352,164,C.soft);box(s,'Next.js','App Router / Route Handler\nAI 요청 · 파일 처리',496,220,352,164);box(s,'Gemini API','진도표 이미지 분석\n계획 초안 · 자료 응답',928,220,288,164,C.soft);
 line(s,416,302,80,1,C.green);line(s,848,302,80,1,C.green);line(s,240,384,1,126,C.green);line(s,672,384,1,126,C.green);
 text(s,'브라우저 SDK',270,430,300,32,22,C.muted);text(s,'서버 SDK',704,430,300,32,22,C.muted);
 box(s,'Supabase','Auth: 인증   /   Database: 그룹·계획·학습 상태   /   Storage: 자료 파일',64,510,1152,112);
}
{
 const s=body(11,'AI 요청·응답과 데이터 저장','AI / Data flow','논문 3.1장의 AI 분리와 현재 provider/repository 저장 동작을 대응시킨다. 공통 요청은 입력 → 그룹 맥락 → /api/ai/chat → Gemini이고 scope로 분리한다. Plan AI 응답의 구조화된 초안은 plan-agent 대화 기록에 저장되며 미리보기에서 사용자 수정 후 적용 액션이 공동 계획을 저장한다. Material AI는 질문·응답 및 자료 출처 기록을 저장한다. 이해도·복습 생성은 AI 답변 자체가 아닌 학습 관리 로직이다. 실제 실행 성공률이나 DB 권한의 충분성을 평가한 결과는 아니다.',['src/components/prototype-provider.tsx','src/lib/prototype-repository.ts','src/app/api/ai/chat/route.ts','src/lib/plan-flow.ts','supabase/bootstrap.sql']);
 const xs=[64,360,656,952];[['사용자 입력','요청 · 질문 · 진도표'],['그룹 맥락','목표 · 계획 · 자료 정보'],['Route Handler','scope 구분 · Gemini 호출'],['Gemini','응답 / 구조화된 초안']].forEach(([a,b],i)=>{box(s,a,b,xs[i],217,264,120,i===3?C.soft:C.white);if(i<3)line(s,xs[i]+264,277,32,1,C.green);});
 text(s,'PLAN AI',64,390,220,32,22,C.green,true);box(s,'초안 대화 기록','미리보기에서 수정',300,368,380,112);line(s,680,425,96,1,C.green);box(s,'공동 계획 저장','사용자 적용 확인 후 DB 반영',776,368,440,112,C.soft);
 text(s,'MATERIAL AI',64,526,220,32,22,C.green,true);box(s,'자료 정보 기반 응답','제목·요약 맥락 활용',300,504,380,112);line(s,680,561,96,1,C.green);box(s,'대화·자료 출처 저장','질문과 응답 기록 유지',776,504,440,112,C.soft);
 text(s,'Supabase: 대화 scope를 분리하고, 확정된 학습 계획과 수행 상태를 관리',64,635,1152,24,18,C.muted);
}
{
 const s=body(12,'2인 팀의 역할과 통합 지점','Team roles / Collaboration','현재 Git 기록을 근거로 주요 작업 영역을 요약했으며 사용자가 Git 기준 A/B 표기를 확인했다. 팀원 A = Jisu47 기록, 팀원 B = kimhanbyeol04 기록. 배타적 담당이나 전체 작업량 비율을 주장하지 않는다. A: 303d04b 계획 초안 저장, 9a8a44c 초안 편집, b2abdb8 계획·복습, 6f53f78 Gemini 연결, 58c26ee Design Preview, 0e33feb AGENTS. B: 1cc53b8 Supabase Auth, 4e4a83e 그룹/계정, d54e84a 그룹 홈, 7da7d4b 자료 화면, 3c755c3 Storage 업로드, 8d3b7c2 업로드 fallback. Gemini/자료 AI 연결은 A 기록도 있어 B 단독 담당으로 분류하지 않는다. 기획·테스트를 두 사람이 공동 수행했다는 명시 증거가 없으므로 공동 실적으로 단정하지 않는다.',['AGENTS.md','src/components/plan-agent-screen.tsx','src/components/materials-screen.tsx','src/lib/gemini.ts','src/lib/server/material-upload.ts']);
 text(s,'팀원 A',64,208,540,45,33,C.frame,true);text(s,'계획·학습 흐름 / UI 기준',64,265,540,35,25,C.green,true);
 text(s,'Plan AI · 진도표 분석 · 초안 편집\n공동 계획 · 개인 Todo · 복습\nGemini 연동 · AI 응답 처리\nAGENTS.md · Design Preview',64,326,540,188,25);
 text(s,'팀원 B',704,208,512,45,33,C.frame,true);text(s,'인증·그룹 / 자료 화면·저장',704,265,512,35,25,C.green,true);
 text(s,'Supabase Auth · 계정 흐름\n그룹 생성·진입 · 그룹 홈\n자료 관리 화면 · 업로드\nSupabase Storage 저장·예외 처리',704,326,512,188,25);
 line(s,640,208,1,310);
 rect(s,64,549,1152,67,C.soft);text(s,'통합 지점',84,566,160,32,22,C.frame,true);text(s,'그룹 데이터 → Plan × Material → 개인 학습   ·   Git으로 기능 통합',258,566,938,32,23,C.ink,true);
 text(s,'Git 기록 기준의 주요 작업 영역 · 배타적 담당이나 기여 비율을 의미하지 않음',64,635,1152,24,17,C.muted);
}
{
 const s=body(13,'협업 과정의 UI 기준 정리','Design system / Development consistency','기능별 AI 개발에서 UI 해석 차이, 중복 구조 및 공유 파일 충돌을 줄이기 위한 개발 기준을 소개한다. Git에서 팀원 A의 AGENTS와 Design Preview 작업이 확인된다. AGENTS는 개발/협업 규칙이며 세부 디자인 규격 문서로 쓰지 않는다. Design Preview V2의 Foundations/Components와 Overview→Detail 탐색은 검토용 결과물이다. 서비스 전체 공통 컴포넌트 적용이나 UI 통일 완료로 과장하지 않는다. 두 이미지는 실제 /design-preview-v2 화면이며 sample 서비스 데이터와 무관하다.',['AGENTS.md','src/components/design-preview-v2/']);
 await image(s,'design-overview.png',64,211,650,408,'v3');
 text(s,'Overview → Detail',774,205,442,40,28,C.frame,true);await image(s,'design-detail-crop.png',774,254,442,133,'v3');
 text(s,'기능별 AI 개발의 UI 해석 차이\n중복 구조·공유 파일 충돌 예방',774,409,442,65,22,C.ink,true);
 text(s,'AGENTS.md: 재사용·공유 파일 규칙\nPreview: Foundations / Components\n팀원이 같은 기준으로 UI 검토',774,497,442,105,23,C.frame);
 text(s,'팀원 A의 UI 기준 정리 → 기능별 구현의 일관성 검토 · 서비스 전체 적용은 진행 과제',64,635,1152,24,18,C.muted);
}
{
 const s=body(14,'구현 결과와 현재 검증 범위','Results / Current status','논문 3.2 표2의 6개 항목은 모두 미평가이다. 코드 구현 및 예시 UI 확인과 연구의 기능 평가를 분리한다. 현재 저장 구조·AI 호출·학습 연계 코드가 존재하지만 실제 그룹 시나리오의 전체 성공, 응답 품질, 학습 효과, 권한/RLS 안전성을 입증하지 않는다. 발표 캡처는 독립 Preview에서 실제 컴포넌트에 mock 데이터를 주입한 결과다.',['src/components/presentation-preview/','src/lib/gemini.ts','src/lib/prototype-repository.ts','supabase/bootstrap.sql']);
 const xs=[64,464,864];const data=[['구현한 구조','Plan AI · Material AI 연동\n공동 계획·개인 Todo·복습\nSupabase 저장·Design Preview'],['현재 확인 범위','소스 코드와 저장 구조 확인\n예시 데이터로 원본 UI 확인\n실제 AI·DB 동작 평가와 구분'],['추가 평가 필요','논문 주요 기능 6개: 미평가\nAI 응답 품질·실제 그룹 사용\n사용성·학습 지원 효과']];
 data.forEach(([a,b],i)=>{text(s,a,xs[i],222,352,45,31,C.frame,true);line(s,xs[i],287,352);text(s,b,xs[i],326,352,174,24);});
 rect(s,64,549,1152,70,C.soft);text(s,'통합 학습 흐름을 구현하는 구조 확보 · 기능 검증과 효과 평가는 후속 단계',84,569,1112,40,27,C.frame,true);
}
{
 const s=body(15,'한계와 향후 과제','Limitation / Future work / Conclusion','논문 4장의 향후 연구: 주차별 계획과 공용 자료의 명시적 연결, 원문 검색 기반 RAG 도입 검토, 기능별 사용자 시나리오 검증, 사용성과 학습 지원 효과 평가이다. 인증/권한/RLS 검증은 코드상 저장 구조를 실제 서비스로 운영하기 위한 추가 검증 과제로 포함했다. 향후 효과를 현재 결과로 표현하지 않는다.');
 const items=['주차별 계획 ↔ 공용 자료 연결 고도화','원문 검색 RAG · 문서 추출 품질 개선','AI 응답 품질 · 시나리오 · 사용자 평가','인증 · 권한 · RLS 검증'];
 items.forEach((t,i)=>{text(s,String(i+1).padStart(2,'0'),64,207+i*48,65,34,23,C.green,true);text(s,t,153,207+i*48,1063,36,26,C.ink);});
 rect(s,0,443,1280,192,C.frame,'none');text(s,'함께 쓰는 자료가\n함께 실행하는 학습 계획으로 이어지도록',64,474,1152,126,40,C.white,true);
}

const final=await p.inspect({kind:'textbox',maxChars:1000000});await fs.writeFile(path.join(build,'editable-content.ndjson'),final.ndjson);
if(final.ndjson.includes('SCREENSHOT PLACEHOLDER'))throw new Error('Screenshot placeholder remains');
await fs.writeFile(path.join(build,'sources-and-changes.json'),JSON.stringify({source,sourceHash,paper,slideCount:15,teamRolesBasis:'Git author history; A/B labels confirmed by user',privacy:'Neutral demo names and synthetic IDs; email removed; greeting excluded from group crop',productionFilesModified:false,modifiedPreviewFiles:['src/components/presentation-preview/demo-data.ts','src/components/presentation-preview/demo-adapter.tsx'],replacedV4Slides:{12:'Results / Current Status; removed repeated demo montage',14:'Limitation and conclusion; removed repeated group screenshot'},researchImplementationSlides:[6,7,8,9,10,11],designSystemSlide:13,paperEvaluation:'All six functional scenarios remain unevaluated'},null,2));
for(const[i,s]of p.slides.items.entries()){await fs.writeFile(path.join(build,'previews',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await(await p.export({slide:s,format:'png',scale:1})).arrayBuffer()));console.log('rendered',i+1);}
const candidate=path.join(build,'draft-v5.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);
const skill='C:/Users/김지윤/.codex/plugins/cache/openai-primary-runtime/presentations/26.1110.11613/skills/presentations';
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:path.join(out,'StudyFlow_Capstone_Draft_v5.pptx'),pythonExecutable:'C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:15,requiredNativeTableOwnerSlides:[],fontPolicy:{basis:'reference',families:[FONT],referencePath:source,referenceSha256:sourceHash},verifyArtifactToolImport:true,receiptPath:path.join(build,'validation-v5-final-reviewed.json')});
if(hash(await fs.readFile(source))!==sourceHash)throw new Error('V4 changed');console.log('DONE V5; V4 preserved');
