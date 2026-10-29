import { useEffect, useMemo, useRef } from "react";

// Runs a screen's prototype script once its markup is on the page, and returns
// ui(event), which the JSX uses to call the script's functions:
//
//   onClick={(e) => ui(e).openDrawer("AG-1024")}
//
// Any listeners the script adds while mounting are removed when the page
// unmounts, so moving between screens doesn't leave handlers behind.
export function useScreen(mount) {
  const actions = useRef({});
  const target = useRef(null);

  useEffect(() => {
    const added = [];
    const addEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      added.push([this, type, listener, options]);
      return addEventListener.call(this, type, listener, options);
    };
    try {
      actions.current = mount({ get target() { return target.current; } }) || {};
    } catch (err) {
      console.error("screen script failed to start", err);
    } finally {
      EventTarget.prototype.addEventListener = addEventListener;
    }
    return () => {
      for (const [el, type, listener, options] of added) {
        el.removeEventListener(type, listener, options);
      }
      actions.current = {};
    };
  }, [mount]);

  return useMemo(() => {
    const calls = new Proxy({}, {
      get: (_, name) => (...args) => actions.current[name]?.(...args),
    });
    return (event) => {
      target.current = event?.currentTarget ?? null;
      return calls;
    };
  }, []);
}
