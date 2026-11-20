"use client";
import { PlanAgentScreen } from "@/components/plan-agent-screen";
import { PlanFlowScreen } from "@/components/plan-screen";
import { MaterialsScreen } from "@/components/materials-screen";
import { GroupHomeScreen } from "@/components/group-home-screen";
import { DemoProvider } from "./demo-adapter";
import { demoGroupId } from "./demo-data";
export function PresentationPreviewScreen({ screen }: { screen: "plan" | "materials" | "todo" | "review" | "group" }) {
  return <DemoProvider><span className="presentation-demo-note">Preview with sample data</span>{screen === "plan" ? <PlanAgentScreen groupId={demoGroupId} /> : screen === "materials" ? <MaterialsScreen groupId={demoGroupId} /> : screen === "group" ? <GroupHomeScreen groupId={demoGroupId} /> : <PlanFlowScreen groupId={demoGroupId} />}</DemoProvider>;
}
