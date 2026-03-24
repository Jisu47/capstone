export type MemberRole = "팀장" | "팀원";

export type Member = {
  id: string;
  name: string;
  role: MemberRole;
  focus: string;
};

export type Material = {
  id: string;
  title: string;
  summary: string;
  uploadedBy: string;
  uploadedAt: string;
  format: "PDF" | "DOC";
  locationHint: string;
};

export type SourceCard = {
  id: string;
  title: string;
  locationHint: string;
  summary: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  sources?: SourceCard[];
};

export type Weekday = "월" | "화" | "수" | "목" | "금";

export type WeeklyPlanItem = {
  id: string;
  day: Weekday;
  title: string;
  detail: string;
  duration: string;
  memberStatus: Record<string, boolean>;
};

export type StudyGroup = {
  id: string;
  name: string;
  subject: string;
  examDate: string;
  weeklyGoal: string;
  description: string;
  recentUpdate: string;
  members: Member[];
  materials: Material[];
  plan: WeeklyPlanItem[];
  chat: ChatMessage[];
  uploadDraftCount: number;
};

export type CreateGroupInput = {
  name: string;
  subject: string;
  examDate: string;
  weeklyGoal: string;
};

export const currentUserId = "member-jiyoon";

function createStatusMap(memberIds: string[], completedMemberIds: string[]) {
  return Object.fromEntries(
    memberIds.map((memberId) => [memberId, completedMemberIds.includes(memberId)]),
  );
}

function createWelcomeChat(subject: string, materials: Material[]): ChatMessage[] {
  const primaryMaterial = materials[0];

  return [
    {
      id: `chat-welcome-${subject}`,
      role: "assistant",
      text: `${subject} 스터디 자료를 바탕으로 핵심 개념 요약, 시험 범위 정리, 토론 질문 생성까지 도와드릴게요.`,
      createdAt: "방금 전",
      sources: primaryMaterial
        ? [
            {
              id: `${primaryMaterial.id}-source`,
              title: primaryMaterial.title,
              locationHint: primaryMaterial.locationHint,
              summary: "핵심 개념이 먼저 정리된 기준 자료",
            },
          ]
        : [],
    },
  ];
}

function createPlan(
  entries: Array<{
    day: Weekday;
    title: string;
    detail: string;
    duration: string;
    completedMemberIds: string[];
  }>,
  memberIds: string[],
): WeeklyPlanItem[] {
  return entries.map((entry, index) => ({
    id: `plan-${entry.day}-${index + 1}`,
    day: entry.day,
    title: entry.title,
    detail: entry.detail,
    duration: entry.duration,
    memberStatus: createStatusMap(memberIds, entry.completedMemberIds),
  }));
}

function parseGoals(weeklyGoal: string) {
  return weeklyGoal
    .split(/[\n,\/]/)
    .map((goal) => goal.trim())
    .filter(Boolean);
}

function createAutoPlan(subject: string, weeklyGoal: string, memberIds: string[]) {
  const goals = parseGoals(weeklyGoal);
  const teammateA = memberIds[1];
  const teammateB = memberIds[2];

  return createPlan(
    [
      {
        day: "월",
        title: goals[0] ?? `${subject} 1~2주차 흐름 정리`,
        detail: `${subject} 전체 맥락을 빠르게 잡고 이번 주 범위를 표로 정리`,
        duration: "45분",
        completedMemberIds: [currentUserId, teammateA].filter(Boolean) as string[],
      },
      {
        day: "화",
        title: goals[1] ?? `${subject} 핵심 개념 학습`,
        detail: "공용 자료 기준으로 빈출 개념과 용어를 묶어서 암기",
        duration: "50분",
        completedMemberIds: [teammateB].filter(Boolean) as string[],
      },
      {
        day: "수",
        title: `${subject} 예상문제 풀이`,
        detail: "시험 범위에서 자주 나오는 주제를 묶어 3문제 풀이",
        duration: "40분",
        completedMemberIds: [teammateA].filter(Boolean) as string[],
      },
      {
        day: "목",
        title: goals[2] ?? `${subject} 취약 파트 보완`,
        detail: "AI 질의응답으로 헷갈리는 개념을 다시 확인",
        duration: "35분",
        completedMemberIds: [currentUserId].filter(Boolean) as string[],
      },
      {
        day: "금",
        title: `${subject} 주간 리캡`,
        detail: "모임원별 완료 항목을 확인하고 다음 주 우선순위 정리",
        duration: "30분",
        completedMemberIds: [],
      },
    ],
    memberIds,
  );
}

