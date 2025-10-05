// ===== API Configuration =====
const API_CONFIG = {
  // REPLACE THIS with your deployed Apps Script Web App URL
  BASE_URL: 'https://script.google.com/macros/s/AKfycbwxW6nCkYfVXzKDAw8krg-IJsn6vWhG5wFocMx_NxB3bOYWek4OU8dMucGMmYTIADBntQ/exec',
  TOKEN_KEY: 'navi_token'
};

// ===== Bridge Client =====
const Bridge = (() => {
  const getToken = () => localStorage.getItem(API_CONFIG.TOKEN_KEY) || '';
  const setToken = (t) => t && localStorage.setItem(API_CONFIG.TOKEN_KEY, t);
  const clearToken = () => localStorage.removeItem(API_CONFIG.TOKEN_KEY);

  async function call(action, options = {}) {
    const { body = null, query = {} } = options;
    const token = getToken();
    
    const url = new URL(API_CONFIG.BASE_URL);
    url.searchParams.set('action', action);
    if (token) url.searchParams.set('token', token);
    
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, v);
      }
    });

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify({ action, token, ...body }) : JSON.stringify({ action, token })
    };

    try {
      const response = await fetch(url.toString(), requestOptions);
      
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
    login: (username, password) => call('login', { body: { username, password } }),
    session: () => call('session'),
    logout: () => { clearToken(); return call('logout'); },
    changePassword: (currentPassword, newPassword) => 
      call('changePassword', { body: { currentPassword, newPassword } }),

    // Metadata
    logo: () => call('logo'),
    levels: () => call('levels'),
    groups: () => call('groups'),
    companies: () => call('companies'),

    // Users
    listUsers: () => call('listUsers'),
    getUser: (userId) => call('getUser', { body: { userId } }),
    createUserLogin: (payload) => call('createUserLogin', { body: payload }),
    updateUser: (payload) => call('updateUser', { body: payload }),
    deleteUser: (userId) => call('deleteUser', { body: { userId } }),
    saveUserDetails: (payload) => call('saveUserDetails', { body: payload }),
    getDetailFormSchema: (groupId) => call('getDetailFormSchema', { body: { groupId } }),
    getDetailFormSchemaWithValues: (userId, groupId) => 
      call('getDetailFormSchemaWithValues', { body: { userId, groupId } }),
    saveDetailFormUpdate: (payload) => call('saveDetailFormUpdate', { body: payload }),
    getMyProfile: (userId, username) => call('getMyProfile', { body: { userId, username } }),

    // Clients
    saveClientRegistration: (values, files) => 
      call('saveClientRegistration', { body: { values, files } }),
    getClientList: (searchQuery) => call('getClientList', { body: { searchQuery } }),
    getClientProfile: (clientId) => call('getClientProfile', { body: { clientId } }),
    getVesselsByCompName: (compName) => call('getVesselsByCompName', { body: { compName } }),
    updateClientProfile: (clientId, data, files) => 
      call('updateClientProfile', { body: { clientId, data, files } }),

    // Vessels
    getNewShipId: () => call('getNewShipId'),
    getOwnerNames: () => call('getOwnerNames'),
    getInventoryNames: () => call('getInventoryNames'),
    getVesselKeys: () => call('getVesselKeys'),
    getVesselByKey: (keyType, keyValue) => 
      call('getVesselByKey', { body: { keyType, keyValue } }),
    saveVesselAll: (payload) => call('saveVesselAll', { body: payload }),
    updateVesselAll: (payload) => call('updateVesselAll', { body: payload }),
    listVesselsForUser: () => call('listVesselsForUser'),
    getVesselDetail: (shipId) => call('getVesselDetail', { body: { shipId } }),
  };

  // Utility functions
  async function hydrateIdentity(selectors = {}) {
    const { logoSel, nameSel, levelSel, groupSel, idSel } = selectors;
    
    try {
      const session = await api.session();
      
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
          el.textContent = session.userLevel || '—'
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

  async function requireAuth(selectors) {
    try {
      const session = await hydrateIdentity(selectors);
      if (!session?.username) {
        throw new Error('Not authenticated');
      }
      return session;
    } catch (error) {
      window.location.href = 'login.html';
      return null;
    }
  }

  return {
    api,
    setToken,
    getToken,
    clearToken,
    hydrateIdentity,
    requireAuth
  };
})();

// Make Bridge available globally
window.Bridge = Bridge;