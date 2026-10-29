// Behaviour for the Agents screen, carried over from the Stitch prototype.
// It works on the DOM by element id, the same way the original page did.
// useScreen() calls mount() once the markup is rendered and removes the
// listeners it added when the page unmounts.

export function mount(ctx) {
  // Dynamic Agent Dataset for details drawer and table filtering
  const agentDatabase = {
    'AG-1024': {
      name: 'Alex Morgan',
      initials: 'AM',
      id: 'AG-1024',
      status: 'Connected',
      statusColorClass: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
      dotColor: 'bg-emerald-500 animate-pulse',
      campaign: 'Q3 Renewal Outreach',
      callId: '#SC-8921 (Live: 03m 42s)',
      audioProvider: 'Mock SIP Gateway (38ms ping)',
      route: 'Direct Voice Handshake',
      timeInState: '03m 42s',
      totalCalls: '28 calls (Avg duration: 02m 18s)',
      role: 'Senior Retention Specialist',
      timeline: [
        { time: '14:41:05', text: "Transferred from AI Screening Bot (Answered 'Willing')", color: 'bg-secondary' },
        { time: '14:38:20', text: 'Wrap-up completed for call #SC-8914', color: 'bg-outline' },
        { time: '14:35:10', text: 'Connected with contact on Q3 Renewal', color: 'bg-secondary-container' },
        { time: '14:20:00', text: 'Resumed from Paused (Break)', color: 'bg-outline-variant' }
      ]
    },
    'AG-1048': {
      name: 'Priya Sharma',
      initials: 'PS',
      id: 'AG-1048',
      status: 'Available',
      statusColorClass: 'bg-teal-50 border border-teal-200 text-teal-700',
      dotColor: 'bg-teal-500',
      campaign: 'Auto Claims Pilot',
      callId: '— (Ready in Queue)',
      audioProvider: 'WebRTC Web Gateway (12ms ping)',
      route: 'Low-latency RTP SIP trunk',
      timeInState: '14m 22s',
      totalCalls: '34 calls (Avg duration: 01m 55s)',
      role: 'Tier 2 Support Specialist',
      timeline: [
        { time: '14:28:10', text: 'Became Available after Call #SC-8902', color: 'bg-teal-500' },
        { time: '14:25:00', text: 'Call wrap-up noted: Policy endorsement confirmed', color: 'bg-outline' },
        { time: '14:12:44', text: 'Connected to Auto Claims dispatch', color: 'bg-secondary' }
      ]
    },
    'AG-1089': {
      name: 'Jordan Lee',
      initials: 'JL',
      id: 'AG-1089',
      status: 'Connected',
      statusColorClass: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
      dotColor: 'bg-emerald-500 animate-pulse',
      campaign: 'Cold Inquiries Tier 1',
      callId: '#SC-9042 (Live: 01m 15s)',
      audioProvider: 'Mock SIP Gateway (24ms ping)',
      route: 'Predictive Dial Handover',
      timeInState: '01m 15s',
      totalCalls: '19 calls (Avg duration: 02m 45s)',
      role: 'Outbound SDR Lead',
      timeline: [
        { time: '14:43:30', text: 'Handed off from dialer predictive trunk', color: 'bg-indigo-600' },
        { time: '14:40:12', text: 'Available standby queue', color: 'bg-teal-500' },
        { time: '14:25:00', text: 'Completed wrap-up for previous call', color: 'bg-slate-400' }
      ]
    },
    'AG-1102': {
      name: 'Sam Taylor',
      initials: 'ST',
      id: 'AG-1102',
      status: 'Reserved',
      statusColorClass: 'bg-amber-50 border border-amber-200 text-amber-700',
      dotColor: 'bg-amber-500',
      campaign: 'Q3 Renewal Outreach',
      callId: 'Pending Handshake',
      audioProvider: 'SIP-Sim v2 (32ms ping)',
      route: 'Direct Voice Handshake',
      timeInState: '45s',
      totalCalls: '22 calls (Avg duration: 02m 10s)',
      role: 'Account Escalation Rep',
      timeline: [
        { time: '14:44:00', text: 'Dialer reserved agent for imminent pickup', color: 'bg-amber-500' },
        { time: '14:42:15', text: 'Ready in queue', color: 'bg-outline' }
      ]
    },
    'AG-1115': {
      name: 'Maya Patel',
      initials: 'MP',
      id: 'AG-1115',
      status: 'Dialing',
      statusColorClass: 'bg-blue-50 border border-blue-200 text-blue-700',
      dotColor: 'bg-blue-500 animate-ping',
      campaign: 'Auto Claims Pilot',
      callId: '#SC-8819 (Ringing)',
      audioProvider: 'Mock SIP Gateway (41ms ping)',
      route: 'Progressive Outbound Flow',
      timeInState: '18s',
      totalCalls: '31 calls (Avg duration: 01m 40s)',
      role: 'Claims Intake Agent',
      timeline: [
        { time: '14:44:27', text: 'SIP INVITE transmitted for #SC-8819', color: 'bg-blue-500' }
      ]
    },
    'AG-1130': {
      name: 'Marcus Vance',
      initials: 'MV',
      id: 'AG-1130',
      status: 'Wrap-up',
      statusColorClass: 'bg-indigo-50 border border-indigo-200 text-indigo-700',
      dotColor: 'bg-indigo-500',
      campaign: 'Q3 Renewal Outreach',
      callId: '#SC-8740 (ended)',
      audioProvider: 'SIP-Sim v2 (36ms ping)',
      route: 'Direct Voice Handshake',
      timeInState: '01m 02s',
      totalCalls: '25 calls (Avg duration: 02m 30s)',
      role: 'Renewal Executive',
      timeline: [
        { time: '14:43:43', text: 'Contact hung up. In disposition state.', color: 'bg-indigo-500' }
      ]
    },
    'AG-1142': {
      name: 'Elena Rostova',
      initials: 'ER',
      id: 'AG-1142',
      status: 'Available',
      statusColorClass: 'bg-teal-50 border border-teal-200 text-teal-700',
      dotColor: 'bg-teal-500',
      campaign: 'Cold Inquiries Tier 1',
      callId: '— (Ready in Queue)',
      audioProvider: 'Mock SIP Gateway (29ms ping)',
      route: 'Direct Voice Handshake',
      timeInState: '05m 50s',
      totalCalls: '40 calls (Avg duration: 02m 05s)',
      role: 'Outbound Specialist',
      timeline: [
        { time: '14:38:55', text: 'Wrap-up disposition submitted', color: 'bg-teal-500' }
      ]
    },
    'AG-1165': {
      name: 'David Kim',
      initials: 'DK',
      id: 'AG-1165',
      status: 'Paused',
      statusColorClass: 'bg-slate-100 border border-slate-200 text-slate-700',
      dotColor: 'bg-slate-400',
      campaign: '—',
      callId: '—',
      audioProvider: 'Inactive',
      route: 'Standby Route',
      timeInState: '22m 14s',
      totalCalls: '15 calls (Avg duration: 02m 12s)',
      role: 'Customer Success Rep',
      timeline: [
        { time: '14:22:31', text: 'Agent marked state as Paused: Scheduled Break', color: 'bg-outline' }
      ]
    },
    'AG-1180': {
      name: 'Chloe Bennett',
      initials: 'CB',
      id: 'AG-1180',
      status: 'Connected',
      statusColorClass: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
      dotColor: 'bg-emerald-500 animate-pulse',
      campaign: 'Q3 Renewal Outreach',
      callId: '#SC-8699 (Live: 04m 10s)',
      audioProvider: 'Mock SIP Gateway (25ms ping)',
      route: 'Direct Voice Handshake',
      timeInState: '04m 10s',
      totalCalls: '27 calls (Avg duration: 02m 22s)',
      role: 'Senior Retention Specialist',
      timeline: [
        { time: '14:40:35', text: 'Connected with lead regarding contract term', color: 'bg-secondary' }
      ]
    },
    'AG-1194': {
      name: 'Lucas Chen',
      initials: 'LC',
      id: 'AG-1194',
      status: 'Offline',
      statusColorClass: 'bg-slate-100 border border-slate-200 text-slate-500',
      dotColor: 'bg-slate-400',
      campaign: '—',
      callId: '—',
      audioProvider: 'Session Teardown',
      route: 'Disconnected',
      timeInState: '01h 12m',
      totalCalls: '12 calls (Avg duration: 01m 45s)',
      role: 'Support Specialist',
      timeline: [
        { time: '13:32:40', text: 'Agent logged out of SIP cluster session', color: 'bg-outline-variant' }
      ]
    }
  };

  let isDrawerOpen = true;

  // Initialize and bind drawer interactions
  (() => {
    // Explicitly bind the Close Drawer Button
    const closeBtn = document.getElementById('close-drawer-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDrawer();
      });
    }

    // Keyboard support: Escape closes the drawer
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    });
  })();

  // Open Drawer and populate data
  function openDrawer(agentId) {
    const agent = agentDatabase[agentId];
    if (!agent) return;

    // Highlight row
    document.querySelectorAll('.agent-row').forEach(row => {
      row.classList.remove('bg-surface-container-high/30');
      if (row.getAttribute('data-agent-id') === agentId) {
        row.classList.add('bg-surface-container-high/30');
      }
    });

    // Populate Drawer DOM elements
    const avatarEl = document.getElementById('drawer-avatar');
    if (avatarEl) avatarEl.innerText = agent.initials;

    const nameEl = document.getElementById('drawer-name');
    if (nameEl) nameEl.innerText = agent.name;

    const idEl = document.getElementById('drawer-id');
    if (idEl) idEl.innerHTML = `${agent.id} &bull; ${agent.role}`;

    // Status Badge
    const badge = document.getElementById('drawer-status-badge');
    if (badge) {
      badge.className = `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-mono-xs font-label-mono-xs font-semibold ${agent.statusColorClass}`;
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${agent.dotColor}"></span> ${agent.status}`;
    }

    // Info grid
    const setDrawerText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    };
    setDrawerText('drawer-campaign', agent.campaign);
    setDrawerText('drawer-active-call', agent.callId);
    setDrawerText('drawer-audio-provider', agent.audioProvider);
    setDrawerText('drawer-route', agent.route);
    setDrawerText('drawer-time-state', agent.timeInState);
    setDrawerText('drawer-total-calls', agent.totalCalls);

    // Actions visibility based on status
    const connActions = document.getElementById('drawer-connected-actions');
    const availActions = document.getElementById('drawer-available-actions');
    const waveformBox = document.getElementById('drawer-waveform-box');

    if (agent.status === 'Connected') {
      if (connActions) connActions.classList.remove('hidden');
      if (availActions) availActions.classList.add('hidden');
      if (waveformBox) waveformBox.classList.remove('hidden');
    } else {
      if (connActions) connActions.classList.add('hidden');
      if (availActions) availActions.classList.remove('hidden');
      if (waveformBox) waveformBox.classList.add('hidden');
    }

    // Timeline Stream
    const timelineContainer = document.getElementById('drawer-timeline');
    if (timelineContainer) {
      timelineContainer.innerHTML = '';
      agent.timeline.forEach(event => {
        const el = document.createElement('div');
        el.className = 'relative flex flex-col gap-0.5';
        el.innerHTML = `
          <span class="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full ${event.color} ring-2 ring-white"></span>
          <span class="font-label-mono-xs text-label-mono-xs text-indigo-600 font-semibold">${event.time}</span>
          <span class="font-body-sm text-body-sm text-slate-800">${event.text}</span>
        `;
        timelineContainer.appendChild(el);
      });
    }

    // Slide drawer in smoothly
    const drawer = document.getElementById('agent-drawer');
    const backdrop = document.getElementById('drawer-backdrop');

    if (drawer) {
      drawer.classList.remove('translate-x-full');
      drawer.classList.add('translate-x-0', 'pointer-events-auto');
      drawer.setAttribute('aria-expanded', 'true');
    }
    if (backdrop) {
      backdrop.classList.remove('pointer-events-none', 'opacity-0');
      backdrop.classList.add('opacity-100', 'pointer-events-auto');
    }

    isDrawerOpen = true;
  }

  // Alias selectAgent to openDrawer for seamless row triggers
  function selectAgent(agentId) {
    openDrawer(agentId);
  }

  // Close Drawer function
  function closeDrawer() {
    const drawer = document.getElementById('agent-drawer');
    const backdrop = document.getElementById('drawer-backdrop');

    if (drawer) {
      drawer.classList.remove('translate-x-0');
      drawer.classList.add('translate-x-full');
      drawer.setAttribute('aria-expanded', 'false');
    }
    if (backdrop) {
      backdrop.classList.remove('opacity-100', 'pointer-events-auto');
      backdrop.classList.add('opacity-0', 'pointer-events-none');
    }

    // Un-highlight selected row
    document.querySelectorAll('.agent-row').forEach(row => {
      row.classList.remove('bg-surface-container-high/30');
    });

    isDrawerOpen = false;
    showToast('Agent details drawer closed. Click any agent row to re-open.');
  }

  // Filter Bar Toggles
  function toggleFilterBar() {
    const bar = document.getElementById('filter-bar');
    bar.classList.toggle('hidden');
  }

  // Quick Filter Pills
  function setQuickFilter(type) {
    // update pill UI
    const pills = document.querySelectorAll('#status-quick-pills .pill-btn');
    pills.forEach(p => {
      p.classList.remove('bg-slate-900', 'text-white', 'shadow-xs', 'active');
      p.classList.add('bg-slate-100', 'text-slate-700');
    });

    if (ctx.target) {
      ctx.target.classList.remove('bg-slate-100', 'text-slate-700');
      ctx.target.classList.add('bg-slate-900', 'text-white', 'shadow-xs', 'active');
    }

    const statusSelect = document.getElementById('filter-status-select');

    if (type === 'ALL') {
      statusSelect.value = '';
    } else if (type === 'Reserved_Dialing') {
      statusSelect.value = 'Reserved';
    } else if (type === 'Inactive') {
      statusSelect.value = 'Paused';
    } else {
      statusSelect.value = type;
    }

    filterAgentsTable();
  }

  // Table multi-filter handler
  function filterAgentsTable() {
    const query = document.getElementById('agent-search-input').value.toLowerCase();
    const statusVal = document.getElementById('filter-status-select').value;
    const campaignVal = document.getElementById('filter-campaign-select').value;

    const rows = document.querySelectorAll('#agent-table-body .agent-row');
    let visibleCount = 0;

    rows.forEach(row => {
      const agentId = row.getAttribute('data-agent-id');
      const agent = agentDatabase[agentId];
      if (!agent) return;

      const matchesSearch = agent.name.toLowerCase().includes(query) || agent.id.toLowerCase().includes(query);
      const matchesStatus = !statusVal || agent.status.toLowerCase() === statusVal.toLowerCase();
      const matchesCampaign = !campaignVal || agent.campaign.toLowerCase() === campaignVal.toLowerCase();

      if (matchesSearch && matchesStatus && matchesCampaign) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    document.getElementById('table-roster-count').innerText = `36 total • ${visibleCount} in view`;
  }

  // Sort Table
  function sortAgentsTable() {
    const sortVal = document.getElementById('sort-select').value;
    const tbody = document.getElementById('agent-table-body');
    const rows = Array.from(tbody.querySelectorAll('.agent-row'));

    rows.sort((a, b) => {
      const idA = a.getAttribute('data-agent-id');
      const idB = b.getAttribute('data-agent-id');
      const agentA = agentDatabase[idA];
      const agentB = agentDatabase[idB];

      if (sortVal === 'name') {
        return agentA.name.localeCompare(agentB.name);
      } else if (sortVal === 'time') {
        return agentA.timeInState.localeCompare(agentB.timeInState);
      } else {
        return 0;
      }
    });

    rows.forEach(r => tbody.appendChild(r));
    showToast(`Sorted table by ${sortVal}`);
  }

  // Reset Filters
  function resetAllFilters() {
    document.getElementById('agent-search-input').value = '';
    document.getElementById('filter-status-select').value = '';
    document.getElementById('filter-campaign-select').value = '';
    document.getElementById('sort-select').value = 'time';

    // reset pill
    setQuickFilter('ALL');
    filterAgentsTable();
    showToast('Filters reset to default.');
  }

  // Add Agent Modal Controls
  function openAddAgentModal() {
    const modal = document.getElementById('add-agent-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeAddAgentModal() {
    const modal = document.getElementById('add-agent-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  function handleCreateAgent(e) {
    e.preventDefault();
    closeAddAgentModal();
    showToast('Agent successfully registered and queued for provisioning.');
  }

  // Telemetry refresh trigger
  function refreshAgentTelemetry() {
    showToast('SIP cluster telemetry synchronized with 10 active trunks.');
  }

  // Action / Audio simulation
  function triggerAudioMonitor() {
    showToast('Connecting audio tap to simulated SIP socket (38ms latency)...');
  }

  function triggerAgentAction(actionName) {
    showToast(`${actionName} order dispatched.`);
  }

  // Notification Toast Helper
  function showToast(message) {
    const toast = document.getElementById('agent-action-toast');
    const msgEl = document.getElementById('toast-message');
    if (!toast) return;

    msgEl.innerText = message;
    toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10');
    }, 3200);
  }

  return { closeAddAgentModal, closeDrawer, filterAgentsTable, handleCreateAgent, openAddAgentModal, refreshAgentTelemetry, resetAllFilters, selectAgent, setQuickFilter, sortAgentsTable, toggleFilterBar, triggerAgentAction, triggerAudioMonitor };
}
