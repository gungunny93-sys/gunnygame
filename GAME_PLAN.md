# 러시아워 바 — 작업기획서 (GAME_PLAN.md)

> 이 문서는 레포 루트에 두고 작업 내내 기준으로 삼는다. 판단이 애매하면 이 문서를 따른다.

---

## 1. 개요

- **한 줄 피치**: 고등학교 1~2학년 바리스타 수업 학생이 밀려드는 주문을 처리하며 에스프레소 추출·우유 스티밍·메뉴 레시피·위생 관리를 손에 익히는 카페 운영 타이밍 액션 게임
- **대상**: 고1~2 바리스타 수업 수강생(일반 학생 기준). 타이머·경쟁·콤보 같은 긴장 요소 허용. 단, 타이머 없는 연습 모드 제공
- **학습목표**
  1. 에스프레소 추출량과 추출 시간의 관계, 과소·과다추출의 맛 차이를 설명하고 분쇄도로 보정할 수 있다.
  2. 메뉴에 맞게 우유 스티밍 온도와 공기 주입량(거품 두께)을 조절할 수 있다.
  3. 대표 커피 메뉴의 구성·비율·투입 순서를 구분해 제조할 수 있다.
  4. 추출·스티밍 전후 위생 관리 절차를 지킬 수 있다.
  - 근거: 학교 바리스타 교재 및 NCS 학습모듈(바리스타 관련 단원). 성취기준 코드는 교사가 README에 채운다.
- **재미 : 교육** = 6 : 4
- **기기**: 태블릿 가로(주 사용) + 전자칠판 + 휴대폰 세로, 크롬
- **구성**: 스테이지 7개 + 연습 모드. 한 판 5~7분
- **서버·로그인·DB 없음.** 기록은 localStorage, Vercel 정적 배포

---

## 2. 핵심 루프와 학습 매핑

### 2.1 30초 핵심 루프
주문 티켓 확인 → (그라인더 분쇄도 확인) → 샷 추출: 목표량에서 멈춤 → (우유 스티밍: 공기 주입 → 롤링 → 목표 온도에서 멈춤) → 조립대에서 컵을 고르고 재료를 순서대로 담기 → 서빙 → 손님 반응·팁·콤보

### 2.2 학습 매핑 표

| 학습 요소 | 게임 속 구현 | 잘못 이해했을 때 게임에서 생기는 일 |
|---|---|---|
| 추출량 | 추출을 시작하면 샷 잔에 에스프레소가 차오르고, 플레이어가 목표선에서 정지 | 양이 모자라면 "너무 진해요", 넘치면 "밍밍해요" 반응과 감점 |
| 추출 시간 | 머신 타이머가 게임 시간으로 흐름. 같은 양이라도 걸린 시간은 분쇄도가 결정 | 시간이 짧으면 과소추출(신맛·밍밍함), 길면 과다추출(쓴맛·떫은맛). 손님이 맛을 그대로 말함 |
| 분쇄도 다이얼인 | 그라인더 다이얼 1(곱게)~10(굵게). 곱게 할수록 흐름이 느려짐 | 다이얼을 반대로 돌리면 문제가 더 심해짐. 테스트 샷으로 확인하며 맞춰야 함 |
| 스티밍 온도 | 피처 온도계가 실시간으로 오르고, 버튼을 떼면 멈춤 | 너무 낮으면 "미지근해요", 너무 높으면 우유가 타서 피처를 비우고 다시 데워야 함(시간 손실) |
| 공기 주입 = 거품 두께 | 스티밍 초반 '공기 주입' 시간이 거품 두께를 결정. 온도가 오른 뒤 주입하면 거친 거품 | 카푸치노에 얇은 거품이면 "라떼 같은데요?" 하며 반품. 늦게 주입하면 거품 품질 감점 |
| 메뉴 구성·비율 | 조립대 컵 단면도에 층(에스프레소·물·우유·거품·얼음·소스)이 실시간으로 쌓임 | 비율이 틀리면 다른 메뉴로 인식되어 반품("이건 제가 시킨 게 아니에요") |
| 투입 순서 | 순서가 중요한 메뉴(아이스 메뉴·모카 등)는 담은 순서를 판정 | 순서가 틀리면 품질 감점과 이유 말풍선 |
| 위생 관리 | 퍽 버리기·그룹헤드 물 흘리기, 스팀완드 퍼징·닦기 행동 | 건너뛰면 다음 잔 품질 하락, 위생 게이지 감소. 0이 되면 영업을 멈추고 청소 단계 |

