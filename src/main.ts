import './style.css'
import { ThemeManager } from './core/ThemeManager'
import { ContentManager } from './core/ContentManager'
import { GraphManager } from './core/GraphManager'
import { WindowManager } from './core/WindowManager'
import { UIManager } from './core/UIManager'
import { TabManager } from './core/TabManager'
import { StateManager } from './core/StateManager'
import { LayoutPresetManager } from './core/LayoutPresetManager'
import type { WindowConfig, SplitPane } from './core/WindowManager'

class GraphStudio {
  private app: HTMLElement;
  private mainContainer!: HTMLElement;
  private themeManager: ThemeManager;
  private contentManager: ContentManager;
  private graphManager: GraphManager;
  private windowManager: WindowManager;
  private uiManager: UIManager;
  private tabManager: TabManager;
  private stateManager: StateManager;
  private layoutPresetManager: LayoutPresetManager;
  private windowElementCache: Map<string, HTMLElement> = new Map();

  constructor() {
    this.app = document.querySelector('#app')!;
    this.contentManager = new ContentManager();
    this.graphManager = new GraphManager();
    this.windowManager = new WindowManager(this.contentManager);
    this.uiManager = new UIManager(this.graphManager);
    this.tabManager = new TabManager(this.windowManager);
    this.stateManager = new StateManager(this.tabManager);
    this.layoutPresetManager = new LayoutPresetManager(this.windowManager);
    this.themeManager = new ThemeManager(this.graphManager.getGraphInstances());
    this.themeManager.initTheme();
    this.init();
  }

  private init() {
    this.app.innerHTML = this.uiManager.createAppLayout();

    this.mainContainer = document.getElementById('main-container')!;
    
    // Initialize theme toggle
    this.themeManager.setupThemeToggle();
    
    // Try to restore saved state first
    const restored = this.stateManager.loadState();
    
    if (!restored) {
      // Initialize with the first tab only if no state was restored
      this.tabManager.initializeWithDefaultTab();
    }
    
    // Setup tab event listeners
    this.uiManager.setupTabEventListeners(
      (tabId) => this.handleTabSwitch(tabId),
      (tabId) => this.handleTabClose(tabId),
      () => this.handleNewTab()
    );

    // Setup state management listeners
    this.setupStateManagementListeners();
    
    // Setup layout preset functionality
    this.setupLayoutPresetFunctionality();
    
    // Start auto-save
    this.stateManager.startAutoSave();
    
    // Auto-save before page unload
    window.addEventListener('beforeunload', () => {
      this.stateManager.saveState();
    });
    
    // Initialize animated logo
    this.initializeAnimatedLogo();
    
    this.render();
  }

  private setupLayoutPresetFunctionality(): void {
    // Setup layout preset dialog
    this.uiManager.setupLayoutPresetDialog(
      (name: string) => this.handleSaveLayoutPreset(name),
      () => {} // onCancel - no special handling needed
    );
    
    // Update the submenu with existing presets
    this.updateLayoutPresetsSubmenu();
  }

  private initializeAnimatedLogo(): void {
    // Wait a bit for the DOM to be ready
    setTimeout(() => {
      const logoImg = document.getElementById('navbar-logo') as HTMLImageElement;
      if (!logoImg) return;

      // Wait for the SVG image to load
      logoImg.addEventListener('load', () => {
        this.setupPupilAnimation(logoImg);
      });

      // If already loaded
      if (logoImg.complete) {
        this.setupPupilAnimation(logoImg);
      }
    }, 100);
  }

  private setupPupilAnimation(logoImg: HTMLImageElement): void {
    // Since we can't directly manipulate SVG elements when loaded as an img,
    // we'll replace the img with an inline SVG for animation
    fetch('/Graphbot-animated.svg')
      .then(response => response.text())
      .then(svgText => {
        // Create a container div
        const container = document.createElement('div');
        container.className = 'navbar-logo-container';
        container.innerHTML = svgText;
        
        // Replace the img with the inline SVG
        logoImg.parentNode?.replaceChild(container, logoImg);
        
        // Now we can animate the pupils and blinking
        this.animatePupils(container);
        this.animateBlinking(container);
      })
      .catch(console.error);
  }

