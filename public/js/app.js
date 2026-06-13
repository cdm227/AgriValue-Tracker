import { apiFetch } from "./api-client.js";
import { saveTradeRecord, renderTradeHistory, getRecentTradesForAdvisor } from "./trade-memory.js";

let chart = null;
let qualityMultiplier = 1.0;
let lastVisionGrade = null;
let lastOptimization = null;
let currentCurrency = localStorage.getItem("agrivalue-currency") || "USD";

const CURRENCIES = {
  USD: { symbol: "$", rate: 1, locale: "en-US" },
  EUR: { symbol: "€", rate: 0.92, locale: "it-IT" },
  GBP: { symbol: "£", rate: 0.78, locale: "en-GB" },
  CAD: { symbol: "C$", rate: 1.36, locale: "en-CA" },
};

export function initApp() {
  if (window.lucide) lucide.createIcons();
  setupPreferences();
  loadIQStatus();
  loadProcessorNetwork();
  initChart(document.getElementById("crop")?.value || "Olive Oil");
  setupCropListener();
  setupAdvisor();
  setupIntro();
  setupWelcomeHero();
  renderTradeHistory(document.getElementById("trade-history-list"));
  if (window.lucide) lucide.createIcons();
}

function money(value) {
  const cfg = CURRENCIES[currentCurrency] || CURRENCIES.USD;
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: currentCurrency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0) * cfg.rate);
}

function setupPreferences() {
  const currency = document.getElementById("currency-select");
  if (currency) {
    currency.value = currentCurrency;
    currency.addEventListener("change", () => {
      currentCurrency = currency.value;
      localStorage.setItem("agrivalue-currency", currentCurrency);
      if (lastOptimization) showResults(lastOptimization.crop, lastOptimization.qtyTons, lastOptimization.data);
      logToConsole(`Currency display switched to ${currentCurrency}`);
    });
  }

  const theme = document.getElementById("theme-select");
  const savedTheme = localStorage.getItem("agrivalue-theme") || "system";
  if (theme) {
    theme.value = savedTheme;
    theme.addEventListener("change", () => applyTheme(theme.value));
  }
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  const resolved = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : theme;

  document.body.dataset.theme = resolved;
  localStorage.setItem("agrivalue-theme", theme);
}

/* ---------- Intro / Onboarding ---------- */
let introStep = 0;
const INTRO_STEPS = 4;

function setupIntro() {
  document.getElementById("intro-next")?.addEventListener("click", nextIntroStep);
  document.getElementById("intro-skip")?.addEventListener("click", () => showIntro(false));
  if (!localStorage.getItem("agrivalue-intro-seen")) showIntro(true);
}

