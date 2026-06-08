import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [aluno, setAluno] = useState(JSON.parse(localStorage.getItem('aluno') || 'null'));

  const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('aluno', JSON.stringify(data.aluno));
    setToken(data.token);
    setAluno(data.aluno);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('aluno');
    setToken(null);
    setAluno(null);
  };

  return (
    <AuthContext.Provider value={{ token, aluno, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
