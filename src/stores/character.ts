import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCharacterListApi, createCharacterApi, deleteCharacterApi, getCharacterInfoApi, updateAttributesApi } from '../api'
import type { CharacterInfo, CreateCharacterParams, UpdateAttributesParams } from '../api'

/** 最大角色数 */
const MAX_CHARACTERS = 3

/**
 * 角色状态管理
 * 管理角色列表、选中角色、创建角色
 */
export const useCharacterStore = defineStore('character', () => {
  // ── 状态 ──
  const characters = ref<CharacterInfo[]>([])
  const selectedCharacterId = ref<string | null>(null)
  const characterDetail = ref<CharacterInfo | null>(null)
  const loading = ref(false)

  // ── 计算属性 ──
  const selectedCharacter = computed(() =>
    characters.value.find(c => c.id === selectedCharacterId.value) ?? null
  )
  const isFull = computed(() => characters.value.length >= MAX_CHARACTERS)
  const emptySlots = computed(() => MAX_CHARACTERS - characters.value.length)

  // ── 初始化：尝试恢复选中的角色 ──
  function init() {
    const saved = sessionStorage.getItem('selected_character_id')
    if (saved) {
      selectedCharacterId.value = saved
    }
  }

  /** 加载角色列表 */
  async function fetchCharacters(): Promise<{ success: boolean; message: string }> {
    loading.value = true
    try {
      const res = await getCharacterListApi()
      if (res.code === 200) {
        characters.value = res.data
        // 如果之前选中的角色不在列表中，清除选择
        if (selectedCharacterId.value && !characters.value.find(c => c.id === selectedCharacterId.value)) {
          selectedCharacterId.value = null
          sessionStorage.removeItem('selected_character_id')
        }
        return { success: true, message: res.message }
      }
      return { success: false, message: res.message }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取角色列表失败'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  /** 选择角色 */
  function selectCharacter(characterId: string) {
    selectedCharacterId.value = characterId
    sessionStorage.setItem('selected_character_id', characterId)
  }

  /** 获取角色详情 */
  async function fetchCharacterDetail(characterId: string): Promise<{ success: boolean; message: string }> {
    loading.value = true
    try {
      const res = await getCharacterInfoApi(characterId)
      if (res.code === 200) {
        characterDetail.value = res.data
        return { success: true, message: res.message }
      }
      return { success: false, message: res.message }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取角色详情失败'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  /** 创建角色 */
  async function createCharacter(params: CreateCharacterParams): Promise<{ success: boolean; message: string }> {
    loading.value = true
    try {
      const res = await createCharacterApi(params)
      if (res.code === 200) {
        characters.value.push(res.data)
        return { success: true, message: res.message }
      }
      return { success: false, message: res.message }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '创建角色失败'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  /** 删除角色 */
  async function deleteCharacter(characterId: string): Promise<{ success: boolean; message: string }> {
    if (!characterId || typeof characterId !== 'string') {
      return { success: false, message: '角色ID无效' }
    }

    const trimmed = characterId.trim()
    if (!trimmed) {
      return { success: false, message: '角色ID无效' }
    }

    loading.value = true
    try {
      const res = await deleteCharacterApi(trimmed)
      if (res.code === 200) {
        characters.value = characters.value.filter(c => c.id !== trimmed)
        if (selectedCharacterId.value === trimmed) {
          selectedCharacterId.value = null
          sessionStorage.removeItem('selected_character_id')
        }
        return { success: true, message: res.message }
      }
      return { success: false, message: res.message }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '删除角色失败，请稍后重试'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  /** 属性加点 */
  async function updateAttributes(params: UpdateAttributesParams): Promise<{ success: boolean; message: string }> {
    loading.value = true
    try {
      const res = await updateAttributesApi(params)
      if (res.code === 200) {
        // 更新角色详情
        characterDetail.value = res.data
        // 同时更新角色列表中的对应角色
        const index = characters.value.findIndex(c => c.id === params.characterId)
        if (index !== -1) {
          characters.value[index] = res.data
        }
        return { success: true, message: res.message }
      }
      return { success: false, message: res.message }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '属性加点失败'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  /** 清除（登出时调用） */
  function clear() {
    characters.value = []
    selectedCharacterId.value = null
    characterDetail.value = null
    sessionStorage.removeItem('selected_character_id')
  }

  // 初始化
  init()

  return {
    characters,
    selectedCharacterId,
    selectedCharacter,
    characterDetail,
    loading,
    isFull,
    emptySlots,
    fetchCharacters,
    selectCharacter,
    fetchCharacterDetail,
    createCharacter,
    deleteCharacter,
    updateAttributes,
    clear
  }
})
