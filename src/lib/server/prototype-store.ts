import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  type AskQuestionRequest,
  type ChatAnswerDto,
  type ChatListResponse,
  type CreateGroupRequest,
  type GroupsResponse,
  type HomeDashboardResponse,
  type MaterialDto,
  type MaterialListResponse,
  type PlanMutationRequest,
  type PlanMutationResponse,
  type PrototypeDatabase,
  type SourceCardDto,
  type StoredChatMessage,
  type StoredGroup,
  type StoredMaterial,
  type StoredMaterialChunk,
  type StoredPlanCompletion,
  type StoredPlanItem,
  type StoredUser,
} from "@/lib/api-contracts";
import {
  type ChatMessage,
  type CreateGroupInput,
  type Material,
  type StudyGroup,
  currentUserId,
  createGroupFromInput,
  formatUploadDate,
  getDaysLeft,
  getInitialGroups,
} from "@/lib/mock-data";

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const UPLOAD_DIRECTORY = path.join(DATA_DIRECTORY, "uploads");
const DATABASE_PATH = path.join(DATA_DIRECTORY, "study-flow-db.json");
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const MAX_SOURCE_CHUNKS = 3;

let writeQueue = Promise.resolve<unknown>(undefined);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getResolvedCurrentUserId() {
  return process.env.STUDY_FLOW_CURRENT_USER_ID?.trim() || currentUserId;
}

function inferMaterialFormat(fileName: string): Material["format"] {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".pdf") {
    return "PDF";
  }

  if (extension === ".md" || extension === ".markdown") {
    return "MD";
  }

  if (extension === ".txt" || extension === ".csv" || extension === ".json") {
    return "TXT";
  }

  return "DOC";
}

function isSupportedUpload(fileName: string, mimeType: string) {
  const extension = path.extname(fileName).toLowerCase();

  return (
    extension === ".pdf" ||
    extension === ".txt" ||
    extension === ".md" ||
    extension === ".markdown" ||
    extension === ".csv" ||
    extension === ".json" ||
    mimeType.startsWith("text/")
  );
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\u0000/g, "").trim();
}

function tokenize(text: string) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? []).filter(
    (token) => !["study", "flow", "with"].includes(token),
  );
}

function summarizeText(title: string, text: string) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return `${title}에서 텍스트를 추출하지 못했습니다.`;
  }

  const firstParagraph = normalized.split("\n\n")[0] ?? normalized;
  return `${firstParagraph}`.slice(0, 120).trim();
}

function buildLocationHint(fileName: string, chunkIndex: number) {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".pdf") {
    return `추출 문단 ${chunkIndex + 1}`;
  }

  return `본문 ${chunkIndex + 1}`;
}

function chunkText(fileName: string, text: string) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return [] as Array<{ text: string; locationHint: string }>;
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const chunks: Array<{ text: string; locationHint: string }> = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    if (`${buffer}\n\n${paragraph}`.trim().length > 700 && buffer) {
      chunks.push({
        text: buffer.trim(),
        locationHint: buildLocationHint(fileName, chunks.length),
      });
      buffer = paragraph;
      continue;
    }

    buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
  }

  if (buffer.trim()) {
    chunks.push({
      text: buffer.trim(),
      locationHint: buildLocationHint(fileName, chunks.length),
    });
  }

  if (chunks.length === 0) {
    chunks.push({
      text: normalized.slice(0, 700),
      locationHint: buildLocationHint(fileName, 0),
    });
  }

  return chunks.slice(0, 8);
}

async function extractPdfText(buffer: Buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();

    if (pageText) {
      pages.push(pageText);
    }
  }

  return pages.join("\n\n");
}

async function extractTextFromFile(fileName: string, mimeType: string, buffer: Buffer) {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".pdf" || mimeType.includes("pdf")) {
    return extractPdfText(buffer);
  }

  return buffer.toString("utf8");
}

