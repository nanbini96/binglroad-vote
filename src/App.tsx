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
const TOTAL_JUDGES = 12;      // 총 심사위원 수
const PASS_THRESHOLD = 7;     // 선정 기준 표수 (적합 + 조건부 적합 합계)
const FAIL_THRESHOLD = 7;     // 선정 불가 기준 표수 (부적합 합계)

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

// ==========================================
// [보조 컴포넌트 1] 수치 변화에 반응하는 애니메이션 카운트 컴포넌트
// ==========================================
function AnimatedCount({ value, className }: { value: number; className?: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: 8, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -8, opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 350, damping: 15 }}
        className={`inline-block font-display ${className || 'text-slate-800'}`}
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

        // 총 표수가 12표를 초과할 수 없음
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

        // 새로운 합계 및 상태 변화 분석하여 토스트 띄우기
        const passSum = updatedVotes.suitable + updatedVotes.conditional;
        const prevPassSum = team.votes.suitable + team.votes.conditional;

        if (passSum >= PASS_THRESHOLD && prevPassSum < PASS_THRESHOLD) {
          showToast(`🎉 [선정 확정] ${team.name} 팀이 연수팀으로 최종 선정되었습니다!`, 'success');
        } else if (updatedVotes.unsuitable >= FAIL_THRESHOLD && team.votes.unsuitable < FAIL_THRESHOLD) {
          showToast(`❌ [선정 불가] ${team.name} 팀이 선정 불가 판정을 받았습니다.`, 'error');
        } else if (passSum === 6 && updatedVotes.unsuitable === 6) {
          showToast(`⚖️ [논의 필요] 찬성 6표, 반대 6표 동률이 되어 심사위원단 논의가 필요합니다.`, 'info');
        } else {
          // 일반적인 클릭 알림
          const typeKo = type === 'suitable' ? '적합' : type === 'conditional' ? '조건부 적합' : '부적합';
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
  // [핵심 도메인 로직] 최종 판정 판단
  // ==========================================
  const getDecision = (votes: Team['votes']) => {
    const passSum = votes.suitable + votes.conditional;
    const failSum = votes.unsuitable;

    if (passSum >= 7) {
      return {
        status: 'SELECTED' as const,
        text: '연수팀 선정',
        badgeClass: 'bg-emerald-500 text-white shadow-md font-extrabold',
        cardClass: 'border-3 border-emerald-500 bg-emerald-50/70 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300',
        color: 'emerald'
      };
    }
    if (failSum >= 7) {
      return {
        status: 'REJECTED' as const,
        text: '선정 불가',
        badgeClass: 'bg-rose-500 text-white shadow-md font-extrabold',
        cardClass: 'border-3 border-rose-500 bg-rose-50/70 opacity-95 transition-all duration-300',
        color: 'rose'
      };
    }
    if (passSum === 6 && failSum === 6) {
      return {
        status: 'DISCUSS' as const,
        text: '심사위원단 논의 필요',
        badgeClass: 'bg-amber-500 text-white shadow-md font-extrabold animate-pulse',
        cardClass: 'border-3 border-amber-500 bg-amber-50/70 shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all duration-300',
        color: 'amber'
      };
    }

    return {
      status: 'EVALUATING' as const,
      text: '집계 중',
      badgeClass: 'bg-slate-200 text-slate-700 border border-slate-300',
      cardClass: 'border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300',
      color: 'slate'
    };
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans selection:bg-slate-700 selection:text-white flex flex-col pb-16 relative">
      
      {/* 1. 세련된 상단 공지/헤더 밴드 (Professional Polish Slate-900 Theme) */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
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

          {/* 대시보드 전역 제어 장치들 */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* 기준 요약 배지 */}
            <div className="flex items-center gap-4 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
              <div>
                <span className="text-xs block text-slate-400 font-bold mb-0.5">심사 인원</span>
                <span className="text-sm md:text-base font-extrabold text-indigo-400">총 {TOTAL_JUDGES}명</span>
              </div>
              <div className="border-l border-slate-700 h-8"></div>
              <div>
                <span className="text-xs block text-slate-400 font-bold mb-0.5">선정 기준</span>
                <span className="text-sm md:text-base font-extrabold text-emerald-400">적합+조건부 ≥ {PASS_THRESHOLD}표</span>
              </div>
              <div className="border-l border-slate-700 h-8"></div>
              <div>
                <span className="text-xs block text-slate-400 font-bold mb-0.5">선정 불가</span>
                <span className="text-sm md:text-base font-extrabold text-rose-400">부적합 ≥ {FAIL_THRESHOLD}표</span>
              </div>
            </div>

            {/* 마스터 초기화 버튼 */}
            <button
              id="master-reset-btn"
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 transition-all duration-200 border border-rose-500/30"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>전체 초기화</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. 대시보드 전반 규정 가이드 영역 (Bento Grid 스타일) */}
      <main className="max-w-7xl mx-auto px-6 pt-8 flex-1 w-full">
        
        {/* 상단 통합 점검 현황판 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          
          {/* 현황 1: 심사 요약 개요 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">심사 인원 구성</p>
              <h3 className="text-xl font-extrabold font-display text-slate-900 mt-0.5">총 {TOTAL_JUDGES}명</h3>
              <p className="text-xs text-slate-500">심사위원 전원 종이 투표 집계</p>
            </div>
          </div>

          {/* 현황 2: 적합 판정 규격 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">선정 판정 기준</p>
              <h3 className="text-xl font-extrabold font-display text-emerald-600 mt-0.5">{PASS_THRESHOLD}표 이상</h3>
              <p className="text-xs text-slate-500">적합 + 조건부 적합 합계</p>
            </div>
          </div>

          {/* 현황 3: 부적합 판정 규격 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">선정 불가 기준</p>
              <h3 className="text-xl font-extrabold font-display text-rose-600 mt-0.5">{FAIL_THRESHOLD}표 이상</h3>
              <p className="text-xs text-slate-500">부적합 단독 표수 기준</p>
            </div>
          </div>

        </section>

        {/* 3. 팀별 심사 결과 카드 뷰 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map((team, index) => {
            const decision = getDecision(team.votes);
            const totalEntered = team.votes.suitable + team.votes.conditional + team.votes.unsuitable;
            const passSum = team.votes.suitable + team.votes.conditional;
            
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
                {/* 우측 상단 선정/탈락 백그라운드 워터마크 아이콘 */}
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
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm md:text-base font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">{index+1}</span>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                        {team.name} <span className="text-slate-500 font-bold text-lg">({team.location})</span>
                      </h2>
                    </div>
                  </div>

                  {/* 최종 판정 배지 (실시간 강조 애니메이션) */}
                  <motion.div 
                    animate={decision.status !== 'EVALUATING' ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.6 }}
                    className={`px-4 py-2 rounded-full text-sm font-black flex items-center gap-1.5 ${decision.badgeClass}`}
                  >
                    {decision.status === 'SELECTED' && <Sparkles className="w-4 h-4 text-white" />}
                    {decision.status === 'REJECTED' && <XCircle className="w-4 h-4" />}
                    {decision.status === 'EVALUATING' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
                    <span>{decision.text}</span>
                  </motion.div>
                </div>

                {/* (2) 핵심 결과 스코어보드 (대화면 전광판 스타일) */}
                <div className="bg-slate-100/60 p-4 rounded-xl mb-6 border border-slate-200/50">
                  <div className="grid grid-cols-4 gap-3 text-center">
                    
                    {/* 적합 */}
                    <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-emerald-700 block mb-1">적합</span>
                      <span className="text-2xl font-extrabold text-emerald-600">
                        <AnimatedCount value={team.votes.suitable} />
                      </span>
                    </div>

                    {/* 조건부 적합 */}
                    <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-amber-700 block mb-1">조건부</span>
                      <span className="text-2xl font-extrabold text-amber-600">
                        <AnimatedCount value={team.votes.conditional} />
                      </span>
                    </div>

                    {/* 부적합 */}
                    <div className="bg-red-50 border border-red-100 p-2.5 rounded-xl flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-red-700 block mb-1">부적합</span>
                      <span className="text-2xl font-extrabold text-red-600">
                        <AnimatedCount value={team.votes.unsuitable} />
                      </span>
                    </div>

                    {/* 합산 (적합 + 조건부) -> 대문짝만하게 강조 */}
                    <div className="bg-slate-100 border border-slate-200 ring-2 ring-slate-900/5 p-2.5 rounded-xl flex flex-col justify-between">
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">
                        선정 합계
                      </span>
                      <span className="text-2xl font-extrabold text-slate-900">
                        <AnimatedCount value={passSum} />
                      </span>
                    </div>

                  </div>

                  {/* 누적 투표 비주얼 게이지 게이지 바 */}
                  <div className="mt-4 pt-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
                      <span>투표 진행률 ({totalEntered} / {TOTAL_JUDGES}명)</span>
                      <span>{Math.round(getPct(totalEntered))}%</span>
                    </div>
                    {/* 게이지 바 본체 */}
                    <div className="w-full h-3 bg-slate-200 rounded-full flex overflow-hidden">
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

                {/* (3) 심사위원 실시간 입력 제어 패널 */}
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
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
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

      {/* 6. 전체 초기화 오클릭 방지를 위한 모달 (AnimatePresence 적용) */}
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
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all active:scale-98"
                >
                  취소
                </button>
                <button
                  id="confirm-modal-reset"
                  onClick={resetAllTeams}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all active:scale-98 shadow-md shadow-rose-200"
                >
                  초기화 실행
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. 저작권 및 푸터 */}
      <footer className="mt-auto pt-12 text-center text-xs text-slate-400 font-medium">
        <p>© 2026 BinglRoad Executive Dashboard. All Rights Reserved.</p>
      </footer>

    </div>
  );
}

