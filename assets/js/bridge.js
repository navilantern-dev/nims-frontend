// ===== API Configuration =====
const API_CONFIG = {
  BASE_URL: 'https://script.google.com/macros/s/AKfycbx3Dflof6OShYQ_UZ407HEY68ikisTYB6aRpDTrndTEDM7qTweRk61WIKnmXtNmYO4ZfA/exec',
  TOKEN_KEY: 'navi_token'
};

// ===== Bridge Client =====
const Bridge = (() => {
  const getToken = () => localStorage.getItem(API_CONFIG.TOKEN_KEY) || '';
  const setToken = (t) => t && localStorage.setItem(API_CONFIG.TOKEN_KEY, t);
  const clearToken = () => localStorage.removeItem(API_CONFIG.TOKEN_KEY);

  async function call(action, options = {}) {
    const { body = null } = options;
    const token = getToken();
    
    // Build URL with all parameters (GET request to avoid CORS preflight)
    const url = new URL(API_CONFIG.BASE_URL);
    url.searchParams.set('action', action);
    if (token) url.searchParams.set('token', token);
    
    // Encode body as JSON string in URL parameter
    if (body && Object.keys(body).length > 0) {
      url.searchParams.set('data', JSON.stringify(body));
    }

    try {
      // Use GET to avoid CORS preflight issues
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // API Methods
  const api = {
    // Auth
    auth: {
      login: (username, password) => call('login', { body: { username, password } }),
      getSession: () => call('session'),
      logout: () => { clearToken(); return call('logout'); },
      changePassword: (currentPassword, newPassword) => 
        call('changePassword', { body: { currentPassword, newPassword } })
    },

    // Metadata
    meta: {
      logo: () => call('logo')
    },
    levels: () => call('levels'),
    groups: () => call('groups'),
    companies: () => call('companies'),

    // Users
    users: {
      list: () => call('listUsers'),
      get: (userId) => call('getUser', { body: { userId } }),
      create: (payload) => call('createUserLogin', { body: payload }),
      update: (payload) => call('updateUser', { body: payload }),
      delete: (userId) => call('deleteUser', { body: { userId } }),
      saveDetails: (payload) => call('saveUserDetails', { body: payload }),
      getDetailFormSchema: (groupId) => call('getDetailFormSchema', { body: { groupId } }),
      getDetailFormSchemaWithValues: (userId, groupId) => 
        call('getDetailFormSchemaWithValues', { body: { userId, groupId } }),
      saveDetailFormUpdate: (payload) => call('saveDetailFormUpdate', { body: payload }),
      getMyProfile: (userId, username) => call('getMyProfile', { body: { userId, username } })
    },

    // Clients
    clients: {
      save: (values, files) => call('saveClientRegistration', { body: { values, files } }),
      list: (searchQuery) => call('getClientList', { body: { searchQuery } }),
      getProfile: (clientId) => call('getClientProfile', { body: { clientId } }),
      getVesselsByCompName: (compName) => call('getVesselsByCompName', { body: { compName } }),
      update: (clientId, data, files) => 
        call('updateClientProfile', { body: { clientId, data, files } })
    },

    // Vessels
    vessels: {
      newShipId: () => call('getNewShipId'),
      getOwnerNames: () => call('getOwnerNames'),
      getInventoryNames: () => call('getInventoryNames'),
      getKeys: () => call('getVesselKeys'),
      getByKey: (keyType, keyValue) => 
        call('getVesselByKey', { body: { keyType, keyValue } }),
      save: (payload) => call('saveVesselAll', { body: payload }),
      update: (payload) => call('updateVesselAll', { body: payload }),
      list: () => call('listVesselsForUser'),
      getDetail: (shipId) => call('getVesselDetail', { body: { shipId } })
    }
  };

  // Guards - authentication helpers
  const Guards = {
    async requireAuth(selectors = {}) {
      try {
        const session = await hydrateIdentity(selectors);
        if (!session?.username) {
          throw new Error('Not authenticated');
        }
        return session;
      } catch (error) {
        window.location.href = '../index.html';
        return null;
      }
    }
  };

  // Storage helpers
  const Storage = {
    getToken,
    setToken,
    clearToken,
    clearSessionData: () => localStorage.clear()
  };

  // Utility functions
  async function hydrateIdentity(selectors = {}) {
    const { logoSel, nameSel, levelSel, groupSel, idSel } = selectors;
    
    try {
      const session = await api.auth.getSession();
      
      if (session?.token) setToken(session.token);
      
      if (logoSel && session?.logoUrl) {
        document.querySelectorAll(logoSel).forEach(el => el.src = session.logoUrl);
      }
      if (nameSel) {
        document.querySelectorAll(nameSel).forEach(el => 
          el.textContent = session.username || '—'
        );
      }
      if (levelSel) {
        document.querySelectorAll(levelSel).forEach(el => 
          el.textContent = session.levelName || session.userLevel || '—'
        );
      }
      if (groupSel) {
        document.querySelectorAll(groupSel).forEach(el => 
          el.textContent = session.userGroup || '—'
        );
      }
      if (idSel) {
        document.querySelectorAll(idSel).forEach(el => 
          el.textContent = session.userId || '—'
        );
      }
      
      return session;
    } catch (error) {
      console.error('Failed to hydrate identity:', error);
      return null;
    }
  }

  return {
    api,
    API: api,  // Alias for compatibility
    Guards,
    Storage,
    setToken,
    getToken,
    clearToken,
    hydrateIdentity,
    requireAuth: Guards.requireAuth
  };
})();

// Make Bridge available globally
window.Bridge = Bridge;

// IMPORTANT: Create NAVI alias for backward compatibility
window.NAVI = Bridge;