  // config
  const GAS_BASE = "https://script.google.com/macros/s/AKfycbx6_Xq9_jRrXw0VgrmipJiRJ9kiV3wBFAbJMlkI04jLfdvyM_kNJuQ2IOmPycVu3hFHGw/exec"; // <-- your Web App URL

  // Simple POST wrapper (URL-encoded) to avoid CORS preflight
  async function gasCall(fn, token, args = {}) {
    const body = new URLSearchParams({
      fn,
      token: token || "",
      args: JSON.stringify(args)
    });

    const res = await fetch(GAS_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body
    });

    // If GAS returns non-JSON due to an error page, this can throw
    const data = await res.json().catch(() => ({ ok:false, msg:"Bad response from server" }));
    return data;
  }

  // Example API surface (map your old google.script.run calls here)
  const API = {
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

    // Vessels
    getOwnerNames:   (t) => gasCall("getOwnerNames", t),
    getInventoryNames:(t)=> gasCall("getInventoryNames", t),
    getNewShipId:    (t) => gasCall("getNewShipId", t),
    saveVesselAll:   (t, payload) => gasCall("saveVesselAll", t, payload),
    updateVesselAll: (t, payload) => gasCall("updateVesselAll", t, payload),
    getVesselKeys:   (t) => gasCall("getVesselKeys", t),
    getVesselByKey:  (t, req) => gasCall("getVesselByKey", t, req),
    searchVessels:   (t, filters) => gasCall("searchVessels", t, { filters }),
    getVesselStats:  (t) => gasCall("getVesselStats", t),
    listVesselsForUser: (t) => gasCall("listVesselsForUser", t),
    getVesselDetail: (t, shipId) => gasCall("getVesselDetail", t, { shipId }),

    // Users
    createUserSubmit:   (t, payload) => gasCall("createUserSubmit", t, payload),
    getDetailFormSchema:(t, groupId) => gasCall("getDetailFormSchema", t, { groupId }),
    getDetailFormSchemaWithValues:(t, userId, groupId) => gasCall("getDetailFormSchemaWithValues", t, { userId, groupId }),
    saveDetailForm:     (t, payload) => gasCall("saveDetailForm", t, payload),
    saveDetailFormUpdate:(t, payload)=> gasCall("saveDetailFormUpdate", t, payload),
    getEditableUserList:(t) => gasCall("getEditableUserList", t),
    getUserBasic:       (t, userId) => gasCall("getUserBasic", t, { userId }),
    updateUserBasic:    (t, payload) => gasCall("updateUserBasic", t, payload),
    deleteUser:         (t, userId) => gasCall("deleteUser", t, { userId }),
    getMyProfile:       (t, hintUserId, hintUsername) => gasCall("getMyProfile", t, { hintUserId, hintUsername }),
  };