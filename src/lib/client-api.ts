import type {
  AppErrorResponse,
  AskQuestionRequest,
  ChatAnswerDto,
  ChatListResponse,
  CreateGroupRequest,
  GroupsResponse,
  HomeDashboardResponse,
  MaterialDto,
  MaterialListResponse,
  PlanMutationRequest,
  PlanMutationResponse,
} from "@/lib/api-contracts";

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  const payload = (await response.json().catch(() => null)) as AppErrorResponse | null;
  throw new Error(payload?.error ?? "요청을 처리하지 못했습니다.");
}

export async function fetchGroups() {
  const response = await fetch("/api/groups", { cache: "no-store" });
  return parseResponse<GroupsResponse>(response);
}

export async function createGroup(request: CreateGroupRequest) {
  const response = await fetch("/api/groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  return parseResponse<GroupsResponse["groups"][number]>(response);
}

export async function mutatePlan(groupId: string, request: PlanMutationRequest) {
  const response = await fetch(`/api/groups/${groupId}/plan`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  return parseResponse<PlanMutationResponse>(response);
}

export async function fetchHomeDashboard() {
  const response = await fetch("/api/home", { cache: "no-store" });
  return parseResponse<HomeDashboardResponse>(response);
}

export async function fetchMaterials(groupId: string) {
  const response = await fetch(`/api/groups/${groupId}/materials`, {
    cache: "no-store",
  });
  return parseResponse<MaterialListResponse>(response);
}

export async function uploadMaterial(groupId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/groups/${groupId}/materials`, {
    method: "POST",
    body: formData,
  });

  return parseResponse<MaterialDto>(response);
}

export async function fetchChat(groupId: string) {
  const response = await fetch(`/api/groups/${groupId}/chat`, {
    cache: "no-store",
  });
  return parseResponse<ChatListResponse>(response);
}

export async function askQuestion(groupId: string, request: AskQuestionRequest) {
  const response = await fetch(`/api/groups/${groupId}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  return parseResponse<ChatAnswerDto>(response);
}
