/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LearningModule, ModuleProgress, QuizAttempt, UserProfile } from './types';
import { SupabaseService } from './services/supabaseService';
import { SplashScreen } from './components/SplashScreen';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { SlideViewer } from './components/SlideViewer';
import { QuizView } from './components/QuizView';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { DiscussionSection } from './components/DiscussionSection';
import { AvatarModal } from './components/AvatarModal';
import { LoginPage } from './components/LoginPage';
import { CompanionMotif } from './components/CompanionMotifs';
import { VisionStreamingLayout } from './components/VisionStreamingLayout';
import { MathNotationModal } from './components/MathView';
import { SigmaEchoLogo } from './components/SigmaEchoLogo';
import { DevFloatingDock } from './components/DevFloatingDock';
import { 
  Sparkles, 
  Search, 
  Layers, 
  GraduationCap, 
  CheckCircle, 
  ArrowRight,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTab, setCurrentTab] = useState<'modules' | 'dashboard' | 'discussions'>('modules');
  const [user, setUser] = useState<UserProfile>(SupabaseService.getCachedUserProfile());
  const [modules, setModules] = useState<LearningModule[]>(SupabaseService.getModules());
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>(SupabaseService.getCachedModuleProgress());
  const [attempts, setAttempts] = useState<QuizAttempt[]>(SupabaseService.getCachedQuizAttempts());

  // Active sub-views
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isGlobalMathModalOpen, setIsGlobalMathModalOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  const refreshUserData = async () => {
    try {
      const [currUser, currProgress, currAttempts] = await Promise.all([
        SupabaseService.getUserProfile(),
        SupabaseService.getModuleProgress(),
        SupabaseService.getQuizAttempts()
      ]);
      setUser(currUser);
      setProgress(currProgress);
      setAttempts(currAttempts);
    } catch (err) {
      console.error('Failed to refresh user data from Supabase:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [currUser, currProgress, currAttempts] = await Promise.all([
          SupabaseService.getUserProfile(),
          SupabaseService.getModuleProgress(),
          SupabaseService.getQuizAttempts()
        ]);
        if (isMounted) {
          setUser(currUser);
          setProgress(currProgress);
          setAttempts(currAttempts);
        }
      } catch (err) {
        console.error('Error loading initial Supabase data:', err);
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = async (profile: UserProfile) => {
    setUser(profile);
    setIsLoggedIn(true);
    await refreshUserData();
  };

  const handleLogout = async () => {
    await SupabaseService.logout();
    setIsLoggedIn(false);
  };

  const handleSelectModule = (mod: LearningModule) => {
    setActiveModule(mod);
    setIsQuizActive(false);
  };

  const handleStartQuiz = () => {
    setIsQuizActive(true);
  };

  const handleCompleteQuiz = async (attempt: QuizAttempt) => {
    // Refresh state after quiz completion
    await refreshUserData();
  };

  const handleExitModuleViewer = async () => {
    setActiveModule(null);
    setIsQuizActive(false);
    await refreshUserData();
  };

  // Filter modules based on search query and domain filter
  const filteredModules = modules.filter(m => {
    const matchesSearch = 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.domain.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDomain = domainFilter === 'all' || m.domain.toLowerCase().includes(domainFilter.toLowerCase());

    return matchesSearch && matchesDomain;
  });

  // Calculate high-level summary
  const completedModulesCount = (Object.values(progress) as ModuleProgress[]).filter(p => p.isCompleted).length;

  if (isLoading) {
    return <SplashScreen onComplete={() => setIsLoading(false)} />;
  }

  if (!isLoggedIn) {
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <>
      <VisionStreamingLayout
        modules={modules}
        progress={progress}
        user={user}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setActiveModule(null);
          setIsQuizActive(false);
        }}
        activeModule={activeModule}
        onSelectModule={handleSelectModule}
        onStartQuiz={handleStartQuiz}
        isQuizActive={isQuizActive}
        onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
        onLogout={handleLogout}
        onOpenMathGuide={() => setIsGlobalMathModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        domainFilter={domainFilter}
        onSelectDomainFilter={setDomainFilter}
      >
        {/* Active Quiz View */}
        {isQuizActive && activeModule ? (
          <QuizView
            module={activeModule}
            onExit={handleExitModuleViewer}
            onCompleteQuiz={handleCompleteQuiz}
          />
        ) : activeModule ? (
          /* Active Slide Track Reader */
          <SlideViewer
            module={activeModule}
            onBack={handleExitModuleViewer}
            onStartQuiz={handleStartQuiz}
            onOpenDiscussions={() => {
              setCurrentTab('discussions');
              setActiveModule(null);
            }}
          />
        ) : (
          /* Non-modules Tabs */
          <div>
            {/* Tab: Dashboard */}
            {currentTab === 'dashboard' && (
              user.role === 'teacher' ? (
                <TeacherDashboard
                  user={user}
                  modules={modules}
                />
              ) : (
                <StudentDashboard
                  user={user}
                  modules={modules}
                  progress={progress}
                  attempts={attempts}
                  onSelectModule={handleSelectModule}
                  onOpenEditProfile={() => setIsAvatarModalOpen(true)}
                />
              )
            )}

            {/* Tab: Discussions */}
            {currentTab === 'discussions' && (
              <DiscussionSection
                user={user}
                modules={modules}
              />
            )}
          </div>
        )}
      </VisionStreamingLayout>

      {/* Avatar Personalization Modal */}
      <AvatarModal
        user={user}
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onUpdateUser={(updated) => setUser(updated)}
      />

      {/* Global Math Notation Modal */}
      <MathNotationModal
        isOpen={isGlobalMathModalOpen}
        onClose={() => setIsGlobalMathModalOpen(false)}
      />

      {/* Developer Suite Floating Dock (Only for Dev Session) */}
      <DevFloatingDock 
        user={user}
        onUpdateUser={setUser}
        onRefreshData={refreshUserData}
      />
    </>
  );
}