function setupWelcomeHero() {
  const btn = document.getElementById("welcome-hero-details-btn");
  const panel = document.getElementById("welcome-hero-details");
  if (!btn || !panel) return;
  btn.addEventListener("click", () => {
    const open = !panel.classList.contains("is-open");
    panel.classList.toggle("hidden", !open);
    panel.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? "Hide" : "Details";
    if (open) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

window.showIntro = function (visible) {
  const overlay = document.getElementById("intro-overlay");
  if (!overlay) return;
  if (visible) {
    introStep = 0;
    renderIntroStep();
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
    localStorage.setItem("agrivalue-intro-seen", "1");
  }
  lucide.createIcons();
};

function nextIntroStep() {
  if (introStep >= INTRO_STEPS - 1) return showIntro(false);
  introStep++;
  renderIntroStep();
}

function renderIntroStep() {
  for (let i = 0; i < INTRO_STEPS; i++) {
    document.getElementById(`intro-step-${i}`)?.classList.toggle("hidden", i !== introStep);
    const dot = document.querySelector(`.intro-dot[data-dot="${i}"]`);
    dot?.classList.toggle("bg-emerald-500", i === introStep);
    dot?.classList.toggle("bg-slate-700", i !== introStep);
    dot?.classList.toggle("w-6", i === introStep);
  }
  const next = document.getElementById("intro-next");
  if (next) next.textContent = introStep === INTRO_STEPS - 1 ? "Start Optimizing" : "Next";
  document.getElementById(`intro-step-${introStep}`)?.classList.add("animate-fade-in");
  lucide.createIcons();
}

async function loadIQStatus() {
  try {
    const res = await apiFetch("/api/status");
    if (!res.ok) return;
    const status = await res.json();
    setPill("pill-fabric", status.fabricIQ?.source?.includes("fabric"), `Fabric ${status.fabricIQ?.source || "—"}`);
    setPill("pill-foundry", status.foundryIQ?.configured, status.foundryIQ?.live ? "Foundry Live" : "Foundry Local");
    setPill("pill-work", status.workIQ?.active, status.workIQ?.active ? "Work IQ On" : "Work IQ Off");
  } catch {
    setPill("pill-fabric", false, "Fabric Offline");
    setPill("pill-foundry", false, "Foundry Offline");
    setPill("pill-work", false, "Work IQ Off");
  }
}

function setPill(id, live, label) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `iq-pill ${live ? "live" : "offline"}`;
  el.querySelector(".pill-label").textContent = label;
  const mobile = document.getElementById(`${id}-mobile`);
  if (mobile) {
    mobile.className = el.className;
    mobile.querySelector(".pill-label").textContent = label.replace("Work IQ", "Work");
  }
}

async function loadProcessorNetwork() {
  try {
    const res = await apiFetch("/api/processors");
    if (!res.ok) return;
    const processors = await res.json();
    const grid = document.getElementById("processor-grid");
    if (!grid) return;

    const cropIcon = { Olives: "🫒", Grapes: "🍇", Wheat: "🌾" };
    grid.innerHTML = processors.map((p) => `
      <div class="processor-card glass rounded-xl p-3 cursor-pointer" data-crop="${p.inputs}" onclick="selectProcessor('${p.inputs}')">
        <div class="flex items-center justify-between gap-2">
          <div class="text-[10px] text-slate-500 uppercase font-bold">${p.location}</div>
          <span class="selected-badge text-[9px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">Selected</span>
        </div>
        <div class="text-sm font-bold text-white mt-1 truncate">${cropIcon[p.inputs] || "🌱"} ${p.name}</div>
        <div class="text-xs text-emerald-400 mt-1">${p.inputs}</div>
        <div class="text-[10px] text-slate-400 mt-2">${money(p.costs)}/ton process</div>
      </div>
    `).join("");
    lucide.createIcons();
  } catch { /* optional panel */ }
}

window.selectProcessor = (crop) => {
  document.getElementById("crop").value = crop;
  document.getElementById("crop").dispatchEvent(new Event("change"));
  document.querySelectorAll(".processor-card").forEach((c) => {
    c.classList.toggle("active", c.dataset.crop === crop);
  });
  logToConsole(`Fabric IQ: Selected processor network for ${crop}`);
};

async function initChart(cropName) {
  try {
    const res = await apiFetch(`/api/crop/${encodeURIComponent(cropName)}`);
    if (!res.ok) return;
    const data = await res.json();
    const canvas = document.getElementById("trendChart");
    if (!canvas) return;

    if (chart) chart.destroy();
    chart = new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels: ["H-5", "H-4", "H-3", "H-2", "H-1", "F+1", "F+2", "F+3", "F+4", "F+5"],
        datasets: [{
          label: `${cropName} USD/MT`,
          data: [...data.history, ...data.forecast],
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.06)",
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "#10b981",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: "rgba(255,255,255,0.03)" }, ticks: { color: "#64748b", font: { size: 9 } } },
          y: { grid: { color: "rgba(255,255,255,0.03)" }, ticks: { color: "#64748b", font: { size: 9 } } },
        },
      },
    });
  } catch {
    logToConsole("Fabric IQ: Chart unavailable.");
  }
}

function setupCropListener() {
  document.getElementById("crop")?.addEventListener("change", (e) => {
    initChart(e.target.value);
    logToConsole(`Fabric IQ: Recalculating ${e.target.value} market series…`);
    highlightProcessor(e.target.value);
  });
}

function highlightProcessor(crop) {
  document.querySelectorAll(".processor-card").forEach((c) => {
    c.classList.toggle("active", c.dataset.crop === crop);
  });
}

