// Behaviour for the Overview screen, carried over from the Stitch prototype.
// It works on the DOM by element id, the same way the original page did.
// useScreen() calls mount() once the markup is rendered and removes the
// listeners it added when the page unmounts.

export function mount() {
  // Simulation Trigger Notification
  function triggerSimulation() {
    const toast = document.getElementById('sim-toast');
    const btn = document.getElementById('run-sim-btn');
    if (!toast) return;

    btn.classList.add('opacity-75', 'cursor-not-allowed');
    btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span><span>Simulating...</span>';

    toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-[-20px]');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      dismissToast();
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
      btn.innerHTML = '<span class="material-symbols-outlined text-[17px] text-cyan-200">play_circle</span><span>Run Simulation</span>';
    }, 4500);
  }

  function dismissToast() {
    const toast = document.getElementById('sim-toast');
    if (!toast) return;
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-20px]');
  }

  return { dismissToast, triggerSimulation };
}
