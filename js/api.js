<script>
// =============================
// Apps Script Web App endpoint
// =============================
// TODO: Replace with YOUR deployed GAS Web App URL (latest deployment URL)
const GAS_BASE = "https://script.google.com/macros/s/AKfycbwepHg0_U6xclvSPqPnXVRv8wlgo7q4AaPHHUNx-HxYREabx5hI8AV7NPHdFx4HZsyNEQ/exec";

// Optional: turn on to see details in console
const API_DEBUG = true;

// Helper: fetch with timeout
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 15000 } = options; // 15s default
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
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
      body,
      // No credentials/cookies; Apps Script "Anyone" deployment must be used
    });
  } catch (err) {
    if (API_DEBUG) console.error('gasCall network error:', err);
    return { ok: false, msg: err.message || 'Network error calling server' };
  }

  // If GAS returns HTML (login interstitial, error), json() will throw.
  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    if (API_DEBUG) {
      console.warn('gasCall non-JSON response (showing first 200 chars):', text.slice(0, 200));
    }
    // Common causes:
    // - GAS deployment not set to "Anyone" (returns Google login HTML)
    // - Wrong deployment URL
    // - Script error produced an HTML stack trace page
    return {
      ok: false,
      msg: 'Server returned an unexpected response (not JSON). ' +
           'Confirm your GAS web app URL and access level (Anyone).'
    };
  }

  if (API_DEBUG && !data?.ok) console.warn('gasCall app error:', data);
  return data;
}

// Unified API surface
window.API = {
  // Health check (useful in login screen)
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
</script>