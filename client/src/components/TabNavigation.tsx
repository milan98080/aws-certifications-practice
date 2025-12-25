import React from 'react';
import './TabNavigation.css';

export type TabType = 'random' | 'mock' | 'practice' | 'study' | 'history';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'random' as TabType, label: 'Random Practice', icon: '🎲' },
    { id: 'mock' as TabType, label: 'Mock Test', icon: '⏱️' },
    { id: 'practice' as TabType, label: 'Practice Mode', icon: '📚' },
    { id: 'study' as TabType, label: 'Study Mode', icon: '🎯' },
    { id: 'history' as TabType, label: 'Test History', icon: '📊' }
  ];

  return (
    <div className="tab-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;

export {};