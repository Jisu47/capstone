import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const key = "study_flow_hidden_group_ids";
const source = ts.transpileModule(
  readFileSync(new URL("./hidden-groups.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function fixture(metadata = {}, id = "alice") {
  const user = { id, user_metadata: structuredClone(metadata) };
  const writes = [];
  const state = { readError: null, writeError: null };
  const auth = {
    getUser: async () => ({ data: { user }, error: state.readError }),
    updateUser: async ({ data }) => {
      writes.push(data);
      if (!state.writeError) Object.assign(user.user_metadata, data);
      return { data: { user }, error: state.writeError };
    },
  };
  const exports = {};
  runInNewContext(source, {
    exports,
    require: (name) => {
      assert.equal(name, "@/lib/supabase/browser");
      return { getSupabaseBrowserClient: () => ({ auth }) };
    },
  });
  return { ...exports, user, writes, state };
}

test("hiding persists and restores only one personal preference", async () => {
  const alice = fixture({ display_name: "Alice", [key]: ["other-group"] });
  const bob = fixture({}, "bob");
  await alice.saveGroupHidden("alice", "completed-group", true);
  assert.deepEqual([...await alice.loadHiddenGroupIds("alice")], ["other-group", "completed-group"]);
  assert.deepEqual([...await bob.loadHiddenGroupIds("bob")], []);
  assert.deepEqual(Object.keys(alice.writes[0]), [key]);
  assert.equal(alice.user.user_metadata.display_name, "Alice");
  await alice.saveGroupHidden("alice", "completed-group", false);
  assert.deepEqual([...await alice.loadHiddenGroupIds("alice")], ["other-group"]);
});

test("repeated hiding is idempotent and merges the latest stored preference", async () => {
  const client = fixture({ [key]: ["a", "a", 7, null, ""] });
  assert.deepEqual([...await client.loadHiddenGroupIds("alice")], ["a"]);
  client.user.user_metadata[key] = ["a", "another-device-group"];
  await client.saveGroupHidden("alice", "a", true);
  assert.deepEqual([...await client.loadHiddenGroupIds("alice")], ["a", "another-device-group"]);
});

test("another account or failed load cannot write preferences", async () => {
  const client = fixture();
  await assert.rejects(client.saveGroupHidden("bob", "a", true), /로그인/);
  client.state.readError = new Error("offline");
  await assert.rejects(client.saveGroupHidden("alice", "a", true), /불러오지/);
  assert.equal(client.writes.length, 0);
});

test("failed saving keeps the existing preference and reports failure", async () => {
  const client = fixture({ [key]: ["a"] });
  client.state.writeError = new Error("network failure");
  await assert.rejects(client.saveGroupHidden("alice", "b", true), /저장하지/);
  assert.deepEqual([...await client.loadHiddenGroupIds("alice")], ["a"]);
});
