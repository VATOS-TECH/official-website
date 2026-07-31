# VATOS Official Website

VATOS 공식 홈페이지의 정적 웹 소스입니다.

현재 버전은 화면 구성과 주요 인터랙션을 구현한 **Alpha 버전**이며, 세부 디자인과 반응형 동작은 계속 조정될 수 있습니다.

## Project Status

| 항목 | 내용 |
|---|---|
| 상태 | Alpha |
| 기준일 | 2026-07-31 |
| 저장소 | [VATOS-TECH/official-website](https://github.com/VATOS-TECH/official-website) |

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- GSAP
- Pretendard

별도의 프레임워크, 패키지 설치 또는 빌드 과정 없이 실행되는 정적 웹사이트입니다.

## Source Architecture

- 각 HTML 파일이 해당 페이지의 문서 구조를 가집니다.
- 공통 스타일과 페이지별 스타일은 `assets/css/vatos-style.css`에서 관리합니다.
- 공통 UI와 페이지별 인터랙션은 `assets/js/vatos-interact.js`에서 관리합니다.
- 메인 페이지 애니메이션에는 GSAP을 사용합니다.
- `header.html`과 `footer.html`은 공통 레이아웃 소스입니다.

## Directory Structure

```text
vatos-official-website/
├── index.html
├── contact.html
├── header.html
├── footer.html
├── about/
│   ├── company.html
│   ├── history.html
│   └── location.html
├── business/
│   ├── business-license.html
│   ├── business-operations-technical-support.html
│   ├── business-performance-consulting.html
│   ├── business-migration-conversion.html
│   └── business-training.html
├── crew/
│   └── culture.html
├── insights/
│   ├── tech-insights.html
│   └── insight_0.html ~ insight_14.html
└── assets/
    ├── css/
    │   └── vatos-style.css
    ├── js/
    │   ├── oopy-loader.js
    │   └── vatos-interact.js
    ├── vendor/
    │   └── gsap.min.js
    ├── images/
    └── files/
        └── vatos-company-profile.pdf
```

## Main Files

| 파일 | 역할 |
|---|---|
| `assets/css/vatos-style.css` | 전체 페이지의 공통·페이지별·반응형 스타일 |
| `assets/js/vatos-interact.js` | 공통 UI와 페이지별 인터랙션 |
| `assets/js/oopy-loader.js` | 공통 레이아웃과 스크립트의 동적 초기화 |
| `assets/vendor/gsap.min.js` | 메인 화면 애니메이션 라이브러리 |
| `header.html` | 공통 Header와 Navigation |
| `footer.html` | 공통 Footer |

## Pages

| 분류 | 페이지 |
|---|---|
| Main | Home |
| About VATOS | Company, History, Location |
| Business Areas | License, Operations & Technical Support, Performance Consulting, Migration & Conversion, Training |
| Crew | Culture |
| Insights | Tech Insights, Insight 상세 게시글 |
| Contact | 서비스 문의 |

## Interaction Features

`vatos-interact.js`는 대상 요소가 존재할 때만 해당 기능을 초기화합니다.

- Header 스크롤 상태
- Desktop Dropdown Navigation
- Mobile Navigation
- Anchor Smooth Scroll
- 공통 Scroll Reveal
- Motion Mask
- 메인 Intro
- 메인 Hero Typing
- Business Areas 스크롤 전환
- 서브페이지 Hero 애니메이션
- 강조 문구 애니메이션
- 서비스 목록 순차 등장
- Process와 Flow 애니메이션
- History Timeline
- 3D Card Carousel
- Card Marquee
- Tech Insights Pagination
- Contact Form
- Location 주소 복사

`prefers-reduced-motion` 설정이 활성화된 환경에서는 일부 자동 애니메이션을 줄이거나 비활성화합니다.

## CSS and Class Rules

프로젝트에서 관리하는 클래스는 외부 클래스와 구분할 수 있도록 `vatos-` 접두어를 사용합니다.

```css
.vatos-header
.vatos-sub-hero
.vatos-service-item
.vatos-carousel-3d
```

상태 클래스는 요소 클래스 뒤에 간단한 형태로 사용합니다.

```css
.vatos-slider-item.active
.vatos-motion-reveal.visible
.vatos-sub-hero.ready
.vatos-business-flow.drawn
```

페이지 구분은 Body 또는 콘텐츠 최상위 요소의 클래스를 기준으로 합니다.

```html
<body class="vatos-page-main">
<body class="vatos-page-sub">
<main class="vatos-sub-content" data-vatos-service="license">
```

## Asset Paths

루트 HTML과 하위 폴더 HTML은 상대경로의 깊이가 다릅니다.

### Root page

```html
<link rel="stylesheet" href="assets/css/vatos-style.css">
<script src="assets/js/vatos-interact.js"></script>
```

### Sub page

```html
<link rel="stylesheet" href="../assets/css/vatos-style.css">
<script src="../assets/js/vatos-interact.js"></script>
```

## Local Development

브라우저에서 파일을 직접 여는 것보다 VS Code Live Server와 같은 로컬 서버 사용을 권장합니다.

```text
http://127.0.0.1:5500/
```

확인 순서는 다음과 같습니다.

1. 저장소를 내려받습니다.
2. 프로젝트 루트를 VS Code에서 엽니다.
3. Live Server로 `index.html`을 실행합니다.
4. 변경한 페이지를 PC와 모바일 너비에서 확인합니다.
5. Console 오류와 Network의 404 응답을 확인합니다.

## Update Checklist

### HTML 수정

- 기존 `vatos-` 클래스 명명 규칙을 유지했는가
- 루트와 하위 폴더의 상대경로가 올바른가
- 이미지에 적절한 `alt`가 있는가

### CSS 수정

- 기존 공통 스타일과 중복되지 않는가
- 특정 페이지 스타일의 범위가 충분히 제한되어 있는가
- 모바일과 `prefers-reduced-motion`을 함께 확인했는가

### JavaScript 수정

- 대상 요소가 없을 때 안전하게 종료하는가
- 동일 컴포넌트가 중복 초기화되지 않는가
- 이벤트와 Timer가 불필요하게 중복 등록되지 않는가

## Alpha Notes

- 본 버전은 세부 디자인 조정 전 기준 소스입니다.
- 디자인과 인터랙션은 운영 검토 과정에서 변경될 수 있습니다.
- 공통 스타일과 인터랙션은 각각 단일 CSS·JavaScript 파일을 중심으로 관리합니다.
- 신규 기능 반영 후에는 관련 페이지의 PC·모바일 화면을 함께 검증해야 합니다.

## License

이 저장소의 소스와 디자인 자산은 VATOS 공식 홈페이지 운영을 위한 내부 자산입니다.

외부 배포, 복제 및 상업적 사용을 허용하지 않습니다.
