import ForceGraph3D from '3d-force-graph'
import * as THREE from 'three'

export class GraphManager {
  private graphInstances: Map<string, any> = new Map(); // Store graph instances by canvas ID

  public getGraphInstances(): Map<string, any> {
    return this.graphInstances;
  }

  public updateGraphStats() {
    // This will be called when sliders change to update the stats display
    const nodesSlider = document.getElementById('nodes-slider') as HTMLInputElement;
    const densitySlider = document.getElementById('density-slider') as HTMLInputElement;
    
    if (nodesSlider && densitySlider) {
      const nodeCount = parseInt(nodesSlider.value);
      const density = parseFloat(densitySlider.value);
      const maxEdges = nodeCount * (nodeCount - 1) / 2; // For undirected graph
      const edgeCount = Math.floor(maxEdges * density);
      
      this.updateStatsDisplay(nodeCount, edgeCount);
    }
  }

  public updateStatsDisplay(nodeCount: number, edgeCount: number) {
    const nodeCountEl = document.getElementById('node-count');
    const edgeCountEl = document.getElementById('edge-count');
    
    if (nodeCountEl) nodeCountEl.textContent = nodeCount.toString();
    if (edgeCountEl) edgeCountEl.textContent = edgeCount.toString();
  }

  public generateGraph(windowEl: HTMLElement) {
    // Get current parameters
    const nodesSlider = windowEl.querySelector('#nodes-slider') as HTMLInputElement;
    const densitySlider = windowEl.querySelector('#density-slider') as HTMLInputElement;
    const isDirected = windowEl.querySelector('[data-group="direction"].active')?.getAttribute('data-value') === 'directed';
    const isWeighted = windowEl.querySelector('[data-group="weight"].active')?.getAttribute('data-value') === 'weighted';
    
    const nodeCount = parseInt(nodesSlider?.value || '20');
    const density = parseFloat(densitySlider?.value || '0.3');
    
    // Get weight range parameters
    let minWeight = 1;
    let maxWeight = 5;
    
    if (isWeighted) {
      const minWeightInput = windowEl.querySelector('#min-weight') as HTMLInputElement;
      const maxWeightInput = windowEl.querySelector('#max-weight') as HTMLInputElement;
      
      if (minWeightInput && maxWeightInput) {
        minWeight = parseFloat(minWeightInput.value) || 1;
        maxWeight = parseFloat(maxWeightInput.value) || 5;
        
        // Ensure max is greater than min
        if (maxWeight <= minWeight) {
          maxWeight = minWeight + 0.1;
        }
      }
    }
    
    // Get connectivity settings
    const stronglyConnectedBtn = windowEl.querySelector('#strongly-connected') as HTMLButtonElement;
    const disconnectedBtn = windowEl.querySelector('#disconnected') as HTMLButtonElement;
    const componentsSlider = windowEl.querySelector('#components-slider') as HTMLInputElement;
    
    let connectivityMode = 'default';
    let numComponents = 1;
    
    if (stronglyConnectedBtn && stronglyConnectedBtn.classList.contains('active')) {
      connectivityMode = 'strongly-connected';
    } else if (disconnectedBtn && disconnectedBtn.classList.contains('active')) {
      connectivityMode = 'disconnected';
      numComponents = parseInt(componentsSlider?.value || '2');
    }
    
    // Reset camera position instantly before generating new graph (no animation)
    this.resetGraphViewInstant();
    
    // Generate graph data
    const graphData = this.generateGraphData(nodeCount, density, isDirected, isWeighted, minWeight, maxWeight, connectivityMode, numComponents);
    
    // Update the visualization
    this.updateGraphVisualization(graphData);
    
    // Update stats
    this.updateGraphStats();
  }

