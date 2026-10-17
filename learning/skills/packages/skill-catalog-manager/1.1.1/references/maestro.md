# Maestro 구현과 인계

이 절은 Maestro 홈페이지를 관리할 때 읽는다. 다른 사이트에서는 해당 프로젝트의 문서를 따른다.

llm-wiki 작업 공간의 상대경로:

- 운영 지침: work_productivity/docs/홈페이지_운영.md
- 구성·결정 기록: work_productivity/docs/2026-10-18_스킬서재_구성제안.md
- 스킬 관리대장: work_productivity/docs/AI_도구_설치관리.md
- 홈페이지 원본: work_productivity/web/personal-homepage/
- 페이지: learning/skills/index.html (layout: page → base)
- 본문: _includes/skill-catalog.html
- 전용 스타일·동작: assets/maestro/skills/catalog.css·catalog.js
- 검토 입력: assets/maestro/skills/catalog-reviewed.json
- 공개 변경 기록: assets/maestro/skills/changes.json
- 공개 JSON과 패키지: assets/maestro/skills/
- 생성 스크립트: scripts/build_skill_catalog.py
- 배움 하위 메뉴: _includes/learning-navigation.html
- 전체 메뉴: _data/maestro_navigation.yml

작성 소스는 비공개 저장소다. 게시에는 기존 scripts/export_public.py를 사용해 사진·비공개 글을 제거한 공개 사본을 만든다. 생성한 Jekyll _site 전체를 공개 저장소로 직접 복사하지 않는다. 카탈로그를 추가해도 기존 OneDrive 원본·로그인·비공개 사진 접근은 바꾸지 않는다. DNS 전환은 이 스킬의 범위가 아니다.

배포는 홈페이지 운영 지침의 현재 방법을 따른다. 과거 기록의 계정·커밋·정적 집계 숫자를 현재 상태로 단정하지 않는다. 카탈로그 제작 지시는 모든 스킬의 설치·삭제 권한을 뜻하지 않는다.

생성 스크립트는 공통 레이아웃을 쓰는 페이지와 본문·전용 CSS/JS를 갱신한다. 독립 전체 HTML을 학습 페이지에 직접 넣지 않는다. 파일 변경은 references/lifecycle.md를 따라 카탈로그와 대장에 함께 남긴다.
