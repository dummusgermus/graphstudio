import { GraphManager } from './GraphManager';
import type { Tab } from './TabManager';

export class UIManager {
  private graphManager: GraphManager;

  constructor(graphManager: GraphManager) {
    this.graphManager = graphManager;
  }

  createAppLayout(): string {
    return `
      <div class="navbar">
        <div class="navbar-brand">
          <img src="/Graphbot-animated.svg" alt="GraphStudio" class="navbar-logo" id="navbar-logo" />
        </div>
        <ul class="navbar-menu">
          <li class="navbar-item">
            <a href="#" class="navbar-link">File</a>
            <div class="dropdown">
              <a href="#" data-action="save-state">Save Layout (Ctrl+S)</a>
              <a href="#" data-action="load-state">Load Layout (Ctrl+Shift+L)</a>
              <div class="dropdown-separator"></div>
              <a href="#" data-action="export-state">Export Layout</a>
              <a href="#" data-action="import-state">Import Layout</a>
              <div class="dropdown-separator"></div>
              <a href="#">New Graph</a>
              <a href="#">Open Graph</a>
              <a href="#">Save Graph</a>
              <div class="dropdown-separator"></div>
              <a href="#" data-action="clear-state" style="color: #ef4444;">Clear Saved Layout</a>
            </div>
          </li>
          <li class="navbar-item">
            <a href="#" class="navbar-link">Edit</a>
            <div class="dropdown">
              <a href="#">Undo</a>
              <a href="#">Redo</a>
              <a href="#">Cut</a>
              <a href="#">Copy</a>
              <a href="#">Paste</a>
              <a href="#">Select All</a>
            </div>
          </li>
          <li class="navbar-item">
            <a href="#" class="navbar-link">View</a>
            <div class="dropdown">
              <a href="#" data-action="save-layout-preset">Save Layout Preset...</a>
              <div class="load-layout-preset-trigger" data-action="load-layout-preset">
                <span>Load Layout Preset</span>
                <span class="submenu-arrow">▶</span>
                <div class="submenu" id="layout-presets-submenu">
                  <div class="submenu-content" id="layout-presets-list">
                    <div class="submenu-item submenu-placeholder">No saved presets</div>
                  </div>
                </div>
              </div>
              <div class="dropdown-separator"></div>
              <a href="#" data-action="reset-state">Reset Layout (Ctrl+Shift+R)</a>
              <div class="dropdown-separator"></div>
              <a href="#">Zoom In</a>
              <a href="#">Zoom Out</a>
              <a href="#">Fit to Screen</a>
              <a href="#">Toggle Grid</a>
              <a href="#">Toggle Dark Mode</a>
            </div>
          </li>
          <li class="navbar-item">
            <a href="#" class="navbar-link">Graph</a>
            <div class="dropdown">
              <a href="#">Add Node</a>
              <a href="#">Add Edge</a>
              <a href="#">Delete Selected</a>
              <a href="#">Graph Properties</a>
              <a href="#">Generate Random</a>
            </div>
          </li>
          <li class="navbar-item">
            <a href="#" class="navbar-link">Algorithms</a>
            <div class="dropdown">
              <a href="#">Breadth-First Search</a>
              <a href="#">Depth-First Search</a>
              <a href="#">Dijkstra's Algorithm</a>
              <a href="#">A* Search</a>
              <a href="#">Minimum Spanning Tree</a>
              <a href="#">Topological Sort</a>
            </div>
          </li>
          <li class="navbar-item">
            <a href="#" class="navbar-link">Tools</a>
            <div class="dropdown">
              <a href="#">Performance Analysis</a>
              <a href="#">Graph Statistics</a>
              <a href="#">Benchmark</a>
              <a href="#">Debug Console</a>
            </div>
          </li>
          <li class="navbar-item">
            <a href="#" class="navbar-link">Help</a>
            <div class="dropdown">
              <a href="#">Documentation</a>
              <a href="#">Tutorials</a>
              <a href="#">Keyboard Shortcuts</a>
              <a href="#">About</a>
            </div>
          </li>
        </ul>
        <button class="theme-toggle" id="theme-toggle" title="Toggle theme"></button>
      </div>
      <div class="tab-bar" id="tab-bar">
        <div class="tabs-container" id="tabs-container"></div>
        <button class="new-tab-button" id="new-tab-button" title="New tab">+</button>
      </div>
      <div class="main-container">
        <div class="window-container" id="main-container"></div>
      </div>
      
      <!-- Layout Preset Dialog -->
      <div class="dialog-overlay" id="layout-preset-dialog-overlay" style="display: none;">
        <div class="dialog">
          <div class="dialog-header">
            <h3>Save Layout Preset</h3>
            <button class="dialog-close" id="layout-preset-dialog-close">×</button>
          </div>
          <div class="dialog-body">
            <label for="preset-name-input">Preset Name:</label>
            <input type="text" id="preset-name-input" placeholder="Enter preset name..." maxlength="50">
            <div class="dialog-hint">Choose a descriptive name for your layout preset</div>
          </div>
          <div class="dialog-footer">
            <button class="dialog-button dialog-button-secondary" id="layout-preset-cancel">Cancel</button>
            <button class="dialog-button dialog-button-primary" id="layout-preset-save">Save Preset</button>
          </div>
        </div>
      </div>
    `;
  }