> 모든 기준 수치는 `src/data/standards.ts`에 모아 교사가 수정할 수 있게 한다. 이 문서의 기본값은 일반적인 바리스타 교재 기준이며, 학교 교재와 다를 수 있어 `teacherCheck: true`로 표시하고 README에 "교사 확인 필요 수치" 목록을 만든다.

---

## 3. 화면 흐름

타이틀 → (첫 실행 시) 튜토리얼 → 스테이지 선택 → 영업 준비 → 플레이 → 결과 → 다시하기/다음 스테이지

- **타이틀**: 게임 시작, 연습 모드, 설정, 교사용 기록(하단 작은 버튼)
- **튜토리얼**: 오리지널 NPC '선배 바리스타'가 한 단계씩 안내. 스테이지 1 첫 두 잔을 직접 따라 해보는 방식(텍스트 설명만 늘어놓지 않음). 건너뛰기 가능
- **스테이지 선택**: 7개 카드, 별(0~3), 잠금 표시. 이전 스테이지 클리어 시 해금(교사용 설정에서 전체 해금 가능)
- **모둠 선택**: 시작 전 모둠 번호(1~8) 또는 '개인 연습' 선택. 이름 입력 없음
- **영업 준비**: 오늘의 메뉴 카드와 '새로 배울 것' 카드 1장(이번 스테이지의 새 메카닉을 한 문장 + 그림으로)
- **플레이**: 5절 참고
- **결과**: 별, 점수, 서빙/반품/이탈 수, **실수 노트**(가장 많이 한 실수 3개 + 원리 한 줄 + 고치는 법), **실습 체크리스트**(실수와 연결된 실제 실습 확인 항목 2~3개)
- **설정**: 효과음, 배경음, TTS 주문 읽어주기, 게임 속도(느림/보통), 연습 모드 기본값
- **교사용 기록**: 이 기기의 기록 목록, 모둠별 실수 통계, CSV 내보내기, 기록 초기화, 전체 스테이지 해금 토글

---

## 4. 스테이지 표

| 번호 | 이름 | 학습 내용 | 메뉴 | 새 메카닉 | 클리어 조건 | 예상 시간 |
|---|---|---|---|---|---|---|
| 1 | 첫 출근 | 추출량, 에스프레소와 아메리카노의 차이 | 에스프레소, 아메리카노 | 샷 추출(목표량에서 정지), 뜨거운 물 붓기 | 6잔 중 4잔 이상 70점 이상 | 5분 |
| 2 | 다이얼인 | 추출 시간, 과소·과다추출, 분쇄도 보정 | 도피오, 리스트레토, 룽고, 아메리카노 | 그라인더 분쇄도, 추출 시간 판정, 테스트 샷, '원두 상태 변화' 이벤트 1회 | 6잔 중 4잔 | 6분 |
| 3 | 우유 데우기 | 스티밍 적정 온도 | 카페라떼, 아메리카노 | 스티밍(온도), 탄 우유 버리기 | 6잔 중 4잔 | 6분 |
| 4 | 거품의 두께 | 공기 주입량과 메뉴별 거품 차이 | 카페라떼, 카푸치노, 플랫화이트, 마키아토 | 공기 주입 단계, 거품 두께 판정, 동시 주문 2개 | 8잔 중 5잔 | 7분 |
| 5 | 차갑게, 달콤하게 | 아이스 메뉴와 부재료, 투입 순서 | 아이스 아메리카노, 아이스 라떼, 바닐라 라떼, 카페모카 | 얼음·시럽·소스·휘핑, 순서 판정 | 8잔 중 5잔 | 7분 |
| 6 | 깨끗한 바 | 위생 관리 절차 | 1~5 메뉴 무작위 | 퍽 버리기·그룹헤드 물 흘리기, 스팀완드 퍼징·닦기, 위생 게이지 | 8잔 중 5잔 + 위생 게이지 50% 이상 유지 | 7분 |
| 7 | 러시아워 | 종합 | 전체 + 콘파냐, 아포가토 | 동시 주문 3→4개, 콤보 팁 | 10잔 중 7잔 | 7분 |

