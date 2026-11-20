import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PresentationFile,FileBlob} from 'file:///C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const root='C:/GitHub/capstone/artifacts/capstone-presentation';
const build=path.join(root,'build/v2'),out=path.join(root,'output');
process.env.RUNTIME_NODE_MODULES='C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const source=path.join(out,'StudyFlow_Capstone_Draft_v1.pptx');
const sourceHash=crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex');
const p=await PresentationFile.importPptx(await FileBlob.load(source));
const snapshot=await p.inspect({kind:'slide,textbox,shape,image',maxChars:1000000});
const entries=snapshot.ndjson.trim().split('\n').map(x=>JSON.parse(x));
await fs.mkdir(path.join(build,'previews'),{recursive:true});
const C={frame:'#205D40',green:'#27834F',soft:'#EEF7F1',line:'#E5E7E6',ink:'#242B27',muted:'#707773',white:'#FFFFFF',stage:'#FAFCFB'};
const FONT='Malgun Gothic'; const paper='docs/(초안) StudyFlow 두단_논문_양식.hwp'; const records=[];
function rect(s,x,y,w,h,fill=C.white,stroke='none',sw=0){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:sw,style:'solid'}});}
function txt(s,text,x,y,w,h,size=26,color=C.ink,bold=false){const a=rect(s,x,y,w,h,'none');a.text=text;a.text.style={typeface:FONT,fontSize:size,color,bold,insets:0,verticalAlignment:'top',wrap:'square'};return a;}
function line(s,x,y,w,c=C.line){rect(s,x,y,w,1,c);}
function slide(n,title,label,note,refs=[],preserve=false){const s=p.slides.items[n-1];
 if(!preserve){const ids=entries.filter(r=>r.slideIndex===n-1&&/^(sh|im)\//.test(r.id)&&r.position?.top>=190&&r.position?.top<662).map(r=>r.id);if(ids.length)p.delete(ids);}
 const titleRec=entries.find(r=>r.slideIndex===n-1&&r.position?.top===88&&r.kind==='textbox');
 const labelRec=entries.find(r=>r.slideIndex===n-1&&r.position?.top===40&&r.kind==='textbox');
 if(titleRec)p.resolve(titleRec.id).text=title;if(labelRec)p.resolve(labelRec.id).text=label.toUpperCase();
 const sources=[paper,...refs];s.speakerNotes.text=note+'\n\n출처: '+sources.join('\nC:/GitHub/capstone/');records.push({slide:n,title,label,sources,note});return s;}
function node(s,label,desc,x,y,w=250,h=120,fill=C.white){rect(s,x,y,w,h,fill,C.line,1);txt(s,label,x+20,y+20,w-40,42,25,C.frame,true);if(desc)txt(s,desc,x+20,y+66,w-40,h-74,21,C.muted);}
function flow(s,steps,y=240,h=130){const w=(1152-32*(steps.length-1))/steps.length;steps.forEach((a,i)=>{node(s,a[0],a[1],64+i*(w+32),y,w,h,i===steps.length-1?C.soft:C.white);if(i<steps.length-1)rect(s,64+i*(w+32)+w,y+h/2,32,2,C.green);});}
function placeholder(s,title,route){const x=704,y=218,w=512,h=362;rect(s,x,y,w,h,C.stage,C.line,1);txt(s,'SCREENSHOT PLACEHOLDER',x+26,y+78,w-52,40,21,C.muted,true);txt(s,title,x+26,y+140,w-52,76,28,C.frame,true);txt(s,route,x+26,y+235,w-52,38,18,C.muted);txt(s,'실제 로그인 화면으로 교체',x+26,y+h-48,w-52,30,18,C.muted);}
function detail(s,n,title,body,y,w=586){txt(s,n,64,y,46,36,22,C.green,true);txt(s,title,120,y,w-56,42,28,C.frame,true);txt(s,body,120,y+47,w-56,74,24,C.muted);}

slide(1,'STUDY FLOW','Cover','StudyFlow는 그룹의 공동 학습 계획과 자료 활용, 개인별 학습 수행을 연계하는 웹서비스입니다. 논문은 설계 및 구현 내용을 중심으로 서술하며 실행 검증과 AI 응답 품질 평가는 후속 과제로 남겨 둡니다. 팀 정보 입력 영역은 기존 표지 형식을 유지합니다.',[],true);
{
 const s=slide(2,'그룹 스터디에 흩어진 학습 정보','Background / Problem','논문 1절은 자료 공유·일정 관리·진도 확인이 서로 다른 도구로 분산될 수 있다는 문제를 제시합니다. 팀장은 학습 속도와 이해도 차이를 고려해 계획을 조정해야 하므로 운영 부담이 발생합니다. 특정 서비스 대비 성능 우위나 사용자 조사 결과를 뜻하지 않습니다.');
 txt(s,'같은 목표로 공부해도,\n계획과 자료·진도는 흩어져 있다',64,216,1120,112,41,C.ink,true);line(s,64,372,1152);
 txt(s,'정보의 분산',64,416,340,46,30,C.frame,true);txt(s,'자료 공유와 일정·진도 확인이\n서로 다른 도구에 분산',64,480,340,110,25,C.muted);
 txt(s,'개인별 차이',462,416,340,46,30,C.frame,true);txt(s,'같은 공동 계획에서도\n학습 속도와 이해도는 다름',462,480,340,110,25,C.muted);
 txt(s,'운영 부담',860,416,356,46,30,C.frame,true);txt(s,'구성원의 진도를 고려한\n계획 수립과 지속적인 조정',860,480,356,110,25,C.muted);
}
{
 const s=slide(3,'계획과 자료를 동일한 학습 맥락으로','Research goal / Proposed solution','논문 요약과 1절의 목적은 계획 수립, 자료 공유, 구성원별 학습 진행을 하나의 서비스에서 지원하는 것입니다. 2.1절의 선행연구 비교는 AI의 역할 구분과 공동·개인 학습의 연계에 초점을 둡니다. 선행연구보다 효과가 우수하다는 실험 결과는 제시하지 않습니다.');
 txt(s,'공동 계획 수립부터 개인의 학습 수행까지\n하나의 서비스에서 지원한다',64,215,1152,116,40,C.ink,true);line(s,64,376,1152);
 txt(s,'계획 AI',64,420,340,44,30,C.frame,true);txt(s,'진도표를 분석하고\n공동 계획 초안 생성·조정',64,481,340,96,25,C.muted);
 txt(s,'자료 AI',463,420,340,44,30,C.frame,true);txt(s,'공유 자료 정보를 활용해\n학습 질문에 응답',463,481,340,96,25,C.muted);
 txt(s,'학습 진행 관리',862,420,354,44,30,C.frame,true);txt(s,'공동 계획과 개인 Todo 분리\n이해도에 따른 복습 연계',862,481,354,96,25,C.muted);
}
{
 const s=slide(4,'사용자의 실제 학습 흐름','Overall service flow','논문 3.1절과 현재 화면 구조를 연결한 사용자 흐름입니다. 사용자는 로그인 후 그룹을 생성하거나 참여 코드로 입장합니다. 팀장은 진도표 이미지를 등록하고 AI와 대화해 공동 계획 초안을 편집·적용합니다. 구성원은 자료를 업로드하고 질문하며 공동 계획의 완료 여부를 개별 기록합니다. 개인 Todo는 별도로 관리합니다. 낮은 이해도는 복습 후보를 만들고, 설정 시점 경과 후 데이터 갱신 과정에서 개인 Todo로 추가됩니다. 자료 업로드가 반드시 계획 생성 이후에만 가능하다는 의미는 아닙니다.',['src/components/auth-provider.tsx','src/components/study-create-screen.tsx','src/components/plan-screen.tsx','src/components/materials-screen.tsx','src/lib/prototype-repository.ts']);
 flow(s,[['로그인·그룹 참여','그룹 생성 / 참여 코드'],['공동 계획 준비','진도표 / AI 초안 수정'],['학습 수행','공동 계획 / 개인 Todo']],219,143);
 node(s,'자료 활용','업로드한 자료 정보로 AI 질문',64,432,344,145);
 node(s,'완료·이해도 기록','공동 계획의 상태를 구성원별 저장',472,432,344,145);
 node(s,'복습 Todo','낮은 이해도 항목을 개인 과제로',880,432,336,145,C.soft);
 rect(s,408,502,64,2,C.green);rect(s,816,502,64,2,C.green);
 txt(s,'자료 활용은 학습 과정에서 병행 · 복습 Todo 반영은 데이터 갱신 시 수행',64,611,1152,28,19,C.muted);
}
{
 const s=slide(5,'계획 AI: 분석·생성·수정·적용','Plan AI / Input to shared plan','논문 2.2절과 3절은 Gemini 이미지 입력을 이용한 진도표 분석과 주간 계획 생성, 사용자 편집 후 공동 계획 반영을 설명합니다. /api/plan-reference/analyze는 이미지에서 summary와 units를 반환합니다. plan-flow는 학습 단위와 로드맵을 구성하고, 계획 채팅은 구조화된 weeklyPlan 초안을 반환합니다. PlanAgentScreen의 미리보기에서 목표와 항목을 수정한 뒤 applyPrototypePlanAgentDraft로 저장합니다. AI 응답과 실제 계획 적용은 구분됩니다.',['src/app/api/plan-reference/analyze/route.ts','src/lib/gemini.ts','src/lib/plan-flow.ts','src/components/plan-agent-screen.tsx','src/lib/prototype-repository.ts']);
 detail(s,'01','입력과 이미지 분석','그룹 목표 + 진도표 이미지\nGemini가 학습 단위를 추출',216);
 detail(s,'02','주간 계획 초안 생성','학습 단위·기존 계획·질문을 반영\n요일 / 할 일 / 소요 시간 제안',352);
 detail(s,'03','사용자 편집 후 적용','미리보기에서 수정·확정\n그룹 공동 계획으로 저장',488);
 placeholder(s,'계획 에이전트\n초안 미리보기','/group/[id]/plan/agent');
}
{
 const s=slide(6,'자료 AI: 공유 자료 정보를 활용한 응답','Material AI / Current implementation','논문 3.1절은 자료의 제목과 요약 정보 등을 Gemini에 전달하는 방식으로 자료 AI를 설명합니다. 업로드 Route는 토큰·그룹 멤버십을 확인하고 Storage에 원본을 저장합니다. 현재 material-upload의 텍스트 추출은 단순 추출이며 첫 문단 일부를 요약 정보로 저장합니다. Gemini에는 최대 5개 자료의 제목·축약된 요약과 주간 계획이 전달됩니다. 현재 구조는 원본 문서를 검색하는 RAG 완성본이 아닙니다. 논문 4절도 RAG 도입 검토를 향후 과제로 명시합니다.',['src/app/api/groups/[id]/materials/route.ts','src/lib/server/material-upload.ts','src/lib/gemini.ts','src/components/materials-screen.tsx']);
 detail(s,'01','업로드와 저장','학습 자료 원본은 Storage에 저장\n제목·요약 등은 DB에서 관리',216);
 detail(s,'02','질문 맥락 구성','자료 제목·요약 + 그룹 목표\n현재 주간 계획을 함께 전달',352);
 detail(s,'03','Gemini 응답 표시','자료 정보를 참고한 대화형 응답\n원문 검색 기반 RAG는 향후 과제',488);
 placeholder(s,'자료 목록\nAI 질의응답','/group/[id]/materials');
}
{
 const s=slide(7,'계획과 자료의 현재 연결 범위','Plan × Material / Data relationship','논문은 두 AI가 그룹 데이터를 공유하지만 입력 정보와 대화 목적을 분리한다고 설명합니다. 현재 코드의 계획 기준 자료는 plan_reference_uploads이며, 여기서 추출한 plan_reference_units의 순서를 로드맵 단위 구간과 plan_items.reference_unit_sequence에서 참조합니다. 공용 자료 materials는 별도 구조이며 자료 AI는 요약과 현재 계획을 같이 전달받습니다. 논문 4절은 학습 자료와 주차별 계획의 연계를 향후 구현 과제로 명시합니다. 계획 기준 자료와 공용 학습 자료를 같은 데이터로 혼동하지 않도록 설명합니다.',['src/lib/mock-data.ts','src/lib/plan-flow.ts','src/lib/ai-chat.ts','src/lib/gemini.ts','supabase/bootstrap.sql']);
 txt(s,'현재 구현: 계획 기준 자료의 학습 단위 참조',64,210,1152,40,27,C.frame,true);
 flow(s,[['진도표·목차','계획 기준 자료'],['학습 단위','순서 / 제목 / 설명'],['주차·주간 계획','단위 범위·참조']],280,123);
 line(s,64,444,1152);txt(s,'공용 학습 자료',64,477,370,42,28,C.frame,true);txt(s,'자료 요약과 현재 주간 계획을\n자료 AI의 공통 맥락으로 제공',463,477,753,92,27,C.ink);
 txt(s,'향후 구현   공용 자료와 주차별 계획의 명시적 연결',64,609,1152,30,21,C.muted);
}
{
 slide(8,'논문 설계와 현재 시스템 구조','System design / Architecture','논문 그림 1과 3.1절의 구조는 현재 코드와 대체로 대응합니다. UI는 Next.js·React, AI 요청은 Next.js 서버 API와 Gemini, 인증·DB·Storage는 Supabase가 담당합니다. 그룹·계획 데이터 일부는 브라우저 Supabase 클라이언트로 직접 읽고 저장합니다. 모든 데이터가 서버 API만을 거치는 구조로 설명하지 않습니다. 기존 V1의 편집 가능한 구조도를 유지합니다.',['package.json','src/components/prototype-provider.tsx','src/components/auth-provider.tsx','src/lib/prototype-repository.ts','src/lib/supabase/browser.ts','src/lib/supabase/server.ts'],true);
}
{
 const s=slide(9,'공동 계획과 개인 Todo·복습의 구현','Implementation / Shared and personal learning','논문 요약 및 3.1~3.2절의 주요 구현 내용입니다. 공동 계획 plan_items와 사용자별 plan_item_completions를 분리하며, plan_item_feedbacks에 이해도를 저장합니다. 낮은 이해도는 review_candidates를 생성합니다. review interval 3·7·14·28일 중 설정값을 기준으로, 데이터 갱신 시 만기가 된 후보를 personal_plan_items에 추가합니다. 백그라운드 알림 또는 정시 실행 스케줄러를 구현했다고 표현하지 않습니다. 화면은 /group/[id]/plan의 PlanScreen이 공동 계획, 개인 할 일, 복습 예정 항목을 담당합니다. UI 일관성 개선은 사용자 요청에 따른 보조 개발 과정으로만 짧게 포함합니다.',['src/components/plan-screen.tsx','src/lib/prototype-repository.ts','src/lib/plan-flow.ts','supabase/bootstrap.sql','AGENTS.md','src/components/design-preview-v2/design-preview-v2-screen.tsx']);
 node(s,'공동 계획','구성원에게 같은 학습 항목 공유',64,216,510,126);
 node(s,'개인 Todo','사용자별 추가·수정·완료 관리',704,216,512,126);
 txt(s,'구성원별 완료 상태와 이해도는 독립 저장',64,366,1152,38,27,C.frame,true);
 flow(s,[['낮은 이해도','복습 후보 저장'],['복습 시점 경과','설정 간격으로 판정'],['개인 Todo 추가','학습 데이터 갱신 시']],429,116);
 line(s,64,578,1152);txt(s,'UI 일관성',64,601,180,36,22,C.frame,true);txt(s,'AGENTS.md로 규칙 공유 · Design Preview로 기준 검토\n공통 UI의 서비스 적용은 후속 작업',264,592,952,62,20,C.muted);
}
{
 const s=slide(10,'AI 요청과 데이터 반영 흐름','AI / Data flow','논문 3.1절의 역할 구분을 현재 구현 단계로 풀어 쓴 도식입니다. PrototypeProvider가 그룹 데이터·질문·scope를 보내고 Route Handler가 요청 형식을 검사합니다. gemini.ts가 목적별 맥락과 대화 이력을 구성해 Gemini에 요청합니다. 계획 scope는 텍스트와 구조화된 초안을 분리·정규화하고, 사용자의 편집·확정 이후 DB에 반영합니다. 자료 scope는 자료 요약·계획 맥락으로 텍스트 응답을 생성합니다. chat_messages.scope로 두 대화 범위를 구분합니다. 모델 재시도·fallback 및 응답 중단 상태 처리도 코드에 있으나 품질 평가 결과는 없습니다.',['src/components/prototype-provider.tsx','src/app/api/ai/chat/route.ts','src/lib/gemini.ts','src/lib/ai-chat.ts','src/lib/plan-flow.ts','src/lib/prototype-repository.ts']);
 flow(s,[['사용자·그룹 맥락','목표 / 질문 / 대화 범위'],['서버 API','형식 검증 / 맥락 구성'],['Gemini','목적별 응답 생성'],['응답 처리','텍스트 / 계획 초안']],224,143);
 txt(s,'계획 AI',64,425,260,46,30,C.frame,true);txt(s,'구조화된 초안 검토·편집 후\n사용자가 적용하면 공동 계획 저장',384,425,832,95,28,C.ink);
 line(s,64,543,1152);txt(s,'자료 AI',64,578,260,46,30,C.frame,true);txt(s,'자료 정보에 기반한 응답과 대화 기록',384,578,832,48,28,C.ink);
}
{
 const s=slide(11,'현재 구현과 기능 검증 상태','Result / Current status','논문 표 2의 검증 항목 6개와 미평가 상태를 그대로 보존하고, 현재 코드를 확인한 구현 내용을 옆에 대응시켰습니다. 코드상 구현 확인은 테스트 통과를 의미하지 않습니다. 논문은 사전 정의한 사용자 시나리오와 예상 결과에 따른 기능 평가를 계획하고 있으며 아직 실행 검증과 AI 응답 품질 평가를 완료하지 않았다고 명시합니다. 따라서 성공률·효과성·성능 개선 수치는 제시하지 않습니다.',['src/components/plan-agent-screen.tsx','src/lib/gemini.ts','src/lib/prototype-repository.ts','src/components/materials-screen.tsx']);
 const vals=[['논문 검증 항목','현재 코드에서 확인한 내용','실행 검증'],['학습 계획 생성','진도표 분석·AI 주간 초안','미평가'],['계획 적용','미리보기 수정·공동 계획 저장','미평가'],['공동 학습 관리','구성원별 완료 상태 분리','미평가'],['개인 Todo 관리','개인 항목 추가·수정·완료','미평가'],['복습 기능','낮은 이해도 후보·개인 Todo 연계','미평가'],['자료 AI','자료 요약 맥락 기반 응답','미평가']];
 const t=s.tables.add({rows:7,columns:3,left:64,top:211,width:1152,height:350,columnWidths:[260,682,210],values:vals});
 t.borders.assign({style:'solid',fill:C.line,width:1});
 for(let r=0;r<7;r++)for(let c=0;c<3;c++){const cell=t.getCell(r,c);cell.fill=r===0?C.frame:C.white;cell.text.style={typeface:FONT,fontSize:r===0?22:23,color:r===0?C.white:(c===2?C.muted:C.ink),bold:r===0,insets:{left:16,right:12,top:10,bottom:8},verticalAlignment:'middle'};}
 txt(s,'다음 검증   사용자 시나리오별 기능 동작과 AI 응답 품질',64,601,1152,36,23,C.frame,true);
}
{
 const s=slide(12,'한계와 향후 연구 과제','Limitation / Future work','논문 4절은 주차별 자료 연결, 원본 문서 검색 기반 RAG 도입 검토, 주요 사용자 시나리오 기능 검증, 사용자 평가를 향후 연구로 제시합니다. 현재 코드 점검에서 확인한 후속 과제로 AI Route의 인증·멤버십 검사와 DB RLS 제한도 보완 항목에 포함했습니다. bootstrap.sql의 다수 정책이 anon/authenticated에 true를 허용하므로 운영 권한 보장이 끝났다고 표현하지 않습니다. UI 기준 확정은 9번 슬라이드에서 보조적으로만 설명합니다.',['src/lib/server/material-upload.ts','src/app/api/ai/chat/route.ts','supabase/bootstrap.sql']);
 txt(s,'논문의 후속 연구',64,214,1152,42,30,C.frame,true);
 txt(s,'주차별 계획과 학습 자료 연결\n원본 문서 검색을 활용하는 RAG 검토',64,280,545,112,29,C.ink);
 txt(s,'시나리오별 기능·AI 품질 검증\n사용성과 학습 지원 효과 평가',704,280,512,112,29,C.ink);
 line(s,64,451,1152);txt(s,'구현 보완',64,494,340,42,30,C.frame,true);txt(s,'문서 추출 품질 개선\n인증·그룹 권한·RLS 검증 강화',463,494,753,102,28,C.ink);
}
{
 const s=slide(13,'공동 계획과 개인 학습을 잇는 StudyFlow','Conclusion','논문 결론은 공동 계획·개인 과제·완료 상태·복습을 연결하는 구조와, 계획 생성 및 자료 질의응답을 하나의 서비스에서 지원하는 데 의미를 둡니다. 현재는 설계와 구현을 마련한 단계이며 학습 효과나 사용성 향상을 입증한 단계가 아닙니다. 향후 시나리오 검증과 사용자 평가를 통해 이 연결 구조의 유용성을 확인할 예정입니다.');
 txt(s,'계획 수립과 자료 활용을 지원하는 AI\n공동 계획을 개인의 수행·복습으로 연결하는 구조',64,223,1152,128,36,C.ink,true);
 txt(s,'현재는 설계·구현 단계 · 다음은 기능 검증과 사용자 평가',64,383,1152,42,24,C.muted);
 rect(s,64,468,1152,158,C.frame);txt(s,'함께 쓰는 자료가\n함께 실행하는 학습 계획으로 이어지도록',96,492,1076,119,37,C.white,true);
}

await fs.writeFile(path.join(build,'research-v2.json'),JSON.stringify({paper,sourceHash,slides:records,sourceCodeModified:false,design:'V1의 크기·마스터·테마·표지·본문 chrome 및 아키텍처 재사용',screenshots:'인증 세션이 없어 Plan/Materials placeholder 유지',removedV1Slides:[9,10,11],designSystemPlacement:'9번 슬라이드 하단 UI 일관성 보조 영역',evaluation:'논문 표 2 전 항목 미평가'},null,2));
await fs.writeFile(path.join(root,'V2_발표자료_안내.txt'),[
'StudyFlow 캡스톤 발표 V2',
'기준 논문: '+paper,
'논문 구성: 문제 정의 / 두 AI 역할 분리 / 시스템 설계 / 공동·개인 학습 / 복습 연계 / 구현 및 미평가 상태 / 향후 연구',
'V1의 9~11번 개발 과정·디자인 시스템·Preview 슬라이드는 독립 구성에서 제외. 9번 하단 UI 일관성 영역으로 축소.',
'5번 Plan AI와 6번 Material AI는 로그인된 실제 화면으로 교체할 수 있도록 placeholder 유지.',
'논문 표 2의 6개 검증 항목과 미평가 상태를 11번에 유지. 코드 존재와 실행 검증은 별도로 설명.',
'원본 문서 검색 RAG 및 공용 자료-주차별 계획 연결은 향후 과제로 분류.',
'복습 Todo는 만기 경과 후 데이터 갱신 시 반영. 정시 스케줄러·푸시 알림 완료로 표현하지 않음.',
'팀 정보는 기존 표지의 입력 영역 유지.',
'프로젝트 소스와 V1 원본은 보존. 발표 산출물만 artifacts/capstone-presentation 안에 작성.',
'파일 구조·레이아웃·폰트·재가져오기 검사 및 전 슬라이드 렌더링 검토. 실제 PowerPoint 실행 검사는 수행하지 않음.',
'소스 변경이 없어 pnpm lint/build는 실행하지 않음.',
'',...records.map(x=>`${x.slide}. ${x.title}`)
].join('\r\n'));
for(const [i,s]of p.slides.items.entries()){await fs.writeFile(path.join(build,'previews',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await(await p.export({slide:s,format:'png',scale:1})).arrayBuffer()));console.log('rendered',i+1);}
const candidate=path.join(build,'draft-v2.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);
const skill='C:/Users/김지윤/.codex/plugins/cache/openai-primary-runtime/presentations/26.1110.11613/skills/presentations';
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:path.join(out,'StudyFlow_Capstone_Draft_v2.pptx'),pythonExecutable:'C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit','--require-native-table-slide','11'],explicitTotalSlideCount:13,requiredNativeTableOwnerSlides:[11],fontPolicy:{basis:'reference',families:[FONT],referencePath:source,referenceSha256:sourceHash},verifyArtifactToolImport:true,receiptPath:path.join(build,'validation-v2-final.json')});
if(crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex')!==sourceHash)throw new Error('V1 changed');
console.log('DONE V2; V1 preserved');