  updateLayoutPresetsSubmenu(presetNames: string[]): void {
    const submenuList = document.getElementById('layout-presets-list');
    if (!submenuList) return;

    if (presetNames.length === 0) {
      submenuList.innerHTML = '<div class="submenu-item submenu-placeholder">No saved presets</div>';
    } else {
      submenuList.innerHTML = presetNames.map(name => `
        <div class="submenu-item" data-action="load-layout-preset" data-preset-name="${name}">
          <span class="preset-name">${name}</span>
          <button class="preset-delete" data-action="delete-layout-preset" data-preset-name="${name}" title="Delete preset">×</button>
        </div>
      `).join('');
    }
  }

  setupLayoutPresetDialog(
    onSave: (name: string) => void,
    onCancel: () => void
  ): void {
    const overlay = document.getElementById('layout-preset-dialog-overlay');
    const closeBtn = document.getElementById('layout-preset-dialog-close');
    const cancelBtn = document.getElementById('layout-preset-cancel');
    const saveBtn = document.getElementById('layout-preset-save');
    const input = document.getElementById('preset-name-input') as HTMLInputElement;

    const closeDialog = () => {
      if (overlay) overlay.style.display = 'none';
      if (input) input.value = '';
      onCancel();
    };

    const savePreset = () => {
      const name = input?.value.trim();
      if (name) {
        onSave(name);
        closeDialog();
      }
    };

    if (closeBtn) closeBtn.addEventListener('click', closeDialog);
    if (cancelBtn) cancelBtn.addEventListener('click', closeDialog);
    if (saveBtn) saveBtn.addEventListener('click', savePreset);
    
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          savePreset();
        } else if (e.key === 'Escape') {
          closeDialog();
        }
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDialog();
      });
    }
  }

  showLayoutPresetDialog(): void {
    const overlay = document.getElementById('layout-preset-dialog-overlay');
    const input = document.getElementById('preset-name-input') as HTMLInputElement;
    
    if (overlay) overlay.style.display = 'flex';
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  renderTabBar(tabs: Tab[]): void {
    const tabsContainer = document.getElementById('tabs-container');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = tabs.map(tab => `
      <button class="tab ${tab.isActive ? 'active' : ''}" data-tab-id="${tab.id}">
        <span class="tab-title">${tab.title}</span>
        <button class="tab-close" data-tab-id="${tab.id}" title="Close tab">×</button>
      </button>
    `).join('');
  }

  setupTabEventListeners(onTabSwitch: (tabId: string) => void, onTabClose: (tabId: string) => void, onNewTab: () => void): void {
    const tabsContainer = document.getElementById('tabs-container');
    const newTabButton = document.getElementById('new-tab-button');

    // Handle tab clicks and close button clicks
    if (tabsContainer) {
      tabsContainer.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        
        if (target.classList.contains('tab-close')) {
          e.stopPropagation();
          const tabId = target.dataset.tabId;
          if (tabId) {
            onTabClose(tabId);
          }
        } else if (target.classList.contains('tab') || target.closest('.tab')) {
          const tabElement = target.classList.contains('tab') ? target : target.closest('.tab');
          const tabId = (tabElement as HTMLElement)?.dataset.tabId;
          if (tabId) {
            onTabSwitch(tabId);
          }
        }
      });
    }

    // Handle new tab button
    if (newTabButton) {
      newTabButton.addEventListener('click', onNewTab);
    }

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+T for new tab
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        onNewTab();
      }
      
      // Ctrl+W for close tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        const activeTab = document.querySelector('.tab.active') as HTMLElement;
        const tabId = activeTab?.dataset.tabId;
        if (tabId) {
          onTabClose(tabId);
        }
      }

      // Ctrl+Tab and Ctrl+Shift+Tab for tab navigation
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault();
        const tabs = Array.from(document.querySelectorAll('.tab')) as HTMLElement[];
        const activeIndex = tabs.findIndex(tab => tab.classList.contains('active'));
        
        if (activeIndex !== -1) {
          let nextIndex;
          if (e.shiftKey) {
            // Previous tab
            nextIndex = activeIndex > 0 ? activeIndex - 1 : tabs.length - 1;
          } else {
            // Next tab
            nextIndex = activeIndex < tabs.length - 1 ? activeIndex + 1 : 0;
          }
          
          const nextTabId = tabs[nextIndex]?.dataset.tabId;
          if (nextTabId) {
            onTabSwitch(nextTabId);
          }
        }
      }
    });
  }

  initializeGraphCreatorControls(windowEl: HTMLElement) {
    const graphCanvas = windowEl.querySelector('#graph-canvas') as HTMLElement;
    const controlsPanel = windowEl.querySelector('#controls-panel') as HTMLElement;
    const panelToggle = windowEl.querySelector('#panel-toggle') as HTMLButtonElement;
    
    // Panel toggle functionality
    const persistentToggle = windowEl.querySelector('#sidebar-toggle-persistent') as HTMLButtonElement;
    
    const togglePanel = () => {
      controlsPanel.classList.toggle('collapsed');
      // Adjust graph canvas area based on sidebar state
      this.graphManager.adjustGraphCanvasLayout(graphCanvas, controlsPanel);
    };
    
    if (panelToggle && controlsPanel) {
      panelToggle.addEventListener('click', togglePanel);
    }
    
    if (persistentToggle && controlsPanel) {
      persistentToggle.addEventListener('click', togglePanel);
    }

    // Nodes controls
    const nodesSlider = windowEl.querySelector('#nodes-slider') as HTMLInputElement;
    const nodesInput = windowEl.querySelector('#nodes-input') as HTMLInputElement;
    const nodesValue = windowEl.querySelector('#nodes-value') as HTMLElement;

    // Density controls
    const densitySlider = windowEl.querySelector('#density-slider') as HTMLInputElement;
    const densityInput = windowEl.querySelector('#density-input') as HTMLInputElement;
    const densityValue = windowEl.querySelector('#density-value') as HTMLElement;

    // Weight controls
    const weightControls = windowEl.querySelector('#weight-controls') as HTMLElement;
    const minWeightInput = windowEl.querySelector('#min-weight') as HTMLInputElement;
    const maxWeightInput = windowEl.querySelector('#max-weight') as HTMLInputElement;

    // Nodes slider and input synchronization
    if (nodesSlider && nodesInput && nodesValue) {
      const updateNodesValue = () => {
        // Always read from the input field to ensure accuracy
        const currentValue = nodesInput.value || nodesSlider.value;
        nodesValue.textContent = currentValue;
        console.log('Nodes display updated to:', currentValue);
        this.graphManager.updateGraphStats();
      };

      // Initialize display value to match current input value (with delay to ensure DOM is ready)
      setTimeout(() => {
        const currentValue = nodesInput.value || nodesSlider.value;
        nodesSlider.value = currentValue;
        nodesInput.value = currentValue;
        updateNodesValue();
      }, 100);

      nodesSlider.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        nodesInput.value = value;
        updateNodesValue();
      });

      nodesInput.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
          nodesSlider.value = value;
          updateNodesValue();
        }
      });

      // Validate input on blur and ensure display is updated
      nodesInput.addEventListener('blur', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        if (isNaN(value) || value < 1 || value > 100) {
          const currentValue = nodesSlider.value;
          nodesInput.value = currentValue;
          updateNodesValue();
        } else {
          // Ensure display value matches the valid input
          nodesSlider.value = value.toString();
          updateNodesValue();
        }
      });

      // Force immediate update
      setTimeout(() => updateNodesValue(), 10);
    }

    // Density slider and input synchronization
    if (densitySlider && densityInput && densityValue) {
      const updateDensityValue = () => {
        // Always read from the input field to ensure accuracy
        const currentValue = densityInput.value || densitySlider.value;
        const numValue = parseFloat(currentValue);
        densityValue.textContent = numValue.toFixed(2);
        console.log('Density display updated to:', numValue.toFixed(2));
        this.graphManager.updateGraphStats();
      };

      // Initialize display value to match current input value (with delay to ensure DOM is ready)
      setTimeout(() => {
        const currentValue = densityInput.value || densitySlider.value;
        densitySlider.value = currentValue;
        densityInput.value = currentValue;
        updateDensityValue();
      }, 100);

      densitySlider.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        densityInput.value = value;
        updateDensityValue();
      });

      densityInput.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
          densitySlider.value = value;
          updateDensityValue();
        }
      });

      // Validate input on blur and ensure display is updated
      densityInput.addEventListener('blur', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        if (isNaN(value) || value < 0 || value > 1) {
          const currentValue = densitySlider.value;
          densityInput.value = currentValue;
          updateDensityValue();
        } else {
          // Ensure display value matches the valid input
          densitySlider.value = value.toString();
          updateDensityValue();
        }
      });

      // Force immediate update
      setTimeout(() => updateDensityValue(), 10);
    }

    // Weight range validation
    if (minWeightInput && maxWeightInput) {
      const validateWeightRange = () => {
        const minValue = parseFloat(minWeightInput.value);
        const maxValue = parseFloat(maxWeightInput.value);
        
        if (minValue >= maxValue) {
          // If min is greater than or equal to max, adjust max to be min + 0.1
          maxWeightInput.value = (minValue + 0.1).toFixed(1);
        }
      };

      minWeightInput.addEventListener('blur', validateWeightRange);
      maxWeightInput.addEventListener('blur', validateWeightRange);
    }

    // Toggle button functionality
    const toggleBtns = windowEl.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.getAttribute('data-group');
        const value = btn.getAttribute('data-value');
        
        if (group) {
          if (group === 'connectivity') {
            // Special handling for connectivity - buttons can be deactivated
            if (btn.classList.contains('active')) {
              // Deactivate the clicked button
              btn.classList.remove('active');
              if (value === 'disconnected' && disconnectedControls) {
                disconnectedControls.style.display = 'none';
              }
            } else {
              // Remove active class from all buttons in the connectivity group
              windowEl.querySelectorAll(`[data-group="connectivity"]`).forEach(groupBtn => {
                groupBtn.classList.remove('active');
              });
              // Add active class to clicked button
              btn.classList.add('active');
              
              // Handle disconnected controls visibility
              if (disconnectedControls) {
                if (value === 'disconnected') {
                  disconnectedControls.style.display = 'block';
                } else {
                  disconnectedControls.style.display = 'none';
                }
              }
            }
          } else {
            // Standard toggle behavior for other groups
            // Remove active class from all buttons in the same group
            windowEl.querySelectorAll(`[data-group="${group}"]`).forEach(groupBtn => {
              groupBtn.classList.remove('active');
            });
            // Add active class to clicked button
            btn.classList.add('active');

            // Handle weight controls visibility
            if (group === 'weight' && weightControls) {
              if (value === 'weighted') {
                weightControls.style.display = 'block';
              } else {
                weightControls.style.display = 'none';
              }
            }
          }
        }
      });
    });

    // Property button functionality
    const propertyBtns = windowEl.querySelectorAll('.property-btn');
    propertyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
      });
    });

    // Action buttons
    const generateBtn = windowEl.querySelector('#generate-graph') as HTMLButtonElement;

    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.graphManager.generateGraph(windowEl);
      });
    }

    // Canvas controls
    const resetViewBtn = windowEl.querySelector('#reset-view') as HTMLButtonElement;
    const fullscreenBtn = windowEl.querySelector('#fullscreen-toggle') as HTMLButtonElement;

    if (resetViewBtn) {
      resetViewBtn.addEventListener('click', () => {
        this.graphManager.resetGraphView();
      });
    }

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        this.graphManager.toggleFullscreen(graphCanvas);
      });
    }

    // Initialize 3D graph visualization
    this.graphManager.initializeGraphVisualization(graphCanvas);

    // Advanced settings - Connectivity controls
    const disconnectedControls = windowEl.querySelector('#disconnected-controls') as HTMLElement;
    const componentsSlider = windowEl.querySelector('#components-slider') as HTMLInputElement;
    const componentsInput = windowEl.querySelector('#components-input') as HTMLInputElement;
    const componentsValue = windowEl.querySelector('#components-value') as HTMLElement;

    // Note: Connectivity buttons are now handled by the general toggle button system above

    // Components slider and input synchronization
    if (componentsSlider && componentsInput && componentsValue) {
      const updateComponentsValue = () => {
        // Always read from the input field to ensure accuracy
        const currentValue = componentsInput.value || componentsSlider.value;
        componentsValue.textContent = currentValue;
      };

      // Initialize display value to match current input value (with delay to ensure DOM is ready)
      setTimeout(() => {
        const currentValue = componentsInput.value || componentsSlider.value;
        componentsSlider.value = currentValue;
        componentsInput.value = currentValue;
        updateComponentsValue();
      }, 0);

      componentsSlider.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        componentsInput.value = value;
        updateComponentsValue();
      });

      componentsInput.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        const numValue = parseInt(value);
        const maxComponents = parseInt(componentsSlider.max);
        
        if (!isNaN(numValue) && numValue >= 2 && numValue <= maxComponents) {
          componentsSlider.value = value;
          updateComponentsValue();
        }
      });

      // Validate input on blur
      componentsInput.addEventListener('blur', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        const maxComponents = parseInt(componentsSlider.max);
        
        if (isNaN(value) || value < 2 || value > maxComponents) {
          const currentValue = componentsSlider.value;
          componentsInput.value = currentValue;
          updateComponentsValue();
        } else {
          // Ensure display value matches the valid input
          componentsSlider.value = value.toString();
          updateComponentsValue();
        }
      });
    }

    // Update components max value when nodes change
    const updateComponentsMaxValue = () => {
      const nodeCount = parseInt(nodesSlider?.value || '20');
      
      if (componentsSlider && componentsInput) {
        const maxComponents = Math.min(nodeCount, 20); // Cap at 20 for UI reasons
        componentsSlider.max = maxComponents.toString();
        componentsInput.max = maxComponents.toString();
        
        // Adjust current value if it exceeds the new max
        const currentValue = parseInt(componentsSlider.value);
        if (currentValue > maxComponents) {
          componentsSlider.value = maxComponents.toString();
          componentsInput.value = maxComponents.toString();
          if (componentsValue) {
            componentsValue.textContent = maxComponents.toString();
          }
        }
      }
    };

    // Call initially and whenever nodes change
    updateComponentsMaxValue();
    if (nodesSlider) {
      nodesSlider.addEventListener('input', updateComponentsMaxValue);
    }
    if (nodesInput) {
      nodesInput.addEventListener('input', updateComponentsMaxValue);
    }

    // Initialize display values after everything is set up
    this.initializeDisplayValues(windowEl);
    
    // Add a recurring sync to ensure display values always match input values
    this.startDisplayValueSync(windowEl);
  }

  initializeDisplayValues(windowEl: HTMLElement) {
    // Force update all display values to match actual input values
    setTimeout(() => {
      // Trigger all the update functions to read from input fields
      const nodesSlider = windowEl.querySelector('#nodes-slider') as HTMLInputElement;
      const nodesInput = windowEl.querySelector('#nodes-input') as HTMLInputElement;
      const nodesValue = windowEl.querySelector('#nodes-value') as HTMLElement;
      
      if (nodesSlider && nodesInput && nodesValue) {
        const currentValue = nodesInput.value || nodesSlider.value;
        nodesSlider.value = currentValue;
        nodesInput.value = currentValue;
        nodesValue.textContent = currentValue;
        console.log('Init: Nodes set to:', currentValue, 'from input:', nodesInput.value, 'from slider:', nodesSlider.value);
      }

      const densitySlider = windowEl.querySelector('#density-slider') as HTMLInputElement;
      const densityInput = windowEl.querySelector('#density-input') as HTMLInputElement;
      const densityValue = windowEl.querySelector('#density-value') as HTMLElement;
      
      if (densitySlider && densityInput && densityValue) {
        const currentValue = densityInput.value || densitySlider.value;
        densitySlider.value = currentValue;
        densityInput.value = currentValue;
        const numValue = parseFloat(currentValue);
        densityValue.textContent = numValue.toFixed(2);
        console.log('Init: Density set to:', numValue.toFixed(2), 'from input:', densityInput.value, 'from slider:', densitySlider.value);
      }

      const componentsSlider = windowEl.querySelector('#components-slider') as HTMLInputElement;
      const componentsInput = windowEl.querySelector('#components-input') as HTMLInputElement;
      const componentsValue = windowEl.querySelector('#components-value') as HTMLElement;
      
      if (componentsSlider && componentsInput && componentsValue) {
        const currentValue = componentsInput.value || componentsSlider.value;
        componentsSlider.value = currentValue;
        componentsInput.value = currentValue;
        componentsValue.textContent = currentValue;
        console.log('Init: Components set to:', currentValue, 'from input:', componentsInput.value, 'from slider:', componentsSlider.value);
      }
    }, 200);

    // Also try immediate override
    setTimeout(() => {
      const nodesValue = windowEl.querySelector('#nodes-value') as HTMLElement;
      const nodesInput = windowEl.querySelector('#nodes-input') as HTMLInputElement;
      if (nodesValue && nodesInput && nodesInput.value) {
        nodesValue.textContent = nodesInput.value;
        console.log('Direct override: Nodes display set to:', nodesInput.value);
      }

      const densityValue = windowEl.querySelector('#density-value') as HTMLElement;
      const densityInput = windowEl.querySelector('#density-input') as HTMLInputElement;
      if (densityValue && densityInput && densityInput.value) {
        const numValue = parseFloat(densityInput.value);
        if (!isNaN(numValue)) {
          densityValue.textContent = numValue.toFixed(2);
          console.log('Direct override: Density display set to:', numValue.toFixed(2));
        }
      }

      const componentsValue = windowEl.querySelector('#components-value') as HTMLElement;
      const componentsInput = windowEl.querySelector('#components-input') as HTMLInputElement;
      if (componentsValue && componentsInput && componentsInput.value) {
        componentsValue.textContent = componentsInput.value;
        console.log('Direct override: Components display set to:', componentsInput.value);
      }
    }, 50);
  }

  startDisplayValueSync(windowEl: HTMLElement) {
    // Continuously sync display values with input field values
    const syncDisplayValues = () => {
      // Sync nodes
      const nodesInput = windowEl.querySelector('#nodes-input') as HTMLInputElement;
      const nodesValue = windowEl.querySelector('#nodes-value') as HTMLElement;
      if (nodesInput && nodesValue && nodesInput.value) {
        nodesValue.textContent = nodesInput.value;
      }

      // Sync density
      const densityInput = windowEl.querySelector('#density-input') as HTMLInputElement;
      const densityValue = windowEl.querySelector('#density-value') as HTMLElement;
      if (densityInput && densityValue && densityInput.value) {
        const numValue = parseFloat(densityInput.value);
        if (!isNaN(numValue)) {
          densityValue.textContent = numValue.toFixed(2);
        }
      }

      // Sync components
      const componentsInput = windowEl.querySelector('#components-input') as HTMLInputElement;
      const componentsValue = windowEl.querySelector('#components-value') as HTMLElement;
      if (componentsInput && componentsValue && componentsInput.value) {
        componentsValue.textContent = componentsInput.value;
      }
    };

    // Run sync immediately and then every 100ms
    syncDisplayValues();
    setInterval(syncDisplayValues, 100);
  }
} 