/**
 * Hexagonal Animated Neon Honeycomb Background
 * Replicating the cyber-violet hexagonal aesthetic from Image 1:
 * - Geometric pointy-topped honeycomb lattice
 * - Constellation of glowing violet & fuchsia neon edges with organic breathing cycles
 * - High-speed electric light pulses traversing the hex network
 * - Interactive cursor glow & energy ripples
 */

(function () {
    'use strict';

    // Create or get canvas element
    let canvas = document.getElementById('hex-bg-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'hex-bg-canvas';
        canvas.className = 'hex-bg-canvas';
        document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let dpr = 1;

    // Hexagon geometric settings
    const HEX_RADIUS = 50; // Size of hexagons matching reference proportions
    const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
    const HEX_HEIGHT = 1.5 * HEX_RADIUS;

    // Graph data structures
    let nodes = [];       // Unique vertices {id, x, y, edges: []}
    let edges = [];       // Unique edges {id, n1, n2, ...}
    let cells = [];       // Hexagon cells {cx, cy, nodes, ...}
    let pulses = [];      // Energy pulses traveling along edges
    let mouse = { x: -1000, y: -1000, active: false, radius: 220 };

    // Resize handler with High-DPI support
    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        buildGrid();
    }

    function nodeKey(x, y) {
        return `${Math.round(x * 2)},${Math.round(y * 2)}`;
    }

    // Build the hexagonal graph
    function buildGrid() {
        nodes = [];
        edges = [];
        cells = [];
        pulses = [];

        const nodeMap = new Map();

        function getOrCreateNode(x, y) {
            const key = nodeKey(x, y);
            if (nodeMap.has(key)) {
                return nodeMap.get(key);
            }
            const node = {
                id: nodes.length,
                x: x,
                y: y,
                edges: []
            };
            nodeMap.set(key, node);
            nodes.push(node);
            return node;
        }

        function getOrCreateEdge(n1, n2) {
            const [a, b] = n1.id < n2.id ? [n1, n2] : [n2, n1];
            for (let i = 0; i < a.edges.length; i++) {
                const e = a.edges[i];
                if ((e.n1 === a && e.n2 === b) || (e.n1 === b && e.n2 === a)) {
                    return e;
                }
            }

            // Decide edge personality
            const isAmbientGlow = Math.random() < 0.18; // ~18% constantly breathe
            const colorRand = Math.random();
            let colorType = 'emerald';
            if (colorRand < 0.45) colorType = 'emerald';      // #10b981
            else if (colorRand < 0.75) colorType = 'mint';    // #34d399
            else colorType = 'neon';                          // #22c55e

            const edge = {
                id: edges.length,
                n1: a,
                n2: b,
                glow: isAmbientGlow ? 0.4 + Math.random() * 0.5 : 0,
                baseGlow: isAmbientGlow ? 0.35 + Math.random() * 0.4 : 0,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.012 + Math.random() * 0.018,
                dynamicGlow: 0,
                colorType: colorType,
                isAmbientGlow: isAmbientGlow
            };

            edges.push(edge);
            a.edges.push(edge);
            b.edges.push(edge);
            return edge;
        }

        const margin = HEX_RADIUS * 2;
        const cols = Math.ceil((width + margin * 2) / HEX_WIDTH) + 1;
        const rows = Math.ceil((height + margin * 2) / HEX_HEIGHT) + 2;

        for (let r = -1; r <= rows; r++) {
            const cy = r * HEX_HEIGHT;
            const xOffset = (Math.abs(r) % 2 === 1) ? HEX_WIDTH * 0.5 : 0;

            for (let c = -1; c <= cols; c++) {
                const cx = c * HEX_WIDTH + xOffset;

                // Pointy-topped hexagon 6 vertices (30, 90, 150, 210, 270, 330 deg)
                const cellNodes = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 6) + (i * Math.PI / 3);
                    const vx = cx + HEX_RADIUS * Math.cos(angle);
                    const vy = cy + HEX_RADIUS * Math.sin(angle);
                    cellNodes.push(getOrCreateNode(vx, vy));
                }

                // Connect perimeter edges
                for (let i = 0; i < 6; i++) {
                    const nA = cellNodes[i];
                    const nB = cellNodes[(i + 1) % 6];
                    getOrCreateEdge(nA, nB);
                }

                cells.push({
                    cx,
                    cy,
                    nodes: cellNodes,
                    pulsePhase: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.008 + Math.random() * 0.014,
                    highlighted: Math.random() < 0.14
                });
            }
        }

        // Initialize energetic light pulses
        const pulseCount = Math.max(12, Math.min(26, Math.floor(edges.length / 50)));
        for (let i = 0; i < pulseCount; i++) {
            spawnPulse();
        }
    }

    // Spawn an electrical energy pulse
    function spawnPulse() {
        if (edges.length === 0) return;
        const startEdge = edges[Math.floor(Math.random() * edges.length)];
        const startNode = Math.random() > 0.5 ? startEdge.n1 : startEdge.n2;
        const targetNode = startNode === startEdge.n1 ? startEdge.n2 : startEdge.n1;

        const colorRand = Math.random();
        let colorType = 'emerald';
        if (colorRand < 0.4) colorType = 'emerald';
        else if (colorRand < 0.75) colorType = 'mint';
        else colorType = 'neon';

        pulses.push({
            currentEdge: startEdge,
            fromNode: startNode,
            toNode: targetNode,
            progress: Math.random(),
            speed: 0.008 + Math.random() * 0.012,
            length: 0.38 + Math.random() * 0.32,
            colorType: colorType,
            life: 8 + Math.floor(Math.random() * 16)
        });
    }

    // Interactive mouse listeners
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
        mouse.active = false;
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // Interactive click shockwave
    window.addEventListener('click', (e) => {
        const mx = e.clientX;
        const my = e.clientY;
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            const ex = (edge.n1.x + edge.n2.x) * 0.5;
            const ey = (edge.n1.y + edge.n2.y) * 0.5;
            const dist = Math.hypot(ex - mx, ey - my);
            if (dist < 320) {
                const burst = (1 - dist / 320) * 1.2;
                edge.dynamicGlow = Math.min(1.0, edge.dynamicGlow + burst);
            }
        }
    });

    // Update animations
    let lastAmbientSpawn = 0;

    function update(timestamp) {
        // Periodically ignite clusters of edges
        if (timestamp - lastAmbientSpawn > 140) {
            lastAmbientSpawn = timestamp;
            if (Math.random() < 0.75 && edges.length > 0) {
                const baseEdge = edges[Math.floor(Math.random() * edges.length)];
                baseEdge.dynamicGlow = Math.max(baseEdge.dynamicGlow, 0.7 + Math.random() * 0.3);
                if (baseEdge.n1.edges.length > 0 && Math.random() < 0.6) {
                    const nextEdge = baseEdge.n1.edges[Math.floor(Math.random() * baseEdge.n1.edges.length)];
                    nextEdge.dynamicGlow = Math.max(nextEdge.dynamicGlow, 0.6 + Math.random() * 0.4);
                }
            }
        }

        // Update pulses
        for (let i = pulses.length - 1; i >= 0; i--) {
            const p = pulses[i];
            p.progress += p.speed;

            // Illuminate current edge
            p.currentEdge.dynamicGlow = Math.max(p.currentEdge.dynamicGlow, 0.9);

            if (p.progress >= 1.0) {
                p.progress = 0;
                p.life--;

                if (p.life <= 0) {
                    pulses.splice(i, 1);
                    spawnPulse();
                    continue;
                }

                // Choose connected edge
                const candidates = p.toNode.edges.filter(e => e !== p.currentEdge);
                if (candidates.length > 0) {
                    const nextEdge = candidates[Math.floor(Math.random() * candidates.length)];
                    p.fromNode = p.toNode;
                    p.toNode = nextEdge.n1 === p.fromNode ? nextEdge.n2 : nextEdge.n1;
                    p.currentEdge = nextEdge;
                } else {
                    pulses.splice(i, 1);
                    spawnPulse();
                }
            }
        }

        // Update edges
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];

            // Ambient breathing pulse
            if (edge.isAmbientGlow) {
                edge.pulsePhase += edge.pulseSpeed;
                const breath = (Math.sin(edge.pulsePhase) + 1) * 0.5; // 0 to 1
                edge.glow = edge.baseGlow * (0.4 + breath * 0.6);
            } else {
                edge.glow = 0;
            }

            // Decay dynamic glow
            if (edge.dynamicGlow > 0) {
                edge.dynamicGlow -= 0.012;
                if (edge.dynamicGlow < 0) edge.dynamicGlow = 0;
            }

            // Mouse proximity
            if (mouse.active) {
                const ex = (edge.n1.x + edge.n2.x) * 0.5;
                const ey = (edge.n1.y + edge.n2.y) * 0.5;
                const dx = ex - mouse.x;
                const dy = ey - mouse.y;
                const distSq = dx * dx + dy * dy;
                const rSq = mouse.radius * mouse.radius;

                if (distSq < rSq) {
                    const mouseIntensity = (1 - Math.sqrt(distSq) / mouse.radius);
                    edge.dynamicGlow = Math.max(edge.dynamicGlow, mouseIntensity * 1.0);
                }
            }
        }

        // Update cell pulse phases
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            cell.pulsePhase += cell.pulseSpeed;
        }
    }

    // Render frame
    function render() {
        ctx.clearRect(0, 0, width, height);

        // 1. Draw subtle ambient cell highlights
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            if (!cell.highlighted) continue;

            const pulse = (Math.sin(cell.pulsePhase) + 1) * 0.5;
            const alpha = 0.02 + pulse * 0.04;

            ctx.beginPath();
            const n0 = cell.nodes[0];
            ctx.moveTo(n0.x, n0.y);
            for (let j = 1; j < 6; j++) {
                const n = cell.nodes[j];
                ctx.lineTo(n.x, n.y);
            }
            ctx.closePath();
            ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.fill();
        }

        // 2. Base hexagonal honeycomb lines (crisp dark emerald)
        ctx.beginPath();
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            ctx.moveTo(edge.n1.x, edge.n1.y);
            ctx.lineTo(edge.n2.x, edge.n2.y);
        }
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.16)';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // 3. Render glowing neon edges (composite layer)
        // Pass A: Wide diffuse neon halo
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            const totalGlow = Math.min(1.0, edge.glow + edge.dynamicGlow);
            if (totalGlow < 0.06) continue;

            ctx.beginPath();
            ctx.moveTo(edge.n1.x, edge.n1.y);
            ctx.lineTo(edge.n2.x, edge.n2.y);

            let haloColor = `rgba(16, 185, 129, ${totalGlow * 0.38})`;
            if (edge.colorType === 'neon') {
                haloColor = `rgba(34, 197, 94, ${totalGlow * 0.42})`;
            } else if (edge.colorType === 'mint') {
                haloColor = `rgba(52, 211, 153, ${totalGlow * 0.4})`;
            }

            ctx.strokeStyle = haloColor;
            ctx.lineWidth = 6.0;
            ctx.stroke();

            // Pass B: Mid-core vivid neon
            ctx.beginPath();
            ctx.moveTo(edge.n1.x, edge.n1.y);
            ctx.lineTo(edge.n2.x, edge.n2.y);

            let coreColor = `rgba(52, 211, 153, ${totalGlow * 0.75})`;
            if (edge.colorType === 'neon') {
                coreColor = `rgba(74, 222, 128, ${totalGlow * 0.8})`;
            } else if (edge.colorType === 'emerald') {
                coreColor = `rgba(16, 185, 129, ${totalGlow * 0.75})`;
            }

            ctx.strokeStyle = coreColor;
            ctx.lineWidth = 2.4;
            ctx.stroke();

            // Pass C: Ultra-bright white-mint inner filament
            if (totalGlow > 0.25) {
                ctx.beginPath();
                ctx.moveTo(edge.n1.x, edge.n1.y);
                ctx.lineTo(edge.n2.x, edge.n2.y);
                ctx.strokeStyle = `rgba(255, 255, 255, ${totalGlow * 0.85})`;
                ctx.lineWidth = 1.0;
                ctx.stroke();
            }
        }

        // 4. Traveling energy light pulses
        for (let i = 0; i < pulses.length; i++) {
            const p = pulses[i];
            const x1 = p.fromNode.x;
            const y1 = p.fromNode.y;
            const x2 = p.toNode.x;
            const y2 = p.toNode.y;

            const headT = Math.min(1.0, p.progress);
            const tailT = Math.max(0.0, p.progress - p.length);

            const hx = x1 + (x2 - x1) * headT;
            const hy = y1 + (y2 - y1) * headT;
            const tx = x1 + (x2 - x1) * tailT;
            const ty = y1 + (y2 - y1) * tailT;

            const grad = ctx.createLinearGradient(tx, ty, hx, hy);
            if (p.colorType === 'neon') {
                grad.addColorStop(0, 'rgba(34, 197, 94, 0)');
                grad.addColorStop(0.7, 'rgba(74, 222, 128, 0.85)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 1)');
            } else {
                grad.addColorStop(0, 'rgba(16, 185, 129, 0)');
                grad.addColorStop(0.7, 'rgba(110, 231, 183, 0.85)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 1)');
            }

            // Outer pulse glow
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(hx, hy);
            ctx.strokeStyle = p.colorType === 'neon' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(16, 185, 129, 0.5)';
            ctx.lineWidth = 7.0;
            ctx.stroke();

            // Inner pulse line
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(hx, hy);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.6;
            ctx.stroke();

            // Glowing head spark node
            ctx.beginPath();
            ctx.arc(hx, hy, 3.0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = p.colorType === 'neon' ? '#4ade80' : '#6ee7b7';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }

        // 5. Glowing vertex node points
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            let maxGlow = 0;
            for (let j = 0; j < node.edges.length; j++) {
                const eg = node.edges[j].glow + node.edges[j].dynamicGlow;
                if (eg > maxGlow) maxGlow = eg;
            }

            if (maxGlow > 0.4) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 2.2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(52, 211, 153, ${Math.min(1.0, maxGlow * 0.9)})`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(node.x, node.y, 1.2, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }
        }
    }

    function animate(timestamp) {
        update(timestamp);
        render();
        requestAnimationFrame(animate);
    }

    // Initialize
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(animate);
})();
