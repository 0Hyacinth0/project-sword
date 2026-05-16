import type { TeamMember } from '../types/team'

export type MockProfileProfession = 'Warrior' | 'Mage' | 'Hunter'

export interface MockCharacterProfile {
  characterId: string
  characterName: string
  profession: MockProfileProfession
  level: number
}

const DEFAULT_MOCK_PROFILE: MockCharacterProfile = {
  characterId: 'mock-char-1',
  characterName: '剑圣无名',
  profession: 'Warrior',
  level: 15
}

const mockProfileMap: Record<string, MockCharacterProfile> = {
  'mock-char-1': DEFAULT_MOCK_PROFILE,
  'mock-char-2': {
    characterId: 'mock-char-2',
    characterName: '冰霜女王',
    profession: 'Mage',
    level: 8
  }
}

/**
 * 读取当前 Mock 选中角色 ID。
 * @returns 当前选中角色 ID；没有选择时返回默认 Mock 角色 ID
 */
export function getMockCurrentCharacterId(): string {
  if (typeof sessionStorage === 'undefined') return DEFAULT_MOCK_PROFILE.characterId
  return sessionStorage.getItem('selected_character_id') || DEFAULT_MOCK_PROFILE.characterId
}

/**
 * 注册 Mock 角色展示资料，供组队、房间、聊天等横向模块复用。
 * @param profile - 角色基础展示资料
 * @returns 无返回值
 */
export function registerMockCharacterProfile(profile: MockCharacterProfile): void {
  mockProfileMap[profile.characterId] = profile
}

/**
 * 获取当前 Mock 角色的基础展示资料。
 * @returns 当前角色展示资料；未知角色 ID 使用通用当前玩家资料
 */
export function getMockCurrentCharacterProfile(): MockCharacterProfile {
  const characterId = getMockCurrentCharacterId()
  return mockProfileMap[characterId] ?? {
    characterId,
    characterName: '当前玩家',
    profession: 'Warrior',
    level: 1
  }
}

/**
 * 将 Mock 角色展示资料转换成队伍成员结构。
 * @param profile - 角色基础展示资料
 * @param role - 队伍角色身份
 * @returns 队伍成员数据
 */
export function createMockTeamMember(profile: MockCharacterProfile, role: TeamMember['role']): TeamMember {
  return {
    characterId: profile.characterId,
    characterName: profile.characterName,
    profession: profile.profession,
    level: profile.level,
    role,
    status: 'online',
    joinedAt: new Date().toISOString()
  }
}
