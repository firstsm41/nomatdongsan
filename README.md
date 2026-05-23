# 노맛동산 (nomatdongsan)

의학용어 **737단어**가 내장된 단어장·퀴즈 웹앱입니다.

- **라이브:** https://firstsm41.github.io/nomatdongsan/
- 저장소: https://github.com/firstsm41/nomatdongsan
- 학습 기록·오답: 브라우저 localStorage

## 기능

| 기능 | 설명 |
|------|------|
| **퀴즈** | 단어→뜻, 뜻→단어, 약어, 단답형, 혼합 |
| **분야별 퀴즈** | 내과, 외과, 산부인과 등 |
| **단어 암기** | 검색, 분야 필터, 카드 모드 |
| **오답 노트** | 틀린 문제 저장 · 복습 |
| **학습 통계** | 정답률, 분야별, 취약 단어 |

## 로컬 개발

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## 배포 (GitHub Actions → GitHub Pages)

`main` 브랜치에 push하면 [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)이 자동으로 빌드·배포합니다.

### 최초 1회 설정

1. GitHub 저장소 → **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions**
3. `main`에 push (또는 Actions 탭에서 workflow 수동 실행)

배포 URL: `https://firstsm41.github.io/nomatdongsan/`

### 다른 호스팅 (Vercel / Netlify)

- Build: `npm run build` (루트 `/` 배포, `GITHUB_PAGES` 없이)
- Output: `dist`
- SPA: `public/_redirects` 참고

## 기술 스택

React 19 · TypeScript · Vite · Tailwind CSS 4 · Zustand
