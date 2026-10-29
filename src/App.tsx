import { Component, type ReactNode } from 'react';
import { AudioBridge } from './audio/AudioBridge';
import { useGame } from './game/store';
import { GroupSelect } from './screens/GroupSelect';
import { Play } from './screens/Play';
import { PracticeSetup } from './screens/PracticeSetup';
import { Prep } from './screens/Prep';
import { Privacy } from './screens/Privacy';
import { Result } from './screens/Result';
import { Settings } from './screens/Settings';
import { StageSelect } from './screens/StageSelect';
import { TeacherLog } from './screens/TeacherLog';
import { Terms } from './screens/Terms';
import { Title } from './screens/Title';
import { TutorialScreen } from './screens/Tutorial';

/** 오류가 나도 스택을 보여 주지 않고 쉬운 안내만 표시한다 */
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="title text-3xl">앗, 잠깐 문제가 생겼어요</div>
        <p>화면을 다시 불러오면 이어서 할 수 있어요.</p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>다시 불러오기</button>
      </div>
    );
  }
}

function Router() {
  const screen = useGame((s) => s.screen);
  switch (screen) {
    case 'title': return <Title />;
    case 'tutorial': return <TutorialScreen />;
    case 'group': return <GroupSelect />;
    case 'stageSelect': return <StageSelect />;
    case 'practiceSetup': return <PracticeSetup />;
    case 'prep': return <Prep />;
    case 'play': return <Play />;
    case 'result': return <Result />;
    case 'settings': return <Settings />;
    case 'teacher': return <TeacherLog />;
    case 'privacy': return <Privacy />;
    case 'terms': return <Terms />;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AudioBridge />
      <Router />
    </ErrorBoundary>
  );
}