  private animatePupils(container: HTMLElement): void {
    const svg = container.querySelector('svg');
    const leftPupil = container.querySelector('#pupil_left') as SVGCircleElement;
    const rightPupil = container.querySelector('#pupil_right') as SVGCircleElement;
    
    if (!svg || !leftPupil || !rightPupil) return;

    // Configuration - set to false to always show inactivity animation for testing
    const followCursor = true; // Change to false to test inactivity animation immediately
    
    // SVG coordinates for eye centers and movement constraints
    const leftEyeCenter = { x: 140, y: 289.5 };
    const rightEyeCenter = { x: 369, y: 289.5 };
    const maxMovementRadius = 48; // Slightly less than the full radius for better look

    // Remove any existing transitions for instant movement
    leftPupil.style.transition = 'none';
    rightPupil.style.transition = 'none';

    let animationFrameId: number;
    let inactivityTimer: number;
    let isIdle = false;
    let idleAnimationId: number;

    const setPupilPosition = (leftX: number, leftY: number, rightX: number, rightY: number, smooth = false) => {
      if (smooth) {
        leftPupil.style.transition = 'cx 0.4s ease-out, cy 0.4s ease-out';
        rightPupil.style.transition = 'cx 0.4s ease-out, cy 0.4s ease-out';
      } else {
        leftPupil.style.transition = 'none';
        rightPupil.style.transition = 'none';
      }
      
      leftPupil.setAttribute('cx', leftX.toString());
      leftPupil.setAttribute('cy', leftY.toString());
      rightPupil.setAttribute('cx', rightX.toString());
      rightPupil.setAttribute('cy', rightY.toString());
    };

    const startIdleAnimation = () => {
      isIdle = true;
      
      const performIdleLook = () => {
        if (!isIdle) return;
        
        // 10% chance to squint (different directions), 90% chance to look together
        const shouldSquint = Math.random() < 0.1;
        
        if (shouldSquint) {
          // Squint - pupils look in different directions
          const leftAngle = Math.random() * Math.PI * 2;
          const rightAngle = Math.random() * Math.PI * 2;
          const leftDistance = Math.random() * maxMovementRadius * 0.7;
          const rightDistance = Math.random() * maxMovementRadius * 0.7;
          
          const leftNewX = leftEyeCenter.x + Math.cos(leftAngle) * leftDistance;
          const leftNewY = leftEyeCenter.y + Math.sin(leftAngle) * leftDistance;
          const rightNewX = rightEyeCenter.x + Math.cos(rightAngle) * rightDistance;
          const rightNewY = rightEyeCenter.y + Math.sin(rightAngle) * rightDistance;
          
          setPupilPosition(leftNewX, leftNewY, rightNewX, rightNewY, true);
        } else {
          // Look together - both pupils in same direction
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * maxMovementRadius * 0.8;
          
          const leftNewX = leftEyeCenter.x + Math.cos(angle) * distance;
          const leftNewY = leftEyeCenter.y + Math.sin(angle) * distance;
          const rightNewX = rightEyeCenter.x + Math.cos(angle) * distance;
          const rightNewY = rightEyeCenter.y + Math.sin(angle) * distance;
          
          setPupilPosition(leftNewX, leftNewY, rightNewX, rightNewY, true);
        }
        
        // Schedule next idle look (2-5 seconds)
        const nextLookDelay = Math.random() * 3000 + 1000;
        idleAnimationId = setTimeout(performIdleLook, nextLookDelay);
      };
      
      // Start first idle look
      performIdleLook();
    };

    const stopIdleAnimation = () => {
      isIdle = false;
      if (idleAnimationId) {
        clearTimeout(idleAnimationId);
      }
    };

    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      if (isIdle) {
        stopIdleAnimation();
      }
      
      // Set timer for 30 seconds of inactivity
      inactivityTimer = setTimeout(() => {
        startIdleAnimation();
      }, 30000);
    };

