export const ACCESS_LEVELS = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'administrador',
  EDITOR: 'editor',
  VIEWER: 'leitor',
} as const;

export type KnownAccessLevel = (typeof ACCESS_LEVELS)[keyof typeof ACCESS_LEVELS];

export const USER_ROLE_STORAGE_KEY = 'usuarioPerfil';
export const USER_UTEC_SCOPE_STORAGE_KEY = 'usuarioEscopoUtec';
export const USER_VIEW_ALL_UTECS_STORAGE_KEY = 'usuarioVerTodasUtecs';

export interface UserScopeInfo {
  tipoUsuario: string;
  utecScope: string;
  verTodasUtecs: boolean;
}

/**
 * Normaliza o nível de acesso do usuário.
 * Matriz de Permissões:
 * - Admin Supremo: 'superadmin'
 * - Admin Padrão: 'administrador'
 * - Editor (Escopo UTEC): 'editor'
 * - Leitor: 'leitor'
 */
export function normalizeAccessLevel(value: unknown): KnownAccessLevel | string {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    normalized.includes('superadmin') ||
    normalized.includes('adminsupremo') ||
    normalized.includes('admin_supremo') ||
    normalized.includes('supremo')
  ) {
    return ACCESS_LEVELS.SUPERADMIN;
  }
  if (normalized.includes('admin')) {
    return ACCESS_LEVELS.ADMIN;
  }
  if (normalized.includes('leit') || normalized.includes('view') || normalized.includes('read')) {
    return ACCESS_LEVELS.VIEWER;
  }
  if (
    normalized.includes('edit') ||
    normalized.includes('editor') ||
    normalized.includes('criar') ||
    normalized.includes('cadast') ||
    normalized.includes('utec') ||
    normalized.includes('prof') ||
    normalized.includes('usu') ||
    normalized.includes('user')
  ) {
    return ACCESS_LEVELS.EDITOR;
  }
  if (!normalized) return ACCESS_LEVELS.EDITOR;
  return normalized;
}

export function accessLabel(value: unknown): string {
  const level = normalizeAccessLevel(value);
  if (level === ACCESS_LEVELS.SUPERADMIN) return 'Admin Supremo';
  if (level === ACCESS_LEVELS.ADMIN) return 'Admin Padrão';
  if (level === ACCESS_LEVELS.VIEWER) return 'Leitor';
  return 'Editor (Escopo UTEC)';
}

export function isSuperAdmin(value: unknown): boolean {
  return normalizeAccessLevel(value) === ACCESS_LEVELS.SUPERADMIN;
}

export function isAdminPadrao(value: unknown): boolean {
  return normalizeAccessLevel(value) === ACCESS_LEVELS.ADMIN;
}

export function isAnyAdmin(value: unknown): boolean {
  const level = normalizeAccessLevel(value);
  return level === ACCESS_LEVELS.SUPERADMIN || level === ACCESS_LEVELS.ADMIN;
}

export function isEditor(value: unknown): boolean {
  return normalizeAccessLevel(value) === ACCESS_LEVELS.EDITOR;
}

// ==============================================================================
// 1. CLUBES / ALUNOS / PROJETOS / ENCONTROS
// - Editor: Criar, Editar (Somente na sua UTEC)
// - Admin Padrão: Criar, Editar, Excluir (Sua UTEC / Globais)
// - Admin Supremo: Criar, Editar, Excluir (Absoluto)
// ==============================================================================

export function canCreateClub(value: unknown): boolean {
  const level = normalizeAccessLevel(value);
  return level === ACCESS_LEVELS.SUPERADMIN || level === ACCESS_LEVELS.ADMIN || level === ACCESS_LEVELS.EDITOR;
}

export function canEditClub(
  value: unknown,
  clubUtec?: string,
  userUtec?: string,
  canViewAllUtecs?: boolean,
): boolean {
  if (isSuperAdmin(value)) return true;
  if (isAdminPadrao(value)) {
    if (canViewAllUtecs || !userUtec) return true;
    return !clubUtec || normalizeUtecScope(clubUtec) === normalizeUtecScope(userUtec);
  }
  if (isEditor(value)) {
    if (!userUtec) return true;
    return !clubUtec || normalizeUtecScope(clubUtec) === normalizeUtecScope(userUtec);
  }
  return false;
}

export function canDeleteClub(
  value: unknown,
  clubUtec?: string,
  userUtec?: string,
  canViewAllUtecs?: boolean,
): boolean {
  if (isSuperAdmin(value)) return true;
  if (isAdminPadrao(value)) {
    if (canViewAllUtecs || !userUtec) return true;
    return !clubUtec || normalizeUtecScope(clubUtec) === normalizeUtecScope(userUtec);
  }
  // Editor não tem permissão de exclusão conforme a matriz
  return false;
}

export function canCreateAluno(value: unknown): boolean {
  return isAnyAdmin(value) || isEditor(value);
}

export function canCreateEncontro(value: unknown): boolean {
  return isAnyAdmin(value) || isEditor(value);
}

export function canUpdateStatus(value: unknown): boolean {
  return isAnyAdmin(value) || isEditor(value);
}

export function canEditEncontro(value: unknown): boolean {
  return isAnyAdmin(value) || isEditor(value);
}

export function canDeleteAluno(value: unknown): boolean {
  // Apenas Admin Padrão e Admin Supremo têm permissão de excluir
  return isAnyAdmin(value);
}

