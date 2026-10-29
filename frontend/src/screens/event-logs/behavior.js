// Behaviour for the Event Logs & Recovery screen, carried over from the Stitch prototype.
// It works on the DOM by element id, the same way the original page did.
// useScreen() calls mount() once the markup is rendered and removes the
// listeners it added when the page unmounts.

export function mount() {
  (function initEventRecoveryEngine() {
    // 1. EVENT DRAWER ELEMENTS
    const eventDrawerOverlay = document.getElementById('eventDrawerOverlay');
    const eventDrawerPanel = document.getElementById('eventDrawerPanel');
    const closeEventDrawerBtn = document.getElementById('closeEventDrawerBtn');

    const drawerEventId = document.getElementById('drawerEventId');
    const drawerSeverityBadge = document.getElementById('drawerSeverityBadge');
    const drawerTimestamp = document.getElementById('drawerTimestamp');
    const drawerEventType = document.getElementById('drawerEventType');
    const drawerCallId = document.getElementById('drawerCallId');
    const drawerCampaign = document.getElementById('drawerCampaign');
    const drawerProvider = document.getElementById('drawerProvider');
    const drawerStatus = document.getElementById('drawerStatus');
    const drawerDesc = document.getElementById('drawerDesc');
    const drawerStored = document.getElementById('drawerStored');
    const drawerDecision = document.getElementById('drawerDecision');
    const drawerReason = document.getElementById('drawerReason');
    const drawerStateChange = document.getElementById('drawerStateChange');

    function openEventDrawer(row) {
      drawerEventId.textContent = row.dataset.id || 'EVT-00000';
      drawerSeverityBadge.textContent = row.dataset.sev || 'Info';
      drawerTimestamp.textContent = row.dataset.time || '';
      drawerEventType.textContent = row.dataset.type || '';
      drawerCallId.textContent = row.dataset.call || '';
      drawerCampaign.textContent = row.dataset.camp || '';
      drawerProvider.textContent = row.dataset.prov || '';
      drawerStatus.textContent = row.dataset.status || '';
      drawerDesc.textContent = row.dataset.desc || '';
      drawerStored.textContent = row.dataset.stored || '';
      drawerDecision.textContent = row.dataset.decision || '';
      drawerReason.textContent = row.dataset.reason || '';
      drawerStateChange.textContent = row.dataset.stateChange || '';

      // Update badge coloring
      if (row.dataset.sev === 'Error' || row.dataset.sev === 'Critical') {
        drawerSeverityBadge.className = 'rounded-po px-2 py-0.5 font-label-mono-xs text-label-mono-xs bg-po-error-container text-po-error font-bold';
      } else if (row.dataset.sev === 'Warning') {
        drawerSeverityBadge.className = 'rounded-po px-2 py-0.5 font-label-mono-xs text-label-mono-xs bg-po-secondary-fixed text-po-on-secondary-fixed font-semibold';
      } else {
        drawerSeverityBadge.className = 'rounded-po px-2 py-0.5 font-label-mono-xs text-label-mono-xs bg-po-surface-container text-po-on-surface font-semibold';
      }

      eventDrawerOverlay.classList.remove('hidden');
      requestAnimationFrame(() => {
        eventDrawerOverlay.classList.remove('opacity-0');
        eventDrawerPanel.classList.remove('translate-x-full');
      });
    }

    function closeEventDrawer() {
      eventDrawerOverlay.classList.add('opacity-0');
      eventDrawerPanel.classList.add('translate-x-full');
      setTimeout(() => {
        eventDrawerOverlay.classList.add('hidden');
      }, 300);
    }

    document.querySelectorAll('.event-row').forEach(row => {
      row.addEventListener('click', (e) => {
        openEventDrawer(row);
      });
    });

    closeEventDrawerBtn.addEventListener('click', closeEventDrawer);
    eventDrawerOverlay.addEventListener('click', (e) => {
      if (e.target === eventDrawerOverlay) closeEventDrawer();
    });

    // 2. RECOVERY DRAWER ELEMENTS
    const recoveryDrawerOverlay = document.getElementById('recoveryDrawerOverlay');
    const recoveryDrawerPanel = document.getElementById('recoveryDrawerPanel');
    const closeRecDrawerBtn = document.getElementById('closeRecDrawerBtn');
    const closeRecDrawerFooterBtn = document.getElementById('closeRecDrawerFooterBtn');

    const recDrawerId = document.getElementById('recDrawerId');
    const recDrawerCallId = document.getElementById('recDrawerCallId');
    const recDrawerOrigState = document.getElementById('recDrawerOrigState');
    const recDrawerCond = document.getElementById('recDrawerCond');
    const recDrawerProviderRes = document.getElementById('recDrawerProviderRes');
    const recDrawerActionTaken = document.getElementById('recDrawerActionTaken');
    const recStep1 = document.getElementById('recStep1');
    const recStep2 = document.getElementById('recStep2');
    const recStep3 = document.getElementById('recStep3');
    const recStep4 = document.getElementById('recStep4');
    const recStep5 = document.getElementById('recStep5');

    function openRecoveryDrawer(row) {
      recDrawerId.textContent = row.dataset.recId || '';
      recDrawerCallId.textContent = row.dataset.callId || '';
      recDrawerOrigState.textContent = row.dataset.origState || '';
      recDrawerCond.textContent = row.dataset.cond || '';
      recDrawerProviderRes.textContent = row.dataset.providerRes || '';
      recDrawerActionTaken.textContent = row.dataset.actionTaken || '';
      recStep1.textContent = row.dataset.step1 || '';
      recStep2.textContent = row.dataset.step2 || '';
      recStep3.textContent = row.dataset.step3 || '';
      recStep4.textContent = row.dataset.step4 || '';
      recStep5.textContent = row.dataset.step5 || '';

      recoveryDrawerOverlay.classList.remove('hidden');
      requestAnimationFrame(() => {
        recoveryDrawerOverlay.classList.remove('opacity-0');
        recoveryDrawerPanel.classList.remove('translate-x-full');
      });
    }

    function closeRecoveryDrawer() {
      recoveryDrawerOverlay.classList.add('opacity-0');
      recoveryDrawerPanel.classList.add('translate-x-full');
      setTimeout(() => {
        recoveryDrawerOverlay.classList.add('hidden');
      }, 300);
    }

    document.querySelectorAll('.recovery-row').forEach(row => {
      row.addEventListener('click', () => {
        openRecoveryDrawer(row);
      });
    });

    closeRecDrawerBtn.addEventListener('click', closeRecoveryDrawer);
    closeRecDrawerFooterBtn.addEventListener('click', closeRecoveryDrawer);
    recoveryDrawerOverlay.addEventListener('click', (e) => {
      if (e.target === recoveryDrawerOverlay) closeRecoveryDrawer();
    });

    // 3. TABLE FILTERING & SEARCH
    const filterEventType = document.getElementById('filterEventType');
    const filterProvider = document.getElementById('filterProvider');
    const filterCampaign = document.getElementById('filterCampaign');
    const filterSeverity = document.getElementById('filterSeverity');
    const filterStatus = document.getElementById('filterStatus');
    const globalSearchInput = document.getElementById('globalSearchInput');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const recordCountLabel = document.getElementById('recordCountLabel');
    const rows = Array.from(document.querySelectorAll('.event-row'));

    function applyFilters() {
      const typeVal = filterEventType.value;
      const provVal = filterProvider.value;
      const campVal = filterCampaign.value;
      const sevVal = filterSeverity.value;
      const statVal = filterStatus.value;
      const query = globalSearchInput.value.toLowerCase().trim();

      let visibleCount = 0;

      rows.forEach(r => {
        const rType = r.dataset.type || '';
        const rProv = r.dataset.prov || '';
        const rCamp = r.dataset.camp || '';
        const rSev = r.dataset.sev || '';
        const rStat = r.dataset.status || '';
        const textContent = (r.textContent || '').toLowerCase();

        const matchType = (typeVal === 'ALL' || rType === typeVal);
        const matchProv = (provVal === 'ALL' || rProv.includes(provVal));
        const matchCamp = (campVal === 'ALL' || rCamp.includes(campVal));
        const matchSev = (sevVal === 'ALL' || rSev === sevVal);
        const matchStat = (statVal === 'ALL' || rStat.includes(statVal));
        const matchQuery = !query || textContent.includes(query);

        if (matchType && matchProv && matchCamp && matchSev && matchStat && matchQuery) {
          r.style.display = '';
          visibleCount++;
        } else {
          r.style.display = 'none';
        }
      });

      recordCountLabel.textContent = `Showing ${visibleCount} of 1,435 events`;
    }

    [filterEventType, filterProvider, filterCampaign, filterSeverity, filterStatus].forEach(sel => {
      sel.addEventListener('change', applyFilters);
    });

    globalSearchInput.addEventListener('input', applyFilters);

    clearFiltersBtn.addEventListener('click', () => {
      filterEventType.value = 'ALL';
      filterProvider.value = 'ALL';
      filterCampaign.value = 'ALL';
      filterSeverity.value = 'ALL';
      filterStatus.value = 'ALL';
      globalSearchInput.value = '';
      applyFilters();
    });

    // 4. MICRO-INTERACTION BUTTONS (Feedback)
    const refreshBtn = document.getElementById('refreshDataBtn');
    const refreshIcon = document.getElementById('refreshIcon');
    refreshBtn.addEventListener('click', () => {
      refreshIcon.classList.add('animate-spin');
      refreshBtn.disabled = true;
      setTimeout(() => {
        refreshBtn.disabled = false;
      }, 600);
    });

    const exportBtn = document.getElementById('exportEventsBtn');
    exportBtn.addEventListener('click', () => {
      const orig = exportBtn.innerHTML;
      exportBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span><span>Exported!</span>';
      setTimeout(() => {
        exportBtn.innerHTML = orig;
      }, 1500);
    });

    const copyBtn = document.getElementById('copyJsonBtn');
    copyBtn.addEventListener('click', () => {
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">done</span><span>Copied to Clipboard</span>';
      setTimeout(() => {
        copyBtn.innerHTML = orig;
      }, 1500);
    });

  })();

  return {};
}