- **별**: ★ 클리어 / ★★ 평균 80점 이상 / ★★★ 평균 90점 이상 + 반품 0
- **연습 모드**: 스테이지·메뉴를 골라 인내심 무제한, 가이드선 항상 표시, 실패하면 선배 힌트 후 같은 주문 재도전

---

## 5. 게임 시스템 명세

### 5.1 화면 배치
- **태블릿 가로(기본, 1280×800 기준)**: 위쪽 20% 손님 줄과 주문 티켓 / 아래쪽 80% 작업대 4구역(왼쪽부터 그라인더·에스프레소 머신 → 스팀 → 조립대 → 서빙대 슬롯 3개)
- **휴대폰 세로**: 위쪽 손님·티켓, 아래쪽은 작업대 4구역을 탭으로 전환(하단 탭 바)
- **전자칠판**: 가로 배치 그대로 확대. 버튼 최소 64px

### 5.2 조작
- 터치·마우스: 탭, 누르고 있기(hold), 드래그(완성 컵 → 손님)
- 키보드: 1~4 작업대 전환, Space 추출 시작/정지, A 공기 주입(누르는 동안), S 롤링(누르는 동안), Enter 서빙, Esc 일시정지
- 모든 화면에 일시정지·소리 끄기 버튼

### 5.3 에스프레소 샷 모델
- **시간 배율** `timeScale = 3`: 실제 1초 = 머신 타이머 3초. 25초 샷은 실제 약 8초
- 흐름 속도(ml/게임초) = `baseFlow × basket × factor^(grind − idealGrind)`
  - `baseFlow = 1.2`, 싱글 바스켓 `basket = 1`, 더블 `basket = 2`, `factor = 1.25`
  - 분쇄도 `grind`는 1(곱게)~10(굵게) 정수. 굵을수록 흐름이 빨라짐
  - `idealGrind`: 스테이지 1은 5 고정, 2부터 4~6 무작위. 스테이지 2 중반에 '원두 상태가 바뀌었어요' 이벤트로 ±1~2 이동
- 조작: '추출 시작' 탭 → 샷 잔이 차오르고 타이머가 흐름 → '정지' 탭
- 판정: 추출량이 목표량 ± 허용 오차 안인지, 추출 시간이 메뉴의 시간 범위 안인지 각각 판정
  - 시간 < 최소 → `UNDER_EXTRACTED` / 시간 > 최대 → `OVER_EXTRACTED`
  - 양 < 하한 → `SHOT_LOW` / 양 > 상한 → `SHOT_HIGH`
- **테스트 샷**: 서빙하지 않고 버리는 샷. 결과에 시간·양·맛 표시. 원두는 무한이지만 시간이 소모됨
- 샷 품질 점수(0~100) = 100 − 양 편차 감점 − 시간 편차 감점 (감점 공식은 `judge.ts`에 두고 단위 테스트)

### 5.4 우유 스티밍 모델 (실제 시간 기준, 배율 없음)
- 피처 시작 온도 5℃
- '공기 주입' 버튼(누르는 동안): 거품 +0.3cm/초, 온도 +5℃/초
- '롤링' 버튼(누르는 동안): 온도 +6℃/초, 거품 결이 고와짐
- 피처 온도가 `aerateMaxTempC`(37℃)를 넘은 뒤 공기를 주입하면 `COARSE_FOAM`(거친 거품) 플래그
- 온도 판정: 60~65℃ 최상 / 55~60, 65~70℃ 감점 / 55℃ 미만 `MILK_COLD` / 70℃ 초과 `MILK_SCALDED`(그 우유는 쓸 수 없고 '피처 비우기'를 눌러야 함)
- 거품 두께 판정: 메뉴의 `foamCm` 범위와 비교 → `FOAM_THIN` / `FOAM_THICK`
- 온도계는 색 구간(파랑 → 초록 → 주황 → 빨강)으로 표시. 스테이지 1~3은 목표 구간을 강조 표시