export function logToConsole(text) {
  const box = document.getElementById("agent-console");
  if (!box) return;
  const time = new Date().toLocaleTimeString();
  const log = document.createElement("div");
  log.innerHTML = `<span class="text-slate-500">[${time}]</span> ${text}`;
  box.appendChild(log);
  box.scrollTop = box.scrollHeight;
}

async function runVisionScan(crop, previewHtml) {
  const laser = document.getElementById("scanner-laser");
  const preview = document.getElementById("scan-preview");
  if (!preview) return null;

  if (previewHtml) preview.innerHTML = previewHtml;
  if (laser) laser.style.display = "block";
  logToConsole("Foundry Vision: Neural scan initiated…");

  await new Promise((resolve) => setTimeout(resolve, 2200));

  const res = await apiFetch("/api/evaluate-quality", {
    method: "POST",
    body: JSON.stringify({ crop }),
  });
  const data = await res.json();
  qualityMultiplier = data.multiplier;
  lastVisionGrade = data.grade;

  document.getElementById("quality-badge")?.classList.remove("hidden");
  document.getElementById("quality-multiplier-text").textContent =
    `${data.grade} — ${data.multiplier}x multiplier`;

  if (laser) laser.style.display = "none";
  preview.innerHTML = `
    <div class="text-left p-3 text-xs space-y-1 animate-fade-in">
      <p class="font-bold text-emerald-400">Neural Audit Report</p>
      <p><strong>Grade:</strong> ${data.grade}</p>
      <p class="text-slate-400 text-[10px]">${data.analysis}</p>
    </div>`;
  logToConsole(`Vision scan: ${data.grade} (${data.multiplier}x)`);
  return data;
}

window.runImageScan = async function (event) {
  const file = event.target.files[0];
  if (!file) return;
  const crop = document.getElementById("crop").value;
  const previewHtml = `<img src="${URL.createObjectURL(file)}" class="object-cover h-full w-full rounded-xl opacity-70" alt="crop">`;
  await runVisionScan(crop, previewHtml);
};

window.runDemoVisionScan = async function (crop = "Olive Oil") {
  const previewHtml = `<img src="https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80" class="object-cover h-full w-full rounded-xl opacity-70" alt="olive harvest">`;
  return runVisionScan(crop, previewHtml);
};