function makeIsoDate(date: string) {
  return `${date}T09:00:00.000Z`;
}

function createInitialMembers(): Member[] {
  return [
    { id: currentUserId, name: "영희", role: "팀장", focus: "개념 구조화" },
    { id: "member-minsu", name: "민수", role: "팀원", focus: "기출 풀이" },
    { id: "member-seoyeon", name: "서연", role: "팀원", focus: "오답 정리" },
    { id: "member-doyoon", name: "도윤", role: "팀원", focus: "자료 요약" },
  ];
}

function createInitialGroups(): StudyGroup[] {
  const members = createInitialMembers();
  const memberIds = members.map((member) => member.id);

  const operatingMaterials: Material[] = [
    {
      id: "mat-os-1",
      title: "운영체제 3주차.pdf",
      summary: "프로세스, 스레드, 컨텍스트 스위칭 핵심 정리",
      uploadedBy: "도윤",
      uploadedAt: makeIsoDate("2026-03-23"),
      format: "PDF",
      locationHint: "p.12",
    },
    {
      id: "mat-os-2",
      title: "발제문 초안.pdf",
      summary: "세마포어와 교착상태 예시 중심 발표 초안",
      uploadedBy: "영희",
      uploadedAt: makeIsoDate("2026-03-22"),
      format: "PDF",
      locationHint: "핵심 개념 요약",
    },
    {
      id: "mat-os-3",
      title: "운영체제 기출 체크리스트.doc",
      summary: "교수님 기출 키워드와 예상 서술 포인트",
      uploadedBy: "민수",
      uploadedAt: makeIsoDate("2026-03-21"),
      format: "DOC",
      locationHint: "빈출 파트",
    },
  ];

  const networkMaterials: Material[] = [
    {
      id: "mat-net-1",
      title: "데이터통신 중간고사 범위.pdf",
      summary: "계층 구조, 오류 제어, 흐름 제어 범위 요약",
      uploadedBy: "서연",
      uploadedAt: makeIsoDate("2026-03-24"),
      format: "PDF",
      locationHint: "p.8",
    },
    {
      id: "mat-net-2",
      title: "라우팅 정리 노트.pdf",
      summary: "거리 벡터와 링크 상태 라우팅 비교표",
      uploadedBy: "영희",
      uploadedAt: makeIsoDate("2026-03-23"),
      format: "PDF",
      locationHint: "요약 노트",
    },
    {
      id: "mat-net-3",
      title: "발표 자료 초안.pdf",
      summary: "토큰 버킷과 혼잡 제어 발표용 구조 초안",
      uploadedBy: "도윤",
      uploadedAt: makeIsoDate("2026-03-20"),
      format: "PDF",
      locationHint: "슬라이드 4",
    },
  ];

  return [
    {
      id: "group-os",
      name: "운영체제 중간 대비",
      subject: "운영체제",
      examDate: "2026-04-18",
      weeklyGoal: "프로세스/스레드 정리, 교착상태 이해, 기출 서술형 대비",
      description: "같은 시험 범위를 공유하는 팀이 공용 자료를 함께 보고 정리하는 스터디",
      recentUpdate: "발제문 초안이 업로드됐고 이번 주 계획이 자동 갱신됨",
      members,
      materials: operatingMaterials,
      plan: createPlan(
        [
          {
            day: "월",
            title: "1~2주차 흐름 복습",
            detail: "운영체제 구조와 인터럽트 흐름 다시 읽기",
            duration: "35분",
            completedMemberIds: [currentUserId, "member-minsu"],
          },
          {
            day: "화",
            title: "3주차 핵심 개념 학습",
            detail: "프로세스 상태, PCB, 스케줄링 포인트 정리",
            duration: "50분",
            completedMemberIds: ["member-seoyeon"],
          },
          {
            day: "수",
            title: "예상문제 풀이",
            detail: "컨텍스트 스위칭과 스레드 비교 서술형 3문제",
            duration: "40분",
            completedMemberIds: ["member-minsu"],
          },
          {
            day: "목",
            title: "AI로 취약 개념 재질문",
            detail: "세마포어, 뮤텍스, 모니터 차이점 확인",
            duration: "30분",
            completedMemberIds: [currentUserId],
          },
          {
            day: "금",
            title: "주간 합본 요약 정리",
            detail: "모임 발표용 한 장 요약 업데이트",
            duration: "25분",
            completedMemberIds: [],
          },
        ],
        memberIds,
      ),
      chat: createWelcomeChat("운영체제", operatingMaterials),
      uploadDraftCount: 0,
    },
    {
      id: "group-network",
      name: "데이터통신 범위 정리",
      subject: "데이터통신",
      examDate: "2026-05-02",
      weeklyGoal: "계층별 핵심 개념 정리, 라우팅 비교, 예상문제 풀이",
      description: "시험 범위를 함께 압축해서 보는 자료 공유형 스터디",
      recentUpdate: "범위 PDF가 올라왔고 라우팅 파트가 이번 주 우선 학습으로 지정됨",
      members,
      materials: networkMaterials,
      plan: createAutoPlan("데이터통신", "계층 구조 정리, 라우팅 비교, 예상문제 풀이", memberIds),
      chat: createWelcomeChat("데이터통신", networkMaterials),
      uploadDraftCount: 0,
    },
  ];
}