### 5.5 조립대와 판정
- 컵 선택: 데미타세, 카푸치노 잔, 라떼 잔, 머그, 아이스컵, 디저트 글라스
- 재료 버튼: 샷 붓기(추출해 둔 샷), 뜨거운 물(누르는 동안), 찬물(누르는 동안), 얼음(탭=1스쿱), 스팀 우유 붓기(누르는 동안, 피처의 거품이 위층으로 자동으로 쌓임), 찬 우유(누르는 동안), 바닐라 시럽(탭=1펌프), 초코 소스(탭=1회), 휘핑크림(탭), 바닐라 아이스크림(탭=1스쿱), 거품 얹기(스푼, 마키아토용)
- 컵 단면도에 층이 색으로 쌓임. 스테이지 1~3은 ml 눈금과 목표선 표시, 4~6은 목표선만, 7은 숨김
- '다시 만들기' 버튼: 컵 비우기(시간 손실)
- 판정(`judge.ts`의 순수 함수):
  1. 컵 → `WRONG_CUP`
  2. 재료 구성 → `MISSING_INGREDIENT` / `EXTRA_INGREDIENT`
  3. 각 재료 양이 허용 오차 안인지 → `WRONG_RATIO`
  4. `orderMatters`가 true면 담은 순서 → `WRONG_ORDER`
  5. 샷 품질(5.3), 우유 품질(5.4)
  6. 비율이 다른 메뉴와 더 가까우면 그 메뉴 이름으로 반응("이건 라떼 같은데요?")

### 5.6 손님과 주문
- 손님이 줄에 들어오면 주문 티켓 생성: 메뉴명 + 핫/아이스. TTS가 켜져 있으면 주문을 읽어줌
- 인내심 게이지가 줄어들고, 0이 되면 떠남 → `TIMEOUT`
- 손님 유형 3가지(오리지널 캐릭터, 단순한 도형 일러스트)
  - 일반 손님
  - 급한 손님: 인내심 0.7배
  - 깐깐한 손님: 반품 기준 80점, 팁 1.5배
- 동시 주문 최대 개수는 스테이지별 파라미터. 작업대는 각 1잔씩, 완성 컵은 서빙대 슬롯 3개에 보관

### 5.7 위생 (스테이지 6부터)
- 샷 추출 후: '퍽 버리기' + '그룹헤드 물 흘리기'를 하지 않고 다음 샷을 추출하면 `PUCK_NOT_KNOCKED` → 그 샷 품질 −20, 위생 게이지 −10
- 스티밍 전 '스팀완드 퍼징', 스티밍 후 '닦기 + 퍼징'을 하지 않으면 `WAND_NOT_CLEANED` → 다음 우유 품질 −20, 위생 게이지 −15
- 위생 게이지 0 → 영업 일시 정지, 마감 청소 단계(정해진 순서대로 청소 행동을 탭으로 수행, 약 20초) 후 게이지 50%로 재개
- 행동은 작업대 위 아이콘(넉박스, 행주, 스팀완드)을 탭하는 방식. 텍스트 퀴즈로 처리하지 않음

### 5.8 점수
- 한 잔 100점 = 구성·비율·순서 40 + 샷 품질 30 + 우유 품질 20 + 속도 10
  - 우유가 없는 메뉴는 우유 20점을 구성 10 + 샷 10으로 재배분
  - 속도 = 서빙 시점 남은 인내심 비율 × 10
- 70점 미만 반품(깐깐한 손님은 80점). 반품 시 원인 말풍선 + 실수 기록
- 콤보: 80점 이상 연속 서빙 시 팁 배율 1.0 → 1.2 → 1.5(최대). 반품·이탈 시 초기화
- 위생 미이행 감점은 5.7 따름

### 5.9 난이도 파라미터 (`src/data/stages.ts`)

| 스테이지 | 인내심(초) | 동시 주문 | 추출량 허용 오차 | 가이드 표시 | idealGrind | 이벤트 |
|---|---|---|---|---|---|---|
| 1 | 90 | 1 | ±20% | 눈금+목표선 | 5 고정 | 없음 |
| 2 | 80 | 1 | ±15% | 눈금+목표선 | 4~6 무작위 | 원두 상태 변화 1회 |
| 3 | 80 | 1 | ±15% | 눈금+목표선 | 4~6 | 없음 |
| 4 | 75 | 2 | ±12% | 목표선 | 4~6 | 없음 |
| 5 | 70 | 2 | ±12% | 목표선 | 4~6 | 없음 |
| 6 | 65 | 2 | ±10% | 목표선 | 4~6 | 위생 이벤트 |
| 7 | 55 | 3→4 | ±8% | 숨김 | 3~7 | 원두 변화 + 위생 |

- 게임 속도 '느림' 설정 시 인내심 1.5배, 스티밍 온도 상승 0.75배
- 재료 양 허용 오차(물·우유 등)는 스테이지와 무관하게 ±15%로 시작해 `stages.ts`에서 조정

