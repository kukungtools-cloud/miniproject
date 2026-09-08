/**
 * SORTING ALGORITHM VISUALIZER
 * Modular & DRY Vanilla JavaScript Architecture
 */

// ============================================================================
// 1. ALGORITHM REGISTRY (Metadata, Complexity, and Code Steps)
// ============================================================================
const ALGORITHM_REGISTRY = {
  bubble: {
    name: "Bubble Sort",
    filename: "bubble_sort.py",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    description: "Membandingkan elemen bersebelahan secara berulang dan menukarnya jika elemen kiri lebih besar dari elemen kanan, sehingga nilai terbesar 'mengapung' ke posisi akhir array.",
    codeLines: [
      "def bubble_sort(arr):",
      "    n = len(arr)",
      "    for i in range(n):",
      "        for j in range(0, n - i - 1):",
      "            if arr[j] > arr[j + 1]:",
      "                arr[j], arr[j + 1] = arr[j + 1], arr[j]",
      "    return arr"
    ]
  },
  selection: {
    name: "Selection Sort",
    filename: "selection_sort.py",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    description: "Mencari elemen terkecil (minimum) dari bagian array yang belum terurut, lalu menukarnya ke posisi awal subarray tersebut. Langkah ini diulang untuk seluruh elemen.",
    codeLines: [
      "def selection_sort(arr):",
      "    n = len(arr)",
      "    for i in range(n):",
      "        min_idx = i",
      "        for j in range(i + 1, n):",
      "            if arr[j] < arr[min_idx]:",
      "                min_idx = j",
      "        arr[i], arr[min_idx] = arr[min_idx], arr[i]",
      "    return arr"
    ]
  },
  insertion: {
    name: "Insertion Sort",
    filename: "insertion_sort.py",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    description: "Membangun array terurut satu per satu dengan mengambil elemen berikutnya dan menyisipkannya ke posisi yang tepat di antara elemen-elemen yang sudah terurut sebelumnya.",
    codeLines: [
      "def insertion_sort(arr):",
      "    for i in range(1, len(arr)):",
      "        key = arr[i]",
      "        j = i - 1",
      "        while j >= 0 and key < arr[j]:",
      "            arr[j + 1] = arr[j]",
      "            j -= 1",
      "        arr[j + 1] = key",
      "    return arr"
    ]
  },
  quick: {
    name: "Quick Sort",
    filename: "quick_sort.py",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(log n)",
    description: "Memilih elemen pivot, mempartisi array sedemikian rupa sehingga elemen yang lebih kecil dari pivot berada di kiri dan yang lebih besar di kanan, lalu mengurutkan sub-array secara rekursif.",
    codeLines: [
      "def quick_sort(arr, low, high):",
      "    if low < high:",
      "        pi = partition(arr, low, high)",
      "        quick_sort(arr, low, pi - 1)",
      "        quick_sort(arr, pi + 1, high)",
      "",
      "def partition(arr, low, high):",
      "    pivot = arr[high]",
      "    i = low - 1",
      "    for j in range(low, high):",
      "        if arr[j] < pivot:",
      "            i += 1; arr[i], arr[j] = arr[j], arr[i]",
      "    arr[i + 1], arr[high] = arr[high], arr[i + 1]",
      "    return i + 1"
    ]
  }
};

// ============================================================================
// 2. CORE VISUALIZER ENGINE (DRY Primitive Manager)
// ============================================================================
class VisualizerEngine {
  constructor() {
    // State
    this.array = [];
    this.initialArraySnapshot = [];
    this.barElements = [];
    this.isSorting = false;
    this.aborted = false;

    // Metrics
    this.comparisons = 0;
    this.swaps = 0;
    this.startTime = null;
    this.timerInterval = null;

    // Speed configuration (in ms)
    this.speedSliderValue = 50;
    this.arraySize = 10;

    // DOM Elements
    this.container = document.getElementById("array-container");
    this.algoSelect = document.getElementById("algorithm-select");
    this.sizeSlider = document.getElementById("size-slider");
    this.sizeValue = document.getElementById("size-value");
    this.speedSlider = document.getElementById("speed-slider");
    this.speedValue = document.getElementById("speed-value");
    this.btnGenerate = document.getElementById("btn-generate");
    this.btnStart = document.getElementById("btn-start");
    this.btnReset = document.getElementById("btn-reset");

    this.statusText = document.getElementById("status-text");
    this.statusIndicator = document.querySelector(".status-indicator");
    this.algoTitle = document.getElementById("algo-title");
    this.chipTime = document.getElementById("chip-time");
    this.chipSpace = document.getElementById("chip-space");
    this.algoDesc = document.getElementById("algo-description");
    this.codeFilename = document.getElementById("code-filename");
    this.codeDisplay = document.getElementById("code-display");

    this.metricComparisons = document.getElementById("metric-comparisons");
    this.metricSwaps = document.getElementById("metric-swaps");
    this.metricTime = document.getElementById("metric-time");

    this.codeTrackerBox = document.getElementById("code-tracker-box");
    this.themeSelect = document.getElementById("code-theme-select");
    this.themeDot = document.getElementById("theme-preview-dot");

    // Initialize
    this.initEventListeners();
    this.initThemeSelector();
    this.updateAlgorithmDetails();
    this.generateNewArray();
  }

