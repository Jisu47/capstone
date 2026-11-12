import type { PreviewItem } from "./design-preview-v2-screen";
import styles from "./preview.module.css";

type OverviewGroup = {
  title: string;
  items: readonly { name: PreviewItem }[];
};

function OverviewSample({ item }: { item: PreviewItem }) {
  switch (item) {
    case "Colors":
      return <span className={styles.indexColors}><i /><i /><i /></span>;
    case "Typography":
      return <span className={styles.indexType}>Aa</span>;
    case "Button":
      return <span className={styles.indexButton}>시작하기</span>;
    case "Input":
      return <span className={styles.indexInput}>목표를 입력하세요</span>;
  }

  return (
    <svg width="76" height="34" viewBox="0 0 76 34" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      {item === "Spacing" && <><path d="M2 7v20M74 7v20M17 17h42M21 13l-4 4 4 4M55 13l4 4-4 4" /><path d="M5 7h8v20H5zM63 7h8v20h-8z" fill="currentColor" fillOpacity=".08" stroke="none" /></>}
      {item === "Radius" && <rect x="2" y="2" width="48" height="30" rx="10" />}
      {item === "Border" && <rect x="2" y="2" width="48" height="30" rx="2" strokeWidth="1.8" />}
      {item === "Card" && <><rect x="2" y="2" width="60" height="30" rx="4" /><path d="M10 11h22M10 18h43M10 24h32" /></>}
      {item === "Modal" && <><rect x="2" y="2" width="58" height="27" rx="3" opacity=".4" /><rect x="15" y="9" width="47" height="23" rx="3" fill="white" /><path d="M23 17h23M43 25h11" /></>}
      {item === "Tabs" && <><path d="M2 26h72M3 25h22" /><path d="M5 10h16M30 10h16M55 10h16" strokeWidth="3" opacity=".5" /></>}
    </svg>
  );
}

const descriptions: Record<PreviewItem, string> = {
  Colors: "색상과 배경",
  Typography: "제목과 본문의 위계",
  Spacing: "요소 사이의 간격",
  Radius: "모서리의 곡률",
  Border: "영역을 구분하는 선",
  Button: "주요 행동과 선택",
  Input: "텍스트 입력",
  Card: "연관된 정보의 묶음",
  Modal: "선택에 집중하는 패널",
  Tabs: "내용을 전환하는 탐색",
};

export function PreviewOverview({ groups, onSelect }: {
  groups: readonly OverviewGroup[];
  onSelect: (item: PreviewItem) => void;
}) {
  return (
    <div className={styles.overviewIndex}>
      {groups.map((group) => (
        <section key={group.title} aria-labelledby={`overview-${group.title}`}>
          <h2 id={`overview-${group.title}`} className={styles.indexGroupTitle}>{group.title}</h2>
          <div className={styles.indexGrid}>
            {group.items.map(({ name }) => (
              <button key={name} type="button" className={styles.indexItem} onClick={() => onSelect(name)} aria-label={`${name} 상세 보기`} aria-controls="v2-detail">
                <span className={styles.indexName}>{name}</span>
                <span className={styles.indexSample} aria-hidden="true"><OverviewSample item={name} /></span>
                <span className={styles.indexDescription}>{descriptions[name]}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
