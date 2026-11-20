import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Presentation,PresentationFile} from 'file:///C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';

const root='C:/GitHub/capstone/artifacts/capstone-presentation';
process.env.RUNTIME_NODE_MODULES='C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const out=path.join(root,'output'); const build=path.join(root,'build');
await fs.mkdir(out,{recursive:true}); await fs.mkdir(path.join(build,'previews'),{recursive:true});
const C={frame:'#205D40',green:'#27834F',soft:'#EEF7F1',line:'#E5E7E6',ink:'#242B27',muted:'#707773',white:'#FFFFFF',stage:'#FAFCFB'};
const FONT='Malgun Gothic';
const p=Presentation.create({slideSize:{width:1280,height:720}});
p.theme.defaultFont=FONT;
let ix=0; const records=[];
function shape(s,x,y,w,h,fill=C.white,stroke='none',sw=0){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:sw,style:'solid'}});}
function txt(s,text,x,y,w,h,size=26,color=C.ink,bold=false){const a=shape(s,x,y,w,h,'none');a.text=text;a.text.style={typeface:FONT,fontSize:size,color,bold,insets:0,verticalAlignment:'top',wrap:'square'};return a;}
function line(s,x,y,w,color=C.line){shape(s,x,y,w,1,color);}
function base(title,label,notes,sources){ix++;const s=p.slides.add();s.background.fill=C.white;shape(s,0,0,1280,12,C.frame);txt(s,label.toUpperCase(),64,40,1130,24,14,C.green,true);txt(s,title,64,88,1152,78,44,C.ink,true);line(s,64,662,1152);txt(s,'STUDY FLOW',64,678,500,20,12,C.muted,true);txt(s,String(ix).padStart(2,'0'),1160,674,56,28,18,C.frame,true);s.speakerNotes.text=notes+'\n\n근거 파일 (프로젝트 루트 C:/GitHub/capstone):\n'+sources.join('\n');records.push({slide:ix,title,label,sources,notes});return s;}
function block(s,label,body,x,y,w=340){txt(s,label,x,y,w,50,30,C.frame,true);txt(s,body,x,y+66,w,130,25,C.muted);}
function node(s,label,desc,x,y,w=248,h=120,fill=C.white){shape(s,x,y,w,h,fill,C.line,1);txt(s,label,x+20,y+20,w-40,38,25,C.frame,true);if(desc)txt(s,desc,x+20,y+65,w-40,h-70,20,C.muted);}
function flow(s,steps,y=280){const w=(1152-(steps.length-1)*32)/steps.length;steps.forEach((step,i)=>{node(s,step[0],step[1],64+i*(w+32),y,w,154,i===steps.length-1?C.soft:C.white);if(i<steps.length-1)shape(s,64+i*(w+32)+w,y+76,32,2,C.green);});}
async function image(s,name,x,y,w,h){const bytes=await fs.readFile(path.join(root,'assets',name));s.images.add({blob:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),contentType:'image/png',alt:name,fit:'contain',position:{left:x,top:y,width:w,height:h}});}
function placeholder(s,title,route,x=640,y=216,w=576,h=372){shape(s,x,y,w,h,C.stage,C.line,1);txt(s,'SCREENSHOT PLACEHOLDER',x+30,y+95,w-60,38,22,C.muted,true);txt(s,title,x+30,y+153,w-60,52,27,C.frame,true);txt(s,route,x+30,y+218,w-60,44,18,C.muted);txt(s,'로그인된 실제 화면으로 교체',x+30,y+h-52,w-60,30,18,C.muted);}