function formatChatTimestamp(dateString: string) {
  const createdAt = new Date(dateString);
  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "방금 전";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  return formatUploadDate(dateString);
}

function buildSeedDatabase(): PrototypeDatabase {
  const groups = getInitialGroups();
  const users = new Map<string, StoredUser>();
  const database: PrototypeDatabase = {
    version: 1,
    users: [],
    groups: [],
    groupMembers: [],
    planItems: [],
    planCompletions: [],
    materials: [],
    materialChunks: [],
    chatMessages: [],
  };

  for (const group of groups) {
    database.groups.push({
      id: group.id,
      name: group.name,
      subject: group.subject,
      examDate: group.examDate,
      weeklyGoal: group.weeklyGoal,
      description: group.description,
      recentUpdate: group.recentUpdate,
    });

    for (const member of group.members) {
      users.set(member.id, {
        id: member.id,
        name: member.name,
        role: member.role,
        focus: member.focus,
      });
      database.groupMembers.push({ groupId: group.id, userId: member.id });
    }

    for (const item of group.plan) {
      database.planItems.push({
        id: item.id,
        groupId: group.id,
        day: item.day,
        title: item.title,
        detail: item.detail,
        duration: item.duration,
      });

      for (const [userId, completed] of Object.entries(item.memberStatus)) {
        database.planCompletions.push({
          planItemId: item.id,
          userId,
          completed,
        });
      }
    }

    for (const material of group.materials) {
      const uploader = group.members.find((member) => member.name === material.uploadedBy);

      database.materials.push({
        id: material.id,
        groupId: group.id,
        uploaderId: uploader?.id ?? getResolvedCurrentUserId(),
        title: material.title,
        storagePath: "",
        mimeType: "application/octet-stream",
        format: material.format,
        uploadedAt: material.uploadedAt,
        summary: material.summary,
        processingStatus: material.processingStatus ?? "ready",
        locationHint: material.locationHint,
      });

      database.materialChunks.push({
        id: `${material.id}-chunk-0`,
        materialId: material.id,
        chunkIndex: 0,
        text: `${material.title}\n${material.summary}`,
        locationHint: material.locationHint,
      });
    }

    for (const message of group.chat) {
      database.chatMessages.push({
        id: message.id,
        groupId: group.id,
        userId: message.role === "user" ? getResolvedCurrentUserId() : "assistant",
        role: message.role,
        text: message.text,
        createdAt: new Date().toISOString(),
        sources: message.sources ?? [],
      });
    }
  }

  database.users = [...users.values()];
  return database;
}

async function ensureDataDirectory() {
  await mkdir(DATA_DIRECTORY, { recursive: true });
  await mkdir(UPLOAD_DIRECTORY, { recursive: true });
}

async function loadDatabase() {
  await ensureDataDirectory();

  try {
    const raw = await readFile(DATABASE_PATH, "utf8");
    const parsed = JSON.parse(raw) as PrototypeDatabase;

    if (parsed.version !== 1) {
      throw new Error("Unsupported database version");
    }

    return parsed;
  } catch {
    const initialDatabase = buildSeedDatabase();
    await writeFile(DATABASE_PATH, JSON.stringify(initialDatabase, null, 2), "utf8");
    return initialDatabase;
  }
}

async function saveDatabase(database: PrototypeDatabase) {
  await ensureDataDirectory();
  await writeFile(DATABASE_PATH, JSON.stringify(database, null, 2), "utf8");
}

