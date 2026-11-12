// ============================================================================
// ROOT ACCESS: THE IDLE ADMIN - CORE ENGINE, DIDACTICS & UI CONTROLLER
// ============================================================================

(function () {
  const SAVE_KEY = "root_access_save_v1";

  // Default Game State
  function createDefaultState() {
    return {
      adminName: "root_operator",
      resources: {
        traffic: 25,
        compute: 15,
        storage: 10
      },
      lifetimeCompute: 15,
      hardwareCounts: {
        thinkpad: 1,
        switch_managed: 0,
        rpi_cluster: 0,
        nas_raid: 0,
        bare_metal: 0,
        firewall_appliance: 0,
        blade_chassis: 0,
        nvme_san: 0,
        cdn_edge: 0,
        cloud_pod: 0
      },
      unlockedTechs: [],
      activeDaemons: [],
      multipliers: {
        subnetTrafficBoostUntil: 0, // 2x Traffic booster timestamp
        subnetPacketLossUntil: 0,   // -20% Traffic penalty timestamp on wrong subnet
        sqlStorageBonus: 0,         // Permanent storage cap & rate bonus from SQL tuning
        daemonClickRate: 0,         // Extra clicks/sec from compiled cronjobs
        daemonProdBonus: 0          // Extra all-resource bonus from cronjobs
      },
      dda: {
        level: 1,       // 1 = Junior, 2 = Mid-Level, 3 = Senior/VLSM
        streak: 0,
        mistakes: 0
      },
      spacedRepetition: {}, // challengeId -> { timesSolved, lastSeen, box }
      stats: {
        totalClicks: 0,
        totalSolved: 0,
        subnetSolved: 0,
        cliSolved: 0,
        scriptSolved: 0,
        sqlSolved: 0
      },
      daily: {
        lastCheckInDate: null,
        checkInStreak: 0,
        dailyIncidentsSolved: 0,
        dailyDate: null
      },
      activeIncident: null, // Triggered ticket barrier
      nextIncidentAtCompute: 180,
      soundEnabled: true,
      lastSavedAt: Date.now()
    };
  }

  let state = loadState();
  let currentModule = "subnet"; // 'subnet' | 'cli' | 'script' | 'sql'
  let activeChallenges = {
    subnet: null,
    cli: null,
    script: null,
    sql: null
  };
  let sqlSelectedTokens = [];
  let sqlBankTokens = [];
  let currentCertPreview = null;

  // --------------------------------------------------------------------------
  // WEB AUDIO SYNTHESIZER (Retro Terminal Beeps)
  // --------------------------------------------------------------------------
  let audioCtx = null;
  function playTone(freq, durationMs, type = "sine", vol = 0.06) {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
      }
      if (!audioCtx) return;
      if (audioCtx.state === "suspended") audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + durationMs / 1000);
    } catch (e) {
      // Ignore audio errors on restricted autoplay
    }
  }

  function sfxClick() { playTone(580, 45, "triangle", 0.04); }
  function sfxBuy() {
    playTone(440, 70, "sine", 0.06);
    setTimeout(() => playTone(660, 90, "sine", 0.06), 60);
  }
  function sfxSuccess() {
    playTone(523.25, 80, "triangle", 0.08);
    setTimeout(() => playTone(659.25, 80, "triangle", 0.08), 80);
    setTimeout(() => playTone(783.99, 130, "triangle", 0.08), 160);
    setTimeout(() => playTone(1046.5, 220, "triangle", 0.09), 250);
  }
  function sfxError() {
    playTone(220, 140, "sawtooth", 0.06);
    setTimeout(() => playTone(165, 200, "sawtooth", 0.06), 130);
  }

  // --------------------------------------------------------------------------
  // SAVE / LOAD & OFFLINE PROGRESS
  // --------------------------------------------------------------------------
  function saveState() {
    state.lastSavedAt = Date.now();
    try {
      const serialized = btoa(encodeURIComponent(JSON.stringify(state)));
      localStorage.setItem(SAVE_KEY, serialized);
    } catch (e) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    }
  }

  function loadState() {
    const def = createDefaultState();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return def;
      let parsed;
      try {
        parsed = JSON.parse(decodeURIComponent(atob(raw)));
      } catch (_) {
        parsed = JSON.parse(raw);
      }
      return Object.assign({}, def, parsed, {
        resources: Object.assign({}, def.resources, parsed.resources),
        hardwareCounts: Object.assign({}, def.hardwareCounts, parsed.hardwareCounts),
        multipliers: Object.assign({}, def.multipliers, parsed.multipliers),
        dda: Object.assign({}, def.dda, parsed.dda),
        stats: Object.assign({}, def.stats, parsed.stats),
        daily: Object.assign({}, def.daily, parsed.daily)
      });
    } catch (e) {
      return def;
    }
  }

  // --------------------------------------------------------------------------
  // PRODUCTION & RESOURCE MATH
  // --------------------------------------------------------------------------
  function getRates() {
    let baseTraffic = 1;
    let baseCompute = 1;
    let baseStorage = 0.5;
    let baseStorageCap = 500;

    window.GAME_DATA.hardware.forEach((hw) => {
      const count = state.hardwareCounts[hw.id] || 0;
      if (count > 0) {
        baseTraffic += hw.prod.traffic * count;
        baseCompute += hw.prod.compute * count;
        baseStorage += hw.prod.storage * count;
        baseStorageCap += hw.storageCapBonus * count;
      }
    });

    let trafficMult = 1 + (state.multipliers.daemonProdBonus || 0);
    let computeMult = 1 + (state.multipliers.daemonProdBonus || 0);
    let storageMult = 1 + (state.multipliers.daemonProdBonus || 0) + (state.multipliers.sqlStorageBonus || 0);
    let storageCapMult = 1 + (state.multipliers.sqlStorageBonus || 0);
    let autoClickPerSec = state.multipliers.daemonClickRate || 0;
    let bountyMult = 1;

    window.GAME_DATA.techTree.forEach((tech) => {
      if (state.unlockedTechs.includes(tech.id)) {
        if (tech.bonus.trafficMult) trafficMult += tech.bonus.trafficMult;
        if (tech.bonus.computeMult) computeMult += tech.bonus.computeMult;
        if (tech.bonus.storageMult) storageMult += tech.bonus.storageMult;
        if (tech.bonus.storageCapMult) storageCapMult += tech.bonus.storageCapMult;
        if (tech.bonus.autoClickPerSec) autoClickPerSec += tech.bonus.autoClickPerSec;
        if (tech.bonus.bountyMult) bountyMult += tech.bonus.bountyMult;
      }
    });

    const now = Date.now();
    // Subnetting 2x Bandwidth Booster
    if (state.multipliers.subnetTrafficBoostUntil > now) {
      trafficMult *= 2.0;
    }
    // Subnetting -20% Packet Loss Penalty
    if (state.multipliers.subnetPacketLossUntil > now) {
      trafficMult *= 0.8;
    }
    // Active unresolved Incident bottleneck (-15% on rates until resolved)
    if (state.activeIncident) {
      trafficMult *= 0.85;
      computeMult *= 0.85;
    }

    return {
      trafficRate: baseTraffic * trafficMult,
      computeRate: baseCompute * computeMult,
      storageRate: baseStorage * storageMult,
      storageCap: Math.floor(baseStorageCap * storageCapMult),
      autoClickPerSec,
      bountyMult
    };
  }

  function getClickPower() {
    const rates = getRates();
    return {
      traffic: Math.max(2, rates.trafficRate * 0.35),
      compute: Math.max(3, rates.computeRate * 0.4),
      storage: Math.max(1, rates.storageRate * 0.3)
    };
  }

  function getHardwareCost(hw) {
    const count = state.hardwareCounts[hw.id] || 0;
    const factor = Math.pow(hw.costScale, count);
    return {
      traffic: Math.floor(hw.baseCost.traffic * factor),
      compute: Math.floor(hw.baseCost.compute * factor),
      storage: Math.floor(hw.baseCost.storage * factor)
    };
  }

  function canAfford(cost) {
    return (
      state.resources.traffic >= cost.traffic &&
      state.resources.compute >= cost.compute &&
      state.resources.storage >= cost.storage
    );
  }

  function addResources(deltaTraffic, deltaCompute, deltaStorage) {
    const rates = getRates();
    state.resources.traffic += deltaTraffic;
    state.resources.compute += deltaCompute;
    state.lifetimeCompute += Math.max(0, deltaCompute);
    state.resources.storage = Math.min(
      rates.storageCap,
      state.resources.storage + deltaStorage
    );
  }

  function formatNum(n) {
    if (n === null || n === undefined || isNaN(n)) return "0";
    if (n < 1000) return n % 1 === 0 ? n.toString() : n.toFixed(1);
    const units = ["K", "M", "G", "T", "P"];
    let unitIndex = -1;
    let val = n;
    while (val >= 1000 && unitIndex < units.length - 1) {
      val /= 1000;
      unitIndex++;
    }
    return val.toFixed(2) + " " + units[unitIndex];
  }

  // --------------------------------------------------------------------------
  // OFFLINE PROGRESS CHECK (Max 8 hours cap)
  // --------------------------------------------------------------------------
  function processOfflineProgress(simulatedSeconds = null) {
    const now = Date.now();
    const elapsedSec = simulatedSeconds !== null
      ? simulatedSeconds
      : Math.floor((now - (state.lastSavedAt || now)) / 1000);

    if (elapsedSec < 15 && simulatedSeconds === null) return;

    const cappedSec = Math.min(elapsedSec, 8 * 3600); // 8h offline cap
    const rates = getRates();
    const offlineFactor = 0.65; // 65% efficiency while offline
    const earnedTraffic = rates.trafficRate * cappedSec * offlineFactor;
    const earnedCompute = rates.computeRate * cappedSec * offlineFactor;
    const earnedStorage = Math.min(
      rates.storageCap - state.resources.storage,
      rates.storageRate * cappedSec * offlineFactor
    );

    addResources(earnedTraffic, earnedCompute, Math.max(0, earnedStorage));
    saveState();

    showModal(
      "OFFLINE-TELEMETRIE BERICHT",
      `<div class="scenario-box">
        Deine Daemons und Server-Racks liefen für <strong>${ formatDuration(cappedSec) }</strong> im Hintergrund weiter (65% Offline-Effizienz).
      </div>
      <div class="subnet-calc-grid">
        <div class="stat-tile">
          <div class="stat-tile-label">Erwirtschafteter Traffic</div>
          <div class="stat-tile-val">+${ formatNum(earnedTraffic) } pkt</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-label">Erwirtschaftete Compute-Zyklen</div>
          <div class="stat-tile-val" style="color:var(--matrix-green)">+${ formatNum(earnedCompute) } ops</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-label">Geschriebener Storage</div>
          <div class="stat-tile-val" style="color:var(--neon-purple)">+${ formatNum(Math.max(0, earnedStorage)) } MB</div>
        </div>
      </div>`
    );
  }

  function formatDuration(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  // --------------------------------------------------------------------------
  // DIDACTIC ENGINE: SPACED REPETITION & DYNAMIC DIFFICULTY (DDA)
  // --------------------------------------------------------------------------
  function recordAttempt(challengeId, success, domainKey) {
    if (!state.spacedRepetition[challengeId]) {
      state.spacedRepetition[challengeId] = { timesSolved: 0, lastSeen: 0, box: 1 };
    }
    const sr = state.spacedRepetition[challengeId];
    sr.lastSeen = Date.now();

    if (success) {
      sr.timesSolved += 1;
      sr.box = Math.min(5, sr.box + 1);
      state.dda.streak += 1;
      if (state.dda.streak >= 3 && state.dda.level < 3) {
        state.dda.level += 1;
        state.dda.streak = 0;
      }
      state.stats.totalSolved += 1;
      if (domainKey === "subnet") state.stats.subnetSolved += 1;
      if (domainKey === "cli") state.stats.cliSolved += 1;
      if (domainKey === "script") state.stats.scriptSolved += 1;
      if (domainKey === "sql") state.stats.sqlSolved += 1;

      // Daily incident tracker
      const today = new Date().toISOString().slice(0, 10);
      if (state.daily.dailyDate !== today) {
        state.daily.dailyDate = today;
        state.daily.dailyIncidentsSolved = 0;
      }
      if (state.daily.dailyIncidentsSolved < 3) {
        state.daily.dailyIncidentsSolved += 1;
      }

      // Resolve active incident barrier if present
      if (state.activeIncident && state.activeIncident.module === domainKey) {
        state.activeIncident = null;
      }
    } else {
      sr.box = 1; // Reset to Box 1 for Spaced Repetition review
      state.dda.streak = 0;
      state.dda.mistakes += 1;
      if (state.dda.mistakes >= 2 && state.dda.level > 1) {
        state.dda.level -= 1;
        state.dda.mistakes = 0;
      }
    }
    saveState();
  }

  function pickChallengeWithSpacedRepetition(pool, currentId = null) {
    // Filter pool by DDA difficulty (allow up to dda.level, or all if pool small)
    let eligible = pool.filter((item) => item.difficulty <= state.dda.level && item.id !== currentId);
    if (eligible.length === 0) eligible = pool.filter((item) => item.id !== currentId);
    if (eligible.length === 0) eligible = pool;

    // Prioritize items with lower Leitner box or older lastSeen timestamp
    const scored = eligible.map((item) => {
      const sr = state.spacedRepetition[item.id] || { timesSolved: 0, lastSeen: 0, box: 1 };
      const ageScore = (Date.now() - sr.lastSeen) / 10000;
      const boxWeight = (6 - sr.box) * 50;
      return { item, score: boxWeight + Math.min(ageScore, 200) + Math.random() * 40 };
    });
    scored.sort((a, b) => b.score - a.score);
    const chosen = JSON.parse(JSON.stringify(scored[0].item));

    // Spaced Repetition variation: if already solved before, vary subnet IP octets or host counts slightly
    const srInfo = state.spacedRepetition[chosen.id];
    if (srInfo && srInfo.timesSolved > 0 && chosen.baseIp && chosen.minHosts) {
      const thirdOctet = Math.floor(Math.random() * 200) + 10;
      const parts = chosen.baseIp.split(".");
      parts[2] = thirdOctet.toString();
      chosen.baseIp = parts.join(".");
      chosen.scenario = chosen.scenario.replace(/\d+\.\d+\.\d+\.\d+/, chosen.baseIp);
      chosen.isSpacedReview = true;
    }
    return chosen;
  }

  function grantBugBounty(difficulty = 1) {
    const rates = getRates();
    const secondsWorth = (18 + difficulty * 10) * rates.bountyMult;
    const rewardTraffic = Math.max(40, Math.floor(rates.trafficRate * secondsWorth));
    const rewardCompute = Math.max(40, Math.floor(rates.computeRate * secondsWorth));
    const rewardStorage = Math.max(25, Math.floor(rates.storageRate * secondsWorth));
    addResources(rewardTraffic, rewardCompute, rewardStorage);
    return { rewardTraffic, rewardCompute, rewardStorage };
  }

  // --------------------------------------------------------------------------
  // MODULE 1: SUBNETTING CALCULATOR & PUZZLE ENGINE
  // --------------------------------------------------------------------------
  function prefixToMask(prefix) {
    const mask = [];
    for (let i = 0; i < 4; i++) {
      const bits = Math.min(8, Math.max(0, prefix - i * 8));
      mask.push(bits === 0 ? 0 : 256 - Math.pow(2, 8 - bits));
    }
    return mask.join(".");
  }

  function prefixToBinaryHtml(prefix) {
    let html = "";
    for (let i = 0; i < 32; i++) {
      if (i > 0 && i % 8 === 0) html += ".";
      if (i < prefix) {
        html += `<span class="bit-net">1</span>`;
      } else {
        html += `<span class="bit-host">0</span>`;
      }
    }
    return html;
  }

  function loadSubnetChallenge() {
    const prevId = activeChallenges.subnet ? activeChallenges.subnet.id : null;
    activeChallenges.subnet = pickChallengeWithSpacedRepetition(window.GAME_DATA.subnetChallenges, prevId);
    renderChallengeWorkspace();
  }

  function verifySubnetAnswer(selectedPrefix) {
    const ch = activeChallenges.subnet;
    if (!ch || ch.solved) return;
    const fb = document.getElementById("challenge-feedback");
    const isCorrect = ch.acceptablePrefixes.includes(selectedPrefix);

    if (isCorrect) {
      ch.solved = true;
      sfxSuccess();
      recordAttempt(ch.id, true, "subnet");
      state.multipliers.subnetTrafficBoostUntil = Date.now() + 90 * 1000; // 90s 2x Traffic
      state.multipliers.subnetPacketLossUntil = 0;
      const bounty = grantBugBounty(ch.difficulty);

      const submitBtn = document.getElementById("btn-submit-subnet");
      const slider = document.getElementById("cidr-range-input");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "✓ BEREITS DEPLOYED";
      }
      if (slider) slider.disabled = true;

      fb.className = "feedback-box success";
      fb.innerHTML = `<strong>[SUBNET VERIFIED // 2x TRAFFIC BOOSTER AKTIV FÜR 90s]</strong><br>
        ${ch.explanation}<br>
        <strong>Bug Bounty:</strong> +${formatNum(bounty.rewardTraffic)} pkt | +${formatNum(bounty.rewardCompute)} ops | +${formatNum(bounty.rewardStorage)} MB
        <div style="margin-top:10px;">
          <button class="btn btn-primary" onclick="window.RootApp.nextChallenge('subnet')">➔ Nächste Subnetting-Aufgabe starten</button>
        </div>`;
    } else {
      sfxError();
      recordAttempt(ch.id, false, "subnet");
      state.multipliers.subnetPacketLossUntil = Date.now() + 30 * 1000; // 30s -20% packet loss
      const usable = Math.pow(2, 32 - selectedPrefix) - 2;
      const reason = usable < ch.minHosts
        ? `Zu klein! /${selectedPrefix} bietet nur ${usable} nutzbare Hosts (benötigt: ${ch.minHosts}).`
        : `Zu groß! /${selectedPrefix} bietet ${usable} Hosts und verschwendet IP-Adressraum.`;
      fb.className = "feedback-box error";
      fb.innerHTML = `<strong>[PACKET LOSS WARNUNG (-20% Traffic für 30s)]</strong><br>
        ${reason}<br>
        <em>Tipp: ${ch.explanation}</em>
        <div style="margin-top:8px;">
          <button class="btn btn-cyan" onclick="window.RootApp.openCheatSheet('cs_subnet')">Subnetting Cheat-Sheet öffnen</button>
        </div>`;
    }
    updateHeaderUI();
    renderModuleSidebar();
  }

  // --------------------------------------------------------------------------
  // MODULE 2: LINUX CLI EMERGENCY TERMINAL
  // --------------------------------------------------------------------------
  function loadCliChallenge() {
    const prevId = activeChallenges.cli ? activeChallenges.cli.id : null;
    activeChallenges.cli = pickChallengeWithSpacedRepetition(window.GAME_DATA.cliChallenges, prevId);
    renderChallengeWorkspace();
  }

  function executeCliCommand(rawCmd) {
    const cmd = rawCmd.trim();
    if (!cmd) return;
    const ch = activeChallenges.cli;
    if (!ch || ch.solved) return;
    const outBox = document.getElementById("cli-output-log");
    const fb = document.getElementById("challenge-feedback");

    const appendLine = (text, cls = "term-line-info") => {
      if (!outBox) return;
      const div = document.createElement("div");
      div.className = cls;
      div.textContent = text;
      outBox.appendChild(div);
      outBox.scrollTop = outBox.scrollHeight;
    };

    appendLine(`root@prod-srv-01:~# ${cmd}`, "term-line-cmd");

    const normalized = cmd.replace(/\s+/g, " ").toLowerCase();

    // Check if command solves the active incident
    const isSolution = ch.acceptedCommands.some((acc) => acc.toLowerCase() === normalized);
    if (isSolution) {
      ch.solved = true;
      sfxSuccess();
      appendLine(ch.successOutput, "term-line-ok");
      recordAttempt(ch.id, true, "cli");
      const bounty = grantBugBounty(ch.difficulty);

      const cliInput = document.getElementById("cli-cmd-input");
      const cliBtn = document.getElementById("btn-submit-cli");
      if (cliInput) cliInput.disabled = true;
      if (cliBtn) {
        cliBtn.disabled = true;
        cliBtn.textContent = "✓ GELÖST";
      }

      if (fb) {
        fb.className = "feedback-box success";
        fb.innerHTML = `<strong>[INCIDENT RESOLVED // ROOT ACCESS GRANTED]</strong><br>
          ${ch.explanation}<br>
          <strong>Bug Bounty:</strong> +${formatNum(bounty.rewardTraffic)} pkt | +${formatNum(bounty.rewardCompute)} ops | +${formatNum(bounty.rewardStorage)} MB
          <div style="margin-top:10px;">
            <button class="btn btn-primary" onclick="window.RootApp.nextChallenge('cli')">➔ Nächsten CLI-Incident laden</button>
          </div>`;
      }
      updateHeaderUI();
      renderModuleSidebar();
      return;
    }

    // Helpful built-in diagnostic shell commands
    if (normalized === "help") {
      appendLine("Verfügbare Diagnose- & Admin-Befehle: ls -la, df -h, ps aux, top, cat config.conf, chmod, kill -9, rm, systemctl, ufw", "term-line-info");
    } else if (normalized === "clear") {
      outBox.innerHTML = "";
    } else if (normalized === "whoami") {
      appendLine("root (UID 0 / GID 0)", "term-line-info");
    } else if (normalized.startsWith("ls")) {
      appendLine("drwxr-xr-x 4 root root 4096 Nov 12 12:00 .", "term-line-info");
      appendLine("---------- 1 root root 1042 Nov 12 11:58 config.conf", "term-line-info");
      appendLine("-rw-r--r-- 1 root root 1679 Nov 12 10:15 id_rsa", "term-line-info");
    } else if (normalized === "df -h" || normalized === "df") {
      appendLine("Filesystem      Size  Used Avail Use% Mounted on", "term-line-info");
      appendLine("/dev/sda1        50G   50G    0B 100% / (kritisch: /var/log/syslog.old = 48G)", "term-line-err");
    } else if (normalized === "ps aux" || normalized === "top" || normalized === "ps") {
      appendLine("PID   USER     %CPU %MEM COMMAND", "term-line-info");
      appendLine("4096  www-data 99.8 42.1 /tmp/crypto_miner_rogue --threads=64", "term-line-err");
      appendLine("1102  root      0.4  1.2 /usr/sbin/sshd -D", "term-line-info");
    } else if (normalized === "ufw status") {
      appendLine("Status: active | 22/tcp ALLOW | 80/tcp ALLOW | 443/tcp BLOCKED", "term-line-err");
    } else {
      sfxError();
      recordAttempt(ch.id, false, "cli");
      appendLine(`bash: Befehl '${cmd}' hat das Problem noch nicht behoben. Prüfe die Auto-Complete Vorschläge unter dem Terminal!`, "term-line-err");
      if (fb) {
        fb.className = "feedback-box error";
        fb.innerHTML = `<strong>[COMMAND INCOMPLETE]</strong> Noch nicht der gesuchte Fix. Tipp: ${ch.promptContext}
          <div style="margin-top:8px;">
            <button class="btn btn-cyan" onclick="window.RootApp.openCheatSheet('cs_linux')">Linux Cheat-Sheet öffnen</button>
          </div>`;
      }
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 3: CRONJOB & SCRIPTING ENGINE
  // --------------------------------------------------------------------------
  function loadScriptChallenge() {
    const prevId = activeChallenges.script ? activeChallenges.script.id : null;
    activeChallenges.script = pickChallengeWithSpacedRepetition(window.GAME_DATA.scriptChallenges, prevId);
    renderChallengeWorkspace();
  }

  function verifyScriptChallenge() {
    const ch = activeChallenges.script;
    if (!ch || ch.solved) return;
    const fb = document.getElementById("challenge-feedback");
    let allCorrect = true;

    ch.blanks.forEach((b) => {
      const sel = document.getElementById(`script-blank-${b.index}`);
      if (!sel || sel.value !== b.correct) {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      ch.solved = true;
      sfxSuccess();
      recordAttempt(ch.id, true, "script");
      if (!state.activeDaemons.includes(ch.daemonReward)) {
        state.activeDaemons.push(ch.daemonReward);
        state.multipliers.daemonClickRate = (state.multipliers.daemonClickRate || 0) + 1.5;
        state.multipliers.daemonProdBonus = (state.multipliers.daemonProdBonus || 0) + 0.15;
      }
      const bounty = grantBugBounty(ch.difficulty);

      const scriptBtn = document.getElementById("btn-submit-script");
      if (scriptBtn) {
        scriptBtn.disabled = true;
        scriptBtn.textContent = "✓ CRONJOB AKTIV";
      }
      ch.blanks.forEach((b) => {
        const sel = document.getElementById(`script-blank-${b.index}`);
        if (sel) sel.disabled = true;
      });

      fb.className = "feedback-box success";
      fb.innerHTML = `<strong>[CRONJOB COMPILED & DEPLOYED: ${ch.daemonReward}]</strong><br>
        ${ch.explanation}<br>
        <strong>Bug Bounty:</strong> +${formatNum(bounty.rewardTraffic)} pkt | +${formatNum(bounty.rewardCompute)} ops | +${formatNum(bounty.rewardStorage)} MB
        <div style="margin-top:10px;">
          <button class="btn btn-primary" onclick="window.RootApp.nextChallenge('script')">➔ Nächstes Skript starten</button>
        </div>`;
      renderServerRoom();
      updateHeaderUI();
      renderModuleSidebar();
    } else {
      sfxError();
      recordAttempt(ch.id, false, "script");
      fb.className = "feedback-box error";
      fb.innerHTML = `<strong>[SYNTAX / LOGIC ERROR IN CRONJOB]</strong><br>
        Mindestens ein Baustein im Skript ist noch nicht korrekt. ${ch.explanation}
        <div style="margin-top:8px;">
          <button class="btn btn-cyan" onclick="window.RootApp.openCheatSheet('cs_scripting')">Scripting Cheat-Sheet öffnen</button>
        </div>`;
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 4: SQL QUERY PERFORMANCE TUNER
  // --------------------------------------------------------------------------
  function loadSqlChallenge() {
    const prevId = activeChallenges.sql ? activeChallenges.sql.id : null;
    const ch = pickChallengeWithSpacedRepetition(window.GAME_DATA.sqlChallenges, prevId);
    activeChallenges.sql = ch;
    sqlSelectedTokens = [];
    const combined = [...ch.targetTokens, ...ch.distractorTokens];
    // Shuffle tokens
    sqlBankTokens = combined
      .map((t, idx) => ({ id: idx, text: t, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort);
    renderChallengeWorkspace();
  }

  function verifySqlChallenge() {
    const ch = activeChallenges.sql;
    if (!ch || ch.solved) return;
    const fb = document.getElementById("challenge-feedback");
    const builtQuery = sqlSelectedTokens.map((t) => t.text).join(" ");
    const targetQuery = ch.targetTokens.join(" ");

    if (builtQuery === targetQuery) {
      ch.solved = true;
      sfxSuccess();
      recordAttempt(ch.id, true, "sql");
      state.multipliers.sqlStorageBonus = (state.multipliers.sqlStorageBonus || 0) + 0.25;
      const bounty = grantBugBounty(ch.difficulty);
      const latEl = document.getElementById("sql-latency-val");
      if (latEl) {
        latEl.textContent = `${ch.afterLatencyMs} ms (OPTIMIZED INDEX SEEK)`;
        latEl.style.color = "var(--matrix-green)";
      }
      const sqlBtn = document.getElementById("btn-submit-sql");
      if (sqlBtn) {
        sqlBtn.disabled = true;
        sqlBtn.textContent = "✓ QUERY OPTIMIERT";
      }
      fb.className = "feedback-box success";
      fb.innerHTML = `<strong>[QUERY OPTIMIZED: ${ch.beforeLatencyMs}ms -> ${ch.afterLatencyMs}ms | +25% STORAGE CAP & I/O]</strong><br>
        ${ch.explanation}<br>
        <strong>Bug Bounty:</strong> +${formatNum(bounty.rewardTraffic)} pkt | +${formatNum(bounty.rewardCompute)} ops | +${formatNum(bounty.rewardStorage)} MB
        <div style="margin-top:10px;">
          <button class="btn btn-primary" onclick="window.RootApp.nextChallenge('sql')">➔ Nächste SQL-Query starten</button>
        </div>`;
      updateHeaderUI();
      renderModuleSidebar();
    } else {
      sfxError();
      recordAttempt(ch.id, false, "sql");
      fb.className = "feedback-box error";
      fb.innerHTML = `<strong>[SLOW QUERY / SQL SYNTAX ERROR]</strong><br>
        Deine Abfrage: <code>${builtQuery || "(leer)"}</code><br>
        Tipp: ${ch.explanation}
        <div style="margin-top:8px;">
          <button class="btn btn-cyan" onclick="window.RootApp.openCheatSheet('cs_sql')">SQL Cheat-Sheet öffnen</button>
        </div>`;
    }
  }

  // --------------------------------------------------------------------------
  // UI RENDERING: SERVER ROOM, RACK VISUALIZER & SHOP
  // --------------------------------------------------------------------------
  function getCurrentStage() {
    let current = window.GAME_DATA.stages[0];
    window.GAME_DATA.stages.forEach((st) => {
      if (state.lifetimeCompute >= st.minTotalCompute) {
        current = st;
      }
    });
    return current;
  }

  function updateHeaderUI() {
    const rates = getRates();
    const stage = getCurrentStage();

    document.getElementById("stage-badge").textContent = stage.badge;
    document.getElementById("stage-name-sub").textContent = `Standort: ${stage.name} | DDA-Level: ${state.dda.level} (${state.dda.level === 1 ? "Junior" : state.dda.level === 2 ? "Mid-Level" : "Senior Architect"})`;

    document.getElementById("res-traffic-val").textContent = formatNum(state.resources.traffic) + " pkt";
    document.getElementById("res-traffic-rate").textContent = "+" + formatNum(rates.trafficRate) + " pkt/s";

    document.getElementById("res-compute-val").textContent = formatNum(state.resources.compute) + " ops";
    document.getElementById("res-compute-rate").textContent = "+" + formatNum(rates.computeRate) + " ops/s";

    document.getElementById("res-storage-val").textContent = `${formatNum(state.resources.storage)} / ${formatNum(rates.storageCap)} MB`;
    document.getElementById("res-storage-rate").textContent = "+" + formatNum(rates.storageRate) + " MB/s";

    const storagePct = Math.min(100, (state.resources.storage / rates.storageCap) * 100);
    document.getElementById("storage-bar").style.width = storagePct + "%";

    // Incident Banner
    const banner = document.getElementById("incident-banner");
    const tabTicketPill = document.getElementById("tab-ticket-pill");
    if (state.activeIncident) {
      banner.classList.remove("hidden");
      document.getElementById("incident-banner-msg").textContent = state.activeIncident.message;
      tabTicketPill.textContent = "1 INCIDENT!";
      tabTicketPill.classList.add("alert");
    } else {
      banner.classList.add("hidden");
      tabTicketPill.textContent = `${3 - (state.daily.dailyIncidentsSolved || 0)} Daily`;
      tabTicketPill.classList.remove("alert");
    }

    // Update sound button label
    const sndBtn = document.getElementById("btn-sound-toggle");
    if (sndBtn) {
      sndBtn.textContent = state.soundEnabled ? "🔊 SFX: AN" : "🔇 SFX: AUS";
    }

    // Update affordability states on hardware buttons without re-creating DOM
    window.GAME_DATA.hardware.forEach((hw) => {
      const btn = document.getElementById(`buy-hw-${hw.id}`);
      if (!btn) return;
      const cost = getHardwareCost(hw);
      btn.disabled = !canAfford(cost);
      const tSpan = document.getElementById(`cost-t-${hw.id}`);
      const cSpan = document.getElementById(`cost-c-${hw.id}`);
      const sSpan = document.getElementById(`cost-s-${hw.id}`);
      if (tSpan) tSpan.className = state.resources.traffic >= cost.traffic ? "cost-ok" : "cost-missing";
      if (cSpan) cSpan.className = state.resources.compute >= cost.compute ? "cost-ok" : "cost-missing";
      if (sSpan) sSpan.className = state.resources.storage >= cost.storage ? "cost-ok" : "cost-missing";
    });
  }

  function renderServerRoom() {
    const rackSlots = document.getElementById("rack-slots-container");
    const hwList = document.getElementById("hardware-shop-list");
    const daemonStrip = document.getElementById("daemon-strip");
    const rates = getRates();

    // Render visual rack blades
    let bladesHtml = "";
    let totalUnits = 0;
    window.GAME_DATA.hardware.forEach((hw) => {
      const count = state.hardwareCounts[hw.id] || 0;
      if (count > 0) {
        totalUnits += count;
        const catClass = hw.category.toLowerCase();
        let ledsHtml = "";
        for (let i = 0; i < hw.leds; i++) {
          const isIncident = state.activeIncident && i % 2 === 0;
          ledsHtml += `<span class="led-dot ${isIncident ? "incident" : ""}"></span>`;
        }
        bladesHtml += `
          <div class="rack-blade ${catClass}">
            <div class="blade-info">
              <span class="blade-tag">${hw.rackIcon} x${count}</span>
              <span class="blade-name">${hw.name}</span>
            </div>
            <div class="blade-telemetry">
              <div class="led-strip">${ledsHtml}</div>
              <div class="fan-unit" title="Cooling Fan Active">❋</div>
            </div>
          </div>`;
      }
    });

    if (rackSlots) {
      rackSlots.innerHTML = bladesHtml || `<div class="panel-subtitle">Noch keine Hardware im Rack installiert.</div>`;
    }
    const rackHeaderStat = document.getElementById("rack-header-stat");
    if (rackHeaderStat) {
      const boostActive = state.multipliers.subnetTrafficBoostUntil > Date.now();
      rackHeaderStat.textContent = `UNITS: ${totalUnits} | AUTO-DAEMON: ${rates.autoClickPerSec.toFixed(1)}/s ${boostActive ? "| ⚡ 2x VLAN BOOST" : ""}`;
    }

    // Active Daemons & Multipliers
    if (daemonStrip) {
      let chips = [];
      if (state.multipliers.subnetTrafficBoostUntil > Date.now()) {
        chips.push(`<span class="daemon-chip" style="border-color:var(--matrix-green);color:var(--matrix-green)">⚡ 2x Subnet-Bandwidth Booster aktiv</span>`);
      }
      if (state.multipliers.subnetPacketLossUntil > Date.now()) {
        chips.push(`<span class="daemon-chip" style="border-color:var(--crimson-alert);color:var(--crimson-alert)">⚠ -20% Packet Loss (Falsches Subnetz)</span>`);
      }
      if (state.multipliers.sqlStorageBonus > 0) {
        chips.push(`<span class="daemon-chip">🗄 SQL Index Tuning: +${Math.round(state.multipliers.sqlStorageBonus * 100)}% Storage</span>`);
      }
      state.activeDaemons.forEach((d) => {
        chips.push(`<span class="daemon-chip">⚙ ${d}</span>`);
      });
      daemonStrip.innerHTML = chips.length > 0
        ? chips.join("")
        : `<span class="panel-subtitle">Löse IT-Challenges im Tab "Terminal & Tickets", um Daemons & Ertrags-Booster freizuschalten!</span>`;
    }

    // Render Hardware Shop
    if (hwList) {
      hwList.innerHTML = window.GAME_DATA.hardware.map((hw) => {
        const count = state.hardwareCounts[hw.id] || 0;
        const cost = getHardwareCost(hw);
        const affordable = canAfford(cost);
        return `
          <div class="hw-item">
            <div class="hw-meta">
              <div class="hw-title-row">
                <span class="hw-name">${hw.name}</span>
                <span class="hw-count-badge">Besitz: ${count}</span>
              </div>
              <div class="hw-desc">${hw.desc}</div>
              <div class="hw-prod-row">
                <span style="color:var(--cyber-cyan)">+${hw.prod.traffic} pkt/s</span>
                <span style="color:var(--matrix-green)">+${hw.prod.compute} ops/s</span>
                <span style="color:var(--neon-purple)">+${hw.prod.storage} MB/s (Cap +${hw.storageCapBonus})</span>
              </div>
            </div>
            <button id="buy-hw-${hw.id}" class="btn hw-buy-btn" ${affordable ? "" : "disabled"} onclick="window.RootApp.buyHardware('${hw.id}')">
              <span>INSTALLIEREN</span>
              <div class="cost-line">
                <span id="cost-t-${hw.id}" class="${state.resources.traffic >= cost.traffic ? "cost-ok" : "cost-missing"}">${formatNum(cost.traffic)} pkt</span>
                <span id="cost-c-${hw.id}" class="${state.resources.compute >= cost.compute ? "cost-ok" : "cost-missing"}">${formatNum(cost.compute)} ops</span>
                <span id="cost-s-${hw.id}" class="${state.resources.storage >= cost.storage ? "cost-ok" : "cost-missing"}">${formatNum(cost.storage)} MB</span>
              </div>
            </button>
          </div>`;
      }).join("");
    }
  }

  // --------------------------------------------------------------------------
  // UI RENDERING: TAB 2 (IT CHALLENGES WORKSPACE)
  // --------------------------------------------------------------------------
  function renderModuleSidebar() {
    const modules = [
      {
        id: "subnet",
        title: "4.1 VLAN & Routing Manager",
        badge: `${state.stats.subnetSolved} gelöst`,
        desc: "IPv4 Subnetting, CIDR-Masken & Host-Berechnung (2x Traffic-Booster)."
      },
      {
        id: "cli",
        title: "4.2 CLI Emergency Panel",
        badge: `${state.stats.cliSolved} gelöst`,
        desc: "Linux-Shell Troubleshooting: chmod, kill, df, systemctl & ufw."
      },
      {
        id: "script",
        title: "4.3 Cronjob Engine",
        badge: `${state.stats.scriptSolved} gelöst`,
        desc: "Python & Bash Automatisierung für permanente Hintergrund-Daemons."
      },
      {
        id: "sql",
        title: "4.4 Query Performance Tuner",
        badge: `${state.stats.sqlSolved} gelöst`,
        desc: "SQL-Statements & B-Tree Indizes bauen (+25% Storage-Kapazität & I/O)."
      }
    ];

    const container = document.getElementById("module-selector-list");
    if (!container) return;
    container.innerHTML = modules.map((m) => `
      <div class="module-card ${currentModule === m.id ? "active" : ""}" onclick="window.RootApp.selectModule('${m.id}')">
        <div class="module-card-header">
          <span>${m.title}</span>
          <span class="tab-pill">${m.badge}</span>
        </div>
        <div class="module-card-desc">${m.desc}</div>
      </div>
    `).join("");

    // Update DDA & Daily stats box
    const ddaBox = document.getElementById("dda-status-box");
    if (ddaBox) {
      ddaBox.innerHTML = `
        <div style="display:flex;justify-content:space-between;">
          <span>Schwierigkeitsgrad (DDA):</span>
          <strong style="color:var(--matrix-green)">Stufe ${state.dda.level} / 3</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>Aktuelle Serie (Streak):</span>
          <strong style="color:var(--cyber-cyan)">${state.dda.streak} richtig</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>Daily Incidents heute:</span>
          <strong style="color:var(--amber-warn)">${state.daily.dailyIncidentsSolved || 0} / 3 abgeschlossen</strong>
        </div>`;
    }
  }

  function renderChallengeWorkspace() {
    const stage = document.getElementById("challenge-workspace");
    if (!stage) return;

    if (currentModule === "subnet") {
      if (!activeChallenges.subnet || activeChallenges.subnet.solved) {
        const prevId = activeChallenges.subnet ? activeChallenges.subnet.id : null;
        activeChallenges.subnet = pickChallengeWithSpacedRepetition(window.GAME_DATA.subnetChallenges, prevId);
      }
      const ch = activeChallenges.subnet;
      const defaultPrefix = ch.acceptablePrefixes.includes(24) ? 20 : 24;
      const totalIps = Math.pow(2, 32 - defaultPrefix);
      const usableHosts = Math.max(0, totalIps - 2);

      stage.innerHTML = `
        <div class="panel-header">
          <div>
            <div class="panel-title">🌐 ${ch.title} ${ch.isSpacedReview ? '<span class="stage-badge">Spaced Repetition Review</span>' : ""}</div>
            <div class="panel-subtitle">Schwierigkeit: Stufe ${ch.difficulty} | Effekt: 2x Traffic-Durchsatz (90s) + Bug Bounty</div>
          </div>
          <button class="btn" onclick="window.RootApp.nextChallenge('subnet')">↻ Neue Aufgabe</button>
        </div>
        <div class="scenario-box">${ch.scenario}</div>
        <div>
          <label class="panel-subtitle" for="cidr-range-input">Wähle das passende CIDR-Präfix per Slider (<strong>/16</strong> bis <strong>/30</strong>):</label>
          <input id="cidr-range-input" type="range" min="16" max="30" value="${defaultPrefix}" class="cidr-slider" style="margin-top:10px;" oninput="window.RootApp.onSubnetSliderChange(this.value)">
        </div>
        <div class="subnet-calc-grid">
          <div class="stat-tile">
            <div class="stat-tile-label">Gewähltes CIDR-Präfix</div>
            <div id="sub-val-prefix" class="stat-tile-val">${ch.baseIp} /${defaultPrefix}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Subnetzmaske (Dezimal)</div>
            <div id="sub-val-mask" class="stat-tile-val">${prefixToMask(defaultPrefix)}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Nutzbare Host-IPs (2^h - 2)</div>
            <div id="sub-val-hosts" class="stat-tile-val" style="color:var(--matrix-green)">${usableHosts} Hosts</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-label">Anforderung im Ticket</div>
            <div class="stat-tile-val" style="color:var(--amber-warn)">Mind. ${ch.minHosts} Hosts</div>
          </div>
        </div>
        <div class="binary-mask-box">
          <div class="panel-subtitle" style="margin-bottom:4px;">Binäre Subnetzmaske (<span class="bit-net">1 = Netzwerk-Bits</span>, <span class="bit-host">0 = Host-Bits</span>):</div>
          <div id="sub-val-binary">${prefixToBinaryHtml(defaultPrefix)}</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button id="btn-submit-subnet" class="btn btn-primary" onclick="window.RootApp.submitSubnet()">✓ SUBNETZ-KONFIGURATION DEPLOYEN</button>
          <button class="btn btn-cyan" onclick="window.RootApp.openCheatSheet('cs_subnet')">📖 CIDR Cheat-Sheet</button>
        </div>
        <div id="challenge-feedback"></div>
      `;
    } else if (currentModule === "cli") {
      if (!activeChallenges.cli || activeChallenges.cli.solved) {
        const prevId = activeChallenges.cli ? activeChallenges.cli.id : null;
        activeChallenges.cli = pickChallengeWithSpacedRepetition(window.GAME_DATA.cliChallenges, prevId);
      }
      const ch = activeChallenges.cli;
      stage.innerHTML = `
        <div class="panel-header">
          <div>
            <div class="panel-title">💻 ${ch.title}</div>
            <div class="panel-subtitle">${ch.alert}</div>
          </div>
          <button class="btn" onclick="window.RootApp.nextChallenge('cli')">↻ Neuer Incident</button>
        </div>
        <div class="scenario-box">${ch.promptContext}</div>
        <div class="terminal-window">
          <div class="terminal-titlebar">
            <div class="terminal-dots">
              <span class="terminal-dot" style="background:#ff5f56"></span>
              <span class="terminal-dot" style="background:#ffbd2e"></span>
              <span class="terminal-dot" style="background:#27c93f"></span>
            </div>
            <span>ssh root@prod-srv-01 — bash (80x24)</span>
            <span>TTY1</span>
          </div>
          <div id="cli-output-log" class="terminal-output">
            ${ch.initialOutput.map((line) => `<div class="term-line-info">${line}</div>`).join("")}
          </div>
          <div class="terminal-input-row">
            <span class="terminal-prompt">root@prod-srv-01:~#</span>
            <input id="cli-cmd-input" type="text" class="terminal-input" placeholder="Befehl eingeben oder unten Auto-Complete anklicken..." autocomplete="off" onkeydown="if(event.key==='Enter') window.RootApp.submitCli()">
            <button id="btn-submit-cli" class="btn btn-primary" onclick="window.RootApp.submitCli()">AUSFÜHREN</button>
          </div>
        </div>
        <div>
          <div class="panel-subtitle" style="margin-bottom:6px;">Schnell-Eingabe / Auto-Complete Hilfen für Einsteiger:</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${ch.hints.map((h) => `<button class="btn btn-cyan" onclick="window.RootApp.fillCliHint('${h.replace(/'/g, "\\'")}')"><code>${h}</code></button>`).join("")}
          </div>
        </div>
        <div id="challenge-feedback"></div>
      `;
    } else if (currentModule === "script") {
      if (!activeChallenges.script || activeChallenges.script.solved) {
        const prevId = activeChallenges.script ? activeChallenges.script.id : null;
        activeChallenges.script = pickChallengeWithSpacedRepetition(window.GAME_DATA.scriptChallenges, prevId);
      }
      const ch = activeChallenges.script;
      const codeHtml = ch.template.map((line) => {
        let processed = line;
        ch.blanks.forEach((b) => {
          const token = `___${b.index}___`;
          if (processed.includes(token)) {
            const opts = b.options.map((o) => `<option value="${o}">${o}</option>`).join("");
            const selectHtml = `<select id="script-blank-${b.index}" class="code-blank-select"><option value="">-- wähle --</option>${opts}</select>`;
            processed = processed.replace(token, selectHtml);
          }
        });
        return `<div>${processed.replace(/^\s+/, (m) => "&nbsp;".repeat(m.length))}</div>`;
      }).join("");

      stage.innerHTML = `
        <div class="panel-header">
          <div>
            <div class="panel-title">⚙️ ${ch.title} (${ch.lang})</div>
            <div class="panel-subtitle">Belohnung: ${ch.daemonReward}</div>
          </div>
          <button class="btn" onclick="window.RootApp.nextChallenge('script')">↻ Neues Skript</button>
        </div>
        <div class="scenario-box">${ch.desc}</div>
        <div class="code-editor-box">${codeHtml}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button id="btn-submit-script" class="btn btn-primary" onclick="window.RootApp.submitScript()">▶ CRONJOB KOMPILIEREN & STARTEN</button>
          <button class="btn btn-cyan" onclick="window.RootApp.openCheatSheet('cs_scripting')">📖 Scripting Cheat-Sheet</button>
        </div>
        <div id="challenge-feedback"></div>
      `;
    } else if (currentModule === "sql") {
      if (!activeChallenges.sql || activeChallenges.sql.solved) {
        loadSqlChallenge();
        return;
      }
      const ch = activeChallenges.sql;
      stage.innerHTML = `
        <div class="panel-header">
          <div>
            <div class="panel-title">🗄️ ${ch.title}</div>
            <div class="panel-subtitle">Aktuelle Abfrage-Latenz: <strong id="sql-latency-val" style="color:var(--crimson-alert)">${ch.beforeLatencyMs} ms (FULL TABLE SCAN)</strong></div>
          </div>
          <button class="btn" onclick="window.RootApp.nextChallenge('sql')">↻ Neue Query</button>
        </div>
        <div class="scenario-box">${ch.scenario}</div>
        <div>
          <div class="panel-subtitle" style="margin-bottom:6px;">Deine zusammengebaute SQL-Abfrage (Klicke auf einen Baustein zum Entfernen):</div>
          <div id="sql-dropzone" class="sql-dropzone"></div>
        </div>
        <div>
          <div class="panel-subtitle" style="margin-bottom:6px;">Verfügbare SQL-Bausteine (Klicke in der richtigen Reihenfolge):</div>
          <div id="sql-token-bank" class="sql-token-bank"></div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button id="btn-submit-sql" class="btn btn-primary" onclick="window.RootApp.submitSql()">⚡ EXPLAIN ANALYZE & QUERY OPTIMIEREN</button>
          <button class="btn" onclick="window.RootApp.resetSqlTokens()">↺ Zurücksetzen</button>
          <button class="btn btn-cyan" onclick="window.RootApp.openCheatSheet('cs_sql')">📖 SQL Cheat-Sheet</button>
        </div>
        <div id="challenge-feedback"></div>
      `;
      renderSqlTokensUI();
    }
  }

  function renderSqlTokensUI() {
    const dropzone = document.getElementById("sql-dropzone");
    const bank = document.getElementById("sql-token-bank");
    if (!dropzone || !bank) return;

    dropzone.innerHTML = sqlSelectedTokens.length > 0
      ? sqlSelectedTokens.map((t, idx) => `<span class="sql-token" style="border-color:var(--matrix-green)" onclick="window.RootApp.removeSqlToken(${idx})">${t.text}</span>`).join("")
      : `<span class="panel-subtitle">Klicke unten auf die SQL-Bausteine, um das Statement aufzubauen...</span>`;

    const selectedIds = new Set(sqlSelectedTokens.map((t) => t.id));
    bank.innerHTML = sqlBankTokens
      .filter((t) => !selectedIds.has(t.id))
      .map((t) => `<span class="sql-token" onclick="window.RootApp.addSqlToken(${t.id})">${t.text}</span>`)
      .join("");
  }

  // --------------------------------------------------------------------------
  // UI RENDERING: TAB 3 (WISSENS-LEXIKON & CHEAT-SHEETS)
  // --------------------------------------------------------------------------
  function renderLexikon(filterText = "") {
    const grid = document.getElementById("lexikon-grid-container");
    if (!grid) return;
    const q = filterText.trim().toLowerCase();

    const filtered = window.GAME_DATA.cheatSheets.filter((cs) => {
      if (!q) return true;
      return (
        cs.title.toLowerCase().includes(q) ||
        cs.category.toLowerCase().includes(q) ||
        cs.summary.toLowerCase().includes(q) ||
        cs.rows.some((r) => r.key.toLowerCase().includes(q) || r.val.toLowerCase().includes(q))
      );
    });

    grid.innerHTML = filtered.map((cs) => `
      <div id="cheatsheet-${cs.id}" class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-title">${cs.title}</div>
            <div class="panel-subtitle">${cs.category}</div>
          </div>
          <span class="stage-badge">${cs.badge}</span>
        </div>
        <div class="scenario-box">${cs.summary}</div>
        <table class="cheat-table">
          <tbody>
            ${cs.rows.map((r) => `
              <tr>
                <td class="cheat-key"><code>${r.key}</code></td>
                <td class="cheat-val">${r.val}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `).join("");
  }

  // --------------------------------------------------------------------------
  // UI RENDERING: TAB 4 (FORSCHUNG & SKILL-TREE)
  // --------------------------------------------------------------------------
  function renderTechTree() {
    const grid = document.getElementById("tech-tree-container");
    if (!grid) return;

    grid.innerHTML = window.GAME_DATA.techTree.map((tech) => {
      const isUnlocked = state.unlockedTechs.includes(tech.id);
      const reqMet = !tech.req || state.unlockedTechs.includes(tech.req);
      const reqTech = tech.req ? window.GAME_DATA.techTree.find((t) => t.id === tech.req) : null;
      const affordable = canAfford(tech.cost);

      return `
        <div class="tech-node ${isUnlocked ? "unlocked" : !reqMet ? "locked-req" : ""}">
          <div>
            <div class="panel-header" style="padding-bottom:8px;margin-bottom:8px;">
              <span class="panel-title" style="font-size:0.88rem;">${tech.name}</span>
              <span class="stage-badge">TIER ${tech.tier} // ${tech.domain}</span>
            </div>
            <p class="hw-desc" style="margin-bottom:8px;">${tech.effectText}</p>
            ${reqTech && !reqMet ? `<p style="font-size:0.74rem;color:var(--amber-warn);font-family:var(--font-mono);">🔒 Benötigt: ${reqTech.name}</p>` : ""}
          </div>
          ${isUnlocked
            ? `<button class="btn btn-primary" disabled>✓ ERFORSCHT & AKTIV</button>`
            : `<button class="btn ${affordable && reqMet ? "btn-primary" : ""}" ${affordable && reqMet ? "" : "disabled"} onclick="window.RootApp.unlockTech('${tech.id}')">
                <span>ERFORSCHEN (${formatNum(tech.cost.traffic)} pkt | ${formatNum(tech.cost.compute)} ops | ${formatNum(tech.cost.storage)} MB)</span>
              </button>`
          }
        </div>
      `;
    }).join("");
  }

  // --------------------------------------------------------------------------
  // UI RENDERING: TAB 5 (CERTIFICATES, ACHIEVEMENTS & DAILY CHECK-IN)
  // --------------------------------------------------------------------------
  function renderCertificates() {
    const grid = document.getElementById("cert-grid-container");
    if (!grid) return;

    const nameInput = document.getElementById("admin-name-input");
    if (nameInput && document.activeElement !== nameInput) {
      nameInput.value = state.adminName || "root_operator";
    }

    grid.innerHTML = window.GAME_DATA.certificates.map((cert) => {
      const earned = cert.check(state);
      return `
        <div class="cert-card ${earned ? "earned" : ""}">
          <div>
            <div class="panel-header" style="padding-bottom:8px;margin-bottom:8px;">
              <span class="panel-title" style="color:${earned ? "var(--amber-warn)" : "var(--text-secondary)"}">
                ${earned ? "🏆 " : "🔒 "}${cert.title}
              </span>
              <span class="tab-pill">${cert.code}</span>
            </div>
            <div class="panel-subtitle" style="margin-bottom:6px;">Domäne: ${cert.domain}</div>
            <div class="hw-desc">${cert.reqDesc}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
            <span class="panel-subtitle">${earned ? "Status: VERIFIZIERT" : "Status: Ausstehend"}</span>
            <button class="btn ${earned ? "btn-warn" : ""}" ${earned ? "" : "disabled"} onclick="window.RootApp.openCertificateModal('${cert.id}')">
              🖼 Zertifikat anzeigen & PNG Export
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  // Render Certificate onto HTML5 Canvas for PNG download
  function drawCertificateCanvas(cert) {
    const canvas = document.getElementById("cert-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    // Background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#060b11");
    grad.addColorStop(1, "#0f1c2c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Outer neon border
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, w - 36, h - 36);

    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 28, w - 56, h - 56);

    // Header
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 18px Consolas, monospace";
    ctx.textAlign = "center";
    ctx.fillText("ROOT ACCESS: THE IDLE ADMIN // OFFICIAL CERTIFICATION AUTHORITY", w / 2, 72);

    ctx.fillStyle = "#8ba3b8";
    ctx.font = "14px Consolas, monospace";
    ctx.fillText(`CREDENTIAL ID: ${cert.code} — ISSUED VIA MICRO-LEARNING ENGINE`, w / 2, 100);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px Consolas, monospace";
    ctx.fillText(cert.title.toUpperCase(), w / 2, 165);

    // Recipient
    ctx.fillStyle = "#00e5ff";
    ctx.font = "16px Consolas, monospace";
    ctx.fillText("VERLIEHEN AN SYSTEM-ADMINISTRATOR:", w / 2, 215);

    ctx.fillStyle = "#ffb300";
    ctx.font = "bold 28px Consolas, monospace";
    ctx.fillText(state.adminName || "root_operator", w / 2, 255);

    // Domain & stats
    ctx.fillStyle = "#e6f4f1";
    ctx.font = "16px Consolas, monospace";
    ctx.fillText(`Fachbereich: ${cert.domain}`, w / 2, 305);
    ctx.fillText(`Gelöste IT-Challenges: ${state.stats.totalSolved} | Infrastruktur: ${getCurrentStage().name}`, w / 2, 335);

    // Footer Signature & Timestamp
    const dateStr = new Date().toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });
    ctx.fillStyle = "#00ff88";
    ctx.font = "14px Consolas, monospace";
    ctx.fillText(`SHA256-SIGNATURE: 0x9F4A...ROOT-VERIFIED // DATUM: ${dateStr}`, w / 2, 395);
  }

  // --------------------------------------------------------------------------
  // MODAL HELPER
  // --------------------------------------------------------------------------
  function showModal(title, bodyHtml) {
    const backdrop = document.getElementById("generic-modal");
    document.getElementById("generic-modal-title").textContent = title;
    document.getElementById("generic-modal-body").innerHTML = bodyHtml;
    backdrop.classList.remove("hidden");
  }

  // --------------------------------------------------------------------------
  // MAIN GAME TICK (10 ticks per second for smooth counters)
  // --------------------------------------------------------------------------
  let lastTickTime = Date.now();
  function gameTick() {
    const now = Date.now();
    const dt = Math.min(2.0, (now - lastTickTime) / 1000);
    lastTickTime = now;

    const rates = getRates();
    const clickPwr = getClickPower();

    // Passive generation + auto-click daemon contribution
    const autoTraffic = rates.autoClickPerSec * clickPwr.traffic * 0.25;
    const autoCompute = rates.autoClickPerSec * clickPwr.compute * 0.25;
    const autoStorage = rates.autoClickPerSec * clickPwr.storage * 0.25;

    addResources(
      (rates.trafficRate + autoTraffic) * dt,
      (rates.computeRate + autoCompute) * dt,
      (rates.storageRate + autoStorage) * dt
    );

    // Trigger milestone Incident Check if threshold crossed
    if (!state.activeIncident && state.lifetimeCompute >= state.nextIncidentAtCompute) {
      const incidentTypes = [
        { module: "subnet", message: "NETZWERK-ENGPASS: Broadcast-Sturm im Server-VLAN! Segmentiere das Subnetz." },
        { module: "cli", message: "SECURITY INCIDENT: Kritischer Prozess / Dateirechte-Fehler auf prod-srv-01!" },
        { module: "script", message: "AUTOSCALING FEHLT: Manuelle Lastspitzen! Kompiliere einen Cronjob-Daemon." },
        { module: "sql", message: "DATABASE BOTTLENECK: Slow Queries blockieren den Storage-Pool!" }
      ];
      const pick = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
      state.activeIncident = pick;
      state.nextIncidentAtCompute = Math.floor(state.lifetimeCompute * 2.4 + 450);
      renderServerRoom();
    }

    updateHeaderUI();
  }

  // --------------------------------------------------------------------------
  // PUBLIC API FOR DOM HANDLERS
  // --------------------------------------------------------------------------
  window.RootApp = {
    switchTab(tabId) {
      sfxClick();
      document.querySelectorAll(".tab-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.tab === tabId);
      });
      document.querySelectorAll(".tab-panel").forEach((p) => {
        p.classList.toggle("active", p.id === `tab-${tabId}`);
      });
      if (tabId === "server") renderServerRoom();
      if (tabId === "tickets") {
        renderModuleSidebar();
        renderChallengeWorkspace();
      }
      if (tabId === "lexikon") renderLexikon();
      if (tabId === "tech") renderTechTree();
      if (tabId === "certs") renderCertificates();
    },

    manualBoost(event, focusType = "all") {
      sfxClick();
      state.stats.totalClicks += 1;
      const pwr = getClickPower();
      let dT = pwr.traffic;
      let dC = pwr.compute;
      let dS = pwr.storage;
      let label = `+${formatNum(dC)} ops | +${formatNum(dT)} pkt`;

      if (focusType === "traffic") {
        dT *= 2.2; dC *= 0.4; dS *= 0.4;
        label = `+${formatNum(dT)} pkt`;
      } else if (focusType === "compute") {
        dC *= 2.2; dT *= 0.4; dS *= 0.4;
        label = `+${formatNum(dC)} ops`;
      } else if (focusType === "storage") {
        dS *= 2.5; dT *= 0.4; dC *= 0.4;
        label = `+${formatNum(dS)} MB`;
      }

      addResources(dT, dC, dS);
      updateHeaderUI();

      if (event && event.clientX) {
        const el = document.createElement("div");
        el.className = "click-particle";
        el.textContent = label;
        el.style.left = `${event.clientX - 30}px`;
        el.style.top = `${event.clientY - 18}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 900);
      }
    },

    buyHardware(hwId) {
      const hw = window.GAME_DATA.hardware.find((h) => h.id === hwId);
      if (!hw) return;
      const cost = getHardwareCost(hw);
      if (!canAfford(cost)) return;
      sfxBuy();
      state.resources.traffic -= cost.traffic;
      state.resources.compute -= cost.compute;
      state.resources.storage -= cost.storage;
      state.hardwareCounts[hwId] = (state.hardwareCounts[hwId] || 0) + 1;
      saveState();
      renderServerRoom();
      updateHeaderUI();
    },

    unlockTech(techId) {
      const tech = window.GAME_DATA.techTree.find((t) => t.id === techId);
      if (!tech || state.unlockedTechs.includes(techId)) return;
      if (!canAfford(tech.cost)) return;
      sfxSuccess();
      state.resources.traffic -= tech.cost.traffic;
      state.resources.compute -= tech.cost.compute;
      state.resources.storage -= tech.cost.storage;
      state.unlockedTechs.push(techId);
      saveState();
      renderTechTree();
      renderServerRoom();
      updateHeaderUI();
    },

    selectModule(modId) {
      sfxClick();
      currentModule = modId;
      renderModuleSidebar();
      renderChallengeWorkspace();
    },

    jumpToActiveIncident() {
      if (state.activeIncident) {
        currentModule = state.activeIncident.module;
      }
      this.switchTab("tickets");
    },

    nextChallenge(modId) {
      sfxClick();
      if (modId === "subnet") loadSubnetChallenge();
      if (modId === "cli") loadCliChallenge();
      if (modId === "script") loadScriptChallenge();
      if (modId === "sql") loadSqlChallenge();
    },

    onSubnetSliderChange(val) {
      const prefix = parseInt(val, 10);
      const ch = activeChallenges.subnet;
      const totalIps = Math.pow(2, 32 - prefix);
      const usable = Math.max(0, totalIps - 2);
      document.getElementById("sub-val-prefix").textContent = `${ch ? ch.baseIp : "192.168.1.0"} /${prefix}`;
      document.getElementById("sub-val-mask").textContent = prefixToMask(prefix);
      document.getElementById("sub-val-hosts").textContent = `${usable} Hosts`;
      document.getElementById("sub-val-binary").innerHTML = prefixToBinaryHtml(prefix);
    },

    submitSubnet() {
      const slider = document.getElementById("cidr-range-input");
      if (!slider) return;
      verifySubnetAnswer(parseInt(slider.value, 10));
    },

    fillCliHint(cmdText) {
      if (activeChallenges.cli && activeChallenges.cli.solved) return;
      const inp = document.getElementById("cli-cmd-input");
      if (!inp) return;
      inp.value = cmdText;
      inp.focus();
    },

    submitCli() {
      const inp = document.getElementById("cli-cmd-input");
      if (!inp) return;
      const val = inp.value;
      inp.value = "";
      executeCliCommand(val);
    },

    submitScript() {
      verifyScriptChallenge();
    },

    addSqlToken(tokenId) {
      if (activeChallenges.sql && activeChallenges.sql.solved) return;
      sfxClick();
      const tok = sqlBankTokens.find((t) => t.id === tokenId);
      if (!tok) return;
      sqlSelectedTokens.push(tok);
      renderSqlTokensUI();
    },

    removeSqlToken(idx) {
      if (activeChallenges.sql && activeChallenges.sql.solved) return;
      sfxClick();
      sqlSelectedTokens.splice(idx, 1);
      renderSqlTokensUI();
    },

    resetSqlTokens() {
      if (activeChallenges.sql && activeChallenges.sql.solved) return;
      sfxClick();
      sqlSelectedTokens = [];
      renderSqlTokensUI();
    },

    submitSql() {
      verifySqlChallenge();
    },

    openCheatSheet(csId) {
      this.switchTab("lexikon");
      setTimeout(() => {
        const el = document.getElementById(`cheatsheet-${csId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.style.borderColor = "var(--matrix-green)";
        }
      }, 60);
    },

    filterLexikon(val) {
      renderLexikon(val);
    },

    claimDailyCheckIn() {
      const today = new Date().toISOString().slice(0, 10);
      if (state.daily.lastCheckInDate === today) {
        showModal(
          "DAILY SERVER CHECK-IN",
          `<div class="scenario-box">Du hast deinen heutigen Server Check-in bereits abgeholt! Aktuelle Login-Serie: <strong>${state.daily.checkInStreak} Tage</strong>.</div>`
        );
        return;
      }
      sfxSuccess();
      state.daily.lastCheckInDate = today;
      state.daily.checkInStreak = (state.daily.checkInStreak || 0) + 1;
      const bounty = grantBugBounty(2);
      saveState();
      updateHeaderUI();
      showModal(
        "DAILY SERVER CHECK-IN ERFOLGREICH!",
        `<div class="scenario-box">
          Willkommen zurück im Leitstand, <strong>${state.adminName}</strong>! Deine Login-Serie beträgt jetzt <strong>${state.daily.checkInStreak} Tag(e)</strong>.
        </div>
        <div class="subnet-calc-grid">
          <div class="stat-tile"><div class="stat-tile-label">Traffic Bonus</div><div class="stat-tile-val">+${formatNum(bounty.rewardTraffic)} pkt</div></div>
          <div class="stat-tile"><div class="stat-tile-label">Compute Bonus</div><div class="stat-tile-val">+${formatNum(bounty.rewardCompute)} ops</div></div>
          <div class="stat-tile"><div class="stat-tile-label">Storage Bonus</div><div class="stat-tile-val">+${formatNum(bounty.rewardStorage)} MB</div></div>
        </div>`
      );
    },

    simulateOfflineHour() {
      sfxBuy();
      processOfflineProgress(3600);
      renderServerRoom();
      updateHeaderUI();
    },

    toggleSound() {
      state.soundEnabled = !state.soundEnabled;
      saveState();
      updateHeaderUI();
    },

    updateAdminName(val) {
      state.adminName = val.trim() || "root_operator";
      saveState();
    },

    openCertificateModal(certId) {
      const cert = window.GAME_DATA.certificates.find((c) => c.id === certId);
      if (!cert) return;
      currentCertPreview = cert;
      const modal = document.getElementById("cert-modal");
      modal.classList.remove("hidden");
      drawCertificateCanvas(cert);
    },

    downloadCertificatePng() {
      const canvas = document.getElementById("cert-canvas");
      if (!canvas || !currentCertPreview) return;
      const link = document.createElement("a");
      link.download = `${currentCertPreview.code}_${state.adminName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    },

    closeModals() {
      document.getElementById("generic-modal").classList.add("hidden");
      document.getElementById("cert-modal").classList.add("hidden");
    },

    resetGamePrompt() {
      if (confirm("Möchtest du den Spielstand wirklich auf Werkseinstellungen zurücksetzen?")) {
        localStorage.removeItem(SAVE_KEY);
        state = createDefaultState();
        renderServerRoom();
        renderModuleSidebar();
        renderChallengeWorkspace();
        renderLexikon();
        renderTechTree();
        renderCertificates();
        updateHeaderUI();
      }
    }
  };

  // --------------------------------------------------------------------------
  // INITIALIZATION ON DOM READY
  // --------------------------------------------------------------------------
  window.addEventListener("DOMContentLoaded", () => {
    renderServerRoom();
    renderModuleSidebar();
    renderChallengeWorkspace();
    renderLexikon();
    renderTechTree();
    renderCertificates();
    updateHeaderUI();

    // Check real offline progress on startup
    processOfflineProgress();

    // Main loop (10 Hz) & Auto-Save (every 10 seconds)
    setInterval(gameTick, 100);
    setInterval(saveState, 10000);
  });
})();

