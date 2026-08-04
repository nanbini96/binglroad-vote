import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Award, 
  XCircle, 
  Undo2, 
  RotateCcw, 
  Plus, 
  Sparkles, 
  Check,
  TrendingUp,
  Info,
  ChevronRight,
  ShieldCheck,
  Sliders,
  HelpCircle
} from 'lucide-react';

// ==========================================
// [운영 설정 상수] - 초보자분들도 여기서 쉽게 수정할 수 있습니다!
// ==========================================
const TOTAL_JUDGES = 11;          // 총 심사위원 수
const PASS_SCORE_THRESHOLD = 6.0; // 기본 선정 기준 점수

// [팀 데이터 타입 정의]
interface Team {
  id: string;
  name: string;
  location: string;
  country: string;
  votes: {
    suitable: number;      // 적합 표 수
    conditional: number;   // 조건부 적합 표 수
    unsuitable: number;    // 부적합 표 수
  };
  // 되돌리기(Undo) 기능을 위해 투표 히스토리를 순서대로 저장합니다.
  history: ('suitable' | 'conditional' | 'unsuitable')[];
}

// [초기 팀 정보] - 만약 새로운 팀이 추가되거나 이름이 변경되면 여기서 수정하세요!
const INITIAL_TEAMS: Team[] = [
  {
    id: 'casaving',
    name: '카사빙',
    location: '모로코',
    country: '모로코',
    votes: { suitable: 0, conditional: 0, unsuitable: 0 },
    history: []
  },
  {
    id: 'milkroad',
    name: '밀크로드 원정대',
    location: '카자흐스탄',
    country: '카자흐스탄',
    votes: { suitable: 0, conditional: 0, unsuitable: 0 },
    history: []
  },
  {
    id: 'bingkk',
    name: '빙크크',
    location: '이탈리아-밀라노',
    country: '이탈리아',
    votes: { suitable: 0, conditional: 0, unsuitable: 0 },
    history: []
  },
  {
    id: 'binggrae-first',
    name: '빙그레 퍼스트',
    location: '호주-퍼스',
    country: '호주',
    votes: { suitable: 0, conditional: 0, unsuitable: 0 },
    history: []
  }
];

// 점수 계산 헬퍼 함수 (적합 1점, 조건부 0.5점, 부적합 0점)
function calculateScore(votes: Team['votes']): number {
  return votes.suitable * 1 + votes.conditional * 0.5;
}

// ==========================================
// [보조 컴포넌트 1] 수치 변화에 반응하는 애니메이션 카운트 컴포넌트
// ==========================================
function AnimatedCount({ value, className }: { value: string | number; className?: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: 8, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -8, opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 350, damping: 15 }}
        className={`inline-block font-display ${className || ''}`}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