  // --------------------------------------------------------------------------
  // Delay Calculation (Responsive to Speed Slider) - Diperlambat 60% lagi
  // --------------------------------------------------------------------------
  getDelay() {
    const val = this.speedSliderValue;
    let baseDelay;
    if (val <= 20) {
      baseDelay = 500 - (val - 1) * 20; // 500ms down to 120ms
    } else if (val <= 70) {
      baseDelay = 120 - (val - 20) * 1.8; // 120ms down to 30ms
    } else {
      baseDelay = 30 - (val - 70) * 0.9; // 30ms down to 3ms
    }

    // Kecepatan dikurangi 60% lagi dari kondisi sebelumnya (durasi x 2.50 = total 8.775x dari baseDelay)
    return Math.max(15, Math.round(baseDelay * 1.30 * 1.35 * 2.0 * 2.5));
  }

  // Sleep with instant cancellation check
  async sleep(customMs = null) {
    if (this.aborted) throw new Error("SORT_ABORTED");
    const ms = customMs !== null ? customMs : this.getDelay();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.aborted) {
          reject(new Error("SORT_ABORTED"));
        } else {
          resolve();
        }
      }, ms);

      // Check aborted state promptly
      if (this.aborted) {
        clearTimeout(timeout);
        reject(new Error("SORT_ABORTED"));
      }
    });
  }

  // --------------------------------------------------------------------------
  // Array Generation & Rendering
  // --------------------------------------------------------------------------
  generateNewArray() {
    if (this.isSorting) return;

    this.array = [];
    const size = this.arraySize;

    // Generate random values between 10 and 100
    for (let i = 0; i < size; i++) {
      const val = Math.floor(Math.random() * 91) + 10;
      this.array.push(val);
    }

    this.initialArraySnapshot = [...this.array];
    this.renderBars();
    this.resetMetrics();
    this.setStatus("Array baru berhasil dibuat. Pilih algoritma dan tekan 'Mulai Sort'.", "ready");
    this.highlightCodeLine(null);
  }

  renderBars() {
    this.container.innerHTML = "";
    this.barElements = [];

    const floatingBar = document.getElementById("crane-floating-bar");
    if (floatingBar) {
      floatingBar.style.display = "none";
      floatingBar.style.transform = "";
      floatingBar.classList.remove("bar-hoisted");
    }

    const isDense = this.array.length > 22;
    const isVeryDense = this.array.length > 36;

    this.container.classList.toggle("dense-bars", isDense);
    this.container.classList.toggle("very-dense-bars", isVeryDense);

    this.array.forEach((value, idx) => {
      const bar = document.createElement("div");
      bar.className = "array-bar state-default";
      bar.style.height = `${value}%`;
      bar.style.opacity = "1";
      bar.style.visibility = "visible";

      // Value label
      const label = document.createElement("span");
      label.className = "bar-label";
      label.textContent = value;
      bar.appendChild(label);

      // Index label for small arrays
      if (!isDense) {
        const indexLabel = document.createElement("span");
        indexLabel.className = "bar-index";
        indexLabel.textContent = idx;
        bar.appendChild(indexLabel);
      }

      this.container.appendChild(bar);
      this.barElements.push(bar);
    });
  }

  updateBarDOM(index, value) {
    if (!this.barElements[index]) return;
    this.array[index] = value;
    const bar = this.barElements[index];
    bar.style.height = `${value}%`;
    bar.style.opacity = "1";
    bar.style.visibility = "visible";
    const label = bar.querySelector(".bar-label");
    if (label) label.textContent = value;
  }

  // --------------------------------------------------------------------------
  // State Machine Primitives (DRY Methods for Algorithms)
  // --------------------------------------------------------------------------
  setBarState(index, stateName) {
    if (index < 0 || index >= this.barElements.length) return;
    const bar = this.barElements[index];
    bar.className = `array-bar state-${stateName}`;
  }

  revertBar(index) {
    if (index < 0 || index >= this.barElements.length) return;
    const bar = this.barElements[index];
    // Don't revert if already marked sorted
    if (!bar.classList.contains("state-sorted")) {
      bar.className = "array-bar state-default";
    }
  }

  async compare(i, j, codeLineIdx = null) {
    if (this.aborted) throw new Error("SORT_ABORTED");

    this.comparisons++;
    this.metricComparisons.textContent = this.comparisons;

    this.setBarState(i, "comparing");
    this.setBarState(j, "comparing");

    this.setStatus(`Membandingkan indeks [${i}] (${this.array[i]}) dan [${j}] (${this.array[j]})`, "active");
    if (codeLineIdx !== null) this.highlightCodeLine(codeLineIdx);

    await this.sleep();

    this.revertBar(i);
    this.revertBar(j);

    return this.array[i] > this.array[j];
  }

  async swap(i, j, codeLineIdx = null) {
    if (this.aborted) throw new Error("SORT_ABORTED");

    this.swaps++;
    this.metricSwaps.textContent = this.swaps;

    if (codeLineIdx !== null) this.highlightCodeLine(codeLineIdx);

    const leftIdx = Math.min(i, j);
    const rightIdx = Math.max(i, j);
    const barA = this.barElements[leftIdx];
    const barB = this.barElements[rightIdx];

    if (!barA || !barB || leftIdx === rightIdx) {
      return;
    }

    const valA = this.array[leftIdx];
    const valB = this.array[rightIdx];

    this.setStatus(`Menukar indeks [${i}] (${this.array[i]}) ⇄ [${j}] (${this.array[j]})`, "warning");

    // Exact pixel distance between bar centers
    const rectA = barA.getBoundingClientRect();
    const rectB = barB.getBoundingClientRect();
    const deltaX = rectB.left - rectA.left;

    // Determine which bar to lift:
    // Nilai lebih besar dicabut ke atas (crane hoist), nilai lebih kecil meluncur di lantai platform
    const aIsHoisted = valA >= valB;
    const hoistedBar = aIsHoisted ? barA : barB;
    const groundBar = aIsHoisted ? barB : barA;

    // Timing calculation based on current step delay (3 sub-phases)
    const totalStepDelay = this.getDelay();
    const tLift = Math.max(110, Math.round(totalStepDelay * 0.28));
    const tCross = Math.max(150, Math.round(totalStepDelay * 0.44));
    const tDrop = Math.max(110, Math.round(totalStepDelay * 0.28));

    // Safe headroom inside pedestal
    const pedestal = document.querySelector(".stage-pedestal");
    const pedestalHeight = pedestal ? pedestal.clientHeight : 350;
    const liftHeight = Math.max(60, Math.min(95, Math.round(pedestalHeight * 0.25)));

    // Crane trolley sync
    const trolley = document.getElementById("crane-trolley");
    const pedestalRect = pedestal ? pedestal.getBoundingClientRect() : { left: 0 };
    const startTrolleyX = (aIsHoisted ? rectA.left : rectB.left) + (aIsHoisted ? rectA.width : rectB.width) / 2 - pedestalRect.left;
    const endTrolleyX = (aIsHoisted ? rectB.left : rectA.left) + (aIsHoisted ? rectB.width : rectA.width) / 2 - pedestalRect.left;

    if (trolley) {
      trolley.style.transition = "none";
      trolley.style.transform = `translateX(${startTrolleyX}px)`;
      trolley.classList.add("active");
    }

    // Set state classes
    this.setBarState(leftIdx, "swapping");
    this.setBarState(rightIdx, "swapping");
    hoistedBar.classList.add("bar-hoisted");
    groundBar.classList.add("bar-sliding");

    // -------------------------------------------------------------------------
    // Phase 1: Lift Up (Cabut ke atas)
    // -------------------------------------------------------------------------
    hoistedBar.style.transition = `transform ${tLift}ms cubic-bezier(0.2, 0.8, 0.25, 1), box-shadow ${tLift}ms ease`;
    hoistedBar.style.transform = `translate(0px, -${liftHeight}px) scale(1.05)`;

    await this.sleep(tLift);
    if (this.aborted) throw new Error("SORT_ABORTED");

    // -------------------------------------------------------------------------
    // Phase 2: Cross Translation (Geser Horisontal di udara & di bawah)
    // -------------------------------------------------------------------------
    hoistedBar.style.transition = `transform ${tCross}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    groundBar.style.transition = `transform ${tCross}ms cubic-bezier(0.4, 0, 0.2, 1)`;

    if (trolley) {
      trolley.style.transition = `transform ${tCross}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      trolley.style.transform = `translateX(${endTrolleyX}px)`;
    }

    if (aIsHoisted) {
      hoistedBar.style.transform = `translate(${deltaX}px, -${liftHeight}px) scale(1.05)`;
      groundBar.style.transform = `translate(${-deltaX}px, 0px)`;
    } else {
      hoistedBar.style.transform = `translate(${-deltaX}px, -${liftHeight}px) scale(1.05)`;
      groundBar.style.transform = `translate(${deltaX}px, 0px)`;
    }

    await this.sleep(tCross);
    if (this.aborted) throw new Error("SORT_ABORTED");

    // -------------------------------------------------------------------------
    // Phase 3: Drop Down (Tancapkan kembali ke platform)
    // -------------------------------------------------------------------------
    hoistedBar.style.transition = `transform ${tDrop}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    if (aIsHoisted) {
      hoistedBar.style.transform = `translate(${deltaX}px, 0px) scale(1)`;
    } else {
      hoistedBar.style.transform = `translate(${-deltaX}px, 0px) scale(1)`;
    }

    await this.sleep(tDrop);
    if (this.aborted) throw new Error("SORT_ABORTED");

    // -------------------------------------------------------------------------
    // Phase 4: Commit Swap & Reset Transform (Seamlessly without glitch)
    // -------------------------------------------------------------------------
    if (trolley) {
      trolley.classList.remove("active");
    }

    // Instant reset transforms without animation
    barA.style.transition = "none";
    barB.style.transition = "none";
    barA.style.transform = "";
    barB.style.transform = "";
    hoistedBar.classList.remove("bar-hoisted");
    groundBar.classList.remove("bar-sliding");

    // Swap values in logical array
    const temp = this.array[leftIdx];
    this.array[leftIdx] = this.array[rightIdx];
    this.array[rightIdx] = temp;

    // Update DOM heights and labels at new slots
    this.updateBarDOM(leftIdx, this.array[leftIdx]);
    this.updateBarDOM(rightIdx, this.array[rightIdx]);

    // Force browser reflow to apply new heights before re-enabling transitions
    void barA.offsetWidth;
    void barB.offsetWidth;

    barA.style.transition = "";
    barB.style.transition = "";

    this.revertBar(leftIdx);
    this.revertBar(rightIdx);
  }

  // --------------------------------------------------------------------------
  // Insertion Sort Lift & Shift Special Primitives
  // --------------------------------------------------------------------------
  async liftBarForInsertion(i) {
    if (this.aborted) throw new Error("SORT_ABORTED");

    const bar = this.barElements[i];
    const floatingBar = document.getElementById("crane-floating-bar");
    if (!bar || !floatingBar) return;

    this.hoistedOriginalIdx = i;
    this.hoistedKeyVal = this.array[i];
    this.currentShiftDeltaX = 0;
    this.isHoisted = true;

    const pedestal = document.querySelector(".stage-pedestal");
    const pedestalRect = pedestal ? pedestal.getBoundingClientRect() : { left: 0, bottom: 0 };
    const barRect = bar.getBoundingClientRect();

    // Exact pixel coordinates matching bar[i]
    const leftPx = barRect.left - pedestalRect.left;
    const bottomPx = pedestalRect.bottom - barRect.bottom;
    const widthPx = barRect.width;
    const heightPx = barRect.height;

    floatingBar.style.transition = "none";
    floatingBar.style.transform = "none";
    floatingBar.style.left = `${leftPx}px`;
    floatingBar.style.bottom = `${bottomPx}px`;
    floatingBar.style.width = `${widthPx}px`;
    floatingBar.style.height = `${heightPx}px`;
    floatingBar.style.display = "flex";
    floatingBar.classList.add("bar-hoisted");

    const label = floatingBar.querySelector(".bar-label");
    if (label) {
      label.textContent = this.hoistedKeyVal;
    }

    // Hide the ground bar slot completely so NO shadow or overlapping silhouette exists
    bar.style.visibility = "hidden";
    bar.style.opacity = "0";
    bar.classList.remove("state-swapping", "state-comparing");

    const totalStepDelay = this.getDelay();
    const tLift = Math.max(120, Math.round(totalStepDelay * 0.28));

    const pedestalHeight = pedestal ? pedestal.clientHeight : 350;
    const liftHeight = Math.max(60, Math.min(95, Math.round(pedestalHeight * 0.25)));
    this.hoistedLiftHeight = liftHeight;
    this.origBarLeft = barRect.left;
    this.origTrolleyX = leftPx + widthPx / 2;

    // Crane trolley sync
    const trolley = document.getElementById("crane-trolley");
    if (trolley) {
      trolley.style.transition = "none";
      trolley.style.transform = `translateX(${this.origTrolleyX}px)`;
      trolley.classList.add("active");
    }

    // Force browser reflow to commit initial placement
    void floatingBar.offsetWidth;

    // Animate lift straight up
    floatingBar.style.transition = `transform ${tLift}ms cubic-bezier(0.2, 0.8, 0.25, 1), box-shadow ${tLift}ms ease`;
    floatingBar.style.transform = `translate(0px, -${liftHeight}px) scale(1.05)`;

    await this.sleep(tLift);
    if (this.aborted) throw new Error("SORT_ABORTED");
  }

  async shiftStep(fromIdx, toIdx) {
    if (this.aborted) throw new Error("SORT_ABORTED");

    const barFrom = this.barElements[fromIdx];
    const barTo = this.barElements[toIdx];
    const floatingBar = document.getElementById("crane-floating-bar");
    if (!barFrom || !barTo || !floatingBar) return;

    const rectFrom = barFrom.getBoundingClientRect();
    const rectTo = barTo.getBoundingClientRect();
    const stepDeltaX = rectTo.left - rectFrom.left; // Distance from j to j + 1 (positive, to the right)

    const totalStepDelay = this.getDelay();
    const tShift = Math.max(140, Math.round(totalStepDelay * 0.38));

    // Ground bar (fromIdx, the larger value) slides RIGHT by stepDeltaX
    barFrom.classList.add("bar-sliding");
    barFrom.style.transition = `transform ${tShift}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    barFrom.style.transform = `translateX(${stepDeltaX}px)`;

    // Hoisted bar in the air (the smaller key value) glides LEFT to slot fromIdx
    this.currentShiftDeltaX = -stepDeltaX;
    floatingBar.style.transition = `transform ${tShift}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    floatingBar.style.transform = `translate(${this.currentShiftDeltaX}px, -${this.hoistedLiftHeight}px) scale(1.05)`;

    // Trolley tracks left in sync with hoisted bar directly over slot fromIdx
    const trolley = document.getElementById("crane-trolley");
    if (trolley) {
      const pedestal = document.querySelector(".stage-pedestal");
      const pedestalRect = pedestal ? pedestal.getBoundingClientRect() : { left: 0 };
      const trolleyX = rectFrom.left + rectFrom.width / 2 - pedestalRect.left;
      trolley.style.transition = `transform ${tShift}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      trolley.style.transform = `translateX(${trolleyX}px)`;
    }

    await this.sleep(tShift);
    if (this.aborted) throw new Error("SORT_ABORTED");

    // Commit ground bar: reset transform and set DOM value at toIdx
    barFrom.style.transition = "none";
    barFrom.style.transform = "";
    barFrom.classList.remove("bar-sliding");

    // Slot toIdx now has the larger value, fully visible and solid
    this.updateBarDOM(toIdx, this.array[fromIdx]);
    this.barElements[toIdx].style.visibility = "visible";
    this.barElements[toIdx].style.opacity = "1";
    this.revertBar(toIdx);

    // Slot fromIdx must remain hidden because floatingBar is hovering directly over it
    this.barElements[fromIdx].style.visibility = "hidden";
    this.barElements[fromIdx].style.opacity = "0";

    void barFrom.offsetWidth;
    barFrom.style.transition = "";
  }

  async dropBarForInsertion(targetSlot, keyVal) {
    if (this.aborted) throw new Error("SORT_ABORTED");

    const floatingBar = document.getElementById("crane-floating-bar");
    const totalStepDelay = this.getDelay();
    const tDrop = Math.max(120, Math.round(totalStepDelay * 0.28));

    const deltaX = this.currentShiftDeltaX || 0;

    if (floatingBar) {
      floatingBar.style.transition = `transform ${tDrop}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      floatingBar.style.transform = `translate(${deltaX}px, 0px) scale(1)`;
    }

    await this.sleep(tDrop);
    if (this.aborted) throw new Error("SORT_ABORTED");

    const trolley = document.getElementById("crane-trolley");
    if (trolley) {
      trolley.classList.remove("active");
      trolley.style.transform = "";
    }

    if (floatingBar) {
      floatingBar.style.display = "none";
      floatingBar.style.transition = "none";
      floatingBar.style.transform = "";
      floatingBar.classList.remove("bar-hoisted");
    }

    // Set target slot value and update DOM
    this.updateBarDOM(targetSlot, keyVal);
    this.barElements[targetSlot].style.visibility = "visible";
    this.barElements[targetSlot].style.opacity = "1";
    this.revertBar(targetSlot);

    this.isHoisted = false;
    this.currentShiftDeltaX = 0;
  }

  async overwrite(i, value, codeLineIdx = null) {
    if (this.aborted) throw new Error("SORT_ABORTED");

    this.swaps++;
    this.metricSwaps.textContent = this.swaps;

    this.setBarState(i, "swapping");
    this.setStatus(`Menulis nilai ${value} ke indeks [${i}]`, "warning");
    if (codeLineIdx !== null) this.highlightCodeLine(codeLineIdx);

    this.updateBarDOM(i, value);

    await this.sleep();
    this.revertBar(i);
  }

  markSorted(index) {
    if (index >= 0 && index < this.barElements.length) {
      this.barElements[index].style.opacity = "1";
      this.setBarState(index, "sorted");
    }
  }

  async finishVictorySweep() {
    this.setStatus("Pengurutan selesai dengan sempurna! Seluruh elemen telah terurut.", "success");
    this.highlightCodeLine(null);

    // Quick cascading wave to turn all bars to emerald green
    const sweepDelay = Math.max(10, Math.min(30, Math.floor(400 / this.array.length)));
    for (let i = 0; i < this.barElements.length; i++) {
      if (this.aborted) return;
      this.setBarState(i, "sorted");
      await this.sleep(sweepDelay);
    }
  }

  // --------------------------------------------------------------------------
  // Status, Code Tracker, & Metrics Helpers
  // --------------------------------------------------------------------------
  setStatus(text, type = "normal") {
    this.statusText.textContent = text;
    if (this.statusIndicator) {
      if (type === "active") this.statusIndicator.style.background = "#fbbf24";
      else if (type === "warning") this.statusIndicator.style.background = "#f43f5e";
      else if (type === "success") this.statusIndicator.style.background = "#10b981";
      else this.statusIndicator.style.background = "#38bdf8";
    }
  }

  highlightCodeLine(lineIndex) {
    const lines = this.codeDisplay.querySelectorAll(".code-line");
    lines.forEach((line, idx) => {
      if (idx === lineIndex) {
        line.classList.add("active");
        line.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else {
        line.classList.remove("active");
      }
    });
  }

  formatSyntaxHighlight(code) {
    if (!code) return "";

    // Single-pass regex tokenizer to prevent double-escaping HTML tags
    const tokenRegex = /(".*?"|'.*?'|#[^\n]*|\b(?:def|return|for|in|if|while|and|or|not|break|else|elif)\b|\b(?:len|range|partition|quick_sort|bubble_sort|selection_sort|insertion_sort)\b|\b\d+\b|==|!=|<=|>=|[=+\-*%<>])/g;

    return code.replace(tokenRegex, (match) => {
      if (match.startsWith("#")) return `<span class="token-comment">${match}</span>`;
      if (match.startsWith('"') || match.startsWith("'")) return `<span class="token-string">${match}</span>`;
      if (/^(def|return|for|in|if|while|and|or|not|break|else|elif)$/.test(match)) return `<span class="token-keyword">${match}</span>`;
      if (/^(len|range|partition|quick_sort|bubble_sort|selection_sort|insertion_sort)$/.test(match)) return `<span class="token-func">${match}</span>`;
      if (/^\d+$/.test(match)) return `<span class="token-number">${match}</span>`;
      if (/^[=+\-*%<>]+$/.test(match)) {
        const safeOp = match.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<span class="token-operator">${safeOp}</span>`;
      }
      return match;
    });
  }

  initThemeSelector() {
    if (!this.themeSelect || !this.codeTrackerBox) return;

    const themeColors = {
      cyber: "#38bdf8",
      dracula: "#bd93f9",
      monokai: "#f92672",
      onedark: "#61afef",
      nord: "#88c0d0",
      matrix: "#00ff66"
    };

    const applyTheme = (themeName) => {
      // Remove any existing theme-* classes
      this.codeTrackerBox.className = this.codeTrackerBox.className
        .split(" ")
        .filter(c => !c.startsWith("theme-"))
        .join(" ");
      
      this.codeTrackerBox.classList.add(`theme-${themeName}`);
      if (this.themeDot && themeColors[themeName]) {
        this.themeDot.style.backgroundColor = themeColors[themeName];
        this.themeDot.style.boxShadow = `0 0 8px ${themeColors[themeName]}`;
      }
    };

    this.themeSelect.addEventListener("change", (e) => {
      applyTheme(e.target.value);
    });

    // Apply initial theme
    applyTheme(this.themeSelect.value || "cyber");
  }

  updateAlgorithmDetails() {
    const algoKey = this.algoSelect.value;
    const algo = ALGORITHM_REGISTRY[algoKey];
    if (!algo) return;

    this.algoTitle.textContent = algo.name;
    this.chipTime.textContent = `Waktu: ${algo.timeComplexity}`;
    this.chipSpace.textContent = `Ruang: ${algo.spaceComplexity}`;
    this.algoDesc.textContent = algo.description;
    this.codeFilename.textContent = algo.filename;

    // Render code lines with syntax highlighting
    this.codeDisplay.innerHTML = "";
    algo.codeLines.forEach((lineText, idx) => {
      const lineDiv = document.createElement("div");
      lineDiv.className = "code-line";

      const numSpan = document.createElement("span");
      numSpan.className = "code-line-num";
      numSpan.textContent = idx + 1;

      const textSpan = document.createElement("span");
      textSpan.className = "code-line-text";
      textSpan.innerHTML = this.formatSyntaxHighlight(lineText);

      lineDiv.appendChild(numSpan);
      lineDiv.appendChild(textSpan);
      this.codeDisplay.appendChild(lineDiv);
    });
  }

  resetMetrics() {
    this.comparisons = 0;
    this.swaps = 0;
    this.metricComparisons.textContent = "0";
    this.metricSwaps.textContent = "0";
    this.metricTime.textContent = "00.00s";
    this.stopTimer();
  }

  startTimer() {
    this.startTime = performance.now();
    this.timerInterval = setInterval(() => {
      const elapsedMs = performance.now() - this.startTime;
      const totalSec = (elapsedMs / 1000).toFixed(2);
      this.metricTime.textContent = `${totalSec.padStart(5, "0")}s`;
    }, 50);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  setControlsDisabled(disabled) {
    this.algoSelect.disabled = disabled;
    this.sizeSlider.disabled = disabled;
    this.btnGenerate.disabled = disabled;
    this.btnStart.disabled = disabled;
    this.btnReset.disabled = !disabled; // Enable reset button only when running
  }

  // --------------------------------------------------------------------------
  // Reset / Abort Handling
  // --------------------------------------------------------------------------
  reset() {
    this.aborted = true;
    this.stopTimer();
    this.isSorting = false;

    const trolley = document.getElementById("crane-trolley");
    if (trolley) {
      trolley.classList.remove("active");
      trolley.style.transform = "";
    }

    const floatingBar = document.getElementById("crane-floating-bar");
    if (floatingBar) {
      floatingBar.style.display = "none";
      floatingBar.style.transition = "none";
      floatingBar.style.transform = "";
      floatingBar.classList.remove("bar-hoisted");
    }

    if (this.hoistedBar) {
      this.hoistedBar.classList.remove("bar-hoisted");
      this.hoistedBar.style.transform = "";
      this.hoistedBar = null;
    }

    this.isHoisted = false;
    this.currentShiftDeltaX = 0;

    // Restore snapshot or regenerate
    this.array = [...this.initialArraySnapshot];
    this.renderBars();
    this.resetMetrics();
    this.setControlsDisabled(false);
    this.highlightCodeLine(null);
    this.setStatus("Animasi dihentikan dan posisi array di-reset ke awal.", "normal");
  }

  // --------------------------------------------------------------------------
  // Event Listeners
  // --------------------------------------------------------------------------
  initEventListeners() {
    // Algorithm Dropdown Change
    this.algoSelect.addEventListener("change", () => {
      this.updateAlgorithmDetails();
    });

    // Array Size Slider
    this.sizeSlider.addEventListener("input", (e) => {
      this.arraySize = parseInt(e.target.value, 10);
      this.sizeValue.textContent = this.arraySize;
      this.generateNewArray();
    });

    // Speed Slider
    this.speedSlider.addEventListener("input", (e) => {
      this.speedSliderValue = parseInt(e.target.value, 10);
      const val = this.speedSliderValue;
      if (val < 25) this.speedValue.textContent = "Lambat";
      else if (val < 65) this.speedValue.textContent = "Normal";
      else if (val < 85) this.speedValue.textContent = "Cepat";
      else this.speedValue.textContent = "Kilat";
    });

    // Action Buttons
    this.btnGenerate.addEventListener("click", () => {
      this.generateNewArray();
    });

    this.btnStart.addEventListener("click", () => {
      this.startSorting();
    });

    this.btnReset.addEventListener("click", () => {
      this.reset();
    });
  }

  // ==========================================================================
  // 3. SORTING ALGORITHMS (Pure Logic calling VisualizerEngine primitives)
  // ==========================================================================
  async startSorting() {
    if (this.isSorting) return;

    this.isSorting = true;
    this.aborted = false;
    this.setControlsDisabled(true);
    this.resetMetrics();
    this.startTimer();

    const algoKey = this.algoSelect.value;

    try {
      if (algoKey === "bubble") {
        await this.bubbleSort();
      } else if (algoKey === "selection") {
        await this.selectionSort();
      } else if (algoKey === "insertion") {
        await this.insertionSort();
      } else if (algoKey === "quick") {
        await this.quickSort(0, this.array.length - 1);
      }

      this.stopTimer();
      await this.finishVictorySweep();
    } catch (err) {
      if (err.message !== "SORT_ABORTED") {
        console.error("Sorting error:", err);
      }
    } finally {
      this.isSorting = false;
      this.setControlsDisabled(false);
      this.stopTimer();
    }
  }

  // --- 1. Bubble Sort ---
  async bubbleSort() {
    const n = this.array.length;
    for (let i = 0; i < n; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        // Line 4: if arr[j] > arr[j + 1]
        const shouldSwap = await this.compare(j, j + 1, 4);
        if (shouldSwap) {
          // Line 5: arr[j], arr[j + 1] = arr[j + 1], arr[j]
          await this.swap(j, j + 1, 5);
          swapped = true;
        }
      }
      this.markSorted(n - i - 1);
      if (!swapped) break;
    }
  }

  // --- 2. Selection Sort ---
  async selectionSort() {
    const n = this.array.length;
    for (let i = 0; i < n; i++) {
      let minIdx = i;
      this.setBarState(minIdx, "pivot"); // Purple highlight for current candidate

      for (let j = i + 1; j < n; j++) {
        // Line 5: if arr[j] < arr[min_idx]
        this.setStatus(`Mencari elemen terkecil: membandingkan indeks [${j}] dengan min [${minIdx}]`, "active");
        this.highlightCodeLine(5);
        this.comparisons++;
        this.metricComparisons.textContent = this.comparisons;

        this.setBarState(j, "comparing");
        await this.sleep();

        if (this.array[j] < this.array[minIdx]) {
          this.revertBar(minIdx);
          minIdx = j;
          this.setBarState(minIdx, "pivot");
        } else {
          this.revertBar(j);
        }
      }

      if (minIdx !== i) {
        // Line 7: arr[i], arr[min_idx] = arr[min_idx], arr[i]
        await this.swap(i, minIdx, 7);
      } else {
        this.revertBar(minIdx);
      }

      this.markSorted(i);
    }
  }

  // --- 3. Insertion Sort (Lift & Shift Crane Animation) ---
  async insertionSort() {
    const n = this.array.length;
    this.markSorted(0);

    for (let i = 1; i < n; i++) {
      let currPos = i;
      const key = this.array[currPos];

      // Line 2: key = arr[i] -> Cabut batang key ke atas dengan crane
      this.highlightCodeLine(2);
      this.setStatus(`Menyisipkan: Mencabut key (${key}) di indeks [${currPos}] ke atas`, "warning");
      await this.liftBarForInsertion(currPos);

      while (currPos > 0) {
        const leftIdx = currPos - 1;
        const leftVal = this.array[leftIdx];

        this.comparisons++;
        this.metricComparisons.textContent = this.comparisons;
        this.highlightCodeLine(4);

        // Tandai batang di sebelah kiri dengan status comparing (orange)
        this.setBarState(leftIdx, "comparing");
        this.setStatus(`Membandingkan key (${key}) dengan indeks [${leftIdx}] (${leftVal})`, "active");
        await this.sleep(Math.max(120, Math.round(this.getDelay() * 0.35)));

        if (leftVal > key) {
          // arr[leftIdx] lebih besar: geser batang ke kanan dan key ke kiri
          this.swaps++;
          this.metricSwaps.textContent = this.swaps;
          this.highlightCodeLine(5);
          this.setStatus(`Menggeser batang [${leftIdx}] (${leftVal}) ke kanan ➔ [${currPos}]`, "warning");

          // Geser batang di lantai ke kanan dan key di udara ke kiri
          await this.shiftStep(leftIdx, currPos);

          // TURUN DULU KE BAWAH: tancapkan key ke slot leftIdx di lantai
          this.setStatus(`Menurunkan key (${key}) ke posisi [${leftIdx}] di lantai`, "warning");
          await this.dropBarForInsertion(leftIdx, key);

          // Update data array
          this.array[currPos] = leftVal;
          this.array[leftIdx] = key;
          currPos = leftIdx;

          // Jeda sejenak di lantai agar terlihat jelas posisinya sudah bertukar dan mendarat
          await this.sleep(Math.max(110, Math.round(this.getDelay() * 0.28)));

          // Jika masih ada diagram batang di sebelah kiri, LIFT LAGI untuk diperiksa berikutnya
          if (currPos > 0) {
            this.highlightCodeLine(3);
            this.setStatus(`Mengangkat kembali key (${key}) di indeks [${currPos}] untuk diperiksa ke kiri`, "warning");
            await this.liftBarForInsertion(currPos);
          }
        } else {
          // Nilai di kiri lebih kecil atau sama: posisi sudah tepat
          this.revertBar(leftIdx);
          break;
        }
      }

      // Jika batang masih di udara (misal tidak ada pergeseran atau loop break), tancapkan ke lantai
      if (this.isHoisted) {
        this.highlightCodeLine(7);
        this.setStatus(`Menancapkan key (${key}) ke slot terurut [${currPos}]`, "success");
        await this.dropBarForInsertion(currPos, key);
      }

      // Re-mark sorted subarray 0..i
      for (let k = 0; k <= i; k++) {
        this.markSorted(k);
      }
      await this.sleep(Math.max(80, Math.round(this.getDelay() * 0.20)));
    }
  }

  // --- 4. Quick Sort ---
  async quickSort(low, high) {
    if (low < high) {
      // Line 2: pi = partition(arr, low, high)
      this.highlightCodeLine(2);
      const pi = await this.partition(low, high);

      this.markSorted(pi);

      // Recursive calls
      this.highlightCodeLine(3);
      await this.quickSort(low, pi - 1);

      this.highlightCodeLine(4);
      await this.quickSort(pi + 1, high);
    } else if (low === high) {
      this.markSorted(low);
    }
  }

  async partition(low, high) {
    const pivotValue = this.array[high];
    this.setBarState(high, "pivot");
    this.setStatus(`Partisi: Pivot dipilih di indeks [${high}] (nilai ${pivotValue})`, "active");
    this.highlightCodeLine(7);
    await this.sleep();

    let i = low - 1;

    for (let j = low; j < high; j++) {
      this.highlightCodeLine(10);
      this.comparisons++;
      this.metricComparisons.textContent = this.comparisons;

      this.setBarState(j, "comparing");
      this.setStatus(`QuickSort: Membandingkan elemen [${j}] (${this.array[j]}) dengan Pivot (${pivotValue})`, "active");
      await this.sleep();

      if (this.array[j] < pivotValue) {
        i++;
        await this.swap(i, j, 11);
      } else {
        this.revertBar(j);
      }
    }

    // Place pivot in correct position
    await this.swap(i + 1, high, 12);
    this.revertBar(high);

    return i + 1;
  }
}

// ============================================================================
// 4. BOOTSTRAP
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  window.sortingVisualizer = new VisualizerEngine();
});
