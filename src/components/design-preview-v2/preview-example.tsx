"use client";

import { useState } from "react";
import { colorSwatches } from "./color-tokens";
import type { PreviewItem } from "./design-preview-v2-screen";
import styles from "./preview.module.css";

function StudyCard() {
  return (
    <article className={styles.card}>
      <p className={styles.kicker}>이번 주 학습</p>
      <h3>조금씩, 꾸준히 쌓아가는 공부</h3>
      <p>오늘의 목표를 정하고 함께 학습을 이어가세요.</p>
      <div className={styles.cardBottom}><span>읽기 · 정리 · 복습</span><span className={styles.greenText}>주간 계획</span></div>
    </article>
  );
}

export function PreviewExample({ item }: { item: PreviewItem }) {
  const [tab, setTab] = useState("이번 주");

  switch (item) {
    case "Colors":
      return (
        <div className={styles.exampleStack}>
          <div className={styles.swatches}>
            {colorSwatches.map(([name, color, relatedTokens]) => (
              <div key={name} title={relatedTokens}>
                <div className={styles.swatch} style={{ background: color }} />
                <strong>{name}</strong><span>{color}</span>
              </div>
            ))}
          </div>
          <div className={styles.contextLabel}>화면에 적용하면</div>
          <StudyCard />
        </div>
      );
    case "Typography":
      return <div className={styles.typeExample}><p className={styles.kicker}>함께 만드는 학습 습관</p><h2>오늘의 작은 공부가<br />내일의 나를 만듭니다.</h2><p>이번 주에 배우고 싶은 내용을 정리해 보세요.<br />목표가 선명해지면 다음 걸음도 가벼워집니다.</p><small>목표는 작게, 실천은 꾸준하게.</small></div>;
    case "Spacing":
      return <div className={styles.exampleStack}>{[8, 12, 16, 24, 32].map((space) => <div className={styles.measureRow} key={space}><span>{space} px</span><div className={styles.measure} style={{ width: space * 4 }} /></div>)}</div>;
    case "Radius":
      return <div className={styles.radiusGrid}>{[8, 12, 16].map((radius) => <div key={radius} className={styles.radiusSample} style={{ borderRadius: radius }}><span>{radius} px</span></div>)}</div>;
    case "Border":
      return <div className={styles.exampleStack}><div className={styles.borderSample}>얇은 테두리로 묶인 정보</div><div className={styles.dividerSample}><span>첫 번째 정보</span><span>구분선 다음의 정보</span></div></div>;
    case "Button":
      return <div className={styles.buttonRow}><button type="button" className={styles.primary}>계획 시작하기</button><button type="button" className={styles.secondary}>자세히 보기</button><button type="button" className={styles.primary} disabled>준비 중</button></div>;
    case "Input":
      return <div className={styles.inputExample}><label htmlFor="v2-goal">학습 목표</label><input id="v2-goal" placeholder="이번 주에 무엇을 공부할까요?" /><p>가볍게 시작할 수 있는 목표를 적어보세요.</p></div>;
    case "Card":
      return <div className={styles.serviceWidth}><StudyCard /></div>;
    case "Modal":
      return <div className={styles.serviceWidth}><p className={styles.contextLabel}>대화상자 형태 예시</p><div className={styles.card}><h3>이번 주 계획을 시작할까요?</h3><p>작은 목표부터 하나씩 실천해 보세요.</p><div className={styles.modalActions}><button type="button" className={styles.secondary}>나중에</button><button type="button" className={styles.primary}>시작하기</button></div></div></div>;
    case "Tabs":
      return <div className={styles.serviceWidth}><div className={styles.tabs} aria-label="주간 계획 예시">{["이번 주", "다음 주"].map((name) => <button type="button" key={name} aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</button>)}</div><div className={styles.tabContent}><h3>{tab} 학습 계획</h3><p>{tab === "이번 주" ? "개념을 읽고, 나만의 언어로 정리하기" : "배운 내용을 복습하고, 연습 문제 풀기"}</p></div></div>;
  }
}
