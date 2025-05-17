// Initialize scene, camera, and renderer
    function initScene() {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      document.body.appendChild(renderer.domElement);
      camera.position.z = 5;
      return { scene, camera, renderer };
    }

    // Create holographic cube
    function createCube(scene) {
      const geometry = new THREE.BoxGeometry(2, 2, 2);

      // Load environment map for reflections
      const cubeTextureLoader = new THREE.CubeTextureLoader();
      const envMap = cubeTextureLoader.load([
        'https://threejs.org/examples/textures/cube/skybox/px.jpg',
        'https://threejs.org/examples/textures/cube/skybox/nx.jpg',
        'https://threejs.org/examples/textures/cube/skybox/py.jpg',
        'https://threejs.org/examples/textures/cube/skybox/ny.jpg',
        'https://threejs.org/examples/textures/cube/skybox/pz.jpg',
        'https://threejs.org/examples/textures/cube/skybox/nz.jpg'
      ]);

      // Holographic shader
      const vertexShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vViewPosition = -(modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      const fragmentShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;
        uniform float time;
        uniform vec3 baseColor;
        uniform samplerCube envMap;
        void main() {
          // Fresnel effect for rim lighting
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);
          
          // Simple noise-like shimmer
          float noise = sin(vPosition.x * 5.0 + time) * cos(vPosition.y * 5.0 + time) * 0.1;
          
          // Base color with shimmer
          vec3 color = baseColor + noise;
          
          // Environment map reflection
          vec3 reflectDir = reflect(-viewDir, vNormal);
          vec3 envColor = textureCube(envMap, reflectDir).rgb * 0.3;
          
          // Combine colors
          vec3 finalColor = mix(color, envColor + vec3(1.0), fresnel);
          gl_FragColor = vec4(finalColor, 0.6 + 0.3 * fresnel);
        }
      `;

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          time: { value: 0.0 },
          baseColor: { value: new THREE.Color(0.2, 0.8, 1.0) },
          envMap: { value: envMap }
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      return { cube, material };
    }

    // Set up controls
    function setupControls(camera, renderer) {
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      return controls;
    }

    // Handle UI interactions
    function setupUI(cube, material) {
      let isRotating = true;
      const toggleRotation = document.getElementById('toggleRotation');
      const colorPicker = document.getElementById('colorPicker');

      toggleRotation.addEventListener('click', () => {
        isRotating = !isRotating;
        toggleRotation.textContent = isRotating ? 'Stop Rotation' : 'Start Rotation';
      });

      colorPicker.addEventListener('input', (e) => {
        const color = new THREE.Color(e.target.value);
        material.uniforms.baseColor.value = color;
      });

      return () => isRotating;
    }

    // Animation loop
    function animate(scene, camera, renderer, cube, material, controls, getIsRotating) {
      let time = 0;
      function loop() {
        requestAnimationFrame(loop);
        time += 0.02;
        material.uniforms.time.value = time;

        if (getIsRotating()) {
          cube.rotation.x += 0.005;
          cube.rotation.y += 0.005;
        }

        controls.update();
        renderer.render(scene, camera);
      }
      loop();
    }

    // Handle window resize
    function setupResize(camera, renderer) {
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    }

    // Main function
    function main() {
      const { scene, camera, renderer } = initScene();
      const { cube, material } = createCube(scene);
      const controls = setupControls(camera, renderer);
      const getIsRotating = setupUI(cube, material);
      setupResize(camera, renderer);
      animate(scene, camera, renderer, cube, material, controls, getIsRotating);
    }

    main();