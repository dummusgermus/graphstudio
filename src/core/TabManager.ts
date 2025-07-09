import type { SplitPane } from './WindowManager'
import { WindowManager } from './WindowManager'

export interface Tab {
  id: string;
  title: string;
  rootPane: SplitPane;
  isActive: boolean;
}

export class TabManager {
  private tabs: Tab[] = [];
  private tabCounter = 0;
  private windowManager: WindowManager;

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }

  createTab(title: string, rootPane: SplitPane): Tab {
    const tab: Tab = {
      id: `tab-${++this.tabCounter}`,
      title,
      rootPane,
      isActive: false
    };

    this.tabs.push(tab);
    return tab;
  }

  addTab(title: string, rootPane: SplitPane): string {
    const tab = this.createTab(title, rootPane);
    
    // If this is the first tab, make it active
    if (this.tabs.length === 1) {
      this.setActiveTab(tab.id);
    }
    
    return tab.id;
  }

  createNewTab(): string {
    // Create a new tab with default layout (welcome + graph creator)
    const welcomeWindow = this.windowManager.createWindow('welcome');
    const graphCreatorWindow = this.windowManager.createWindow('graph-creator');
    const rootPane = this.windowManager.createSplit('horizontal', welcomeWindow, graphCreatorWindow);
    
    const tabId = this.addTab(`Tab ${this.tabs.length + 1}`, rootPane);
    
    // Automatically switch to the new tab
    this.setActiveTab(tabId);
    
    return tabId;
  }

  closeTab(tabId: string): boolean {
    const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return false;

    // Don't allow closing the last tab
    if (this.tabs.length === 1) return false;

    const wasActive = this.tabs[tabIndex].isActive;
    this.tabs.splice(tabIndex, 1);

    // If we closed the active tab, activate another one
    if (wasActive && this.tabs.length > 0) {
      // Activate the tab to the left, or the first tab if we closed the first one
      const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
      this.setActiveTab(this.tabs[newActiveIndex].id);
    }

    return true;
  }

  setActiveTab(tabId: string): boolean {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return false;

    // Deactivate all tabs
    this.tabs.forEach(t => t.isActive = false);
    
    // Activate the selected tab
    tab.isActive = true;
    
    return true;
  }

  getActiveTab(): Tab | null {
    return this.tabs.find(tab => tab.isActive) || null;
  }

  getActiveRootPane(): SplitPane | null {
    const activeTab = this.getActiveTab();
    return activeTab ? activeTab.rootPane : null;
  }

  getTabs(): Tab[] {
    return [...this.tabs];
  }

  updateTabRootPane(tabId: string, rootPane: SplitPane): boolean {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return false;
    
    tab.rootPane = rootPane;
    return true;
  }

  renameTab(tabId: string, newTitle: string): boolean {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return false;
    
    tab.title = newTitle;
    return true;
  }

  // Initialize with a default tab
  initializeWithDefaultTab(): void {
    if (this.tabs.length === 0) {
      this.createNewTab();
    }
  }
} 