<script>
// =============================
// Apps Script Web App endpoint
// =============================
// TODO: Replace with YOUR deployed GAS Web App URL
const GAS_BASE = "https://script.google.com/macros/s/AKfycbwepHg0_U6xclvSPqPnXVRv8wlgo7q4AaPHHUNx-HxYREabx5hI8AV7NPHdFx4HZsyNEQ/exec";

// POST wrapper (URL-encoded) to avoid CORS preflight
async function gasCall(fn, token, args = {}) {
  const body = new URLSearchParams({ fn, token: token || "", args: JSON.stringify(args) });

  const res = await fetch(GAS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body
  });

  // If server throws an HTML error page, this protects us
  const data = await res.json().catch(() => ({ ok:false, msg:"Bad response from server" }));
  return data;
}

// Unified API surface
window.API = {
  // Auth
  authenticate: (u,p) => gasCall("authenticate", "", { username:u, password:p }),
  logout:   (t) => gasCall("logout", t),

  // Common/Security
  getUserSessionInfo: (t) => gasCall("getUserSessionInfo", t),
  getLevelGroupOptions: () => gasCall("getLevelGroupOptions", ""),

  // Clients
  saveClientRegistration: (t, values, files) => gasCall("saveClientRegistration", t, { values, files }),
  getClientList:          (t, search) => gasCall("getClientList", t, { search }),
  getClientProfile:       (t, clientId) => gasCall("getClientProfile", t, { clientId }),
  updateClientProfile:    (t, clientId, data, files) => gasCall("updateClientProfile", t, { clientId, data, files }),
  getVesselsByCompName:   (t, compName) => gasCall("getVesselsByCompName", t, { compName }),

  // Vessels (extend later if needed)
  getOwnerNames:   (t) => gasCall("getOwnerNames", t),

  // Users (extend later if needed)
  getEditableUserList:(t) => gasCall("getEditableUserList", t),
};
</script>