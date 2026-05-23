# 노맛동산 (nomatdongsan)

엑셀 단어장을 업로드하고, 여러 유형의 퀴즈로 복습하는 **웹 단어장** 앱입니다.

- 저장소: `git@github.com:firstsm41/nomatdongsan.git`
- 로컬 데이터: 브라우저 `localStorage` (별도 서버 없이 동작)

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

```bash
npm run build   # 프로덕션 빌드
npm run preview # 빌드 미리보기
```

## 엑셀 단어장 형식

첫 번째 시트의 **첫 행은 헤더**입니다.

| 열 (필수/선택) | 한글 헤더 | 영문 헤더 (대체) |
|----------------|-----------|------------------|
| 필수 | 단어 | word, english, term |
| 필수 | 뜻 | meaning, definition |
| 선택 | 약어 | abbreviation, abbr |
| 선택 | 예문 | example, sentence |
| 선택 | 메모 | note, comment |

앱 내 **「엑셀 양식 다운로드」** 로 샘플 파일을 받을 수 있습니다.

## 지원 퀴즈 유형

| 유형 | 설명 |
|------|------|
| 단어 → 뜻 | 영어 단어 보고 뜻 4지선다 |
| 뜻 → 단어 | 뜻 보고 영어 단어 4지선다 |
| 약어 맞추기 | 단어에 맞는 약어 4지선다 (약어 열 필요) |
| 단답형 | 단어 또는 뜻 직접 입력 |
| 혼합 | 문제마다 유형 랜덤 |

## 프로젝트 구조

```
src/
├── types/vocabulary.ts   # 단어·단어장·퀴즈 타입
├── lib/
│   ├── excelParser.ts    # xlsx 업로드/양식
│   └── quizEngine.ts     # 문제 생성·채점
├── store/wordbookStore.ts
├── pages/                # 화면
└── components/           # UI 공통
```

## 로드맵 (추후 확장)

- [ ] 학습 기록·통계 (정답률, 취약 단어)
- [ ] 틀린 문제만 다시 풀기
- [ ] 단어장 엑셀 재보내기
- [ ] PWA / 모바일 홈 화면 추가
- [ ] (선택) 클라우드 동기화

## 기술 스택

- React 19 + TypeScript + Vite
- React Router, Zustand (persist), SheetJS (xlsx)
- Tailwind CSS 4

## 배포

정적 호스팅(Vercel, Netlify, GitHub Pages 등)에 `dist` 폴더를 배포하면 됩니다.

GitHub Pages 사용 시 `vite.config.ts`에 `base: '/nomatdongsan/'` 등 저장소 이름에 맞게 설정하세요.
