// Behaviour for the Live Operations screen, carried over from the Stitch prototype.
// It works on the DOM by element id, the same way the original page did.
// useScreen() calls mount() once the markup is rendered and removes the
// listeners it added when the page unmounts.

export function mount() {
  function openDrawer(callData) {
    const drawer = document.getElementById('call-details-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (!drawer) return;

    if (callData) {
      if (callData.id) document.getElementById('drawer-call-id').innerText = callData.id;
      if (callData.campaign) document.getElementById('drawer-campaign-title').innerText = callData.campaign;
      if (callData.agent) {
        document.getElementById('drawer-agent-name').innerText = callData.agent;
        document.getElementById('drawer-agent-cta').innerText = 'View Agent (' + callData.agent + ')';
      }
      if (callData.agentId) document.getElementById('drawer-agent-badge').innerText = callData.agentId;
      if (callData.provider) document.getElementById('drawer-provider').innerText = callData.provider;
      if (callData.duration) document.getElementById('drawer-duration').innerText = callData.duration;
      if (callData.state) {
        document.getElementById('drawer-state-card').innerText = callData.state;
      }
    }

    drawer.style.display = 'flex';
    if (backdrop) backdrop.style.display = 'block';
  }

  function closeDrawer() {
    const drawer = document.getElementById('call-details-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) drawer.style.display = 'none';
    if (backdrop) backdrop.style.display = 'none';
  }

  // Attach click listeners to Call Queue rows
  (function() {
    const rows = document.querySelectorAll('.call-row');
    rows.forEach(function(row) {
      row.addEventListener('click', function() {
        const callData = {
          id: row.getAttribute('data-call-id'),
          campaign: row.getAttribute('data-campaign'),
          state: row.getAttribute('data-state'),
          agent: row.getAttribute('data-agent'),
          agentId: row.getAttribute('data-agent-id'),
          provider: row.getAttribute('data-provider'),
          duration: row.getAttribute('data-duration')
        };
        openDrawer(callData);
      });
    });

    // Close on Escape key
    window.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    });
  })();

  return { closeDrawer };
}
