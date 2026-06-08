const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const api = {
  async login(codigo) {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo })
    });
    return res.json();
  },

  async getCases(nivel, token) {
    const res = await fetch(`${API_URL}/api/cases/${nivel}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  async submitAttempt(casoId, resposta, token) {
    const res = await fetch(`${API_URL}/api/attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ caso_id: casoId, resposta_aluno: resposta })
    });
    return res.json();
  },

  async getProgress(token) {
    const res = await fetch(`${API_URL}/api/progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  async getDashboard(token) {
    const res = await fetch(`${API_URL}/api/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  async getCertificado(token) {
    const res = await fetch(`${API_URL}/api/certificado`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};
