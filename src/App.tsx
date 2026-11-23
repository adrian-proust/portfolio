import { useCallback, useRef, useState } from 'react';
import Nav from './components/Nav';
import UpgradeNotice from './components/UpgradeNotice';
import { useMiniGamesEnabled } from './hooks/useMiniGamesEnabled';
import { UpgradeDiscoveryContext, UPGRADE_DISCOVERY_KEY } from './hooks/useUpgradeDiscovery';
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
  const [showUpgradeNotice, setShowUpgradeNotice] = useState(false);
  const [upgradesDiscovered, setUpgradesDiscovered] = useState(() => {
    try { return localStorage.getItem(UPGRADE_DISCOVERY_KEY) === 'true'; }
    catch { return false; }
  });
  const gamesEnabled = useMiniGamesEnabled();
  const onDefeat = useCallback(() => {
    defeatsRef.current += 1;
    if (defeatsRef.current === 2) {
      setShowUpgradeNotice(true);
      setUpgradesDiscovered(true);
      try { localStorage.setItem(UPGRADE_DISCOVERY_KEY, 'true'); } catch { /* Keep discovery for this visit. */ }
    }
  }, []);
  const noticeVisible = showUpgradeNotice && gamesEnabled;
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
      <UpgradeDiscoveryContext.Provider value={upgradesDiscovered}>
      <main className={noticeVisible ? 'upgrades-announced' : undefined}>
        {selectedProject ? (
          <ProjectDetail project={selectedProject} onBack={closeProject} />
        ) : (
          <>
            <Hero onNavigate={navigate} onSelectProject={handleSelectProject} onDefeat={onDefeat} />
            <Projects onSelectProject={handleSelectProject} />
            <About onSelectProject={handleSelectProject} />
          </>
        )}
      </main>
      {noticeVisible && <UpgradeNotice onClose={() => setShowUpgradeNotice(false)} />}
      </UpgradeDiscoveryContext.Provider>
    </>
  );
}
