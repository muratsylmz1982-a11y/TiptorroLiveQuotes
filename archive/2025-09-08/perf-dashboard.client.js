
// perf-dashboard.client.js (v2)
// Enhancements:
// - Always log first sample ("init"), then dedupe (>=1 MiB or >=15s) for subsequent updates
// - Log also when updateDashboardData() is called from any source (push/pull/init)
// - Keep 500 lines max, add optional RSS tooltip
(function () {
  const LOG_MIN_DELTA_MIB = 1;
  const LOG_MIN_INTERVAL_MS = 15000;
  const LOG_MAX_LINES = 500;

  let lastSample = null;
  let lastLogAt = 0;
  let lastLoggedHeap = null;
  let didLogInitial = false;

  const $ = (id) => document.getElementById(id);
  const round1 = (n) => Math.round(n * 10) / 10;
  const fmtMB = (n) => (isFinite(n) ? `${Math.round(n)}MB` : "-");
  const toMiB = (val) => {
    if (val == null) return NaN;
    if (typeof val === "number") return val;
    const m = String(val).match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : NaN;
  };
  const hhmmss = (d) => {
    const pad = (x) => String(x).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  function addLog(line) {
    const box = $("perfLogs");
    if (!box) return;
    const ts = hhmmss(new Date());
    const newLine = `[${ts}] ${line}\n`;
    box.textContent = newLine + box.textContent;
    const lines = box.textContent.split("\n");
    if (lines.length > LOG_MAX_LINES) {
      box.textContent = lines.slice(0, LOG_MAX_LINES).join("\n");
    }
  }

  function shouldLog(sample) {
    const now = Date.now();
    const heapMiB = toMiB(sample?.currentMemory);
    const deltaOk =
      lastLoggedHeap == null || Math.abs(heapMiB - lastLoggedHeap) >= LOG_MIN_DELTA_MIB;
    const intervalOk = now - lastLogAt >= LOG_MIN_INTERVAL_MS;
    return deltaOk || intervalOk;
  }

  function logUpdate(kind, sample) {
    if (!didLogInitial || shouldLog(sample)) {
      addLog(`Metriken aktualisiert${kind ? " (" + kind + ")" : ""}`);
      lastLogAt = Date.now();
      lastLoggedHeap = toMiB(sample?.currentMemory);
      didLogInitial = true;
    }
  }

  function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  function setStatus(status) {
    // Fallback-friendly: write into any of these IDs if present
    const label =
      status === "critical" ? "Kritisch" : status === "warning" ? "Warnung" : "Gesund";
    const ids = ["systemStatusText", "systemStatusValue", "systemStatus"];
    ids.forEach((id) => {
      const el = $(id);
      if (el) el.textContent = label;
    });
    const small = $("systemStatusTime");
    if (small) small.textContent = `Zuletzt: ${hhmmss(new Date())}`;
  }

  function updateTooltip(sample) {
    const rssInfo = $("rssInfo");
    if (!rssInfo) return;
    const heapMiB = toMiB(sample?.currentMemory);
    const rssMiB = toMiB(sample?.rssMemory);
    if (isFinite(rssMiB)) {
      rssInfo.title = `Prozess-RAM (RSS): ${fmtMB(rssMiB)} · Heap: ${fmtMB(heapMiB)}`;
    } else {
      rssInfo.title = `Heap: ${fmtMB(heapMiB)}`;
    }
  }

  function updateDashboardData(sample, sourceLabel) {
    const heapMiB = toMiB(sample?.currentMemory);
    const avgMiB = toMiB(sample?.averageMemory);
    const peakMiB = toMiB(sample?.peakMemory);

    setText("uptime", sample?.uptime ?? "-");
    setText("currentMemory", fmtMB(heapMiB));
    setText("averageMemory", fmtMB(avgMiB));
    setText("peakMemory", fmtMB(peakMiB));
    setStatus(sample?.status || "healthy");
    setText("lastUpdated", hhmmss(new Date()));

    updateTooltip(sample);
    lastSample = sample;

    // Always consider logging on updates
    logUpdate(sourceLabel || "", sample);
  }

  function wireButtons() {
    const r = $("refreshBtn");
    if (r) r.addEventListener("click", async () => {
      try {
        addLog("Dashboard-Aktualisierung angefordert");
        const s = await window.electronAPI?.getPerformanceData?.();
        if (s) {
          updateDashboardData(s, "pull");
        } else {
          addLog("WARN: keine Daten");
        }
      } catch (e) {
        addLog("ERROR: " + (e.message || e));
      }
    });

    const clr = $("clearLogsBtn");
    if (clr) clr.addEventListener("click", () => {
      const box = $("perfLogs");
      if (box) box.textContent = "";
    });
  }

  function subscribePush() {
    if (!window.electronAPI?.onDashboardUpdate) return;
    window.electronAPI.onDashboardUpdate((s) => {
      if (!s) return;
      updateDashboardData(s, "push");
    });
  }

  window.addEventListener("DOMContentLoaded", async () => {
    wireButtons();
    subscribePush();

    // initial pull
    try {
      const s = await window.electronAPI?.getPerformanceData?.();
      if (s) {
        updateDashboardData(s, "init");
        addLog("Dashboard wurde geladen.");
      } else {
        addLog("WARN: keine Daten beim Initialabruf");
      }
    } catch (e) {
      addLog("ERROR: " + (e.message || e));
    }
  });
})();