export function canDeleteEncontro(value: unknown): boolean {
  // Apenas Admin Padrão e Admin Supremo têm permissão de excluir
  return isAnyAdmin(value);
}

export function canDeleteProjeto(value: unknown): boolean {
  // Apenas Admin Padrão e Admin Supremo têm permissão de excluir
  return isAnyAdmin(value);
}

// ==============================================================================
// 2. IMAGENS / MÍDIAS (GALERIA)
// - Editor: Enviar, Vincular, Visualizar de OUTRAS UTECs
// - Admin Padrão: Enviar, Vincular, Excluir
// - Admin Supremo: Enviar, Vincular, Excluir (Global)
// ==============================================================================

export function canUploadMedia(value: unknown): boolean {
  return isAnyAdmin(value) || isEditor(value);
}

export function canDeleteMedia(value: unknown): boolean {
  return isAnyAdmin(value);
}

export function canViewAllMedia(): boolean {
  return true;
}

// ==============================================================================
// 3. MATERIAIS / ROTEIROS DIDÁTICOS (GLOBAL)
// - Editor: Apenas Visualizar (Catálogo global)
// - Admin Padrão: Criar, Editar, Excluir (Global)
// - Admin Supremo: Criar, Editar, Excluir (Global)
// ==============================================================================

export function canManageMaterials(value: unknown): boolean {
  return isAnyAdmin(value);
}

export function canViewMaterials(): boolean {
  return true;
}

// ==============================================================================
// 4. GESTÃO DE USUÁRIOS
// - Editor: ❌ Sem acesso
// - Admin Padrão: Gerenciar Editores
// - Admin Supremo: Gerenciar Admins e Editores
// ==============================================================================

export function canManageUsers(value: unknown): boolean {
  return isAnyAdmin(value);
}

export function canManageTargetUser(
  operatorRole: unknown,
  targetUserRole: unknown,
  currentUserId?: string,
  targetUserId?: string,
): boolean {
  if (currentUserId && targetUserId && currentUserId === targetUserId) {
    return false; // Não pode excluir ou desativar a própria conta
  }
  if (isSuperAdmin(operatorRole)) return true;
  if (isAdminPadrao(operatorRole)) {
    const targetLevel = normalizeAccessLevel(targetUserRole);
    // Admin Padrão só gerencia Editores e Leitores
    return targetLevel === ACCESS_LEVELS.EDITOR || targetLevel === ACCESS_LEVELS.VIEWER;
  }
  return false;
}

export function getAllowedAssignableRoles(operatorRole: unknown): Array<{ value: string; label: string }> {
  if (isSuperAdmin(operatorRole)) {
    return [
      { value: 'editor', label: 'Editor (Escopo UTEC)' },
      { value: 'administrador', label: 'Admin Padrão' },
      { value: 'superadmin', label: 'Admin Supremo' },
    ];
  }
  // Admin Padrão só cadastra Editores
  return [{ value: 'editor', label: 'Editor (Escopo UTEC)' }];
}

// ==============================================================================
// 5. GERENCIAMENTO DE BANCO DE DADOS
// - Editor: ❌ Sem acesso
// - Admin Padrão: ❌ Sem acesso
// - Admin Supremo: Acesso Total
// ==============================================================================

export function canAccessDatabase(value: unknown): boolean {
  return isSuperAdmin(value);
}

// ==============================================================================
// UTILITÁRIOS DE ESCOPO UTEC
// ==============================================================================

export function isUtecScopedUser(userName: unknown): boolean {
  return normalizeUtecScope(userName) !== '';
}

export function normalizeUtecScope(value: unknown): string {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '')
    .toUpperCase();
}

export function resolveUserScope(session: unknown): UserScopeInfo {
  const record = session && typeof session === 'object' ? (session as Record<string, unknown>) : {};
  const accessLevel = normalizeAccessLevel(record.acesso ?? record.access ?? record.perfil);
  const isSuper = isSuperAdmin(accessLevel);
  const isAdmin = isAnyAdmin(accessLevel);
  const tipoUsuario = normalizeTextValue(record.tipo_usuario ?? record.tipoUsuario ?? record.tipo ?? record.perfil);
  const verTodasUtecs =
    isSuper ||
    (isAdmin &&
      (toBoolean(record.ver_todas_utecs ?? record.ver_todas_utec ?? record.verTodasUtecs ?? record.todas_utecs ?? record.ver_todas_utechs) ||
        tipoUsuario === 'global' ||
        tipoUsuario === 'administrador' ||
        tipoUsuario === 'superadmin'));

  const utecFromPayload = normalizeUtecScope(
    record.utec ?? record.id_utec ?? record.utecId ?? record.escopo_utec ?? record.utecScope ?? '',
  );
  const fallbackFromName = normalizeUtecScope(record.nome_utec ?? record.nomeUtec ?? record.nome ?? record.name ?? '');

  return {
    tipoUsuario: tipoUsuario || (verTodasUtecs ? 'global' : utecFromPayload || fallbackFromName ? 'utec' : ''),
    utecScope: verTodasUtecs ? '' : utecFromPayload || fallbackFromName,
    verTodasUtecs,
  };
}

function normalizeTextValue(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const normalized = normalizeTextValue(value);
  return normalized === '1' || normalized === 'true' || normalized === 'sim' || normalized === 'yes' || normalized === 'y';
}