    const updatePupilPositions = (e: MouseEvent) => {
      if (!followCursor) return; // Skip if testing inactivity mode
      
      // Cancel any pending animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Reset inactivity timer
      resetInactivityTimer();

      // Use requestAnimationFrame for smooth, real-time updates
      animationFrameId = requestAnimationFrame(() => {
        const rect = svg.getBoundingClientRect();
        const svgX = (e.clientX - rect.left) * (505 / rect.width);
        const svgY = (e.clientY - rect.top) * (538 / rect.height);

        // Calculate left pupil position
        const leftDx = svgX - leftEyeCenter.x;
        const leftDy = svgY - leftEyeCenter.y;
        const leftDistance = Math.sqrt(leftDx * leftDx + leftDy * leftDy);
        
        let leftNewX = leftEyeCenter.x;
        let leftNewY = leftEyeCenter.y;
        
        if (leftDistance > 0) {
          const leftConstrainedDistance = Math.min(leftDistance, maxMovementRadius);
          const leftRatio = leftConstrainedDistance / leftDistance;
          leftNewX = leftEyeCenter.x + leftDx * leftRatio;
          leftNewY = leftEyeCenter.y + leftDy * leftRatio;
        }

        // Calculate right pupil position
        const rightDx = svgX - rightEyeCenter.x;
        const rightDy = svgY - rightEyeCenter.y;
        const rightDistance = Math.sqrt(rightDx * rightDx + rightDy * rightDy);
        
        let rightNewX = rightEyeCenter.x;
        let rightNewY = rightEyeCenter.y;
        
        if (rightDistance > 0) {
          const rightConstrainedDistance = Math.min(rightDistance, maxMovementRadius);
          const rightRatio = rightConstrainedDistance / rightDistance;
          rightNewX = rightEyeCenter.x + rightDx * rightRatio;
          rightNewY = rightEyeCenter.y + rightDy * rightRatio;
        }

        // Apply positions instantly (no transitions)
        setPupilPosition(leftNewX, leftNewY, rightNewX, rightNewY, false);
      });
    };

    // Add event listener to track mouse movement
    document.addEventListener('mousemove', updatePupilPositions);
    
