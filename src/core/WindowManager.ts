import { ContentManager } from './ContentManager';

export interface WindowConfig {
  id: string;
  type: string;
  title: string;
  content: string;
}

export interface SplitPane {
  id: string;
  type: 'window' | 'split';
  direction?: 'horizontal' | 'vertical';
  children?: SplitPane[];
  window?: WindowConfig;
  size?: number;
  sizes?: [number, number]; // [pane1Percent, pane2Percent] for preserving resize state
}

export class WindowManager {
  private windowCounter = 0;
  private contentManager: ContentManager;
  private windowTypes = {
    'welcome': { title: 'Welcome', contentMethod: 'getWelcomeContent' },
    'graph-creator': { title: 'Graph Creator', contentMethod: 'getGraphCreatorContent' },
    'algorithm-visualizer': { title: 'Algorithm Visualizer', contentMethod: 'getAlgorithmVisualizerContent' },
    'data-manager': { title: 'Data Manager', contentMethod: 'getDataManagerContent' },
    'settings': { title: 'Settings', contentMethod: 'getSettingsContent' }
  };

  constructor(contentManager: ContentManager) {
    this.contentManager = contentManager;
  }

  getWindowTypes() {
    return this.windowTypes;
  }

  createWindow(windowType: string): SplitPane {
    const typeConfig = this.windowTypes[windowType as keyof typeof this.windowTypes];
    const content = this.contentManager.getContentForType(windowType);
    
    return {
      id: `window-${++this.windowCounter}`,
      type: 'window',
      window: {
        id: `window-${this.windowCounter}`,
        type: windowType,
        title: typeConfig.title,
        content
      }
    };
  }

  createSplit(direction: 'horizontal' | 'vertical', pane1: SplitPane, pane2: SplitPane): SplitPane {
    return {
      id: `split-${++this.windowCounter}`,
      type: 'split',
      direction,
      children: [pane1, pane2],
      size: 50
    };
  }

  renderSplit(splitPane: SplitPane, renderPane: (pane: SplitPane) => HTMLElement): HTMLElement {
    const splitEl = document.createElement('div');
    splitEl.className = `split-container split-${splitPane.direction}`;
    
    const [pane1, pane2] = splitPane.children!;
    
    const pane1El = document.createElement('div');
    pane1El.className = 'split-pane';
    pane1El.appendChild(renderPane(pane1));
    
    const resizerEl = document.createElement('div');
    resizerEl.className = `resizer resizer-${splitPane.direction}`;
    
    const pane2El = document.createElement('div');
    pane2El.className = 'split-pane';
    pane2El.appendChild(renderPane(pane2));
    
    // Apply preserved sizes if they exist
    if (splitPane.sizes) {
      const [pane1Percent, pane2Percent] = splitPane.sizes;
      pane1El.style.flexBasis = `${pane1Percent}%`;
      pane1El.style.flexGrow = '0';
      pane1El.style.flexShrink = '0';
      pane2El.style.flexBasis = `${pane2Percent}%`;
      pane2El.style.flexGrow = '0';
      pane2El.style.flexShrink = '0';
    }
    
    splitEl.appendChild(pane1El);
    splitEl.appendChild(resizerEl);
    splitEl.appendChild(pane2El);
    
    // Add resizer functionality
    this.makeResizable(resizerEl, pane1El, pane2El, splitPane.direction!, splitPane);
    
    return splitEl;
  }

  private makeResizable(resizer: HTMLElement, pane1: HTMLElement, pane2: HTMLElement, direction: 'horizontal' | 'vertical', splitPane: SplitPane) {
    let isResizing = false;
    let startPos = 0;
    let containerSize = 0;
    let pane1StartSize = 0;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      resizer.classList.add('resizing');
      
      const container = resizer.parentElement!;
      const containerRect = container.getBoundingClientRect();
      const pane1Rect = pane1.getBoundingClientRect();
      
      if (direction === 'horizontal') {
        startPos = e.clientX;
        containerSize = containerRect.width - 4; // Account for resizer width
        pane1StartSize = pane1Rect.width;
      } else {
        startPos = e.clientY;
        containerSize = containerRect.height - 4; // Account for resizer height
        pane1StartSize = pane1Rect.height;
      }
      
      // Calculate current percentages to avoid visual reset
      const currentPane1Percent = (pane1StartSize / containerSize) * 100;
      const currentPane2Percent = 100 - currentPane1Percent;
      
      // Set flex properties to current state to avoid flash
      pane1.style.flexGrow = '0';
      pane1.style.flexShrink = '0'; 
      pane1.style.flexBasis = `${currentPane1Percent}%`;
      pane2.style.flexGrow = '0';
      pane2.style.flexShrink = '0';
      pane2.style.flexBasis = `${currentPane2Percent}%`;
      
      // Ensure resizer maintains its fixed dimensions
      if (direction === 'horizontal') {
        resizer.style.width = '4px';
        resizer.style.minWidth = '4px';
        resizer.style.maxWidth = '4px';
        resizer.style.flexBasis = '4px';
      } else {
        resizer.style.height = '4px';
        resizer.style.minHeight = '4px';
        resizer.style.maxHeight = '4px';
        resizer.style.flexBasis = '4px';
      }
      resizer.style.flexGrow = '0';
      resizer.style.flexShrink = '0';
      
      // Prevent text selection during resize
      document.body.style.userSelect = 'none';
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
      e.stopPropagation();
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos;
      const newPane1Size = pane1StartSize + delta;
      
      // Calculate percentage based on container size
      const minSize = 150; // Minimum size in pixels
      const maxSize = containerSize - minSize;
      
      const clampedSize = Math.max(minSize, Math.min(maxSize, newPane1Size));
      const pane1Percent = (clampedSize / containerSize) * 100;
      const pane2Percent = 100 - pane1Percent;
      
      // Apply flex-basis instead of width/height for better flexbox behavior
      if (direction === 'horizontal') {
        pane1.style.flexBasis = `${pane1Percent}%`;
        pane2.style.flexBasis = `${pane2Percent}%`;
      } else {
        pane1.style.flexBasis = `${pane1Percent}%`;
        pane2.style.flexBasis = `${pane2Percent}%`;
      }
      
      // Ensure panes don't grow or shrink beyond their set basis
      pane1.style.flexGrow = '0';
      pane1.style.flexShrink = '0';
      pane2.style.flexGrow = '0';
      pane2.style.flexShrink = '0';
      
      // Save the sizes to the splitPane data structure for persistence
      splitPane.sizes = [pane1Percent, pane2Percent];
    };

