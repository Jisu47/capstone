/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const OpenAI = require("openai").default;

// Use the real SDK with an in-memory HTTP transport. No keys, network or database access.
function harness(replies, env = { OPENAI_API_KEY: "test-placeholder" }, overrides = {}) {
  const calls = [];
  const cache = new Map();
  class TestOpenAI extends OpenAI {
    constructor(options) {
      super({ ...options, fetch: async (url, init) => {
        calls.push({ url: String(url), body: JSON.parse(init.body) });
        assert.ok(replies.length, "Unexpected extra API call");
        const reply = replies.shift();
        if (reply instanceof Error) throw reply;
        return Response.json(reply.body ?? reply, { status: reply.httpStatus ?? 200 });
      } });
      assert.equal(options.maxRetries, 0);
    }
  }
  function load(relative) {
    const filename = path.resolve(relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = new Module(filename, module);
    cache.set(filename, mod);
    const originalRequire = Module.createRequire(filename);
    mod.require = (specifier) => {
      if (overrides[specifier]) return overrides[specifier];
      if (specifier === "server-only") return {};
      if (specifier === "openai") return TestOpenAI;
      if (specifier.startsWith("@/")) return load(`src/${specifier.slice(2)}.ts`);
      return originalRequire(specifier);
    };
    let source = readFileSync(filename, "utf8");
    // Isolate server env from the real process, including any locally configured secret.
    source = source.replaceAll("process.env", "__testEnv");
    const compiled = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
    } }).outputText;
    mod._compile(`const __testEnv = ${JSON.stringify(env)};\n${compiled}`, filename);
    return mod.exports;
  }
  return {
    calls,
    study: load("src/lib/server/study-ai.ts"),
    common: load("src/lib/server/openai.ts"),
    plan: load("src/lib/plan-flow.ts"),
    chatRoute: load("src/app/api/ai/chat/route.ts"),
    imageRoute: load("src/app/api/plan-reference/analyze/route.ts"),
    load,
  };
}

function response(text, status = "completed", reason = null) {
  return { object: "response", id: "resp_test", model: "gpt-5.4-mini", status,
    incomplete_details: reason ? { reason } : null,
    output: [{ type: "message", role: "assistant", status: "completed",
      content: [{ type: "output_text", text, annotations: [] }] }],
  };
}

const group = {
  id: "group-test", name: "스터디", subject: "수학", weeklyGoal: "복습", overallGoal: "완주",
  description: "학습", recentUpdate: "시작", planReferenceUploads: [], planReferenceUnits: [],
  materials: [{ title: "교재", summary: "함수", locationHint: "1단원" }], plan: [], roadmap: [],
};
const chat = (scope = "plan-agent") => ({ scope, question: "주간 계획을 만들어줘", history: [], group });
const image = { subject: "수학", fileName: "진도표.png", mimeType: "image/png", imageDataUrl: "data:image/png;base64,aW1hZ2U=" };
const draft = { scope: "weekly-plan", weeklyGoal: "함수 학습", recentUpdate: "주간 계획",
  weeklyPlan: ["월", "화", "수", "목", "금", "토", "일"].map((day) => ({ day, title: "함수 복습", detail: "문제 풀이", duration: "60분", referenceUnitSequence: 1 })),
};
const draftText = `이번 주 계획입니다.\n<<PLAN_AGENT_DRAFT>>\n${JSON.stringify(draft)}`;
const request = (payload) => new Request("http://localhost/api", { method: "POST", body: JSON.stringify(payload) });

test("plan route preserves preview draft, stored-message roundtrip and weekday/reference fields", async () => {
  const h = harness([response(draftText)]);
  const res = await h.chatRoute.POST(request(chat()));
  assert.equal(res.status, 200);
  const result = await res.json();
  assert.equal(result.text, "이번 주 계획입니다.");
  assert.equal(result.isComplete, true);
  assert.equal(result.planAgentDraft.weeklyPlan.length, 7);
  assert.equal(result.planAgentDraft.weeklyPlan[0].referenceUnitSequence, 1);
  const stored = h.plan.buildStoredPlanAgentMessage(result.text, result.planAgentDraft);
  assert.deepEqual(h.plan.parseStoredPlanAgentMessage(stored).draft, result.planAgentDraft);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].url, "https://api.openai.com/v1/responses");
  assert.equal(h.calls[0].body.store, false);
  assert.equal(h.calls[0].body.reasoning.effort, "none");
  assert.ok(!JSON.stringify(result).includes("test-placeholder"));
});

test("materials uses Responses once and retains existing context/history limits", async () => {
  const h = harness([response("자료를 기준으로 답변합니다.")]);
  const payload = chat("materials");
  payload.history = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", text: `기록 ${i}` }));
  payload.group = { ...group, materials: Array.from({ length: 10 }, (_, i) => ({ ...group.materials[0], title: `교재${i}` })) };
  const res = await h.chatRoute.POST(request(payload));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).planAgentDraft, null);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].body.input.length, 10); // Context + latest 8 history + question.
  assert.ok(!h.calls[0].body.input[0].content.includes("교재5"));
  assert.equal(h.calls[0].body.max_output_tokens, 384);
});

