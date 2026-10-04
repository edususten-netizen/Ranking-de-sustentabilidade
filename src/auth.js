// EduSusten - Sistema de Autenticação Google e Perfil da Escola
// Implementação do conceito Require Sign-In e função USEREMAIL()

const STORAGE_AUTH_KEY = 'edususten_google_user';
const STORAGE_PROFILES_KEY_PREFIX = 'edususten_school_profile_';

// Função solicitada: USEREMAIL()
// Retorna o e-mail do usuário autenticado no sistema
export function USEREMAIL() {
  const user = obterUsuarioAutenticado();
  return user ? user.email : '';
}

// Verifica se há usuário autenticado
export function estaAutenticado() {
  const user = obterUsuarioAutenticado();
  return Boolean(user && user.email);
}

// Retorna os dados do usuário autenticado
export function obterUsuarioAutenticado() {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler autenticação:', e);
    return null;
  }
}

// Efetua login com Conta Google
export function loginComGoogle(dadosCustomizados = null) {
  const usuario = dadosCustomizados || {
    email: 'edususten@gmail.com',
    nome: 'EduSusten Gestor Escolar',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    provedor: 'Google Accounts',
    autenticadoEm: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(usuario));
  window.dispatchEvent(new CustomEvent('edususten:auth-change', { detail: usuario }));
  return usuario;
}

// Efetua logout
export function logoutGoogle() {
  localStorage.removeItem(STORAGE_AUTH_KEY);
  window.dispatchEvent(new CustomEvent('edususten:auth-change', { detail: null }));
}

// Obtém o perfil da escola associado ao e-mail do usuário autenticado
export function obterPerfilEscola(email = null) {
  const targetEmail = email || USEREMAIL();
  if (!targetEmail) return null;

  try {
    const raw = localStorage.getItem(STORAGE_PROFILES_KEY_PREFIX + targetEmail);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Erro ao ler perfil da escola:', e);
  }

  // Perfil padrão se for a primeira vez
  return {
    email: targetEmail,
    nomeEscola: '',
    endereco: '',
    diretor: '',
    telefone: '',
    niveis: ['Fundamental', 'Medio'], // Opções: Fundamental, Medio
    anoCiclo: 2026,
    atualizadoEm: null
  };
}

// Salva o perfil da escola no armazenamento persistente
export function salvarPerfilEscola(dadosPerfil) {
  const email = dadosPerfil.email || USEREMAIL();
  if (!email) {
    throw new Error('Não há usuário autenticado para vincular o perfil.');
  }

  const payload = {
    ...dadosPerfil,
    email: email,
    atualizadoEm: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_PROFILES_KEY_PREFIX + email, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('edususten:profile-saved', { detail: payload }));
  return payload;
}