export function getInitialGroups() {
  return createInitialGroups();
}

export function createGroupFromInput(input: CreateGroupInput): StudyGroup {
  const members = createInitialMembers();
  const memberIds = members.map((member) => member.id);
  const createdAt = new Date().toISOString();
  const trimmedSubject = input.subject.trim();
  const trimmedName = input.name.trim();
  const goals = parseGoals(input.weeklyGoal);
  const groupId = `group-${Date.now().toString(36)}`;

  const materials: Material[] = [
    {
      id: `${groupId}-mat-1`,
      title: `${trimmedSubject} 공용 요약본.pdf`,
      summary: `${trimmedSubject} 범위를 빠르게 읽을 수 있는 mock 요약 자료`,
      uploadedBy: "영희",
      uploadedAt: createdAt,
      format: "PDF",
      locationHint: "요약 1장",
    },
    {
      id: `${groupId}-mat-2`,
      title: `${trimmedSubject} 예상문제 정리.pdf`,
      summary: `${trimmedSubject} 시험 대비용 예상문제와 체크 포인트`,
      uploadedBy: "민수",
      uploadedAt: createdAt,
      format: "PDF",
      locationHint: "문제 1~3",
    },
    {
      id: `${groupId}-mat-3`,
      title: `${trimmedSubject} 발표 준비 메모.pdf`,
      summary: "발표/토론용 질문과 요점만 모은 mock 자료",
      uploadedBy: "서연",
      uploadedAt: createdAt,
      format: "PDF",
      locationHint: "토론 포인트",
    },
  ];

  return {
    id: groupId,
    name: trimmedName,
    subject: trimmedSubject,
    examDate: input.examDate,
    weeklyGoal: input.weeklyGoal.trim(),
    description: `${trimmedSubject} 시험 일정과 공용 자료를 기준으로 움직이는 새 스터디 모임`,
    recentUpdate: `${goals[0] ?? "핵심 개념 정리"} 기준으로 자동 계획이 생성됨`,
    members,
    materials,
    plan: createAutoPlan(trimmedSubject, input.weeklyGoal, memberIds),
    chat: createWelcomeChat(trimmedSubject, materials),
    uploadDraftCount: 0,
  };
}

