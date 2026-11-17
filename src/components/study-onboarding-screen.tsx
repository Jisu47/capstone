"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./study-onboarding-screen.module.css";

const slides = [
  {
    image: "welcome.png",
    width: 1179,
    height: 2556,
    label: "Study Flow 시작 화면",
  },
  {
    image: "study.png",
    width: 852,
    height: 1846,
    label: "스터디 관리",
    caption: ["체계적인 스터디 관리와", "함께 성장하는 즐거움"],
  },
  {
    image: "progress.png",
    width: 852,
    height: 1846,
    label: "학습 성장",
    headline: ["Keep going,", "with Study Flow"],
    caption: [
      "오늘도 꾸준히 성장하는 너를 위해",
      "스터디 플로우가 함께할게요",
    ],
  },
];

export function StudyOnboardingScreen() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  function goToSlide(index: number) {
    const carousel = carouselRef.current;
    if (!carousel || index < 0 || index >= slides.length) return;

    carousel.scrollTo({ left: carousel.clientWidth * index });
  }

  function handleCarouselKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    goToSlide(activeSlide + (event.key === "ArrowLeft" ? -1 : 1));
  }

  return (
    <main className={styles.screen} data-active-slide={activeSlide + 1}>
      <div className={styles.backdrop} aria-hidden="true" />
      <h1 className="sr-only">Study Flow</h1>
      <div className={styles.layout}>
        <div
          ref={carouselRef}
          className={styles.carousel}
          role="region"
          aria-label="Study Flow 소개 슬라이드"
          tabIndex={0}
          onKeyDown={handleCarouselKey}
          onScroll={({ currentTarget }) => {
            const nearest = Math.round(
              currentTarget.scrollLeft / currentTarget.clientWidth,
            );
            setActiveSlide(Math.max(0, Math.min(slides.length - 1, nearest)));
          }}
        >
          {slides.map((slide, index) => (
            <section
              key={slide.image}
              className={styles.slide}
              data-slide={index + 1}
              aria-label={slide.label}
              aria-hidden={index !== activeSlide}
            >
              {slide.headline && (
                <div className={styles.signature}>
                  <div className={styles.lotus}>
                    <Image
                      src={`/study-onboarding/${slide.image}`}
                      alt=""
                      width={slide.width}
                      height={slide.height}
                      sizes="(min-width: 400px) 400px, 96vw"
                      draggable={false}
                    />
                  </div>
                  <p lang="en">
                    {slide.headline[0]}
                    <br />
                    {slide.headline[1]}
                  </p>
                </div>
              )}
              <div className={styles.artwork}>
                <Image
                  src={`/study-onboarding/${slide.image}`}
                  alt=""
                  width={slide.width}
                  height={slide.height}
                  sizes="(min-width: 400px) 400px, 100vw"
                  preload={index === 0}
                  draggable={false}
                />
              </div>
              {slide.caption && (
                <p className={styles.caption}>
                  {slide.caption[0]}
                  <br />
                  {slide.caption[1]}
                </p>
              )}
            </section>
          ))}
        </div>

        <div className={styles.controls}>
          <nav className={styles.dots} aria-label="소개 슬라이드 선택">
            {slides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                className={styles.dot}
                aria-label={`${index + 1}번 슬라이드: ${slide.label}`}
                aria-current={index === activeSlide ? "true" : undefined}
                onClick={() => goToSlide(index)}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </nav>
          <Link href="/login" className={styles.primary}>
            로그인하기
          </Link>
          <div className={styles.account}>
            <Link href="/signup">계정 만들기</Link>
            <span className={styles.divider} aria-hidden="true" />
            <span>아이디 비밀번호 찾기</span>
          </div>
        </div>
      </div>
    </main>
  );
}