window.optimizeChain = async function () {
  const crop = document.getElementById("crop").value;
  const qtyTons = document.getElementById("qty").value;
  const isOrganic = document.getElementById("organic").checked;
  const btn = document.getElementById("optimize-btn");

  btn.disabled = true;
  btn.classList.add("opacity-70");
  logToConsole(`IQ Pipeline: Optimizing ${qtyTons} MT ${crop}…`);

  const steps = [
    [300, "Fabric IQ: Loading semantic processor graph…"],
    [700, "Foundry IQ: Querying compliance knowledge base…"],
    [1200, "Work IQ: Preparing cooperative notification channel…"],
  ];
  steps.forEach(([delay, msg]) => setTimeout(() => logToConsole(msg), delay));

  try {
    const res = await apiFetch("/api/optimize", {
      method: "POST",
      body: JSON.stringify({ crop, qtyTons, isOrganic, qualityMultiplier, notifyTeams: true }),
    });
    if (!res.ok) throw new Error("API unavailable");
    const data = await res.json();
    lastOptimization = { crop, qtyTons, isOrganic, data };

    showResults(crop, qtyTons, data);
    typewriterRule(data.processedPath.foundryIQRule);
    loadCropInsights(crop, qtyTons);

    saveTradeRecord({
      crop,
      qtyTons: Number(qtyTons),
      isOrganic,
      qualityMultiplier,
      qualityGrade: lastVisionGrade,
      addedValue: data.addedValue,
      pathBNet: data.processedPath?.net,
    });
    renderTradeHistory(document.getElementById("trade-history-list"));

    if (data.workIQ?.sent) {
      logToConsole(`Work IQ: Teams notification sent via ${data.workIQ.channel}`);
    }
    logToConsole(`Complete — added value ${money(data.addedValue)} [${data.iqLayers?.fabric}/${data.iqLayers?.foundry}]`);
  } catch (err) {
    logToConsole(`Error: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.classList.remove("opacity-70");
  }
};

/* ---------- AI Insights ---------- */
async function loadCropInsights(crop, qtyTons) {
  try {
    const res = await apiFetch(`/api/insights/${encodeURIComponent(crop)}?qty=${qtyTons}`);
    if (!res.ok) return;
    const { insights } = await res.json();

    const grid = document.getElementById("ai-insights-grid");
    grid.innerHTML = insights.map((ins, i) => `
      <div class="glass rounded-xl p-3.5 border-violet-500/10 animate-fade-in" style="animation-delay:${i * 120}ms">
        <div class="flex items-center gap-2 mb-1.5">
          <i data-lucide="${ins.icon}" class="w-3.5 h-3.5 text-violet-400"></i>
          <span class="text-[10px] font-bold text-violet-300 uppercase tracking-wider">${ins.title}</span>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed">${ins.text}</p>
      </div>
    `).join("");

    document.getElementById("ai-insights").classList.remove("hidden");
    lucide.createIcons();
    logToConsole("AI Briefing: 4 intelligence cards generated.");
  } catch { /* non-blocking enhancement */ }
}

window.runPortfolioScan = async function () {
  const qtyTons = document.getElementById("qty").value || 10;
  logToConsole(`AI Portfolio: Scanning all 5 crops at ${qtyTons} MT…`);

  try {
    const res = await apiFetch(`/api/insights/portfolio?qty=${qtyTons}`);
    if (!res.ok) throw new Error("Portfolio API unavailable");
    const { rankings, narrative } = await res.json();
    const displayNarrative = narrative.replace(/\$([0-9,]+)/g, (_, n) => money(Number(n.replace(/,/g, ""))));

    document.getElementById("welcome-pane").style.display = "none";
    document.getElementById("results-pane").style.display = "none";
    const pane = document.getElementById("portfolio-pane");
    pane.style.display = "block";
    pane.classList.add("animate-fade-in");

    document.getElementById("portfolio-narrative").innerHTML =
      displayNarrative.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>");

    const maxVal = rankings[0]?.addedValue || 1;
    document.getElementById("portfolio-rankings").innerHTML = rankings.map((r, i) => `
      <div class="glass rounded-xl p-4 flex items-center gap-4 animate-fade-in cursor-pointer hover:border-emerald-500/30 transition-colors"
           style="animation-delay:${i * 100}ms" onclick="selectProcessor('${r.crop}'); backToWelcome();">
        <span class="text-2xl font-black ${i === 0 ? "text-emerald-400" : "text-slate-600"} w-8">#${i + 1}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-bold text-white">${r.crop}</span>
            <span class="text-xs font-mono ${i === 0 ? "text-emerald-400" : "text-slate-400"}">${money(r.addedValue)}</span>
          </div>
          <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full ${i === 0 ? "bg-emerald-500" : "bg-slate-600"} rounded-full transition-all duration-700" style="width:${Math.round((r.addedValue / maxVal) * 100)}%"></div>
          </div>
          <div class="flex justify-between mt-1 text-[10px] text-slate-500">
            <span>${r.processedProduct} · ${r.processor}</span>
            <span class="${r.trendPct > 10 ? "text-emerald-500" : ""}">${r.trendPct >= 0 ? "▲" : "▼"} ${Math.abs(r.trendPct)}% forecast</span>
          </div>
        </div>
      </div>
    `).join("");

    logToConsole(`AI Portfolio: ${rankings[0]?.crop} ranked #1 — ${money(rankings[0]?.addedValue)} added value.`);
  } catch (err) {
    logToConsole(`Portfolio scan error: ${err.message}`);
  }
};

window.backToWelcome = function () {
  document.getElementById("portfolio-pane").style.display = "none";
  if (lastOptimization) {
    document.getElementById("results-pane").style.display = "block";
  } else {
    document.getElementById("welcome-pane").style.display = "flex";
  }
};

function showResults(crop, qtyTons, data) {
  document.getElementById("welcome-pane").style.display = "none";
  document.getElementById("portfolio-pane").style.display = "none";
  const pane = document.getElementById("results-pane");
  pane.style.display = "block";
  pane.classList.add("animate-fade-in");

  document.getElementById("added-value-amt").textContent = money(data.addedValue);
  document.getElementById("node-crop").textContent = `${crop} (${qtyTons} MT)`;
  document.getElementById("node-destination").textContent =
    `${data.processedPath.processor} — ${data.processedPath.processorLocation || "Sicily"}`;

  document.getElementById("raw-gross").textContent = money(data.rawPath.gross);
  document.getElementById("raw-transport").textContent = `-${money(data.rawPath.transport)}`;
  document.getElementById("raw-net").textContent = money(data.rawPath.net);
  document.getElementById("proc-gross").textContent = money(data.processedPath.gross);
  document.getElementById("proc-cost").textContent = `-${money(data.processedPath.processingCost)}`;
  document.getElementById("proc-bonus").textContent = `+${money(data.processedPath.organicBonus)}`;
  document.getElementById("proc-net").textContent = money(data.processedPath.net);

  renderAgentTrace(data.agentTrace);
  highlightProcessor(crop);
  lucide.createIcons();
}

function renderAgentTrace(trace) {
  const grid = document.getElementById("agent-trace-grid");
  const diagram = document.getElementById("agent-handoff-diagram");
  const seal = document.getElementById("golden-seal");
  if (!grid || !trace?.actors) return;

  seal?.classList.toggle("hidden", !trace.goldenSeal);
  if (diagram) {
    diagram.classList.remove("hidden");
    diagram.innerHTML = `
      <div class="agent-flow">
        <div class="agent-node node-don">
          <span class="agent-emoji">👑</span>
          <strong>Don Salvatore</strong>
          <small>Orchestrates</small>
        </div>
        <div class="agent-split">
          <span></span>
          <i data-lucide="git-branch" class="w-4 h-4 text-amber-400"></i>
          <span></span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="agent-node node-matteo">
            <span class="agent-emoji">🧮</span>
            <strong>Matteo</strong>
            <small>${trace.yieldMath?.output?.toLocaleString?.() || "—"} ${trace.yieldMath?.unit || ""}</small>
          </div>
          <div class="agent-node node-sofia">
            <span class="agent-emoji">🛡️</span>
            <strong>Sofia DOP</strong>
            <small>${trace.compliance?.observed || "—"} / ${trace.compliance?.threshold || "—"}</small>
          </div>
        </div>
        <div class="agent-seal ${trace.goldenSeal ? "seal-live" : "seal-pending"}">
          <span>🏅</span>
          <strong>${trace.goldenSeal ? "Golden Seal Issued" : "Evidence Required"}</strong>
        </div>
      </div>
    `;
  }

  grid.innerHTML = trace.actors.map((actor, i) => {
    const palette = [
      "text-amber-400 border-amber-500/20",
      "text-emerald-400 border-emerald-500/20",
      "text-indigo-400 border-indigo-500/20",
    ][i] || "text-slate-400 border-slate-500/20";

    const icon = ["crown", "calculator", "shield-check"][i] || "bot";
    const emoji = ["👑", "🧮", "🛡️"][i] || "🤖";
    return `
      <div class="agent-card glass rounded-xl p-3 ${palette} animate-fade-in" style="animation-delay:${i * 140}ms">
        <div class="flex items-center gap-2 mb-2">
          <span class="agent-emoji-sm">${emoji}</span>
          <i data-lucide="${icon}" class="w-4 h-4"></i>
          <div>
            <div class="text-sm font-black text-white">${actor.name}</div>
            <div class="text-[9px] uppercase tracking-wider text-slate-500">${actor.role}</div>
          </div>
        </div>
        <p class="text-[10px] text-slate-400 font-bold uppercase mb-1">${actor.responsibility}</p>
        <p class="text-[11px] text-slate-300 leading-relaxed">${actor.action}</p>
        <p class="text-[10px] mt-2 font-bold">${actor.status}</p>
      </div>
    `;
  }).join("");
}

function typewriterRule(text) {
  const el = document.getElementById("rule-text");
  if (!el) return;
  el.textContent = "";
  el.classList.add("typewriter-cursor");
  let i = 0;
  const iv = setInterval(() => {
    el.textContent += text[i++] || "";
    if (i >= text.length) {
      clearInterval(iv);
      el.classList.remove("typewriter-cursor");
    }
  }, 12);
}

window.exportContract = async function () {
  if (!lastOptimization) return logToConsole("Run optimization first.");
  const { crop, qtyTons, isOrganic } = lastOptimization;

  const res = await apiFetch("/api/generate-contract", {
    method: "POST",
    body: JSON.stringify({ crop, qtyTons, isOrganic, buyer: "Sicilian Smallholder Cooperative", notifyTeams: true }),
  });
  const { contract, workIQ } = await res.json();

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([contract], { type: "text/markdown" }));
  a.download = `agrivalue-contract-${crop.replace(/\s/g, "-")}.md`;
  a.click();
  logToConsole(workIQ?.sent ? "Contract exported + Work IQ notified" : "Contract exported");
};

