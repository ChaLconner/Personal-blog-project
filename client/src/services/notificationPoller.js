import blogApi from './api';

// Adaptive notification poller using blogApi.getNotifications (incremental/ETag aware)
let pollingInterval = null;
let active = true;
let lastActivity = Date.now();
let userIdGlobal = null;
let listeners = new Set();

const resetActivityTimer = () => {
  lastActivity = Date.now();
  if (!active) {
    active = true;
    // restart with fast interval
    restartPolling();
  }
};

['mousemove', 'keydown', 'click'].forEach(event =>
  window.addEventListener(event, resetActivityTimer)
);

const notifyListeners = (payload) => {
  for (const cb of listeners) {
    try { cb(payload); } catch (e) { console.error('listener error', e); }
  }
};

const fetchNotifications = async (userId) => {
  if (!userId) return;
  const result = await blogApi.getNotifications(userId);
  if (result && result.success) {
    if (Array.isArray(result.data) && result.data.length > 0) {
      notifyListeners({ type: 'new', data: result.data });
    } else {
      notifyListeners({ type: 'none' });
    }
  } else {
    notifyListeners({ type: 'error', error: result?.error });
  }
};

const startPolling = (userId) => {
  if (!userId) throw new Error('userId is required to start polling');
  userIdGlobal = userId;
  if (pollingInterval) clearInterval(pollingInterval);

  const tick = async () => {
    const now = Date.now();
    const idleTime = now - lastActivity;

    if (idleTime > 60000 && active) {
      active = false;
      // will restart tick with slower interval
      restartPolling();
      return;
    }

    await fetchNotifications(userIdGlobal);
  };

  // start with immediate fetch and then interval
  tick();
  pollingInterval = setInterval(tick, active ? 15000 : 60000);
};

const restartPolling = () => {
  clearInterval(pollingInterval);
  // If active is false start with slow interval, else fast
  pollingInterval = setInterval(async () => {
    await fetchNotifications(userIdGlobal);
  }, active ? 15000 : 60000);
};

const stopPolling = () => {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = null;
};

const addListener = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export default {
  startPolling,
  stopPolling,
  restartPolling,
  addListener,
};
