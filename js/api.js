// =============================
// Apps Script Web App endpoint
// =============================
// Replace with YOUR latest deployment URL
const GAS_BASE = "https://script.google.com/macros/s/AKfycbwepHg0_U6xclvSPqPnXVRv8wlgo7q4AaPHHUNx-HxYREabx5hI8AV7NPHdFx4HZsyNEQ/exec";

// Optional: console diagnostics
const API_DEBUG = true;

// Fetch with timeout
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 15000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err.name === 'AbortError'
      ? new Error('Request timed out. Check GAS URL, deployment access, or network.')
      : err;
  }
}

// POST wrapper (URL-encoded) to avoid CORS preflight
async function gasCall(fn, token, args = {}) {
  const body = new URLSearchParams({ fn, token: token || "", args: JSON.stringify(args) });

  let res;
  try {
    res = await fetchWithTimeout(GAS_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body
    });
  } catch (err) {
    if (API_DEBUG) console.error('gasCall network error:', err);
    return { ok: false, msg: err.message || 'Network error calling server' };
  }

  // Parse JSON (GAS sometimes returns HTML on auth errors)
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (API_DEBUG && !data?.ok) console.warn('gasCall app error:', data);
    return data;
  } catch {
    if (API_DEBUG) console.warn('Non-JSON response (first 200 chars):', text.slice(0,200));
    return { ok: false, msg: 'Server returned non-JSON. Verify GAS URL and set deployment access to "Anyone".' };
  }
}

// Expose API on window
window.API = {
  // Health
  ping: () => gasCall("ping", ""),

  // Auth
  authenticate: (u,p) => gasCall("authenticate", "", { username: u, password: p }),
  logout:       (t)   => gasCall("logout", t),

  // Common/Security
  getUserSessionInfo: (t) => gasCall("getUserSessionInfo", t),
  getLevelGroupOptions: () => gasCall("getLevelGroupOptions", ""),

  // Clients
  saveClientRegistration: (t, values, files) => gasCall("saveClientRegistration", t, { values, files }),
  getClientList:          (t, search) => gasCall("getClientList", t, { search }),
  getClientProfile:       (t, clientId) => gasCall("getClientProfile", t, { clientId }),
  updateClientProfile:    (t, clientId, data, files) => gasCall("updateClientProfile", t, { clientId, data, files }),
  getVesselsByCompName:   (t, compName) => gasCall("getVesselsByCompName", t, { compName }),

  // Vessels
  getOwnerNames:     (t) => gasCall("getOwnerNames", t),
  getInventoryNames: (t) => gasCall("getInventoryNames", t),
  getNewShipId:      (t) => gasCall("getNewShipId", t),
  saveVesselAll:     (t, payload) => gasCall("saveVesselAll", t, payload),
  updateVesselAll:   (t, payload) => gasCall("updateVesselAll", t, payload),
  getVesselKeys:     (t) => gasCall("getVesselKeys", t),
  getVesselByKey:    (t, req) => gasCall("getVesselByKey", t, req),
  searchVessels:     (t, filters) => gasCall("searchVessels", t, { filters }),
  getVesselStats:    (t) => gasCall("getVesselStats", t),
  listVesselsForUser:(t) => gasCall("listVesselsForUser", t),
  getVesselDetail:   (t, shipId) => gasCall("getVesselDetail", t, { shipId }),

  // Users
  createUserSubmit:   (t, payload)  => gasCall("createUserSubmit", t, payload),
  getDetailFormSchema:(t, groupId)  => gasCall("getDetailFormSchema", t, { groupId }),
  getDetailFormSchemaWithValues:(t, userId, groupId) => gasCall("getDetailFormSchemaWithValues", t, { userId, groupId }),
  saveDetailForm:     (t, payload)  => gasCall("saveDetailForm", t, payload),
  saveDetailFormUpdate:(t, payload) => gasCall("saveDetailFormUpdate", t, payload),
  getEditableUserList:(t) => gasCall("getEditableUserList", t),
  getUserBasic:       (t, userId) => gasCall("getUserBasic", t, { userId }),
  updateUserBasic:    (t, payload) => gasCall("updateUserBasic", t, payload),
  deleteUser:         (t, userId) => gasCall("deleteUser", t, { userId }),
  getMyProfile:       (t, hintUserId, hintUsername) => gasCall("getMyProfile", t, { hintUserId, hintUsername }),
};
