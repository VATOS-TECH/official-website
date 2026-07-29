# VATOS Official Website

VATOS 공식 홈페이지의 정적 HTML, CSS, JavaScript 및 Oopy 연동 파일을 관리하는 저장소입니다.

홈페이지 콘텐츠는 Notion에서 작성하고 Oopy에서 렌더링하며, 공통 레이아웃과 디자인 자산은 GitHub Pages를 통해 제공합니다.

## 운영 구조

| 구분 | 역할 |
| --- | --- |
| Notion | 페이지별 콘텐츠 작성 및 관리 |
| Oopy | Notion 콘텐츠 렌더링, Clean URL 및 도메인 제공 |
| GitHub | 홈페이지 소스와 변경 이력 관리 |
| GitHub Pages | CSS, JavaScript, 이미지, Header, Footer 파일 제공 |

## 디렉터리 구조

```text
official-website/
├─ index.html
├─ contact.html
├─ header.html
├─ footer.html
├─ about/
├─ business/
├─ crew/
├─ insights/
└─ assets/
   ├─ css/
   │  └─ vatos-style.css
   ├─ js/
   │  ├─ oopy-loader.js
   │  └─ vatos-interact.js
   ├─ images/
   ├─ files/
   └─ vendor/
      └─ gsap.min.js
```

## 주요 파일

| 파일 | 역할 |
| --- | --- |
| `vatos-style.css` | 공통 레이아웃과 페이지별 디자인 |
| `vatos-interact.js` | 메뉴, 인트로, 타이핑, 스크롤, 슬라이드 등 화면 동작 |
| `oopy-loader.js` | Oopy에서 Header, Footer와 필요한 JavaScript를 호출하는 초기화 파일 |
| `header.html` | 공통 PC 메뉴와 모바일 햄버거 메뉴 |
| `footer.html` | 공통 Footer |
| `gsap.min.js` | 메인 Hero 문구 애니메이션에 사용하는 외부 라이브러리 |

## Oopy 설정

### Head

Oopy HTML 편집기의 `<head>` 영역에 다음 내용을 설정합니다.

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css">
<link rel="stylesheet" href="https://vatos-tech.github.io/official-website/assets/css/vatos-style.css?v=0.1">

<style>
.page-title {
  display: none !important;
}

.notion-page-content.width.padding {
  width: 100% !important;
  max-width: none !important;
  padding: 0 !important;
}

section[aria-label^="Notifications"] {
  display: none !important;
}

html body div.css-wru17g.ej0hkt126 {
  display: none !important;
}
</style>
```

### Body

Oopy HTML 편집기의 `<body>` 영역에는 초기화 파일만 호출합니다.

```html
<script src="https://vatos-tech.github.io/official-website/assets/js/oopy-loader.js?v=0.1"></script>
```

`oopy-loader.js`는 다음 순서로 실행됩니다.

1. `header.html`, `footer.html` 호출
2. 공통 레이아웃의 assets 경로 보정
3. 현재 페이지 유형 판별 및 body class 지정
4. 메인 페이지에서만 GSAP 호출
5. `vatos-interact.js` 호출

## 수정 및 배포

1. 로컬에서 HTML, CSS, JavaScript 수정
2. 로컬 웹 서버에서 화면과 개발자 도구 오류 확인
3. GitHub 저장소에 변경사항 반영
4. GitHub Pages 배포 완료 확인
5. Oopy 화면에서 최종 확인

## 경로 및 관리 규칙

- 파일과 폴더 이름은 영문 소문자와 하이픈을 사용합니다.
- 공통 스타일은 `vatos-style.css`에서 관리합니다.
- 화면 동작은 `vatos-interact.js`에서 관리합니다.
- Oopy 전용 초기화 기능은 `oopy-loader.js`에서만 관리합니다.
- Oopy 공통 Header와 Footer의 내부 페이지 링크는 운영 도메인의 Clean URL을 사용합니다.
- 이미지, PDF 등 assets 경로는 GitHub Pages 주소를 기준으로 보정합니다.
- 외부 라이브러리는 `assets/vendor`에서 별도로 관리합니다.

## 확인 사항

- Oopy에서 생성하는 클래스명은 서비스 업데이트에 따라 변경될 수 있습니다.
- 우피 기본 메뉴가 다시 표시되면 `<head>`의 메뉴 숨김 선택자를 확인합니다.
- `header.html`과 `vatos-interact.js`는 공통 Header ID인 `vatosHeader`를 사용합니다.
- 메인 페이지의 GSAP 호출을 제거하면 Hero 보조 문구 애니메이션 표현이 달라질 수 있습니다.

## Copyright

© 2026 VATOS Co., Ltd. All rights reserved.