---

## 6. 콘텐츠 데이터 스키마

모든 콘텐츠는 `src/data/`에만 둔다. 데이터만 바꾸면 다른 메뉴·기준으로 재사용할 수 있게 한다.

### 6.1 타입 (`src/data/types.ts`)

```ts
export type ShotType = 'single' | 'doppio' | 'ristretto' | 'ristrettoDouble' | 'lungo';
export type Ingredient =
  | 'espresso' | 'hotWater' | 'coldWater' | 'ice' | 'steamedMilk' | 'coldMilk'
  | 'foamSpoon' | 'vanillaSyrup' | 'chocolateSauce' | 'whippedCream' | 'iceCream';
export type CupId = 'demitasse' | 'cappuccinoCup' | 'latteCup' | 'mug' | 'icedCup' | 'dessertGlass';
export type Unit = 'ml' | 'scoop' | 'pump' | 'portion';

export interface RecipeStep { ingredient: Ingredient; amount: number; unit: Unit }

export interface DrinkRecipe {
  id: string;
  name: string;              // 화면 표시 이름
  temp: 'hot' | 'iced';
  cup: CupId;
  shot: ShotType;
  steps: RecipeStep[];       // 정답 구성(순서 포함)
  orderMatters: boolean;     // true면 steps 순서대로 담아야 함
  milk?: { foamCm: [number, number] };  // 스팀 우유를 쓰는 메뉴만
  learnPoint: string;        // 영업 준비 카드·결과 화면에 쓰는 한 줄
  teacherCheck?: boolean;    // 학교 교재와 대조가 필요한 수치면 true
}

export interface ShotStandard { targetMl: number; timeSec: [number, number]; basket: 1 | 2 }

export type MistakeCode =
  | 'UNDER_EXTRACTED' | 'OVER_EXTRACTED' | 'SHOT_LOW' | 'SHOT_HIGH'
  | 'MILK_COLD' | 'MILK_SCALDED' | 'FOAM_THIN' | 'FOAM_THICK' | 'COARSE_FOAM'
  | 'WRONG_CUP' | 'MISSING_INGREDIENT' | 'EXTRA_INGREDIENT' | 'WRONG_RATIO' | 'WRONG_ORDER'
  | 'PUCK_NOT_KNOCKED' | 'WAND_NOT_CLEANED' | 'TIMEOUT';

export interface MistakeInfo {
  customerLine: string;   // 손님 말풍선
  why: string;            // 원리 한 줄
  fixHint: string;        // 게임에서 고치는 법
  practiceCheck: string;  // 실제 실습에서 확인할 것
}

export interface StageConfig {
  id: number; name: string; menuIds: string[]; newMechanic: string;
  patienceSec: number; maxConcurrent: number | [number, number];
  shotTolerance: number; ingredientTolerance: number;
  guide: 'full' | 'targetOnly' | 'hidden';
  idealGrind: number | [number, number];
  events: Array<'beanChange' | 'hygiene'>;
  totalOrders: number; clearCount: number;
}
```

### 6.2 기준값 (`src/data/standards.ts`, 모두 teacherCheck 대상)

```ts
export const STANDARDS = {
  timeScale: 3,
  shots: {
    single:          { targetMl: 30, timeSec: [20, 30], basket: 1 },
    doppio:          { targetMl: 60, timeSec: [20, 30], basket: 2 },
    ristretto:       { targetMl: 18, timeSec: [12, 20], basket: 1 },
    ristrettoDouble: { targetMl: 36, timeSec: [12, 20], basket: 2 },
    lungo:           { targetMl: 55, timeSec: [35, 50], basket: 1 },
  },
  grind: { min: 1, max: 10, baseFlowMlPerSec: 1.2, factorPerStep: 1.25 },
  milk: {
    startTempC: 5, idealC: [60, 65], okC: [55, 70], scaldC: 70,
    aerateMaxTempC: 37, aerateFoamCmPerSec: 0.3, aerateTempPerSec: 5, rollTempPerSec: 6,
  },
} as const;
```

### 6.3 메뉴 예시 3개 (`src/data/menus.ts`)