// 01 Cover
{
ix++;const s=p.slides.add();s.background.fill=C.frame;
txt(s,'CAPSTONE DESIGN',72,62,1000,30,18,C.white,true);
txt(s,'STUDY FLOW',68,210,1140,120,88,C.white,true);
txt(s,'학습 계획과 자료를 연결하는\nAI 기반 스터디 지원 서비스',72,355,1100,110,36,C.white);
shape(s,72,570,1136,1,'#FFFFFF');txt(s,'팀명 [입력]     팀원 [입력]     소속 [입력]',72,598,1100,38,22,C.white);
s.speakerNotes.text='공유 학습 자료와 학습 계획을 같은 스터디 맥락에서 다루는 프로젝트입니다. 현재 구현과 개발 과정에서 마련한 공통 기준을 소개합니다. 팀명·팀원·소속은 확인되지 않아 입력 영역으로 남겨 두었습니다.\n근거: docs/midterm-checkpoint-report.md, src/lib/ai-chat.ts, src/lib/plan-flow.ts';records.push({slide:1,title:'STUDY FLOW',sources:['docs/midterm-checkpoint-report.md','src/lib/ai-chat.ts','src/lib/plan-flow.ts']});
}
// 02 Background
{
const s=base('학습 계획과 자료가 분리된 학습 과정','Project background','기획 문서는 공용 자료가 늘어날수록 무엇을 언제 공부할지 정리하기 어렵고, 리더가 계획과 진도를 수동으로 관리해야 한다는 문제의식을 제시합니다. 이 슬라이드는 기획 배경이며 사용자 조사로 입증한 시장 성과를 뜻하지 않습니다.',['docs/midterm-checkpoint-report.md']);
txt(s,'자료를 공유한 다음,\n실제 학습은 어떻게 이어질까?',64,218,610,150,43,C.ink,true);
block(s,'공유 자료','자료는 쌓이지만\n학습 범위와 우선순위는 별도 정리',738,216,460);
line(s,738,420,460);block(s,'공동 계획','일정과 팀원별 완료 상황을\n함께 관리해야 하는 운영 부담',738,451,460);
txt(s,'기획 문서에서 정의한 문제의식',64,580,600,28,18,C.muted);
}
// 03 Goal
{
const s=base('계획과 자료를 같은 학습 맥락으로','Project goal','계획 AI와 자료 AI는 같은 그룹 목표, 자료 요약, 주간 계획을 맥락으로 활용합니다. 계획 생성 자체와 자료 질의응답은 별도 scope이며, 모든 자료를 자동으로 주차에 매칭하는 기능이 완성됐다는 의미는 아닙니다.',['src/lib/ai-chat.ts','src/components/prototype-provider.tsx','src/lib/gemini.ts']);
txt(s,'무엇을 공부할지 정하고,\n필요한 자료를 활용하며 진행을 기록한다',64,207,1130,110,40,C.ink,true);
line(s,64,356,1152);
block(s,'계획 AI','진도 단위를 바탕으로\n주간 할 일을 제안',64,406,340);
block(s,'자료 AI','공유 자료 요약을 바탕으로\n질문에 응답',463,406,340);
block(s,'학습 진행','공동 계획과 개인 할 일,\n완료·복습 흐름 관리',862,406,340);
}
// 04 Overview
{
const s=base('서비스 전체 흐름','Service overview','공통 진입점은 로그인과 그룹 생성·참여입니다. 계획 경로는 진도표·목차 업로드에서 학습 단위·주간 계획으로 이어집니다. 자료 경로는 공용 자료 업로드와 AI 질의응답입니다. 계획 항목의 완료·이해도 피드백 및 개인 복습 후보 관리 코드가 있습니다. 아래는 기능 연결을 설명하는 개념도이며 모든 경로의 운영 검증을 뜻하지 않습니다.',['src/components/auth-provider.tsx','src/components/study-create-screen.tsx','src/components/plan-screen.tsx','src/components/materials-screen.tsx','src/lib/plan-flow.ts']);
node(s,'로그인 / 그룹 참여','공동 목표와 일정',64,219,280,312,C.soft);
node(s,'계획 경로','진도표·목차 / 학습 단위',408,219,384,125);
node(s,'자료 경로','공용 자료 / AI 질의응답',408,406,384,125);
node(s,'학습 실행','주간 계획 / 개인 할 일\n완료 기록 / 복습 후보',856,219,360,312,C.soft);
shape(s,344,280,64,2,C.green);shape(s,344,466,64,2,C.green);shape(s,792,280,64,2,C.green);shape(s,792,466,64,2,C.green);
txt(s,'그룹의 목표와 학습 맥락을 공유하는 두 개의 AI 흐름',408,578,808,40,24,C.frame,true);
}
// 05 Plan
{
const s=base('계획 AI: 학습 단위를 주간 할 일로','Core feature / Plan AI','진도표·목차 이미지 분석 API가 학습 단위를 반환하고, plan-flow가 로드맵을 구성합니다. Gemini 계획 채팅은 주간 계획 초안을 반환하며 PlanAgentScreen에는 미리보기 편집과 적용 UI가 있습니다. 리더 권한과 실제 적용 방식은 관련 provider와 repository에 구현되어 있습니다. 인증 세션이 없어 현재 서비스 화면 캡처는 보류했습니다.',['src/app/api/plan-reference/analyze/route.ts','src/lib/gemini.ts','src/lib/plan-flow.ts','src/components/plan-agent-screen.tsx','src/lib/prototype-repository.ts']);
txt(s,'진도표·목차 입력',64,223,510,42,30,C.frame,true);txt(s,'이미지 분석으로 학습 단위 추출',64,279,510,42,25,C.muted);
line(s,64,340,510);txt(s,'AI와 주간 계획 조정',64,374,510,42,30,C.frame,true);txt(s,'요일·할 일·소요 시간을 초안으로 제안',64,431,510,70,25,C.muted);
txt(s,'미리보기 편집 후 계획에 적용',64,546,530,44,28,C.ink,true);
placeholder(s,'계획 에이전트 / 초안 미리보기','/group/[id]/plan/agent');
txt(s,'코드 구현 확인 · 실계정 동작 검증 별도',64,613,1100,28,18,C.muted);
}
// 06 Materials
{
const s=base('자료 AI: 업로드 자료를 질문의 맥락으로','Core feature / Material AI','자료 업로드 API는 토큰과 그룹 멤버십을 확인하고 Storage에 파일을 저장합니다. 현재 material-upload는 파일에서 텍스트를 단순 추출해 첫 문단을 최대 120자 요약으로 저장합니다. Gemini는 자료 요약을 최대 5개, 각 요약을 짧게 잘라 맥락에 넣습니다. 임베딩 생성·벡터 검색·OCR 기반 PDF 처리가 완성된 구조는 확인되지 않습니다. 코드의 chunkText는 임베딩 검색 파이프라인이 아닙니다.',['src/app/api/groups/[id]/materials/route.ts','src/lib/server/material-upload.ts','src/lib/gemini.ts','src/components/materials-screen.tsx']);
txt(s,'파일 업로드와 목록 관리',64,222,520,42,30,C.frame,true);txt(s,'PDF·TXT·MD·CSV·JSON\nStorage 저장 및 자료 메타데이터 관리',64,276,520,90,24,C.muted);
line(s,64,395,510);txt(s,'자료 요약 + 질문',64,429,520,42,30,C.frame,true);txt(s,'그룹 맥락과 함께 Gemini에 전달',64,483,520,50,25,C.muted);
txt(s,'RAG 고도화: 검색·문서 추출 개선 필요',64,568,535,64,23,C.ink,true);
placeholder(s,'자료 목록 / AI 질의응답','/group/[id]/materials');
}
// 07 Connection
{
const s=base('계획과 자료의 연결 방식','Plan × Material','현재 강한 연결은 계획 기준 자료(plan_reference_uploads)에서 추출한 학습 단위(plan_reference_units)와 주간 계획(plan_items)의 reference_unit_sequence입니다. 별도의 공용 materials는 자료 채팅 맥락에 들어가며 주간 계획도 함께 전달합니다. n주차에 1~n주차 공용 자료를 자동 누적 매칭하는 기능은 확인되지 않아 표현하지 않습니다. 도식의 연결은 현재 데이터 구조를 단순화한 것입니다.',['src/lib/mock-data.ts','src/lib/plan-flow.ts','src/lib/ai-chat.ts','src/components/prototype-provider.tsx','supabase/bootstrap.sql']);
flow(s,[['계획 기준 자료','진도표·목차'],['학습 단위','순서 / 제목 / 설명'],['주차 범위','로드맵의 단위 구간'],['주간 할 일','학습 단위 참조']],220);
line(s,64,423,1152);
txt(s,'공용 학습 자료',64,465,430,48,30,C.frame,true);txt(s,'자료 요약과 현재 주간 계획을\n자료 AI의 맥락으로 함께 제공',463,465,730,100,29,C.ink);
txt(s,'주차별 자료 자동 누적 연결은 추가 설계·검증 범위',64,602,1150,30,20,C.muted);
}
// 08 Architecture
{
const s=base('현재 시스템 구조','System architecture','현재 코드는 단일 Next.js 앱입니다. 모든 데이터가 Route Handler만 거치는 구조는 아닙니다. AuthProvider와 prototype-repository에는 Supabase 브라우저 SDK 직접 접근이 있으며 AI와 자료 업로드는 서버 API 경로를 사용합니다. bootstrap.sql에 테이블·RLS·Storage 정의가 있지만 다수 정책이 anon/authenticated에 true를 허용하여 운영 보안이 완성됐다고 볼 수 없습니다. AI chat 및 이미지 분석 Route에는 요청 검증은 있으나 사용자·멤버십 확인이 별도로 보이지 않습니다. 발표에서는 보안 강화를 후속 과제로 제시합니다.',['package.json','src/components/auth-provider.tsx','src/components/prototype-provider.tsx','src/lib/prototype-repository.ts','src/lib/client-api.ts','src/lib/supabase/browser.ts','src/lib/supabase/server.ts','src/app/api/ai/chat/route.ts','supabase/bootstrap.sql']);
node(s,'클라이언트','React 19 / TypeScript\nTailwind CSS 4\nAuthProvider / PrototypeProvider',64,218,350,236,C.soft);
node(s,'Next.js 16 서버','App Router / Route Handlers\nAI 채팅·이미지 분석\n파일 업로드·계정 삭제',478,218,350,236);
node(s,'Gemini API','계획 초안 / 자료 응답\n진도표 이미지 분석',892,218,324,236,C.soft);
shape(s,414,330,64,2,C.green);shape(s,828,330,64,2,C.green);
node(s,'Supabase','Auth / Postgres / Storage',64,530,1152,102);
shape(s,238,454,2,76,C.green);shape(s,652,454,2,76,C.green);
txt(s,'브라우저 SDK',267,476,210,30,18,C.muted);txt(s,'서버 SDK',681,476,190,30,18,C.muted);
}
// 09 Process
{
const s=base('AI 협업 개발의 공통 기준','Development process','사용자가 설명한 AI 기반 기능별 개발 맥락과 AGENTS.md의 규칙을 바탕으로 개발 과정의 개선점을 설명합니다. 실제 merge conflict 횟수, 중복 코드 감소율, 생산성 향상 수치는 확인되지 않았습니다. 서로 다른 기존 화면 스타일과 독립적인 디자인 preview가 존재하며 공통 컴포넌트 재사용·공유 파일 변경 최소화가 규칙에 명시돼 있습니다.',['AGENTS.md','src/components/mobile-shell.tsx','src/components/weekly-plan-tabs.tsx','src/components/design-preview-v2/design-preview-v2-screen.tsx']);
block(s,'기능별 구현이 늘면서','화면마다 다른 UI 해석\n같은 역할의 구조를 중복 구현할 가능성\n공유 파일 변경 시 충돌 위험',64,219,500);
shape(s,623,219,1,355,C.line);
block(s,'공통 기준으로 조정','AGENTS.md에 구조·재사용 규칙 명시\n공유 파일의 변경 범위 관리\n디자인 기준을 Preview에서 비교',703,219,510);
txt(s,'공통 개발 규칙과 시각적 기준을 함께 정리',64,579,1152,47,32,C.frame,true);
}
// 10 DS
{
const s=base('디자인 시스템의 구성','Design system','DesignPreviewV2Screen은 Foundations 5개와 Components 5개를 구분합니다. Overview에서 개별 Detail로 이동하고 다시 돌아올 수 있으며, 사이드바 접기·펼치기도 구현돼 있습니다. 이 페이지는 CSS module로 격리된 임시 디자인 탐색 시안입니다. 전체 서비스의 production design system 전환이나 공통 컴포넌트 배포가 완료됐다는 의미는 아닙니다.',['src/components/design-preview-v2/design-preview-v2-screen.tsx','src/components/design-preview-v2/preview-overview.tsx','src/components/design-preview-v2/preview-example.tsx','src/components/design-preview-v2/preview.module.css']);
txt(s,'Foundations',64,222,530,48,33,C.frame,true);txt(s,'Colors\nTypography\nSpacing / Radius / Border',64,295,520,167,29,C.ink);
txt(s,'Components',703,222,513,48,33,C.frame,true);txt(s,'Button / Input\nCard / Modal\nTabs',703,295,513,167,29,C.ink);
line(s,64,505,1152);txt(s,'Overview',64,548,360,50,32,C.frame,true);shape(s,390,574,155,2,C.green);txt(s,'개별 Detail',594,548,420,50,32,C.frame,true);
txt(s,'탐색용 시안 구현 · 공통 기준 확정과 서비스 적용은 진행 과제',64,611,1152,28,19,C.muted);
}
// 11 Preview
{
const s=base('Design Preview V2','Design system preview','실제 로컬 /design-preview-v2의 Overview와 Button 상세 화면을 캡처했습니다. 화면 이미지는 편집할 수 없는 비트맵이며 슬라이드의 제목·annotation은 편집 가능합니다. 캡처 시 서비스 데이터나 사용자 계정을 수정하지 않았습니다. 기준 요소를 한눈에 확인하고 상세 예시로 탐색하는 흐름을 보여 줍니다.',['src/components/design-preview-v2/design-preview-v2-screen.tsx','src/components/design-preview-v2/preview.module.css','http://localhost:3000/design-preview-v2']);
await image(s,'design-overview.png',64,202,700,410);await image(s,'design-button-detail.png',807,202,409,268);
txt(s,'01  공통 기준을 한눈에 확인',64,632,700,25,17,C.frame,true);
txt(s,'02  요소별 적용 예시 비교',807,495,409,40,22,C.frame,true);
txt(s,'03  팀원이 같은 화면으로 검토',807,556,409,70,22,C.frame,true);
}
// 12 Result
{
const s=base('현재 결과와 남은 검증','Result / Improvement','구현 확인은 코드와 실제 Preview 화면으로 확인했다는 뜻입니다. 로그인·업로드·AI 응답의 실계정 통합 시연, 실제 Supabase 배포 스키마, 운영 데이터는 확인하지 않았습니다. 학습 효과, 사용자 수, 성능 개선률도 측정 근거가 없어 제시하지 않습니다. 기존 문서와 달리 현재 코드에는 연동이 존재하지만, 범용 RAG와 운영 권한은 보완이 필요합니다.',['AGENTS.md','src/components/auth-provider.tsx','src/components/plan-agent-screen.tsx','src/lib/gemini.ts','supabase/bootstrap.sql','src/components/design-preview-v2/design-preview-v2-screen.tsx']);
txt(s,'구현 확인',64,213,1130,45,30,C.frame,true);txt(s,'계획·자료 AI 연결 코드 / Supabase 저장 구조\n공동·개인 할 일 및 복습 관리 로직',64,274,1120,95,29,C.ink);
line(s,64,398,1152);txt(s,'협업 기준 마련',64,429,1130,43,30,C.frame,true);txt(s,'공통 개발 규칙 / 기존 UI 재사용 원칙 / 디자인 탐색 페이지',64,489,1130,67,27,C.ink);
txt(s,'남은 검증   실계정 통합 시연, 문서 처리 품질, 접근 권한, 사용자 평가',64,596,1152,45,21,C.muted);
}
// 13 Future closing
{
const s=base('향후 개선 방향','Future work','향후 방향 제안입니다. 벡터 검색과 문서 추출 품질 개선, AI API 인증과 그룹 권한 검증, DB RLS 제한, 디자인 토큰·공통 UI의 서비스 반영, 실제 사용자 검증을 우선 과제로 정리했습니다. 일정과 담당자, 이미 완료된 성과로 단정하지 않습니다.',['src/lib/server/material-upload.ts','src/lib/gemini.ts','src/app/api/ai/chat/route.ts','supabase/bootstrap.sql','src/components/design-preview-v2/preview.module.css']);
txt(s,'학습 기능 고도화',64,214,540,45,30,C.frame,true);txt(s,'문서 추출·검색 품질 개선\n계획과 공용 자료의 연결 검증',64,276,540,100,27,C.ink);
txt(s,'서비스 완성도 개선',703,214,513,45,30,C.frame,true);txt(s,'인증·멤버십·RLS 강화\n디자인 기준 확정과 공통 UI 적용',703,276,513,100,27,C.ink);
shape(s,64,435,1152,174,C.frame);txt(s,'함께 쓰는 자료가\n함께 실행하는 학습 계획으로 이어지도록',96,468,1076,116,37,C.white,true);
}

