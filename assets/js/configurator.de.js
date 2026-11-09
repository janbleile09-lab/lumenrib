/********************************************************************
     * 1. PARAMETRIC STATE (All dimensions in millimeters: 1 unit = 1 mm)
     ********************************************************************/
    const defaultParams = {
      height: 110,              // Total height of lantern (mm) - tea light default
      bellyDia: 124,            // Max outer diameter at belly (mm)
      topInnerDia: 62,          // Inner opening diameter at top ring (mm) - tea light drops in easily
      baseOuterDia: 84,         // Outer diameter at base (mm)
      bellyHeightRatio: 47,     // Vertical position of max belly (%)
      curveTension: 52,         // Controls bottom/top tangent steepness for support-free printing (%)
      ribCount: 40,             // Number of vertical curved ribs
      ribWidth: 2.4,            // Tangential width of each rib (mm)
      ribDepth: 4.0,            // Radial thickness/depth of each rib (mm)
      twistAngle: 15,           // Helical twist from bottom to top (degrees) - gentle spiral
      topRingHeight: 3.2,       // Height of top connecting ring (mm)
      stabilizerMode: 'breakaway', // 'breakaway' (V5 Top-Down Lever-Snap with 1-Pin + every 4th upper pin), 'permanent', 'none'
      stabilizerCount: 2,       // Two rings are enough for the compact tea light body
      stabilizerWidth: 3.0,     // Radial width of the inner lever flange (mm)
      stabilizerThickness: 3.2, // Vertical height of the lever ring (mm)
      stabilizerNeck: 0.60,     // V-Notch breakaway pin width at the rib (mm)
      upperPinStep: 4,          // 2nd upper pin every 4th rib by default (0 = strictly 1 pin per rib)
      rootBoost: 20,            // Extra thickness at the bottom 25% of ribs (%) to prevent cantilever wobble
      motifType: 'none',        // 'none', 'tree', 'star', 'crystal', 'heart', 'mix'
      motifCount: 6,            // Number of decorative symbols per row around circumference
      motifRows: 2,             // Number of staggered vertical rows of symbols (1..3)
      motifSize: 30,            // Overall proportional size (height & width) of each symbol (mm)
      motifWidthScale: 100,     // Width aspect ratio scale (%)
      motifRelief: 2.4,         // Proud 3D relief projection in front of the outer rib surface (mm)
      motifHeightRatio: 50,     // Vertical center position of symbols (% of height)
      baseThickness: 5.0,       // Total height of bottom base plate rim (mm)
      recessDepth: 2.0,         // Depth of anti-slip candle recess (mm)
      candleClearance: 1.0,     // Radial clearance around candle in tray (mm)
      recessRimWidth: 3.0,      // Width of the raised lip around the candle recess (mm)
      candleDia: 38,            // Tea light diameter (38 mm = standard tea light)
      candleHeight: 18,         // Tea light height (18 mm = standard tea light)
      lightIntensity: 100,      // LED candle light intensity (%)
      lanternColor: '#d6c5b3'   // Modern Warm Travertine Sand
    };

    const state = {
      ...defaultParams,
      showCandle: true,
      showGlassSleeve: false,
      sectionView: false,
      nightMode: true,
      zenMode: false,
      lastMaxOverhangDeg: 45,
      lastEstimatedGrams: 145,
      lastFreeSpanMm: 28,
      candleDropAnimProgress: null // null when idle, 0..1 when animating
    };

    /********************************************************************
     * 2. THREE.JS SCENE, CAMERA, SHADOWS & LIGHTING SETUP
     ********************************************************************/
    let scene, camera, renderer, controls;
    let lanternGroup, lanternMesh, candleGroup, flameMesh, candlePointLight, ambientLight, dirLight, floorMesh;
    let clippingPlane;
    let currentLanternGeometry = null; // Stored merged BufferGeometry for instant STL export

    function initThree() {
      const container = document.getElementById('canvas-container');

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x08090d);

      camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 1, 2500);
      camera.position.set(175, 165, 215);

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.localClippingEnabled = true;
      container.appendChild(renderer.domElement);

      // Clipping plane for cross-section view (cuts front half Z > 0)
      clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.target.set(0, 55, 0);
      controls.maxPolarAngle = Math.PI / 2 + 0.08;
      controls.minDistance = 60;
      controls.maxDistance = 750;

      // Ambient & Studio Directional Lights
      ambientLight = new THREE.AmbientLight(0xdbe4ff, 0.25);
      scene.add(ambientLight);

      dirLight = new THREE.DirectionalLight(0xfff5e6, 0.22);
      dirLight.position.set(160, 320, 180);
      scene.add(dirLight);

      // Table / Shelf Floor Plane to catch the signature radial rib shadows (like in IMG_4466)
      const floorGeo = new THREE.CircleGeometry(450, 72);
      floorGeo.rotateX(-Math.PI / 2);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0xd8d5ce,
        roughness: 0.72,
        metalness: 0.05
      });
      floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.y = -0.2;
      floorMesh.receiveShadow = true;
      scene.add(floorMesh);

      // Subtle Millimeter Reference Grid on the table
      const grid = new THREE.GridHelper(300, 15, 0xdfba90, 0x4b5262);
      grid.position.y = 0.05;
      grid.material.opacity = 0.12;
      grid.material.transparent = true;
      scene.add(grid);

      lanternGroup = new THREE.Group();
      scene.add(lanternGroup);

      candleGroup = new THREE.Group();
      scene.add(candleGroup);

      // Warm LED Candle PointLight inside the lantern casting radial rib shadows
      candlePointLight = new THREE.PointLight(0xff9d3b, 2.2, 750, 1.4);
      candlePointLight.castShadow = true;
      candlePointLight.shadow.mapSize.width = 2048;
      candlePointLight.shadow.mapSize.height = 2048;
      candlePointLight.shadow.camera.near = 8;
      candlePointLight.shadow.camera.far = 650;
      candlePointLight.shadow.bias = -0.0005;
      scene.add(candlePointLight);

      window.addEventListener('resize', onWindowResize);

      applyLightingMode();
      rebuildAll();
      animate();
    }

    function onWindowResize() {
      const container = document.getElementById('canvas-container');
      if (!container || !renderer || !camera) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    /********************************************************************
     * 3. PARAMETRIC 3D GEOMETRY ENGINE (Watertight, Manifold, Printable)
     ********************************************************************/

    // Evaluates outer radius R(t) and height Y(t) for t in [0, 1]
    function evaluateOuterProfile(t) {
      const H = state.height;
      const rBase = state.baseOuterDia / 2;
      const rBelly = state.bellyDia / 2;
      const rTopOuter = state.topInnerDia / 2 + state.ribDepth;
      const tBelly = state.bellyHeightRatio / 100;
      const tension = state.curveTension / 100; // 0.25 .. 0.85

      const y = t * H;
      let r;

      if (t <= tBelly) {
        const u = t / Math.max(0.01, tBelly);
        // Smooth cubic Bezier-like interpolation from base to belly
        const p = Math.pow(u, 0.55 + (1 - tension) * 0.55);
        const smooth = p * p * (3 - 2 * p);
        r = rBase + (rBelly - rBase) * Math.sin(smooth * (Math.PI / 2));
      } else {
        const u = (t - tBelly) / Math.max(0.01, 1 - tBelly);
        const p = Math.pow(u, 0.7 + (1 - tension) * 0.3);
        r = rBelly - (rBelly - rTopOuter) * (1 - Math.cos(p * (Math.PI / 2)));
      }

      return { r, y };
    }

    // Builds a watertight revolved mesh from a closed 2D (r, y) polygon
    function buildClosedLatheGeometry(profile2D, radialSegments) {
      const positions = [];
      const n = profile2D.length;

      for (let i = 0; i < radialSegments; i++) {
        const a0 = (i / radialSegments) * Math.PI * 2;
        const a1 = ((i + 1) / radialSegments) * Math.PI * 2;
        const cos0 = Math.cos(a0), sin0 = Math.sin(a0);
        const cos1 = Math.cos(a1), sin1 = Math.sin(a1);

        for (let j = 0; j < n; j++) {
          const p0 = profile2D[j];
          const p1 = profile2D[(j + 1) % n];

          // Skip degenerate zero-radius cap segments properly
          const v00 = [p0.r * cos0, p0.y, -p0.r * sin0];
          const v10 = [p0.r * cos1, p0.y, -p0.r * sin1];
          const v01 = [p1.r * cos0, p1.y, -p1.r * sin0];
          const v11 = [p1.r * cos1, p1.y, -p1.r * sin1];

          if (p0.r > 1e-4) {
            positions.push(...v00, ...v10, ...v11);
          }
          if (p1.r > 1e-4) {
            positions.push(...v00, ...v11, ...v01);
          }
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      return geo;
    }

    // Builds a single curved, rounded-profile rib from bottom plate to top stabilizer ring
    function buildRibsGeometry() {
      const numRibs = Math.round(state.ribCount);
      const H = state.height;
      const ribW = state.ribWidth;
      const ribD = state.ribDepth;
      const twistRad = THREE.MathUtils.degToRad(state.twistAngle);

      const heightSteps = 44;
      const csSegments = 10; // Cross-section points around each rib (rounded rectangle)
      const rootBoostFactor = (state.rootBoost || 0) / 100;

      // Precompute unit superellipse cross-section of a single rib
      const unitCrossSection = [];
      for (let c = 0; c < csSegments; c++) {
        const theta = (c / csSegments) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const exp = 0.65;
        const uUnit = 0.5 * Math.sign(cosT) * Math.pow(Math.abs(cosT), exp);
        const vUnit = 0.5 * Math.sign(sinT) * Math.pow(Math.abs(sinT), exp);
        unitCrossSection.push({ uUnit, vUnit });
      }

      // Sample spine along t in [0.008 .. 0.992] so ribs embed cleanly into base plate and top ring
      const ringsSingleRib = [];
      let maxOverhangAngleDeg = 0;

      // Calculate exact tangential spacing at the top ring so adjacent ribs arch together at <=32°
      // just before the top ring starts (eliminates flat horizontal bridging under the top ring!)
      const rTopCenter = (state.topInnerDia / 2) + (ribD / 2);
      const topChordSpacing = (2 * Math.PI * rTopCenter) / numRibs;
      const topArchStartT = Math.max(0.86, 1 - (( state.topRingHeight + 4.2 ) / H));

      for (let s = 0; s <= heightSteps; s++) {
        const t = 0.008 + (s / heightSteps) * 0.984;
        const { r: rOuter, y } = evaluateOuterProfile(t);

        // Smooth root-stiffening flare in the bottom 25% of the rib to fight cantilever resonance
        let boost = 0;
        if (t < 0.25 && rootBoostFactor > 0) {
          const uRoot = 1 - (t / 0.25);
          boost = rootBoostFactor * (uRoot * uRoot);
        }

        // Self-supporting Gothic Arch flare at the top transition into the Top Ring (t > topArchStartT):
        // Gently widens each rib tangentially at a print-safe ~30° angle so adjacent ribs merge into a
        // continuous closed arch right under the top ring without any mid-air horizontal overhang!
        let topArchWidthAdd = 0;
        if (t > topArchStartT) {
          const uTop = Math.min(1, (t - topArchStartT) / (0.992 - topArchStartT));
          const smoothArch = uTop * uTop * (3 - 2 * uTop);
          topArchWidthAdd = Math.max(0, (topChordSpacing * 1.05 - ribW) * smoothArch);
        }

        const localRibW = ribW * (1 + boost * 0.85) + topArchWidthAdd;
        const localRibD = ribD * (1 + boost * 0.65);
        const rCenter = rOuter - localRibD / 2;

        if (s > 0) {
          const prev = evaluateOuterProfile(0.008 + ((s - 1) / heightSteps) * 0.984);
          const dr = Math.abs(rOuter - prev.r);
          const dy = Math.max(0.001, y - prev.y);
          const angleFromVertical = THREE.MathUtils.radToDeg(Math.atan2(dr, dy));
          if (t < 0.5 && angleFromVertical > maxOverhangAngleDeg) {
            maxOverhangAngleDeg = angleFromVertical;
          }
        }

        const phiTwist = twistRad * t;
        ringsSingleRib.push({ rCenter, y, phiTwist, localRibW, localRibD });
      }

      const positions = [];

      for (let k = 0; k < numRibs; k++) {
        const baseAngle = (k / numRibs) * Math.PI * 2;

        // Compute 3D vertex rings for this rib
        const ribRings = [];
        for (let s = 0; s <= heightSteps; s++) {
          const { rCenter, y, phiTwist, localRibW, localRibD } = ringsSingleRib[s];
          const angle = baseAngle + phiTwist;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);

          // Radial unit vector (cosA, 0, -sinA), Tangential unit vector (-sinA, 0, -cosA)
          const ringVerts = [];
          for (let c = 0; c < csSegments; c++) {
            const { uUnit, vUnit } = unitCrossSection[c];
            const u = uUnit * localRibD;
            const v = vUnit * localRibW;
            const rad = rCenter + u;
            const px = rad * cosA - v * sinA;
            const py = y;
            const pz = -rad * sinA - v * cosA;
            ringVerts.push([px, py, pz]);
          }
          ribRings.push(ringVerts);
        }

        // Stitch side quads along the rib
        for (let s = 0; s < heightSteps; s++) {
          const ringA = ribRings[s];
          const ringB = ribRings[s + 1];
          for (let c = 0; c < csSegments; c++) {
            const cNext = (c + 1) % csSegments;
            const v00 = ringA[c];
            const v10 = ringA[cNext];
            const v01 = ringB[c];
            const v11 = ringB[cNext];

            positions.push(...v00, ...v10, ...v11);
            positions.push(...v00, ...v11, ...v01);
          }
        }

        // Bottom & Top end caps of each rib for a watertight manifold mesh
        const bottomRing = ribRings[0];
        const topRing = ribRings[heightSteps];
        for (let c = 1; c < csSegments - 1; c++) {
          positions.push(...bottomRing[0], ...bottomRing[c + 1], ...bottomRing[c]);
          positions.push(...topRing[0], ...topRing[c], ...topRing[c + 1]);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.computeVertexNormals();
      return { geo, maxOverhangAngleDeg };
    }

    // Helper: Returns the optimized normalized height positions (t in 0..1) of the stabilizer rings.
    // Concentrates rings in the upper-middle and top overhang zone (45%..88%) where cantilever chatter occurs.
    function getStabilizerNormalizedHeights(numRings) {
      if (numRings <= 0) return [];
      if (numRings === 1) return [0.72];
      if (numRings === 2) return [0.54, 0.85];
      if (numRings === 3) return [0.45, 0.68, 0.87];
      if (numRings === 4) return [0.38, 0.57, 0.74, 0.89];
      // 5 or more rings
      const arr = [];
      for (let i = 0; i < numRings; i++) {
        arr.push(0.32 + (i / (numRings - 1)) * 0.58);
      }
      return arr;
    }

    // Builds V5 "Top-Down Lever-Snap & 1-Pin Domino" Self-Supporting Stabilizer Rings (PETG-Ready):
    // Engineered specifically so pressing DOWNWARD from the top opening pops the ring out effortlessly:
    // 1. 1 Primary Pin per Rib with Top V-Peel Notch: Every rib grows a 45° self-supporting foot from a micro
    //    V-notch (`pinNeck` wide x ~0.50 mm tall = only 2-3 layers at the rib wall) up to the landing pad at `y1`.
    // 2. Sparse 2nd Upper Micro-Pin (Default: Only every 5th rib, or 0 = off): Eliminates the rigid 2-pin C-clamp
    //    on 80-100% of the ribs! When you push the ring down from above, the ring can freely tilt/rotate downward
    //    without pulling the top of the ribs inward.
    // 3. Angled Top-Down Lever Flange & Domino Flex Waist: The ring flares inward (`ringW`) with a sloped upper
    //    press surface (6.5x lever advantage relative to the thin V-notch neck) and features vertical Domino flex
    //    notches every `upperPinStep` ribs so pins peel sequentially like a zipper instead of all 48 at once!
    function buildStabilizerRingsGeometry() {
      if (state.stabilizerMode === 'none' || state.stabilizerCount <= 0) {
        return null;
      }

      const H = state.height;
      const numRings = Math.round(state.stabilizerCount);
      const numRibs = Math.round(state.ribCount);
      const ribD = state.ribDepth;
      const ribW = state.ribWidth;
      const twistRad = THREE.MathUtils.degToRad(state.twistAngle);
      const isBreakaway = state.stabilizerMode === 'breakaway';

      const ringW = state.stabilizerWidth || 3.4;
      const totalH = Math.max(2.6, state.stabilizerThickness || 3.8);
      const pinNeck = state.stabilizerNeck || 0.65;
      const upperPinStep = Math.round(state.upperPinStep !== undefined ? state.upperPinStep : 4);
      const rootBoostFactor = (state.rootBoost || 0) / 100;

      const positions = [];

      // Connects two N-vertex cross-sections with outward-facing triangles
      function pushSegmentQuads(secA, secB) {
        const n = secA.length;
        for (let c = 0; c < n; c++) {
          const cNext = (c + 1) % n;
          const v00 = secA[c];
          const v10 = secA[cNext];
          const v01 = secB[c];
          const v11 = secB[cNext];
          positions.push(...v00, ...v10, ...v11);
          positions.push(...v00, ...v11, ...v01);
        }
      }

      // Loft a watertight multi-station prism along vertical Z/Y stations (each station has 4 perimeter points)
      function pushWatertightLoft(stations) {
        for (let i = 0; i < stations.length - 1; i++) {
          pushSegmentQuads(stations[i], stations[i + 1]);
        }
        const first = stations[0];
        const last = stations[stations.length - 1];
        // Bottom cap
        positions.push(...first[0], ...first[2], ...first[1]);
        positions.push(...first[0], ...first[3], ...first[2]);
        // Top cap
        positions.push(...last[0], ...last[1], ...last[2]);
        positions.push(...last[0], ...last[2], ...last[3]);
      }

      // Builds a horizontal 4-vertex rectangular cross-section at height `y` between `[rInner, rOuter]` and width `w`
      function makeHorizontalSliceSection(rInner, rOuter, a, w, y) {
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);
        const halfW = w * 0.5;
        const pt = (r, s) => [r * cosA + s * halfW * sinA, y, -r * sinA + s * halfW * cosA];
        return [
          pt(rOuter, +1), // 0: Outer-Right
          pt(rOuter, -1), // 1: Outer-Left
          pt(rInner, -1), // 2: Inner-Left
          pt(rInner, +1)  // 3: Inner-Right
        ];
      }

      // Evaluates the exact inner rib radius and twist angle at any vertical height y (mm)
      function evalVaseInnerAtY(yMm) {
        const tClamped = Math.max(0.02, Math.min(0.98, yMm / H));
        const { r: rOuter } = evaluateOuterProfile(tClamped);
        let boost = 0;
        if (tClamped < 0.25 && rootBoostFactor > 0) {
          const uRoot = 1 - (tClamped / 0.25);
          boost = rootBoostFactor * (uRoot * uRoot);
        }
        const localRibD = ribD * (1 + boost * 0.65);
        return {
          rRibIn: rOuter - localRibD,
          localRibD,
          phi: twistRad * tClamped
        };
      }

      const tLevels = getStabilizerNormalizedHeights(numRings);
      const dTheta = (Math.PI * 2) / numRibs;

      for (let m = 0; m < tLevels.length; m++) {
        const tCenter = tLevels[m];
        const yCenter = tCenter * H;

        if (isBreakaway) {
          // =========================================================================
          // V5 "TOP-DOWN LEVER-SNAP & 1-PIN DOMINO" SYSTEM (PETG-OPTIMIZED):
          // - 1.4 mm air gap between ring outer wall and ribs for generous lever clearance.
          // - Bottom 45° corbel strut on every rib has an ultra-shallow V-Peel Notch
          //   right at the rib wall (`pinNeck` wide x ~0.52 mm high) and a pivot waist
          //   underneath the ring so pressing DOWN on the inner lever lip peels the
          //   pin cleanly along the layer lines with 6.5x mechanical advantage!
          // - Domino Flex Waist in the ring every N ribs lets the ring flex in Z when
          //   pushed down from the top opening, snapping 3-5 pins at a time like a zipper!
          // - 2nd Upper Micro-Pin is placed ONLY every `upperPinStep`-th rib (default: 5).
          // =========================================================================
          const airGap = 1.4; // 1.4 mm clearance gap between ring outer wall and rib inner wall
          const pinHBot = Math.max(0.48, Math.min(0.75, pinNeck * 0.78)); // ~0.50 mm contact height at rib (2-3 layers!)
          const climbH = 2.15; // 45° self-supporting climb height from rib detachment to landing pad
          const ringBodyH = Math.max(2.1, totalH * 0.64); // Height of the polygonal lever ring
          const upperClimbH = 1.35; // 45° climb height for the sparse upper micro-pin
          const pinHTop = Math.max(0.42, Math.min(0.62, pinNeck * 0.70)); // Delicate ~0.46 mm upper micro-pin height

          const y1 = Math.max(state.baseThickness + 3.4, yCenter - ringBodyH * 0.4); // Ring bottom (landing pad top)
          const y0 = y1 - climbH - pinHBot; // Where lower 45° strut starts inside the rib
          const y2 = Math.min(H - state.topRingHeight - 1.5, y1 + ringBodyH); // Ring outer top
          const yBevel = y1 + Math.min(1.25, (y2 - y1) * 0.50);

          const vY0    = evalVaseInnerAtY(y0);
          const vY0Pin = evalVaseInnerAtY(y0 + pinHBot);
          const vY1    = evalVaseInnerAtY(y1);
          const vBev   = evalVaseInnerAtY(yBevel);
          const vY2    = evalVaseInnerAtY(y2);

          // Widths for the lower 45° corbel strut and sparse upper micro-pin
          const wRibNeck = Math.min(ribW * 0.62, pinNeck); // Narrow ~0.65 mm breakaway V-neck at the rib wall
          const wRibAnchor = Math.min(ribW * 0.74, pinNeck * 1.15); // Anchor inside the rib
          const wLandingPad = Math.min(ribW * 1.35, Math.max(2.3, pinNeck * 3.4)); // Wide ~2.4-2.9 mm landing pad at y1!
          const ribEmbed = Math.min(ribD * 0.35, 0.50);
          const botChordW = Math.min(ringW, 1.55); // Bottom chord width resting on the landing pads

          // Domino grouping interval (matches upperPinStep if >= 2, otherwise every 4 ribs)
          const dominoGroup = upperPinStep >= 2 ? upperPinStep : 4;

          // 1. Build the 48-sided Polygonal Ring with Angled Top-Down Lever Lip & Domino Relief Waist
          const polyRingSections = [];
          for (let k = 0; k < numRibs; k++) {
            const baseAngle = k * dTheta;
            const a1   = baseAngle + vY1.phi;
            const aBev = baseAngle + vBev.phi;
            const a2   = baseAngle + vY2.phi;

            // Domino Flex Notch: at the boundary of each 5-rib lever segment, dip the upper inner flange
            // slightly in Z and radial width while keeping the bottom 1.2 mm belt 100% continuous for XY stiffness!
            const isDominoJoint = (k % dominoGroup === 0);
            const leverFlangeScale = isDominoJoint ? 0.72 : 1.08; // Wide lever paddle in between, flex waist at joint
            const localTopDrop = isDominoJoint ? (y2 - y1) * 0.32 : 0.0;

            const rRingOut1   = Math.max(12, vY1.rRibIn - airGap);
            const rRingOutBev = Math.max(12, vBev.rRibIn - airGap);
            const rRingOut2   = Math.max(12, vY2.rRibIn - airGap);

            const rRingIn1   = Math.max(8, rRingOut1 - botChordW);
            const rRingInBev = Math.max(8, rRingOutBev - ringW * leverFlangeScale);
            // Sloped Top-Down Lever Lip: inner top edge sits ~0.45 mm lower than outer top edge so pressing
            // straight down from the top opening catches the angled lever paddle and tilts the ring downward!
            const rRingIn2   = Math.max(8, rRingOut2 - (ringW + 0.45) * leverFlangeScale);
            const yTopOuter  = y2 - localTopDrop * 0.5;
            const yTopInner  = y2 - 0.42 - localTopDrop;

            polyRingSections.push([
              [rRingOut2  * Math.cos(a2),   yTopOuter, -rRingOut2  * Math.sin(a2)],   // V0: Top-Outer
              [rRingOut1  * Math.cos(a1),   y1,        -rRingOut1  * Math.sin(a1)],   // V1: Bottom-Outer (rests on pad)
              [rRingIn1   * Math.cos(a1),   y1,        -rRingIn1   * Math.sin(a1)],   // V2: Bottom-Inner (rests on pad)
              [rRingInBev * Math.cos(aBev), yBevel,    -rRingInBev * Math.sin(aBev)], // V3: 45° Bevel-Inner
              [rRingIn2   * Math.cos(a2),   yTopInner, -rRingIn2   * Math.sin(a2)]    // V4: Top-Inner (Sloped Lever Lip!)
            ]);
          }

          for (let k = 0; k < numRibs; k++) {
            pushSegmentQuads(polyRingSections[k], polyRingSections[(k + 1) % numRibs]);
          }

          // 2. Build the 48 Self-Supporting Lower 45° Lever-Notch Struts & Sparse (Every N-th) Upper Micro-Pins
          for (let k = 0; k < numRibs; k++) {
            const baseAngle = k * dTheta;

            // --- LOWER 45° CORBEL STRUT WITH TOP V-PEEL NOTCH & LEVER HINGE (Every Rib) ---
            const a0    = baseAngle + vY0.phi;
            const a0Pin = baseAngle + vY0Pin.phi;
            const a1    = baseAngle + vY1.phi;

            const rRingOut1 = Math.max(12, vY1.rRibIn - airGap);
            const rRingIn1  = Math.max(8, rRingOut1 - botChordW);

            const lowerStrutStations = [
              // Station 0 (y0): Starts inside the rib (0 overhang!)
              makeHorizontalSliceSection(
                vY0.rRibIn + 0.02,
                vY0.rRibIn + ribEmbed,
                a0,
                wRibAnchor,
                y0
              ),
              // Station 1 (y0 + pinHBot): Grows ~0.55 mm inward at 45° while still anchored in the rib
              makeHorizontalSliceSection(
                vY0Pin.rRibIn - 0.58,
                vY0Pin.rRibIn + ribEmbed,
                a0Pin,
                wRibNeck,
                y0 + pinHBot
              ),
              // Station 2 (y0 + pinHBot + 0.06): Detaches from the rib wall with a sharp V-Peel Notch (`wRibNeck` thin!)
              // Leaving only `pinHBot` (~0.50 mm = 2-3 layers) touching the rib so downward lever torque peels it cleanly!
              makeHorizontalSliceSection(
                vY0Pin.rRibIn - 0.68,
                vY0Pin.rRibIn - 0.12,
                a0Pin,
                wRibNeck * 0.92,
                y0 + pinHBot + 0.06
              ),
              // Station 3 (y1): Climbs at 45° to reach the exact bottom of the polygonal ring (`rRingIn1 .. rRingOut1`)
              // and widens to `wLandingPad` so the ring bridges 100% supported on top of the 48 pads!
              makeHorizontalSliceSection(
                rRingIn1 - 0.05,
                rRingOut1 + 0.04,
                a1,
                wLandingPad,
                y1
              ),
              // Station 4 (y1 + 0.65): Embeds 0.65 mm into the polygonal ring body for a solid union with the ring
              makeHorizontalSliceSection(
                rRingIn1 - 0.12,
                rRingOut1,
                a1,
                wLandingPad * 0.88,
                y1 + 0.65
              )
            ];
            pushWatertightLoft(lowerStrutStations);

            // --- SPARSE 2ND UPPER 45° MICRO-PIN (ONLY every `upperPinStep`-th rib, e.g. every 5th rib!) ---
            const hasUpperPin = (upperPinStep > 0) && (k % upperPinStep === 0);
            if (hasUpperPin) {
              const yUpperStart = y2 - upperClimbH;
              const yUpperTouch = y2 - pinHTop * 0.65;
              const yUpperEnd   = y2 + pinHTop * 0.35;

              const vUpStart = evalVaseInnerAtY(yUpperStart);
              const vUpTouch = evalVaseInnerAtY(yUpperTouch);
              const vUpEnd   = evalVaseInnerAtY(yUpperEnd);

              const aUpStart = baseAngle + vUpStart.phi;
              const aUpTouch = baseAngle + vUpTouch.phi;
              const aUpEnd   = baseAngle + vUpEnd.phi;

              const rOutUpStart = Math.max(12, vUpStart.rRibIn - airGap);
              const rOutUpTouch = Math.max(12, vUpTouch.rRibIn - airGap);
              const rOutUpEnd   = Math.max(12, vUpEnd.rRibIn - airGap);

              // Make the sparse upper pin extra delicate (80% of wRibNeck) so it snaps first when levering down
              const wUpperPinNeck = Math.max(0.42, wRibNeck * 0.80);

              const upperStrutStations = [
                // Station 0 (yUpperStart): Starts embedded inside the solid polygonal ring outer wall (0 overhang!)
                makeHorizontalSliceSection(
                  rOutUpStart - 0.90,
                  rOutUpStart,
                  aUpStart,
                  wUpperPinNeck * 1.5,
                  yUpperStart
                ),
                // Station 1 (yUpperTouch): Climbs outward at 45° across the 1.4 mm gap right up to the rib wall
                makeHorizontalSliceSection(
                  rOutUpTouch - 0.65,
                  vUpTouch.rRibIn - 0.05,
                  aUpTouch,
                  wUpperPinNeck,
                  yUpperTouch
                ),
                // Station 2 (yUpperTouch + 0.06): Micro-contact on the rib inner wall (`wUpperPinNeck` thin!)
                makeHorizontalSliceSection(
                  rOutUpTouch - 0.45,
                  vUpTouch.rRibIn + ribEmbed * 0.85,
                  aUpTouch,
                  wUpperPinNeck,
                  yUpperTouch + 0.06
                ),
                // Station 3 (yUpperEnd): Finishes at the top of the micro-pin (only ~2 layers tall on the rib)
                makeHorizontalSliceSection(
                  vUpEnd.rRibIn + 0.02,
                  vUpEnd.rRibIn + ribEmbed * 0.85,
                  aUpEnd,
                  wUpperPinNeck * 1.1,
                  yUpperEnd
                )
              ];
              pushWatertightLoft(upperStrutStations);
            }
          }
        } else {
          // =========================================================================
          // PERMANENT MODE: Smooth continuous vase-matched inner ring fused to ribs
          // =========================================================================
          const yBot = Math.max(state.baseThickness + 1.5, yCenter - totalH * 0.5);
          const yTop = Math.min(H - state.topRingHeight - 1.0, yCenter + totalH * 0.5);
          const yMid = yBot + (yTop - yBot) * 0.65;
          const vBot = evalVaseInnerAtY(yBot);
          const vMid = evalVaseInnerAtY(yMid);
          const vTop = evalVaseInnerAtY(yTop);
          const permSections = [];
          const subSteps = numRibs * 2;

          for (let s = 0; s < subSteps; s++) {
            const baseAngle = (s / subSteps) * Math.PI * 2;
            const aBot = baseAngle + vBot.phi;
            const aMid = baseAngle + vMid.phi;
            const aTop = baseAngle + vTop.phi;
            const embed = 0.8;

            const rOutBot = vBot.rRibIn + embed;
            const rOutTop = vTop.rRibIn + embed;
            const rInBot  = vBot.rRibIn - 0.4;
            const rInMid  = Math.max(10, vMid.rRibIn - ringW);
            const rInTop  = Math.max(10, vTop.rRibIn - ringW);

            permSections.push([
              [rOutTop * Math.cos(aTop), yTop, -rOutTop * Math.sin(aTop)],
              [rOutBot * Math.cos(aBot), yBot, -rOutBot * Math.sin(aBot)],
              [rInBot  * Math.cos(aBot), yBot, -rInBot  * Math.sin(aBot)],
              [rInMid  * Math.cos(aMid), yMid, -rInMid  * Math.sin(aMid)],
              [rInTop  * Math.cos(aTop), yTop, -rInTop  * Math.sin(aTop)]
            ]);
          }
          for (let s = 0; s < subSteps; s++) {
            pushSegmentQuads(permSections[s], permSections[(s + 1) % subSteps]);
          }
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.computeVertexNormals();
      return geo;
    }

    // ============================================================================
    // 2-LAYER 3D SCULPTED RELIEF MOTIF ENGINE (100% Support-Free <= 43° Overhang)
    // ============================================================================
    // Solves both visual recognizability AND support-free FDM 3D printing:
    // 1. True Proportional Millimeter Sizing (`motifSize` scales BOTH height and width,
    //    spanning across multiple ribs without being squished into 1 rib gap!).
    // 2. Proud 3D Faceted Front Relief (`+motifRelief` mm in front of the outer rib surface):
    //    The symbol silhouette stands proud in front of the vertical ribs with a 3D origami
    //    center ridge so vertical ribs NEVER slice through the front of the Christmas tree,
    //    Star, Snowflake, or Heart!
    // 3. Recessed 42° Rib-Plane Carrier: Wherever a wide lower branch (e.g. Tier 1 of the
    //    Christmas Tree or lower rays of the Star) crosses an open air gap between ribs,
    //    a recessed 42° gothic carrier bridges from the adjacent ribs behind the trunk so
    //    every single overhang is strictly <= 43° without needing any Slicer supports!
    function buildMotifsGeometry() {
      if (!state.motifType || state.motifType === 'none' || state.motifCount <= 0) {
        return null;
      }

      const H = state.height;
      const numRibs = Math.round(state.ribCount);
      const ribD = state.ribDepth;
      const twistRad = THREE.MathUtils.degToRad(state.twistAngle);
      const dTheta = (Math.PI * 2) / numRibs;

      const countPerRow = Math.min(Math.floor(numRibs / 2), Math.max(2, Math.round(state.motifCount || 6)));
      const numRows = Math.max(1, Math.min(3, Math.round(state.motifRows || 2)));
      const motifH = Math.max(14, state.motifSize || 30);
      const widthScale = (state.motifWidthScale || 100) / 100;
      const reliefMm = Math.max(1.0, state.motifRelief || 2.4);
      const centerRatio = (state.motifHeightRatio || 50) / 100;

      const positions = [];

      // Maps local millimeter coordinates `(xMm, yMm, zRelOuterMm)` around `baseRibIdx` onto the 3D lantern shell.
      // `zRelOuterMm = 0` is the exact outer surface of the ribs;
      // `zRelOuterMm > 0` projects proud in front of the ribs (3D relief!);
      // `zRelOuterMm < 0` embeds into the rib depth (`-ribD` is the inner rib wall).
      function shellPointMm(baseRibIdx, xMm, yMm, zRelOuterMm) {
        const yClamped = Math.max(state.baseThickness + 1.8, Math.min(H - state.topRingHeight - 1.8, yMm));
        const t = yClamped / H;
        const { r: rOuter } = evaluateOuterProfile(t);
        const rShell = Math.max(20, rOuter - ribD * 0.35);
        const rad = rOuter + zRelOuterMm;
        const centerAngle = baseRibIdx * dTheta + twistRad * t;
        const angle = centerAngle + (xMm / rShell);
        return [rad * Math.cos(angle), yClamped, -rad * Math.sin(angle)];
      }

      // Lofts a watertight 3D faceted relief solid from a vertical sequence of horizontal slices.
      // Each slice: `{ y, xL, xR, zFront, zRidge, zBack }`
      // - `xL`, `xR`: left and right horizontal positions in mm
      // - `zFront`: outer edge relief height in front of ribs (mm)
      // - `zRidge`: center ridge 3D pyramid height in front of ribs (mm)
      // - `zBack`: inner embedding depth into the ribs (mm, typically negative)
      function addReliefLoft(baseRibIdx, slices) {
        if (!slices || slices.length < 2) return;
        const rings = [];
        for (let i = 0; i < slices.length; i++) {
          const s = slices[i];
          const xMid = 0.5 * (s.xL + s.xR);
          const halfW = 0.5 * (s.xR - s.xL);
          // Slight inward back-taper so side walls angle cleanly into the ribs
          const xLBack = xMid - halfW * 0.92;
          const xRBack = xMid + halfW * 0.92;

          // 6-vertex faceted cross-section:
          // 0: Front-Center Ridge, 1: Front-Right, 2: Back-Right, 3: Back-Center, 4: Back-Left, 5: Front-Left
          rings.push([
            shellPointMm(baseRibIdx, xMid,   s.y, s.zRidge),
            shellPointMm(baseRibIdx, s.xR,   s.y, s.zFront),
            shellPointMm(baseRibIdx, xRBack, s.y, s.zBack),
            shellPointMm(baseRibIdx, xMid,   s.y, s.zBack - 0.25),
            shellPointMm(baseRibIdx, xLBack, s.y, s.zBack),
            shellPointMm(baseRibIdx, s.xL,   s.y, s.zFront)
          ]);
        }

        const n = 6;
        for (let i = 0; i < rings.length - 1; i++) {
          const rA = rings[i];
          const rB = rings[i + 1];
          for (let c = 0; c < n; c++) {
            const cNext = (c + 1) % n;
            positions.push(...rA[c], ...rA[cNext], ...rB[cNext]);
            positions.push(...rA[c], ...rB[cNext], ...rB[c]);
          }
        }
        // Watertight bottom & top end caps
        const first = rings[0];
        const last = rings[rings.length - 1];
        for (let c = 1; c < n - 1; c++) {
          positions.push(...first[0], ...first[c + 1], ...first[c]);
          positions.push(...last[0], ...last[c], ...last[c + 1]);
        }
      }

      // Adds a self-supporting 45°-keel 3D bar between two arbitrary `(x, y)` points on the shell
      // (used for snowflake crystal side-arms & recessed rib-plane support arches)
      function addFacetedBarMm(baseRibIdx, x0, y0, w0, x1, y1, w1, zFront, zRidge, zBack, steps = 5) {
        const rings = [];
        for (let s = 0; s <= steps; s++) {
          const f = s / steps;
          const x = x0 + (x1 - x0) * f;
          const y = y0 + (y1 - y0) * f;
          const w = w0 + (w1 - w0) * f;
          const ramp = (s === 0 || s === steps) ? 0.15 : 1.0;
          const zF = zFront * ramp;
          const zR = zRidge * ramp;
          const keelDrop = Math.min(1.6, w * 0.48);

          rings.push([
            shellPointMm(baseRibIdx, x,            y + keelDrop * 0.25, zR),
            shellPointMm(baseRibIdx, x + w * 0.5,  y,                   zF),
            shellPointMm(baseRibIdx, x + w * 0.42, y,                   zBack),
            shellPointMm(baseRibIdx, x,            y - keelDrop,        zBack - 0.2),
            shellPointMm(baseRibIdx, x - w * 0.42, y,                   zBack),
            shellPointMm(baseRibIdx, x - w * 0.5,  y,                   zF)
          ]);
        }
        const n = 6;
        for (let s = 0; s < steps; s++) {
          const rA = rings[s];
          const rB = rings[s + 1];
          for (let c = 0; c < n; c++) {
            const cNext = (c + 1) % n;
            positions.push(...rA[c], ...rA[cNext], ...rB[cNext]);
            positions.push(...rA[c], ...rB[cNext], ...rB[c]);
          }
        }
        const first = rings[0];
        const last = rings[steps];
        for (let c = 1; c < n - 1; c++) {
          positions.push(...first[0], ...first[c + 1], ...first[c]);
          positions.push(...last[0], ...last[c], ...last[c + 1]);
        }
      }

      // Adds recessed 42° Gothic Support Arches in the rib plane (`zFront = -0.15 mm`, `zBack = -ribD * 0.72`)
      // underneath wide motif overhangs so they bridge across rib gaps 100% support-free while staying
      // visually recessed behind the proud `+2.4 mm` 3D motif silhouette!
      function addRecessedRibCarrier(baseRibIdx, targetHalfWidthMm, yBridgeTop) {
        const t = Math.max(0.08, Math.min(0.92, yBridgeTop / H));
        const { r: rOuter } = evaluateOuterProfile(t);
        const ribPitchMm = ((2 * Math.PI) / numRibs) * (rOuter - ribD * 0.35);
        const zBackCarrier = -ribD * 0.68;
        const zFrontCarrier = -0.10; // Recessed behind the outer rib face so the proud trunk stands out!

        // Determine how many rib pitches `targetHalfWidthMm` spans
        const maxSpanRibs = Math.max(1, Math.ceil(targetHalfWidthMm / ribPitchMm));
        for (let r = 0; r < maxSpanRibs; r++) {
          const xInnerRib = r * ribPitchMm;
          const xOuterRib = Math.min(targetHalfWidthMm * 0.96, (r + 1) * ribPitchMm);
          if (xOuterRib <= xInnerRib + 1.0) continue;
          const xMidGap = 0.5 * (xInnerRib + xOuterRib);
          const halfGap = 0.5 * (xOuterRib - xInnerRib);
          const climbH = Math.max(2.6, halfGap * 1.08); // 42° support-free rise!
          const yStart = yBridgeTop - climbH;

          // Left & Right rising 42° gothic half-arches from each rib meeting at `yBridgeTop`
          [-1, +1].forEach(dir => {
            addReliefLoft(baseRibIdx, [
              { y: yStart,              xL: dir * xInnerRib - 0.9, xR: dir * xInnerRib + 0.9, zFront: zFrontCarrier - 0.5, zRidge: zFrontCarrier - 0.3, zBack: zBackCarrier },
              { y: yBridgeTop - 0.4,    xL: Math.min(dir * xInnerRib, dir * xMidGap) - 0.8, xR: Math.max(dir * xInnerRib, dir * xMidGap) + 0.8, zFront: zFrontCarrier, zRidge: zFrontCarrier + 0.15, zBack: zBackCarrier },
              { y: yBridgeTop + 0.8,    xL: Math.min(dir * xInnerRib, dir * xMidGap) - 0.6, xR: Math.max(dir * xInnerRib, dir * xMidGap) + 0.6, zFront: zFrontCarrier, zRidge: zFrontCarrier + 0.15, zBack: zBackCarrier }
            ]);
            addReliefLoft(baseRibIdx, [
              { y: yStart,              xL: dir * xOuterRib - 0.9, xR: dir * xOuterRib + 0.9, zFront: zFrontCarrier - 0.5, zRidge: zFrontCarrier - 0.3, zBack: zBackCarrier },
              { y: yBridgeTop - 0.4,    xL: Math.min(dir * xOuterRib, dir * xMidGap) - 0.8, xR: Math.max(dir * xOuterRib, dir * xMidGap) + 0.8, zFront: zFrontCarrier, zRidge: zFrontCarrier + 0.15, zBack: zBackCarrier },
              { y: yBridgeTop + 0.8,    xL: Math.min(dir * xOuterRib, dir * xMidGap) - 0.6, xR: Math.max(dir * xOuterRib, dir * xMidGap) + 0.6, zFront: zFrontCarrier, zRidge: zFrontCarrier + 0.15, zBack: zBackCarrier }
            ]);
          });
        }
      }

      function buildSingleMotif(type, slotRibIdx, yCenter) {
        const R = motifH * 0.5; // Vertical half-height in mm
        // Proportional half-width in mm (clamped so adjacent motifs never collide and overhangs stay <= 43°)
        const W = motifH * 0.46 * widthScale;
        const zBack = -ribD * 0.58;
        const zEdge = reliefMm * 0.78;
        const zPeak = reliefMm * 1.32;
        const bevelH = Math.max(2.0, reliefMm * 1.05); // 45° radial ramp height

        if (type === 'tree') {
          // =========================================================================
          // 🎄 3D TANNENBAUM (Classic 3-Tiered Christmas Tree with Trunk & Star Tip)
          // =========================================================================
          const yBot      = yCenter - R;
          const yTrunkTop = yCenter - R * 0.44;
          const yTier1Bot = yCenter - R * 0.32;
          const yTier1Top = yCenter - R * 0.16;
          const yWaist1   = yCenter - R * 0.11;
          const yTier2Wide= yCenter + R * 0.20;
          const yTier2Top = yCenter + R * 0.28;
          const yWaist2   = yCenter + R * 0.33;
          const yTier3Wide= yCenter + R * 0.56;
          const yTreePeak = yCenter + R * 1.02;

          // Enforce <= 43° self-supporting expansion on Tier 2 and Tier 3
          const wTrunk = Math.max(2.2, W * 0.20);
          const wTier1 = W * 1.00;
          const wWaist1 = W * 0.36;
          const maxAddTier2 = (yTier2Wide - yWaist1) * 0.94;
          const wTier2 = Math.min(W * 0.80, wWaist1 + maxAddTier2);
          const wWaist2 = W * 0.26;
          const maxAddTier3 = (yTier3Wide - yWaist2) * 0.94;
          const wTier3 = Math.min(W * 0.56, wWaist2 + maxAddTier3);

          // 1. Recessed 42° Rib-Plane Carrier under Tier 1 so the wide lower branch prints 100% support-free
          addRecessedRibCarrier(slotRibIdx, wTier1, yTier1Bot);

          // 2. Proud 3D Sculpted Christmas Tree (Trunk + 3 Stepped Branch Tiers + Sharp Peak)
          addReliefLoft(slotRibIdx, [
            // Trunk base: 45° radial ramp out from central rib
            { y: yBot,            xL: -wTrunk * 0.65, xR: +wTrunk * 0.65, zFront: -0.2,        zRidge: 0.0,         zBack },
            { y: yBot + bevelH,   xL: -wTrunk,        xR: +wTrunk,        zFront: zEdge * 0.9, zRidge: zPeak * 0.9, zBack },
            // Crisp vertical Baumstamm (Tree Trunk)
            { y: yTrunkTop,       xL: -wTrunk * 1.05, xR: +wTrunk * 1.05, zFront: zEdge * 0.9, zRidge: zPeak * 0.9, zBack },
            // 1. Untere Ast-Etage (Flares out at 45° on top of the recessed rib carrier to full width wTier1!)
            { y: yTier1Bot,       xL: -wTier1,        xR: +wTier1,        zFront: zEdge,       zRidge: zPeak * 1.08, zBack },
            { y: yTier1Top,       xL: -wTier1 * 0.88, xR: +wTier1 * 0.88, zFront: zEdge,       zRidge: zPeak * 1.05, zBack },
            // Sharp horizontal branch step inward to Waist 1 (100% supported by Tier 1 directly below!)
            { y: yWaist1,         xL: -wWaist1,       xR: +wWaist1,       zFront: zEdge * 0.85,zRidge: zPeak * 0.95, zBack },
            // 2. Mittlere Ast-Etage (Climbs outward at <= 43° to wTier2)
            { y: yTier2Wide,      xL: -wTier2,        xR: +wTier2,        zFront: zEdge,       zRidge: zPeak * 1.08, zBack },
            { y: yTier2Top,       xL: -wTier2 * 0.88, xR: +wTier2 * 0.88, zFront: zEdge,       zRidge: zPeak * 1.04, zBack },
            // Sharp horizontal branch step inward to Waist 2 (100% supported by Tier 2 directly below!)
            { y: yWaist2,         xL: -wWaist2,       xR: +wWaist2,       zFront: zEdge * 0.85,zRidge: zPeak * 0.95, zBack },
            // 3. Obere Baumkrone (Climbs outward at <= 42° to wTier3)
            { y: yTier3Wide,      xL: -wTier3,        xR: +wTier3,        zFront: zEdge,       zRidge: zPeak * 1.06, zBack },
            // Tapers cleanly up to the proud Tannenbaum-Spitze!
            { y: yCenter + R*0.84,xL: -wTier3 * 0.36, xR: +wTier3 * 0.36, zFront: zEdge * 0.8, zRidge: zPeak * 0.9,  zBack },
            { y: yTreePeak,       xL: -0.45,          xR: +0.45,          zFront: 0.0,         zRidge: 0.3,          zBack }
          ]);

        } else if (type === 'star') {
          // =========================================================================
          // ★ 3D WEIHNACHTSSTERN (6-Point Faceted Advent Star with 3D Pyramid Jewel)
          // =========================================================================
          const yBotTip    = yCenter - R * 1.02;
          const yBotNeck   = yCenter - R * 0.54;
          const yLowRay    = yCenter - R * 0.20;
          const yLowRayTop = yCenter - R * 0.13;
          const yStarWaist = yCenter - R * 0.05;
          const yUpRay     = yCenter + R * 0.28;
          const yUpRayTop  = yCenter + R * 0.35;
          const yTopNeck   = yCenter + R * 0.42;
          const yTopTip    = yCenter + R * 1.02;

          const wBotNeck   = Math.max(2.4, W * 0.28);
          const wLowRay    = W * 0.94;
          const wWaist     = W * 0.36;
          const maxAddUp   = (yUpRay - yStarWaist) * 0.95;
          const wUpRay     = Math.min(W * 1.02, wWaist + maxAddUp);
          const wTopNeck   = W * 0.28;

          // 1. Recessed 42° Rib-Plane Carrier under the wide lower star rays
          addRecessedRibCarrier(slotRibIdx, wLowRay, yLowRay);

          // 2. Proud 3D Faceted 6-Point Star Silhouette
          addReliefLoft(slotRibIdx, [
            // Bottom Star Point
            { y: yBotTip,         xL: -0.45,          xR: +0.45,          zFront: -0.1,        zRidge: 0.2,          zBack },
            { y: yBotTip + bevelH,xL: -wBotNeck * 0.6,xR: +wBotNeck * 0.6,zFront: zEdge * 0.8, zRidge: zPeak * 0.9,  zBack },
            { y: yBotNeck,        xL: -wBotNeck,      xR: +wBotNeck,      zFront: zEdge * 0.9, zRidge: zPeak * 1.0,  zBack },
            // Lower-Left & Lower-Right Star Rays
            { y: yLowRay,         xL: -wLowRay,       xR: +wLowRay,       zFront: zEdge,       zRidge: zPeak * 1.22, zBack },
            { y: yLowRayTop,      xL: -wLowRay * 0.86,xR: +wLowRay * 0.86,zFront: zEdge,       zRidge: zPeak * 1.25, zBack },
            // Deep Star Waist (supported from below by lower rays!)
            { y: yStarWaist,      xL: -wWaist,        xR: +wWaist,        zFront: zEdge * 0.9, zRidge: zPeak * 1.38, zBack },
            // Upper-Left & Upper-Right Main Star Rays (42° self-supporting climb)
            { y: yUpRay,          xL: -wUpRay,        xR: +wUpRay,        zFront: zEdge,       zRidge: zPeak * 1.22, zBack },
            { y: yUpRayTop,       xL: -wUpRay * 0.84, xR: +wUpRay * 0.84, zFront: zEdge,       zRidge: zPeak * 1.15, zBack },
            // Sharp step inward to Upper Star Spire Neck (supported from below!)
            { y: yTopNeck,        xL: -wTopNeck,      xR: +wTopNeck,      zFront: zEdge * 0.9, zRidge: zPeak * 1.05, zBack },
            // Tall Top Star Spire
            { y: yCenter + R*0.78,xL: -wTopNeck * 0.45,xR: +wTopNeck*0.45,zFront: zEdge * 0.75,zRidge: zPeak * 0.85, zBack },
            { y: yTopTip,         xL: -0.45,          xR: +0.45,          zFront: 0.0,         zRidge: 0.3,          zBack }
          ]);

        } else if (type === 'crystal') {
          // =========================================================================
          // ❄ 3D SCHNEEKRISTALL (Nordic 6-Arm Snowflake with Barbs & Raised Hex Core)
          // =========================================================================
          const barW = Math.max(2.2, motifH * 0.105);
          const hexW = W * 0.44;
          const hexH = R * 0.38;

          // 1. Recessed 42° Rib-Plane Carrier for the wide crystal arms
          addRecessedRibCarrier(slotRibIdx, W * 0.88, yCenter - R * 0.38);

          // 2. Central Vertical Crystal Pillar with Lower & Upper Chevron Barbs + Raised Hex Core
          addReliefLoft(slotRibIdx, [
            { y: yCenter - R * 1.00, xL: -0.5,        xR: +0.5,        zFront: -0.1,        zRidge: 0.2,          zBack },
            { y: yCenter - R * 0.78, xL: -W * 0.16,   xR: +W * 0.16,   zFront: zEdge * 0.85,zRidge: zPeak,        zBack },
            // Lower crystal barb chevron
            { y: yCenter - R * 0.56, xL: -W * 0.46,   xR: +W * 0.46,   zFront: zEdge,       zRidge: zPeak * 1.08, zBack },
            { y: yCenter - R * 0.46, xL: -W * 0.20,   xR: +W * 0.20,   zFront: zEdge * 0.9, zRidge: zPeak,        zBack },
            // Central Raised Hexagonal Ice Core
            { y: yCenter - hexH,     xL: -hexW * 0.65,xR: +hexW * 0.65,zFront: zEdge * 1.05,zRidge: zPeak * 1.32, zBack },
            { y: yCenter,            xL: -hexW,       xR: +hexW,       zFront: zEdge * 1.12,zRidge: zPeak * 1.40, zBack },
            { y: yCenter + hexH,     xL: -hexW * 0.65,xR: +hexW * 0.65,zFront: zEdge * 1.05,zRidge: zPeak * 1.32, zBack },
            // Upper crystal barb chevron
            { y: yCenter + R * 0.46, xL: -W * 0.20,   xR: +W * 0.20,   zFront: zEdge * 0.9, zRidge: zPeak,        zBack },
            { y: yCenter + R * 0.68, xL: -W * 0.46,   xR: +W * 0.46,   zFront: zEdge,       zRidge: zPeak * 1.08, zBack },
            { y: yCenter + R * 0.76, xL: -W * 0.22,   xR: +W * 0.22,   zFront: zEdge * 0.9, zRidge: zPeak,        zBack },
            { y: yCenter + R * 1.00, xL: -0.5,        xR: +0.5,        zFront: 0.0,         zRidge: 0.3,          zBack }
          ]);

          // 3. Four Diagonal 40° Snowflake Arms with Side Dendrite Barbs
          [-1, +1].forEach(dir => {
            // Lower diagonal crystal arm (climbs from outer bottom rib inward to Hex Core)
            addFacetedBarMm(slotRibIdx, dir * W * 0.92, yCenter - R * 0.56, barW * 0.9, 0, yCenter, barW * 1.25, zEdge, zPeak * 1.15, zBack, 5);
            // Upper diagonal crystal arm (climbs from Hex Core outward to upper crystal tip)
            addFacetedBarMm(slotRibIdx, 0, yCenter, barW * 1.25, dir * W * 0.95, yCenter + R * 0.58, barW * 0.9, zEdge, zPeak * 1.15, zBack, 5);
            // Vertical outer crystal dendrite barb on each upper arm
            addFacetedBarMm(slotRibIdx, dir * W * 0.58, yCenter + R * 0.32, barW * 0.85, dir * W * 0.60, yCenter + R * 0.72, barW * 0.65, zEdge * 0.95, zPeak, zBack, 3);
          });

        } else if (type === 'heart') {
          // =========================================================================
          // ♥ 3D WINTER-HERZ (Sculpted Solid 3D Relief Heart with Deep Upper Cleft)
          // =========================================================================
          const yBotTip   = yCenter - R * 0.94;
          const yLowCurve = yCenter - R * 0.42;
          const yMidCheek = yCenter + R * 0.06;
          const yMaxCheek = yCenter + R * 0.30;
          const yCleftBot = yCenter + R * 0.32;
          const yLobeMid  = yCenter + R * 0.64;
          const yLobeTop  = yCenter + R * 0.88;

          // Enforce <= 43° self-supporting lower heart curve
          const wLow  = Math.min(W * 0.48, (yLowCurve - yBotTip) * 0.92);
          const wMid  = Math.min(W * 0.88, wLow + (yMidCheek - yLowCurve) * 0.92);
          const wFull = Math.min(W * 1.02, wMid + (yMaxCheek - yMidCheek) * 0.92);

          // 1. Solid Lower & Middle Heart Body (from sharp bottom tip up to the top cleft split)
          addReliefLoft(slotRibIdx, [
            { y: yBotTip,          xL: -0.5,        xR: +0.5,        zFront: -0.1,        zRidge: 0.2,          zBack },
            { y: yBotTip + bevelH, xL: -wLow * 0.45,xR: +wLow * 0.45,zFront: zEdge * 0.85,zRidge: zPeak * 0.95, zBack },
            { y: yLowCurve,        xL: -wLow,       xR: +wLow,       zFront: zEdge,       zRidge: zPeak * 1.12, zBack },
            { y: yMidCheek,        xL: -wMid,       xR: +wMid,       zFront: zEdge * 1.05,zRidge: zPeak * 1.25, zBack },
            { y: yMaxCheek,        xL: -wFull,      xR: +wFull,      zFront: zEdge * 1.05,zRidge: zPeak * 1.22, zBack },
            { y: yCleftBot,        xL: -wFull * 0.98,xR: +wFull*0.98,zFront: zEdge,       zRidge: zPeak * 1.10, zBack }
          ]);

          // 2. Left & Right Rounded Upper Heart Lobes (sit directly on top of the solid lower heart -> 0 overhang!)
          [-1, +1].forEach(side => {
            const xOuter0 = side * wFull * 0.98;
            const xInner0 = side * wFull * 0.03;
            const xOuter1 = side * wFull * 0.86;
            const xInner1 = side * wFull * 0.18;
            const xOuter2 = side * wFull * 0.58;
            const xInner2 = side * wFull * 0.34;

            addReliefLoft(slotRibIdx, [
              { y: yCleftBot - 0.3, xL: Math.min(xOuter0, xInner0), xR: Math.max(xOuter0, xInner0), zFront: zEdge,        zRidge: zPeak * 1.15, zBack },
              { y: yLobeMid,        xL: Math.min(xOuter1, xInner1), xR: Math.max(xOuter1, xInner1), zFront: zEdge * 0.95, zRidge: zPeak * 1.08, zBack },
              { y: yLobeTop,        xL: Math.min(xOuter2, xInner2), xR: Math.max(xOuter2, xInner2), zFront: zEdge * 0.65, zRidge: zPeak * 0.75, zBack }
            ]);
          });
        }
      }

      const rowOffsets = numRows === 1
        ? [0]
        : (numRows === 2 ? [-0.15, +0.15] : [-0.22, 0, +0.22]);

      const mixCycle = ['tree', 'star', 'crystal'];

      for (let rIdx = 0; rIdx < rowOffsets.length; rIdx++) {
        const yRow = Math.max(
          state.baseThickness + motifH * 0.68,
          Math.min(H - state.topRingHeight - motifH * 0.68, (centerRatio + rowOffsets[rIdx]) * H)
        );
        const staggerSlots = (rIdx % 2 === 1) ? (numRibs / (countPerRow * 2)) : 0;

        for (let m = 0; m < countPerRow; m++) {
          const slotRibIdx = Math.round((m / countPerRow) * numRibs + staggerSlots) % numRibs;
          let subType = state.motifType;
          if (subType === 'mix') {
            subType = mixCycle[(m + rIdx) % mixCycle.length];
          }
          buildSingleMotif(subType, slotRibIdx, yRow);
        }
      }

      if (positions.length === 0) return null;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.computeVertexNormals();
      return geo;
    }

    function mergeBufferGeometries(geos) {
      let totalFloats = 0;
      geos.forEach(g => {
        totalFloats += g.attributes.position.array.length;
      });
      const merged = new Float32Array(totalFloats);
      let offset = 0;
      geos.forEach(g => {
        const arr = g.attributes.position.array;
        merged.set(arr, offset);
        offset += arr.length;
        g.dispose();
      });
      const outGeo = new THREE.BufferGeometry();
      outGeo.setAttribute('position', new THREE.BufferAttribute(merged, 3));
      outGeo.computeVertexNormals();
      return outGeo;
    }

    function buildCompleteLanternGeometry() {
      // 1. Watertight Base Plate with Anti-Slip Candle Recess & 45° Bottom Chamfer (against Elephant's Foot)
      const rBaseOuter = state.baseOuterDia / 2;
      const recessInnerRadius = (state.candleDia / 2) + state.candleClearance;
      const rimOuterRadius = Math.min(rBaseOuter - 1.2, recessInnerRadius + state.recessRimWidth);
      const baseH = state.baseThickness;
      const safeRecessDepth = Math.min(state.recessDepth, baseH - 1.2);
      const floorY = baseH - safeRecessDepth;
      const baseChamfer = 0.8;

      const baseProfile = [
        { r: 0,                                y: 0 },
        { r: rBaseOuter - baseChamfer,         y: 0 },
        { r: rBaseOuter,                       y: baseChamfer },
        { r: rBaseOuter,                       y: baseH - 0.6 },
        { r: rBaseOuter - 0.6,                 y: baseH },
        { r: rimOuterRadius,                   y: baseH },
        { r: recessInnerRadius + 0.5,          y: baseH },
        { r: recessInnerRadius,                y: baseH - 0.5 },
        { r: recessInnerRadius,                y: floorY + 0.4 },
        { r: Math.max(0, recessInnerRadius - 0.4), y: floorY },
        { r: 0,                                y: floorY }
      ];
      const baseGeo = buildClosedLatheGeometry(baseProfile, 72);

      // 2. Watertight Self-Supporting Top Stabilizer Ring (connects all ribs cleanly at the top opening)
      // Engineered with a 42° conical lower skirt that follows the exact inward slope of the ribs so
      // it prints 100% without support and without any flat horizontal overhang!
      const H = state.height;
      const ringH = state.topRingHeight;
      const rTopInner = state.topInnerDia / 2;
      const rTopOuter = rTopInner + state.ribDepth;
      const bev = Math.min(0.7, ringH * 0.22);

      // Conical 42° lower transition skirt from the rib profile at (H - ringH - skirtH) into the top ring
      const skirtH = Math.max(2.6, state.ribDepth * 0.65);
      const ySkirtBot = Math.max(state.baseThickness + 10, H - ringH - skirtH);
      const { r: rOuterAtSkirtBot } = evaluateOuterProfile(ySkirtBot / H);
      const { r: rOuterAtRingBot }  = evaluateOuterProfile((H - ringH) / H);
      const rInnerAtSkirtBot = rOuterAtSkirtBot - state.ribDepth * 0.82;
      const rInnerAtRingBot  = Math.min(rOuterAtRingBot - state.ribDepth * 0.95, rTopInner + skirtH * 0.35);

      const topRingProfile = [
        // Starts embedded inside the already-merged gothic rib arch at ySkirtBot (zero overhang in air!)
        { r: rInnerAtSkirtBot,       y: ySkirtBot },
        { r: rOuterAtSkirtBot - 0.1, y: ySkirtBot },
        // Rises along the outer vase curve up to H - ringH and H
        { r: rOuterAtRingBot,        y: H - ringH },
        { r: rTopOuter,              y: H - bev },
        { r: rTopOuter - bev,        y: H },
        // Top flat rim with inner bevel
        { r: rTopInner + bev,        y: H },
        { r: rTopInner,              y: H - bev },
        // Inner wall tapers outward going down (42° self-supporting draft angle) back into the rib arch
        { r: rTopInner,              y: H - ringH * 0.55 },
        { r: rInnerAtRingBot,        y: H - ringH }
      ];
      const topRingGeo = buildClosedLatheGeometry(topRingProfile, 72);

      // 3. Curved Parametric Ribs (including top gothic arch transition)
      const { geo: ribsGeo, maxOverhangAngleDeg } = buildRibsGeometry();

      // 4. Optional Anti-Vibration Stabilizer Rings (Breakaway or Permanent)
      const stabGeo = buildStabilizerRingsGeometry();
      // 5. Optional Support-Free 3D Sculpted Decorative Christmas Trees, Stars & Winter Symbols
      const motifsGeo = buildMotifsGeometry();
      let breakawayPreviewGeo = null;
      let motifsPreviewGeo = null;

      const geosToMerge = [baseGeo, topRingGeo, ribsGeo];
      if (motifsGeo) {
        motifsPreviewGeo = motifsGeo.clone();
        geosToMerge.push(motifsGeo);
      }
      if (stabGeo) {
        if (state.stabilizerMode === 'breakaway') {
          // Keep a clone for visual cyan highlight in the 3D viewport so user sees what gets snipped off
          breakawayPreviewGeo = stabGeo.clone();
        }
        geosToMerge.push(stabGeo);
      }

      const fullGeo = mergeBufferGeometries(geosToMerge);
      return { fullGeo, breakawayPreviewGeo, motifsPreviewGeo, maxOverhangAngleDeg };
    }

    /********************************************************************
     * 4. REBUILD SCENE & VISUAL LED CANDLE
     ********************************************************************/
    function rebuildAll() {
      if (!scene) return;

      // Clear previous lantern mesh
      while (lanternGroup.children.length > 0) {
        const child = lanternGroup.children[0];
        if (child.geometry) child.geometry.dispose();
        lanternGroup.remove(child);
      }

      const { fullGeo, breakawayPreviewGeo, motifsPreviewGeo, maxOverhangAngleDeg } = buildCompleteLanternGeometry();
      if (currentLanternGeometry) currentLanternGeometry.dispose();
      currentLanternGeometry = fullGeo;

      const activeClips = state.sectionView ? [clippingPlane] : [];

      const lanternMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.lanternColor),
        roughness: 0.58,
        metalness: 0.06,
        side: THREE.DoubleSide,
        clippingPlanes: activeClips,
        clipShadows: true
      });

      lanternMesh = new THREE.Mesh(currentLanternGeometry, lanternMat);
      lanternMesh.castShadow = true;
      lanternMesh.receiveShadow = true;
      lanternGroup.add(lanternMesh);

      // Subtle 3D Relief Specular / Contrast Overlay on the decorative motifs so their 3D facets pop clearly in the viewport
      if (motifsPreviewGeo) {
        const baseCol = new THREE.Color(state.lanternColor);
        const highlightCol = baseCol.clone().lerp(new THREE.Color(0xfff3db), 0.28);
        const motifHighlightMat = new THREE.MeshStandardMaterial({
          color: highlightCol,
          roughness: 0.36,
          metalness: 0.14,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
          clippingPlanes: activeClips
        });
        const motifHighlightMesh = new THREE.Mesh(motifsPreviewGeo, motifHighlightMat);
        lanternGroup.add(motifHighlightMesh);
      }

      // Highlight breakaway stabilizer bridges in subtle teal so user immediately spots where they sit
      if (breakawayPreviewGeo) {
        const breakawayMat = new THREE.MeshBasicMaterial({
          color: 0x2dd4bf,
          transparent: true,
          opacity: 0.65,
          depthTest: true,
          clippingPlanes: activeClips
        });
        const breakawayOverlay = new THREE.Mesh(breakawayPreviewGeo, breakawayMat);
        breakawayOverlay.scale.set(1.001, 1.001, 1.001);
        lanternGroup.add(breakawayOverlay);
      }

      // Rebuild Visual LED Candle in the center
      while (candleGroup.children.length > 0) {
        const child = candleGroup.children[0];
        if (child.geometry) child.geometry.dispose();
        candleGroup.remove(child);
      }

      const safeRecessDepth = Math.min(state.recessDepth, state.baseThickness - 1.2);
      const floorY = state.baseThickness - safeRecessDepth;

      if (state.showCandle) {
        const cRadius = state.candleDia / 2;
        const cHeight = state.candleHeight;

        // Main Wax / LED Pillar Body
        const candleGeo = new THREE.CylinderGeometry(cRadius, cRadius, cHeight, 48);
        candleGeo.translate(0, cHeight / 2, 0);
        const candleMat = new THREE.MeshStandardMaterial({
          color: 0xfffaf0,
          emissive: 0xff9d3b,
          emissiveIntensity: (state.lightIntensity / 100) * 0.22,
          roughness: 0.35,
          metalness: 0.0,
          clippingPlanes: activeClips
        });
        const candleBody = new THREE.Mesh(candleGeo, candleMat);
        candleGroup.add(candleBody);

        // LED Flame Tip
        const flameGeo = new THREE.ConeGeometry(4.2, 13, 24);
        flameGeo.translate(0, 6.5, 0);
        const flameMat = new THREE.MeshBasicMaterial({
          color: 0xffd27d
        });
        flameMesh = new THREE.Mesh(flameGeo, flameMat);
        flameMesh.position.set(0, cHeight + 1, 0);
        candleGroup.add(flameMesh);

        // Optional Glass Hurricane Cylinder (like in the reference photos)
        if (state.showGlassSleeve) {
          const glassRadius = cRadius + Math.max(1.0, state.candleClearance * 0.7);
          const glassHeight = Math.min(state.height - 14, cHeight + 18);
          const glassGeo = new THREE.CylinderGeometry(glassRadius, glassRadius, glassHeight, 48, 1, true);
          glassGeo.translate(0, glassHeight / 2, 0);
          const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.24,
            roughness: 0.08,
            metalness: 0.1,
            side: THREE.DoubleSide,
            clippingPlanes: activeClips
          });
          const glassMesh = new THREE.Mesh(glassGeo, glassMat);
          candleGroup.add(glassMesh);
        }

        candleGroup.position.set(0, floorY, 0);
        candlePointLight.position.set(0, floorY + cHeight + 12, 0);
        candlePointLight.visible = true;
      } else {
        candlePointLight.visible = false;
      }

      updatePrintabilityChecks(maxOverhangAngleDeg);
    }

    /********************************************************************
     * 5. LIVE 3D-PRINTABILITY & CANDLE FIT VALIDATION
     ********************************************************************/
    function updatePrintabilityChecks(maxOverhangDeg) {
      const recessInnerDia = state.candleDia + state.candleClearance * 2;
      const safeRecessDepth = Math.min(state.recessDepth, state.baseThickness - 1.2);
      const remainingFloor = state.baseThickness - safeRecessDepth;

      document.getElementById('tray-inner-dia').textContent = `${recessInnerDia.toFixed(1)} mm`;
      document.getElementById('tray-calc-dia').textContent = `${recessInnerDia.toFixed(1)} mm`;
      document.getElementById('tray-candle-ref').textContent = state.candleDia;
      document.getElementById('hint-candle-dia').textContent = `${state.candleDia} mm`;
      document.getElementById('floor-thickness-info').textContent = `${remainingFloor.toFixed(1)} mm`;
      document.getElementById('outer-dims').textContent = `Ø${state.bellyDia} × ${state.height} mm`;

      // Check 1: Does the candle fit through the top opening?
      const openingDiff = state.topInnerDia - state.candleDia;
      const checkOpenEl = document.getElementById('check-opening');
      const checkOpenText = document.getElementById('check-opening-text');

      if (openingDiff >= 4) {
        checkOpenEl.className = 'p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-2';
        checkOpenText.className = 'text-[11px] text-teal-300/80 font-mono';
        checkOpenText.textContent = `+${openingDiff.toFixed(0)} mm Platz`;
      } else if (openingDiff >= 0) {
        checkOpenEl.className = 'p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-2';
        checkOpenText.className = 'text-[11px] text-amber-300 font-mono';
        checkOpenText.textContent = `Knapp (+${openingDiff.toFixed(0)} mm)`;
      } else {
        checkOpenEl.className = 'p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2';
        checkOpenText.className = 'text-[11px] text-rose-300 font-mono';
        checkOpenText.textContent = `Zu eng (${openingDiff.toFixed(0)} mm)!`;
      }

      // Check 2: Overhang printability without supports
      const checkOverhangEl = document.getElementById('check-overhang');
      const checkOverhangText = document.getElementById('check-overhang-text');
      const roundedOverhang = Math.round(maxOverhangDeg);

      if (roundedOverhang <= 55) {
        checkOverhangEl.className = 'p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-2';
        checkOverhangText.className = 'text-[11px] text-teal-300/80 font-mono';
        checkOverhangText.textContent = `Max. ${roundedOverhang}° (Stützfrei)`;
      } else if (roundedOverhang <= 64) {
        checkOverhangEl.className = 'p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-2';
        checkOverhangText.className = 'text-[11px] text-amber-300 font-mono';
        checkOverhangText.textContent = `Max. ${roundedOverhang}° (Langsam)`;
      } else {
        checkOverhangEl.className = 'p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2';
        checkOverhangText.className = 'text-[11px] text-rose-300 font-mono';
        checkOverhangText.textContent = `Max. ${roundedOverhang}° (Flach!)`;
      }

      // Estimate filament weight (PLA density ~1.24 g/cm³)
      const baseVolMm3 = Math.PI * Math.pow(state.baseOuterDia / 2, 2) * state.baseThickness * 0.75;
      const ribLenMm = state.height * 1.24;
      const ribsVolMm3 = state.ribCount * (state.ribWidth * state.ribDepth * 0.85) * ribLenMm;
      const totalGrams = Math.round(((baseVolMm3 + ribsVolMm3) / 1000) * 1.15);
      state.lastMaxOverhangDeg = maxOverhangDeg;
      state.lastEstimatedGrams = totalGrams;
      document.getElementById('est-weight').textContent = `~${totalGrams} g PLA`;

      // Calculate Maximum Free Cantilever Span in the critical upper zone (Anti-Vibration check)
      const activeRings = state.stabilizerMode === 'none' ? 0 : Math.round(state.stabilizerCount);
      const tLevels = getStabilizerNormalizedHeights(activeRings);
      const effectiveHeight = state.height - state.baseThickness - state.topRingHeight;
      let maxUpperSpanMm = effectiveHeight;
      if (tLevels.length > 0) {
        // Check span between consecutive rings and top ring in the critical upper half
        let prevT = tLevels[0] * 0.65; // accounting for bottom rootBoost stiffening
        maxUpperSpanMm = 0;
        for (let i = 0; i < tLevels.length; i++) {
          const span = (tLevels[i] - prevT) * state.height - (state.stabilizerThickness * 0.6);
          if (span > maxUpperSpanMm) maxUpperSpanMm = span;
          prevT = tLevels[i];
        }
        const topGap = (0.98 - prevT) * state.height;
        if (topGap > maxUpperSpanMm) maxUpperSpanMm = topGap;
      }
      const freeSpanMm = Math.max(8, Math.round(maxUpperSpanMm));
      state.lastFreeSpanMm = freeSpanMm;
      const spans = activeRings + 1;
      const stiffnessGain = Math.pow(spans, 3);
      const spanBadge = document.getElementById('free-span-badge');
      if (spanBadge) {
        if (activeRings > 0) {
          spanBadge.textContent = `~${freeSpanMm} mm (${stiffnessGain}× steifer)`;
          spanBadge.className = 'font-mono font-bold text-teal-300';
        } else {
          spanBadge.textContent = `${freeSpanMm} mm (Ungestützt!)`;
          spanBadge.className = freeSpanMm > 60 ? 'font-mono font-bold text-rose-400' : 'font-mono font-bold text-amber-300';
        }
      }

      if (currentLanternGeometry) {
        const triCount = Math.round(currentLanternGeometry.attributes.position.count / 3);
        document.getElementById('mesh-stats').textContent = `${triCount.toLocaleString('de-DE')} Dreiecke • Maßstab 1:1 (mm)`;
      }
    }

    /********************************************************************
     * 6. UI PARAMETER HANDLERS & PRESETS
     ********************************************************************/
    function setMotifType(type) {
      state.motifType = type;
      const types = ['none', 'star', 'crystal', 'tree', 'heart', 'mix'];
      types.forEach(t => {
        const btn = document.getElementById(`motif-btn-${t}`);
        if (!btn) return;
        if (t === type) {
          btn.className = 'py-2.5 px-2 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/40 transition-all flex flex-col items-center gap-1';
        } else {
          btn.className = 'py-2.5 px-2 rounded-xl text-xs font-medium bg-studio-800 text-gray-300 hover:text-white border border-white/10 transition-all flex flex-col items-center gap-1';
        }
      });

      const controlsWrap = document.getElementById('motif-controls-wrap');
      if (controlsWrap) {
        if (type === 'none') {
          controlsWrap.classList.add('opacity-40', 'pointer-events-none');
        } else {
          controlsWrap.classList.remove('opacity-40', 'pointer-events-none');
        }
      }

      rebuildAll();
    }

    function formatUpperPinStepLabel(stepVal) {
      const s = Math.round(stepVal);
      if (s <= 0) return 'Nur 1 Pin (Aus)';
      if (s === 1) return 'Jeder Stab (Alle)';
      return `Jeder ${s}. Stab`;
    }

    function updateBreakawayDescText() {
      const descEl = document.getElementById('desc-stab-mode');
      if (!descEl || state.stabilizerMode !== 'breakaway') return;
      const s = Math.round(state.upperPinStep || 0);
      const upperInfo = s <= 0
        ? 'pro Stab hält <strong>nur 1 unterer Pin</strong> (kein oberer Pin)'
        : (s === 1
          ? 'pro Stab halten 2 Pins'
          : `4 von ${s} Stäben haben <strong>nur 1 Pin</strong> (2. Micro-Pin nur an jedem ${s}. Stab)`);
      descEl.innerHTML = `<strong>Hebelwirkung von oben nach unten (6.5× Hebel):</strong> Greife durch die obere Öffnung und drücke auf die schräge Innenkante (${state.stabilizerWidth.toFixed(1)} mm) nach unten. Da ${upperInfo} und die Sollbruchstelle nur <strong>${state.stabilizerNeck.toFixed(2)} mm</strong> dünn ist, schält der Ring die Pins im Domino-Effekt ab, ohne die Stäbe zu biegen!`;
    }

    function setStabilizerMode(mode) {
      state.stabilizerMode = mode;
      const modes = ['breakaway', 'permanent', 'none'];
      modes.forEach(m => {
        const btn = document.getElementById(`stab-mode-${m}`);
        if (!btn) return;
        if (m === mode) {
          btn.className = 'py-2 px-2 rounded-lg text-[11px] font-semibold bg-teal-500/25 text-teal-200 border border-teal-400/40 transition-all leading-tight';
        } else {
          btn.className = 'py-2 px-2 rounded-lg text-[11px] font-medium text-gray-400 hover:text-white transition-all leading-tight';
        }
      });

      const controlsWrap = document.getElementById('stab-controls-wrap');
      const neckWrap = document.getElementById('stab-neck-wrap');
      const descEl = document.getElementById('desc-stab-mode');
      const labelEl = document.getElementById('label-stab-thickness');

      if (mode === 'none') {
        controlsWrap.classList.add('opacity-40', 'pointer-events-none');
      } else {
        controlsWrap.classList.remove('opacity-40', 'pointer-events-none');
        if (mode === 'breakaway') {
          if (neckWrap) neckWrap.classList.remove('hidden');
          labelEl.textContent = 'Ring- & Hebel-Höhe';
          updateBreakawayDescText();
        } else {
          if (neckWrap) neckWrap.classList.add('hidden');
          labelEl.textContent = 'Ring-Höhe (Fester Vasen-Innenring)';
          descEl.innerHTML = 'Fester, von unten im 42°-Winkel selbsttragender Stabilisierungsring in Laternenfarbe. Braucht keinen Slicer-Support und verbindet alle Stäbe dauerhaft.';
        }
      }

      rebuildAll();
    }

    function updateParam(key, rawValue) {
      const val = parseFloat(rawValue);
      state[key] = val;

      // Ensure baseOuterDia is always large enough to hold the candle recess + rim
      const minBaseNeeded = state.candleDia + state.candleClearance * 2 + state.recessRimWidth * 2;
      if (state.baseOuterDia < minBaseNeeded) {
        state.baseOuterDia = Math.ceil(minBaseNeeded);
        const baseSlider = document.getElementById('param-baseOuterDia');
        if (baseSlider) baseSlider.value = state.baseOuterDia;
        const baseLabel = document.getElementById('val-baseOuterDia');
        if (baseLabel) baseLabel.textContent = state.baseOuterDia;
      }

      const label = document.getElementById(`val-${key}`);
      if (label) {
        if (key === 'upperPinStep') {
          label.textContent = formatUpperPinStepLabel(val);
        } else if (key === 'stabilizerNeck') {
          label.textContent = val.toFixed(2);
        } else {
          const decimals = ['ribWidth', 'ribDepth', 'topRingHeight', 'stabilizerWidth', 'stabilizerThickness', 'motifRelief', 'baseThickness', 'recessDepth', 'candleClearance', 'recessRimWidth'].includes(key) ? 1 : 0;
          label.textContent = val.toFixed(decimals);
        }
      }

      if (state.stabilizerMode === 'breakaway') {
        updateBreakawayDescText();
      }

      rebuildAll();
    }

    function switchTab(tabId) {
      ['form', 'ribs', 'deko', 'tray', 'candle'].forEach(id => {
        const panel = document.getElementById(`panel-${id}`);
        const btn = document.getElementById(`tab-${id}`);
        if (!panel || !btn) return;
        if (id === tabId) {
          panel.classList.remove('hidden');
          btn.className = 'tab-btn py-2 px-1.5 rounded-lg text-[11px] font-semibold accent-gradient text-studio-950 transition-all relative';
        } else {
          panel.classList.add('hidden');
          btn.className = 'tab-btn py-2 px-1.5 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-white transition-all relative';
        }
      });
    }

    function toggleZenMode() {
      state.zenMode = !state.zenMode;

      const sidebar = document.getElementById('control-sidebar');
      const topBar = document.getElementById('ui-top-bar');
      const bottomLeft = document.getElementById('ui-bottom-left');
      const colorBar = document.getElementById('ui-color-bar');
      const bottomRight = document.getElementById('ui-bottom-right');
      const viewportWrapper = document.getElementById('viewport-wrapper');

      const iconExpand = document.getElementById('icon-zen-expand');
      const iconCollapse = document.getElementById('icon-zen-collapse');
      const btnText = document.getElementById('zen-btn-text');
      const zenBtn = document.getElementById('btn-zen-mode');

      if (state.zenMode) {
        sidebar.classList.add('hidden');
        topBar.classList.add('opacity-0', 'pointer-events-none');
        bottomLeft.classList.add('opacity-0', 'pointer-events-none');
        if (colorBar) colorBar.classList.add('hidden');

        // Keep the function bar (LED-Kerze, Schatten, Schnitt, Einsetz-Test) visible & centered at the bottom in fullscreen
        bottomRight.classList.remove('sm:left-auto', 'sm:items-end');
        bottomRight.classList.add('left-4', 'right-4', 'items-center');

        viewportWrapper.classList.remove('h-[52vh]');
        viewportWrapper.classList.add('h-screen');

        iconExpand.classList.add('hidden');
        iconCollapse.classList.remove('hidden');
        btnText.textContent = 'Menü einblenden';
        zenBtn.className = 'absolute top-4 right-4 z-40 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold accent-gradient text-studio-950 shadow-2xl transition-all active:scale-95';
      } else {
        sidebar.classList.remove('hidden');
        topBar.classList.remove('opacity-0', 'pointer-events-none');
        bottomLeft.classList.remove('opacity-0', 'pointer-events-none');
        if (colorBar) colorBar.classList.remove('hidden');

        bottomRight.classList.add('sm:left-auto', 'sm:items-end');

        viewportWrapper.classList.remove('h-screen');
        viewportWrapper.classList.add('h-[52vh]');

        iconExpand.classList.remove('hidden');
        iconCollapse.classList.add('hidden');
        btnText.textContent = 'Vollbild';
        zenBtn.className = 'absolute top-4 right-4 z-40 glass-panel px-3.5 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-semibold text-champagne-200 hover:text-white hover:border-champagne-400/50 shadow-2xl transition-all active:scale-95';
      }

      onWindowResize();
      setTimeout(onWindowResize, 50);
      setTimeout(onWindowResize, 310);
    }

    function applyPreset(presetName) {
      if (window.lumenTrack) window.lumenTrack('preset', { preset: String(presetName).slice(0, 40) });
      const presets = {
        tealight: {
          height: 110,
          bellyDia: 124,
          topInnerDia: 62,
          baseOuterDia: 84,
          bellyHeightRatio: 47,
          curveTension: 52,
          ribCount: 40,
          ribWidth: 2.4,
          ribDepth: 4.0,
          twistAngle: 15,
          topRingHeight: 3.2,
          stabilizerCount: 2,
          stabilizerWidth: 3.0,
          stabilizerThickness: 3.2,
          stabilizerNeck: 0.60,
          rootBoost: 20,
          baseThickness: 5.0,
          recessDepth: 2.0,
          candleClearance: 1.0,
          recessRimWidth: 3.0,
          candleDia: 38,
          candleHeight: 18,
          motifType: 'none'
        },
        classic: {
          height: 160,
          bellyDia: 200,
          topInnerDia: 96,
          baseOuterDia: 108,
          bellyHeightRatio: 46,
          curveTension: 55,
          ribCount: 48,
          ribWidth: 2.6,
          ribDepth: 4.5,
          twistAngle: 0,
          motifType: 'none'
        },
        xmas: {
          height: 168,
          bellyDia: 204,
          topInnerDia: 96,
          baseOuterDia: 110,
          bellyHeightRatio: 46,
          curveTension: 55,
          ribCount: 48,
          ribWidth: 2.6,
          ribDepth: 4.5,
          twistAngle: 0,
          motifType: 'mix',
          motifCount: 6,
          motifRows: 2,
          motifSize: 32,
          motifWidthScale: 105,
          motifRelief: 2.6,
          motifHeightRatio: 50
        },
        lounge: {
          height: 150,
          bellyDia: 230,
          topInnerDia: 102,
          baseOuterDia: 118,
          bellyHeightRatio: 44,
          curveTension: 62,
          ribCount: 56,
          ribWidth: 2.6,
          ribDepth: 4.8,
          twistAngle: 0,
          motifType: 'none'
        },
        twist: {
          height: 175,
          bellyDia: 196,
          topInnerDia: 98,
          baseOuterDia: 108,
          bellyHeightRatio: 48,
          curveTension: 55,
          ribCount: 44,
          ribWidth: 2.8,
          ribDepth: 4.6,
          twistAngle: 45,
          motifType: 'none'
        },
        tall: {
          height: 230,
          bellyDia: 190,
          topInnerDia: 98,
          baseOuterDia: 112,
          bellyHeightRatio: 42,
          curveTension: 50,
          ribCount: 46,
          ribWidth: 2.8,
          ribDepth: 4.8,
          twistAngle: 0,
          motifType: 'none'
        }
      };

      const p = presets[presetName];
      if (!p) return;

      Object.keys(p).forEach(k => {
        if (k === 'motifType') return;
        state[k] = p[k];
        const input = document.getElementById(`param-${k}`);
        if (input) input.value = p[k];
        const label = document.getElementById(`val-${k}`);
        if (label) {
          const decimals = ['ribWidth', 'ribDepth', 'topRingHeight', 'motifRelief', 'baseThickness', 'recessDepth', 'candleClearance', 'recessRimWidth'].includes(k) ? 1 : 0;
          label.textContent = p[k].toFixed(decimals);
        }
      });

      if (p.motifType) {
        setMotifType(p.motifType);
      }

      // Highlight active preset button
      ['tealight', 'classic', 'xmas', 'lounge', 'twist', 'tall'].forEach(name => {
        const btn = document.getElementById(`preset-${name}`);
        if (!btn) return;
        if (name === presetName) {
          btn.className = 'preset-btn px-3 py-1.5 rounded-xl text-xs font-semibold transition-all accent-gradient text-studio-950 flex items-center gap-1';
        } else {
          btn.className = 'preset-btn px-3 py-1.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1';
        }
      });

      rebuildAll();
    }

    function resetToDefaults() {
      Object.keys(defaultParams).forEach(k => {
        state[k] = defaultParams[k];
        const input = document.getElementById(`param-${k}`);
        if (input) input.value = defaultParams[k];
        const label = document.getElementById(`val-${k}`);
        if (label) {
          if (k === 'upperPinStep') {
            label.textContent = formatUpperPinStepLabel(defaultParams[k]);
          } else if (k === 'stabilizerNeck') {
            label.textContent = defaultParams[k].toFixed(2);
          } else {
            label.textContent = ['ribWidth', 'ribDepth', 'topRingHeight', 'stabilizerWidth', 'stabilizerThickness', 'motifRelief', 'baseThickness', 'recessDepth', 'candleClearance', 'recessRimWidth'].includes(k)
              ? defaultParams[k].toFixed(1)
              : defaultParams[k];
          }
        }
      });
      setMotifType(defaultParams.motifType);
      updateBreakawayDescText();
      applyPreset('tealight');
    }

    function setLanternColor(hexColor, btnEl) {
      state.lanternColor = hexColor;
      if (lanternMesh && lanternMesh.material) {
        lanternMesh.material.color.set(hexColor);
      }
      document.querySelectorAll('.color-swatch').forEach(el => {
        el.className = 'color-swatch w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform';
      });
      if (btnEl) {
        btnEl.className = 'color-swatch w-6 h-6 rounded-full border-2 border-white scale-110 transition-transform';
      }
    }

    function toggleCandle() {
      state.showCandle = !state.showCandle;
      const btn = document.getElementById('btn-candle');
      btn.className = state.showCandle
        ? 'px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 bg-champagne-400/20 text-champagne-200 border border-champagne-400/40 transition-all'
        : 'px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 text-gray-300 hover:text-white hover:bg-white/10 transition-all';
      rebuildAll();
    }

    function toggleGlassSleeve() {
      state.showGlassSleeve = !state.showGlassSleeve;
      const btn = document.getElementById('btn-glass');
      btn.textContent = state.showGlassSleeve ? 'An' : 'Aus';
      btn.className = state.showGlassSleeve
        ? 'px-3 py-1.5 rounded-xl text-xs font-semibold accent-gradient text-studio-950 transition-all'
        : 'px-3 py-1.5 rounded-xl text-xs font-medium bg-studio-800 text-gray-300 border border-white/10 hover:bg-studio-700 transition-all';
      rebuildAll();
    }

    function toggleSectionView() {
      state.sectionView = !state.sectionView;
      const btn = document.getElementById('btn-section');
      btn.className = state.sectionView
        ? 'px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 bg-champagne-400/20 text-champagne-200 border border-champagne-400/40 transition-all'
        : 'px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 text-gray-300 hover:text-white hover:bg-white/10 transition-all';
      rebuildAll();
    }

    function enableSectionView() {
      if (!state.sectionView) {
        toggleSectionView();
      }
      // Smoothly position camera to inspect the bottom tray cross-section
      camera.position.set(0, 95, 240);
      controls.target.set(0, 40, 0);
      controls.update();
    }

    function toggleNightMode() {
      state.nightMode = !state.nightMode;
      const btn = document.getElementById('btn-night');
      btn.className = state.nightMode
        ? 'px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 bg-champagne-400/20 text-champagne-200 border border-champagne-400/40 transition-all'
        : 'px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 text-gray-300 hover:text-white hover:bg-white/10 transition-all';
      applyLightingMode();
    }

    function applyLightingMode() {
      if (state.nightMode) {
        ambientLight.intensity = 0.25;
        dirLight.intensity = 0.22;
        floorMesh.material.color.setHex(0xd8d5ce);
      } else {
        ambientLight.intensity = 0.85;
        dirLight.intensity = 0.9;
        floorMesh.material.color.setHex(0x23262f);
      }
    }

    function triggerCandleDropAnimation() {
      if (!state.showCandle) {
        toggleCandle();
      }
      state.candleDropAnimProgress = 0;
    }

    /********************************************************************
     * 7. PRE-EXPORT PRINTABILITY MODAL & BINARY .STL EXPORTER
     ********************************************************************/
    function getStatusSVG(level) {
      if (level === 'good') {
        return `<svg class="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
      }
      if (level === 'warn') {
        return `<svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
      }
      return `<svg class="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    }

    function applyCardTheme(cardEl, titleEl, iconEl, level) {
      iconEl.innerHTML = getStatusSVG(level);
      if (level === 'good') {
        cardEl.className = 'p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-start gap-3';
        titleEl.className = 'text-xs font-semibold text-teal-300';
      } else if (level === 'warn') {
        cardEl.className = 'p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3';
        titleEl.className = 'text-xs font-semibold text-amber-300';
      } else {
        cardEl.className = 'p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/35 flex items-start gap-3';
        titleEl.className = 'text-xs font-semibold text-rose-300';
      }
    }

    function openExportModal() {
      if (window.lumenTrack) window.lumenTrack('export_open');
      const grams = state.lastEstimatedGrams || 145;
      // 1.75mm PLA has ~2.98g per meter
      const meters = (grams / 2.98).toFixed(1);
      // Estimate print time (~27g/hour for thin vertical ribs with retractions)
      const totalMinutes = Math.round((grams / 26) * 60);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;

      document.getElementById('modal-subtitle').textContent = `Laterne Ø${state.bellyDia} × ${state.height} mm • ${state.ribCount} Stäbe`;
      document.getElementById('modal-filament-g').textContent = `~${grams} g`;
      document.getElementById('modal-filament-m').textContent = `(~${meters} m)`;
      document.getElementById('modal-print-time').textContent = `Geschätzte Druckzeit: ~${hours}h ${mins}m`;

      // Evaluate Stability, Overhang & Nozzle Collision / Failure Risk
      const overhang = Math.round(state.lastMaxOverhangDeg || 45);
      const ribCrossArea = state.ribWidth * state.ribDepth;
      const activeStabRings = state.stabilizerMode === 'none' ? 0 : Math.round(state.stabilizerCount);
      const freeSpanMm = state.lastFreeSpanMm || Math.round(state.height / (activeStabRings + 1));
      const slenderness = freeSpanMm / Math.max(1, Math.min(state.ribWidth, state.ribDepth));
      const openingDiff = state.topInnerDia - state.candleDia;
      const floorThickness = state.baseThickness - Math.min(state.recessDepth, state.baseThickness - 1.2);

      let score = 98;
      let needsOptimization = false;

      // 1. Stability & Anti-Vibration Evaluation
      let stabilityLevel = 'good';
      const stepVal = Math.round(state.upperPinStep !== undefined ? state.upperPinStep : 4);
      const pinSummary = stepVal <= 0 ? '1 Hebel-Pin/Stab' : `1 Pin + jeder ${stepVal}. Stab 2. Pin`;
      const stabModeText = state.stabilizerMode === 'breakaway'
        ? `${activeStabRings} Top-Down Hebel-Snap Ringen (${pinSummary}, ${state.stabilizerNeck.toFixed(2)} mm V-Kerbe)`
        : (state.stabilizerMode === 'permanent' ? `${activeStabRings} festen 42°-Vasen-Ringen` : 'ohne Zwischenringe');
      let stabilityTitle = `PETG-Hebel-Snap & Stabil (Max. frei ~${freeSpanMm} mm)`;
      let stabilityDesc = `Dank ${stabModeText} lassen sich die Ringe von oben durch Nach-unten-Drücken auf den inneren Hebelkragen (6.5× Hebelarm) im Domino-Effekt abschälen, ohne dass ein Stab bricht.`;

      if (state.ribWidth < 2.0 || state.ribDepth < 3.0 || ribCrossArea < 6.5) {
        stabilityLevel = 'danger';
        stabilityTitle = 'Fragil (Stäbe zu dünn)';
        stabilityDesc = `Bei ${state.ribWidth.toFixed(1)} × ${state.ribDepth.toFixed(1)} mm schwingen die Stäbe stark. Empfehlung: mind. 2.4 × 4.0 mm plus durchgehenden Ausbrech-Ring.`;
        score -= 28;
        needsOptimization = true;
      } else if (freeSpanMm > 75 || slenderness > 32) {
        stabilityLevel = 'danger';
        stabilityTitle = `Vibrations-Gefahr! (Freie Länge ${freeSpanMm} mm)`;
        stabilityDesc = `Ohne ausreichende Ringe schwingen die ${state.height} mm langen Stäbe durch die Düsenbewegung auf. Aktiviere 2 durchgehende Ausbrech-Ringe!`;
        score -= 26;
        needsOptimization = true;
      } else if (freeSpanMm > 58 || slenderness > 24) {
        stabilityLevel = 'warn';
        stabilityTitle = `Leichtes Schwingen möglich (${freeSpanMm} mm frei)`;
        stabilityDesc = `Ein zusätzlicher durchgehender Stützring würde die freie Stablänge weiter verkürzen und alle Stäbe noch gleichmäßiger stabilisieren.`;
        score -= 10;
        needsOptimization = true;
      }

      // 2. Print Failure / Danger Check (Nozzle collision, curling overhangs, spaghetti risk)
      let dangerLevel = 'good';
      let dangerTitle = 'Ungefährlich (Kein Fehlschlag-Risiko)';
      let dangerDesc = `Max. Überhangwinkel von ${overhang}° liegt im sicheren Bereich. Kein Curling (Hochbiegen) und keine Kollisionsgefahr für die Druckerdüse.`;

      if (overhang > 63 || (overhang > 56 && state.ribWidth < 2.0)) {
        dangerLevel = 'danger';
        dangerTitle = 'Erhöhtes Fehlschlag- & Kollisions-Risiko!';
        dangerDesc = `Der Überhang von ${overhang}° ist sehr flach. Die freien Stab-Kanten können sich beim Abkühlen nach oben wölben (Curling), sodass die Düse dagegen stößt und den Druck abreißt ("Spaghetti-Druck").`;
        score -= 38;
        needsOptimization = true;
      } else if (overhang > 54 || Math.abs(state.twistAngle) > 65) {
        dangerLevel = 'warn';
        dangerTitle = 'Anspruchsvoller Druck (Kühlung beachten)';
        dangerDesc = `Überhang von ${overhang}° erfordert gute Bauteilkühlung (100% Lüfter) und reduzierte Überhang-Geschwindigkeit, damit die Lamellen sauber schichten.`;
        score -= 14;
        needsOptimization = true;
      }

      // 3. Candle Fit & Tray Floor Check
      let candleLevel = 'good';
      let candleTitle = 'Perfekter Sitz & Einlass';
      let candleDesc = `Deine Ø${state.candleDia} mm Kerze passt bequem durch die Ø${state.topInnerDia} mm Öffnung (+${openingDiff.toFixed(0)} mm Spiel) und steht sicher in der ${state.recessDepth.toFixed(1)} mm tiefen Mulde.`;

      if (openingDiff < 0) {
        candleLevel = 'danger';
        candleTitle = 'Kerze passt oben nicht durch!';
        candleDesc = `Die obere Öffnung (Ø${state.topInnerDia} mm) ist kleiner als deine Kerze (Ø${state.candleDia} mm). Du kannst die Kerze später nicht von oben einsetzen!`;
        score -= 20;
        needsOptimization = true;
      } else if (openingDiff < 4 || floorThickness < 1.6) {
        candleLevel = 'warn';
        candleTitle = 'Sehr knappe Toleranz';
        candleDesc = `Öffnungs-Spiel beträgt nur +${openingDiff.toFixed(0)} mm (oder Bodenstärke ${floorThickness.toFixed(1)} mm ist knapp). Etwas mehr Spiel erleichtert das Einsetzen.`;
        score -= 8;
        needsOptimization = true;
      }

      score = Math.max(15, Math.min(99, Math.round(score)));

      // Update Success UI
      const rateEl = document.getElementById('modal-success-rate');
      const barEl = document.getElementById('modal-success-bar');
      const badgeEl = document.getElementById('modal-success-badge');
      rateEl.textContent = `${score} %`;
      barEl.style.width = `${score}%`;

      if (score >= 85) {
        rateEl.className = 'text-2xl font-bold font-mono text-teal-400';
        barEl.className = 'h-full bg-teal-400 rounded-full transition-all duration-500';
        badgeEl.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30';
        badgeEl.textContent = 'Sehr sicher';
      } else if (score >= 65) {
        rateEl.className = 'text-2xl font-bold font-mono text-amber-400';
        barEl.className = 'h-full bg-amber-400 rounded-full transition-all duration-500';
        badgeEl.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30';
        badgeEl.textContent = 'Mittel';
      } else {
        rateEl.className = 'text-2xl font-bold font-mono text-rose-400';
        barEl.className = 'h-full bg-rose-400 rounded-full transition-all duration-500';
        badgeEl.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30';
        badgeEl.textContent = 'Risiko hoch!';
      }

      applyCardTheme(
        document.getElementById('modal-card-stability'),
        document.getElementById('modal-title-stability'),
        document.getElementById('modal-icon-stability'),
        stabilityLevel
      );
      document.getElementById('modal-title-stability').textContent = stabilityTitle;
      document.getElementById('modal-desc-stability').textContent = stabilityDesc;

      applyCardTheme(
        document.getElementById('modal-card-danger'),
        document.getElementById('modal-title-danger'),
        document.getElementById('modal-icon-danger'),
        dangerLevel
      );
      document.getElementById('modal-title-danger').textContent = dangerTitle;
      document.getElementById('modal-desc-danger').textContent = dangerDesc;

      applyCardTheme(
        document.getElementById('modal-card-candle'),
        document.getElementById('modal-title-candle'),
        document.getElementById('modal-icon-candle'),
        candleLevel
      );
      document.getElementById('modal-title-candle').textContent = candleTitle;
      document.getElementById('modal-desc-candle').textContent = candleDesc;

      const optBtn = document.getElementById('btn-auto-optimize');
      if (needsOptimization) {
        optBtn.classList.remove('hidden');
        optBtn.classList.add('flex');
      } else {
        optBtn.classList.add('hidden');
        optBtn.classList.remove('flex');
      }

      const modal = document.getElementById('export-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
      });
    }

    function closeExportModal() {
      const modal = document.getElementById('export-modal');
      modal.classList.remove('opacity-100');
      modal.classList.add('opacity-0');
      setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }, 250);
    }

    function applySafePrintOptimization() {
      // Automatically adjust parameters to guarantee a safe, stable, support-free print without rib vibration
      if (state.ribWidth < 2.6) state.ribWidth = 2.6;
      if (state.ribDepth < 4.5) state.ribDepth = 4.5;
      if (state.topRingHeight < 4.0) state.topRingHeight = 4.0;
      if (state.curveTension > 55) state.curveTension = 52;
      if (state.bellyHeightRatio < 42) state.bellyHeightRatio = 46;
      if (state.stabilizerMode === 'none') {
        setStabilizerMode('breakaway');
      }
      if (state.stabilizerCount < 3) {
        state.stabilizerCount = 3;
      }
      if (state.stabilizerWidth < 3.4) state.stabilizerWidth = 3.4;
      if (state.stabilizerThickness < 3.8) state.stabilizerThickness = 3.8;
      if (state.stabilizerNeck > 0.70) state.stabilizerNeck = 0.65;
      if (state.upperPinStep === 1) state.upperPinStep = 4;
      if (state.rootBoost < 25) state.rootBoost = 25;
      if (state.topInnerDia < state.candleDia + 12) {
        state.topInnerDia = Math.min(160, state.candleDia + 14);
      }
      if (state.bellyDia - state.baseOuterDia > state.height * 0.65) {
        state.baseOuterDia = Math.max(state.baseOuterDia, Math.round(state.bellyDia - state.height * 0.55));
      }

      // Sync UI sliders & labels
      ['ribWidth', 'ribDepth', 'topRingHeight', 'stabilizerCount', 'stabilizerWidth', 'stabilizerThickness', 'stabilizerNeck', 'upperPinStep', 'rootBoost', 'curveTension', 'bellyHeightRatio', 'topInnerDia', 'baseOuterDia'].forEach(k => {
        const input = document.getElementById(`param-${k}`);
        if (input) input.value = state[k];
        const label = document.getElementById(`val-${k}`);
        if (label) {
          if (k === 'upperPinStep') {
            label.textContent = formatUpperPinStepLabel(state[k]);
          } else if (k === 'stabilizerNeck') {
            label.textContent = state[k].toFixed(2);
          } else {
            const decimals = ['ribWidth', 'ribDepth', 'topRingHeight', 'stabilizerWidth', 'stabilizerThickness'].includes(k) ? 1 : 0;
            label.textContent = state[k].toFixed(decimals);
          }
        }
      });

      updateBreakawayDescText();
      rebuildAll();
      openExportModal();
      showToast('V5 Top-Down Hebel-Snap aktiviert!', '1 Pin + jeder 5. Stab 2. Pin mit 0.65 mm V-Schälkerbe für leichtes Aushebeln.');
    }

    function confirmAndDownloadSTL() {
      closeExportModal();
      exportToSTL();
    }

    function exportToSTL() {
      if (!currentLanternGeometry) return;

      const posAttr = currentLanternGeometry.attributes.position;
      const numTriangles = posAttr.count / 3;

      // Binary STL format: 80-byte header + 4-byte uint32 triangle count + (50 bytes * numTriangles)
      const bufferLength = 84 + numTriangles * 50;
      const arrayBuffer = new ArrayBuffer(bufferLength);
      const view = new DataView(arrayBuffer);

      // Write ASCII header
      const headerText = `Lumenrib Parametric Lantern - D${state.bellyDia}xH${state.height}mm - Candle D${state.candleDia}mm`;
      for (let i = 0; i < 80; i++) {
        view.setUint8(i, i < headerText.length ? headerText.charCodeAt(i) : 32);
      }

      // Write number of triangles (little-endian)
      view.setUint32(80, numTriangles, true);

      let offset = 84;
      const vA = new THREE.Vector3();
      const vB = new THREE.Vector3();
      const vC = new THREE.Vector3();
      const cb = new THREE.Vector3();
      const ab = new THREE.Vector3();

      // Convert Three.js Y-Up (x, y, z) to 3D Printer Slicer Z-Up (x, -z, y)
      // Preserves right-handedness and outward normal orientation!
      for (let i = 0; i < numTriangles; i++) {
        const idx = i * 3;

        vA.set(posAttr.getX(idx),     -posAttr.getZ(idx),     posAttr.getY(idx));
        vB.set(posAttr.getX(idx + 1), -posAttr.getZ(idx + 1), posAttr.getY(idx + 1));
        vC.set(posAttr.getX(idx + 2), -posAttr.getZ(idx + 2), posAttr.getY(idx + 2));

        // Compute facet normal
        cb.subVectors(vC, vB);
        ab.subVectors(vA, vB);
        cb.cross(ab).normalize();

        // Normal (3 floats)
        view.setFloat32(offset, cb.x, true); offset += 4;
        view.setFloat32(offset, cb.y, true); offset += 4;
        view.setFloat32(offset, cb.z, true); offset += 4;

        // Vertex 1
        view.setFloat32(offset, vA.x, true); offset += 4;
        view.setFloat32(offset, vA.y, true); offset += 4;
        view.setFloat32(offset, vA.z, true); offset += 4;

        // Vertex 2
        view.setFloat32(offset, vB.x, true); offset += 4;
        view.setFloat32(offset, vB.y, true); offset += 4;
        view.setFloat32(offset, vB.z, true); offset += 4;

        // Vertex 3
        view.setFloat32(offset, vC.x, true); offset += 4;
        view.setFloat32(offset, vC.y, true); offset += 4;
        view.setFloat32(offset, vC.z, true); offset += 4;

        // Attribute byte count (uint16 = 0)
        view.setUint16(offset, 0, true); offset += 2;
      }

      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = `Laterne_D${state.bellyDia}_H${state.height}_Kerze${state.candleDia}mm.stl`;
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (window.lumenTrack) {
        window.lumenTrack('stl_download', {
          dia: state.bellyDia, height: state.height, candle: state.candleDia,
          ribs: state.ribCount, motif: state.motifType, kb: Math.round(bufferLength / 1024)
        });
      }

      showToast('STL-Datei heruntergeladen!', `${fileName} (${(bufferLength / (1024 * 1024)).toFixed(1)} MB)`);
    }

    function showToast(title, desc) {
      const toast = document.getElementById('toast');
      document.getElementById('toast-title').textContent = title;
      document.getElementById('toast-desc').textContent = desc;
      toast.classList.remove('opacity-0', 'translate-y-[-10px]');
      toast.classList.add('opacity-100', 'translate-y-0');
      setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-[-10px]');
      }, 3600);
    }

    /********************************************************************
     * 8. MAIN ANIMATION LOOP (Flame Flicker & Candle Drop Test)
     ********************************************************************/
    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Subtle organic LED candle flicker
      if (state.showCandle && candlePointLight) {
        const baseInt = (state.lightIntensity / 100) * 2.2;
        const flicker = Math.sin(elapsed * 7.5) * 0.06 + Math.sin(elapsed * 17.3) * 0.03;
        candlePointLight.intensity = Math.max(0, baseInt + flicker);

        if (flameMesh) {
          flameMesh.scale.y = 1 + Math.sin(elapsed * 9.2) * 0.06;
          flameMesh.rotation.z = Math.sin(elapsed * 4.5) * 0.05;
        }
      }

      // Handle Candle Insertion Test Animation
      if (state.candleDropAnimProgress !== null) {
        state.candleDropAnimProgress += 0.016;
        const floorY = state.baseThickness - Math.min(state.recessDepth, state.baseThickness - 1.2);
        if (state.candleDropAnimProgress >= 1) {
          state.candleDropAnimProgress = null;
          candleGroup.position.y = floorY;
        } else {
          const startY = state.height + 35;
          const ease = 1 - Math.pow(1 - state.candleDropAnimProgress, 3);
          const curY = THREE.MathUtils.lerp(startY, floorY, ease);
          candleGroup.position.y = curY;
          candlePointLight.position.y = curY + state.candleHeight + 12;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    }


    /********************************************************************
     * 9. EVENT-DELEGATION
     * Statt 69 Inline-Handlern (onclick=... / oninput=...) zwei Zuhörer am
     * Dokument. Grund: Inline-Handler brauchen in der CSP 'unsafe-inline',
     * das hebelt den wichtigsten XSS-Schutz aus. Die Funktionen bleiben
     * dieselben, sie werden nur über data-act / data-on verdrahtet.
     ********************************************************************/
    (function wireDelegation() {
      const INPUT_ACTIONS = { updateParam: true };

      function run(el, fn, args) {
        const table = {
          applyPreset, setLanternColor, setMotifType, switchTab, setStabilizerMode,
          closeExportModal, toggleZenMode, toggleCandle, triggerCandleDropAnimation,
          toggleSectionView, toggleNightMode, resetToDefaults, enableSectionView,
          toggleGlassSleeve, openExportModal, applySafePrintOptimization, confirmAndDownloadSTL,
        };
        const target = table[fn];
        if (typeof target !== 'function') return;
        try {
          target.apply(null, args);
        } catch (err) {
          // Ein fehlerhafter Klick darf den Konfigurator nicht anhalten.
          console.warn('Aktion fehlgeschlagen:', fn, err);
        }
      }

      function argsOf(el) {
        let args = [];
        const raw = el.dataset.args;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) args = parsed.map((v) => (v === null ? el : v));
          } catch (err) { args = []; }
        }
        if (el.dataset.el === '1' && args.indexOf(el) === -1) args = args.concat([el]);
        return args;
      }

      document.addEventListener('click', (ev) => {
        const el = ev.target.closest('[data-act]');
        if (!el || el.disabled) return;
        run(el, el.dataset.act, argsOf(el));
      });

      document.addEventListener('input', (ev) => {
        const el = ev.target.closest('[data-on]');
        if (!el) return;
        const fn = el.dataset.on;
        if (INPUT_ACTIONS[fn]) {
          updateParam(el.dataset.arg, el.value);
        } else {
          run(el, fn, [el.dataset.arg, el.value]);
        }
      });
    })();

    window.onload = initThree;
