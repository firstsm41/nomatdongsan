# 노맛동산 (nomatdongsan)

의학용어 **713단어**가 내장된 단어장·퀴즈 웹앱입니다. 별도 업로드 없이 바로 학습할 수 있습니다.

- 저장소: `git@github.com:firstsm41/nomatdongsan.git`
- 데이터: `src/data/medical-wordbook.json` (의학용어_단어장_정리본 · 단어장_전체 시트)
- 학습 기록·오답: 브라우저 localStorage

## 기능

| 기능 | 설명 |
|------|------|
| **퀴즈** | 단어→뜻, 뜻→단어, 약어, 단답형, 혼합 |
| **단어 암기** | 검색, 분야별 필터, 목록/카드 모드 |
| **오답 노트** | 틀린 문제 자동 저장, 오답만 다시 풀기 |
| **빠른 퀴즈** | 홈에서 20문제 바로 시작 |

## 시작하기

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## 배포 (Vercel / Netlify 등)

1. 저장소 연결 후 빌드 명령: `npm run build`
2. 출력 디렉터리: `dist`
3. SPA 라우팅: 모든 경로를 `index.html`로 리다이렉트

Netlify는 저장소에 `_redirects` 포함:

```
/*    /index.html   200
```

## 프로젝트 구조

```
src/
├── data/medical-wordbook.json  # 내장 단어 713개
├── store/                      # 단어장 · 오답 저장
├── pages/                      # 화면
└── lib/                        # 퀴즈 · 엑셀(레거시)
```

## 기술 스택

React 19 · TypeScript · Vite · Tailwind CSS 4 · Zustand
