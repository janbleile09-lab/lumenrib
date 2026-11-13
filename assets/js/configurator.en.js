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
      greetingEnabled: false,   // Cutout stencil or 3D Christmas text band enabled (default false)
      greetingStyle: 'cutout',  // 'cutout' (stencil pill plaque) or 'relief' (recessed 3D relief band)
      greetingText: 'XMAS',     // Greeting text (max 24 chars)
      greetingSize: 12,         // Capital height of greeting letters (mm, 8..24)
      greetingRelief: 1.8,      // Proud 3D letter relief above recessed band face (mm, 1.2..2.6)
      greetingCount: 3,         // Number of greeting bands around circumference (1..6)
      greetingHeightRatio: 62,  // Vertical center position of greeting band (% of height, 30..72)
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
    // Builds a single curved, rounded-profile rib from bottom plate to top stabilizer ring
    function pointInPoly2D(px, py, poly) {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1];
        const xj = poly[j][0], yj = poly[j][1];
        const intersect = ((yi > py) !== (yj > py)) &&
          (px < (xj - xi) * (py - yi) / ((yj - yi) || 1e-12) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }

    function buildRibsGeometry(cutoutExclusions = []) {
      const numRibs = Math.round(state.ribCount);
      const H = state.height;
      const ribW = state.ribWidth;
      const ribD = state.ribDepth;
      const twistRad = THREE.MathUtils.degToRad(state.twistAngle);
      const hasExclusions = Array.isArray(cutoutExclusions) && cutoutExclusions.length > 0;

      const heightSteps = hasExclusions ? 96 : 44;
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

      // Calculate exact tangential spacing at the top ring so adjacent ribs arch together at <=32°
      // just before the top ring starts (eliminates flat horizontal bridging under the top ring!)
      const rTopCenter = (state.topInnerDia / 2) + (ribD / 2);
      const topChordSpacing = (2 * Math.PI * rTopCenter) / numRibs;
      const topArchStartT = Math.max(0.86, 1 - ((state.topRingHeight + 4.2) / H));

      function evalRibSample(t) {
        const { r: rOuter, y } = evaluateOuterProfile(t);

        let boost = 0;
        if (t < 0.25 && rootBoostFactor > 0) {
          const uRoot = 1 - (t / 0.25);
          boost = rootBoostFactor * (uRoot * uRoot);
        }

        let topArchWidthAdd = 0;
        if (t > topArchStartT) {
          const uTop = Math.min(1, (t - topArchStartT) / (0.992 - topArchStartT));
          const smoothArch = uTop * uTop * (3 - 2 * uTop);
          topArchWidthAdd = Math.max(0, (topChordSpacing * 1.05 - ribW) * smoothArch);
        }

        const localRibW = ribW * (1 + boost * 0.85) + topArchWidthAdd;
        const localRibD = ribD * (1 + boost * 0.65);
        const rCenter = rOuter - localRibD / 2;
        const rShell = Math.max(18, rOuter - ribD * 0.35);
        const phiTwist = twistRad * t;
        return { t, rOuter, rCenter, rShell, y, phiTwist, localRibW, localRibD };
      }

      const ringsSingleRib = [];
      let maxOverhangAngleDeg = 0;

      for (let s = 0; s <= heightSteps; s++) {
        const t = 0.008 + (s / heightSteps) * 0.984;
        const sample = evalRibSample(t);
        if (s > 0) {
          const prev = ringsSingleRib[s - 1];
          const dr = Math.abs(sample.rOuter - prev.rOuter);
          const dy = Math.max(0.001, sample.y - prev.y);
          const angleFromVertical = THREE.MathUtils.radToDeg(Math.atan2(dr, dy));
          if (t < 0.5 && angleFromVertical > maxOverhangAngleDeg) {
            maxOverhangAngleDeg = angleFromVertical;
          }
        }
        ringsSingleRib.push(sample);
      }

      function isExcludedAt(baseAngle, sample) {
        if (!hasExclusions) return false;
        const angle = baseAngle + sample.phiTwist;
        const halfW = sample.localRibW * 0.45;
        for (let i = 0; i < cutoutExclusions.length; i++) {
          const ex = cutoutExclusions[i];
          if (sample.y < ex.yMin || sample.y > ex.yMax) continue;
          let dA = angle - ex.centerAngle;
          while (dA > Math.PI) dA -= Math.PI * 2;
          while (dA < -Math.PI) dA += Math.PI * 2;
          const xMm = dA * sample.rShell;
          if (xMm + halfW < ex.xMin || xMm - halfW > ex.xMax) continue;
          if (
            pointInPoly2D(xMm, sample.y, ex.polyCCW) ||
            pointInPoly2D(xMm - halfW, sample.y, ex.polyCCW) ||
            pointInPoly2D(xMm + halfW, sample.y, ex.polyCCW)
          ) {
            return true;
          }
        }
        return false;
      }

      function makeRingVerts(baseAngle, sample) {
        const angle = baseAngle + sample.phiTwist;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const ringVerts = [];
        for (let c = 0; c < csSegments; c++) {
          const { uUnit, vUnit } = unitCrossSection[c];
          const u = uUnit * sample.localRibD;
          const v = vUnit * sample.localRibW;
          const rad = sample.rCenter + u;
          ringVerts.push([
            rad * cosA - v * sinA,
            sample.y,
            -rad * sinA - v * cosA
          ]);
        }
        return ringVerts;
      }

      function findBoundarySample(baseAngle, tInside, tOutside) {
        let lo = tOutside, hi = tInside;
        for (let iter = 0; iter < 10; iter++) {
          const mid = 0.5 * (lo + hi);
          if (isExcludedAt(baseAngle, evalRibSample(mid))) {
            hi = mid;
          } else {
            lo = mid;
          }
        }
        return evalRibSample(lo);
      }

      const positions = [];

      function emitRibSegment(segRings) {
        if (segRings.length < 2) return;
        for (let s = 0; s < segRings.length - 1; s++) {
          const ringA = segRings[s];
          const ringB = segRings[s + 1];
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
        const bottomRing = segRings[0];
        const topRing = segRings[segRings.length - 1];
        for (let c = 1; c < csSegments - 1; c++) {
          positions.push(...bottomRing[0], ...bottomRing[c + 1], ...bottomRing[c]);
          positions.push(...topRing[0], ...topRing[c], ...topRing[c + 1]);
        }
      }

      for (let k = 0; k < numRibs; k++) {
        const baseAngle = (k / numRibs) * Math.PI * 2;
        if (!hasExclusions) {
          const ribRings = ringsSingleRib.map(sample => makeRingVerts(baseAngle, sample));
          emitRibSegment(ribRings);
          continue;
        }

        const excluded = ringsSingleRib.map(sample => isExcludedAt(baseAngle, sample));
        let s = 0;
        while (s <= heightSteps) {
          while (s <= heightSteps && excluded[s]) s++;
          if (s > heightSteps) break;
          const sStart = s;
          while (s + 1 <= heightSteps && !excluded[s + 1]) s++;
          const sEnd = s;
          s++;

          const segSamples = [];
          if (sStart > 0) {
            segSamples.push(findBoundarySample(baseAngle, ringsSingleRib[sStart - 1].t, ringsSingleRib[sStart].t));
          }
          for (let i = sStart; i <= sEnd; i++) {
            segSamples.push(ringsSingleRib[i]);
          }
          if (sEnd < heightSteps) {
            segSamples.push(findBoundarySample(baseAngle, ringsSingleRib[sEnd + 1].t, ringsSingleRib[sEnd].t));
          }
          const spanY = segSamples[segSamples.length - 1].y - segSamples[0].y;
          if (segSamples.length >= 2 && spanY >= 0.45) {
            emitRibSegment(segSamples.map(sample => makeRingVerts(baseAngle, sample)));
          }
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
    // SHARED CURVED-SHELL EXTRUSION & POLYGON HELPERS
    // ============================================================================
    function signedArea2D(pts) {
      let a = 0;
      for (let i = 0; i < pts.length; i++) {
        const p0 = pts[i], p1 = pts[(i + 1) % pts.length];
        a += p0[0] * p1[1] - p1[0] * p0[1];
      }
      return 0.5 * a;
    }

    function ensureCCW2D(pts) {
      return signedArea2D(pts) < 0 ? pts.slice().reverse() : pts.slice();
    }

    function ensureCW2D(pts) {
      return signedArea2D(pts) > 0 ? pts.slice().reverse() : pts.slice();
    }

    function offsetPolygon2D(polyCCW, d) {
      const n = polyCCW.length;
      const out = [];
      for (let i = 0; i < n; i++) {
        const pPrev = polyCCW[(i - 1 + n) % n];
        const pCurr = polyCCW[i];
        const pNext = polyCCW[(i + 1) % n];
        const dx1 = pCurr[0] - pPrev[0], dy1 = pCurr[1] - pPrev[1];
        const dx2 = pNext[0] - pCurr[0], dy2 = pNext[1] - pCurr[1];
        const l1 = Math.hypot(dx1, dy1) || 1;
        const l2 = Math.hypot(dx2, dy2) || 1;
        const n1x = -dy1 / l1, n1y = dx1 / l1;
        const n2x = -dy2 / l2, n2y = dx2 / l2;
        const a1x = pPrev[0] + n1x * d, a1y = pPrev[1] + n1y * d;
        const a2x = pCurr[0] + n2x * d, a2y = pCurr[1] + n2y * d;
        const det = dx1 * dy2 - dy1 * dx2;
        if (Math.abs(det) < 1e-6) {
          out.push([pCurr[0] + n1x * d, pCurr[1] + n1y * d]);
        } else {
          const rx = a2x - a1x, ry = a2y - a1y;
          const t = (rx * dy2 - ry * dx2) / det;
          let ix = a1x + t * dx1, iy = a1y + t * dy1;
          const mx = ix - pCurr[0], my = iy - pCurr[1];
          const mLen = Math.hypot(mx, my);
          const maxMiter = Math.abs(d) * 2.6;
          if (mLen > maxMiter && mLen > 1e-6) {
            ix = pCurr[0] + (mx / mLen) * maxMiter;
            iy = pCurr[1] + (my / mLen) * maxMiter;
          }
          out.push([ix, iy]);
        }
      }
      return out;
    }

    function subdividePoly2D(pts, maxSegLen = 3.5) {
      const out = [];
      for (let i = 0; i < pts.length; i++) {
        const p0 = pts[i];
        const p1 = pts[(i + 1) % pts.length];
        const dist = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        const steps = Math.max(1, Math.ceil(dist / maxSegLen));
        for (let k = 0; k < steps; k++) {
          const f = k / steps;
          out.push([p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f]);
        }
      }
      return out;
    }

    function polyBounds2D(pts) {
      let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i];
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
      return { xMin, xMax, yMin, yMax };
    }

    function shellPointMmGlobal(baseRibIdx, xMm, yMm, zRelOuterMm) {
      const H = state.height;
      const numRibs = Math.round(state.ribCount);
      const ribD = state.ribDepth;
      const twistRad = THREE.MathUtils.degToRad(state.twistAngle);
      const dTheta = (Math.PI * 2) / numRibs;
      const yClamped = Math.max(state.baseThickness + 1.4, Math.min(H - state.topRingHeight - 1.4, yMm));
      const t = yClamped / H;
      const { r: rOuter } = evaluateOuterProfile(t);
      const rShell = Math.max(18, rOuter - ribD * 0.35);
      const rad = rOuter + zRelOuterMm;
      const centerAngle = baseRibIdx * dTheta + twistRad * t;
      const angle = centerAngle + (xMm / rShell);
      return [rad * Math.cos(angle), yClamped, -rad * Math.sin(angle)];
    }

    function refineTriangulation2D(pts, tris, maxEdgeLen = 4.2) {
      const maxD2 = maxEdgeLen * maxEdgeLen;
      for (let pass = 0; pass < 10; pass++) {
        const edgeMap = new Map();
        for (let tIdx = 0; tIdx < tris.length; tIdx++) {
          const [a, b, c] = tris[tIdx];
          edgeMap.set(`${a}_${b}`, { tIdx, third: c });
          edgeMap.set(`${b}_${c}`, { tIdx, third: a });
          edgeMap.set(`${c}_${a}`, { tIdx, third: b });
        }
        const splits = [];
        for (const [key, e1] of edgeMap.entries()) {
          const sep = key.indexOf('_');
          const u = Number(key.slice(0, sep));
          const v = Number(key.slice(sep + 1));
          if (u >= v) continue;
          const e2 = edgeMap.get(`${v}_${u}`);
          if (!e2 || e1.tIdx === e2.tIdx) continue;
          const pu = pts[u], pv = pts[v];
          const dx = pv[0] - pu[0], dy = pv[1] - pu[1];
          const d2 = dx * dx + dy * dy;
          if (d2 > maxD2) {
            splits.push({ u, v, d2, t1: e1.tIdx, r: e1.third, t2: e2.tIdx, s: e2.third });
          }
        }
        if (splits.length === 0) break;
        splits.sort((a, b) => b.d2 - a.d2);
        const dirty = new Uint8Array(tris.length);
        let didSplit = 0;
        for (let i = 0; i < splits.length; i++) {
          const sp = splits[i];
          if (dirty[sp.t1] || dirty[sp.t2]) continue;
          const pu = pts[sp.u], pv = pts[sp.v], pr = pts[sp.r], ps = pts[sp.s];
          const mx = 0.5 * (pu[0] + pv[0]);
          const my = 0.5 * (pu[1] + pv[1]);
          const ux = pv[0] - pu[0], uy = pv[1] - pu[1];
          const segLen = Math.hypot(ux, uy) || 1;
          const alt1 = Math.abs(ux * (pr[1] - pu[1]) - uy * (pr[0] - pu[0])) / segLen;
          const alt2 = Math.abs(ux * (ps[1] - pu[1]) - uy * (ps[0] - pu[0])) / segLen;
          const dmR = Math.hypot(mx - pr[0], my - pr[1]);
          const dmS = Math.hypot(mx - ps[0], my - ps[1]);
          // Guard against collinear ear splits (e.g. bisection midpoint landing on boundary midpoint vertex)
          if (alt1 < 0.25 || alt2 < 0.25 || dmR < 0.25 || dmS < 0.25) continue;
          dirty[sp.t1] = 1;
          dirty[sp.t2] = 1;
          const mIdx = pts.length;
          pts.push([mx, my]);
          tris[sp.t1] = [sp.u, mIdx, sp.r];
          tris[sp.t2] = [sp.v, mIdx, sp.s];
          tris.push([mIdx, sp.v, sp.r], [mIdx, sp.u, sp.s]);
          didSplit++;
        }
        if (didSplit === 0) break;
      }
    }

    function extrudeCurvedShape(positions, baseRibIdx, outerPolyCCW, holesCW, zFront, zBack, maxSegLen = 3.5) {
      const outer = subdividePoly2D(ensureCCW2D(outerPolyCCW), maxSegLen);
      const holes = (holesCW || []).map(h => subdividePoly2D(ensureCW2D(h), maxSegLen));

      const contourV2 = outer.map(([x, y]) => new THREE.Vector2(x, y));
      const holesV2 = holes.map(h => h.map(([x, y]) => new THREE.Vector2(x, y)));
      const tris = THREE.ShapeUtils.triangulateShape(contourV2, holesV2);
      if (!tris || tris.length === 0) return;

      const allPts = outer.slice();
      for (let i = 0; i < holes.length; i++) {
        allPts.push(...holes[i]);
      }

      refineTriangulation2D(allPts, tris, Math.max(3.8, maxSegLen * 1.4));

      const front3D = allPts.map(([x, y]) => shellPointMmGlobal(baseRibIdx, x, y, zFront));
      const back3D = allPts.map(([x, y]) => shellPointMmGlobal(baseRibIdx, x, y, zBack));

      const directedEdges = new Set();
      const boundaryEdges = [];
      for (let i = 0; i < tris.length; i++) {
        const [a, b, c] = tris[i];
        positions.push(...front3D[a], ...front3D[b], ...front3D[c]);
        positions.push(...back3D[a], ...back3D[c], ...back3D[b]);
        directedEdges.add(`${a}_${b}`);
        directedEdges.add(`${b}_${c}`);
        directedEdges.add(`${c}_${a}`);
        boundaryEdges.push([a, b], [b, c], [c, a]);
      }

      for (let i = 0; i < boundaryEdges.length; i++) {
        const [u, v] = boundaryEdges[i];
        if (!directedEdges.has(`${v}_${u}`)) {
          const f0 = front3D[u], f1 = front3D[v];
          const b0 = back3D[u], b1 = back3D[v];
          positions.push(...f0, ...b0, ...b1);
          positions.push(...f0, ...b1, ...f1);
        }
      }
    }

    // ============================================================================
    // HOLLOW-FRAME SILHOUETTE MOTIF ENGINE (STARS, TREES, HEARTS, SNOWFLAKES)
    // ============================================================================
    function makeMotifPolygons(subType, yCenter, motifH, widthScale) {
      const R = motifH * 0.5;
      const W = motifH * 0.48 * widthScale;
      const fwBase = Math.min(2.3, Math.max(1.1, motifH * 0.085));
      const fw = Math.min(fwBase, Math.min(R, W) * 0.145);

      let outer = [];
      let inner = [];

      if (subType === 'star') {
        const scaleX = (W / R) * 1.16;
        const innerR = R * 0.43;
        for (let i = 0; i < 10; i++) {
          const rad = (i % 2 === 0) ? R : innerR;
          const ang = Math.PI / 2 + (i * Math.PI) / 5;
          outer.push([Math.cos(ang) * rad * scaleX, yCenter + Math.sin(ang) * rad]);
        }
        outer = ensureCCW2D(outer);
        inner = ensureCW2D(offsetPolygon2D(outer, fw));
      } else if (subType === 'tree') {
        const yBot   = yCenter - R;
        const yT1In  = yCenter - R * 0.24;
        const yT2Tip = yCenter - R * 0.14;
        const yT2In  = yCenter + R * 0.26;
        const yT3Tip = yCenter + R * 0.36;
        const yPeak  = yCenter + R;
        const w1 = W, w1In = W * 0.44, w2 = W * 0.80, w2In = W * 0.34, w3 = W * 0.56;
        outer = ensureCCW2D([
          [0, yPeak],
          [-w3, yT3Tip],
          [-w2In, yT2In],
          [-w2, yT2Tip],
          [-w1In, yT1In],
          [-w1, yBot],
          [+w1, yBot],
          [+w1In, yT1In],
          [+w2, yT2Tip],
          [+w2In, yT2In],
          [+w3, yT3Tip]
        ]);
        inner = ensureCW2D(offsetPolygon2D(outer, fw));
      } else if (subType === 'heart') {
        const steps = 28;
        const scaleW = Math.max(0.32, (W - fwBase * 1.15) / W);
        const scaleR = Math.max(0.32, (R - fwBase * 1.25) / R);
        for (let i = 0; i < steps; i++) {
          const t = (i / steps) * Math.PI * 2;
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          outer.push([(hx / 16) * W, yCenter + ((hy + 2.5) / 14.7) * R]);
          inner.push([(hx / 16) * W * scaleW, yCenter + ((hy + 2.5) / 14.7) * R * scaleR - fwBase * 0.08]);
        }
        outer = ensureCCW2D(outer);
        inner = ensureCW2D(inner);
      } else {
        const scaleX = W / R;
        const armW = Math.max(1.0, R * 0.14);
        const tipR = R;
        const rootR = R * 0.44;
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 2 + (i * Math.PI) / 3;
          const ca = Math.cos(a), sa = Math.sin(a);
          const nx = -sa, ny = ca;
          outer.push([(ca * rootR - nx * armW * 0.72) * scaleX, yCenter + sa * rootR - ny * armW * 0.72]);
          outer.push([(ca * (tipR - armW * 0.85) - nx * armW * 0.72) * scaleX, yCenter + sa * (tipR - armW * 0.85) - ny * armW * 0.72]);
          outer.push([(ca * tipR) * scaleX, yCenter + sa * tipR]);
          outer.push([(ca * (tipR - armW * 0.85) + nx * armW * 0.72) * scaleX, yCenter + sa * (tipR - armW * 0.85) + ny * armW * 0.72]);
          outer.push([(ca * rootR + nx * armW * 0.72) * scaleX, yCenter + sa * rootR + ny * armW * 0.72]);

          inner.push([ca * R * 0.25 * scaleX, yCenter + sa * R * 0.25]);
        }
        outer = ensureCCW2D(outer);
        inner = ensureCW2D(inner);
      }

      let exclCCW;
      if (subType === 'crystal') {
        exclCCW = ensureCCW2D(inner.map(([x, y]) => [x * 1.15, yCenter + (y - yCenter) * 1.15]));
      } else if (subType === 'heart') {
        exclCCW = ensureCCW2D(inner.map(([x, y], idx) => {
          const ox = outer[idx][0], oy = outer[idx][1];
          return [0.42 * ox + 0.58 * x, 0.42 * oy + 0.58 * y];
        }));
      } else {
        exclCCW = ensureCCW2D(offsetPolygon2D(outer, fw * 0.45));
      }

      return { outer, inner, exclCCW };
    }

    function buildMotifsGeometry(greetingPlan = null, cutoutExclusions = null) {
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
      const motifH = Math.max(14, state.motifSize || 22);
      const widthScale = (state.motifWidthScale || 100) / 100;
      const zFront = Math.max(0.2, Number(state.motifRelief) || 0.6);
      const zBack = -Math.min(ribD, Math.max(1.8, ribD * 0.85));
      const centerRatio = (state.motifHeightRatio || 49) / 100;

      const positions = [];

      const rowOffsets = numRows === 1
        ? [0]
        : (numRows === 2 ? [-0.23, +0.225] : [-0.24, 0, +0.24]);

      const mixCycle = ['tree', 'star', 'crystal'];
      const gPlan = greetingPlan || (state.greetingEnabled ? getGreetingPlacementPlan(false) : null);
      const hasSingleFrontPlaque = Boolean(gPlan && gPlan.count === 1);

      for (let rIdx = 0; rIdx < rowOffsets.length; rIdx++) {
        const yRow = Math.max(
          state.baseThickness + motifH * 0.56,
          Math.min(H - state.topRingHeight - motifH * 0.56, (centerRatio + rowOffsets[rIdx]) * H)
        );
        const rowShift = hasSingleFrontPlaque
          ? (rIdx % 2 === 0 ? 0.5 : 0)
          : (rIdx % 2 === 1 ? 0.5 : 0);
        const staggerSlots = rowShift * (numRibs / countPerRow);

        for (let m = 0; m < countPerRow; m++) {
          const slotRibIdx = ((m / countPerRow) * numRibs + staggerSlots) % numRibs;
          if (gPlan && doesMotifCollideWithGreeting(slotRibIdx, yRow, motifH, widthScale, gPlan, numRibs, H, ribD)) {
            continue;
          }
          let subType = state.motifType;
          if (subType === 'mix') {
            subType = (numRows === 2)
              ? (rIdx === 0 ? 'tree' : 'star')
              : mixCycle[(m + rIdx) % mixCycle.length];
          }
          const { outer, inner, exclCCW } = makeMotifPolygons(subType, yRow, motifH, widthScale);
          extrudeCurvedShape(positions, slotRibIdx, outer, [inner], zFront, zBack, 3.0);

          if (cutoutExclusions) {
            const bounds = polyBounds2D(exclCCW);
            const centerAngle = slotRibIdx * dTheta + twistRad * (yRow / H);
            cutoutExclusions.push({
              centerAngle,
              xMin: bounds.xMin,
              xMax: bounds.xMax,
              yMin: bounds.yMin,
              yMax: bounds.yMax,
              polyCCW: exclCCW
            });
          }
        }
      }

      if (positions.length === 0) return null;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.computeVertexNormals();
      return geo;
    }

    let lastGreetingWarnKey = '';

    function getGreetingPlacementPlan(logWarnings = true) {
      const glyphApi = (typeof window !== 'undefined' && window.LumenGlyphs)
        ? window.LumenGlyphs
        : (typeof LumenGlyphs !== 'undefined' ? LumenGlyphs : null);
      if (!glyphApi) return null;

      let cleanText = glyphApi.sanitizeGreetingText(state.greetingText, 24);
      if (!state.greetingEnabled || !cleanText) {
        updateGreetingInfoBadge(cleanText || '', Number(state.greetingSize) || 12, false, false);
        return null;
      }

      const style = (state.greetingStyle === 'relief') ? 'relief' : 'cutout';
      const H = state.height;
      const numRibs = Math.round(state.ribCount);
      const ribD = state.ribDepth;
      const count = Math.max(1, Math.min(6, Math.round(state.greetingCount || 1)));
      const requestedSize = Math.max(8, Math.min(24, Number(state.greetingSize) || 13));
      const reliefMm = style === 'cutout'
        ? Math.max(0.2, Math.min(2.6, Number(state.greetingRelief) || 0.6))
        : Math.max(1.2, Math.min(2.6, Number(state.greetingRelief) || 1.8));
      const requestedRatio = Math.max(30, Math.min(72, Number(state.greetingHeightRatio) || 48)) / 100;
      const yDesired = requestedRatio * H;

      const zBandFront = -0.60;
      const zBandRidge = -0.50;
      const zBandBack = Math.min(-2.20, -ribD + 0.60);
      const bandHalfThick = 0.5 * (zBandRidge - zBandBack);
      const bevelRadH = style === 'cutout' ? 0 : bandHalfThick * 1.08;

      const yMinAllowed = state.baseThickness + (style === 'cutout' ? 2.5 : 4.0);
      const yMaxAllowed = H - state.topRingHeight - (style === 'cutout' ? 2.5 : 4.0);
      const activeStab = state.stabilizerMode === 'none' ? 0 : Math.round(state.stabilizerCount || 0);
      const stabNorms = getStabilizerNormalizedHeights(activeStab)
        .map(t => t * H)
        .filter(yR => yR > yMinAllowed - 4.0 && yR < yMaxAllowed + 4.0)
        .sort((a, b) => a - b);

      const freeZones = [];
      let curBot = yMinAllowed;
      for (let i = 0; i < stabNorms.length; i++) {
        const forbidBot = stabNorms[i] - 4.0;
        const forbidTop = stabNorms[i] + 4.0;
        if (forbidBot > curBot + 1.0) {
          freeZones.push({ bot: curBot, top: Math.min(yMaxAllowed, forbidBot) });
        }
        curBot = Math.max(curBot, forbidTop);
      }
      if (yMaxAllowed > curBot + 1.0) {
        freeZones.push({ bot: curBot, top: yMaxAllowed });
      }
      if (freeZones.length === 0) {
        freeZones.push({ bot: yMinAllowed, top: Math.max(yMinAllowed + 12, yMaxAllowed) });
      }

      const { r: rEst } = evaluateOuterProfile(Math.max(0.15, Math.min(0.85, requestedRatio)));
      const rShellEst = Math.max(18, rEst - ribD * 0.35);
      const ribPitchEst = (2 * Math.PI * rShellEst) / numRibs;
      const archClimbEst = style === 'cutout' ? 0 : 0.5 * ribPitchEst * 1.08;

      function spansForSize(sMm) {
        if (style === 'cutout') {
          const padY = Math.max(3.0, sMm * 0.25);
          const flatHalfH = sMm * 0.5 + padY;
          return { padY, flatHalfH, topSpan: flatHalfH, botSpan: flatHalfH, totalSpan: 2 * flatHalfH };
        }
        const padY = Math.max(1.6, sMm * 0.15);
        const flatHalfH = sMm * 0.54 + padY;
        const topSpan = flatHalfH + bevelRadH;
        const botSpan = flatHalfH + bevelRadH + archClimbEst;
        return { padY, flatHalfH, topSpan, botSpan, totalSpan: topSpan + botSpan };
      }

      let effSize = requestedSize;
      const widestZone = freeZones.reduce((best, z) => ((z.top - z.bot) > (best.top - best.bot) ? z : best), freeZones[0]);
      const maxZoneH = widestZone.top - widestZone.bot;
      while (effSize > 6.0 && spansForSize(effSize).totalSpan > maxZoneH) {
        effSize = Math.max(6.0, +(effSize - 0.2).toFixed(2));
      }

      const initialSpans = spansForSize(effSize);
      let yCenter = yDesired;
      let bestDist = Infinity;
      for (let i = 0; i < freeZones.length; i++) {
        const z = freeZones[i];
        const minC = z.bot + initialSpans.botSpan;
        const maxC = z.top - initialSpans.topSpan;
        if (maxC >= minC) {
          const candidate = Math.max(minC, Math.min(maxC, yDesired));
          const dist = Math.abs(candidate - yDesired);
          if (dist < bestDist) {
            bestDist = dist;
            yCenter = candidate;
          }
        }
      }
      if (bestDist === Infinity) {
        yCenter = Math.max(
          widestZone.bot + initialSpans.botSpan,
          Math.min(widestZone.top - initialSpans.topSpan, 0.5 * (widestZone.bot + widestZone.top))
        );
      }

      const heightShifted = Math.abs(yCenter - yDesired) > 0.6;

      const { r: rOuter } = evaluateOuterProfile(yCenter / H);
      const rShell = Math.max(18, rOuter - ribD * 0.35);
      const circumferenceMm = 2 * Math.PI * rShell;
      const ribPitchMm = circumferenceMm / numRibs;
      const maxBaysPerBand = count === 1
        ? Math.max(2, numRibs - 2)
        : Math.max(1, Math.floor(numRibs / count) - 1);
      const maxArcMm = (style === 'cutout' && count === 1)
        ? Math.min(maxBaysPerBand * ribPitchMm, circumferenceMm * 0.34)
        : maxBaysPerBand * ribPitchMm;

      function computePadX(sz) {
        if (style === 'cutout') {
          const sp = spansForSize(sz);
          return Math.max(7.2, sp.flatHalfH * 0.88);
        }
        return Math.max(1.8, sz * 0.20);
      }

      const layoutFn = (style === 'cutout' && typeof glyphApi.layoutCutoutGreeting === 'function')
        ? glyphApi.layoutCutoutGreeting
        : glyphApi.layoutGreetingString;

      let padX = computePadX(effSize);
      let layout = layoutFn(cleanText, effSize);
      while (effSize > 6.0 && (layout.totalWidthMm + 2 * padX > maxArcMm)) {
        effSize = Math.max(6.0, +(effSize - 0.2).toFixed(2));
        padX = computePadX(effSize);
        layout = layoutFn(cleanText, effSize);
      }

      let wasTruncated = false;
      if (layout.totalWidthMm + 2 * padX > maxArcMm) {
        wasTruncated = true;
        const words = cleanText.split(' ').filter(Boolean);
        while (words.length > 1) {
          words.pop();
          const candidateText = words.join(' ');
          const candLayout = layoutFn(candidateText, effSize);
          if (candLayout.totalWidthMm + 2 * padX <= maxArcMm) {
            cleanText = candidateText;
            layout = candLayout;
            break;
          }
        }
        while (cleanText.length > 1 && (layout.totalWidthMm + 2 * padX > maxArcMm)) {
          cleanText = cleanText.slice(0, -1).trim();
          layout = layoutFn(cleanText, effSize);
        }
      }

      const finalSpans = spansForSize(effSize);
      const archClimbH = style === 'cutout' ? 0 : 0.5 * ribPitchMm * 1.08;
      const yFlatBot = yCenter - finalSpans.flatHalfH;
      const yFlatTop = yCenter + finalSpans.flatHalfH;
      const yBandTotalBot = yFlatBot - bevelRadH - archClimbH;
      const yBandTotalTop = yFlatTop + bevelRadH;

      const neededWidthMm = layout.totalWidthMm + 2 * padX;
      const spanBays = Math.max(1, Math.min(maxBaysPerBand, Math.ceil(neededWidthMm / ribPitchMm)));

      const bands = [];
      for (let bIdx = 0; bIdx < count; bIdx++) {
        if (style === 'cutout') {
          const centerRib = (bIdx / count) * numRibs;
          const kLeft = Math.floor(centerRib - spanBays * 0.5);
          const kRight = kLeft + spanBays;
          bands.push({ kLeft, kRight, centerRib, spanBays });
        } else {
          const kLeft = Math.round((bIdx / count) * numRibs - spanBays * 0.5);
          const kRight = kLeft + spanBays;
          const centerRib = kLeft + spanBays * 0.5;
          bands.push({ kLeft, kRight, centerRib, spanBays });
        }
      }

      if (logWarnings) {
        const warnKey = `${style}|${cleanText}|${effSize.toFixed(1)}|${Math.round(yCenter)}|${heightShifted}|${wasTruncated}`;
        if (warnKey !== lastGreetingWarnKey) {
          lastGreetingWarnKey = warnKey;
          if (heightShifted) {
            console.warn(
              `[Lumenrib Christmas Text] Vertical position adjusted from ${yDesired.toFixed(1)} mm to ${yCenter.toFixed(1)} mm (${Math.round((yCenter / H) * 100)} %) to maintain >= 4 mm clearance from rings and edges.`
            );
          }
          if (wasTruncated) {
            console.warn(
              `[Lumenrib Christmas Text] Text truncated at word boundary at 6.0 mm minimum size to "${cleanText}" (available arc: ${maxArcMm.toFixed(1)} mm).`
            );
          }
        }
      }

      updateGreetingInfoBadge(cleanText, effSize, effSize < requestedSize - 0.05, heightShifted);

      return {
        style,
        cleanText,
        effSize,
        requestedSize,
        reliefMm,
        count,
        padX,
        padY: finalSpans.padY,
        flatHalfH: finalSpans.flatHalfH,
        neededWidthMm,
        yCenter,
        yFlatBot,
        yFlatTop,
        yBandTotalBot,
        yBandTotalTop,
        bevelRadH,
        archClimbH,
        zBandFront,
        zBandRidge,
        zBandBack,
        ribPitchMm,
        spanBays,
        bands,
        layout
      };
    }

    function doesMotifCollideWithGreeting(slotRibIdx, yRow, motifH, widthScale, plan, numRibs, H, ribD) {
      if (!plan) return false;
      const motifBot = yRow - motifH * 0.50;
      const motifTop = yRow + motifH * 0.50;
      if (motifTop <= plan.yBandTotalBot - 0.2 || motifBot >= plan.yBandTotalTop + 0.2) {
        return false;
      }
      const { r: rOuter } = evaluateOuterProfile(Math.max(0.08, Math.min(0.92, yRow / H)));
      const ribPitchAtRow = (2 * Math.PI * Math.max(18, rOuter - ribD * 0.35)) / numRibs;
      const motifHalfW = motifH * 0.48 * widthScale;
      const motifHalfRibs = (motifHalfW / ribPitchAtRow) + 0.55;

      for (let i = 0; i < plan.bands.length; i++) {
        const b = plan.bands[i];
        const bandCenterMod = ((b.centerRib % numRibs) + numRibs) % numRibs;
        let diff = Math.abs(slotRibIdx - bandCenterMod);
        if (diff > numRibs * 0.5) diff = numRibs - diff;
        if (diff <= b.spanBays * 0.5 + motifHalfRibs) {
          return true;
        }
      }
      return false;
    }

    function makeCapsulePoly2D(widthMm, heightMm, yCenter, capSteps = 12) {
      const halfH = heightMm * 0.5;
      const rCap = Math.min(halfH, widthMm * 0.45);
      const straightHalf = Math.max(0.5, widthMm * 0.5 - rCap);
      const crown = Math.min(0.9, halfH * 0.08);
      const pts = [];
      // Right semicircle: -PI/2 -> +PI/2 (CCW)
      for (let i = 0; i <= capSteps; i++) {
        const a = -Math.PI * 0.5 + (i / capSteps) * Math.PI;
        pts.push([straightHalf + Math.cos(a) * rCap, yCenter + Math.sin(a) * halfH]);
      }
      // Subtle curved top span (+straightHalf -> -straightHalf)
      const spanSteps = Math.max(4, Math.ceil((straightHalf * 2) / 3.0));
      for (let i = 1; i < spanSteps; i++) {
        const f = i / spanSteps;
        const x = straightHalf - 2 * straightHalf * f;
        pts.push([x, yCenter + halfH + Math.sin(Math.PI * f) * crown]);
      }
      // Left semicircle: +PI/2 -> +3*PI/2 (CCW)
      for (let i = 0; i <= capSteps; i++) {
        const a = Math.PI * 0.5 + (i / capSteps) * Math.PI;
        pts.push([-straightHalf + Math.cos(a) * rCap, yCenter + Math.sin(a) * halfH]);
      }
      // Subtle curved bottom span (-straightHalf -> +straightHalf)
      for (let i = 1; i < spanSteps; i++) {
        const f = i / spanSteps;
        const x = -straightHalf + 2 * straightHalf * f;
        pts.push([x, yCenter - halfH - Math.sin(Math.PI * f) * crown]);
      }
      return ensureCCW2D(pts);
    }

    // ============================================================================
    // 3D CHRISTMAS GREETING PLAQUE (CUTOUT STENCIL) & RELIEF TEXT ENGINE
    // ============================================================================
    function buildGreetingGeometry(planArg = null, cutoutExclusions = null) {
      const plan = planArg || getGreetingPlacementPlan(true);
      if (!plan) return null;

      const H = state.height;
      const numRibs = Math.round(state.ribCount);
      const ribD = state.ribDepth;
      const ribW = state.ribWidth;
      const twistRad = THREE.MathUtils.degToRad(state.twistAngle);
      const dTheta = (Math.PI * 2) / numRibs;

      const positions = [];

      if (plan.style === 'cutout') {
        const plaqueH = plan.flatHalfH * 2;
        const plaqueW = Math.max(plaqueH * 1.15, plan.layout.totalWidthMm + 2 * plan.padX);
        const zFront = Math.max(0.2, plan.reliefMm);
        const zBack = -Math.min(ribD, Math.max(2.2, ribD * 0.90));

        const outerPlaqueCCW = makeCapsulePoly2D(plaqueW, plaqueH, plan.yCenter, 12);
        const glyphHolesCW = [];
        const yBotText = plan.yCenter - 0.5 * plan.effSize;

        for (let i = 0; i < plan.layout.items.length; i++) {
          const item = plan.layout.items[i];
          const x0 = item.xStart;
          for (let hIdx = 0; hIdx < item.holesNorm.length; hIdx++) {
            const holeNorm = item.holesNorm[hIdx];
            const hole2D = holeNorm.map(([u, v]) => [x0 + u * item.boxW, yBotText + v * plan.effSize]);
            glyphHolesCW.push(ensureCW2D(hole2D));
          }
        }

        // Rib exclusion inset by 1.65mm inside pill rim: ribs anchor solidly inside border without crossing letters!
        const insetDist = Math.min(1.65, plan.padY * 0.55);
        const exclCCW = ensureCCW2D(offsetPolygon2D(outerPlaqueCCW, insetDist));
        const exclBounds = polyBounds2D(exclCCW);

        for (let bIdx = 0; bIdx < plan.bands.length; bIdx++) {
          const band = plan.bands[bIdx];
          extrudeCurvedShape(positions, band.centerRib, outerPlaqueCCW, glyphHolesCW, zFront, zBack, 2.5);

          if (cutoutExclusions) {
            const centerAngle = band.centerRib * dTheta + twistRad * (plan.yCenter / H);
            cutoutExclusions.push({
              centerAngle,
              xMin: exclBounds.xMin,
              xMax: exclBounds.xMax,
              yMin: exclBounds.yMin,
              yMax: exclBounds.yMax,
              polyCCW: exclCCW
            });
          }
        }

        if (positions.length === 0) return null;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.computeVertexNormals();
        return geo;
      }

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

      function addReliefLoft(baseRibIdx, slices) {
        if (!slices || slices.length < 2) return;
        const rings = [];
        for (let i = 0; i < slices.length; i++) {
          const s = slices[i];
          const xMid = 0.5 * (s.xL + s.xR);
          const halfW = 0.5 * (s.xR - s.xL);
          const xLBack = xMid - halfW * 0.92;
          const xRBack = xMid + halfW * 0.92;

          rings.push([
            shellPointMm(baseRibIdx, xMid,   s.y, s.zRidge),
            shellPointMm(baseRibIdx, s.xR,   s.y, s.zFront),
            shellPointMm(baseRibIdx, xRBack, s.y, s.zBack),
            shellPointMm(baseRibIdx, xMid,   s.y, s.zBack - 0.20),
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
        const first = rings[0];
        const last = rings[rings.length - 1];
        for (let c = 1; c < n - 1; c++) {
          positions.push(...first[0], ...first[c + 1], ...first[c]);
          positions.push(...last[0], ...last[c], ...last[c + 1]);
        }
      }

      const {
        effSize,
        reliefMm,
        yCenter,
        yFlatBot,
        yFlatTop,
        bevelRadH,
        zBandFront,
        zBandRidge,
        zBandBack,
        bands,
        layout
      } = plan;

      const zBandMid = 0.5 * (zBandRidge + zBandBack);
      const ribEmbedMm = Math.max(0.85, ribW * 0.38);

      // Helper for rib pitch at any height y
      function ribPitchAtY(yMm) {
        const t = Math.max(0.05, Math.min(0.95, yMm / H));
        const { r: rOuter } = evaluateOuterProfile(t);
        const rShell = Math.max(20, rOuter - ribD * 0.35);
        return (2 * Math.PI * rShell) / numRibs;
      }

      for (let bIdx = 0; bIdx < bands.length; bIdx++) {
        const band = bands[bIdx];
        const { kLeft, spanBays, centerRib } = band;

        // 1. Build closed recessed wall per rib bay with 42.8° bottom V-arch and 42.8° top/bottom Dachform bevels
        for (let bay = 0; bay < spanBays; bay++) {
          const bayMidRib = kLeft + bay + 0.5;
          const pCenter = ribPitchAtY(yCenter);
          const halfGap = 0.5 * pCenter;
          const climbH = halfGap * 1.08; // 42.8° support-free rise between adjacent ribs
          const yBevelBot = yFlatBot - bevelRadH;
          const yArchStart = yBevelBot - climbH;
          const yBevelTop = yFlatTop + bevelRadH;

          // Left & Right 42.8° rising gothic half-arches from rib k and rib k+1 meeting at bay center (x = 0)
          [-1, +1].forEach(dir => {
            const xRib = dir * halfGap;
            const xRibOuter = dir * (halfGap + ribEmbedMm * 0.6);
            addReliefLoft(bayMidRib, [
              {
                y: yArchStart,
                xL: Math.min(xRibOuter, xRib - dir * 0.5),
                xR: Math.max(xRibOuter, xRib - dir * 0.5),
                zFront: zBandMid + 0.15,
                zRidge: zBandMid + 0.25,
                zBack: zBandBack
              },
              {
                y: yBevelBot,
                xL: dir < 0 ? -halfGap - ribEmbedMm * 0.7 : -0.45,
                xR: dir < 0 ? +0.45 : +halfGap + ribEmbedMm * 0.7,
                zFront: zBandMid + 0.20,
                zRidge: zBandMid + 0.30,
                zBack: zBandBack
              },
              {
                y: yFlatBot,
                xL: dir < 0 ? -halfGap - ribEmbedMm * 0.8 : -0.45,
                xR: dir < 0 ? +0.45 : +halfGap + ribEmbedMm * 0.8,
                zFront: zBandFront,
                zRidge: zBandRidge,
                zBack: zBandBack
              }
            ]);
          });

          // Main recessed band wall in this bay with 4 vertical stations + 42.8° top roof bevel (Dachform)
          const wallSlices = [
            {
              y: yBevelBot,
              xL: -halfGap - ribEmbedMm * 0.7,
              xR: +halfGap + ribEmbedMm * 0.7,
              zFront: zBandMid + 0.15,
              zRidge: zBandMid + 0.25,
              zBack: zBandMid - 0.15
            }
          ];
          const vSteps = 4;
          for (let vs = 0; vs <= vSteps; vs++) {
            const fy = vs / vSteps;
            const yCur = yFlatBot + (yFlatTop - yFlatBot) * fy;
            const halfGapCur = 0.5 * ribPitchAtY(yCur);
            wallSlices.push({
              y: yCur,
              xL: -halfGapCur - ribEmbedMm,
              xR: +halfGapCur + ribEmbedMm,
              zFront: zBandFront,
              zRidge: zBandRidge,
              zBack: zBandBack
            });
          }
          const halfGapTop = 0.5 * ribPitchAtY(yBevelTop);
          wallSlices.push({
            y: yBevelTop,
            xL: -halfGapTop - ribEmbedMm * 0.7,
            xR: +halfGapTop + ribEmbedMm * 0.7,
            zFront: zBandMid + 0.15,
            zRidge: zBandMid + 0.25,
            zBack: zBandMid - 0.15
          });
          addReliefLoft(bayMidRib, wallSlices);
        }

        // 2. End transitions (Endübergang): grow band ends cleanly into bounding ribs kLeft and kRight at <= 42.8°
        [-1, +1].forEach(endDir => {
          const endRibIdx = endDir < 0 ? kLeft : kLeft + spanBays;
          const xInward = -endDir * (ribEmbedMm * 0.95);
          const xOutward = endDir * (ribEmbedMm * 0.45);
          const xL = Math.min(xInward, xOutward);
          const xR = Math.max(xInward, xOutward);
          const endRampH = 0.55 * 1.08;
          addReliefLoft(endRibIdx, [
            { y: yFlatBot - endRampH, xL, xR, zFront: zBandFront, zRidge: zBandRidge, zBack: zBandBack },
            { y: yFlatBot + 0.4,      xL, xR, zFront: -0.20,      zRidge: -0.15,      zBack: zBandBack },
            { y: yFlatTop - 0.4,      xL, xR, zFront: -0.20,      zRidge: -0.15,      zBack: zBandBack },
            { y: yFlatTop + endRampH, xL, xR, zFront: zBandFront, zRidge: zBandRidge, zBack: zBandBack }
          ]);
        });

        // 3. Proud 3D Greeting Glyph Relief on the recessed band surface (100% <= 43.3° overhang)
        const yGlyphBase = yCenter - effSize * 0.5;
        const strokeW = layout.strokeW; // >= 1.6 mm
        const innerH = Math.max(strokeW * 1.4, effSize - strokeW);
        const zGlyphBack = zBandFront - 0.45; // -1.05 mm (embedded inside band wall)
        const zGlyphFront = zBandFront + reliefMm * 0.92;
        const zGlyphRidge = zBandFront + reliefMm;
        const bevelH = (reliefMm + 0.10) * 1.06; // 43.3° radial bottom & top ramp

        for (let gIdx = 0; gIdx < layout.items.length; gIdx++) {
          const item = layout.items[gIdx];
          const { def, xStart, innerW } = item;

          // 3a. Horizontal glyph bars [uL, uR, v] with 43.3° bottom chamfer & 43.3° top bevel
          for (let b = 0; b < def.bars.length; b++) {
            const [uL, uR, v] = def.bars[b];
            const xL = xStart + uL * innerW;
            const xR = Math.max(xL + strokeW, xStart + uR * innerW + strokeW);
            const yBot = yGlyphBase + v * innerH;
            const yTop = yBot + strokeW;

            addReliefLoft(centerRib, [
              { y: yBot - bevelH, xL: xL + 0.10, xR: xR - 0.10, zFront: zBandFront,  zRidge: zBandRidge,  zBack: zGlyphBack },
              { y: yBot,          xL,            xR,            zFront: zGlyphFront, zRidge: zGlyphRidge, zBack: zGlyphBack },
              { y: yTop,          xL,            xR,            zFront: zGlyphFront, zRidge: zGlyphRidge, zBack: zGlyphBack },
              { y: yTop + bevelH, xL: xL + 0.10, xR: xR - 0.10, zFront: zBandFront,  zRidge: zBandRidge,  zBack: zGlyphBack }
            ]);
          }

          // 3b. Vertical & diagonal glyph stems [u0, v0, u1, v1] with <= 42.0° tangential slope & 43.3° radial bevels
          for (let s = 0; s < def.stems.length; s++) {
            let [u0, v0, u1, v1] = def.stems[s];
            if (v0 > v1) {
              const tu = u0; u0 = u1; u1 = tu;
              const tv = v0; v0 = v1; v1 = tv;
            }
            let x0 = xStart + strokeW * 0.5 + u0 * innerW;
            let x1 = xStart + strokeW * 0.5 + u1 * innerW;
            const y0 = yGlyphBase + v0 * innerH;
            const y1 = Math.max(y0 + strokeW * 0.75, yGlyphBase + v1 * innerH + strokeW);

            // Enforce <= 42.0° tangential overhang on diagonal stems
            const maxDx = (y1 - y0) * 0.90;
            const curDx = x1 - x0;
            if (Math.abs(curDx) > maxDx) {
              const xMidStem = 0.5 * (x0 + x1);
              const halfClamped = 0.5 * maxDx * Math.sign(curDx);
              x0 = xMidStem - halfClamped;
              x1 = xMidStem + halfClamped;
            }

            const stemSlices = [
              {
                y: y0 - bevelH,
                xL: x0 - strokeW * 0.45,
                xR: x0 + strokeW * 0.45,
                zFront: zBandFront,
                zRidge: zBandRidge,
                zBack: zGlyphBack
              }
            ];
            const steps = Math.max(1, Math.min(3, Math.ceil((y1 - y0) / 5.0)));
            for (let st = 0; st <= steps; st++) {
              const f = st / steps;
              const xCur = x0 + (x1 - x0) * f;
              const yCur = y0 + (y1 - y0) * f;
              stemSlices.push({
                y: yCur,
                xL: xCur - strokeW * 0.5,
                xR: xCur + strokeW * 0.5,
                zFront: zGlyphFront,
                zRidge: zGlyphRidge,
                zBack: zGlyphBack
              });
            }
            stemSlices.push({
              y: y1 + bevelH,
              xL: x1 - strokeW * 0.45,
              xR: x1 + strokeW * 0.45,
              zFront: zBandFront,
              zRidge: zBandRidge,
              zBack: zGlyphBack
            });

            addReliefLoft(centerRib, stemSlices);
          }
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

      // 3. Collect cutout plaques & hollow motifs first so vertical ribs cleanly stop inside borders
      const cutoutExclusions = [];
      const greetingPlan = getGreetingPlacementPlan(true);
      const greetingGeo = buildGreetingGeometry(greetingPlan, cutoutExclusions);
      const motifsGeo = buildMotifsGeometry(greetingPlan, cutoutExclusions);

      // 4. Curved Parametric Ribs (clipped cleanly at hollow motif / cutout interiors)
      const { geo: ribsGeo, maxOverhangAngleDeg } = buildRibsGeometry(cutoutExclusions);

      // 5. Optional Anti-Vibration Stabilizer Rings (Breakaway or Permanent)
      const stabGeo = buildStabilizerRingsGeometry();
      let breakawayPreviewGeo = null;
      let motifsPreviewGeo = null;

      const geosToMerge = [baseGeo, topRingGeo, ribsGeo];
      const highlightGeos = [];
      if (motifsGeo) {
        highlightGeos.push(motifsGeo.clone());
        geosToMerge.push(motifsGeo);
      }
      if (greetingGeo) {
        highlightGeos.push(greetingGeo.clone());
        geosToMerge.push(greetingGeo);
      }
      if (highlightGeos.length > 0) {
        motifsPreviewGeo = mergeBufferGeometries(highlightGeos);
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

      // Subtle surface finish overlay on decorative plaques & motifs
      if (motifsPreviewGeo) {
        const baseCol = new THREE.Color(state.lanternColor);
        const highlightCol = baseCol.clone().lerp(new THREE.Color(0xfff3db), 0.05);
        const motifHighlightMat = new THREE.MeshStandardMaterial({
          color: highlightCol,
          roughness: 0.54,
          metalness: 0.08,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
          clippingPlanes: activeClips
        });
        const motifHighlightMesh = new THREE.Mesh(motifsPreviewGeo, motifHighlightMat);
        motifHighlightMesh.name = 'motifHighlight';
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
        checkOpenText.textContent = `+${openingDiff.toFixed(0)} mm clearance`;
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
        checkOverhangText.textContent = `Max. ${roundedOverhang}° (support-free)`;
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
      const hasCircumferentialTie = (state.motifType !== 'none' && state.motifCount >= 4) || state.greetingEnabled;
      const rawFreeSpanMm = Math.max(8, Math.round(maxUpperSpanMm));
      const freeSpanMm = (activeRings === 0 && state.height <= 115 && hasCircumferentialTie)
        ? Math.max(8, Math.round(rawFreeSpanMm * 0.42))
        : rawFreeSpanMm;
      state.lastFreeSpanMm = freeSpanMm;
      const spans = activeRings + 1;
      const stiffnessGain = Math.pow(spans, 3);
      const spanBadge = document.getElementById('free-span-badge');
      if (spanBadge) {
        if (activeRings > 0) {
          spanBadge.textContent = `~${freeSpanMm} mm (${stiffnessGain}× stiffer)`;
          spanBadge.className = 'font-mono font-bold text-teal-300';
        } else if (state.height <= 115 && hasCircumferentialTie) {
          spanBadge.textContent = `~${freeSpanMm} mm (supported by motifs)`;
          spanBadge.className = 'font-mono font-bold text-teal-300';
        } else {
          spanBadge.textContent = `${freeSpanMm} mm (unsupported!)`;
          spanBadge.className = freeSpanMm > 60 ? 'font-mono font-bold text-rose-400' : 'font-mono font-bold text-amber-300';
        }
      }

      if (currentLanternGeometry) {
        const triCount = Math.round(currentLanternGeometry.attributes.position.count / 3);
        document.getElementById('mesh-stats').textContent = `${triCount.toLocaleString('en-GB')} triangles • scale 1:1 (mm)`;
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

    let greetingDebounceTimer = null;

    function updateGreetingInfoBadge(cleanText, effSizeMm, autoScaled, heightShifted) {
      const infoEl = document.getElementById('val-greetingInfo');
      if (!infoEl) return;
      const len = cleanText ? cleanText.length : 0;
      const sizeStr = `${Number(effSizeMm || state.greetingSize || 12).toFixed(1)} mm`;
      const scaleTag = autoScaled ? ' (auto)' : '';
      const shiftTag = heightShifted ? ' • zone shifted' : '';
      infoEl.textContent = `${sizeStr}${scaleTag} • ${len}/24 chars${shiftTag}`;
    }

    function syncGreetingUI() {
      const enabled = Boolean(state.greetingEnabled);
      const btnOff = document.getElementById('greeting-btn-off');
      const btnOn = document.getElementById('greeting-btn-on');
      const activeCls = 'py-2.5 px-2 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/40 transition-all flex flex-col items-center gap-1';
      const inactiveCls = 'py-2.5 px-2 rounded-xl text-xs font-medium bg-studio-800 text-gray-300 hover:text-white border border-white/10 transition-all flex flex-col items-center gap-1';
      if (btnOff) btnOff.className = !enabled ? activeCls : inactiveCls;
      if (btnOn) btnOn.className = enabled ? activeCls : inactiveCls;

      const wrap = document.getElementById('greeting-controls-wrap');
      if (wrap) {
        if (enabled) {
          wrap.classList.remove('opacity-40', 'pointer-events-none');
        } else {
          wrap.classList.add('opacity-40', 'pointer-events-none');
        }
      }

      const textInput = document.getElementById('param-greetingText');
      if (textInput && document.activeElement !== textInput) {
        textInput.value = state.greetingText || '';
      }

      document.querySelectorAll('.greeting-chip').forEach(chip => {
        const chipText = chip.dataset.chip || '';
        if (chipText && chipText === state.greetingText) {
          chip.className = 'greeting-chip px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-amber-500/25 text-amber-200 border border-amber-400/40 transition-all';
        } else {
          chip.className = 'greeting-chip px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-studio-800 text-gray-300 hover:text-white border border-white/10 transition-all';
        }
      });

      const style = state.greetingStyle === 'relief' ? 'relief' : 'cutout';
      const styleCutoutBtn = document.getElementById('greeting-style-cutout');
      const styleReliefBtn = document.getElementById('greeting-style-relief');
      const styleActiveCls = 'py-2 px-2 rounded-lg text-[11px] font-semibold bg-amber-500/25 text-amber-200 border border-amber-400/40 transition-all';
      const styleInactiveCls = 'py-2 px-2 rounded-lg text-[11px] font-medium bg-studio-800 text-gray-400 hover:text-white border border-white/10 transition-all';
      if (styleCutoutBtn) styleCutoutBtn.className = style === 'cutout' ? styleActiveCls : styleInactiveCls;
      if (styleReliefBtn) styleReliefBtn.className = style === 'relief' ? styleActiveCls : styleInactiveCls;

      const glyphApi = (typeof window !== 'undefined' && window.LumenGlyphs) ? window.LumenGlyphs : null;
      const clean = glyphApi ? glyphApi.sanitizeGreetingText(state.greetingText, 24) : (state.greetingText || '');
      updateGreetingInfoBadge(clean, state.greetingSize, false, false);
    }

    function setGreetingStyle(styleVal, skipRebuild = false) {
      state.greetingStyle = (styleVal === 'relief') ? 'relief' : 'cutout';
      syncGreetingUI();
      if (!skipRebuild) {
        rebuildAll();
      }
    }

    function setGreetingEnabled(flag, skipRebuild = false) {
      if (typeof flag === 'boolean') {
        state.greetingEnabled = flag;
      } else {
        state.greetingEnabled = !state.greetingEnabled;
      }
      syncGreetingUI();
      if (!skipRebuild) {
        rebuildAll();
      }
    }

    function toggleGreeting() {
      setGreetingEnabled(!state.greetingEnabled, false);
    }

    function setGreetingPreset(textVal) {
      if (greetingDebounceTimer) {
        clearTimeout(greetingDebounceTimer);
        greetingDebounceTimer = null;
      }
      const glyphApi = (typeof window !== 'undefined' && window.LumenGlyphs) ? window.LumenGlyphs : null;
      const sanitized = glyphApi ? glyphApi.sanitizeGreetingText(textVal, 24) : String(textVal || '').slice(0, 24);
      state.greetingText = sanitized || 'FROHE WEIHNACHTEN';
      state.greetingEnabled = true;
      const textInput = document.getElementById('param-greetingText');
      if (textInput) textInput.value = state.greetingText;
      syncGreetingUI();
      rebuildAll();
    }

    function onGreetingTextInput(_arg, rawValue) {
      const glyphApi = (typeof window !== 'undefined' && window.LumenGlyphs) ? window.LumenGlyphs : null;
      const rawStr = String(rawValue == null ? '' : rawValue);
      const hasTrailingSpace = rawStr.length > 0 && rawStr[rawStr.length - 1] === ' ';
      let filtered = glyphApi ? glyphApi.sanitizeGreetingText(rawStr, 24) : rawStr.slice(0, 24);
      const textInput = document.getElementById('param-greetingText');
      if (textInput) {
        const displayVal = (hasTrailingSpace && filtered.length > 0 && filtered.length < 24) ? `${filtered} ` : filtered;
        if (textInput.value !== displayVal) {
          textInput.value = displayVal;
        }
      }
      updateGreetingInfoBadge(filtered, state.greetingSize, false, false);

      if (greetingDebounceTimer) {
        clearTimeout(greetingDebounceTimer);
      }
      greetingDebounceTimer = setTimeout(() => {
        greetingDebounceTimer = null;
        state.greetingText = filtered || 'FROHE WEIHNACHTEN';
        syncGreetingUI();
        rebuildAll();
      }, 340);
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
        ? 'holds <strong>only 1 lower pin</strong> per rib (no upper pin)'
        : (s === 1
          ? 'pro Stab halten 2 Pins'
          : `4 of ${s} ribs have <strong>only 1 pin</strong> (2nd micro pin on every ${s}th rib only)`);
      descEl.innerHTML = `<strong>Top-down leverage (6.5× lever):</strong> Reach through the top opening and press down on the angled inner edge (${state.stabilizerWidth.toFixed(1)} mm). Since ${upperInfo} and the breakaway point is only <strong>${state.stabilizerNeck.toFixed(2)} mm</strong> thin, the ring peels the pins off in a domino effect without bending the ribs!`;
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
          labelEl.textContent = 'Ring & lever height';
          updateBreakawayDescText();
        } else {
          if (neckWrap) neckWrap.classList.add('hidden');
          labelEl.textContent = 'Ring height (permanent inner ring)';
          descEl.innerHTML = 'Fixed, self-supporting stabiliser ring in the lantern colour, printed at a 42° angle from below. Needs no slicer support and permanently connects all ribs.';
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
          const decimals = ['ribWidth', 'ribDepth', 'topRingHeight', 'stabilizerWidth', 'stabilizerThickness', 'motifRelief', 'greetingRelief', 'baseThickness', 'recessDepth', 'candleClearance', 'recessRimWidth'].includes(key) ? 1 : 0;
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

        // Keep the function bar (candle, shadows, section view, fit test) visible and centred at the bottom in fullscreen
        bottomRight.classList.remove('sm:left-auto', 'sm:items-end');
        bottomRight.classList.add('left-4', 'right-4', 'items-center');

        viewportWrapper.classList.remove('h-[52vh]');
        viewportWrapper.classList.add('h-screen');

        iconExpand.classList.add('hidden');
        iconCollapse.classList.remove('hidden');
        btnText.textContent = 'Show menu';
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
        btnText.textContent = 'Fullscreen';
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
          stabilizerMode: 'breakaway',
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
          motifType: 'none',
          greetingEnabled: false
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
          stabilizerMode: 'breakaway',
          motifType: 'none',
          greetingEnabled: false
        },
        xmas: {
          height: 105,
          bellyDia: 104,
          topInnerDia: 58,
          baseOuterDia: 68,
          bellyHeightRatio: 43,
          curveTension: 54,
          ribCount: 36,
          ribWidth: 2.1,
          ribDepth: 3.8,
          twistAngle: 0,
          topRingHeight: 3.2,
          stabilizerMode: 'none',
          rootBoost: 15,
          baseThickness: 5.0,
          recessDepth: 2.0,
          candleClearance: 1.0,
          recessRimWidth: 3.0,
          candleDia: 38,
          candleHeight: 18,
          motifType: 'mix',
          motifCount: 6,
          motifRows: 2,
          motifSize: 22,
          motifWidthScale: 100,
          motifRelief: 0.6,
          motifHeightRatio: 49,
          greetingEnabled: true,
          greetingStyle: 'cutout',
          greetingText: 'XMAS',
          greetingSize: 13,
          greetingRelief: 0.6,
          greetingCount: 1,
          greetingHeightRatio: 48,
          lanternColor: '#23262e'
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
          stabilizerMode: 'breakaway',
          motifType: 'none',
          greetingEnabled: false
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
          stabilizerMode: 'breakaway',
          motifType: 'none',
          greetingEnabled: false
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
          stabilizerMode: 'breakaway',
          motifType: 'none',
          greetingEnabled: false
        }
      };

      const p = presets[presetName];
      if (!p) return;

      Object.keys(p).forEach(k => {
        if (k === 'motifType' || k === 'greetingEnabled' || k === 'greetingStyle' || k === 'greetingText' || k === 'stabilizerMode' || k === 'lanternColor') return;
        state[k] = p[k];
        const input = document.getElementById(`param-${k}`);
        if (input) input.value = p[k];
        const label = document.getElementById(`val-${k}`);
        if (label && typeof p[k] === 'number') {
          const decimals = ['ribWidth', 'ribDepth', 'topRingHeight', 'motifRelief', 'greetingRelief', 'baseThickness', 'recessDepth', 'candleClearance', 'recessRimWidth'].includes(k) ? 1 : 0;
          label.textContent = p[k].toFixed(decimals);
        }
      });

      if (typeof p.greetingText === 'string') {
        state.greetingText = p.greetingText;
      }
      if (typeof p.greetingStyle === 'string') {
        setGreetingStyle(p.greetingStyle, true);
      }
      if (typeof p.greetingEnabled === 'boolean') {
        setGreetingEnabled(p.greetingEnabled, true);
      }
      if (p.motifType) {
        setMotifType(p.motifType);
      }
      if (p.stabilizerMode) {
        setStabilizerMode(p.stabilizerMode);
      }
      if (p.lanternColor) {
        setLanternColor(p.lanternColor);
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
        if (k === 'greetingEnabled') return;
        const input = document.getElementById(`param-${k}`);
        if (input) input.value = defaultParams[k];
        const label = document.getElementById(`val-${k}`);
        if (label && typeof defaultParams[k] === 'number') {
          if (k === 'upperPinStep') {
            label.textContent = formatUpperPinStepLabel(defaultParams[k]);
          } else if (k === 'stabilizerNeck') {
            label.textContent = defaultParams[k].toFixed(2);
          } else {
            label.textContent = ['ribWidth', 'ribDepth', 'topRingHeight', 'stabilizerWidth', 'stabilizerThickness', 'motifRelief', 'greetingRelief', 'baseThickness', 'recessDepth', 'candleClearance', 'recessRimWidth'].includes(k)
              ? defaultParams[k].toFixed(1)
              : defaultParams[k];
          }
        }
      });
      setGreetingEnabled(defaultParams.greetingEnabled, true);
      setMotifType(defaultParams.motifType);
      updateBreakawayDescText();
      applyPreset('tealight');
    }

    function setLanternColor(hexColor, btnEl) {
      state.lanternColor = hexColor;
      if (lanternMesh && lanternMesh.material) {
        lanternMesh.material.color.set(hexColor);
      }
      if (lanternGroup) {
        const hl = lanternGroup.children.find(ch => ch.name === 'motifHighlight');
        if (hl && hl.material) {
          hl.material.color.copy(new THREE.Color(hexColor).lerp(new THREE.Color(0xfff3db), 0.05));
        }
      }
      const targetBtn = btnEl || document.querySelector(`.color-swatch[data-color="${hexColor}"]`);
      document.querySelectorAll('.color-swatch').forEach(el => {
        el.className = 'color-swatch w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform';
      });
      if (targetBtn) {
        targetBtn.className = 'color-swatch w-6 h-6 rounded-full border-2 border-white scale-110 transition-transform';
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

      document.getElementById('modal-subtitle').textContent = `Lantern Ø${state.bellyDia} × ${state.height} mm • ${state.ribCount} ribs`;
      document.getElementById('modal-filament-g').textContent = `~${grams} g`;
      document.getElementById('modal-filament-m').textContent = `(~${meters} m)`;
      document.getElementById('modal-print-time').textContent = `Estimated print time: ~${hours}h ${mins}m`;

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
      const pinSummary = stepVal <= 0 ? '1 lever pin/rib' : `1 pin + 2nd pin every ${stepVal}th rib`;
      const stabModeText = state.stabilizerMode === 'breakaway'
        ? `${activeStabRings} Top-Down Lever-Snap rings (${pinSummary}, ${state.stabilizerNeck.toFixed(2)} mm V-notch)`
        : (state.stabilizerMode === 'permanent' ? `${activeStabRings} fixed 42° vase rings` : 'without intermediate rings');
      let stabilityTitle = state.stabilizerMode === 'none'
        ? `Compact & stable (max. free ~${freeSpanMm} mm)`
        : `PETG Lever-Snap & stable (max. free ~${freeSpanMm} mm)`;
      let stabilityDesc = state.stabilizerMode === 'none'
        ? 'No breakaway rings needed — the compact lantern body is braced smoothly by the motif and plaque bridges.'
        : `Thanks to ${stabModeText} the rings can be peeled off from the top by pressing down on the inner lever collar (6.5× lever arm) in a domino effect, without breaking a rib.`;

      if (state.ribWidth < 2.0 || state.ribDepth < 3.0 || ribCrossArea < 6.5) {
        stabilityLevel = 'danger';
        stabilityTitle = 'Fragile (ribs too thin)';
        stabilityDesc = `At ${state.ribWidth.toFixed(1)} × ${state.ribDepth.toFixed(1)} mm the ribs vibrate strongly. Recommendation: at least 2.4 × 4.0 mm plus a continuous breakaway ring.`;
        score -= 28;
        needsOptimization = true;
      } else if (freeSpanMm > 75 || slenderness > 32) {
        stabilityLevel = 'danger';
        stabilityTitle = `Vibration risk! (free length ${freeSpanMm} mm)`;
        stabilityDesc = `Without enough rings the ${state.height} mm long ribs vibrate with the nozzle movement. Activate 2 continuous breakaway rings!`;
        score -= 26;
        needsOptimization = true;
      } else if (freeSpanMm > 58 || slenderness > 24) {
        stabilityLevel = 'warn';
        stabilityTitle = `Slight vibration possible (${freeSpanMm} mm free)`;
        stabilityDesc = `An additional continuous support ring would shorten the free rib length further and stabilise all ribs more evenly.`;
        score -= 10;
        needsOptimization = true;
      }

      // 2. Print Failure / Danger Check (Nozzle collision, curling overhangs, spaghetti risk)
      let dangerLevel = 'good';
      let dangerTitle = 'Safe (no failure risk)';
      let dangerDesc = `A maximum overhang of ${overhang}° is in the safe range. No curling and no collision risk for the nozzle.`;

      const gPlanCheck = state.greetingEnabled ? getGreetingPlacementPlan(false) : null;
      const hasCutoutFloatingTips = Boolean(
        gPlanCheck &&
        gPlanCheck.style === 'cutout' &&
        /[MNTWXYEFPBRKSZ235789]/.test(gPlanCheck.cleanText || '')
      );

      if (overhang > 63 || (overhang > 56 && state.ribWidth < 2.0)) {
        dangerLevel = 'danger';
        dangerTitle = 'Increased failure & collision risk!';
        dangerDesc = `The ${overhang}° overhang is very shallow. The free rib edges can curl upwards while cooling, so the nozzle hits them and the print fails.`;
        score -= 38;
        needsOptimization = true;
      } else if (overhang > 54 || Math.abs(state.twistAngle) > 65) {
        dangerLevel = 'warn';
        dangerTitle = 'Demanding print (watch your cooling)';
        dangerDesc = `A ${overhang}° overhang needs good part cooling (100 % fan) and reduced overhang speed so the lamellae layer cleanly.`;
        score -= 14;
        needsOptimization = true;
      } else if (hasCutoutFloatingTips) {
        dangerTitle = 'Printable — small tree support recommended for text';
        dangerDesc = `Frame, all ${state.ribCount} ribs, stars and trees print completely support-free (${overhang}°). For floating inner V-tips inside cutout letters (e.g. X, M), enable Tree (Auto) support in Bambu Studio or switch to 3D Relief.`;
        score -= 3;
      }

      // 3. Candle Fit & Tray Floor Check
      let candleLevel = 'good';
      let candleTitle = 'Perfect fit & clearance';
      let candleDesc = `Your Ø${state.candleDia} mm candle fits comfortably through the Ø${state.topInnerDia} mm opening (+${openingDiff.toFixed(0)} mm clearance) and sits securely in the ${state.recessDepth.toFixed(1)} mm deep recess.`;

      if (openingDiff < 0) {
        candleLevel = 'danger';
        candleTitle = 'Candle does not fit through the top!';
        candleDesc = `The top opening (Ø${state.topInnerDia} mm) is smaller than your candle (Ø${state.candleDia} mm). You will not be able to insert the candle from the top!`;
        score -= 20;
        needsOptimization = true;
      } else if (openingDiff < 4 || floorThickness < 1.6) {
        candleLevel = 'warn';
        candleTitle = 'Very tight tolerance';
        candleDesc = `The opening clearance is only +${openingDiff.toFixed(0)} mm (or floor thickness ${floorThickness.toFixed(1)} mm is tight). A little more clearance makes insertion easier.`;
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
        badgeEl.textContent = 'Very safe';
      } else if (score >= 65) {
        rateEl.className = 'text-2xl font-bold font-mono text-amber-400';
        barEl.className = 'h-full bg-amber-400 rounded-full transition-all duration-500';
        badgeEl.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30';
        badgeEl.textContent = 'Moderate';
      } else {
        rateEl.className = 'text-2xl font-bold font-mono text-rose-400';
        barEl.className = 'h-full bg-rose-400 rounded-full transition-all duration-500';
        badgeEl.className = 'text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30';
        badgeEl.textContent = 'High risk!';
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
      showToast('V5 Top-Down Hebel-Snap aktiviert!', '1 pin + 2nd pin on every 5th rib with a 0.65 mm V-peel notch for easy removal.');
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
      const fileName = `Lumenrib_Lantern_D${state.bellyDia}_H${state.height}_Candle${state.candleDia}mm.stl`;
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
          setGreetingEnabled, setGreetingStyle, toggleGreeting, setGreetingPreset, onGreetingTextInput,
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
