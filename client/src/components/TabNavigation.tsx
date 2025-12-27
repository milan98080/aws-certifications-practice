import React, { useState } from 'react';
import './TabNavigation.css';

export type TabType = 'random' | 'mock' | 'practice' | 'study' | 'history';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'random' as TabType, label: 'Random Practice', icon: '🎲' },
    { id: 'mock' as TabType, label: 'Mock Test', icon: '⏱️' },
    { id: 'practice' as TabType, label: 'Practice Mode', icon: '📚' },
    { id: 'study' as TabType, label: 'Study Mode', icon: '🎯' },
    { id: 'history' as TabType, label: 'Test History', icon: '📊' }
  ];

  const handleTabChange = (tab: TabType) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false); // Close mobile menu when tab is selected
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="tab-navigation">
      {/* Desktop Navigation */}
      <div className="desktop-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile Navigation */}
      <div className="mobile-nav">
        <button 
          className="mobile-menu-button"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <div className="current-tab">
            <span className="tab-icon">{activeTabData?.icon}</span>
            <span className="tab-label">{activeTabData?.label}</span>
          </div>
          <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        {/* Mobile Dropdown Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`mobile-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default TabNavigation;