async function withWriteLock<T>(task: () => Promise<T>) {
  const result = writeQueue.then(task, task);
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function getUserById(database: PrototypeDatabase, userId: string) {
  return database.users.find((user) => user.id === userId);
}

function getGroupById(database: PrototypeDatabase, groupId: string) {
  return database.groups.find((group) => group.id === groupId);
}

function getStudyGroups(database: PrototypeDatabase) {
  const groups = database.groups.map((group) => {
    const members = database.groupMembers
      .filter((groupMember) => groupMember.groupId === group.id)
      .map((groupMember) => getUserById(database, groupMember.userId))
      .filter(Boolean)
      .map((user) => ({
        id: user.id,
        name: user.name,
        role: user.role as StudyGroup["members"][number]["role"],
        focus: user.focus,
      }));

    const plan = database.planItems
      .filter((item) => item.groupId === group.id)
      .map((item) => {
        const memberStatus = Object.fromEntries(
          members.map((member) => {
            const completion = database.planCompletions.find(
              (entry) => entry.planItemId === item.id && entry.userId === member.id,
            );

            return [member.id, completion?.completed ?? false];
          }),
        );

        return {
          id: item.id,
          day: item.day,
          title: item.title,
          detail: item.detail,
          duration: item.duration,
          memberStatus,
        };
      });

    const materials = database.materials
      .filter((material) => material.groupId === group.id)
      .sort((left, right) => {
        return new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime();
      })
      .map((material) => ({
        id: material.id,
        title: material.title,
        summary: material.summary,
        uploadedBy: getUserById(database, material.uploaderId)?.name ?? "알 수 없음",
        uploadedAt: material.uploadedAt,
        format: material.format,
        locationHint: material.locationHint,
        processingStatus: material.processingStatus,
      }));

    const chat = database.chatMessages
      .filter((message) => message.groupId === group.id)
      .sort((left, right) => {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      })
      .map((message) => ({
        id: message.id,
        role: message.role,
        text: message.text,
        createdAt: formatChatTimestamp(message.createdAt),
        sources: message.sources,
      }));

    return {
      id: group.id,
      name: group.name,
      subject: group.subject,
      examDate: group.examDate,
      weeklyGoal: group.weeklyGoal,
      description: group.description,
      recentUpdate: group.recentUpdate,
      members,
      materials,
      plan,
      chat,
      uploadDraftCount: Math.max(0, materials.length - 3),
    } satisfies StudyGroup;
  });

  return groups;
}

function getStudyGroup(database: PrototypeDatabase, groupId: string) {
  return getStudyGroups(database).find((group) => group.id === groupId) ?? null;
}

function ensureMembership(database: PrototypeDatabase, groupId: string, userId: string) {
  const isMember = database.groupMembers.some(
    (groupMember) => groupMember.groupId === groupId && groupMember.userId === userId,
  );

  if (!isMember) {
    throw new Error("이 스터디 모임의 멤버만 접근할 수 있습니다.");
  }
}

function upsertGroupFromStudyGroup(database: PrototypeDatabase, group: StudyGroup) {
  database.groups = database.groups.filter((entry) => entry.id !== group.id);
  database.groupMembers = database.groupMembers.filter((entry) => entry.groupId !== group.id);
  const planItemIds = new Set(
    database.planItems.filter((entry) => entry.groupId === group.id).map((entry) => entry.id),
  );
  database.planItems = database.planItems.filter((entry) => entry.groupId !== group.id);
  database.planCompletions = database.planCompletions.filter(
    (entry) => !planItemIds.has(entry.planItemId),
  );

  database.groups.unshift({
    id: group.id,
    name: group.name,
    subject: group.subject,
    examDate: group.examDate,
    weeklyGoal: group.weeklyGoal,
    description: group.description,
    recentUpdate: group.recentUpdate,
  });

  for (const member of group.members) {
    const existingUser = database.users.find((user) => user.id === member.id);

    if (!existingUser) {
      database.users.push({
        id: member.id,
        name: member.name,
        role: member.role,
        focus: member.focus,
      });
    }

    database.groupMembers.push({
      groupId: group.id,
      userId: member.id,
    });
  }

  for (const item of group.plan) {
    database.planItems.push({
      id: item.id,
      groupId: group.id,
      day: item.day,
      title: item.title,
      detail: item.detail,
      duration: item.duration,
    });

    for (const [userId, completed] of Object.entries(item.memberStatus)) {
      database.planCompletions.push({
        planItemId: item.id,
        userId,
        completed,
      });
    }
  }

  for (const material of group.materials) {
    const uploader =
      database.users.find((user) => user.name === material.uploadedBy) ??
      database.users.find((user) => user.id === getResolvedCurrentUserId());

    database.materials.push({
      id: material.id,
      groupId: group.id,
      uploaderId: uploader?.id ?? getResolvedCurrentUserId(),
      title: material.title,
      storagePath: "",
      mimeType: "application/octet-stream",
      format: material.format,
      uploadedAt: material.uploadedAt,
      summary: material.summary,
      processingStatus: material.processingStatus ?? "ready",
      locationHint: material.locationHint,
    });

    database.materialChunks.push({
      id: `${material.id}-chunk-0`,
      materialId: material.id,
      chunkIndex: 0,
      text: `${material.title}\n${material.summary}`,
      locationHint: material.locationHint,
    });
  }

  for (const message of group.chat) {
    database.chatMessages.push({
      id: message.id,
      groupId: group.id,
      userId: message.role === "user" ? getResolvedCurrentUserId() : "assistant",
      role: message.role,
      text: message.text,
      createdAt: new Date().toISOString(),
      sources: message.sources ?? [],
    });
  }
}

function scoreChunk(question: string, chunk: StoredMaterialChunk) {
  const questionTokens = new Set(tokenize(question));
  const chunkTokens = new Set(tokenize(chunk.text));
  let score = 0;

  questionTokens.forEach((token) => {
    if (chunkTokens.has(token)) {
      score += 1;
    }
  });

  return score;
}

function pickRelevantChunks(question: string, chunks: StoredMaterialChunk[]) {
  const ranked = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(question, chunk) }))
    .sort((left, right) => right.score - left.score);

  const meaningful = ranked.filter((entry) => entry.score > 0).map((entry) => entry.chunk);
  return (meaningful.length > 0 ? meaningful : ranked.map((entry) => entry.chunk)).slice(
    0,
    MAX_SOURCE_CHUNKS,
  );
}