```ts
{ id: 'americano-hot', name: '아메리카노', temp: 'hot', cup: 'mug', shot: 'doppio',
  steps: [{ ingredient: 'espresso', amount: 60, unit: 'ml' }, { ingredient: 'hotWater', amount: 240, unit: 'ml' }],
  orderMatters: false,
  learnPoint: '에스프레소에 뜨거운 물을 더해 연하게 마시는 메뉴', teacherCheck: true },

{ id: 'cappuccino', name: '카푸치노', temp: 'hot', cup: 'cappuccinoCup', shot: 'single',
  steps: [{ ingredient: 'espresso', amount: 30, unit: 'ml' }, { ingredient: 'steamedMilk', amount: 120, unit: 'ml' }],
  orderMatters: true, milk: { foamCm: [1.0, 2.0] },
  learnPoint: '라떼보다 거품층이 두꺼운 메뉴. 공기 주입을 더 길게', teacherCheck: true },

{ id: 'iced-americano', name: '아이스 아메리카노', temp: 'iced', cup: 'icedCup', shot: 'doppio',
  steps: [{ ingredient: 'ice', amount: 3, unit: 'scoop' }, { ingredient: 'coldWater', amount: 200, unit: 'ml' },
          { ingredient: 'espresso', amount: 60, unit: 'ml' }],
  orderMatters: true,
  learnPoint: '얼음 → 물 → 에스프레소 순서로 담아 크레마를 위에 살린다(수업 기준 레시피)', teacherCheck: true },
```

- **전체 분량**: 메뉴 17개 — 에스프레소, 도피오, 리스트레토, 룽고, 아메리카노, 카페라떼, 카푸치노, 플랫화이트(리스트레토 2샷 기준), 마키아토, 아이스 아메리카노, 아이스 라떼(얼음 → 찬 우유 → 에스프레소), 바닐라 라떼, 아이스 바닐라 라떼, 카페모카(초코 소스 → 에스프레소 → 스팀 우유 → 휘핑), 콘파냐(에스프레소 + 휘핑), 아포가토(아이스크림 → 에스프레소), 코르타도(에스프레소 + 비슷한 양의 스팀 우유, 얇은 거품)
- **거품 기준 기본값**(teacherCheck): 카푸치노 1.0~2.0cm, 카페라떼 0.5~1.0cm, 플랫화이트 0~0.5cm, 마키아토는 거품 얹기 1스푼
- 레시피 수치는 일반적인 기준값이다. 수업 교재와 다르면 교사가 이 파일만 고치면 된다
- `src/data/feedback.ts`: MistakeCode 17개 전부에 MistakeInfo 작성. 예시
  - `UNDER_EXTRACTED`: 손님 "음… 시큼하고 밍밍해요." / 원리 "추출 시간이 너무 짧으면 맛 성분이 덜 녹아 나와 신맛이 튀고 얇아져요." / 고치는 법 "그라인더 다이얼을 곱게(숫자를 작게) 돌려 보세요." / 실습 "샷 추출 시간을 초시계로 재고 20~30초 안인지 확인"
  - `MILK_SCALDED`: 손님 "우유에서 탄 맛이 나요." / 원리 "우유를 너무 뜨겁게 데우면 단맛이 줄고 비린 맛·탄 맛이 나요." / 고치는 법 "온도계가 초록 구간일 때 손을 떼세요." / 실습 "피처를 손으로 잡고 뜨거워 손을 대기 힘들어지는 시점과 온도계 수치를 비교"
  - `WRONG_ORDER`: 손님 "어, 크레마가 다 가라앉았네요." / 원리 "아이스 메뉴는 얼음과 물(우유)을 먼저 담고 에스프레소를 마지막에 부어야 층과 크레마가 살아요." / 고치는 법 "레시피 카드 순서대로 담기" / 실습 "실습에서 담는 순서를 바꿔 두 잔을 비교해 보기"
- `src/data/customers.ts`: 손님 유형 3개, 반응 대사(만족·보통·반품·이탈) 유형별 4줄 이상
- `src/data/stages.ts`: 4절 + 5.9절 표를 StageConfig 7개로
- `src/data/tutorial.ts`: 선배 바리스타 안내 대사와 단계(하이라이트할 버튼 id 포함)
- `src/data/practiceChecks.ts`: 결과 화면 실습 체크리스트 문구(MistakeCode와 연결)

---

## 7. 아트·사운드 가이드

