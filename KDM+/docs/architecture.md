# 비회원 대여 시스템 설계 (향후 서버 구현)

사용자 요청에 따라 일반 사용자 로그인/회원가입은 제거합니다. 이 문서는 계획이며 현재 서버 API, Supabase 연결 또는 RLS를 설치한 것은 아닙니다.

## 현재 구현

장비를 누르면 달력, 이름(빈칸), 기수(빈칸), 사용 목적(선택) 입력창이 열립니다. 신청 내용 확인까지만 가능합니다. 입력은 React 메모리에만 존재하며 전송하거나 저장하지 않습니다. 날짜/장비 상태 검증은 UI 편의를 위한 것이며 서버 보안을 대체하지 않습니다.

## 두 앱과 공용 DB

- 일반 사용자 Next.js: 계정 없이 신청. 이름, 기수, 이용 기간, 장비, 선택 사용 목적.
- 관리자 Next.js: 별도 개발, Supabase Auth로 관리자 인증. 같은 Supabase PostgreSQL을 사용.
- 일반 사용자 신청/조회/QR 반납은 검증된 서버 경로에서만 처리. 브라우저에 service_role 키를 노출하지 않음.
- 3단계에서는 정적 export를 제거하고 Next.js 서버 런타임 사용.

## 본인 확인 결정 필요

이름과 기수는 식별 정보이며 인증 정보가 아닙니다. 이 두 값만으로 대여 내역이나 개인정보를 반환하지 않습니다.

서버 연동 전 신청번호 + 별도 비밀번호, 또는 연락처 인증 중 조회/반납 인증 방식을 확정합니다. 신청번호는 예측 불가능하게 발급하고 별도 비밀값은 해시로 저장합니다. 확인 성공 시 해당 신청 건에만 권한을 주는 짧은 수명의 HttpOnly 세션을 사용합니다. 신청번호만 알면 누구나 접근하는 구조는 금지합니다. 연락처를 추가할 경우 수집 목적, 보유 기간, 동의 흐름도 함께 정의합니다.

## 테이블 초안

| 테이블 | 주요 필드 |
| --- | --- |
| categories | id, name, sort_order |
| equipment | id(UUID), asset_code UNIQUE, category_id, name, model, image_path, operational_status |
| equipment_components | id, equipment_id, component_code UNIQUE, kind, qr_token_hash UNIQUE |
| rental_requests | id, public_request_code UNIQUE, requester_name, cohort, purpose, starts_at, due_at, equipment_id, status, credential_hash, created_at |
| rental_status_events | id, request_id, previous_status, next_status, actor_id, created_at |
| return_sessions | id, request_id, expires_at, submitted_at |
| return_scans | id, return_session_id, component_id; UNIQUE(return_session_id, component_id) |
| admin_roles | auth_user_id, role; 관리자 경로로만 변경 |
| device_security_events | 향후 Windows 감지 이벤트. 이번 범위 제외 |

공개 장비 관리 번호와 내부 UUID는 분리합니다. 신청자/인증 필드는 일반 목록에 조인하지 않습니다.

## RLS와 서버 보안

- 장비 목록만 필요한 공개 필드를 노출. 변경은 관리자만.
- anon 역할은 rental_requests, return_sessions/scans, admin_roles에 직접 읽기/쓰기 불가.
- 신청/조회/수정은 서버 API/RPC가 입력 검증, 본인 확인, CSRF/Origin 검증, 요청 제한 후 수행.
- 이름 1~40자, 기수 양의 정수, 사용 목적 최대 200자. 운영 범위는 서버와 UI에서 동일하게 관리.
- 역할은 사용자가 바꿀 수 있는 metadata에서 결정하지 않음. 별도 admin_roles 또는 안전한 서버 claims로 검증.
- SECURITY DEFINER 함수 사용 시 고정 search_path, 최소 EXECUTE 권한, 내부 권한 검사.
- IP/신청 건 기준 요청 제한, 반복 인증 실패 제한 및 감사 로그. 이름만으로 검색하는 공개 API 금지.

## 상태와 날짜

pending → approved → awaiting_pickup → active → return_inspection → returned. pending → rejected 가능. 승인/수령/검수완료는 관리자만 전이할 수 있습니다.

날짜는 Asia/Seoul 기준. 시작일과 반납일을 포함한 범위이며 당일 반납 허용. DB에는 [대여일 00:00, 반납일 다음날 00:00) 범위로 저장합니다. 트랜잭션과 PostgreSQL btree_gist exclusion constraint로 슬롯을 점유하는 상태(승인 대기 포함)의 장비/기간 중복을 막습니다. UI 표시와 별개로 서버에서 검사합니다. 점검 장비와 실제 미반납 상태도 수령 시 재검증합니다.

## QR 반납

LT-03-body, LT-03-charger, LT-03-mouse 등 세트별 구성품을 관리하고 예측하기 어려운 QR 토큰을 등록합니다. QR은 본인 인증 수단이 아닙니다.

HTTPS 카메라 스캔 → 본인 확인된 대여 건의 active 상태 조회 → 구성품의 실제 소속 비교 → 중복 스캔 UNIQUE 제약 → 필수 구성품 전부를 서버에서 비교 → return_inspection 전이. 최종 returned는 관리자 검수 후만 허용합니다. 다른 장비 구성품은 거절합니다. 권한 거부/카메라 없음 안내와 종료 시 트랙 해제가 필요합니다.

## 서버 연결 전 필수 테스트

동시 신청 중복, 다른 신청 건의 비밀값 사용, 익명 직접 DB 접근, 관리자 권한 위조, 중복/타 장비 QR, 미반납 수령 차단, 과거/역전 날짜, 만료된 세션, 과다 요청 차단.