window.copyForCopilot = function () {
  if (!lastOptimization) return logToConsole("Run optimization first.");
  const { crop, qtyTons, isOrganic, data } = lastOptimization;
  const prompt = `@agrivalue-iq generate_supply_contract crop="${crop}" qtyTons=${qtyTons} isOrganic=${isOrganic}\n\nRoute: ${data.processedPath.processor} → ${data.processedPath.processedProduct}\nAdded value: ${money(data.addedValue)} (${currentCurrency})`;
  navigator.clipboard.writeText(prompt);
  logToConsole("Copilot MCP prompt copied — paste in VS Code Chat");
};

window.notifyTeams = async function () {
  if (!lastOptimization) return logToConsole("Run optimization first.");
  const res = await apiFetch("/api/notify-teams", {
    method: "POST",
    body: JSON.stringify(lastOptimization.data),
  });
  const result = await res.json();
  logToConsole(result.sent ? `Work IQ: Sent via ${result.channel}` : `Work IQ: ${result.reason || result.error}`);
};

function setupAdvisor() {
  const toggle = document.getElementById("advisor-toggle");
  const panel = document.getElementById("advisor-panel");
  toggle?.addEventListener("click", () => {
    panel?.classList.toggle("collapsed");
  });

  document.querySelectorAll(".advisor-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const input = document.getElementById("advisor-input");
      routeAdvisorToAgent(chip.dataset.agent);
      input.value = chip.dataset.q;
      document.getElementById("advisor-form").requestSubmit();
    });
  });

  document.getElementById("advisor-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("advisor-input");
    const crop = document.getElementById("crop").value;
    const message = input.value.trim();
    if (!message) return;

    appendChat("user", message);
    input.value = "";

    const aiBubble = appendChat("ai", "");
    aiBubble.classList.add("typewriter-cursor");

    try {
      const streamed = await streamAdvisor(message, crop, aiBubble);
      if (!streamed) {
        const res = await apiFetch("/api/advisor", {
          method: "POST",
          body: JSON.stringify({ message, crop, language: getAdvisorLanguageHint(), recentTrades: getRecentTradesForAdvisor(5) }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const { reply } = await res.json();
        renderChatMarkdown(aiBubble, reply);
      }
    } catch (err) {
      renderChatMarkdown(aiBubble, `⚠️ Advisor offline (${err.message}). Make sure the server is running — \`npm start\`.`);
    } finally {
      aiBubble.classList.remove("typewriter-cursor");
    }
  });

  setupAdvisorVoiceInput();
}

function getAdvisorLanguageHint() {
  const selected = document.getElementById("advisor-language")?.value || "auto";
  if (selected !== "auto") return selected;
  return navigator.language?.startsWith("it") ? "it-IT" : "auto";
}

function setupAdvisorVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const button = document.getElementById("advisor-voice-btn");
  const input = document.getElementById("advisor-input");
  const status = document.getElementById("advisor-voice-status");
  const form = document.getElementById("advisor-form");
  if (!button || !input || !status || !form) return;

  if (!SpeechRecognition) {
    button.disabled = true;
    button.classList.add("opacity-50", "cursor-not-allowed");
    button.title = "Voice input is not supported in this browser.";
    status.textContent = "Voice input is not supported in this browser.";
    status.classList.remove("hidden");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;

  let listening = false;
  let finalTranscript = "";

  button.addEventListener("click", () => {
    if (listening) {
      recognition.stop();
      return;
    }

    finalTranscript = "";
    recognition.lang = getAdvisorLanguageHint() === "auto" ? "en-US" : getAdvisorLanguageHint();
    status.textContent = recognition.lang.startsWith("it")
      ? "Sto ascoltando... parla con Don Salvatore."
      : "Listening... speak your advisor question.";
    status.classList.remove("hidden");
    button.classList.add("listening");
    recognition.start();
  });

  recognition.addEventListener("start", () => {
    listening = true;
  });

  recognition.addEventListener("result", (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalTranscript += transcript;
      else interim += transcript;
    }
    input.value = `${finalTranscript}${interim}`.trim();
  });

  recognition.addEventListener("end", () => {
    listening = false;
    button.classList.remove("listening");
    const message = input.value.trim();
    if (message) {
      status.textContent = getAdvisorLanguageHint().startsWith("it")
        ? "Voce catturata. Chiedo a Don Salvatore..."
        : "Voice captured. Asking Don Salvatore...";
      form.requestSubmit();
    } else {
      status.textContent = getAdvisorLanguageHint().startsWith("it")
        ? "Nessuna voce rilevata. Tocca il microfono e riprova."
        : "No voice detected. Tap the mic and try again.";
    }
  });

  recognition.addEventListener("error", (event) => {
    listening = false;
    button.classList.remove("listening");
    status.textContent = event.error === "not-allowed"
      ? "Microphone permission was blocked. Allow mic access to speak with the advisor."
      : `Voice input stopped: ${event.error}`;
    status.classList.remove("hidden");
  });
}