  public generateGraphData(nodeCount: number, density: number, isDirected: boolean, isWeighted: boolean, minWeight: number = 1, maxWeight: number = 5, connectivityMode: string = 'default', numComponents: number = 1) {
    const nodes = [];
    
    // Generate nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: i,
        label: `Node ${i}`
      });
    }
    
    // Handle different connectivity modes
    if (connectivityMode === 'strongly-connected') {
      return this.generateStronglyConnectedGraph(nodes, density, isDirected, isWeighted, minWeight, maxWeight);
    } else if (connectivityMode === 'disconnected') {
      return this.generateDisconnectedGraph(nodes, density, isDirected, isWeighted, minWeight, maxWeight, numComponents);
    } else {
      // Default graph generation
      return this.generateDefaultGraph(nodes, density, isDirected, isWeighted, minWeight, maxWeight);
    }
  }

  private generateDefaultGraph(nodes: any[], density: number, isDirected: boolean, isWeighted: boolean, minWeight: number, maxWeight: number) {
    const links = [];
    const nodeCount = nodes.length;
    
    // Generate edges based on density
    const maxEdges = isDirected ? nodeCount * (nodeCount - 1) : nodeCount * (nodeCount - 1) / 2;
    const targetEdges = Math.floor(maxEdges * density);
    
    const addedEdges = new Set();
    
    for (let i = 0; i < targetEdges; i++) {
      let source, target, edgeKey;
      let attempts = 0;
      
      do {
        source = Math.floor(Math.random() * nodeCount);
        target = Math.floor(Math.random() * nodeCount);
        
        if (source === target) continue;
        
        edgeKey = isDirected ? `${source}-${target}` : 
                 source < target ? `${source}-${target}` : `${target}-${source}`;
        
        attempts++;
      } while (addedEdges.has(edgeKey) && attempts < 100);
      
      if (!addedEdges.has(edgeKey)) {
        addedEdges.add(edgeKey);
        
        const link: any = {
          source: source,
          target: target
        };
        
        if (isWeighted) {
          const weightRange = maxWeight - minWeight;
          const randomWeight = Math.random() * weightRange + minWeight;
          link.weight = Math.round(randomWeight * 10) / 10;
        }
        
        links.push(link);
      }
    }
    
    // Ensure we have a connected graph by adding a few guaranteed connections
    if (nodes.length > 1 && links.length === 0) {
      for (let i = 0; i < Math.min(3, nodes.length - 1); i++) {
        const link: any = {
          source: i,
          target: i + 1
        };
        
        if (isWeighted) {
          const weightRange = maxWeight - minWeight;
          const randomWeight = Math.random() * weightRange + minWeight;
          link.weight = Math.round(randomWeight * 10) / 10;
        }
        
        links.push(link);
      }
    }
    
    return { nodes, links };
  }

  private generateStronglyConnectedGraph(nodes: any[], density: number, isDirected: boolean, isWeighted: boolean, minWeight: number, maxWeight: number) {
    const links = [];
    const nodeCount = nodes.length;
    
    if (isDirected) {
      // For directed graphs: Create a strongly connected component by making a cycle
      for (let i = 0; i < nodeCount; i++) {
        const link: any = {
          source: i,
          target: (i + 1) % nodeCount
        };
        
        if (isWeighted) {
          const weightRange = maxWeight - minWeight;
          const randomWeight = Math.random() * weightRange + minWeight;
          link.weight = Math.round(randomWeight * 10) / 10;
        }
        
        links.push(link);
      }
      
      // Add additional directed edges based on density
      const maxEdges = nodeCount * (nodeCount - 1);
      const targetEdges = Math.floor(maxEdges * density);
      const addedEdges = new Set();
      
      // Mark existing edges as added
      for (let i = 0; i < nodeCount; i++) {
        addedEdges.add(`${i}-${(i + 1) % nodeCount}`);
      }
      
      // Add more edges to reach target density
      for (let i = links.length; i < targetEdges; i++) {
        let source, target, edgeKey;
        let attempts = 0;
        
        do {
          source = Math.floor(Math.random() * nodeCount);
          target = Math.floor(Math.random() * nodeCount);
          
          if (source === target) continue;
          
          edgeKey = `${source}-${target}`;
          attempts++;
        } while (addedEdges.has(edgeKey) && attempts < 100);
        
        if (!addedEdges.has(edgeKey)) {
          addedEdges.add(edgeKey);
          
          const link: any = {
            source: source,
            target: target
          };
          
          if (isWeighted) {
            const weightRange = maxWeight - minWeight;
            const randomWeight = Math.random() * weightRange + minWeight;
            link.weight = Math.round(randomWeight * 10) / 10;
          }
          
          links.push(link);
        }
      }
    } else {
      // For undirected graphs: Create a connected graph (spanning tree + additional edges)
      // First create a spanning tree to ensure connectivity
      for (let i = 0; i < nodeCount - 1; i++) {
        const link: any = {
          source: i,
          target: i + 1
        };
        
        if (isWeighted) {
          const weightRange = maxWeight - minWeight;
          const randomWeight = Math.random() * weightRange + minWeight;
          link.weight = Math.round(randomWeight * 10) / 10;
        }
        
        links.push(link);
      }
      
      // Add additional undirected edges based on density
      const maxEdges = nodeCount * (nodeCount - 1) / 2;
      const targetEdges = Math.floor(maxEdges * density);
      const addedEdges = new Set();
      
      // Mark existing edges as added
      for (let i = 0; i < nodeCount - 1; i++) {
        addedEdges.add(`${i}-${i + 1}`);
      }
      
      // Add more edges to reach target density
      for (let i = links.length; i < targetEdges; i++) {
        let source, target, edgeKey;
        let attempts = 0;
        
        do {
          source = Math.floor(Math.random() * nodeCount);
          target = Math.floor(Math.random() * nodeCount);
          
          if (source === target) continue;
          
          edgeKey = source < target ? `${source}-${target}` : `${target}-${source}`;
          attempts++;
        } while (addedEdges.has(edgeKey) && attempts < 100);
        
        if (!addedEdges.has(edgeKey)) {
          addedEdges.add(edgeKey);
          
          const link: any = {
            source: source,
            target: target
          };
          
          if (isWeighted) {
            const weightRange = maxWeight - minWeight;
            const randomWeight = Math.random() * weightRange + minWeight;
            link.weight = Math.round(randomWeight * 10) / 10;
          }
          
          links.push(link);
        }
      }
    }
    
    return { nodes, links };
  }

  private generateDisconnectedGraph(nodes: any[], density: number, isDirected: boolean, isWeighted: boolean, minWeight: number, maxWeight: number, numComponents: number) {
    const links = [];
    const nodeCount = nodes.length;
    
    // Divide nodes into components
    const componentSizes = [];
    let remainingNodes = nodeCount;
    
    // Create roughly equal component sizes
    for (let i = 0; i < numComponents; i++) {
      if (i === numComponents - 1) {
        // Last component gets all remaining nodes
        componentSizes.push(remainingNodes);
      } else {
        // Each component gets at least 1 node
        const maxSize = Math.floor(remainingNodes / (numComponents - i));
        const size = Math.max(1, Math.floor(Math.random() * maxSize) + 1);
        componentSizes.push(size);
        remainingNodes -= size;
      }
    }
    
    // Assign nodes to components
    let nodeIndex = 0;
    const components = [];
    
    for (let i = 0; i < numComponents; i++) {
      const component = [];
      for (let j = 0; j < componentSizes[i]; j++) {
        component.push(nodeIndex++);
      }
      components.push(component);
    }
    
    // Generate edges within each component
    for (const component of components) {
      if (component.length > 1) {
        const componentMaxEdges = isDirected ? 
          component.length * (component.length - 1) : 
          component.length * (component.length - 1) / 2;
        const componentTargetEdges = Math.max(1, Math.floor(componentMaxEdges * density));
        
        const addedEdges = new Set();
        
        // Ensure each component is connected
        for (let i = 0; i < component.length - 1; i++) {
          const link: any = {
            source: component[i],
            target: component[i + 1]
          };
          
          if (isWeighted) {
            const weightRange = maxWeight - minWeight;
            const randomWeight = Math.random() * weightRange + minWeight;
            link.weight = Math.round(randomWeight * 10) / 10;
          }
          
          links.push(link);
          
          const edgeKey = isDirected ? `${component[i]}-${component[i + 1]}` : 
                         component[i] < component[i + 1] ? `${component[i]}-${component[i + 1]}` : `${component[i + 1]}-${component[i]}`;
          addedEdges.add(edgeKey);
        }
        
        // Add more edges to reach target density
        for (let i = component.length - 1; i < componentTargetEdges; i++) {
          let source, target, edgeKey;
          let attempts = 0;
          
          do {
            source = component[Math.floor(Math.random() * component.length)];
            target = component[Math.floor(Math.random() * component.length)];
            
            if (source === target) continue;
            
            edgeKey = isDirected ? `${source}-${target}` : 
                     source < target ? `${source}-${target}` : `${target}-${source}`;
            
            attempts++;
          } while (addedEdges.has(edgeKey) && attempts < 100);
          
          if (!addedEdges.has(edgeKey)) {
            addedEdges.add(edgeKey);
            
            const link: any = {
              source: source,
              target: target
            };
            
            if (isWeighted) {
              const weightRange = maxWeight - minWeight;
              const randomWeight = Math.random() * weightRange + minWeight;
              link.weight = Math.round(randomWeight * 10) / 10;
            }
            
            links.push(link);
          }
        }
      }
    }
    
    return { nodes, links };
  }

  public clearGraph() {
    this.updateGraphVisualization({ nodes: [], links: [] });
    this.updateStatsDisplay(0, 0);
  }

  public resetGraphView() {
    this.graphInstances.forEach((graph) => {
      // Reset camera to a good viewing position
      const distance = 300;
      graph.cameraPosition(
        { x: distance, y: distance, z: distance }, // new position
        { x: 0, y: 0, z: 0 }, // lookAt
        1000 // transition duration
      );
    });
  }

  public resetGraphViewInstant() {
    this.graphInstances.forEach((graph) => {
      // Reset camera to a good viewing position instantly (no animation)
      const distance = 300;
      graph.cameraPosition(
        { x: distance, y: distance, z: distance }, // new position
        { x: 0, y: 0, z: 0 }, // lookAt
        0 // no transition duration = instant
      );
    });
  }

  public adjustGraphCanvasLayout(graphCanvas: HTMLElement, controlsPanel: HTMLElement) {
    // Get the canvas ID to find the corresponding graph instance
    const canvasId = graphCanvas.id;
    const graph = this.graphInstances.get(canvasId);
    
    if (!graph) return;
    
    const isCollapsed = controlsPanel.classList.contains('collapsed');
    
    // Adjust the canvas container layout to account for sidebar
    if (!isCollapsed) {
      // Get the actual sidebar width from the DOM
      const sidebarRect = controlsPanel.getBoundingClientRect();
      const sidebarWidth = sidebarRect.width;
      
      // Sidebar is open - canvas starts exactly where sidebar ends
      graphCanvas.style.left = `${sidebarWidth}px`; // Position exactly after sidebar
      graphCanvas.style.width = `calc(100% - ${sidebarWidth}px)`; // Width is remaining space
      graphCanvas.style.position = 'absolute';
    } else {
      // Sidebar is closed - canvas occupies entire window
      graphCanvas.style.left = '0px';
      graphCanvas.style.width = '100%';
      graphCanvas.style.position = 'absolute';
    }
    
    // Update graph dimensions to match new container size
    setTimeout(() => {
      const newRect = graphCanvas.getBoundingClientRect();
      graph.width(newRect.width).height(newRect.height);
    }, 50); // Small delay to let CSS changes take effect
  }

  public initializeGraphVisualization(canvasElement: HTMLElement) {
    // Clear any existing content
    canvasElement.innerHTML = '';
    
    console.log('Initializing 3D graph visualization...');
    
    // Add a loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: var(--text-secondary);
      font-size: 14px;
    `;
    loadingDiv.innerHTML = `
      <div style="margin-bottom: 8px;">Initializing 3D Graph...</div>
      <div style="font-size: 12px; opacity: 0.7;">Loading visualization engine</div>
    `;
    canvasElement.appendChild(loadingDiv);
    
    // Use setTimeout to allow the canvas to be properly sized
    setTimeout(() => {
      try {
        console.log('ForceGraph3D:', ForceGraph3D);
        
        // Remove loading indicator
        canvasElement.removeChild(loadingDiv);
        
        // Make sure canvas has proper dimensions
        if (canvasElement.clientWidth === 0 || canvasElement.clientHeight === 0) {
          console.warn('Canvas has zero dimensions, setting default size');
          canvasElement.style.width = '100%';
          canvasElement.style.height = '100%';
          canvasElement.style.minHeight = '400px';
        }
        
        // Create a child div for the graph to avoid conflicts with our overlay
        const graphContainer = document.createElement('div');
        graphContainer.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        `;
        canvasElement.appendChild(graphContainer);
        
        // Create the ForceGraph3D instance using the correct pattern
        const graph = (ForceGraph3D as any)()(graphContainer);
        
        // Get theme-aware background color
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const backgroundColor = isDarkMode ? '#1a1a1a' : '#f8fafc';
        
        // Configure the graph with flat colors and borders
        graph
          .width(canvasElement.clientWidth || 600)
          .height(canvasElement.clientHeight || 400)
          .backgroundColor(backgroundColor)
          .showNavInfo(false)
          .enableNodeDrag(true)
          .enableNavigationControls(true)
          .nodeLabel('label')
          .nodeVal(3)
          .linkDirectionalParticleWidth(2)
          .linkDirectionalParticleColor(isDarkMode ? '#f8fafc' : '#0f172a')
          .linkThreeObject((link: any) => {
            // Create flat edges with no lighting
            const start = new THREE.Vector3(link.source.x || 0, link.source.y || 0, link.source.z || 0);
            const end = new THREE.Vector3(link.target.x || 0, link.target.y || 0, link.target.z || 0);
          
            const points = [start, end];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ 
              color: isDarkMode ? '#cbd5e1' : '#1e293b',
              linewidth: 1.2
            });
            
            return new THREE.Line(geometry, material);
          })
          .nodeThreeObject((_node: any) => {
            const group = new THREE.Group();
            
            // Outline sphere (slightly larger, only back faces visible for 2D border effect)
            const outlineGeometry = new THREE.SphereGeometry(2.65, 16, 16);
            const outlineMaterial = new THREE.MeshBasicMaterial({ 
              color: isDarkMode ? '#cbd5e1' : '#000000', // White in dark mode, black in light mode
              side: THREE.BackSide // Only show back faces for outline effect
            });
            const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
            
            // Main node sphere - vibrant violet
            const nodeGeometry = new THREE.SphereGeometry(2.5, 16, 16);
            const nodeMaterial = new THREE.MeshBasicMaterial({ 
              color: '#8b5cf6' // Vibrant violet that works in both modes
            });
            const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            
            // Add outline first, then main sphere on top
            group.add(outlineMesh);
            group.add(nodeMesh);
            
            return group;
          })
          .d3AlphaDecay(0.02)
          .d3VelocityDecay(0.3)
          .onNodeClick((node: any) => {
            console.log('Node clicked:', node);
          })
          .onNodeHover((node: any) => {
            canvasElement.style.cursor = node ? 'pointer' : '';
          });

        // Store the graph instance
        const canvasId = canvasElement.id || `canvas-${Date.now()}`;
        if (!canvasElement.id) canvasElement.id = canvasId;
        this.graphInstances.set(canvasId, graph);

        // Initial positioning adjustment based on sidebar state
        setTimeout(() => {
          const windowEl = canvasElement.closest('.window');
          const controlsPanel = windowEl?.querySelector('#controls-panel') as HTMLElement;
          if (controlsPanel) {
            this.adjustGraphCanvasLayout(canvasElement, controlsPanel);
          }
        }, 50);

        // Generate and load initial data
        const initialData = this.generateGraphData(10, 0.3, false, false);
        graph.graphData(initialData);

        // Update stats display
        this.updateStatsDisplay(initialData.nodes.length, initialData.links.length);

        // Set camera position after a delay
        setTimeout(() => {
          graph.cameraPosition({ x: 200, y: 200, z: 200 });
        }, 500);

        // Handle window resize and sidebar positioning
        const resizeObserver = new ResizeObserver(() => {
          const newWidth = canvasElement.clientWidth;
          const newHeight = canvasElement.clientHeight;
          if (newWidth > 0 && newHeight > 0) {
            // Find the controls panel to check sidebar state
            const windowEl = canvasElement.closest('.window');
            const controlsPanel = windowEl?.querySelector('#controls-panel') as HTMLElement;
            
            if (controlsPanel) {
              // Adjust positioning based on sidebar state
              this.adjustGraphCanvasLayout(canvasElement, controlsPanel);
            } else {
              // Fallback to full width if no sidebar found
              graph.width(newWidth).height(newHeight);
            }
          }
        });
        resizeObserver.observe(canvasElement);
        
      } catch (error) {
        console.error('Error in graph initialization:', error);
        
        // Remove loading indicator if it exists
        if (loadingDiv.parentNode) {
          canvasElement.removeChild(loadingDiv);
        }
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
          background: var(--surface);
          padding: 20px;
          border-radius: 8px;
          border: 1px solid var(--border);
        `;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errorDiv.innerHTML = `
          <div style="font-size: 24px; margin-bottom: 12px; color: #ef4444;">⚠️</div>
          <div style="font-weight: 600; margin-bottom: 8px;">3D Visualization Failed</div>
          <div style="font-size: 12px; opacity: 0.8;">Error: ${errorMessage}</div>
          <div style="font-size: 11px; margin-top: 8px; opacity: 0.6;">Check browser console for details</div>
        `;
        canvasElement.appendChild(errorDiv);
      }
    }, 100);
  }

  public updateGraphVisualization(graphData: any) {
    // Find all active graph instances and update them
    this.graphInstances.forEach((graph, canvasId) => {
      const canvasElement = document.getElementById(canvasId);
      if (canvasElement && canvasElement.offsetParent !== null) {
        // Update the graph data
        graph.graphData(graphData);

        // Enable particles for directed graphs
        if (this.isDirectedGraph()) {
          graph.linkDirectionalParticles(1);
        } else {
          graph.linkDirectionalParticles(0);
        }
      }
    });
  }

  public isDirectedGraph(): boolean {
    const directedToggle = document.querySelector('[data-group="direction"].active');
    return directedToggle?.getAttribute('data-value') === 'directed';
  }

  public toggleFullscreen(element: HTMLElement) {
    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }
} 