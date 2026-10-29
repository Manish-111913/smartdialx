// Behaviour for the Simulation Lab screen, carried over from the Stitch prototype.
// It works on the DOM by element id, the same way the original page did.
// useScreen() calls mount() once the markup is rendered and removes the
// listeners it added when the page unmounts.

export function mount(ctx) {
  // Simulation Lab Interactive State Engine
  let activeMode = 'predictive';
  let isAiScreeningEnabled = true;

  // Preset Application
  function applyPreset(presetKey) {
    const dropdown = document.getElementById('scenario-dropdown');
    if (dropdown) dropdown.value = presetKey;

    const cards = document.querySelectorAll('.preset-card');
    cards.forEach(c => {
      c.classList.remove('ring-2', 'ring-po-secondary', 'bg-po-surface-container-low/30');
    });

    if (ctx.target) {
      ctx.target.classList.add('ring-2', 'ring-po-secondary', 'bg-po-surface-container-low/30');
    }

    if (presetKey === 'low') {
      selectDialMode('predictive');
      document.querySelector('input[type="range"][min="1"]').value = 14;
      document.getElementById('agent-val').innerText = '14 Agents';
      document.getElementById('fault-injection').value = 'none';
    } else if (presetKey === 'balanced') {
      selectDialMode('predictive');
      document.querySelector('input[type="range"][min="1"]').value = 14;
      document.getElementById('agent-val').innerText = '14 Agents';
      document.getElementById('fault-injection').value = 'none';
    } else if (presetKey === 'high') {
      selectDialMode('predictive');
      document.querySelector('input[type="range"][min="1"]').value = 20;
      document.getElementById('agent-val').innerText = '20 Agents';
      document.getElementById('fault-injection').value = 'none';
    } else if (presetKey === 'fault') {
      document.getElementById('fault-injection').value = 'outage';
    }
  }

  function onScenarioSelect(val) {
    applyPreset(val);
  }

  // Dial Mode Selector
  function selectDialMode(mode) {
    activeMode = mode;
    const progBox = document.getElementById('mode-progressive');
    const predBox = document.getElementById('mode-predictive');
    const progCheck = document.getElementById('check-progressive');
    const predCheck = document.getElementById('check-predictive');

    if (mode === 'progressive') {
      progBox.classList.add('ring-2', 'ring-po-secondary', 'bg-po-surface-container-low');
      progBox.classList.remove('bg-po-surface-container-low/50');
      progCheck.className = 'w-5 h-5 rounded-po-full bg-po-secondary text-po-on-secondary flex items-center justify-center shrink-0';
      progCheck.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span>';

      predBox.classList.remove('ring-2', 'ring-po-secondary');
      predBox.classList.add('bg-po-surface-container-low/50');
      predCheck.className = 'w-5 h-5 rounded-po-full bg-po-surface-container flex items-center justify-center shrink-0';
      predCheck.innerHTML = '<span class="material-symbols-outlined text-[13px] text-po-on-surface-variant">circle</span>';
    } else {
      predBox.classList.add('ring-2', 'ring-po-secondary', 'bg-po-surface-container-low');
      predBox.classList.remove('bg-po-surface-container-low/50');
      predCheck.className = 'w-5 h-5 rounded-po-full bg-po-secondary text-po-on-secondary flex items-center justify-center shrink-0';
      predCheck.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span>';

      progBox.classList.remove('ring-2', 'ring-po-secondary');
      progBox.classList.add('bg-po-surface-container-low/50');
      progCheck.className = 'w-5 h-5 rounded-po-full bg-po-surface-container flex items-center justify-center shrink-0';
      progCheck.innerHTML = '<span class="material-symbols-outlined text-[13px] text-po-on-surface-variant">circle</span>';
    }
  }

  // AI Screening Toggle
  function toggleAiScreening() {
    isAiScreeningEnabled = !isAiScreeningEnabled;
    const btn = document.getElementById('ai-screening-toggle');
    const ball = document.getElementById('ai-toggle-ball');

    if (isAiScreeningEnabled) {
      btn.classList.remove('bg-po-surface-container');
      btn.classList.add('bg-po-secondary');
      ball.classList.add('translate-x-4');
    } else {
      btn.classList.remove('bg-po-secondary');
      btn.classList.add('bg-po-surface-container');
      ball.classList.remove('translate-x-4');
    }
  }

  // Reset form helper
  function resetSimulationForm() {
    selectDialMode('predictive');
    document.getElementById('scenario-dropdown').value = 'balanced';
    document.getElementById('carrier-provider').value = 'sip_a';
    document.getElementById('fault-injection').value = 'none';
    document.getElementById('ai-profile').value = 'standard';
    document.getElementById('wait-sla').value = '45';
    document.getElementById('no-agent-policy').value = 'callback';
    document.querySelector('input[type="range"][min="1"]').value = 14;
    document.getElementById('agent-val').innerText = '14 Agents';
    document.querySelector('input[type="range"][min="50"]').value = 500;
    document.getElementById('target-val').innerText = '500 Targets';
    if (!isAiScreeningEnabled) toggleAiScreening();
  }

  // Synthetic CSV Log exporter
  function exportSyntheticLog() {
    const csvContent = "data:text/csv;charset=utf-8,RunID,Timestamp,Initiated,Answered,Qualified,Connected,Failed,Dropped\nSIM-1049,14:32:10,500,248,92,90,12,2";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "SIM-1049_telephony_synthetic_audit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  // Simulation Trigger Notification
  function triggerSimulation() {
    const toast = document.getElementById('sim-toast');
    const btn = document.getElementById('run-sim-btn');
    if (!toast) return;

    btn.classList.add('opacity-75', 'cursor-not-allowed');
    btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span><span>Simulating...</span>';

    toast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      dismissToast();
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
      btn.innerHTML = '<span class="material-symbols-outlined text-[18px] text-po-tertiary-fixed">play_circle</span><span>Run Simulation</span>';
    }, 4500);
  }

  function dismissToast() {
    const toast = document.getElementById('sim-toast');
    if (!toast) return;
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
  }

  return { applyPreset, dismissToast, exportSyntheticLog, onScenarioSelect, resetSimulationForm, selectDialMode, toggleAiScreening, triggerSimulation };
}
