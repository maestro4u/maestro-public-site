# 카탈로그 데이터와 패키지

## 목록 항목

필수: id, name, title, category, summary, example, result, platforms, scope, origin, modified, rank, package.

- id: 출처와 실제 원본을 구분하는 안정적 식별자. 이름만으로 중복 제거하지 않는다.
- scope: direct / system / plugin.
- created: 확인된 작성일이 있으면 ISO 형식으로 추가한다. 없으면 생략한다.
- modified: 확인한 설치 파일 수정 시각. upstream 작성일과 다르다.
- package: 조사 전에는 null. 포함 시 manifest와 texts를 둔다.

기본 정렬은 saved_at 또는 installed_at를 기준으로 내림차순이며, 없으면 modified를 대체 기준으로 사용한다. 시각은 시간대가 포함된 ISO 형식으로 기록하고 실제 시각으로 비교한다. 동률은 name과 id로 안정 정렬한다. created는 별도 최근작성순에서 사용한다. 출처·작성일·검증일·사용일을 혼용하지 않는다.

## 패키지 명세

manifest에 schema_version, id, entrypoint, source(repository/ref/path), version, license, files(path/bytes/sha256), dependencies, compatibility, bundle, installed_copy, install_ready, uninstall을 기록한다. files는 상대경로만 사용한다. texts는 원문을 제공하는 상대경로와 내용의 대응표이다. 그림·대용량 파일을 목록만 제공하면 그 상태를 표시한다.

공개 ZIP은 SKILL.md가 있는 스킬 디렉터리, 필수 보조 문서·스크립트·템플릿·라이선스를 포함한다. 경로 탈출·절대경로·심볼릭 링크를 검사한다. 공개 원본과 로컬 수정본을 구분한다. 패키지·보조 원문·명세 링크를 실제로 열어 확인한다.

설치 준비 완료는 경로·버전·라이선스·필수 파일·의존 도구를 확인한 경우에만 표시한다. 단순 원문 열람 가능 여부와 다르다. 런타임 실행 검증 여부는 별도다.

## 변경과 삭제

비공개 대장에 실제 설치 경로, 원본 해시, 도구별 링크, 로컬 수정, 설정 소유 관계와 백업 경로를 남긴다. 공개 명세에 개인 경로·비밀을 넣지 않는다.

업데이트는 고정 버전과 변경 내역, 로컬 수정, 호환성을 비교한다. 공유 묶음의 한 스킬을 다룰 때 묶음 전체 변경과 개별 변경을 구분한다.

삭제 대상은 소유 파일·소유 링크·소유 설정이다. 공유 CLI·런타임·캐시는 역방향 의존성을 확인한 뒤 처리한다. 기존 관리자의 삭제 기능이 런타임까지 제거한다고 가정하지 않는다. 사용자 산출물·원본 자료는 보존하며, 복구 가능한 제거와 영구 삭제를 구분한다.

## 참고 사이트

목록 항목의 references 배열에는 title, url, purpose, type(official 또는 reference)을 기록한다. 공통 참고 사이트는 reference_sites에도 둔다. 실제 링크는 https/http URL만 허용한다. 사용자가 지정한 Remotion Kit 마켓플레이스 https://remotion-kit.com/marketplace 는 카탈로그와 모션그래픽 구성 참고 사이트다. 원문 재배포 조건이 미확인인 외부 스킬은 원문·보조파일의 고정 커밋 링크와 메타데이터를 제공하며, 빈 원문을 제공 완료라고 표시하지 않는다.
