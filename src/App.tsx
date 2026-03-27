import { useState, useCallback } from 'react';
import type { Session, Contributor } from './types/dni';
import TopBar from './components/TopBar';
import HomeView from './components/HomeView';
import SessionView from './components/SessionView';
import EditorView from './components/EditorView';
import SummaryView from './components/SummaryView';

type View = 'home' | 'session' | 'editor' | 'summary';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  const handleSelectSession = (session: Session) => {
    setSelectedSession(session);
    setView('session');
  };

  const handleSelectContributor = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setView('editor');
  };

  const handleBack = useCallback(() => {
    if (view === 'session') {
      setSelectedSession(null);
      setContributors([]);
      setView('home');
    } else if (view === 'editor') {
      setSelectedContributor(null);
      setView('session');
    } else if (view === 'summary') {
      setView('session');
    }
  }, [view]);

  const handleContributorRemoved = useCallback(() => {
    if (selectedContributor) {
      setContributors(prev => prev.filter(c => c.id !== selectedContributor.id));
    }
    setSelectedContributor(null);
    setView('session');
  }, [selectedContributor]);

  const handleContributorUpdated = useCallback((updated: Contributor) => {
    setContributors(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedContributor(updated);
  }, []);

  const handleGenerateSummary = () => {
    setView('summary');
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        view={view}
        onBack={handleBack}
        onNewSession={() => setShowNewSessionModal(true)}
        onGenerateSummary={view === 'session' && contributors.length > 0 ? handleGenerateSummary : undefined}
      />

      <main className="pt-14">
        {view === 'home' && (
          <HomeView
            onSelectSession={handleSelectSession}
            showModal={showNewSessionModal}
            onCloseModal={() => setShowNewSessionModal(false)}
            onOpenModal={() => setShowNewSessionModal(true)}
          />
        )}

        {view === 'session' && selectedSession && (
          <SessionView
            session={selectedSession}
            onSelectContributor={handleSelectContributor}
            onGenerateSummary={handleGenerateSummary}
            contributors={contributors}
            setContributors={setContributors}
          />
        )}

        {view === 'editor' && selectedContributor && (
          <EditorView
            contributor={selectedContributor}
            onBack={() => { setSelectedContributor(null); setView('session'); }}
            onRemoved={handleContributorRemoved}
            onUpdated={handleContributorUpdated}
          />
        )}

        {view === 'summary' && selectedSession && (
          <SummaryView
            session={selectedSession}
            contributors={contributors}
          />
        )}
      </main>
    </div>
  );
}
