// Behaviour for the Campaigns screen, carried over from the Stitch prototype.
// It works on the DOM by element id, the same way the original page did.
// useScreen() calls mount() once the markup is rendered and removes the
// listeners it added when the page unmounts.

export function mount() {
  // In-memory dataset
  const campaignsData = [
    {
      id: "#CMP-104",
      name: "Q3 Renewal Outreach",
      desc: "Expiring enterprise licenses auto-dialer",
      status: "Running",
      mode: "Predictive",
      screening: "AI Screened",
      screeningEngine: "Voice Bot DialX-v2.1",
      targets: "2,500",
      dialed: "842",
      connectedPct: "33.7%",
      pool: "Retention Specialists (12)",
      attempts: "1,420",
      respondents: "885 (62.3% yield)",
      lastUpdated: "2m ago"
    },
    {
      id: "#CMP-102",
      name: "Auto Claims Pilot",
      desc: "First notice of loss callback pipeline",
      status: "Running",
      mode: "Progressive",
      screening: "AI Screened",
      screeningEngine: "Voice Bot DialX-v2.1",
      targets: "1,200",
      dialed: "410",
      connectedPct: "34.2%",
      pool: "Claims Adjusters (8)",
      attempts: "730",
      respondents: "432 (59.2% yield)",
      lastUpdated: "5m ago"
    },
    {
      id: "#CMP-099",
      name: "Cold Inquiries Tier 1",
      desc: "High-cadence qualification queue",
      status: "Running",
      mode: "Predictive",
      screening: "AI Screened",
      screeningEngine: "Voice Bot DialX-v2.1",
      targets: "5,000",
      dialed: "1,890",
      connectedPct: "37.8%",
      pool: "SDR Outbound (16)",
      attempts: "3,120",
      respondents: "1,980 (63.4% yield)",
      lastUpdated: "Just now"
    },
    {
      id: "#CMP-087",
      name: "Customer Follow-up",
      desc: "Post-resolution satisfaction checkpoints",
      status: "Paused",
      mode: "Progressive",
      screening: "Direct Dial",
      screeningEngine: "Disabled",
      targets: "800",
      dialed: "620",
      connectedPct: "77.5%",
      pool: "Shared Roster Pool",
      attempts: "620",
      respondents: "620 (100% direct)",
      lastUpdated: "22m ago"
    },
    {
      id: "#CMP-110",
      name: "Premium Member Retention",
      desc: "VIP escalation and custom portfolio renewals",
      status: "Running",
      mode: "Predictive",
      screening: "AI Screened",
      screeningEngine: "Voice Bot DialX-v2.1",
      targets: "1,500",
      dialed: "520",
      connectedPct: "34.7%",
      pool: "VIP Tier 1 (6)",
      attempts: "910",
      respondents: "560 (61.5% yield)",
      lastUpdated: "12m ago"
    },
    {
      id: "#CMP-071",
      name: "Service Feedback",
      desc: "Quarterly customer pulse survey",
      status: "Completed",
      mode: "Progressive",
      screening: "Direct Dial",
      screeningEngine: "Disabled",
      targets: "3,000",
      dialed: "2,890",
      connectedPct: "96.3%",
      pool: "Shared Roster Pool",
      attempts: "2,890",
      respondents: "2,890 (Direct)",
      lastUpdated: "1d ago"
    },
    {
      id: "#CMP-115",
      name: "Q4 Inactive Accounts",
      desc: "Dormant client wake-up campaign configuration",
      status: "Draft",
      mode: "Predictive",
      screening: "AI Screened",
      screeningEngine: "Voice Bot DialX-v2.1",
      targets: "4,000",
      dialed: "0",
      connectedPct: "0.0%",
      pool: "SDR Outbound (16)",
      attempts: "0",
      respondents: "0 (0% yield)",
      lastUpdated: "3h ago"
    }
  ];

  let selectedCampaignIndex = 0;
  let menuTargetCampaignIndex = 0;

  // Sidebar Collapse

  // Filter Popover
  function toggleFilterMenu() {
    const popover = document.getElementById('filter-menu-popover');
    popover.classList.toggle('hidden');
  }

  window.addEventListener('click', function(event) {
    const filterContainer = document.getElementById('filter-dropdown-container');
    const popover = document.getElementById('filter-menu-popover');
    if (filterContainer && !filterContainer.contains(event.target)) {
      popover.classList.add('hidden');
    }

    // Hide table action popup if clicked outside
    const popup = document.getElementById('table-popup-menu');
    if (popup && !popup.contains(event.target) && !event.target.closest('.action-menu-trigger')) {
      popup.classList.add('hidden');
    }
  });

  // Keyboard support: Escape closes modal & drawer
  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeDetailsDrawer();
      closeCreateModal();
      const popup = document.getElementById('table-popup-menu');
      if (popup) popup.classList.add('hidden');
    }
  });

  // Table Search & Filter
  function filterCampaignRows() {
    const query = document.getElementById('campaign-search-input').value.toLowerCase().trim();
    const rows = document.querySelectorAll('.campaign-row');
    let visibleCount = 0;

    rows.forEach(row => {
      const name = row.getAttribute('data-name').toLowerCase();
      const status = row.getAttribute('data-status').toLowerCase();
      const mode = row.getAttribute('data-mode').toLowerCase();

      const matches = name.includes(query) || status.includes(query) || mode.includes(query);
      if (matches) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    updateCounter(visibleCount);
  }

  function applyDropdownFilters() {
    const statusVal = document.getElementById('filter-select-status').value;
    const modeVal = document.getElementById('filter-select-mode').value;
    const screeningVal = document.getElementById('filter-select-screening').value;
    const indicator = document.getElementById('active-filter-indicator');

    const hasFilter = statusVal !== 'ALL' || modeVal !== 'ALL' || screeningVal !== 'ALL';
    if (hasFilter) indicator.classList.remove('hidden');
    else indicator.classList.add('hidden');

    const rows = document.querySelectorAll('.campaign-row');
    let visibleCount = 0;

    rows.forEach(row => {
      const rStatus = row.getAttribute('data-status');
      const rMode = row.getAttribute('data-mode');
      const rScreening = row.getAttribute('data-screening');

      const matchStatus = (statusVal === 'ALL' || rStatus === statusVal);
      const matchMode = (modeVal === 'ALL' || rMode === modeVal);
      const matchScreening = (screeningVal === 'ALL' || rScreening === screeningVal);

      if (matchStatus && matchMode && matchScreening) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    updateCounter(visibleCount);
  }

  function quickFilterStatus(status) {
    document.querySelectorAll('.status-tab').forEach(tab => {
      if (tab.innerText.includes(status) || (status === 'ALL' && tab.innerText.includes('All States'))) {
        tab.className = 'status-tab px-2.5 py-1 rounded-md bg-white border border-[#E5EAF1] text-blue-600 font-semibold text-[11.5px] shadow-2xs cursor-pointer transition-all';
      } else {
        tab.className = 'status-tab px-2.5 py-1 rounded-md text-slate-600 hover:bg-slate-100 text-[11.5px] font-medium cursor-pointer transition-all';
      }
    });

    const rows = document.querySelectorAll('.campaign-row');
    let visibleCount = 0;
    rows.forEach(row => {
      const rStatus = row.getAttribute('data-status');
      if (status === 'ALL' || rStatus === status) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    updateCounter(visibleCount);
  }

  function resetFilters() {
    document.getElementById('campaign-search-input').value = '';
    document.getElementById('filter-select-status').value = 'ALL';
    document.getElementById('filter-select-mode').value = 'ALL';
    document.getElementById('filter-select-screening').value = 'ALL';
    document.getElementById('active-filter-indicator').classList.add('hidden');
    quickFilterStatus('ALL');
  }

  function updateCounter(count) {
    const counter = document.getElementById('campaign-counter-badge');
    if (counter) counter.textContent = `12 total • ${count} in view`;
  }

  // Refresh Table Animation
  function refreshTableData() {
    const icon = document.getElementById('refresh-icon');
    icon.classList.add('rotate-180');
    setTimeout(() => {
      icon.classList.remove('rotate-180');
      showToast('Dataset Refreshed', 'Telemetry streams and connected counts synced.');
    }, 500);
  }

  // Action Menu Popup Controller
  function toggleActionMenu(event, index) {
    event.stopPropagation();
    menuTargetCampaignIndex = index;
    const targetCamp = campaignsData[index];
    const menu = document.getElementById('table-popup-menu');

    const pauseText = document.getElementById('menu-pause-text');
    const pauseIcon = document.getElementById('menu-pause-icon');
    if (targetCamp.status === 'Running') {
      pauseText.textContent = 'Pause Campaign';
      pauseIcon.textContent = 'pause';
    } else {
      pauseText.textContent = 'Resume Campaign';
      pauseIcon.textContent = 'play_arrow';
    }

    // Position the menu
    const rect = event.currentTarget.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
    menu.style.left = `${Math.min(rect.right - 180, window.innerWidth - 200)}px`;
    menu.classList.remove('hidden');
  }

  function handleMenuAction(action) {
    const popup = document.getElementById('table-popup-menu');
    popup.classList.add('hidden');

    if (action === 'view') {
      openDetailsDrawer(menuTargetCampaignIndex);
    } else if (action === 'edit') {
      openDetailsDrawer(menuTargetCampaignIndex);
      showToast('Configuration Ready', `Editing rules for ${campaignsData[menuTargetCampaignIndex].name}`);
    } else if (action === 'toggle-pause') {
      selectedCampaignIndex = menuTargetCampaignIndex;
      togglePauseCurrentCampaign();
    } else if (action === 'duplicate') {
      selectedCampaignIndex = menuTargetCampaignIndex;
      duplicateCurrentCampaign();
    } else if (action === 'stop') {
      selectedCampaignIndex = menuTargetCampaignIndex;
      confirmStopCampaign();
    }
  }

  // Slide-over Drawer
  function openDetailsDrawer(index) {
    selectedCampaignIndex = index;
    const c = campaignsData[index];
    if (!c) return;

    document.getElementById('drawer-campaign-id').textContent = c.id;
    document.getElementById('drawer-campaign-name').textContent = c.name;
    document.getElementById('drawer-mode').textContent = c.mode;
    document.getElementById('drawer-targets').textContent = `${c.dialed} / ${c.targets}`;
    document.getElementById('drawer-pool').textContent = c.pool;

    // Conditional Screening display
    const isScreened = c.screening.includes('AI');
    const screeningBox = document.getElementById('drawer-screening-box');
    const attemptsBox = document.getElementById('drawer-screen-attempts-box');
    const willingBox = document.getElementById('drawer-willing-box');

    if (isScreened) {
      screeningBox.style.display = '';
      attemptsBox.style.display = '';
      willingBox.style.display = '';
      document.getElementById('drawer-screening').textContent = c.screeningEngine || 'Voice Bot DialX-v2.1';
      document.getElementById('drawer-screening-attempts').textContent = c.attempts || '1,420';
      document.getElementById('drawer-willing').textContent = c.respondents || '885 (62.3% yield)';
    } else {
      document.getElementById('drawer-screening').textContent = 'Direct Dial (No Bot)';
      attemptsBox.style.display = 'none';
      willingBox.style.display = 'none';
    }

    const statusBadge = document.getElementById('drawer-campaign-status');
    const pauseBtn = document.getElementById('drawer-toggle-pause-btn');

    if (c.status === 'Running') {
      statusBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold border border-emerald-200/60';
      statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Running';
      pauseBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">pause</span><span>Pause Campaign</span>';
    } else if (c.status === 'Paused') {
      statusBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-mono text-[11px] font-semibold border border-amber-200/60';
      statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Paused';
      pauseBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">play_arrow</span><span>Resume Campaign</span>';
    } else {
      statusBadge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200';
      statusBadge.innerHTML = c.status;
      pauseBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">restart_alt</span><span>Reactivate</span>';
    }

    const drawer = document.getElementById('details-drawer');
    const backdrop = document.getElementById('details-backdrop');

    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');
    drawer.classList.remove('translate-x-full');
  }

  function closeDetailsDrawer() {
    const drawer = document.getElementById('details-drawer');
    const backdrop = document.getElementById('details-backdrop');
    if (drawer) drawer.classList.add('translate-x-full');
    if (backdrop) {
      backdrop.classList.remove('opacity-100');
      backdrop.classList.add('opacity-0', 'pointer-events-none');
    }
  }

  function togglePauseCurrentCampaign() {
    const c = campaignsData[selectedCampaignIndex];
    if (c.status === 'Running') {
      c.status = 'Paused';
      showToast('Campaign Paused', `${c.name} has been paused.`);
    } else {
      c.status = 'Running';
      showToast('Campaign Resumed', `${c.name} is now actively dispatching.`);
    }
    openDetailsDrawer(selectedCampaignIndex);
  }

  function confirmStopCampaign() {
    const c = campaignsData[selectedCampaignIndex];
    if (confirm(`Are you sure you want to stop "${c.name}"? This terminates active calls and archives the campaign.`)) {
      c.status = 'Completed';
      showToast('Campaign Stopped', `${c.name} moved to completed state.`);
      closeDetailsDrawer();
    }
  }

  function duplicateCurrentCampaign() {
    const original = campaignsData[selectedCampaignIndex];
    const dup = {
      ...original,
      id: `#CMP-${116 + campaignsData.length}`,
      name: `${original.name} (Copy)`,
      status: 'Draft',
      dialed: '0',
      connectedPct: '0.0%',
      lastUpdated: 'Just now'
    };
    campaignsData.unshift(dup);
    showToast('Campaign Duplicated', `Created "${dup.name}" as Draft.`);
    closeDetailsDrawer();
    renderNewRow(dup);
  }

  function openEditModalFromDrawer() {
    const c = campaignsData[selectedCampaignIndex];
    showToast('Editor Ready', `Loaded configuration parameters for ${c.id}`);
  }

  // Modal Controller
  function openCreateModal() {
    const backdrop = document.getElementById('create-modal-backdrop');
    const container = document.getElementById('create-modal-container');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');
    container.classList.remove('scale-95');
    container.classList.add('scale-100');
  }

  function closeCreateModal() {
    const backdrop = document.getElementById('create-modal-backdrop');
    const container = document.getElementById('create-modal-container');
    if (container) {
      container.classList.remove('scale-100');
      container.classList.add('scale-95');
    }
    if (backdrop) {
      backdrop.classList.remove('opacity-100');
      backdrop.classList.add('opacity-0', 'pointer-events-none');
    }
  }

  function toggleScreeningOptions(enabled) {
    const panel = document.getElementById('screening-conditional-panel');
    if (enabled) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  }

  function renderNewRow(newCampaign) {
    const tbody = document.getElementById('campaign-table-body');
    const newRow = document.createElement('tr');
    newRow.className = 'h-12 hover:bg-blue-50/30 cursor-pointer transition-colors campaign-row group';
    newRow.setAttribute('data-name', newCampaign.name);
    newRow.setAttribute('data-status', newCampaign.status);
    newRow.setAttribute('data-mode', newCampaign.mode);
    newRow.setAttribute('data-screening', newCampaign.screening);
    newRow.onclick = () => openDetailsDrawer(0);

    newRow.innerHTML = `
      <td class="py-2.5 px-4">
        <div class="flex flex-col">
          <div class="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-blue-600">
            <span>${newCampaign.name}</span>
            <span class="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-normal border border-blue-100">${newCampaign.id}</span>
          </div>
          <span class="font-mono text-[10.5px] text-slate-400 truncate max-w-xs">${newCampaign.desc || 'Outreach campaign'}</span>
        </div>
      </td>
      <td class="py-2.5 px-3 whitespace-nowrap">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${newCampaign.status === 'Running' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-slate-100 text-slate-600 border-slate-200'} font-mono text-[11px] font-semibold border">
          <span class="w-1.5 h-1.5 rounded-full ${newCampaign.status === 'Running' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}"></span>
          ${newCampaign.status}
        </span>
      </td>
      <td class="py-2.5 px-3 whitespace-nowrap">
        <span class="inline-flex items-center px-2 py-0.5 rounded ${newCampaign.mode === 'Predictive' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-teal-50 text-teal-700 border-teal-100'} font-mono text-[11px] font-medium border">${newCampaign.mode}</span>
      </td>
      <td class="py-2.5 px-3 whitespace-nowrap">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded ${newCampaign.screening.includes('AI') ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-100 text-slate-700 border-slate-200'} font-mono text-[11px] font-medium border">
          ${newCampaign.screening.includes('AI') ? '<span class="material-symbols-outlined text-[13px]">smart_toy</span>' : ''}
          ${newCampaign.screening}
        </span>
      </td>
      <td class="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
        <div class="flex flex-col items-end">
          <span class="text-slate-900 font-semibold">${newCampaign.targets}</span>
          <div class="w-16 h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
            <div class="h-full bg-blue-600 rounded-full" style="width: 2%"></div>
          </div>
        </div>
      </td>
      <td class="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
        <span class="text-slate-900 font-semibold">0</span>
        <span class="text-slate-400 text-[10.5px] ml-1">(0.0%)</span>
      </td>
      <td class="py-2.5 px-3 text-slate-600 whitespace-nowrap">
        <div class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[15px] text-slate-400">support_agent</span>
          <span class="truncate">${newCampaign.pool}</span>
        </div>
      </td>
      <td class="py-2.5 px-3 font-mono text-[11px] text-emerald-600 font-semibold whitespace-nowrap">Just now</td>
      <td class="py-2.5 px-3 text-center" onclick="event.stopPropagation()">
        <button class="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 action-menu-trigger" onclick="toggleActionMenu(event, 0)">
          <span class="material-symbols-outlined text-[16px]">more_vert</span>
        </button>
      </td>
    `;

    tbody.insertBefore(newRow, tbody.firstChild);
    updateCounter(document.querySelectorAll('.campaign-row').length);
  }

  function handleCreateCampaign(e) {
    e.preventDefault();
    const name = document.getElementById('modal-input-name').value;
    const targets = document.getElementById('modal-input-targets').value;
    const mode = document.querySelector('input[name="dial_mode"]:checked').value;
    const screening = document.getElementById('modal-screening-toggle').checked ? 'AI Screened' : 'Direct Dial';
    const pool = document.getElementById('modal-input-pool').value;
    const desc = document.getElementById('modal-input-desc').value || 'High yield outbound outreach flow';

    const newCampaign = {
      id: `#CMP-${116 + campaignsData.length}`,
      name: name,
      desc: desc,
      status: 'Running',
      mode: mode,
      screening: screening,
      screeningEngine: screening.includes('AI') ? 'Voice Bot DialX-v2.1' : 'Disabled',
      targets: Number(targets).toLocaleString(),
      dialed: '0',
      connectedPct: '0.0%',
      pool: pool,
      attempts: '0',
      respondents: '0 (0% yield)',
      lastUpdated: 'Just now'
    };

    campaignsData.unshift(newCampaign);
    renderNewRow(newCampaign);

    closeCreateModal();
    document.getElementById('create-campaign-form').reset();
    showToast('Campaign Launched', `"${name}" is active and queuing calls.`);
  }

  // Toast Utility
  function showToast(title, message) {
    const toast = document.getElementById('action-toast');
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-msg').textContent = message;

    toast.classList.remove('translate-y-16', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-16', 'opacity-0');
    }, 3500);
  }

  return { applyDropdownFilters, closeCreateModal, closeDetailsDrawer, confirmStopCampaign, duplicateCurrentCampaign, filterCampaignRows, handleCreateCampaign, handleMenuAction, openCreateModal, openDetailsDrawer, openEditModalFromDrawer, quickFilterStatus, refreshTableData, resetFilters, toggleActionMenu, toggleFilterMenu, togglePauseCurrentCampaign, toggleScreeningOptions };
}
