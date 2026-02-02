// Smart Template-Based Report Generator
// No external API needed - works 100% offline!

export default {
    async fetch(request, env) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return new Response(JSON.stringify({
                success: false,
                error: 'Method not allowed. Use POST.'
            }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        try {
            const { userInput, marketData } = await request.json();

            if (!userInput) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Missing userInput parameter'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Analyze user input to determine investment profile
            const profile = analyzeUserInput(userInput);

            // Generate user request summary
            const userRequestSummary = generateUserRequestSummary(userInput, profile);

            // Generate professional report based on profile and market data
            const report = generateReport(profile, marketData, userInput, userRequestSummary);

            return new Response(JSON.stringify({
                success: true,
                report: report,
                metadata: {
                    timestamp: new Date().toISOString(),
                    model: 'template-ai-v1',
                    profile: profile.type
                }
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: error.message
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};

// Analyze user input to determine investment profile
function analyzeUserInput(input) {
    const lower = input.toLowerCase();

    // Keywords for aggressive strategy
    const aggressiveKeywords = ['레버리지', '공격적', '적극', '고수익', '고위험', '빠른', '단기'];
    const conservativeKeywords = ['안전', '보수적', '현금', '안정', '장기', '리스크 회피', '방어'];
    const moderateKeywords = ['균형', '중립', '적당', '분산'];

    let aggressiveScore = 0;
    let conservativeScore = 0;
    let moderateScore = 0;

    aggressiveKeywords.forEach(keyword => {
        if (lower.includes(keyword)) aggressiveScore += 2;
    });

    conservativeKeywords.forEach(keyword => {
        if (lower.includes(keyword)) conservativeScore += 2;
    });

    moderateKeywords.forEach(keyword => {
        if (lower.includes(keyword)) moderateScore += 1;
    });

    // Extract specific numbers (leverage %)
    const leverageMatch = input.match(/(\d+)%/);
    const leveragePercent = leverageMatch ? parseInt(leverageMatch[1]) : 50;

    if (leveragePercent >= 70) aggressiveScore += 3;
    else if (leveragePercent <= 30) conservativeScore += 3;
    else moderateScore += 2;

    // Determine profile
    let type, riskLevel, leverageAllocation, cashAllocation;

    if (aggressiveScore > conservativeScore && aggressiveScore > moderateScore) {
        type = 'aggressive';
        riskLevel = '높음';
        leverageAllocation = Math.min(leveragePercent, 80);
        cashAllocation = 100 - leverageAllocation;
    } else if (conservativeScore > aggressiveScore) {
        type = 'conservative';
        riskLevel = '낮음';
        leverageAllocation = Math.max(20, leveragePercent / 2);
        cashAllocation = 100 - leverageAllocation;
    } else {
        type = 'moderate';
        riskLevel = '중간';
        leverageAllocation = 50;
        cashAllocation = 50;
    }

    return {
        type,
        riskLevel,
        leverageAllocation,
        cashAllocation,
        requestedLeverage: leveragePercent
    };
}

// Generate professional report
function generateReport(profile, marketData, userInput, userRequestSummary) {
    const date = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const kospiChange = parseFloat(marketData?.kospi?.change || 0);
    const kosdaqChange = parseFloat(marketData?.kosdaq?.change || 0);

    const marketTrend = (kospiChange + kosdaqChange) / 2;
    const marketSentiment = marketTrend > 0.5 ? '강세' : marketTrend < -0.5 ? '약세' : '혼조';

    // Generate Executive Summary
    const executiveSummary = generateExecutiveSummary(profile, marketData, marketSentiment, date, userInput);

    // Generate Portfolio Strategy
    const portfolioStrategy = generatePortfolioStrategy(profile, marketData);

    // Generate Action Plan
    const actionPlan = generateActionPlan(profile, marketSentiment);

    return `USER_REQUEST
${userRequestSummary}

EXECUTIVE_SUMMARY
${executiveSummary}

PORTFOLIO_STRATEGY
${portfolioStrategy}

ACTION_PLAN
${actionPlan}`;
}

// Generate user request summary with AI response
function generateUserRequestSummary(userInput, profile) {
    const leveragePercent = profile.requestedLeverage;
    const riskLevel = profile.riskLevel;
    const investmentStyle = profile.type === 'aggressive' ? '공격적 투자' :
        profile.type === 'conservative' ? '보수적 투자' : '균형 투자';

    // Extract key points from user input
    const keyPoints = [];

    if (userInput.includes('레버리지') || userInput.match(/\d+%/)) {
        keyPoints.push(`레버리지 비중 ${leveragePercent}% 요청`);
    }

    if (userInput.includes('빠른') || userInput.includes('단기') || userInput.includes('적극')) {
        keyPoints.push('단기 고수익 추구');
    }

    if (userInput.includes('안전') || userInput.includes('보수') || userInput.includes('현금')) {
        keyPoints.push('안정성 중시, 리스크 최소화');
    }

    if (userInput.includes('균형') || userInput.includes('중립') || userInput.includes('분산')) {
        keyPoints.push('위험과 수익의 균형 추구');
    }

    if (userInput.includes('장기') || userInput.includes('안정')) {
        keyPoints.push('장기 투자 지향');
    }

    // Extract timeframe if mentioned
    const timeMatch = userInput.match(/(\d+)(일|주|개월)/);
    if (timeMatch) {
        keyPoints.push(`투자 기간: ${timeMatch[1]}${timeMatch[2]}`);
    }

    const keyPointsText = keyPoints.length > 0 ? keyPoints.map(p => `• ${p}`).join('\n') : `• ${investmentStyle}`;

    // Generate AI response based on profile
    let aiResponse = '';
    if (profile.type === 'aggressive') {
        aiResponse = `고객님의 공격적 투자 성향을 확인했습니다. **레버리지 ETF ${profile.leverageAllocation}% 배분**으로 단기 고수익을 추구하는 전략을 수립했습니다.

✅ KODEX 200 레버리지와 KOSDAQ 150 레버리지를 활용하여 시장 상승 시 수익을 극대화합니다.
✅ 현금 ${profile.cashAllocation}%는 급락 시 추가 매수 기회로 활용됩니다.
✅ 목표 수익률 달성 시 부분 익절 전략을 적용합니다.`;
    } else if (profile.type === 'conservative') {
        aiResponse = `고객님의 안정적 투자 성향을 반영했습니다. **현금 ${profile.cashAllocation}% 보유**로 리스크를 최소화하면서도 수익 기회를 잡는 전략입니다.

✅ 레버리지 비중을 ${profile.leverageAllocation}%로 제한하여 변동성을 낮췄습니다.
✅ 분할 매수 전략으로 리스크를 분산합니다.
✅ 보수적 손절 기준(-2%)으로 손실을 최소화합니다.`;
    } else {
        aiResponse = `고객님의 균형잡힌 투자 성향에 맞춰 설계했습니다. **레버리지 50%, 현금 50%**로 위험과 수익의 조화를 추구합니다.

✅ 레버리지 ETF로 수익 기회를 확보하면서도 현금으로 안정성을 유지합니다.
✅ 주간 리밸런싱으로 포트폴리오를 최적 상태로 유지합니다.
✅ 시장 상황에 따라 유연하게 대응할 수 있는 구조입니다.`;
    }

    return `📝 **고객님의 요청사항**

"${userInput}"

---

**🎯 AI 분석 결과**

**투자 성향:** ${investmentStyle} | **리스크:** ${riskLevel} | **레버리지:** ${leveragePercent}%

**핵심 요청사항:**
${keyPointsText}

---

**💡 맞춤형 답변**

${aiResponse}`;
}

function generateExecutiveSummary(profile, marketData, sentiment, date, userInput) {
    const templates = {
        aggressive: `🚀 **${date} 투자 전략 - 공격적 레버리지 투자**

현재 시장은 **${sentiment}** 흐름을 보이고 있으며, KOSPI ${marketData?.kospi?.price || 'N/A'} (${marketData?.kospi?.change || 'N/A'}), KOSDAQ ${marketData?.kosdaq?.price || 'N/A'} (${marketData?.kosdaq?.change || 'N/A'})로 거래되고 있습니다.

고객님의 요청사항("${userInput}")을 반영하여, **레버리지 ETF 중심의 공격적 포트폴리오**를 제안드립니다.

⚡ **즉각 실행 전략:**
1. **KODEX 200 레버리지 ${Math.round(profile.leverageAllocation * 0.6)}% 편입** - 현재가 ${marketData?.kodex200?.price || 'N/A'}원, 단기 모멘텀 활용
2. **KODEX KOSDAQ150 레버리지 ${Math.round(profile.leverageAllocation * 0.4)}% 편입** - 기술주 강세 수혜
3. **현금 ${profile.cashAllocation}% 유지** - 급락 시 추가 매수 대기

💰 **목표 수익률:** 3-5일 내 +${profile.requestedLeverage >= 70 ? '8-12' : '5-8'}% (레버리지 효과)
⚠️ **손절 기준:** -4% 도달 시 즉시 청산`,

        conservative: `🛡️ **${date} 투자 전략 - 안전 중심 포트폴리오**

현재 시장은 **${sentiment}** 흐름을 보이고 있습니다. 고객님의 보수적 투자 성향("${userInput}")을 고려하여, **안정성과 수익성의 균형**을 맞춘 전략을 제안합니다.

⚡ **즉각 실행 전략:**
1. **현금 비중 ${profile.cashAllocation}% 유지** - 시장 불확실성 대비
2. **레버리지 ETF ${profile.leverageAllocation}% 분산 투자** - KODEX 200/KOSDAQ 150 각 50%
3. **단계별 진입** - 일주일에 걸쳐 3회 분할 매수

💰 **목표 수익률:** 1-2주 내 +3-5%
⚠️ **손절 기준:** -2% 도달 시 30% 부분 청산`,

        moderate: `⚖️ **${date} 투자 전략 - 균형 포트폴리오**

현재 KOSPI ${marketData?.kospi?.change || 'N/A'}, KOSDAQ ${marketData?.kosdaq?.change || 'N/A'}로 **${sentiment}** 장세입니다. 고객님의 요청("${userInput}")을 반영하여 **위험과 수익의 조화**를 추구합니다.

⚡ **즉각 실행 전략:**
1. **레버리지 ETF 50% 배분** - KODEX 200 30%, KOSDAQ 150 20%
2. **현금 50% 보유** - 기회 포착 및 리스크 관리
3. **주간 리밸런싱** - 매주 금요일 비중 재조정

💰 **목표 수익률:** 1주 내 +4-7%
⚠️ **손절 기준:** -3% 도달 시 50% 청산`
    };

    return templates[profile.type];
}

function generatePortfolioStrategy(profile, marketData) {
    const kodex200Allocation = Math.round(profile.leverageAllocation * 0.6);
    const kodex150Allocation = Math.round(profile.leverageAllocation * 0.4);

    return `📊 **권장 포트폴리오 비중**

**레버리지 ETF: ${profile.leverageAllocation}%**
- KODEX 200 레버리지 (122630): ${kodex200Allocation}%
  - 현재가: ${marketData?.kodex200?.price || 'N/A'}원
  - 진입 전략: ${profile.type === 'aggressive' ? '즉시 전량 매수' : '2회 분할 매수'}
  - 익절 기준: +${profile.type === 'aggressive' ? '10' : profile.type === 'conservative' ? '5' : '7'}%
  - 손절 기준: -${profile.type === 'aggressive' ? '4' : profile.type === 'conservative' ? '2' : '3'}%

- KODEX KOSDAQ150 레버리지 (233740): ${kodex150Allocation}%
  - 현재가: ${marketData?.kodex150?.price || 'N/A'}원
  - 진입 전략: ${profile.type === 'aggressive' ? '즉시 전량 매수' : '2회 분할 매수'}
  - 익절 기준: +${profile.type === 'aggressive' ? '12' : profile.type === 'conservative' ? '6' : '8'}%
  - 손절 기준: -${profile.type === 'aggressive' ? '5' : profile.type === 'conservative' ? '2' : '3'}%

**현금: ${profile.cashAllocation}%**
- 용도: ${profile.type === 'aggressive' ? '급락 시 추가 매수 (예비 탄약)' : '안전 자산 + 기회 포착'}
- 운용: ${profile.type === 'conservative' ? 'CMA/MMF' : '증권사 RP'}

⚠️ **리스크 관리 원칙:**
- 보유 기간: ${profile.type === 'aggressive' ? '3-5일' : profile.type === 'conservative' ? '1-2주' : '5-7일'}
- 일일 손실 한도: 총 자산의 ${profile.type === 'aggressive' ? '5' : profile.type === 'conservative' ? '2' : '3'}%
- 레버리지 특성상 변동성 ±${profile.leverageAllocation > 60 ? '4-6' : '2-4'}% 예상`;
}

function generateActionPlan(profile, sentiment) {
    const scenarios = {
        aggressive: {
            bullish: '레버리지 비중 80%로 확대 → 수익 극대화',
            neutral: '레버리지 70% 유지 → 단기 반등 노림',
            bearish: '레버리지 40%로 축소 → 손절 후 재진입 대기',
            crash: '전량 청산 → 현금 100% 전환 후 바닥 확인'
        },
        conservative: {
            bullish: '레버리지 30%로 소폭 확대 → 안전한 추세 추종',
            neutral: '현재 비중 유지 → 관망',
            bearish: '레버리지 15%로 축소 → 방어 모드',
            crash: '레버리지 0% → 전액 현금 보유'
        },
        moderate: {
            bullish: '레버리지 60%로 확대 → 반등 수혜',
            neutral: '레버리지 50% 유지 → 균형 유지',
            bearish: '레버리지 30%로 축소 → 리스크 감소',
            crash: '레버리지 20% → 현금 비중 80%'
        }
    };

    const currentScenario = sentiment === '강세' ? 'bullish' : sentiment === '약세' ? 'bearish' : 'neutral';

    return `🎯 **시나리오별 대응 전략**

📈 **강세 시나리오 (KOSPI +2% 이상)**
→ ${scenarios[profile.type].bullish}
→ 목표가 도달 시 ${profile.type === 'aggressive' ? '50% 부분 익절' : '전량 익절'}

📊 **박스권 시나리오 (±1% 내)**
→ ${scenarios[profile.type].neutral}
→ ${profile.type === 'aggressive' ? '단기 스윙 매매 (데이 트레이딩)' : '리밸런싱 관찰'}

📉 **조정 시나리오 (KOSPI -2% ~ -4%)**
→ ${scenarios[profile.type].bearish}
→ ${profile.leverageAllocation > 50 ? '손절선 엄격 준수' : '현금으로 저점 매수 기회 탐색'}

⚠️ **급락 시나리오 (KOSPI -5% 이상)**
→ ${scenarios[profile.type].crash}
→ ${profile.type === 'aggressive' ? '패닉 매도 회피, 계획된 손절만 실행' : '전면 리스크 회피'}

---

**🔔 ${sentiment === '강세' ? '현재 강세장 - 공격적 진입 타이밍' : sentiment === '약세' ? '현재 약세장 - 방어 모드 권장' : '현재 혼조장 - 신중한 진입'}**`;
}