test("generated preview can be edited and applied through the unchanged Supabase repository", async () => {
  const writes = [];
  const client = { from(table) {
    const query = {
      select() { return this; },
      eq() { return this; },
      delete() { writes.push({ table, action: "delete" }); return this; },
      insert(rows) { writes.push({ table, action: "insert", rows }); return this; },
      update(rows) { writes.push({ table, action: "update", rows }); return this; },
      then(resolve, reject) { return Promise.resolve({ data: [], error: null }).then(resolve, reject); },
    };
    return query;
  } };
  const h = harness([response(draftText)], undefined, {
    "@/lib/supabase/browser": { getSupabaseBrowserClient: () => client },
  });
  const result = await h.study.generateAiAnswer(chat());
  const preview = result.planAgentDraft;
  preview.weeklyPlan[0].title = "직접 수정한 계획";
  const repository = h.load("src/lib/prototype-repository.ts");
  await repository.applyPrototypePlanAgentDraft(group.id, preview);
  const saved = writes.find((write) => write.table === "plan_items" && write.action === "insert").rows;
  assert.equal(saved.length, 7);
  assert.equal(saved[0].title, "직접 수정한 계획");
  assert.equal(saved[0].group_id, group.id);
  assert.equal(saved[0].reference_unit_sequence, 1);
  assert.deepEqual(saved.map((item) => item.day), ["월", "화", "수", "목", "금", "토", "일"]);
  assert.deepEqual(saved.map((item) => item.sort_order), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(writes.find((write) => write.table === "study_groups").rows.weekly_goal, draft.weeklyGoal);
  assert.ok(!writes.some((write) => write.table === "personal_plan_items")); // No change to personal Todo policy.
});

test("vision sends data URL and preserves ordered summary/units output", async () => {
  const h = harness([response("SUMMARY: 함수 학습\nUNIT: 1주차 || 함수 개념\nUNIT: 2주차 || 함수 문제")]);
  const res = await h.imageRoute.POST(request(image));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { summary: "함수 학습", units: [
    { label: "1주차", detail: "함수 개념" }, { label: "2주차", detail: "함수 문제" },
  ] });
  assert.equal(h.calls[0].body.input[0].content[1].image_url, image.imageDataUrl);
  assert.equal(h.calls.length, 1);
});

test("continuation merges raw split JSON before extracting the plan draft", async () => {
  const split = draftText.indexOf("함수 복습") + 2; // Split inside a JSON string.
  const h = harness([response(draftText.slice(0, split), "incomplete", "max_output_tokens"), response(draftText.slice(split))]);
  const result = await h.study.generateAiAnswer(chat());
  assert.equal(result.planAgentDraft.weeklyPlan[0].title, "함수 복습");
  assert.equal(result.isComplete, true);
  assert.equal(h.calls.length, 2);
});

test("repeated truncation is bounded and cannot expose an applicable incomplete draft", async () => {
  const h = harness(Array.from({ length: 3 }, () => response("아직 작성 중", "incomplete", "max_output_tokens")));
  const result = await h.study.generateAiAnswer(chat());
  assert.equal(result.isComplete, false);
  assert.equal(result.finishReason, "MAX_TOKENS");
  assert.equal(result.planAgentDraft, null);
  assert.equal(h.calls.length, 3);
});

test("missing key returns safe error without calling OpenAI", async () => {
  const h = harness([], {});
  for (const [route, payload] of [[h.chatRoute, chat()], [h.imageRoute, image]]) {
    const res = await route.POST(request(payload));
    assert.equal(res.status, 503);
    assert.ok(!(await res.text()).includes("OPENAI_API_KEY"));
  }
  assert.equal(h.calls.length, 0);
});

for (const status of [401, 403, 429, 500]) {
  test(`upstream ${status} is sanitized with no automatic retries`, async () => {
    const h = harness([{ httpStatus: status, body: { error: { message: "private-upstream-detail test-placeholder", type: "api_error" } } }]);
    const res = await h.chatRoute.POST(request(chat()));
    assert.equal(res.status, status === 429 ? 429 : status < 500 ? 503 : 502);
    assert.ok(!(await res.text()).includes("private-upstream-detail"));
    assert.equal(h.calls.length, 1);
  });
}

test("connection failures and unexpected/empty payloads produce safe responses", async () => {
  for (const reply of [new Error("private-network-detail"), {}, response(""), { ...response(""), status: "failed" }]) {
    const h = harness([reply]);
    const res = await h.chatRoute.POST(request(chat()));
    assert.equal(res.status, 502);
    assert.ok(!(await res.text()).includes("private-network-detail"));
    assert.equal(h.calls.length, 1);
  }
});

test("malformed drafts and image analysis do not return successful broken data", async () => {
  const h = harness([response("계획\n<<PLAN_AGENT_DRAFT>>\n{broken}"), response("잘 모르겠어요"), response("UNIT: 1주차 || 함수", "incomplete", "max_output_tokens")]);
  assert.equal((await h.chatRoute.POST(request(chat()))).status, 502);
  assert.equal((await h.imageRoute.POST(request(image))).status, 502);
  assert.equal((await h.imageRoute.POST(request(image))).status, 502);
});

test("refusals are handled without passing upstream content to the user", async () => {
  const reply = response("");
  reply.output[0].content = [{ type: "refusal", refusal: "private-refusal" }];
  const h = harness([reply]);
  const res = await h.chatRoute.POST(request(chat()));
  assert.equal(res.status, 422);
  assert.ok(!(await res.text()).includes("private-refusal"));
});

test("invalid input and malformed JSON are rejected without paid calls", async () => {
  const h = harness([]);
  assert.equal((await h.chatRoute.POST(request({}))).status, 400);
  assert.equal((await h.chatRoute.POST(request({ ...chat(), question: " " }))).status, 400);
  assert.equal((await h.chatRoute.POST(request({ ...chat(), history: [null] }))).status, 400);
  assert.equal((await h.chatRoute.POST(new Request("http://localhost/api", { method: "POST", body: "{" }))).status, 400);
  assert.equal((await h.imageRoute.POST(request({ ...image, imageDataUrl: "https://invalid/image.png" }))).status, 400);
  assert.equal((await h.imageRoute.POST(request({ ...image, mimeType: "image/svg+xml" }))).status, 400);
  assert.equal(h.calls.length, 0);
});
