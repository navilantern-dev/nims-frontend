// ===== API Configuration =====
const API_CONFIG = {
  BASE_URL: 'https://script.google.com/macros/s/AKfycbwheh8OtV5OUJcBcUxHo4aMQVPIXZ3PkYT7RX1x_XUTiC85piRu8H6XsfxL6NssLGOZOQ/exec',
  TOKEN_KEY: 'navi_token'
};

// ===== Bridge Client =====
const Bridge = (() => {
  const getToken   = () => localStorage.getItem(API_CONFIG.TOKEN_KEY) || '';
  const setToken   = (t) => { if (t) localStorage.setItem(API_CONFIG.TOKEN_KEY, t); };
  const clearToken = () => localStorage.removeItem(API_CONFIG.TOKEN_KEY);

  async function call(action, options = {}) {
    const { body = null, token: tokenOverride } = options;
    const token = tokenOverride ?? getToken();

    const url = new URL(API_CONFIG.BASE_URL);
    url.searchParams.set('action', action);
    if (token) url.searchParams.set('token', token);
    if (body && Object.keys(body).length > 0) {
      url.searchParams.set('data', JSON.stringify(body));
    }
    // bust caches (important for Apps Script + GitHub Pages)
    url.searchParams.set('ts', Date.now());

    let data;
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
        mode: 'cors'
      });

      // GAS often returns 200 even on errors; we rely on body payload
      data = await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }

    // Unified unauthorized handling
    if (data && data.code === 401) {
      clearToken();
    }
    return data;
  }

  // ===== API Facade =====
  const api = {
    auth: {
      async login(username, password) {
        const res = await call('login', { body: { username, password } });
        if (res?.ok && res?.token) setToken(res.token);
        return res;
      },
      async getSession() {
        const res = await call('session');
        if (res?.ok && res?.token) setToken(res.token); // support token refresh/rotation
        return res;
      },
      async logout() {
        // Call server first (so it receives the token), THEN clear locally
        const res = await call('logout');
        clearToken();
        return res;
      },
      changePassword(currentPassword, newPassword) {
        return call('changePassword', { body: { currentPassword, newPassword } });
      }
    },

    // Metadata
    meta: {
      logo: () => call('logo')
    },
    levels:     () => call('levels'),
    groups:     () => call('groups'),
    companies:  () => call('companies'),

    // Users
    users: {
      list:    () => call('listUsers'),
      get:     (userId)                 => call('getUser', { body: { userId } }),
      create:  (payload)                => call('createUserLogin', { body: payload }),
      update:  (payload)                => call('updateUser', { body: payload }),
      delete:  (userId)                 => call('deleteUser', { body: { userId } }),
      saveDetails:                      (payload) => call('saveUserDetails', { body: payload }),
      getDetailFormSchema:              (groupId) => call('getDetailFormSchema', { body: { groupId } }),
      getDetailFormSchemaWithValues:    (userId, groupId) => call('getDetailFormSchemaWithValues', { body: { userId, groupId } }),
      saveDetailFormUpdate:             (payload) => call('saveDetailFormUpdate', { body: payload }),
      getMyProfile:                     (userId, username) => call('getMyProfile', { body: { userId, username } })
    },

    // Clients
    clients: {
      save:        (values, files)         => call('saveClientRegistration', { body: { values, files } }),
      list:        (searchQuery)           => call('getClientList', { body: { searchQuery } }),
      getProfile:  (clientId)              => call('getClientProfile', { body: { clientId } }),
      getVesselsByCompName: (compName)     => call('getVesselsByCompName', { body: { compName } }),
      update:      (clientId, data, files) => call('updateClientProfile', { body: { clientId, data, files } })
    },

    // Vessels
    vessels: {
      newShipId:        ()                    => call('getNewShipId'),
      getOwnerNames:    ()                    => call('getOwnerNames'),
      getInventoryNames:()                    => call('getInventoryNames'),
      getKeys:          ()                    => call('getVesselKeys'),
      getByKey:         (keyType, keyValue)   => call('getVesselByKey', { body: { keyType, keyValue } }),
      save:             (payload)             => call('saveVesselAll', { body: payload }),
      update:           (payload)             => call('updateVesselAll', { body: payload }),
      list:             ()                    => call('listVesselsForUser'),
      getDetail:        (shipId)              => call('getVesselDetail', { body: { shipId } })
    }
  };

  // ===== Auth Guards & Identity Hydration =====
  function normalizeUser(u = {}) {
    const userId  = u.userId  || u.USER_ID  || '';
    const levelId = u.levelId || u.USER_LEVELID || '';
    const groupId = u.groupId || u.USER_GROUP   || '';
    const levelName = u.levelName || '';
    const groupName = u.groupName || '';
    return {
    ...u,
    userId: String(userId || ''),
    levelId: String(levelId || ''),
    groupId: String(groupId || ''),
    levelName,
    groupName
    };
  }

  const Guards = {
    async requireAuth(selectors = {}) {
      try {
        const s = await api.auth.getSession();
        if (!s || !s.ok) throw new Error('Not authenticated');
        // (Optional) paint header chips, logo, etc.
        await hydrateIdentity(selectors, s);
        // ✅ return ONLY the user object so dashboard logic is simple
        return s.user || null;
        const user = normalizeUser(s.user || {});
        await hydrateIdentity(selectors, { ...s, user });
        return user;
      } catch (_) {
        window.location.href = '../index.html?err=' + encodeURIComponent('Please sign in');
        return null;
      }
    }
  };

  const Storage = {
    getToken, setToken, clearToken,
    clearSessionData: () => localStorage.clear()
  };

  function pick(obj, keys, fallback='—') {
    for (const k of keys) {
      const v = obj && obj[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return fallback;
  }

  async function hydrateIdentity(selectors = {}, sessionIn = null) {
    const s = sessionIn || (await api.auth.getSession());
    if (!s || !s.ok) return null;

    // Support either top-level or user.* fields
    const user = s.user || {};
    const identity = {
      username:  pick(s,   ['username'],  pick(user, ['username','USER_NAME','USERNAME'], '')),
      userId:    pick(s,   ['userId'],    pick(user, ['userId','USER_ID'], '')),
      levelName: pick(s,   ['levelName','userLevel'], pick(user, ['USER_LEVEL','level'], '')),
      userGroup: pick(s,   ['userGroup'], pick(user, ['USER_GROUP','group'], '')),
      logoUrl:   s.logoUrl || ''
    };

    const { logoSel, nameSel, levelSel, groupSel, idSel } = selectors;

    if (logoSel && identity.logoUrl) {
      document.querySelectorAll(logoSel).forEach(el => { el.src = identity.logoUrl; });
    }
    if (nameSel)  document.querySelectorAll(nameSel).forEach(el => { el.textContent  = identity.username || '—'; });
    if (levelSel) document.querySelectorAll(levelSel).forEach(el => { el.textContent = identity.levelName || '—'; });
    if (groupSel) document.querySelectorAll(groupSel).forEach(el => { el.textContent = identity.userGroup || '—'; });
    if (idSel)    document.querySelectorAll(idSel).forEach(el => { el.textContent    = identity.userId || '—'; });

    return Object.assign({}, s, identity);
  }

  return {
    api,
    API: api, // alias
    Guards,
    Storage,
    setToken, getToken, clearToken,
    hydrateIdentity,
    requireAuth: Guards.requireAuth
  };
})();

window.Bridge = Bridge;
window.NAVI   = Bridge; // backward compatibility