function routeAdvisorToAgent(agent) {
  const labels = {
    don: "👑 Routing to Don Salvatore (coordinator)",
    matteo: "🧮 Routing to Matteo (yield math)",
    sofia: "🛡️ Routing to Sofia DOP (compliance)",
    seal: "🏅 Routing Golden Seal decision",
    contract: "📄 Routing contract package",
  };
  document.querySelectorAll(".advisor-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.agent === agent);
  });
  logToConsole(labels[agent] || "Routing advisor query");
}

async function streamAdvisor(message, crop, bubble) {
  try {
    const res = await apiFetch("/api/advisor", {
      method: "POST",
      body: JSON.stringify({ message, crop, language: getAdvisorLanguageHint(), stream: true, recentTrades: getRecentTradesForAdvisor(5) }),
    });
    if (!res.ok || !res.body || !res.headers.get("content-type")?.includes("event-stream")) return false;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = JSON.parse(line.slice(6));
        if (payload.token) {
          full += payload.token;
          renderChatMarkdown(bubble, full);
        }
      }
    }
    return full.length > 0;
  } catch {
    return false;
  }
}

function renderChatMarkdown(el, text) {
  el.innerHTML = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, "<code class='text-emerald-400'>$1</code>");
  const box = document.getElementById("advisor-messages");
  box.scrollTop = box.scrollHeight;
}

function appendChat(role, text) {
  const box = document.getElementById("advisor-messages");
  const div = document.createElement("div");
  div.className = `text-xs p-3 rounded-xl mb-2 animate-fade-in ${role === "user" ? "chat-bubble-user text-emerald-100" : "chat-bubble-ai text-indigo-100"}`;
  if (text) renderChatMarkdown(div, role === "ai" ? text : escapeHtml(text));
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

window.addEventListener("DOMContentLoaded", initApp);

// Demo mode auto-run
if (new URLSearchParams(location.search).get("autoplay") === "1") {
  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(async () => {
      document.getElementById("crop").value = "Olive Oil";
      document.getElementById("qty").value = "15";
      document.getElementById("organic").checked = true;
      await runDemoVisionScan("Olive Oil");
      optimizeChain();
    }, 2000);
  });
}
