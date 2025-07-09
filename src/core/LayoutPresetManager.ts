import type { SplitPane } from './WindowManager'
import { WindowManager } from './WindowManager'

export interface LayoutPreset {
  id: string;
  name: string;
  rootPane: SplitPane;
  createdAt: number;
  updatedAt: number;
}

export class LayoutPresetManager {
  private static readonly STORAGE_KEY = 'graphstudio_layout_presets';
  private windowManager: WindowManager;

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }

  // Save current tab layout as a named preset
  saveLayoutPreset(name: string, rootPane: SplitPane): string {
    const presets = this.getAllPresets();
    const now = Date.now();
    
    // Check if preset with this name already exists
    const existingPreset = presets.find(p => p.name === name);
    
    if (existingPreset) {
      // Update existing preset
      existingPreset.rootPane = this.clonePane(rootPane);
      existingPreset.updatedAt = now;
    } else {
      // Create new preset
      const preset: LayoutPreset = {
        id: `preset-${now}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        rootPane: this.clonePane(rootPane),
        createdAt: now,
        updatedAt: now
      };
      presets.push(preset);
    }

    this.savePresets(presets);
    return existingPreset ? existingPreset.id : presets[presets.length - 1].id;
  }

  // Load a layout preset by name
  loadLayoutPreset(name: string): SplitPane | null {
    const presets = this.getAllPresets();
    const preset = presets.find(p => p.name === name);
    
    if (!preset) return null;
    
    return this.clonePane(preset.rootPane);
  }

  // Get all saved layout presets
  getAllPresets(): LayoutPreset[] {
    try {
      const presetsString = localStorage.getItem(LayoutPresetManager.STORAGE_KEY);
      if (!presetsString) return [];
      
      const presets = JSON.parse(presetsString);
      return Array.isArray(presets) ? presets : [];
    } catch (error) {
      console.error('Failed to load layout presets:', error);
      return [];
    }
  }

  // Get preset names sorted by most recently updated
  getPresetNames(): string[] {
    const presets = this.getAllPresets();
    return presets
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(p => p.name);
  }

  // Delete a layout preset
  deletePreset(name: string): boolean {
    const presets = this.getAllPresets();
    const index = presets.findIndex(p => p.name === name);
    
    if (index === -1) return false;
    
    presets.splice(index, 1);
    this.savePresets(presets);
    return true;
  }

  // Check if preset name exists
  presetExists(name: string): boolean {
    const presets = this.getAllPresets();
    return presets.some(p => p.name === name);
  }

  // Clear all presets
  clearAllPresets(): void {
    localStorage.removeItem(LayoutPresetManager.STORAGE_KEY);
  }

  private savePresets(presets: LayoutPreset[]): void {
    try {
      localStorage.setItem(LayoutPresetManager.STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save layout presets:', error);
    }
  }

  private clonePane(pane: SplitPane): SplitPane {
    // Deep clone the pane structure with new IDs to avoid conflicts
    const cloned: SplitPane = {
      id: `${pane.id}-clone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: pane.type
    };

    if (pane.type === 'split') {
      cloned.direction = pane.direction;
      cloned.size = pane.size;
      cloned.sizes = pane.sizes ? [...pane.sizes] : undefined;
      cloned.children = pane.children?.map(child => this.clonePane(child));
    } else if (pane.type === 'window' && pane.window) {
      // Create new window with same type but new ID
      const newWindow = this.windowManager.createWindow(pane.window.type);
      cloned.window = newWindow.window;
    }

    return cloned;
  }
} 