    // Initialize behavior based on followCursor setting
    if (followCursor) {
      // Start with normal cursor following and inactivity timer
      resetInactivityTimer();
    } else {
      // Start with inactivity animation immediately for testing
      startIdleAnimation();
    }
  }

  private animateBlinking(container: HTMLElement): void {
    const eyelids = container.querySelector('#eyelids') as SVGRectElement;
    
    if (!eyelids) return;

    // Original eyelid dimensions
    const originalHeight = 10;
    
    // Expansion dimensions (from eyelids_expansion_range)
    const expandedHeight = 157;
    
    const performBlink = () => {
      // Remove any existing transitions for instant control
      eyelids.style.transition = 'none';
      
      // Animate closing (expand down)
      let startTime: number;
      const closeDuration = 70; // ms - quick close
      
      const closeAnimation = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / closeDuration, 1);
        
        // Eased animation for natural blink
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const currentHeight = originalHeight + (expandedHeight - originalHeight) * easeOut;
        eyelids.setAttribute('height', currentHeight.toString());
        
        if (progress < 1) {
          requestAnimationFrame(closeAnimation);
        } else {
          // Start opening animation immediately
          setTimeout(() => {
            let openStartTime: number;
            const openDuration = 120; // ms - slightly slower open
            
            const openAnimation = (timestamp: number) => {
              if (!openStartTime) openStartTime = timestamp;
              const elapsed = timestamp - openStartTime;
              const progress = Math.min(elapsed / openDuration, 1);
              
              // Eased animation for natural blink
              const easeIn = Math.pow(progress, 2);
              
              const currentHeight = expandedHeight - (expandedHeight - originalHeight) * easeIn;
              eyelids.setAttribute('height', currentHeight.toString());
              
              if (progress < 1) {
                requestAnimationFrame(openAnimation);
              } else {
                // Schedule next blink
                scheduleNextBlink();
              }
            };
            
            requestAnimationFrame(openAnimation);
          }, 20); // Very brief pause between close and open
        }
      };
      
      requestAnimationFrame(closeAnimation);
    };
    
    const scheduleNextBlink = () => {
      // Random interval between 2-8 seconds
      const minInterval = 500;
      const maxInterval = 8000;
      const nextBlinkDelay = Math.random() * (maxInterval - minInterval) + minInterval;
      
      setTimeout(performBlink, nextBlinkDelay);
    };
    
    // Start the blinking cycle after initial delay
    scheduleNextBlink();
  }

  private updateLayoutPresetsSubmenu(): void {
    const presetNames = this.layoutPresetManager.getPresetNames();
    this.uiManager.updateLayoutPresetsSubmenu(presetNames);
  }

  private setupStateManagementListeners(): void {
    // Listen for keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+S for manual save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.handleManualSave();
      }
      
      // Ctrl+Shift+L for load
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        this.handleManualLoad();
      }
      
      // Ctrl+Shift+R for reset
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        this.handleResetState();
      }
    });

    // Add click listeners to navbar menu items
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.dataset.action === 'save-state') {
        e.preventDefault();
        this.handleManualSave();
      } else if (target.dataset.action === 'load-state') {
        e.preventDefault();
        this.handleManualLoad();
      } else if (target.dataset.action === 'clear-state') {
        e.preventDefault();
        this.handleClearState();
      } else if (target.dataset.action === 'reset-state') {
        e.preventDefault();
        this.handleResetState();
      } else if (target.dataset.action === 'export-state') {
        e.preventDefault();
        this.handleExportState();
      } else if (target.dataset.action === 'import-state') {
        e.preventDefault();
        this.handleImportState();
      } else if (target.dataset.action === 'save-layout-preset') {
        e.preventDefault();
        this.handleShowSaveLayoutPresetDialog();
      } else if (target.dataset.action === 'load-layout-preset' && target.dataset.presetName) {
        e.preventDefault();
        this.handleLoadLayoutPreset(target.dataset.presetName);
      } else if (target.dataset.action === 'delete-layout-preset' && target.dataset.presetName) {
        e.preventDefault();
        e.stopPropagation(); // Prevent triggering the load action
        this.handleDeleteLayoutPreset(target.dataset.presetName);
      } else {
        // Check if the click is inside a submenu item (for preset loading)
        const submenuItem = target.closest('.submenu-item') as HTMLElement;
        if (submenuItem && submenuItem.dataset.action === 'load-layout-preset' && submenuItem.dataset.presetName) {
          // Make sure it's not a delete button click
          if (!target.classList.contains('preset-delete')) {
            e.preventDefault();
            this.handleLoadLayoutPreset(submenuItem.dataset.presetName);
          }
        }
      }
    });
  }

  private handleShowSaveLayoutPresetDialog(): void {
    this.uiManager.showLayoutPresetDialog();
  }

  private handleSaveLayoutPreset(name: string): void {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) {
      this.showNotification('No active tab to save', 'error');
      return;
    }

    try {
      this.layoutPresetManager.saveLayoutPreset(name, activeTab.rootPane);
      this.updateLayoutPresetsSubmenu();
      this.showNotification(`Layout preset "${name}" saved!`, 'success');
    } catch (error) {
      this.showNotification('Failed to save layout preset', 'error');
    }
  }

  private handleLoadLayoutPreset(presetName: string): void {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) {
      this.showNotification('No active tab to apply preset to', 'error');
      return;
    }

    const presetLayout = this.layoutPresetManager.loadLayoutPreset(presetName);
    if (!presetLayout) {
      this.showNotification(`Preset "${presetName}" not found`, 'error');
      return;
    }

    // Replace the current tab's layout with the preset
    activeTab.rootPane = presetLayout;
    this.tabManager.updateTabRootPane(activeTab.id, presetLayout);
    
    // Clear the window cache to force re-creation of windows
    this.windowElementCache.clear();
    
    this.render();
    this.showNotification(`Layout preset "${presetName}" loaded!`, 'success');
  }

  private handleDeleteLayoutPreset(presetName: string): void {
    if (confirm(`Delete layout preset "${presetName}"? This cannot be undone.`)) {
      const success = this.layoutPresetManager.deletePreset(presetName);
      if (success) {
        this.updateLayoutPresetsSubmenu();
        this.showNotification(`Layout preset "${presetName}" deleted`, 'success');
      } else {
        this.showNotification('Failed to delete preset', 'error');
      }
    }
  }

  private handleManualSave(): void {
    const success = this.stateManager.saveState();
    this.showNotification(success ? 'State saved successfully!' : 'Failed to save state', success ? 'success' : 'error');
  }

  private handleManualLoad(): void {
    const stateInfo = this.stateManager.getStateInfo();
    if (!stateInfo) {
      this.showNotification('No saved state found', 'warning');
      return;
    }

    const confirmMessage = `Load saved state from ${new Date(stateInfo.timestamp).toLocaleString()}?\nThis will replace your current layout with ${stateInfo.tabCount} tab(s).`;
    
    if (confirm(confirmMessage)) {
      const success = this.stateManager.loadState();
      if (success) {
        this.render();
        this.showNotification('State loaded successfully!', 'success');
      } else {
        this.showNotification('Failed to load state', 'error');
      }
    }
  }

  private handleResetState(): void {
    // Clear current state without confirmation
    const currentTabs = this.tabManager.getTabs();
    currentTabs.forEach(tab => {
      if (currentTabs.length > 1) {
        this.tabManager.closeTab(tab.id);
      }
    });
    
    // Create default tab
    this.tabManager.initializeWithDefaultTab();
    
    // Clear window cache
    this.windowElementCache.clear();
    
    this.render();
    this.showNotification('Layout reset to default', 'success');
  }

  private handleClearState(): void {
    if (confirm('Clear all saved state? This cannot be undone.')) {
      this.stateManager.clearSavedState();
      this.showNotification('Saved state cleared', 'success');
    }
  }

  private handleExportState(): void {
    const success = this.stateManager.saveState();
    if (!success) {
      this.showNotification('Failed to save current state', 'error');
      return;
    }

    const stateData = localStorage.getItem('graphstudio_state');
    const windowData = localStorage.getItem('graphstudio_state_windows');
    
    const exportData = {
      main: stateData ? JSON.parse(stateData) : null,
      windows: windowData ? JSON.parse(windowData) : null,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphstudio-state-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showNotification('State exported successfully!', 'success');
  }

  private handleImportState(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string);
          
          if (importData.main) {
            localStorage.setItem('graphstudio_state', JSON.stringify(importData.main));
          }
          if (importData.windows) {
            localStorage.setItem('graphstudio_state_windows', JSON.stringify(importData.windows));
          }
          
          if (confirm('State imported successfully! Load the imported state now?')) {
            const success = this.stateManager.loadState();
            if (success) {
              this.render();
              this.showNotification('Imported state loaded successfully!', 'success');
            }
          }
        } catch (error) {
          this.showNotification('Failed to import state - invalid file format', 'error');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
      color: white;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => {
        notification.remove();
        style.remove();
      }, 300);
    }, 3000);
  }

  private handleTabSwitch(tabId: string): void {
    this.tabManager.setActiveTab(tabId);
    this.render();
  }

  private handleTabClose(tabId: string): void {
    if (this.tabManager.closeTab(tabId)) {
      // Clean up cached elements for windows that might no longer exist
      this.cleanupUnusedWindowElements();
      this.render();
    }
  }

  private handleNewTab(): void {
    this.tabManager.createNewTab();
    this.render();
  }

  private cleanupUnusedWindowElements(): void {
    // Get all window IDs that are still in use across all tabs
    const allTabs = this.tabManager.getTabs();
    const usedWindowIds = new Set<string>();
    
    const collectWindowIds = (pane: SplitPane) => {
      if (pane.type === 'window' && pane.window) {
        usedWindowIds.add(pane.window.id);
      } else if (pane.children) {
        pane.children.forEach(collectWindowIds);
      }
    };
    
    allTabs.forEach(tab => collectWindowIds(tab.rootPane));
    
    // Remove cached elements that are no longer used
    for (const [windowId, element] of this.windowElementCache.entries()) {
      if (!usedWindowIds.has(windowId)) {
        element.remove(); // Remove from DOM if it's still there
        this.windowElementCache.delete(windowId);
      }
    }
  }

  private render() {
    // Render tab bar
    const tabs = this.tabManager.getTabs();
    this.uiManager.renderTabBar(tabs);
    
    // Render active tab content
    const activeRootPane = this.tabManager.getActiveRootPane();
    if (activeRootPane) {
      // Instead of clearing innerHTML, we'll smartly update the container
      this.updateMainContainer(activeRootPane);
    }
  }

  private updateMainContainer(rootPane: SplitPane): void {
    // Clear the container but preserve our cached elements
    this.mainContainer.innerHTML = '';
    
    // Render the new layout
    const element = this.renderPane(rootPane);
    this.mainContainer.appendChild(element);
  }

  private renderPane(pane: SplitPane): HTMLElement {
    if (pane.type === 'window') {
      return this.renderWindow(pane.window!);
    } else {
      return this.windowManager.renderSplit(pane, (p) => this.renderPane(p));
    }
  }

  private renderWindow(window: WindowConfig): HTMLElement {
    // Check if we already have a cached element for this window
    const cachedElement = this.windowElementCache.get(window.id);
    
    if (cachedElement) {
      // Update the window header in case the type changed
      this.updateWindowHeader(cachedElement, window);
      return cachedElement;
    }
    
    // Create new element only if not cached
    const windowEl = this.createWindowElement(window);
    
    // Cache the element
    this.windowElementCache.set(window.id, windowEl);
    
    return windowEl;
  }

  private updateWindowHeader(windowEl: HTMLElement, window: WindowConfig): void {
    // Update the dropdown trigger text if the window type changed
    const dropdownTrigger = windowEl.querySelector('.custom-dropdown-trigger');
    const windowTypes = this.windowManager.getWindowTypes();
    
    if (dropdownTrigger) {
      dropdownTrigger.textContent = windowTypes[window.type as keyof typeof windowTypes].title;
    }
    
    // Update selected state in dropdown menu
    const dropdownItems = windowEl.querySelectorAll('.custom-dropdown-item');
    dropdownItems.forEach(item => {
      const value = item.getAttribute('data-value');
      if (value === window.type) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  private createWindowElement(window: WindowConfig): HTMLElement {
    const windowEl = document.createElement('div');
    windowEl.className = 'window';
    windowEl.setAttribute('data-window-id', window.id);
    windowEl.setAttribute('data-window-type', window.type);
    
    // Generate dropdown options
    const windowTypes = this.windowManager.getWindowTypes();
    
    windowEl.innerHTML = `
      <div class="window-header">
        <div class="window-title-container">
          <div class="custom-dropdown" data-window-id="${window.id}">
            <button class="custom-dropdown-trigger">
              ${windowTypes[window.type as keyof typeof windowTypes].title}
            </button>
            <div class="custom-dropdown-menu">
              ${Object.entries(windowTypes)
                .map(([key, config]) => 
                  `<a href="#" class="custom-dropdown-item ${key === window.type ? 'selected' : ''}" data-value="${key}">${config.title}</a>`
                ).join('')}
            </div>
          </div>
        </div>
        <div class="window-controls">
          <button class="window-control close" data-action="close" data-window-id="${window.id}" title="Close">×</button>
        </div>
      </div>
      <div class="window-content">
        ${window.content || this.contentManager.getContentForType('')}
      </div>
      <div class="split-buttons">
        <button class="split-button top" data-action="split-top" data-window-id="${window.id}" title="Split Top">+</button>
        <button class="split-button right" data-action="split-right" data-window-id="${window.id}" title="Split Right">+</button>
        <button class="split-button bottom" data-action="split-bottom" data-window-id="${window.id}" title="Split Bottom">+</button>
        <button class="split-button left" data-action="split-left" data-window-id="${window.id}" title="Split Left">+</button>
      </div>
    `;

    // Add event listeners for all controls (close + split buttons)
    const allControls = windowEl.querySelectorAll('[data-action]');
    allControls.forEach(control => {
      control.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = (control as HTMLElement).dataset.action;
        const windowId = (control as HTMLElement).dataset.windowId;
        
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab) {
          this.windowManager.handleWindowAction(action!, windowId!, activeTab.rootPane, () => {
            // Clean up cache if a window was closed
            if (action === 'close') {
              this.windowElementCache.delete(windowId!);
            }
            // Update the tab's root pane after the action
            this.tabManager.updateTabRootPane(activeTab.id, activeTab.rootPane);
            this.render();
          });
        }
      });
    });

    // Add event listeners for custom dropdown
    const customDropdown = windowEl.querySelector('.custom-dropdown');
    const dropdownTrigger = windowEl.querySelector('.custom-dropdown-trigger');
    const dropdownItems = windowEl.querySelectorAll('.custom-dropdown-item');
    
    if (customDropdown && dropdownTrigger) {
      // Toggle dropdown on trigger click
      dropdownTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        customDropdown.classList.toggle('open');
      });
      
      // Handle dropdown item clicks
      dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const newType = (e.target as HTMLElement).getAttribute('data-value');
          if (newType) {
            const windowId = customDropdown.getAttribute('data-window-id')!;
            const activeTab = this.tabManager.getActiveTab();
            if (activeTab) {
              // Remove old cached element since content will change
              this.windowElementCache.delete(windowId);
              
              this.windowManager.changeWindowType(windowId, newType, activeTab.rootPane, () => {
                this.tabManager.updateTabRootPane(activeTab.id, activeTab.rootPane);
                this.render();
              });
            }
            customDropdown.classList.remove('open');
          }
        });
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!customDropdown.contains(e.target as Node)) {
          customDropdown.classList.remove('open');
        }
      });
    }

    // Initialize Graph Creator specific controls if this is a graph creator window
    if (window.type === 'graph-creator') {
      setTimeout(() => this.uiManager.initializeGraphCreatorControls(windowEl), 0);
    }

    return windowEl;
  }
}

// Initialize the application
new GraphStudio();
