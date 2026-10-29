// Behaviour for the Provider Monitoring screen, carried over from the Stitch prototype.
// It works on the DOM by element id, the same way the original page did.
// useScreen() calls mount() once the markup is rendered and removes the
// listeners it added when the page unmounts.

export function mount() {
  let activeSimulationScenario = 'timeout';
  let activeSimulationTarget = 'gw-b';
  let activeSimulationDuration = '1m';

  const scenariosConfig = {
    'timeout': {
      title: 'Scenario: SIP 408',
      desc: 'Pacing controller throttles batch rate to 1:1 Progressive and initiates automated webhook deduplication without carrier dropped calls.'
    },
    'latency': {
      title: 'Scenario: High Latency (+350ms)',
      desc: 'System applies adaptive throttling, increasing the dial timeout threshold and staggering concurrent call dispatches.'
    },
    'outage': {
      title: 'Scenario: Temporary Outage (SIP 503)',
      desc: 'Circuit breaker activates immediately. All in-flight calls are gracefully handed over to Mock Gateway A with zero agent disconnection.'
    },
    'duplicates': {
      title: 'Scenario: Duplicate Webhook Events',
      desc: 'Idempotency engine flags incoming hash matches, dropping redundant state transitions while maintaining state consistency.'
    },
    'reorder': {
      title: 'Scenario: Out-of-Order Delivery',
      desc: 'Sequence realigner holds terminal events until initial ringing/answer tokens resolve, preventing illegal state transitions.'
    },
    'normal': {
      title: 'Scenario: Nominal Baseline',
      desc: 'Both mock gateways operate at peak efficiency. Round-robin dispatching active at full concurrency.'
    }
  };


  function selectSimProvider(provider) {
    activeSimulationTarget = provider;
    const btnA = document.getElementById('sim-btn-gwa');
    const btnB = document.getElementById('sim-btn-gwb');
    if (provider === 'gw-a') {
      btnA.className = 'px-3 py-1.5 rounded-lg text-po-primary bg-po-surface-container-high font-body-sm text-[13px] font-semibold transition-colors';
      btnB.className = 'px-3 py-1.5 rounded-lg text-po-on-surface-variant bg-po-surface-container-low font-body-sm text-[13px] font-medium hover:bg-po-surface-container transition-colors';
    } else {
      btnB.className = 'px-3 py-1.5 rounded-lg text-po-primary bg-po-surface-container-high font-body-sm text-[13px] font-semibold transition-colors';
      btnA.className = 'px-3 py-1.5 rounded-lg text-po-on-surface-variant bg-po-surface-container-low font-body-sm text-[13px] font-medium hover:bg-po-surface-container transition-colors';
    }
    updateSimPreview();
  }

  function selectSimDuration(duration) {
    activeSimulationDuration = duration;
    ['1m', '5m', '15m'].forEach(d => {
      const el = document.getElementById('dur-' + d);
      if (d === duration) {
        el.className = 'py-1 rounded-lg bg-po-surface-container-high text-po-primary font-label-mono-xs text-[11px] font-semibold transition-colors';
      } else {
        el.className = 'py-1 rounded-lg bg-po-surface-container-low text-po-on-surface-variant font-label-mono-xs text-[11px] font-medium hover:bg-po-surface-container transition-colors';
      }
    });
  }

  function updateSimPreview() {
    const scenario = document.getElementById('sim-scenario-select').value;
    activeSimulationScenario = scenario;
    const targetLabel = activeSimulationTarget === 'gw-a' ? 'Gateway A' : 'Gateway B';
    const cfg = scenariosConfig[scenario];

    document.getElementById('sim-preview-title').textContent = `${cfg.title} on ${targetLabel}`;
    document.getElementById('sim-preview-desc').textContent = cfg.desc;
    document.getElementById('sim-preview-status').textContent = 'Ready to Inject';
    document.getElementById('sim-preview-status').className = 'text-po-secondary font-semibold';
  }

  function runSimulation() {
    const btn = document.getElementById('btn-run-sim');
    const status = document.getElementById('sim-preview-status');
    const box = document.getElementById('sim-result-box');

    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span><span>Injecting Faults...</span>';
    status.textContent = 'Active Simulation Running';
    status.className = 'text-po-error font-semibold';
    box.className = 'p-3 rounded-lg bg-po-surface-container-high border-l-4 border-l-po-error flex flex-col gap-1 transition-all';

    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span><span>Simulation Active</span>';
      box.className = 'p-3 rounded-lg bg-po-surface-container-high border-l-4 border-l-po-secondary flex flex-col gap-1 transition-all';

      setTimeout(() => {
        btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">play_arrow</span><span>Run Simulation</span>';
        status.textContent = 'Completed (Telemetry Logged)';
        status.className = 'text-po-on-tertiary-container font-semibold';
      }, 2200);
    }, 1200);
  }

  function openDrawer(providerKey) {
    const drawer = document.getElementById('provider-drawer');
    const backdrop = document.getElementById('provider-drawer-backdrop');

    const idEl = document.getElementById('drawer-provider-id');
    const nameEl = document.getElementById('drawer-provider-name');
    const badgeEl = document.getElementById('drawer-provider-badge');
    const regionEl = document.getElementById('drawer-region');
    const channelsEl = document.getElementById('drawer-channels');
    const clusterEl = document.getElementById('drawer-cluster');
    const anomalyEl = document.getElementById('drawer-recent-anomaly');

    if (providerKey === 'gateway-b') {
      idEl.textContent = 'GW-MOCK-B';
      nameEl.textContent = 'Mock SIP Gateway B';
      badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-po-surface-container-highest text-po-secondary font-label-mono-xs text-[11px] font-semibold';
      badgeEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-po-secondary"></span>Degraded / Monitoring';
      regionEl.textContent = 'us-west-2 (Oregon)';
      channelsEl.textContent = '18 / 100 Allocated';
      clusterEl.textContent = 'cluster-sip-node-09';
      anomalyEl.innerHTML = '<span class="text-po-outline">14:34:00</span><span class="text-po-secondary font-medium">SIP 408 Request Timeout Reconciled</span>';
    } else {
      idEl.textContent = 'GW-MOCK-A';
      nameEl.textContent = 'Mock SIP Gateway A';
      badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-po-tertiary-fixed text-po-on-tertiary-fixed font-label-mono-xs text-[11px] font-semibold';
      badgeEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-po-on-tertiary-container"></span>Operational';
      regionEl.textContent = 'us-east-1 (N. Virginia)';
      channelsEl.textContent = '64 / 250 Allocated';
      clusterEl.textContent = 'cluster-sip-node-04';
      anomalyEl.innerHTML = '<span class="text-po-outline">14:34:00</span><span class="text-po-on-tertiary-container font-medium">OPTIONS sip-health-ping (200 OK)</span>';
    }

    backdrop.classList.remove('hidden');
    drawer.classList.remove('translate-x-full');
  }

  function closeDrawer() {
    const drawer = document.getElementById('provider-drawer');
    const backdrop = document.getElementById('provider-drawer-backdrop');
    drawer.classList.add('translate-x-full');
    setTimeout(() => {
      backdrop.classList.add('hidden');
    }, 200);
  }

  function triggerPingTest() {
    const btn = document.getElementById('btn-ping');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span><span>Pinging...</span>';
    setTimeout(() => {
      btn.innerHTML = '<span class="material-symbols-outlined text-[16px] text-po-on-tertiary-container">check</span><span>18ms RTT</span>';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 1800);
    }, 800);
  }

  function rerouteFallback() {
    const btn = document.getElementById('btn-reroute');
    btn.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">sync</span><span>Rerouting...</span>';
    setTimeout(() => {
      btn.innerHTML = 'Rerouted to GW-A';
      btn.className = 'h-8 px-3 rounded-lg bg-po-tertiary-fixed text-po-on-tertiary-fixed font-body-sm text-[12px] font-semibold transition-colors';
      setTimeout(() => {
        btn.innerHTML = 'Force Fallback';
        btn.className = 'h-8 px-3 rounded-lg bg-po-secondary text-po-on-secondary font-body-sm text-[12px] font-medium hover:bg-po-secondary-container transition-colors';
      }, 2200);
    }, 900);
  }

  function triggerReconnect() {
    const btn = document.getElementById('btn-reconnect');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">sync</span><span>Reconnecting...</span>';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = '<span class="material-symbols-outlined text-[14px] text-po-on-tertiary-container">done</span><span>Reconnected</span>';
      setTimeout(() => {
        btn.innerHTML = originalContent;
        btn.disabled = false;
      }, 1800);
    }, 1000);
  }

  function handleTelemetryRefresh() {
    const icon = document.getElementById('refresh-icon');
    icon.classList.add('animate-spin');
    setTimeout(() => {
      icon.classList.remove('animate-spin');
    }, 700);
  }

  return { closeDrawer, handleTelemetryRefresh, openDrawer, rerouteFallback, runSimulation, selectSimDuration, selectSimProvider, triggerPingTest, triggerReconnect, updateSimPreview };
}
