// Behaviour for the Pacing & Safety screen, carried over from the Stitch prototype.
// It works on the DOM by element id, the same way the original page did.
// useScreen() calls mount() once the markup is rendered and removes the
// listeners it added when the page unmounts.

export function mount() {
  // Drawer open and populate logic
  function openDrawer(id, decision, campaign, trigger, mode, suggested, permitted) {
    document.getElementById('drawerDecisionId').textContent = '#' + id;

    const badge = document.getElementById('drawerDecisionBadge');
    badge.textContent = decision;
    badge.className = 'px-2 py-0.5 text-[10px] font-bold rounded ';

    if(decision === 'Approved') {
      badge.className += 'bg-emerald-100 text-emerald-800';
    } else if(decision === 'Blocked') {
      badge.className += 'bg-rose-100 text-rose-800';
    } else if(decision === 'Forced Progressive') {
      badge.className += 'bg-purple-100 text-purple-800';
    } else {
      badge.className += 'bg-amber-100 text-amber-800';
    }

    document.getElementById('drawerCampaign').textContent = campaign;
    document.getElementById('drawerTrigger').textContent = trigger;
    document.getElementById('drawerMode').textContent = mode;
    document.getElementById('drawerSuggested').textContent = suggested;
    document.getElementById('drawerPermitted').textContent = permitted;

    const drawer = document.getElementById('inspectorDrawer');
    drawer.classList.remove('hidden');
  }

  // Drawer close logic
  function closeDrawer() {
    const drawer = document.getElementById('inspectorDrawer');
    drawer.classList.add('hidden');
  }

  // Keyboard support: Escape to close drawer
  window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeDrawer();
    }
  });

  return { closeDrawer, openDrawer };
}