- **테마**: 골목 끝 작은 동네 카페의 바(bar). 따뜻한 나무 카운터, 크림색 벽, 오후 햇살. 고유 세계관과 연출 요소는 THEME.md에 정리
- **팔레트**
  - 에스프레소 `#3B2418` / 크레마 `#C68B59` / 우유 `#F7EFE5` / 나무 `#8A5A3B` / 잉크(본문) `#2A1E17`
  - 좋음 `#4CAF7A` / 주의 `#E0A43A` / 위험 `#D2553F` / 차가움(얼음·낮은 온도) `#6FA8DC`
- **폰트**(Google Fonts): 제목 Jua, 본문 Noto Sans KR
- **그림**: 모든 에셋은 SVG·CSS로 직접 그린다. 컵 단면도, 머신, 피처, 손님(단순한 도형 캐릭터). 외부 이미지·실존 브랜드 로고·상용 머신 디자인 금지
- **연출**: 샷이 흐르는 줄기, 크레마 색 변화, 스팀 김, 컵이 손님에게 미끄러지는 애니메이션(Framer Motion), 콤보 시 팁 동전 튀기
- **효과음**: Web Audio로 생성 — 그라인더 윙, 추출 졸졸, 스팀 쉬익(온도가 오르면 음이 낮아짐: 실제 스티밍의 소리 변화 단서), 서빙 벨, 반품 짧은 저음, 콤보 상승음. 외부 음원 파일 사용 금지
- **배경음**: Web Audio로 만든 잔잔한 루프(끄기 가능). 기본값은 꺼짐

---

## 8. 접근성

- 터치 대상 최소 64px, 버튼 사이 간격 8px 이상
- 키보드·터치 모두 지원(5.2)
- TTS(Web Speech API, ko-KR): 주문 읽어주기, 선배 안내 읽어주기. 미지원 브라우저면 조용히 비활성
- 색만으로 정보를 전달하지 않는다: 온도계·게이지에 숫자와 아이콘을 함께 표시
- 게임 속도 '느림', 연습 모드(타이머 없음)
- 일시정지, 소리 끄기 상시 제공

---

## 9. 개인정보·보안 기본값

- 이름·연락처·생년월일을 받지 않는다. 학생 구분은 '모둠 번호(1~8)' 또는 '개인 연습'만
- 기록은 이 기기의 localStorage에만 저장. 외부 전송 없음, 분석 도구·광고 스크립트 없음
- 카메라·마이크 사용 없음
- API 키·비밀값 없음(`VITE_`에 비밀값 금지)
- 오류는 쉬운 한국어 안내만 표시, 스택 노출 금지. localStorage 접근은 try/catch로 감싸고 실패해도 게임은 진행
- 푸터: `© 2026 [공급자명] · 개인정보 처리방침 · 이용 안내` 자리 확보(에듀집 등록 대비, 링크는 빈 페이지로 우선 생성)
- CSV 내보내기는 브라우저 다운로드로만 처리

---

## 10. 폴더 구조

```
rush-hour-bar/
├─ GAME_PLAN.md
├─ THEME.md
├─ README.md
├─ index.html
├─ src/
│  ├─ main.tsx, App.tsx
│  ├─ data/        types.ts, standards.ts, menus.ts, stages.ts, customers.ts,
│  │               feedback.ts, tutorial.ts, practiceChecks.ts
│  ├─ game/        shotModel.ts, steamModel.ts, judge.ts, scoring.ts,
│  │               orderQueue.ts, difficulty.ts, hygiene.ts, store.ts(Zustand), useGameLoop.ts
│  ├─ components/
│  │  ├─ stations/ EspressoStation.tsx, SteamStation.tsx, AssemblyStation.tsx, ServeStation.tsx
│  │  ├─ CupView.tsx, Thermometer.tsx, ShotGlass.tsx, GrinderDial.tsx,
│  │  ├─ OrderTicket.tsx, CustomerLane.tsx, PatienceBar.tsx, SpeechBubble.tsx, Footer.tsx
│  ├─ screens/     Title.tsx, Tutorial.tsx, GroupSelect.tsx, StageSelect.tsx, Prep.tsx,
│  │               Play.tsx, Result.tsx, Settings.tsx, TeacherLog.tsx, Privacy.tsx, Terms.tsx
│  ├─ audio/       sfx.ts, bgm.ts, tts.ts
│  └─ storage/     save.ts
└─ tests/          shotModel.test.ts, steamModel.test.ts, judge.test.ts, scoring.test.ts,
                   orderQueue.test.ts, data.test.ts
```

