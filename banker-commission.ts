/**
 * T195 · 뱅커 수수료(커미션) · 순이익 · 총 반환액 계산 모듈 (순수 산술, 무의존성)
 *
 * 단위 정의
 * - 1 output unit = 0.0001 KRW. 정수 unit로만 계산하므로 반올림/부동소수 오차가 없다.
 * - 최대 결과: 원금 1,000,000,000 KRW + 수수료율 100% → 모든 값 <= 2e13 (safe integer 이내).
 *
 * 계산식 (S = 원금 KRW, B = 수수료율 basis points, 5% = 500bp)
 * - commissionUnits  = S * B                      (수수료는 원금 기준)
 * - netProfitUnits  = S * 10000 - commissionUnits (순이익, 원금 제외)
 * - totalReturnUnits = S * 20000 - commissionUnits (총 반환액, 원금 포함)
 *
 * 가정과 범위 (페이지 문구와 동일한 교육용 가정)
 * - 뱅커 베팅이 이겼고, 수수료를 차감하기 전 순이익이 1:1인 경우만 계산한다.
 * - 패배/타이, 수수료 면제 게임, 뱅커 합계가 6일 때의 특별 지급 규칙, 실제 정산·수취 방식은 반영하지 않는다.
 * - 수수료율을 0%로 입력해도 수수료 면제 게임의 지급 규칙이 성립한다는 뜻이 아니다.
 */

export const UNITS_PER_KRW = 10000;
export const MAX_STAKE_KRW = 1000000000;
export const MAX_RATE_PERCENT = 100;

export type BankerCommissionSuccess = {
  ok: true;
  commissionUnits: number;
  netProfitUnits: number;
  totalReturnUnits: number;
};

export type BankerCommissionFailure = {
  ok: false;
  error: string;
};

export type BankerCommissionResult = BankerCommissionSuccess | BankerCommissionFailure;

const STAKE_PATTERN = /^[0-9]+$/;
const RATE_PATTERN = /^[0-9]+(\.[0-9]{1,2})?$/;

function stripLeadingZeros(digits: string): string {
  const stripped = digits.replace(/^0+(?=[0-9])/, "");
  return stripped === "" ? "0" : stripped;
}

function parseStake(value: unknown): { ok: true; stake: number } | { ok: false; error: string } {
  if (typeof value !== "string") {
    return { ok: false, error: "베팅 금액은 숫자 문자열로 입력해 주세요." };
  }
  const text = value.trim();
  if (text.length === 0) {
    return { ok: false, error: "베팅 금액을 입력해 주세요." };
  }
  if (!STAKE_PATTERN.test(text)) {
    return { ok: false, error: "베팅 금액은 숫자만으로 0원 이상 10억 원 이하의 정수로 입력해 주세요." };
  }
  const digits = stripLeadingZeros(text);
  if (digits.length > 10) {
    return { ok: false, error: "베팅 금액은 0원 이상 10억 원 이하로 입력해 주세요." };
  }
  const stake = Number(digits);
  if (!Number.isSafeInteger(stake) || stake > MAX_STAKE_KRW) {
    return { ok: false, error: "베팅 금액은 0원 이상 10억 원 이하로 입력해 주세요." };
  }
  return { ok: true, stake };
}

function parseRate(value: unknown): { ok: true; basisPoints: number } | { ok: false; error: string } {
  if (typeof value !== "string") {
    return { ok: false, error: "수수료율(%)은 숫자 문자열로 입력해 주세요." };
  }
  const text = value.trim();
  if (text.length === 0) {
    return { ok: false, error: "수수료율(%)을 입력해 주세요." };
  }
  if (!RATE_PATTERN.test(text)) {
    return { ok: false, error: "수수료율(%)은 0 이상 100 이하의 숫자로, 소수점은 둘째 자리까지만 입력해 주세요." };
  }
  const parts = text.split(".");
  const integerPart = stripLeadingZeros(parts[0] ?? "0");
  const fractionPart = parts[1] ?? "";
  if (integerPart.length > 3) {
    return { ok: false, error: "수수료율(%)은 0 이상 100 이하로 입력해 주세요." };
  }
  const integerValue = Number(integerPart);
  if (integerValue > MAX_RATE_PERCENT) {
    return { ok: false, error: "수수료율(%)은 0 이상 100 이하로 입력해 주세요." };
  }
  const fractionValue = fractionPart.length === 0 ? 0 : Number(fractionPart.padEnd(2, "0"));
  if (integerValue === MAX_RATE_PERCENT && fractionValue > 0) {
    return { ok: false, error: "수수료율(%)은 0 이상 100 이하로 입력해 주세요." };
  }
  return { ok: true, basisPoints: integerValue * 100 + fractionValue };
}

/**
 * 뱅커 수수료 · 순이익 · 총 반환액 계산.
 * 입력: stake = 원금(KRW) 숫자 문자열, rate = 수수료율(%) 숫자 문자열.
 * 출력 성공: ok:true + 세 개의 정수 unit 값 / 실패: ok:false + 한국어 오류 문구.
 */
export function calculateBankerCommission(input: unknown): BankerCommissionResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "베팅 금액과 수수료율(%)을 입력해 주세요." };
  }
  const { stake, rate } = input as { stake?: unknown; rate?: unknown };

  const stakeResult = parseStake(stake);
  if (!stakeResult.ok) {
    return { ok: false, error: stakeResult.error };
  }
  const rateResult = parseRate(rate);
  if (!rateResult.ok) {
    return { ok: false, error: rateResult.error };
  }

  const stakeKrw = stakeResult.stake;
  const basisPoints = rateResult.basisPoints;

  const commissionUnits = stakeKrw * basisPoints;
  const netProfitUnits = stakeKrw * UNITS_PER_KRW - commissionUnits;
  const totalReturnUnits = stakeKrw * 2 * UNITS_PER_KRW - commissionUnits;

  return { ok: true, commissionUnits, netProfitUnits, totalReturnUnits };
}

/**
 * unit 값을 원 단위 문자열로 변환 (최대 4자리 소수, 후행 0 제거, 천단위 콤마, "원" 접미).
 * 예: 50000000 → "5,000원", 500 → "0.05원", 1 → "0.0001원", 0 → "0원".
 */
export function formatBankerKrw(units: number): string {
  if (typeof units !== "number" || !Number.isFinite(units)) {
    return "0원";
  }
  const negative = units < 0;
  const absolute = Math.abs(Math.trunc(units));
  const whole = Math.floor(absolute / UNITS_PER_KRW);
  const fraction = absolute - whole * UNITS_PER_KRW;
  const wholeText = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fractionText = fraction.toString().padStart(4, "0").replace(/0+$/, "");
  const decimalPart = fractionText.length > 0 ? `.${fractionText}` : "";
  return `${negative ? "-" : ""}${wholeText}${decimalPart}원`;
}
