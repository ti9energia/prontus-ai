'use client';

import { useLocale } from 'next-intl';

type Dict = Record<string, string>;

const CHROME: Record<string, Dict> = {
  split: { 'pt-BR': 'Dividir', en: 'Split', 'zh-CN': '分屏', 'fr-FR': 'Diviser' },
  closePane: { 'pt-BR': 'Fechar painel', en: 'Close pane', 'zh-CN': '关闭分栏', 'fr-FR': 'Fermer le volet' },
  newTab: { 'pt-BR': 'Nova aba', en: 'New tab', 'zh-CN': '新标签页', 'fr-FR': 'Nouvel onglet' },
  command: { 'pt-BR': 'Comandos', en: 'Commands', 'zh-CN': '命令', 'fr-FR': 'Commandes' },
  searchPlaceholder: {
    'pt-BR': 'Buscar ou abrir uma tela…',
    en: 'Search or open a screen…',
    'zh-CN': '搜索或打开页面…',
    'fr-FR': 'Rechercher ou ouvrir un écran…',
  },
  navigate: { 'pt-BR': 'Navegar', en: 'Go to', 'zh-CN': '前往', 'fr-FR': 'Aller à' },
  actions: { 'pt-BR': 'Ações rápidas', en: 'Quick actions', 'zh-CN': '快捷操作', 'fr-FR': 'Actions rapides' },
  openSplit: { 'pt-BR': 'Abrir em split', en: 'Open in split', 'zh-CN': '在分屏中打开', 'fr-FR': 'Ouvrir en volet' },
  askIris: { 'pt-BR': 'Perguntar à Íris', en: 'Ask Íris', 'zh-CN': '询问 Íris', 'fr-FR': 'Demander à Íris' },
  noResults: { 'pt-BR': 'Nada encontrado', en: 'Nothing found', 'zh-CN': '未找到', 'fr-FR': 'Aucun résultat' },
  owner: { 'pt-BR': 'Painel do Dono', en: 'Owner panel', 'zh-CN': '所有者面板', 'fr-FR': 'Espace propriétaire' },
  signOut: { 'pt-BR': 'Sair', en: 'Sign out', 'zh-CN': '退出登录', 'fr-FR': 'Se déconnecter' },
  newConsultation: { 'pt-BR': 'Nova consulta', en: 'New consultation', 'zh-CN': '新问诊', 'fr-FR': 'Nouvelle consultation' },
};

export function useChrome() {
  const locale = useLocale();
  return (key: keyof typeof CHROME) => CHROME[key]?.[locale] ?? CHROME[key]?.['pt-BR'] ?? String(key);
}
