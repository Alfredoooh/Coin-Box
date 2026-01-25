// utils/translations.ts
const translations = {
  pt: {
    profile: 'Perfil',
    settings: 'Configurações',
    help: 'Ajuda',
    logout: 'Sair',
    theme: 'Tema',
    darkMode: 'Modo Escuro',
    lightMode: 'Modo Claro',
    languageLabel: 'Idioma',
    portuguese: 'Português',
    english: 'Inglês',
    inicio: 'Início',
    canais: 'Canais',
    plataforma: 'Plataforma',
    tv: 'TV',
    newPost: 'Nova Publicação',
    createChannel: 'Criar Canal',
  },
  en: {
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help',
    logout: 'Logout',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    languageLabel: 'Language',
    portuguese: 'Portuguese',
    english: 'English',
    inicio: 'Home',
    canais: 'Channels',
    plataforma: 'Platform',
    tv: 'TV',
    newPost: 'New Post',
    createChannel: 'Create Channel',
  },
};

export const getTranslation = (language, key) => {
  return translations[language][key] || key;
};