// Mini Chessboard Visualization with Move Arrows
class MiniChessboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.boardSize = this.getResponsiveBoardSize();
    this.squareSize = this.boardSize / 8;
    this.piece = null;
    this.startSquare = null;
    this.endSquare = null;
    this.path = [];

    this.init();
  }

  getResponsiveBoardSize() {
    const screenWidth = window.innerWidth;
    let baseSize;
    if (screenWidth <= 360) baseSize = 220;
    else if (screenWidth <= 480) baseSize = 250;
    else if (screenWidth <= 768) baseSize = 280;
    else baseSize = 300;

    // Ensure the inner size is divisible by 8 to avoid fractional square sizes
    const adjustedInnerSize = Math.floor(baseSize / 8) * 8;

    // Return the total board size including borders
    return adjustedInnerSize;
  }

  init() {
    if (!this.container) return;

    // Get data from container attributes
    this.piece = this.container.dataset.piece;
    this.startSquare = this.container.dataset.start;
    this.endSquare = this.container.dataset.end;
    this.path = this.container.dataset.path
      ? this.container.dataset.path.split(",")
      : [];

    this.createBoard();
    this.drawPath();
  }

  createBoard() {
    // Create main board container
    const boardContainer = document.createElement("div");
    boardContainer.className = "mini-chessboard";
    boardContainer.style.cssText = `
            position: relative;
            width: ${this.boardSize}px;
            height: ${this.boardSize}px;
            margin: 0 auto;
            border: 3px solid #2c3e50;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
        `;

    // Create squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div");
        const isLight = (row + col) % 2 === 0;
        const squareName = String.fromCharCode(97 + col) + (8 - row);

        square.className = "chess-square";
        square.dataset.square = squareName;
        square.style.cssText = `
                    position: absolute;
                    left: ${col * this.squareSize}px;
                    top: ${row * this.squareSize}px;
                    width: ${
                      col === 7
                        ? this.boardSize - col * this.squareSize
                        : this.squareSize
                    }px;
                    height: ${this.squareSize}px;
                    background: ${isLight ? "#f0d9b5" : "#b58863"};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 10px;
                    color: ${isLight ? "#8b4513" : "#f0d9b5"};
                    transition: all 0.3s ease;
                `;

        // Add square label
        square.textContent = squareName;

        // Highlight special squares
        if (squareName === this.startSquare) {
          square.style.background = "#4CAF50";
          square.style.boxShadow = "inset 0 0 10px rgba(76, 175, 80, 0.7)";
          square.innerHTML = `<div style="color: white; font-weight: bold; font-size: 12px;">START</div>`;
        } else if (squareName === this.endSquare) {
          square.style.background = "#f44336";
          square.style.boxShadow = "inset 0 0 10px rgba(244, 67, 54, 0.7)";
          square.innerHTML = `<div style="color: white; font-weight: bold; font-size: 12px;">END</div>`;
        } else if (this.path.includes(squareName)) {
          square.style.background = "#FF9800";
          square.style.boxShadow = "inset 0 0 8px rgba(255, 152, 0, 0.7)";
        }

        boardContainer.appendChild(square);
      }
    }

    // Create SVG overlay for arrows
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        `;

    // Add arrow marker definition
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker"
    );
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");

    const polygon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
    polygon.setAttribute("fill", "#2196F3");
    polygon.setAttribute("stroke", "#1976D2");
    polygon.setAttribute("stroke-width", "1");

    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    boardContainer.appendChild(svg);
    this.svg = svg;

    // Add title
    const title = document.createElement("div");
    title.style.cssText = `
            text-align: center;
            margin-bottom: 15px;
            font-weight: 600;
            font-size: 16px;
            color: #2c3e50;
        `;
    title.textContent = `${this.piece} Possible Path`;

    this.container.appendChild(title);
    this.container.appendChild(boardContainer);
  }

  squareToPixel(square) {
    const col = square.charCodeAt(0) - 97; // a-h to 0-7
    const row = 8 - parseInt(square[1]); // 8-1 to 0-7
    return {
      x: col * this.squareSize + this.squareSize / 2,
      y: row * this.squareSize + this.squareSize / 2,
    };
  }

  drawPath() {
    if (!this.svg || this.path.length < 2) return;

    // Draw arrows between consecutive squares in path
    for (let i = 0; i < this.path.length - 1; i++) {
      const from = this.squareToPixel(this.path[i]);
      const to = this.squareToPixel(this.path[i + 1]);

      // Create animated arrow
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", from.x);
      line.setAttribute("y1", from.y);
      line.setAttribute("x2", to.x);
      line.setAttribute("y2", to.y);
      line.setAttribute("stroke", "#2196F3");
      line.setAttribute("stroke-width", "3");
      line.setAttribute("marker-end", "url(#arrowhead)");
      line.setAttribute("opacity", "0");

      // Add glow effect
      line.setAttribute("filter", "drop-shadow(0 0 4px #2196F3)");

      // Animate arrow appearance
      const animate = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "animate"
      );
      animate.setAttribute("attributeName", "opacity");
      animate.setAttribute("values", "0;1");
      animate.setAttribute("dur", "0.5s");
      animate.setAttribute("begin", `${i * 0.8}s`);
      animate.setAttribute("fill", "freeze");

      line.appendChild(animate);
      this.svg.appendChild(line);

      // Add move number
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("x", (from.x + to.x) / 2);
      text.setAttribute("y", (from.y + to.y) / 2 - 8);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-weight", "bold");
      text.setAttribute("fill", "#ffffff");
      text.setAttribute("stroke", "#2c3e50");
      text.setAttribute("stroke-width", "1");
      text.textContent = i + 1;
      text.setAttribute("opacity", "0");

      const textAnimate = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "animate"
      );
      textAnimate.setAttribute("attributeName", "opacity");
      textAnimate.setAttribute("values", "0;1");
      textAnimate.setAttribute("dur", "0.3s");
      textAnimate.setAttribute("begin", `${i * 0.8 + 0.3}s`);
      textAnimate.setAttribute("fill", "freeze");

      text.appendChild(textAnimate);
      this.svg.appendChild(text);
    }
  }
}

// Initialize chessboard when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("chessboard-container");
  if (container) {
    new MiniChessboard("chessboard-container");
  }
});

// Add responsive behavior
window.addEventListener("resize", function () {
  const container = document.getElementById("chessboard-container");
  if (container) {
    container.innerHTML = "";
    new MiniChessboard("chessboard-container");
  }
});