function buildSourceCards(
  database: PrototypeDatabase,
  chunks: StoredMaterialChunk[],
): SourceCardDto[] {
  return chunks.map((chunk) => {
    const material = database.materials.find((entry) => entry.id === chunk.materialId);

    return {
      materialId: chunk.materialId,
      title: material?.title ?? "자료",
      locationHint: chunk.locationHint,
      snippet: chunk.text.slice(0, 180),
    };
  });
}

function buildFallbackAnswer(question: string, sources: SourceCardDto[]) {
  if (sources.length === 0) {
    return `질문 "${question}"와 직접적으로 맞는 자료를 아직 찾지 못했습니다.\n다른 표현으로 다시 질문하거나 자료를 더 업로드해 주세요.`;
  }

  const summary = sources
    .map((source) => `${source.title} (${source.locationHint})의 내용을 보면 ${source.snippet}`)
    .join("\n");

  return `업로드된 자료를 기준으로 정리하면 다음과 같습니다.\n${summary}\n필요하면 이 내용을 더 짧게 요약하거나 예상 문제 형태로 바꿔드릴 수 있어요.`;
}

async function generateOpenAiAnswer(question: string, sources: SourceCardDto[]) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || sources.length === 0) {
    return null;
  }

  const context = sources
    .map(
      (source, index) =>
        `[자료 ${index + 1}] ${source.title} / ${source.locationHint}\n${source.snippet}`,
    )
    .join("\n\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You answer in Korean. Only use the provided study material context. If the answer is not grounded in the context, say you could not find it in the materials.",
        },
        {
          role: "user",
          content: `질문: ${question}\n\n자료 근거:\n${context}\n\n2~4문장으로 간결하게 답하고, 과장하지 마세요.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return payload.choices?.[0]?.message?.content?.trim() ?? null;
}

async function writeUploadToDisk(groupId: string, fileName: string, buffer: Buffer) {
  const groupDirectory = path.join(UPLOAD_DIRECTORY, groupId);
  await mkdir(groupDirectory, { recursive: true });
  const storageName = `${Date.now()}-${sanitizeFileName(fileName)}`;
  const storagePath = path.join(groupDirectory, storageName);
  await writeFile(storagePath, buffer);
  return storagePath;
}

export async function getGroupsResponse(): Promise<GroupsResponse> {
  const database = await loadDatabase();

  return {
    currentUserId: getResolvedCurrentUserId(),
    groups: getStudyGroups(database),
  };
}

export async function createGroupRecord(
  payload: CreateGroupRequest,
): Promise<GroupsResponse["groups"][number]> {
  return withWriteLock(async () => {
    const database = await loadDatabase();
    const group = createGroupFromInput(payload.input as CreateGroupInput);
    upsertGroupFromStudyGroup(database, group);
    await saveDatabase(database);
    return group;
  });
}

export async function mutatePlan(
  groupId: string,
  mutation: PlanMutationRequest,
): Promise<PlanMutationResponse> {
  return withWriteLock(async () => {
    const database = await loadDatabase();
    const userId = getResolvedCurrentUserId();
    ensureMembership(database, groupId, userId);

    if (mutation.type === "toggle") {
      const completion = database.planCompletions.find(
        (entry) => entry.planItemId === mutation.itemId && entry.userId === userId,
      );

      if (completion) {
        completion.completed = !completion.completed;
      } else {
        database.planCompletions.push({
          planItemId: mutation.itemId,
          userId,
          completed: true,
        });
      }
    }

    if (mutation.type === "update") {
      const target = database.planItems.find(
        (entry) => entry.groupId === groupId && entry.id === mutation.itemId,
      );

      if (!target) {
        throw new Error("수정할 계획 항목을 찾지 못했습니다.");
      }

      target.day = mutation.updates.day;
      target.title = mutation.updates.title.trim();
      target.detail = mutation.updates.detail.trim();
      target.duration = mutation.updates.duration.trim();
    }

    if (mutation.type === "add") {
      const groupMembers = database.groupMembers
        .filter((entry) => entry.groupId === groupId)
        .map((entry) => entry.userId);
      const planItemId = `plan-custom-${Date.now().toString(36)}`;

      database.planItems.push({
        id: planItemId,
        groupId,
        day: mutation.item.day,
        title: mutation.item.title.trim(),
        detail: mutation.item.detail.trim(),
        duration: mutation.item.duration.trim(),
      });

      for (const memberId of groupMembers) {
        database.planCompletions.push({
          planItemId,
          userId: memberId,
          completed: false,
        });
      }
    }

    const group = getGroupById(database, groupId);
    if (group) {
      group.recentUpdate = "학습 계획이 실제 데이터로 갱신됨";
    }

    await saveDatabase(database);

    const nextGroup = getStudyGroup(database, groupId);
    if (!nextGroup) {
      throw new Error("계획 변경 후 그룹을 다시 불러오지 못했습니다.");
    }

    return { group: nextGroup };
  });
}

function toMaterialDto(database: PrototypeDatabase, material: StoredMaterial): MaterialDto {
  return {
    id: material.id,
    groupId: material.groupId,
    title: material.title,
    summary: material.summary,
    uploadedBy: getUserById(database, material.uploaderId)?.name ?? "알 수 없음",
    uploadedAt: material.uploadedAt,
    format: material.format,
    locationHint: material.locationHint,
    processingStatus: material.processingStatus,
  };
}

export async function getMaterials(groupId: string): Promise<MaterialListResponse> {
  const database = await loadDatabase();
  ensureMembership(database, groupId, getResolvedCurrentUserId());

  return {
    groupId,
    materials: database.materials
      .filter((material) => material.groupId === groupId)
      .sort((left, right) => {
        return new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime();
      })
      .map((material) => toMaterialDto(database, material)),
  };
}

export async function uploadMaterial(groupId: string, file: File): Promise<MaterialDto> {
  return withWriteLock(async () => {
    const database = await loadDatabase();
    const userId = getResolvedCurrentUserId();
    ensureMembership(database, groupId, userId);

    if (!isSupportedUpload(file.name, file.type)) {
      throw new Error("현재는 텍스트 기반 문서와 PDF만 업로드할 수 있습니다.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const materialId = `mat-${randomUUID()}`;
    const uploadedAt = new Date().toISOString();
    const format = inferMaterialFormat(file.name);
    const storagePath = await writeUploadToDisk(groupId, file.name, buffer);

    const materialRecord: StoredMaterial = {
      id: materialId,
      groupId,
      uploaderId: userId,
      title: file.name,
      storagePath,
      mimeType: file.type || "application/octet-stream",
      format,
      uploadedAt,
      summary: "문서를 처리 중입니다.",
      processingStatus: "processing",
      locationHint: "업로드 직후",
    };

    database.materials.unshift(materialRecord);
    await saveDatabase(database);

    try {
      const extractedText = await extractTextFromFile(file.name, file.type, buffer);
      const chunks = chunkText(file.name, extractedText);

      materialRecord.summary = summarizeText(file.name, extractedText);
      materialRecord.processingStatus = chunks.length > 0 ? "ready" : "failed";
      materialRecord.locationHint =
        chunks[0]?.locationHint ?? (materialRecord.processingStatus === "failed" ? "추출 실패" : "본문 1");

      database.materialChunks = database.materialChunks.filter(
        (chunk) => chunk.materialId !== materialId,
      );

      for (const [index, chunk] of chunks.entries()) {
        database.materialChunks.push({
          id: `${materialId}-chunk-${index}`,
          materialId,
          chunkIndex: index,
          text: chunk.text,
          locationHint: chunk.locationHint,
        });
      }

      const group = getGroupById(database, groupId);
      if (group) {
        group.recentUpdate = `${file.name} 자료가 실제 업로드됨`;
      }
    } catch {
      materialRecord.summary = "문서 텍스트를 추출하지 못했습니다. 다른 자료를 업로드해 주세요.";
      materialRecord.processingStatus = "failed";
      materialRecord.locationHint = "처리 실패";
    }

    await saveDatabase(database);
    return toMaterialDto(database, materialRecord);
  });
}

export async function getChat(groupId: string): Promise<ChatListResponse> {
  const database = await loadDatabase();
  ensureMembership(database, groupId, getResolvedCurrentUserId());

  return {
    groupId,
    messages: database.chatMessages
      .filter((message) => message.groupId === groupId)
      .sort((left, right) => {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      })
      .map((message) => ({
        id: message.id,
        role: message.role,
        text: message.text,
        createdAt: formatChatTimestamp(message.createdAt),
        sources: message.sources,
      })),
  };
}

export async function askQuestion(
  groupId: string,
  payload: AskQuestionRequest,
): Promise<ChatAnswerDto> {
  return withWriteLock(async () => {
    const database = await loadDatabase();
    const userId = getResolvedCurrentUserId();
    ensureMembership(database, groupId, userId);

    const question = payload.question.trim();
    if (!question) {
      throw new Error("질문 내용을 입력해 주세요.");
    }

    const now = new Date().toISOString();
    const userMessageRecord: StoredChatMessage = {
      id: `chat-user-${randomUUID()}`,
      groupId,
      userId,
      role: "user",
      text: question,
      createdAt: now,
      sources: [],
    };

    database.chatMessages.push(userMessageRecord);

    const groupMaterials = database.materials.filter(
      (material) => material.groupId === groupId && material.processingStatus === "ready",
    );
    const relevantChunks = pickRelevantChunks(
      question,
      database.materialChunks.filter((chunk) =>
        groupMaterials.some((material) => material.id === chunk.materialId),
      ),
    );
    const sources = buildSourceCards(database, relevantChunks);
    const openAiAnswer = await generateOpenAiAnswer(question, sources);
    const answerText = openAiAnswer ?? buildFallbackAnswer(question, sources);
    const assistantSources = sources.map((source) => ({
      id: `${source.materialId}-${source.locationHint}`,
      materialId: source.materialId,
      title: source.title,
      locationHint: source.locationHint,
      summary: source.snippet,
    }));

    const assistantMessageRecord: StoredChatMessage = {
      id: `chat-assistant-${randomUUID()}`,
      groupId,
      userId: "assistant",
      role: "assistant",
      text: answerText,
      createdAt: new Date().toISOString(),
      sources: assistantSources,
    };

    database.chatMessages.push(assistantMessageRecord);

    const group = getGroupById(database, groupId);
    if (group) {
      group.recentUpdate = "자료 기반 AI 질문이 실제 응답으로 갱신됨";
    }

    await saveDatabase(database);

    return {
      answer: answerText,
      sources,
      userMessage: {
        id: userMessageRecord.id,
        role: "user",
        text: userMessageRecord.text,
        createdAt: formatChatTimestamp(userMessageRecord.createdAt),
      },
      assistantMessage: {
        id: assistantMessageRecord.id,
        role: "assistant",
        text: assistantMessageRecord.text,
        createdAt: formatChatTimestamp(assistantMessageRecord.createdAt),
        sources: assistantSources,
      },
    };
  });
}

export async function getHomeDashboard(): Promise<HomeDashboardResponse> {
  const database = await loadDatabase();
  const userId = getResolvedCurrentUserId();
  const myGroupIds = new Set(
    database.groupMembers
      .filter((groupMember) => groupMember.userId === userId)
      .map((groupMember) => groupMember.groupId),
  );
  const myGroups = database.groups.filter((group) => myGroupIds.has(group.id));

  const homeGroups = myGroups
    .map((group) => {
      const items = database.planItems.filter((item) => item.groupId === group.id);
      const todayTaskCount = items.filter((item) => {
        const completion = database.planCompletions.find(
          (entry) => entry.planItemId === item.id && entry.userId === userId,
        );

        return !completion?.completed;
      }).length;

      return {
        id: group.id,
        name: group.name,
        subject: group.subject,
        examDate: group.examDate,
        daysLeft: getDaysLeft(group.examDate),
        todayTaskCount,
      };
    })
    .sort((left, right) => left.daysLeft - right.daysLeft);

  const todayTasks = database.planItems
    .filter((item) => myGroupIds.has(item.groupId))
    .filter((item) => {
      const completion = database.planCompletions.find(
        (entry) => entry.planItemId === item.id && entry.userId === userId,
      );

      return !completion?.completed;
    })
    .slice(0, 4)
    .map((item) => {
      const group = database.groups.find((entry) => entry.id === item.groupId);

      return {
        id: item.id,
        groupId: item.groupId,
        groupName: group?.name ?? "스터디",
        subject: group?.subject ?? "",
        day: item.day,
        title: item.title,
        duration: item.duration,
      };
    });

  const recentMaterials = database.materials
    .filter((material) => myGroupIds.has(material.groupId))
    .sort((left, right) => {
      return new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime();
    })
    .slice(0, 3)
    .map((material) => {
      const group = database.groups.find((entry) => entry.id === material.groupId);

      return {
        id: material.id,
        groupId: material.groupId,
        groupName: group?.name ?? "스터디",
        title: material.title,
        summary: material.summary,
        uploadedAt: material.uploadedAt,
        locationHint: material.locationHint,
      };
    });

  return {
    currentUserId: userId,
    myGroups: homeGroups,
    todayTasks,
    dDayGroups: homeGroups.map((group) => ({
      id: group.id,
      name: group.name,
      examDate: group.examDate,
      daysLeft: group.daysLeft,
    })),
    recentMaterials,
  };
}
