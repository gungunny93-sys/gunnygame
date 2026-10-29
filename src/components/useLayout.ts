// 화면 배치 판정: 휴대폰 세로(좁은 세로 화면)면 작업대를 탭으로 전환한다.
import { useEffect, useState } from 'react';

const QUERY = '(max-width: 900px) and (orientation: portrait)';

export function useIsPortraitPhone(): boolean {
  const get = () => typeof window !== 'undefined' && window.matchMedia?.(QUERY).matches === true;
  const [v, setV] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return;
    const on = () => setV(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return v;
}
