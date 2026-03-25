
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProjectState, BusinessModel } from '../../types';

interface ProjectContextType {
  state: ProjectState;
  updateState: (updates: Partial<ProjectState>) => void;
  completeOnboarding: () => void;
  resetMission: () => void;
}

const defaultState: ProjectState = {
  isInitialized: false,
  model: null,
  hasProduct: false,
  competitorsIdentified: false,
  competitorUrls: [],
  currentMissionPhase: 'INTEL'
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persist to local storage to simulate a saved "Save Game"
  const [state, setState] = useState<ProjectState>(() => {
    const saved = localStorage.getItem('conversion_craft_mission');
    return saved ? JSON.parse(saved) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('conversion_craft_mission', JSON.stringify(state));
  }, [state]);

  const updateState = (updates: Partial<ProjectState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const completeOnboarding = () => {
    // Determine the initial mission phase based on inputs
    let phase: ProjectState['currentMissionPhase'] = 'INTEL';
    if (state.hasProduct) phase = 'SUPPLY';
    if (state.competitorsIdentified) phase = 'ASSAULT';

    setState(prev => ({ ...prev, isInitialized: true, currentMissionPhase: phase }));
  };

  const resetMission = () => {
    setState(defaultState);
    localStorage.removeItem('conversion_craft_mission');
  };

  return (
    <ProjectContext.Provider value={{ state, updateState, completeOnboarding, resetMission }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within a ProjectProvider");
  return context;
};
