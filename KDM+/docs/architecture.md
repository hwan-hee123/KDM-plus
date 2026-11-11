# 공용 데이터베이스 연결 설계 (향후 구현)

이 문서는 3·4단계 구현 계획이며 실제 테이블, RLS, 서버 API를 설치한 것은 아닙니다. 현재 UI는 `getEquipment()`의 예시 데이터를 사용합니다.

## 앱 경계

- Rental: Next.js 일반 사용자 사이트. 본인 신청/대여/반납만 접근.
- Admin: 추후 별도 Next.js 프로젝트. 동일 Supabase 프로젝트를 사용.
- Auth: Supabase Auth UUID로 사용자 식별. `profiles`에 이름/연락처 보관.
- 신뢰 경계: UI에서 넘어오는 장비, 사용자, 상태, QR 값은 신뢰하지 않음. 서버는 세션을 검증하고 DB 트랜잭션 안에서 권한과 실제 상태를 다시 확인.
- 브라우저에 서비스 역할 키를 노출하지 않음. 관리자 여부는 사용자가 수정 가능한 profile/user_metadata에 저장하지 않음.

## 테이블 초안

| 테이블 | 주요 필드/제약 |
| --- | --- |
| profiles | id → auth.users, name, phone, created_at |
| categories | id, name, sort_order |
| equipment | id(UUID), asset_code UNIQUE, category_id, name, model, image_path, operational_status |
| equipment_components | id, equipment_id, component_code UNIQUE, kind, qr_token_hash UNIQUE, retired_at |
| rentals | id, user_id, equipment_id, starts_at, due_at, status, purpose, approved_by, checked_out_at, returned_at |
| rental_status_events | id, rental_id, previous_status, next_status, actor_id, reason, created_at |
| return_sessions | id, rental_id, user_id, status, created_at, submitted_at |
| return_scans | id, return_session_id, component_id, scanned_by, scanned_at; UNIQUE(return_session_id, component_id) |
| user_roles | user_id, role; 관리자 권한으로만 수정 |
| device_security_events | 향후 Windows 감지용 별도 이벤트 테이블. 이번 범위 제외 |

고유 관리 번호와 내부 PK는 분리합니다. 표시 코드가 바뀌어도 관계는 UUID로 유지합니다. 사진은 Supabase Storage에 저장하고 적절한 읽기 정책을 설정합니다. 장비 가용성은 단순 boolean 대신 운영 상태 및 예약 기간으로 계산합니다.

## 상태와 서버 검증

상태: pending → approved → awaiting_pickup → active → return_inspection → returned. pending에서 rejected로 거절 가능. 승인/수령/최종반납 전이는 관리자 권한만 허용하고 이벤트 로그를 남깁니다.

1. 신청 시 auth.uid()에서 사용자 ID를 결정. 입력 user_id를 신뢰하지 않음.
2. 시작·종료일, 최대 대여 기간 정책, 장비 운영 상태 확인.
3. 트랜잭션 + PostgreSQL exclusion constraint(btree_gist, equipment_id, 기간 range)로 동일 장비의 겹치는 예약을 방지. 승인 대기를 포함해 슬롯을 점유하는 상태를 명시하고, 거절 시 해제. UI 검색만으로 중복 방지하지 않음.
4. 날짜 경계와 시간대는 Asia/Seoul로 정의. 예: 종료일 포함 대여 정책이면 DB에서 다음 날 00:00까지의 반열린 범위 [start, end+1day)로 변환. 정책 변경 전 사용자 안내와 제약을 함께 변경.
5. 반납 지연으로 실제 미반납 상태가 지속되면 다음 수령 승인도 별도로 검증. `active`/`return_inspection`인 장비는 실제 반납 완료 전 재수령 불가.
6. 승인 대기 만료/신청 취소 정책은 2·3단계에서 확정.

## RLS 원칙

- equipment/categories: 필요한 목록 필드만 읽기. 변경은 관리자만.
- profiles: 본인 읽기와 이름/연락처 변경만 허용. 관리자 역할 필드 없음.
- rentals/events: 본인 건만 읽기. 사용자가 직접 상태 변경 불가. 신청은 검증된 RPC/서버 명령만.
- return_sessions/scans: 해당 사용자의 실제 대여 건과 조인해 접근 제한. 직접 임의 INSERT/UPDATE 금지, 검증된 RPC로 처리.
- user_roles: 일반 사용자 쓰기 금지. 관리 역할을 안전한 서버 경로로만 부여.
- SECURITY DEFINER 함수는 search_path 고정, 실행 권한 최소화, auth.uid()/역할을 내부에서도 검사.
- 서로 다른 사용자 A/B, 비로그인, 관리자 권한 위조, 동시 신청에 대한 통합 테스트를 3단계에 수행.

## QR 반납

노트북 세트 예: LT-03-body, LT-03-charger, LT-03-mouse. 표시 ID 외에 예측하기 어려운 QR 토큰 사용을 권장합니다. QR은 인증 수단이 아니며 서버 검증의 입력값입니다.

- HTTPS 또는 localhost에서만 카메라 접근. 권한 거부/카메라 없음/스캔 실패 안내 제공.
- 서버에서 로그인 사용자, active 대여, 해당 장비의 등록 구성품을 확인.
- 다른 장비 구성품은 불일치로 거절. 중복은 UNIQUE 제약으로 방어.
- 필요 구성품 목록은 서버 기준. 모든 스캔이 실제로 저장되어야 검수 요청 가능.
- 검수 요청은 트랜잭션 안에서 다시 전체 구성품을 비교하고 return_inspection으로만 전이.
- 사용자는 returned 상태를 설정할 수 없음. 관리자 검수 후 최종 완료.
- 스캔 화면 종료 시 카메라 트랙 정리. 실제 iOS/Android HTTPS 테스트 필요.

## 배포 전환

1단계는 정적 UI입니다. 3단계에서 `output: 'export'`를 제거하고 서버 런타임에 배포합니다. `@supabase/ssr` 쿠키 세션 검증, 서버 액션/Route Handler, SQL migrations와 RLS를 함께 도입합니다. 비밀키는 서버 환경변수에만 보관하며 Git에 올리지 않습니다. 무료 플랜으로 시작하되 서비스별 사용량 한도를 확인합니다.
