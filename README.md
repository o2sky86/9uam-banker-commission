# 뱅커 수수료·순이익·총 반환액 계산 모듈

런타임 의존성이 없는 순수 산술 TypeScript 모듈입니다. 바카라 뱅커 베팅의 수수료(커미션), 차감 후 순이익, 원금 포함 총 반환액을 정수로 계산합니다.
9UAM에서 공개하는 교육용 산술 모듈이며, MIT 라이선스로 사용할 수 있습니다.

## 계산 전제
- 뱅커 베팅이 이겼고, 수수료 차감 **전** 순이익이 **1:1**인 경우만 다룹니다.
- 패배·타이, 수수료 면제 게임, 뱅커 합계 6 특별 지급, 실제 정산·수취 방식은 반영하지 않습니다.
- 수수료율을 `0`으로 입력해도 수수료 면제 게임의 지급 규칙이 성립한다는 뜻이 아닙니다.
- 반환값은 수학적 값이며, 실제 서비스의 반올림·절사 처리는 모델링하지 않습니다.
- 예측·수익 보장·베팅 금액 조언·운영자 추천을 제공하지 않습니다.

## API
```ts
import { calculateBankerCommission, formatBankerKrw } from "./banker-commission";

const r = calculateBankerCommission({ stake: "100000", rate: "5" });
if (r.ok) {
  console.log(formatBankerKrw(r.commissionUnits));  // "5,000원"
  console.log(formatBankerKrw(r.netProfitUnits));   // "95,000원"
  console.log(formatBankerKrw(r.totalReturnUnits)); // "195,000원"
} else {
  console.error(r.error); // 한국어 오류 문구
}
```

입력은 모두 문자열입니다. `stake`는 `0` 이상 `1000000000`(10억) 이하 정수, `rate`는 `0` 이상 `100` 이하이면서 소수점 둘째 자리까지입니다.
출력은 `{ ok: true, commissionUnits, netProfitUnits, totalReturnUnits }`(정수) 또는 `{ ok: false, error }`(한국어 문구)입니다.
단위는 `1 unit = 0.0001 KRW`이며, 원(KRW) 문자열로 표시하려면 `formatBankerKrw`를 결과 필드에 적용하세요.

## 계산식
`S` = 원금(KRW), `B` = 수수료율 베이시스 포인트(5% = 500)

- `commissionUnits = S × B`
- `netProfitUnits = S × 10000 − commissionUnits` (원금 제외)
- `totalReturnUnits = S × 20000 − commissionUnits` (원금 포함)

원금 10억·수수료율 100%에서도 모든 값은 `2e13` 이하로 안전 정수 범위에 들어옵니다.

## 손계산 예시 2건
**예시 1 — 100,000원·5%**: `commissionUnits = 100000 × 500 = 50,000,000` → 수수료 5,000원. `netProfitUnits = 1,000,000,000 − 50,000,000 = 950,000,000` → 순이익 95,000원(원금 제외). `totalReturnUnits = 2,000,000,000 − 50,000,000 = 1,950,000,000` → 총 반환액 195,000원(원금 포함).

**예시 2 — 1원·5%**: `commissionUnits = 500` → 0.05원, `netProfitUnits = 10,000 − 500 = 9,500` → 0.95원, `totalReturnUnits = 20,000 − 500 = 19,500` → 1.95원. 수학적 값이며 실제 소수점 정산 방식은 다루지 않습니다.

## 환경
단일 소스 파일로 런타임 의존성은 없지만, TypeScript 파일이므로 컴파일·실행 환경은 사용자가 직접 준비해야 합니다. 브라우저나 모든 툴체인에서 곧바로 실행된다는 보장은 하지 않습니다.

## 출처와 상태
- 이 파일은 9UAM 프로젝트에서 승인된 원본과 바이트 단위로 동일하며, 내용을 수정하지 않았습니다. 새로 만든 테스트 결과를 주장하지 않습니다.
- MIT 라이선스가 적용됩니다. 이용 조건과 보증 부인은 `LICENSE` 파일을 확인하세요.
- 전제가 되는 배당·수수료 규칙은 [바카라 규칙 안내](https://www.9uam.com/guides/baccarat-rules) 페이지에서 확인할 수 있습니다.
