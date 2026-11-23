import { useCallback, useRef, useState } from 'react';
import Nav from './components/Nav';
import UpgradeNotice from './components/UpgradeNotice';
import { useMiniGamesEnabled } from './hooks/useMiniGamesEnabled';
import { UpgradeDiscoveryContext, UPGRADE_DISCOVERY_KEY, SELECTED_DISCOVERY_KEY, type MiniGame } from './hooks/useUpgradeDiscovery';
import Hero from './components/Hero';
import Projects from './components/Projects';
import About from './components/About';
import ProjectDetail from './components/ProjectDetail';
import { sections, projects } from './data/portfolio';
import type { Project } from './data/types';
import { useSectionRouting } from './hooks/useSectionRouting';
import { useReveal } from './hooks/useReveal';

const sectionIds = sections.map((s) => s.id);

export default function App() {
  const defeatsRef = useRef(0);
  const ballHelpShownRef = useRef(false);
  const [noticeGame, setNoticeGame] = useState<MiniGame | null>(null);
  const selectedMissesRef = useRef(0);
  const selectedHelpShownRef = useRef(false);
  const [selectedDiscovered, setSelectedDiscovered] = useState(() => {
    try { return localStorage.getItem(SELECTED_DISCOVERY_KEY) === 'true'; } catch { return false; }
  });
  const onSelectedMiss = useCallback((score: number) => {
    selectedMissesRef.current += 1;
    if (!selectedHelpShownRef.current && (selectedMissesRef.current >= 2 || score >= 10)) {
      selectedHelpShownRef.current = true;
      setNoticeGame('selected-work');
      setSelectedDiscovered(true);
      try { localStorage.setItem(SELECTED_DISCOVERY_KEY, 'true'); } catch { /* Keep discovery for this visit. */ }
    }
  }, []);
  const [upgradesDiscovered, setUpgradesDiscovered] = useState(() => {
    try { return localStorage.getItem(UPGRADE_DISCOVERY_KEY) === 'true'; }
    catch { return false; }
  });
  const gamesEnabled = useMiniGamesEnabled();
  const showBallHelp = useCallback(() => {
    if (!ballHelpShownRef.current) {
      ballHelpShownRef.current = true;
      setNoticeGame('ball');
      setUpgradesDiscovered(true);
      try { localStorage.setItem(UPGRADE_DISCOVERY_KEY, 'true'); } catch { /* Keep discovery for this visit. */ }
    }
  }, []);
  const onDefeat = useCallback((score: number) => {
    const firstRunBonus = defeatsRef.current === 0 && score > 10;
    defeatsRef.current += 1;
    if (firstRunBonus || defeatsRef.current === 2) showBallHelp();
  }, [showBallHelp]);
  const noticeVisible = noticeGame !== null && gamesEnabled;
  const { active, navigate, activeProjectId, openProject, closeProject } =
    useSectionRouting(sectionIds);
  useReveal([activeProjectId]);

  const selectedProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId) ?? null
    : null;

  const handleSelectProject = (project: Project) => {
    openProject(project.id);
  };

  return (
    <>
      <Nav sections={sections} active={active} onNavigate={navigate} />
      <UpgradeDiscoveryContext.Provider value={{ ball: upgradesDiscovered, 'selected-work': selectedDiscovered, announced: noticeVisible ? noticeGame : null }}>
      <main className={noticeVisible ? 'upgrades-announced' : undefined}>
        {selectedProject ? (
          <ProjectDetail project={selectedProject} onBack={closeProject} />
        ) : (
          <>
            <Hero onNavigate={navigate} onSelectProject={handleSelectProject} onDefeat={onDefeat} />
            <Projects onSelectProject={handleSelectProject} onMiss={onSelectedMiss} />
            <About onSelectProject={handleSelectProject} />
          </>
        )}
      </main>
      {noticeVisible && <UpgradeNotice key={noticeGame} game={noticeGame!} onClose={() => setNoticeGame(null)} />}
      </UpgradeDiscoveryContext.Provider>
    </>
  );
}
