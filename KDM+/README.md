# KDM Equipment Rental

KDM 공용 장비 대여 사이트 **1단계 UI 초안**입니다. Next.js App Router, TypeScript, Tailwind CSS 4를 사용합니다.

## 현재 가능한 것

- 19대 장비 목록, 한국어 UI, PC/모바일 반응형 디자인
- 장비명/관리 번호 검색, 카테고리 필터, 대여 가능 필터, 정렬
- 장비 정보 모달, 이용 안내/FAQ, 내 대여 현황 예시, 로그인/회원가입 화면 이동
- 키보드 조작, 검색 결과 없음 안내, 모달 Escape 닫기

**실제 인증·대여 신청·승인·QR 스캔·데이터 저장은 연결하지 않았습니다.** 로그인 입력란은 비활성화되어 있습니다. 대여 상태와 반납일, 모델/사진, 마이페이지 내역은 예시입니다. 관리자 사이트는 포함하지 않습니다.

## 처음 실행하기

1. [Node.js 공식 홈페이지](https://nodejs.org/)에서 LTS 버전(Node.js 22 이상)을 설치합니다.
2. GitHub의 Code → Download ZIP으로 내려받아 압축을 풉니다. 또는 아래 명령으로 복제합니다.

```bash
git clone https://github.com/hwan-hee123/KDM-plus.git
cd "KDM-plus/KDM+"
npm ci
npm run dev
```

ZIP으로 받았다면 터미널에서 `package.json`이 있는 `KDM+` 폴더로 이동한 다음 `npm ci`, `npm run dev`를 실행하세요. 첫 설치에는 인터넷 연결이 필요합니다.

3. 브라우저에서 **http://localhost:3000**을 엽니다.
4. 종료할 때 터미널에서 `Ctrl+C`를 누릅니다.

3000번 포트가 사용 중이라면 `npm run dev -- --port 3001`로 실행하고 http://localhost:3001 을 엽니다.

## 검사와 배포용 빌드

```bash
npm run typecheck
npm run build
```

현재는 `output: 'export'` 설정으로 `out/`에 정적 사이트를 생성합니다. 이 단계는 무료 정적 호스팅으로 배포할 수 있습니다. **정적 출력에서는 `npm start`로 서비스하지 않습니다.** 로컬 화면 확인은 `npm run dev`를 사용합니다. 향후 서버 인증·대여 기능을 구현할 때는 정적 출력 설정을 제거하고 Next.js 서버를 지원하는 호스팅으로 전환해야 합니다.

`.openai/hosting.json`은 이 초안의 Sites 배포 정보입니다. 개인 PC에서 개발하거나 다른 서비스로 배포할 때는 필요하지 않습니다. 새 Sites 프로젝트를 만들 때는 기존 프로젝트 ID를 재사용하지 마세요.

## 장비 목록 변경

`src/lib/equipment.ts`의 `groups`와 상태 예시를 수정합니다. 실제 모델명은 아직 전달받지 않아 임의의 제품 사양을 표시하지 않습니다.

| 장비 | 수량 | 관리 번호 |
| --- | ---: | --- |
| 아이맥 | 4 | imac-01 ~ imac-04 |
| 노트북 | 6 | LT-01 ~ LT-06 |
| 아이패드 에어 | 4 | air-01 ~ air-04 |
| 아이패드 미니 | 1 | mini-01 |
| 소니 카메라 | 1 | sony-01 |
| 캐논 카메라 | 2 | canon-01 ~ canon-02 |
| 소니 캠코더 | 1 | cam-01 |

## 파일 안내

- `src/app/`: 홈, 이용 안내, 내 대여 현황, 로그인 경로
- `src/components/rental-site.tsx`: UI 및 로컬 검색/필터
- `src/lib/equipment.ts`: 장비 타입, 조회 함수, 예시 데이터
- `src/app/globals.css`: Tailwind 진입점 및 반응형 디자인
- `public/images/`: 로컬 예시 사진 (실제 장비 사진으로 교체 예정)
- `docs/architecture.md`: 향후 공용 Supabase 구조 및 서버 검증 설계
- `docs/assets.md`: 예시 이미지 출처
- `scripts/dev.mjs`: 로컬/관리형 미리보기 실행 인자 호환

## 다음 단계

2. 상세페이지, 대여 신청 양식, 마이페이지 실제 흐름
3. Supabase Auth/PostgreSQL/RLS와 서버 검증
4. 카메라 QR 스캔 및 구성품/실제 대여 건 검증
5. 모바일 실기기 테스트 및 운영 배포

3단계에서 Supabase 프로젝트를 연결하기 전에는 계정이나 대여 데이터를 실제로 저장하지 않습니다.