    const handleMouseUp = () => {
      if (!isResizing) return;
      
      isResizing = false;
      resizer.classList.remove('resizing');
      
      // Reset cursor and selection
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }

  handleWindowAction(action: string, windowId: string, rootPane: SplitPane, renderCallback: () => void) {
    switch (action) {
      case 'split-top':
        this.splitWindow(windowId, 'vertical', 'before', rootPane, renderCallback);
        break;
      case 'split-right':
        this.splitWindow(windowId, 'horizontal', 'after', rootPane, renderCallback);
        break;
      case 'split-bottom':
        this.splitWindow(windowId, 'vertical', 'after', rootPane, renderCallback);
        break;
      case 'split-left':
        this.splitWindow(windowId, 'horizontal', 'before', rootPane, renderCallback);
        break;
      case 'close':
        this.closeWindow(windowId, rootPane, renderCallback);
        break;
    }
  }

  changeWindowType(windowId: string, newType: string, rootPane: SplitPane, renderCallback: () => void) {
    const windowPane = this.findPane(rootPane, windowId);
    if (windowPane && windowPane.type === 'window' && windowPane.window) {
      windowPane.window.type = newType;
      windowPane.window.title = this.windowTypes[newType as keyof typeof this.windowTypes].title;
      windowPane.window.content = this.contentManager.getContentForType(newType);
      renderCallback();
    }
  }

  splitWindow(windowId: string, direction: 'horizontal' | 'vertical', position: 'before' | 'after', rootPane: SplitPane, renderCallback: () => void) {
    const targetPane = this.findPane(rootPane, windowId);
    if (!targetPane || targetPane.type !== 'window') return;

    const newWindow = this.createWindow('welcome');
    
    // Create a copy of the target pane to avoid modifying the original
    const targetPaneCopy: SplitPane = {
      id: targetPane.id,
      type: targetPane.type,
      window: targetPane.window ? { ...targetPane.window } : undefined
    };
    
    const splitPane = position === 'before' 
      ? this.createSplit(direction, newWindow, targetPaneCopy)
      : this.createSplit(direction, targetPaneCopy, newWindow);
    
    this.replacePane(rootPane, windowId, splitPane);
    renderCallback();
  }

  closeWindow(windowId: string, rootPane: SplitPane, renderCallback: () => void) {
    // Don't close if it's the only window
    if (rootPane.type === 'window' && rootPane.window?.id === windowId) {
      return;
    }

    this.removePane(windowId, rootPane);
    renderCallback();
  }

  findPane(pane: SplitPane, windowId: string): SplitPane | null {
    if (pane.type === 'window' && pane.window?.id === windowId) {
      return pane;
    }
    
    if (pane.type === 'split' && pane.children) {
      for (const child of pane.children) {
        const found = this.findPane(child, windowId);
        if (found) return found;
      }
    }
    
    return null;
  }

  replacePane(rootPane: SplitPane, windowId: string, newPane: SplitPane): boolean {
    if (rootPane.type === 'window' && rootPane.window?.id === windowId) {
      Object.assign(rootPane, newPane);
      return true;
    }
    
    if (rootPane.type === 'split' && rootPane.children) {
      for (let i = 0; i < rootPane.children.length; i++) {
        if (rootPane.children[i].type === 'window' && rootPane.children[i].window?.id === windowId) {
          rootPane.children[i] = newPane;
          return true;
        } else if (this.replacePane(rootPane.children[i], windowId, newPane)) {
          return true;
        }
      }
    }
    
    return false;
  }

  removePane(windowId: string, rootPane: SplitPane): boolean {
    const removeFromChildren = (pane: SplitPane): boolean => {
      if (pane.type === 'split' && pane.children) {
        for (let i = 0; i < pane.children.length; i++) {
          if (pane.children[i].type === 'window' && pane.children[i].window?.id === windowId) {
            // Replace the split with the remaining child
            const remainingChild = pane.children[1 - i];
            Object.assign(pane, remainingChild);
            return true;
          } else if (removeFromChildren(pane.children[i])) {
            return true;
          }
        }
      }
      return false;
    };

    return removeFromChildren(rootPane);
  }
} 