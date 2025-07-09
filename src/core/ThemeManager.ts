export class ThemeManager {
  private graphInstances: Map<string, any>;

  constructor(graphInstances: Map<string, any>) {
    this.graphInstances = graphInstances;
  }

  public initTheme() {
    // Load saved theme or default to light
    const savedTheme = localStorage.getItem('graphstudio-theme') || 'light';
    this.applyTheme(savedTheme);
  }

  public applyTheme(theme: string) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update toggle button icon
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      // Create Lucide-style SVG icons directly
      const sunIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="m12 2 0 2"/><path d="m12 20 0 2"/><path d="m2 12 2 0"/><path d="m20 12 2 0"/><path d="m6.34 6.34-1.41-1.41"/><path d="m19.07 4.93-1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="m4.93 19.07 1.41-1.41"/></svg>`;
      const moonIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
      
      themeToggle.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
      themeToggle.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
    }
  }

  public setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      this.applyTheme(newTheme);
      localStorage.setItem('graphstudio-theme', newTheme);
      
      // Update graph backgrounds
      this.updateGraphBackgrounds(newTheme);
    });
    
    // Set initial state
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    this.applyTheme(currentTheme);
  }

  public updateGraphBackgrounds(theme: string) {
    const backgroundColor = theme === 'dark' ? '#1a1a1a' : '#f8fafc';
    const isDarkMode = theme === 'dark';
    
    // Import THREE here to avoid circular dependencies
    import('three').then((THREE) => {
      // Update all active graph instances
      this.graphInstances.forEach((graph, canvasId) => {
        const canvasElement = document.getElementById(canvasId);
        if (canvasElement && canvasElement.offsetParent !== null) {
          graph
            .backgroundColor(backgroundColor)
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
            });
        }
      });
    });
  }
} 