await fs.writeFile(path.join(build,'research-and-notes.json'),JSON.stringify({basis:'현재 로컬 코드 및 실제 Preview 캡처',sourceCodeUnmodified:true,colors:C,font:FONT,slides:records},null,2));
await fs.writeFile(path.join(root,'발표자료_안내.txt'),[
'STUDY FLOW 캡스톤디자인 발표 1차 시안',
'13장 / 16:9 / 텍스트 및 도식은 편집 가능한 PowerPoint 객체',
'실제 캡처: Design Preview V2 Overview, Button Detail (11번 슬라이드)',
'교체 영역: 5번 계획 에이전트, 6번 자료 화면. 로그인된 실제 화면으로 교체 필요.',
'팀명·팀원·소속: 표지의 [입력] 영역에서 수정.',
'현재 코드 구현과 운영 검증 완료를 구분함. 실계정 AI·업로드 통합 동작은 검증하지 않음.',
'초기 README/중간보고서의 mock 설명보다 현재 구현 코드를 우선함.',
'RAG: 현재 자료 요약 맥락 전달. 임베딩/벡터 검색 완성으로 표현하지 않음.',
'계획-자료 연결: 계획 기준 자료의 학습 단위와 주차·주간 할 일 참조. 주차별 공용 자료 자동 누적 연결은 확인되지 않음.',
'디자인 시스템: 임시 탐색 시안. 서비스 전체 적용 완료로 표현하지 않음.',
'정량 성과·실제 사용자 평가·충돌 감소율·개발 일정·담당자 정보는 채우지 않음.',
'AGENTS.md 및 기존 소스코드는 수정하지 않음. 발표 산출물은 artifacts/capstone-presentation에만 작성.',
'소스 변경이 없어 pnpm lint/build는 실행하지 않음. 발표 파일은 별도 구조·레이아웃 검사 및 렌더링 검토.',
'각 슬라이드의 발표자 노트에 설명과 근거 파일 기록.',
'수정·재생성 소스: build/create-deck.mjs / 캡처 원본: assets / 최종 파일: output',
'',...records.map(x=>`${String(x.slide).padStart(2,'0')}. ${x.title}`)
].join('\r\n'),'utf8');
for(let i=0;i<p.slides.items.length;i++){
 const s=p.slides.items[i];const png=await p.export({slide:s,format:'png',scale:1});
 await fs.writeFile(path.join(build,'previews',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
 console.log('rendered',i+1);
}
const candidate=path.join(build,'draft.pptx');await (await PresentationFile.exportPptx(p)).save(candidate);
const SKILL='C:/Users/김지윤/.codex/plugins/cache/openai-primary-runtime/presentations/26.1110.11613/skills/presentations';
const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL,'container_tools/artifact_tool_utils.mjs')).href);
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:path.join(out,'StudyFlow_Capstone_Draft_v1.pptx'),pythonExecutable:'C:/Users/김지윤/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],explicitTotalSlideCount:13,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,receiptPath:path.join(build,'validation-v1.json')});
console.log('DONE',out);