export function buildMockAnswer(group: StudyGroup, question: string) {
  const primary = group.materials[0];
  const secondary = group.materials[1] ?? group.materials[0];
  const normalized = question.replace(/\s+/g, "");

  if (normalized.includes("핵심개념")) {
    return {
      text: `${group.subject} 기준으로 이번 주에는 "${group.plan[1]?.title ?? "핵심 개념 학습"}"가 가장 중요합니다.\n먼저 용어 정의를 맞춘 뒤, 자료에 나온 예시를 기준으로 비교표를 만들어 두면 시험 대비가 빨라집니다.`,
      sources: [
        {
          id: `${primary.id}-answer-1`,
          title: primary.title,
          locationHint: primary.locationHint,
          summary: "핵심 개념과 예시가 가장 먼저 정리된 기준 자료",
        },
      ],
    };
  }

  if (normalized.includes("시험범위") || normalized.includes("중요")) {
    return {
      text: `시험 범위에서는 "${group.plan[0]?.title}"와 "${group.plan[2]?.title}"를 우선 보세요.\n개념 설명형과 비교형 문제가 섞여 나올 가능성이 높아서 정의, 차이점, 예시까지 한 번에 정리하는 편이 좋습니다.`,
      sources: [
        {
          id: `${primary.id}-answer-2`,
          title: primary.title,
          locationHint: primary.locationHint,
          summary: "시험 범위 기준 핵심 파트가 정리된 자료",
        },
        {
          id: `${secondary.id}-answer-2`,
          title: secondary.title,
          locationHint: secondary.locationHint,
          summary: "추가 예시와 서술형 포인트를 확인할 수 있는 자료",
        },
      ],
    };
  }

  if (normalized.includes("토론") || normalized.includes("발표")) {
    return {
      text: `토론 질문은 이렇게 가져가면 자연스럽습니다.\n1. 이번 범위에서 가장 헷갈리는 개념은 무엇인가?\n2. 실제 사례에 대입하면 어떤 차이가 생기나?\n3. 시험형 서술 문제로 바꾸면 어떤 답안 구조가 적절한가?`,
      sources: [
        {
          id: `${secondary.id}-answer-3`,
          title: secondary.title,
          locationHint: secondary.locationHint,
          summary: "발표/토론용 구조를 참고하기 좋은 보조 자료",
        },
      ],
    };
  }

  return {
    text: `${group.subject} 공용 자료를 기준으로 답하면, 이번 주 우선순위는 "${group.weeklyGoal}"입니다.\n자료 먼저 읽기 -> 주간 계획 체크 -> 막히는 부분만 다시 질문하는 흐름으로 보면 가장 빠릅니다.`,
    sources: [
      {
        id: `${primary.id}-answer-default`,
        title: primary.title,
        locationHint: primary.locationHint,
        summary: "질문과 가장 가까운 기본 참고 자료",
      },
    ],
  };
}

export function getDaysLeft(dateString: string) {
  const target = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
}

export function formatExamDate(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${dateString}T00:00:00`));
}

export function formatUploadDate(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(dateString));
}

export function getMemberProgress(group: StudyGroup, memberId: string) {
  if (group.plan.length === 0) {
    return 0;
  }

  const completedCount = group.plan.filter((item) => item.memberStatus[memberId]).length;
  return Math.round((completedCount / group.plan.length) * 100);
}

export function getGroupProgress(group: StudyGroup) {
  const totalSlots = group.plan.length * group.members.length;

  if (totalSlots === 0) {
    return 0;
  }

  const completedSlots = group.plan.reduce((count, item) => {
    return count + Object.values(item.memberStatus).filter(Boolean).length;
  }, 0);

  return Math.round((completedSlots / totalSlots) * 100);
}

export function getCompletedCount(group: StudyGroup, memberId: string) {
  return group.plan.filter((item) => item.memberStatus[memberId]).length;
}