- 스택: React + Vite + TypeScript + Tailwind CSS + Framer Motion + Zustand, 테스트 Vitest
- 게임 시간 처리는 `useGameLoop`(requestAnimationFrame + 일시정지 지원). 모델·판정은 React와 분리된 순수 함수

---

## 11. 작업 분배 (오케스트레이션)

- **메인 세션(Opus)**: 아키텍처, `data/types.ts`, `game/` 전체(샷·스티밍 모델, 판정, 점수, 주문 큐, 위생, 스토어, 게임 루프), 통합, 밸런스 조정, 최종 검수
- **Sonnet 서브에이전트(병렬)**
  - A: `stations/` 4개 + `CupView`, `ShotGlass`, `Thermometer`, `GrinderDial`
  - B: `screens/` (Title, GroupSelect, StageSelect, Prep, Result, Settings, TeacherLog, Privacy, Terms) + `Footer`
  - C: `CustomerLane`, `OrderTicket`, `PatienceBar`, `SpeechBubble`, Tutorial 화면, `audio/` (sfx·bgm·tts)
- **Haiku 서브에이전트**: `menus.ts` 17개, `feedback.ts` 17개, `customers.ts`, `practiceChecks.ts`, `tutorial.ts` 데이터 채우기, README
- 위임 규칙: 각 서브에이전트에 ① 받는 props/입력 타입(`data/types.ts`, `game/store.ts`의 셀렉터) ② 만들 파일 경로 ③ 팔레트·폰트·64px 규칙 ④ "게임 로직을 컴포넌트 안에 새로 만들지 말고 game/ 함수를 호출" 규칙을 명세로 넘긴다
- 데이터 수치는 서브에이전트가 임의로 바꾸지 않는다. 6절 값을 그대로 쓴다

---

## 12. 완료 기준

- [ ] `npx tsc --noEmit` 에러 0
- [ ] `npm run build` 통과
- [ ] 판정·점수·난이도 로직 vitest 단위 테스트 통과 (최소: 샷 판정 경계값, 스티밍 온도·거품·거친 거품, 레시피 구성·비율·순서, 다른 메뉴로 인식, 점수 배분·재배분, 콤보, 위생 감점, 주문 큐 동시 주문 상한, menus.ts 데이터 무결성)
- [ ] 7개 스테이지와 연습 모드를 처음부터 끝까지 플레이 가능(막히는 지점 없음). 각 스테이지 클리어 가능성을 시뮬레이션 테스트(정답 입력 봇)로 확인
- [ ] 태블릿 가로(1280×800)·휴대폰 세로(390×844)·전자칠판(1920×1080)에서 화면 깨짐 없음
- [ ] 콘솔 에러 0, 화면 코드에 키·비밀값 없음 (`grep -r "VITE_.*KEY" src` 결과 첨부)
- [ ] README: 실행·배포 방법, 데이터 바꿔 재사용하는 방법, **교사 확인 필요 수치 목록**(teacherCheck 항목 표)
- [ ] 완료 선언 전 실행 결과 첨부. 통과 못 한 항목은 "진행 중 + 남은 항목"으로 보고

---

## 13. MVP 범위

- **1차(이번 작업)**: 7개 스테이지, 연습 모드, 튜토리얼, 결과 화면(실수 노트·실습 체크리스트), 교사용 기록·CSV, 설정, TTS, Web Audio 효과음
- **나중에**: 전자칠판 2인 협동 모드(한 화면에서 두 사람이 작업대를 나눠 맡기), 사이즈(톨·그란데) 주문, 라떼아트 미니 단계, 자유 영업(엔드리스) 모드, 원두 산지별 맛 차이

---

## 14. 위험 요소

- **저작권·상표**: 실존 카페 브랜드명·로고, 커피머신 제조사명·디자인, 기존 요리 게임의 캐릭터·연출 차용 금지. 모든 캐릭터·그림은 오리지널
- **수치 정확성**: 추출 시간·추출량·스티밍 온도·거품 두께는 교재마다 기준이 조금씩 다르다. 모두 `standards.ts`·`menus.ts`에 모으고 `teacherCheck`로 표시해 교사가 대조한다
- **개인정보**: 이름 입력 없음, 모둠 번호만. 외부 전송 없음
- **서버 필요 기능**: 없음. 반 전체 기록 취합은 각 기기 CSV를 교사가 모으는 방식으로 대신한다
