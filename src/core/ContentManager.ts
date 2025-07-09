export class ContentManager {
  public getContentForType(windowType: string): string {
    switch (windowType) {
      case 'welcome':
        return this.getWelcomeContent();
      case 'graph-creator':
        return this.getGraphCreatorContent();
      case 'algorithm-visualizer':
        return this.getAlgorithmVisualizerContent();
      case 'data-manager':
        return this.getDataManagerContent();
      case 'settings':
        return this.getSettingsContent();
      default:
        return this.getEmptyState();
    }
  }

  private getWelcomeContent(): string {
    return `
      <div class="welcome-content">
        <h2>Welcome to GraphStudio</h2>
        <p>GraphStudio is a powerful tool for academics to explore graph learning and algorithms.</p>
        
        <h3>Getting Started</h3>
        <ul>
          <li><strong>Split Windows:</strong> Use the + buttons at window edges to create new panes</li>
          <li><strong>Resize:</strong> Drag the borders between windows to adjust sizes</li>
          <li><strong>Close Windows:</strong> Click the × button in window headers</li>
          <li><strong>Toggle Theme:</strong> Use the sun/moon icon in the top-right corner</li>
        </ul>
        
        <h3>Features</h3>
        <ul>
          <li>Graph path finding algorithms</li>
          <li>Graph transformer architectures</li>
          <li>Interactive graph visualization</li>
          <li>Modular workspace design</li>
        </ul>
        
        <p><em>Start by exploring the Graph Creator on the right, or split this window to add more tools!</em></p>
      </div>
    `;
  }

  private getGraphCreatorContent(): string {
    return `
      <div class="graph-creator-container">
        <div class="graph-canvas-area" id="graph-canvas">
          <div class="canvas-overlay">
            <div class="canvas-controls">
              <button class="canvas-control-btn" id="reset-view" title="Reset View">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 4v6h6"/>
                  <path d="m1 10 3.4-3.4c1.6-1.6 4-1.6 5.6 0L12 8l2-2c1.6-1.6 4-1.6 5.6 0L22 8"/>
                  <path d="M23 20v-6h-6"/>
                  <path d="m23 14-3.4 3.4c-1.6 1.6-4 1.6-5.6 0L12 16l-2 2c-1.6 1.6-4 1.6-5.6 0L2 16"/>
                </svg>
              </button>
            </div>
            <div class="graph-stats">
              <div class="stat-item">
                <span class="stat-label">Nodes:</span>
                <span class="stat-value" id="node-count">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Edges:</span>
                <span class="stat-value" id="edge-count">0</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="graph-controls-panel-left" id="controls-panel">
          <div class="controls-header">
            <h3>Graph Controls</h3>
            <button class="panel-toggle" id="panel-toggle" title="Toggle Panel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </button>
          </div>
          
          <div class="controls-content">
            <div class="control-section">
              <div class="control-group">
                <label class="control-label">
                  <span>Nodes</span>
                  <span class="control-value" id="nodes-value">20</span>
                </label>
                <input type="range" class="control-slider" id="nodes-slider" 
                       min="1" max="100" value="20" step="1">
                <input type="number" class="control-input" id="nodes-input"
                       min="1" max="100" value="20" step="1">
              </div>
              
              <div class="control-group">
                <label class="control-label">
                  <span>Density</span>
                  <span class="control-value" id="density-value">0.30</span>
                </label>
                <input type="range" class="control-slider" id="density-slider" 
                       min="0" max="1" value="0.30" step="0.01">
                <input type="number" class="control-input" id="density-input"
                       min="0" max="1" value="0.30" step="0.01">
              </div>
            </div>
            
            <div class="control-section">
              <div class="toggle-group">
                <button class="toggle-btn active" data-group="direction" data-value="undirected">Undirected</button>
                <button class="toggle-btn" data-group="direction" data-value="directed">Directed</button>
              </div>
            </div>
            
            <div class="control-section">
              <div class="toggle-group">
                <button class="toggle-btn active" data-group="weight" data-value="unweighted">Unweighted</button>
                <button class="toggle-btn" data-group="weight" data-value="weighted">Weighted</button>
              </div>
              
              <div class="weight-controls" id="weight-controls" style="display: none;">
                <div class="weight-inputs">
                  <div class="weight-input-group">
                    <label class="weight-label">Min Weight</label>
                    <input type="number" class="weight-input" id="min-weight" 
                           min="0" max="999" value="1" step="0.1">
                  </div>
                  <div class="weight-input-group">
                    <label class="weight-label">Max Weight</label>
                    <input type="number" class="weight-input" id="max-weight" 
                           min="0" max="999" value="5" step="0.1">
                  </div>
                </div>
              </div>
            </div>
            
            <div class="control-section">
              <div class="action-buttons">
                <button class="primary-btn" id="generate-graph">Generate</button>
              </div>
            </div>
            
            <div class="advanced-settings">
              <div class="advanced-section">
                <div class="section-header">
                  <span class="section-title">Connectivity</span>
                </div>
                <div class="advanced-options">
                  <div class="toggle-group">
                    <button class="toggle-btn" data-group="connectivity" data-value="strongly-connected" id="strongly-connected">Strongly Connected</button>
                    <button class="toggle-btn" data-group="connectivity" data-value="disconnected" id="disconnected">Disconnected</button>
                  </div>
                  
                  <div class="option-controls" id="disconnected-controls" style="display: none;">
                    <div class="control-group">
                      <label class="control-label">
                        <span>Components</span>
                        <span class="control-value" id="components-value">2</span>
                      </label>
                      <input type="range" class="control-slider" id="components-slider" 
                             min="2" max="20" value="2" step="1">
                      <input type="number" class="control-input" id="components-input"
                             min="2" max="20" value="2" step="1">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <button class="sidebar-toggle-persistent" id="sidebar-toggle-persistent" title="Show Controls">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
      </div>
    `;
  }

  private getAlgorithmVisualizerContent(): string {
    return `
      <div class="algorithm-visualizer-content">
        <h2>Algorithm Visualizer</h2>
        <p>Visualize graph algorithms step by step.</p>
        
        <div class="placeholder-area">
          <h3>🎯 Coming Soon</h3>
          <p>Interactive algorithm visualization will include:</p>
          <ul>
            <li>Step-by-step algorithm execution</li>
            <li>Pathfinding algorithms (Dijkstra, A*, BFS, DFS)</li>
            <li>Graph traversal visualization</li>
            <li>Animation controls and speed adjustment</li>
            <li>Algorithm comparison tools</li>
          </ul>
          <p><em>Watch algorithms come to life!</em></p>
        </div>
      </div>
    `;
  }

  private getDataManagerContent(): string {
    return `
      <div class="data-manager-content">
        <h2>Data Manager</h2>
        <p>Import, export, and manage your graph data.</p>
        
        <div class="placeholder-area">
          <h3>📊 Coming Soon</h3>
          <p>Data management features will include:</p>
          <ul>
            <li>Import graphs from various formats (JSON, CSV, GraphML)</li>
            <li>Export visualizations and results</li>
            <li>Dataset library and examples</li>
            <li>Data preprocessing tools</li>
            <li>Batch processing capabilities</li>
          </ul>
          <p><em>Seamless data workflows!</em></p>
        </div>
      </div>
    `;
  }

  private getSettingsContent(): string {
    return `
      <div class="settings-content">
        <h2>Settings</h2>
        <p>Configure GraphStudio to your preferences.</p>
        
        <div class="placeholder-area">
          <h3>⚙️ Coming Soon</h3>
          <p>Configuration options will include:</p>
          <ul>
            <li>Appearance and theme customization</li>
            <li>Algorithm execution parameters</li>
            <li>Default graph properties</li>
            <li>Performance and memory settings</li>
            <li>Export and sharing preferences</li>
          </ul>
          <p><em>Tailor your experience!</em></p>
        </div>
      </div>
    `;
  }

  private getEmptyState(): string {
    return `
      <div class="empty-state">
        <h3>Empty Window</h3>
        <p>This window is ready for new content.</p>
        <p>Use the split buttons to create additional windows, or implement new features here.</p>
      </div>
    `;
  }
} 