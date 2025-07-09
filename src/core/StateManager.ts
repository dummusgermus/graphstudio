import type { Tab } from './TabManager'
import type { SplitPane, WindowConfig } from './WindowManager'
import { TabManager } from './TabManager'

interface SerializedState {
  version: string;
  timestamp: number;
  tabs: SerializedTab[];
  activeTabId: string | null;
}

interface SerializedTab {
  id: string;
  title: string;
  rootPane: SerializedPane;
  isActive: boolean;
}

interface SerializedPane {
  id: string;
  type: 'window' | 'split';
  direction?: 'horizontal' | 'vertical';
  children?: SerializedPane[];
  window?: SerializedWindow;
  size?: number;
  sizes?: [number, number];
}

interface SerializedWindow {
  id: string;
  type: string;
  title: string;
  content: string;
  customData?: Record<string, any>; // For storing component-specific state
}

export class StateManager {
  private static readonly STORAGE_KEY = 'graphstudio_state';
  private static readonly STATE_VERSION = '1.0.0';
  private static readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds
  
  private tabManager: TabManager;
  private autoSaveInterval: number | null = null;

  constructor(tabManager: TabManager) {
    this.tabManager = tabManager;
  }

  // Auto-save functionality
  startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.autoSaveInterval = window.setInterval(() => {
      this.saveState();
    }, StateManager.AUTO_SAVE_INTERVAL);
  }

  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // Save current state to localStorage
  saveState(): boolean {
    try {
      const tabs = this.tabManager.getTabs();
      const activeTab = this.tabManager.getActiveTab();
      
      const serializedState: SerializedState = {
        version: StateManager.STATE_VERSION,
        timestamp: Date.now(),
        tabs: tabs.map(tab => this.serializeTab(tab)),
        activeTabId: activeTab?.id || null
      };

      // Also store window-specific state
      this.storeWindowStates();
      
      const stateString = JSON.stringify(serializedState);
      localStorage.setItem(StateManager.STORAGE_KEY, stateString);
      
      console.log('State saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save state:', error);
      return false;
    }
  }

  // Load state from localStorage
  loadState(): boolean {
    try {
      const stateString = localStorage.getItem(StateManager.STORAGE_KEY);
      if (!stateString) {
        console.log('No saved state found');
        return false;
      }

      const serializedState: SerializedState = JSON.parse(stateString);
      
      // Version compatibility check
      if (serializedState.version !== StateManager.STATE_VERSION) {
        console.warn('State version mismatch, skipping load');
        return false;
      }

      // Clear current tabs
      this.clearCurrentState();

      // Restore tabs and their layouts
      for (const serializedTab of serializedState.tabs) {
        const rootPane = this.deserializePane(serializedTab.rootPane);
        const tabId = this.tabManager.addTab(serializedTab.title, rootPane);
        
        // Update the tab ID to match the saved one (for consistency)
        const tab = this.tabManager.getTabs().find(t => t.id === tabId);
        if (tab) {
          (tab as any).id = serializedTab.id; // Override the auto-generated ID
        }
      }

      // Set active tab
      if (serializedState.activeTabId) {
        this.tabManager.setActiveTab(serializedState.activeTabId);
      }

      // Restore window-specific states
      this.restoreWindowStates();
      
      console.log('State loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load state:', error);
      return false;
    }
  }

  // Clear localStorage
  clearSavedState(): void {
    localStorage.removeItem(StateManager.STORAGE_KEY);
    localStorage.removeItem(StateManager.STORAGE_KEY + '_windows');
    console.log('Saved state cleared');
  }

  // Check if saved state exists
  hasSavedState(): boolean {
    return localStorage.getItem(StateManager.STORAGE_KEY) !== null;
  }

  // Get state info without loading
  getStateInfo(): { timestamp: number; tabCount: number } | null {
    try {
      const stateString = localStorage.getItem(StateManager.STORAGE_KEY);
      if (!stateString) return null;

      const state: SerializedState = JSON.parse(stateString);
      return {
        timestamp: state.timestamp,
        tabCount: state.tabs.length
      };
    } catch {
      return null;
    }
  }

  private clearCurrentState(): void {
    // Get all current tabs and close them (except we need at least one)
    const currentTabs = this.tabManager.getTabs();
    for (let i = currentTabs.length - 1; i >= 0; i--) {
      if (i === 0 && currentTabs.length === 1) break; // Keep at least one tab
      this.tabManager.closeTab(currentTabs[i].id);
    }
  }

  private serializeTab(tab: Tab): SerializedTab {
    return {
      id: tab.id,
      title: tab.title,
      rootPane: this.serializePane(tab.rootPane),
      isActive: tab.isActive
    };
  }

  private serializePane(pane: SplitPane): SerializedPane {
    const serialized: SerializedPane = {
      id: pane.id,
      type: pane.type
    };

    if (pane.type === 'split') {
      serialized.direction = pane.direction;
      serialized.children = pane.children?.map(child => this.serializePane(child));
      serialized.size = pane.size;
      serialized.sizes = pane.sizes;
    } else if (pane.type === 'window' && pane.window) {
      serialized.window = this.serializeWindow(pane.window);
    }

    return serialized;
  }

  private serializeWindow(window: WindowConfig): SerializedWindow {
    return {
      id: window.id,
      type: window.type,
      title: window.title,
      content: window.content,
      customData: this.extractWindowCustomData(window)
    };
  }

  private deserializePane(serialized: SerializedPane): SplitPane {
    const pane: SplitPane = {
      id: serialized.id,
      type: serialized.type
    };

    if (serialized.type === 'split') {
      pane.direction = serialized.direction;
      pane.children = serialized.children?.map(child => this.deserializePane(child));
      pane.size = serialized.size;
      pane.sizes = serialized.sizes;
    } else if (serialized.type === 'window' && serialized.window) {
      pane.window = this.deserializeWindow(serialized.window);
    }

    return pane;
  }

  private deserializeWindow(serialized: SerializedWindow): WindowConfig {
    return {
      id: serialized.id,
      type: serialized.type,
      title: serialized.title,
      content: serialized.content
    };
  }

  private extractWindowCustomData(window: WindowConfig): Record<string, any> {
    // This can be extended to extract specific state from different window types
    const customData: Record<string, any> = {};

    // For graph creator windows, we might want to store graph data
    if (window.type === 'graph-creator') {
      // Store any graph-specific state here
      customData.graphData = {}; // Placeholder for graph state
    }

    return customData;
  }

  private storeWindowStates(): void {
    // Store additional window-specific state that can't be serialized in JSON
    const windowStates: Record<string, any> = {};
    
    // Extract state from DOM elements of each window type
    document.querySelectorAll('[data-window-id]').forEach(windowEl => {
      const windowId = windowEl.getAttribute('data-window-id');
      if (!windowId) return;

      const windowType = windowEl.getAttribute('data-window-type');
      
      // Extract form values, canvas state, etc.
      const inputs = windowEl.querySelectorAll('input, textarea, select');
      const inputStates: Record<string, any> = {};
      
      inputs.forEach(input => {
        const element = input as HTMLInputElement;
        if (element.id || element.name) {
          const key = element.id || element.name;
          if (element.type === 'checkbox' || element.type === 'radio') {
            inputStates[key] = element.checked;
          } else {
            inputStates[key] = element.value;
          }
        }
      });

      if (Object.keys(inputStates).length > 0) {
        windowStates[windowId] = { inputs: inputStates, type: windowType };
      }
    });

    if (Object.keys(windowStates).length > 0) {
      localStorage.setItem(StateManager.STORAGE_KEY + '_windows', JSON.stringify(windowStates));
    }
  }

  private restoreWindowStates(): void {
    try {
      const windowStatesString = localStorage.getItem(StateManager.STORAGE_KEY + '_windows');
      if (!windowStatesString) return;

      const windowStates = JSON.parse(windowStatesString);
      
      // Wait a bit for DOM to be ready, then restore states
      setTimeout(() => {
        Object.entries(windowStates).forEach(([windowId, state]: [string, any]) => {
          const windowEl = document.querySelector(`[data-window-id="${windowId}"]`);
          if (!windowEl || !state.inputs) return;

          Object.entries(state.inputs).forEach(([key, value]: [string, any]) => {
            const input = windowEl.querySelector(`#${key}, [name="${key}"]`) as HTMLInputElement;
            if (!input) return;

            if (input.type === 'checkbox' || input.type === 'radio') {
              input.checked = value;
            } else {
              input.value = value;
            }

            // Trigger change event to update any listeners
            input.dispatchEvent(new Event('change', { bubbles: true }));
          });
        });
      }, 500);
    } catch (error) {
      console.error('Failed to restore window states:', error);
    }
  }
} 