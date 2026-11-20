"use client";

import { useState } from "react";
import { colorStyle } from "./color-tokens";
import { PreviewExample } from "./preview-example";
import { PreviewOverview } from "./preview-overview";
import styles from "./preview.module.css";

const groups = [
  {
    title: "Foundations",
    items: [
      { name: "Colors", description: "흰 바탕에 녹색 한 가지. 필요한 곳에만 색을 더합니다." },
      { name: "Typography", description: "제목과 본문의 위계로 정보를 차분하게 정리합니다." },
      { name: "Spacing", description: "정보 사이의 여백으로 읽는 흐름을 만듭니다." },
      { name: "Radius", description: "카드의 부드러운 모서리를 가볍게 살펴봅니다." },
      { name: "Border", description: "얇은 선으로 영역과 정보의 경계를 구분합니다." },
    ],
  },
  {
    title: "Components",
    items: [
      { name: "Button", description: "주요 행동과 보조 행동을 간결하게 구분합니다." },
      { name: "Input", description: "명확한 라벨과 편안한 간격으로 내용을 입력합니다." },
      { name: "Card", description: "연관된 정보를 하나의 작은 블록에 담습니다." },
      { name: "Modal", description: "하나의 선택에 집중할 수 있는 대화상자 예시입니다." },
      { name: "Tabs", description: "같은 맥락의 내용을 가볍게 오가며 확인합니다." },
    ],
  },
] as const;

export type PreviewItem = (typeof groups)[number]["items"][number]["name"];

export function DesignPreviewV2Screen() {
  const [selected, setSelected] = useState<PreviewItem | "Overview">("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const group = groups.find((entry) => entry.items.some((item) => item.name === selected));
  const item = group?.items.find((entry) => entry.name === selected);

  function openDetails(name: PreviewItem | "Overview") {
    setSelected(name);
    requestAnimationFrame(() => {
      document.getElementById("v2-title")?.focus({ preventScroll: true });
      document.getElementById("v2-detail")?.scrollIntoView({ block: "start" });
    });
  }

  return (
    <div className={styles.root} style={colorStyle}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeading}>
            <button
              type="button"
              className={styles.sidebarToggle}
              aria-label={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
              title={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
              aria-expanded={sidebarOpen}
              aria-controls="v2-sidebar"
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <rect x="2" y="3" width="16" height="14" rx="2" />
                <path d="M7 3v14" />
                <path d={sidebarOpen ? "m13 7-3 3 3 3" : "m11 7 3 3-3 3"} />
              </svg>
            </button>
            <div className={styles.brand}>STUDY FLOW <span>Design system</span></div>
          </div>
          <span className={styles.version}>Foundations / Components</span>
        </div>
      </header>

      <div className={sidebarOpen ? styles.layout : `${styles.layout} ${styles.sidebarCollapsed}`}>
        <aside id="v2-sidebar" className={styles.sidebar} hidden={!sidebarOpen}>
          <p className={styles.sidebarTitle}>Explore the essentials</p>
          <nav aria-label="디자인 요소 탐색">
            <div className={`${styles.navItems} ${styles.overviewNav}`}>
              <button
                type="button"
                aria-current={selected === "Overview" ? "true" : undefined}
                aria-controls="v2-detail"
                onClick={() => setSelected("Overview")}
              >
                Overview
              </button>
            </div>
            {groups.map((entry) => (
              <div className={styles.navGroup} key={entry.title}>
                <h2>{entry.title}</h2>
                <div className={styles.navItems}>
                  {entry.items.map((entryItem) => (
                    <button
                      key={entryItem.name}
                      type="button"
                      aria-current={selected === entryItem.name ? "true" : undefined}
                      aria-controls="v2-detail"
                      onClick={() => setSelected(entryItem.name)}
                    >
                      {entryItem.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <p className={styles.sidebarNote}>작은 요소부터,<br />하나씩 살펴보세요.</p>
        </aside>

        <main id="v2-detail" className={styles.main} aria-labelledby="v2-title">
          <div className={styles.breadcrumb}>
            {selected !== "Overview" && <><button type="button" className={styles.overviewBack} onClick={() => openDetails("Overview")}>← Overview</button><span aria-hidden="true">/</span></>}
            {group && <>{group.title}<span aria-hidden="true">/</span></>}{selected}
          </div>
          <div className={selected === "Overview" ? `${styles.intro} ${styles.overviewIntro}` : styles.intro}>
            <p className={styles.eyebrow}>STUDY FLOW DESIGN SYSTEM</p>
            <h1 id="v2-title" tabIndex={-1}>{selected === "Overview" ? "Design System Overview" : selected}</h1>
            <p>{item?.description ?? "Foundations와 Components를 한눈에 확인하고 각 요소의 상세 페이지로 이동할 수 있습니다."}</p>
          </div>

          {selected === "Overview" ? (
            <PreviewOverview groups={groups} onSelect={openDetails} />
          ) : (
          <section aria-labelledby="v2-preview-title">
            <div className={styles.sectionHeading}>
              <h2 id="v2-preview-title">Preview</h2>
              <span>간단한 적용 예시</span>
            </div>
            <div className={styles.stage}>
              <PreviewExample key={selected} item={selected} />
            </div>
          </section>
          )}

          <footer className={styles.footer}>
            <span>흰 바탕, 녹색의 포인트, 여백의 균형.</span>
            <span>Study Flow의 공식 UI 기준입니다.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