// ==========================================
// [메인 애플리케이션 컴포넌트] App
// ==========================================
export default function App() {
  // 1. 상태(State) 관리
  // 4개 팀의 투표 데이터 상태 (localStorage 연동)
  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem('binglroad_votes_v1');
      return saved ? JSON.parse(saved) : INITIAL_TEAMS;
    } catch (e) {
      console.error("localStorage 데이터를 파싱하지 못했습니다. 초기 데이터로 대체합니다.", e);
      return INITIAL_TEAMS;
    }
  });

  // 커스텀 알림(Toast) 메시지 상태 (alert 창 대신 화면에 미려하게 띄웁니다)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 전체 초기화 확인 모달창 상태
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // 2. 투표 데이터 변경 시 자동으로 localStorage에 동기화
  useEffect(() => {
    localStorage.setItem('binglroad_votes_v1', JSON.stringify(teams));
  }, [teams]);

  // 브라우저 탭 제목 설정
  useEffect(() => {
    document.title = "BinglRoad 해외연수 심사 결과";
  }, []);

  // 3. 토스트 알림 자동 사라짐 타이머
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 4. 알림 헬퍼 함수
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  // ==========================================
  // [운영자 핵심 액션 함수들]
  // ==========================================

  // (1) 투표 추가 함수 (팀 ID, 투표 구분)
  const addVote = (teamId: string, type: 'suitable' | 'conditional' | 'unsuitable') => {
    setTeams(prevTeams => {
      return prevTeams.map(team => {
        if (team.id !== teamId) return team;

        // 현재 해당 팀에 반영된 총 표수 구하기
        const totalVotes = team.votes.suitable + team.votes.conditional + team.votes.unsuitable;

        // 총 표수가 11표를 초과할 수 없음
        if (totalVotes >= TOTAL_JUDGES) {
          showToast(`${team.name} 팀은 이미 최대 투표수(${TOTAL_JUDGES}표)를 모두 채웠습니다!`, 'error');
          return team;
        }

        // 투표수 증가 및 히스토리 기록 추가
        const updatedVotes = {
          ...team.votes,
          [type]: team.votes[type] + 1
        };
        const updatedHistory = [...team.history, type];

        const newTotal = updatedVotes.suitable + updatedVotes.conditional + updatedVotes.unsuitable;
        const typeKo = type === 'suitable' ? '적합' : type === 'conditional' ? '조건부 적합' : '부적합';

        if (newTotal === TOTAL_JUDGES) {
          const finalScore = calculateScore(updatedVotes);
          if (finalScore < PASS_SCORE_THRESHOLD) {
            showToast(`❌ [선정 불가] ${team.name} 팀 (총점 ${finalScore.toFixed(1)}점)`, 'error');
          } else {
            showToast(`🎉 [선정 확정] ${team.name} 팀이 총점 ${finalScore.toFixed(1)}점으로 연수팀으로 최종 선정되었습니다!`, 'success');
          }
        } else {
          showToast(`${team.name} 팀의 [${typeKo}] 표를 1개 추가했습니다.`, 'success');
        }

        return {
          ...team,
          votes: updatedVotes,
          history: updatedHistory
        };
      });
    });
  };

  // (2) 되돌리기(Undo) 함수 - 실수로 잘못 누른 버튼을 되돌려 심사 표를 회수합니다.
  const undoVote = (teamId: string) => {
    setTeams(prevTeams => {
      return prevTeams.map(team => {
        if (team.id !== teamId) return team;

        // 히스토리가 비어있으면 실행 불가능
        if (team.history.length === 0) {
          showToast(`${team.name} 팀의 되돌릴 투표 기록이 없습니다.`, 'info');
          return team;
        }

        // 가장 마지막에 기록된 투표 타입을 가져옴
        const lastVoteType = team.history[team.history.length - 1];
        
        // 투표수 차감 및 히스토리 마지막 요소 제거
        const updatedVotes = {
          ...team.votes,
          [lastVoteType]: Math.max(0, team.votes[lastVoteType] - 1)
        };
        const updatedHistory = team.history.slice(0, -1);

        const typeKo = lastVoteType === 'suitable' ? '적합' : lastVoteType === 'conditional' ? '조건부 적합' : '부적합';
        showToast(`${team.name} 팀의 마지막 [${typeKo}] 표 입력을 취소했습니다.`, 'info');

        return {
          ...team,
          votes: updatedVotes,
          history: updatedHistory
        };
      });
    });
  };

  // (3) 단일 팀 데이터 초기화 함수
  const resetTeam = (teamId: string) => {
    setTeams(prevTeams => {
      return prevTeams.map(team => {
        if (team.id !== teamId) return team;
        showToast(`${team.name} 팀의 모든 심사 기록을 리셋했습니다.`, 'info');
        return {
          ...team,
          votes: { suitable: 0, conditional: 0, unsuitable: 0 },
          history: []
        };
      });
    });
  };

  // (4) 마스터 전체 초기화 함수
  const resetAllTeams = () => {
    setTeams(INITIAL_TEAMS);
    setShowResetModal(false);
    showToast(`전체 팀의 심사 데이터가 깨끗이 초기화되었습니다.`, 'info');
  };

  // ==========================================
  // [핵심 도메인 로직] 최종 판정 판단 (우선순위 적용)
  // ==========================================
  const getDecision = (votes: Team['votes']) => {
    const totalEntered = votes.suitable + votes.conditional + votes.unsuitable;
    const score = calculateScore(votes);

    // 투표가 11명 모두 완료되지 않은 경우 -> 「투표 진행 중」
    if (totalEntered < TOTAL_JUDGES) {
      return {
        status: 'EVALUATING' as const,
        text: '투표 진행 중',
        badgeClass: 'bg-slate-700 text-slate-100 border border-slate-600',
        cardClass: 'border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300',
        color: 'slate',
        progressColor: 'bg-slate-600'
      };
    }

    // 1. 총점이 6.0점 이상인 경우 -> 「연수팀 선정」
    if (score >= PASS_SCORE_THRESHOLD) {
      return {
        status: 'SELECTED' as const,
        text: '연수팀 선정',
        badgeClass: 'bg-emerald-500 text-white shadow-md font-extrabold',
        cardClass: 'border-3 border-emerald-500 bg-emerald-50/70 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300',
        color: 'emerald',
        progressColor: 'bg-emerald-500'
      };
    }

    // 2. 총점이 6.0점 미만인 경우 -> 「선정 불가」
    return {
      status: 'REJECTED' as const,
      text: '선정 불가',
      badgeClass: 'bg-rose-500 text-white shadow-md font-extrabold',
      cardClass: 'border-3 border-rose-500 bg-rose-50/70 shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all duration-300',
      color: 'rose',
      progressColor: 'bg-rose-500'
    };
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans selection:bg-slate-700 selection:text-white flex flex-col pb-16 relative">
      
      {/* 1. 상단 공지/헤더 밴드 */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* 타이틀 및 메타 정보 */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-slate-800 text-slate-300 border border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                2026 BinglRoad Official
              </span>
            </div>
            <h1 className="text-2xl font-black font-display text-white tracking-tight">
              BinglRoad 해외연수 심사 결과 Dashboard
            </h1>
          </div>

          {/* 대시보드 전역 제어 및 요약 배지 */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* 상단 요약 배지 */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs">
              <div>
                <span className="block text-slate-400 font-bold text-[10px]">심사위원</span>
                <span className="font-extrabold text-indigo-400 text-xs sm:text-sm">총 {TOTAL_JUDGES}명</span>
              </div>
              <div className="border-l border-slate-700 h-6"></div>
              <div>
                <span className="block text-slate-400 font-bold text-[10px]">선정 기준</span>
                <span className="font-extrabold text-emerald-400 text-xs sm:text-sm">총점 6.0점 이상</span>
              </div>

              <div className="border-l border-slate-700 h-6"></div>
              <div>
                <span className="block text-slate-400 font-bold text-[10px]">선정 불가</span>
                <span className="font-extrabold text-rose-400 text-xs sm:text-sm">총점 6.0점 미만</span>
              </div>
            </div>

            {/* 마스터 초기화 버튼 */}
            <button
              id="master-reset-btn"
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 transition-all duration-200 border border-rose-500/30 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>전체 초기화</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. 대시보드 규정 가이드 영역 */}
      <main className="max-w-7xl mx-auto px-6 pt-8 flex-1 w-full">
        
        {/* 상단 통합 안내 현황판 (4개 카드로 가시성 극대화) */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
          
          {/* 1. 심사위원 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-400 uppercase">심사위원</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">총 {TOTAL_JUDGES}명</h3>
          </div>

          {/* 2. 점수 기준 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-400 uppercase">점수 기준</span>
            </div>
            <h3 className="text-[11px] min-[380px]:text-xs sm:text-[13px] md:text-sm lg:text-[15px] font-black text-slate-900 whitespace-nowrap tracking-tight">
              적합 1점 · 조건부 0.5점 · 부적합 0점
            </h3>
          </div>

          {/* 3. 선정 기준 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-400 uppercase">선정 기준</span>
            </div>
            <h3 className="text-lg font-black text-emerald-600">총점 6.0점 이상</h3>
          </div>

          {/* 4. 선정 불가 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold text-slate-400 uppercase">선정 불가</span>
            </div>
            <h3 className="text-lg font-black text-rose-600">총점 6.0점 미만</h3>
          </div>

        </section>

        {/* 3. 팀별 심사 결과 카드 뷰 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map((team, index) => {
            const decision = getDecision(team.votes);
            const totalEntered = team.votes.suitable + team.votes.conditional + team.votes.unsuitable;
            const score = calculateScore(team.votes);
            
            // 프로그래스 바 퍼센트 계산
            const getPct = (val: number) => {
              return (val / TOTAL_JUDGES) * 100;
            };

            return (
              <motion.div
                id={`team-card-${team.id}`}
                key={team.id}
                layoutId={team.id}
                className={`rounded-2xl p-6 transition-all duration-300 relative flex flex-col justify-between overflow-hidden ${decision.cardClass}`}
              >
                {/* 우측 상단 백그라운드 워터마크 아이콘 */}
                {decision.status === 'SELECTED' && (
                  <div className="absolute right-[-20px] top-[-20px] opacity-[0.06] pointer-events-none text-emerald-800">
                    <Award className="w-48 h-48" />
                  </div>
                )}
                {decision.status === 'REJECTED' && (
                  <div className="absolute right-[-20px] top-[-20px] opacity-[0.04] pointer-events-none text-rose-800">
                    <XCircle className="w-48 h-48" />
                  </div>
                )}

                {/* (1) 팀 타이틀 및 현황 상태 라벨 */}
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm md:text-base font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">{index+1}</span>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                          {team.name} <span className="text-slate-500 font-bold text-lg">({team.location})</span>
                        </h2>
                      </div>
                    </div>

                    {/* 최종 판정 배지 */}
                    <motion.div 
                      animate={decision.status !== 'EVALUATING' ? { scale: [1, 1.04, 1] } : {}}
                      transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.6 }}
                      className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-black flex items-center gap-1.5 shrink-0 ${decision.badgeClass}`}
                    >
                      {decision.status === 'SELECTED' && <Sparkles className="w-4 h-4 text-white" />}
                      {decision.status === 'REJECTED' && <XCircle className="w-4 h-4 text-white" />}
                      {decision.status === 'EVALUATING' && <span className="w-2 h-2 rounded-full bg-slate-300 animate-ping"></span>}
                      <span>{decision.text}</span>
                    </motion.div>
                  </div>

                  {/* (2) 점수 진행 바 추가 */}
                  <div className="bg-white/80 p-4 rounded-xl mb-5 border border-slate-200/80 shadow-xs">
                    <div className="flex justify-between items-center text-xs font-bold mb-2">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <TrendingUp className="w-4 h-4 text-slate-500" />
                        <span>획득 점수</span>
                        <span className="text-sm font-black text-slate-900 ml-1">
                          {score.toFixed(1)} <span className="text-xs font-normal text-slate-500">/ 11점</span>
                        </span>
                      </div>
                      <div className="text-[11px] sm:text-xs text-indigo-700 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        선정 기준 6.0점
                      </div>
                    </div>

                    {/* 점수 진행 바 트랙 */}
                    <div className="relative w-full h-3.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                      {/* 6.0점 기준선 (6/11 = 54.55%) */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-indigo-600 z-10 shadow-xs" 
                        style={{ left: `${(PASS_SCORE_THRESHOLD / TOTAL_JUDGES) * 100}%` }}
                        title="선정 기준선 (6.0점)"
                      />
                      
                      {/* 점수 채움 바 */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (score / TOTAL_JUDGES) * 100)}%` }}
                        transition={{ duration: 0.3 }}
                        className={`h-full rounded-full ${decision.progressColor}`}
                      />
                    </div>

                    {/* 기준선 표시 핀 라벨 */}
                    <div className="relative w-full text-[10px] font-bold mt-1 h-3.5">
                      <span 
                        className="absolute -translate-x-1/2 text-indigo-600 font-extrabold flex items-center gap-0.5" 
                        style={{ left: `${(PASS_SCORE_THRESHOLD / TOTAL_JUDGES) * 100}%` }}
                      >
                        ▲ 기준 6.0점
                      </span>
                    </div>
                  </div>

                  {/* (3) 4개 핵심 결과 집계 박스 (적합, 조건부, 부적합, 총점) */}
                  <div className="bg-slate-100/60 p-4 rounded-xl mb-5 border border-slate-200/50">
                    <div className="grid grid-cols-4 gap-2.5 text-center">
                      
                      {/* 적합 */}
                      <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-emerald-700 block mb-1">적합</span>
                        <span className="text-2xl font-extrabold text-emerald-600">
                          <AnimatedCount value={team.votes.suitable} />
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium">1표당 1점</span>
                      </div>

                      {/* 조건부 */}
                      <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-amber-700 block mb-1">조건부</span>
                        <span className="text-2xl font-extrabold text-amber-600">
                          <AnimatedCount value={team.votes.conditional} />
                        </span>
                        <span className="text-[10px] text-amber-600 font-medium">1표당 0.5점</span>
                      </div>

                      {/* 부적합 */}
                      <div className="bg-red-50 border border-red-100 p-2.5 rounded-xl flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-red-700 block mb-1">부적합</span>
                        <span className="text-2xl font-extrabold text-red-600">
                          <AnimatedCount value={team.votes.unsuitable} />
                        </span>
                        <span className="text-[10px] text-red-600 font-medium">1표당 0점</span>
                      </div>

                      {/* 총점 */}
                      <div className="bg-slate-900 text-white border border-slate-800 ring-2 ring-slate-900/10 p-2.5 rounded-xl flex flex-col justify-between shadow-xs">
                        <span className="text-[11px] font-black text-white block mb-1">
                          총점
                        </span>
                        <span className="text-2xl font-black text-white">
                          <AnimatedCount value={`${score.toFixed(1)}점`} className="text-white font-black" />
                        </span>
                        <span className="text-[10px] text-slate-200 font-semibold">만점 11점</span>
                      </div>

                    </div>

                    {/* 기존 투표 진행률 정보 유지 */}
                    <div className="mt-4 pt-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
                        <span>투표 진행률 ({totalEntered} / {TOTAL_JUDGES}명)</span>
                        <span className="font-mono">{Math.round(getPct(totalEntered))}%</span>
                      </div>
                      {/* 게이지 바 본체 */}
                      <div className="w-full h-2.5 bg-slate-200 rounded-full flex overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${getPct(team.votes.suitable)}%` }}
                          className="bg-emerald-500 h-full"
                          title={`적합: ${team.votes.suitable}표`}
                        />
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${getPct(team.votes.conditional)}%` }}
                          className="bg-amber-500 h-full"
                          title={`조건부: ${team.votes.conditional}표`}
                        />
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${getPct(team.votes.unsuitable)}%` }}
                          className="bg-rose-500 h-full"
                          title={`부적합: ${team.votes.unsuitable}표`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* (4) 심사위원 실시간 입력 제어 패널 */}
                <div className="mt-1 overflow-hidden">
                  {/* 입력 버튼 행 */}
                  <div className="grid grid-cols-3 gap-3 mb-3.5">
                    
                    {/* + 적합 버튼 */}
                    <button
                      id={`add-suitable-btn-${team.id}`}
                      onClick={() => addVote(team.id, 'suitable')}
                      disabled={totalEntered >= TOTAL_JUDGES}
                      className="flex items-center justify-center gap-1 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none transition-all duration-100 active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>적합</span>
                    </button>

                    {/* + 조건부 적합 버튼 */}
                    <button
                      id={`add-conditional-btn-${team.id}`}
                      onClick={() => addVote(team.id, 'conditional')}
                      disabled={totalEntered >= TOTAL_JUDGES}
                      className="flex items-center justify-center gap-1 py-3 rounded-xl text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:pointer-events-none transition-all duration-100 active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>조건부</span>
                    </button>

                    {/* + 부적합 버튼 */}
                    <button
                      id={`add-unsuitable-btn-${team.id}`}
                      onClick={() => addVote(team.id, 'unsuitable')}
                      disabled={totalEntered >= TOTAL_JUDGES}
                      className="flex items-center justify-center gap-1 py-3 rounded-xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 disabled:pointer-events-none transition-all duration-100 active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>부적합</span>
                    </button>

                  </div>

                  {/* 보조 리셋/언두 관리 버튼 */}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    
                    {/* 개별 되돌리기 */}
                    <button
                      id={`undo-btn-${team.id}`}
                      onClick={() => undoVote(team.id)}
                      disabled={team.history.length === 0}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-35 disabled:hover:bg-transparent transition-all cursor-pointer"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>되돌리기</span>
                    </button>

                    {/* 개별 초기화 */}
                    <button
                      id={`reset-btn-${team.id}`}
                      onClick={() => resetTeam(team.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>초기화</span>
                    </button>

                  </div>
                </div>

                {/* 하단 투표수 미러 정보 카운터 */}
                <div className="mt-2 text-[10px] text-center text-slate-400 font-mono tracking-widest uppercase">
                  Input Tally: {totalEntered} / {TOTAL_JUDGES}
                </div>

              </motion.div>
            );
          })}
        </section>

      </main>

      {/* 5. 실시간 세련된 토스트 메시지 알림 (AnimatePresence 적용) */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none max-w-sm w-full px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`p-4 rounded-xl shadow-lg border text-sm font-bold pointer-events-auto flex items-center gap-3 ${
                toast.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : toast.type === 'error' 
                  ? 'bg-rose-50 text-rose-800 border-rose-200' 
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
              }`}
            >
              {toast.type === 'success' && <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs"><Check className="w-3.5 h-3.5" /></div>}
              {toast.type === 'error' && <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-xs font-sans">!</div>}
              {toast.type === 'info' && <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 text-xs font-sans">i</div>}
              <div className="flex-1 leading-tight">{toast.message}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6. 전체 초기화 모달 */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <div className="p-3 bg-rose-50 rounded-2xl">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-none">데이터 전체 초기화</h3>
              </div>
              
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                현재까지 입력된 모든 팀의 심사 표 데이터 및 히스토리가 완전히 리셋됩니다.<br />
                <strong>이 작업은 되돌릴 수 없습니다.</strong> 리허설용 데이터를 지우고 실제 임원 보고를 개시할 때만 실행해 주십시오.
              </p>

              <div className="flex gap-2.5">
                <button
                  id="confirm-modal-cancel"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all active:scale-98 cursor-pointer"
                >
                  취소
                </button>
                <button
                  id="confirm-modal-reset"
                  onClick={resetAllTeams}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all active:scale-98 shadow-md shadow-rose-200 cursor-pointer"
                >
                  초기화 실행
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. 푸터 */}
      <footer className="mt-auto pt-12 text-center text-xs text-slate-400 font-medium">
        <p>© 2026 BinglRoad Executive Dashboard. All Rights Reserved.</p>
      </footer>

    </div>
  );
}

