<!--
  PetDetailPanel.vue
  战宠详情面板 - 核心养成交互
  标签页切换：属性 / 技能 / 进化 / 喂食
-->
<template>
  <div class="pet-detail-panel">
    <!-- 标签页切换 -->
    <div class="pet-detail-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="pet-detail-tab"
        :class="{ 'pet-detail-tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key as typeof activeTab"
      >
        <component :is="tab.icon" :size="12" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- 属性标签页 -->
    <div v-if="activeTab === 'stats'" class="pet-detail-content">
      <div class="pet-detail-stats">
        <div class="pet-detail-stat">
          <Heart :size="14" style="color: var(--accent-green)" />
          <span class="pet-detail-stat-label">生命</span>
          <span class="pet-detail-stat-value">{{ pet.stats.hp }}/{{ pet.stats.maxHp }}</span>
        </div>
        <div class="pet-detail-stat">
          <Swords :size="14" style="color: var(--accent-red)" />
          <span class="pet-detail-stat-label">攻击</span>
          <span class="pet-detail-stat-value">{{ pet.stats.attack }}</span>
        </div>
        <div class="pet-detail-stat">
          <Shield :size="14" style="color: var(--accent-blue)" />
          <span class="pet-detail-stat-label">防御</span>
          <span class="pet-detail-stat-value">{{ pet.stats.defense }}</span>
        </div>
        <div class="pet-detail-stat">
          <Zap :size="14" style="color: var(--accent-gold)" />
          <span class="pet-detail-stat-label">速度</span>
          <span class="pet-detail-stat-value">{{ pet.stats.speed }}</span>
        </div>
      </div>

      <!-- 主人加成 -->
      <div class="pet-detail-bonus">
        <div class="pet-detail-bonus-title">主人加成</div>
        <div class="pet-detail-bonus-list">
          <span v-if="pet.bonusToOwner.hp">生命 +{{ pet.bonusToOwner.hp }}</span>
          <span v-if="pet.bonusToOwner.attack">攻击 +{{ pet.bonusToOwner.attack }}</span>
          <span v-if="pet.bonusToOwner.defense">防御 +{{ pet.bonusToOwner.defense }}</span>
          <span v-if="pet.bonusToOwner.criticalRate">暴击 +{{ (pet.bonusToOwner.criticalRate * 100).toFixed(1) }}%</span>
          <span v-if="pet.bonusToOwner.dodgeRate">闪避 +{{ (pet.bonusToOwner.dodgeRate * 100).toFixed(1) }}%</span>
        </div>
      </div>

      <!-- 装备槽位 -->
      <div class="pet-detail-equip">
        <div class="pet-detail-equip-title">装备</div>
        <div class="pet-detail-equip-slots">
          <!-- 护甲槽位 -->
          <div class="pet-equip-slot">
            <span class="pet-equip-slot__label">护甲</span>
            <div v-if="pet.equipment?.armor" class="pet-equip-slot__item">
              <span class="pet-equip-slot__name" :style="{ color: getEquipRarityColor(pet.equipment.armor.rarity) }">
                {{ pet.equipment.armor.name }}
              </span>
              <span class="pet-equip-slot__stat">
                <template v-if="pet.equipment.armor.stats.hp">HP +{{ pet.equipment.armor.stats.hp }}</template>
                <template v-if="pet.equipment.armor.stats.defense"> 防御 +{{ pet.equipment.armor.stats.defense }}</template>
              </span>
            </div>
            <div v-else class="pet-equip-slot__empty">未装备</div>
            <div class="pet-equip-slot__actions">
              <button v-if="pet.equipment?.armor" class="pet-equip-slot__btn pet-equip-slot__btn--off" :disabled="loading" @click="handleUnequipItem('armor')">卸下</button>
              <button class="pet-equip-slot__btn pet-equip-slot__btn--on" :disabled="loading" @click="openEquipPicker('armor')">
                {{ pet.equipment?.armor ? '替换' : '装备' }}
              </button>
            </div>
          </div>
          <!-- 饰品槽位 -->
          <div class="pet-equip-slot">
            <span class="pet-equip-slot__label">饰品</span>
            <div v-if="pet.equipment?.accessory" class="pet-equip-slot__item">
              <span class="pet-equip-slot__name" :style="{ color: getEquipRarityColor(pet.equipment.accessory.rarity) }">
                {{ pet.equipment.accessory.name }}
              </span>
              <span class="pet-equip-slot__stat">
                <template v-if="pet.equipment.accessory.stats.hp">HP +{{ pet.equipment.accessory.stats.hp }}</template>
                <template v-if="pet.equipment.accessory.stats.defense"> 防御 +{{ pet.equipment.accessory.stats.defense }}</template>
              </span>
            </div>
            <div v-else class="pet-equip-slot__empty">未装备</div>
            <div class="pet-equip-slot__actions">
              <button v-if="pet.equipment?.accessory" class="pet-equip-slot__btn pet-equip-slot__btn--off" :disabled="loading" @click="handleUnequipItem('accessory')">卸下</button>
              <button class="pet-equip-slot__btn pet-equip-slot__btn--on" :disabled="loading" @click="openEquipPicker('accessory')">
                {{ pet.equipment?.accessory ? '替换' : '装备' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 重命名 -->
      <div class="pet-detail-rename">
        <div class="pet-detail-rename-label">昵称</div>
        <input
          v-model="newNickname"
          class="pet-detail-rename-input"
          type="text"
          :maxlength="12"
          placeholder="输入新昵称"
        />
        <button
          class="pet-detail-rename-btn"
          :disabled="newNickname === pet.nickname || loading"
          @click="handleRename"
        >
          确认
        </button>
      </div>

      <!-- 装备选择弹窗 -->
      <Transition name="picker-fade">
        <div v-if="equipPickerOpen" class="pet-skill-picker">
          <div class="pet-skill-picker__header">
            <span>选择{{ equipPickerSlot === 'armor' ? '护甲' : '饰品' }}</span>
            <button class="pet-skill-picker__close" @click="equipPickerOpen = false">
              <X :size="14" />
            </button>
          </div>
          <div class="pet-skill-picker__list">
            <div
              v-for="item in availableEquipItems"
              :key="item.id"
              class="pet-skill-picker__item"
              @click="handlePickEquipItem(item)"
            >
              <div class="pet-skill-picker__item-header">
                <span class="pet-skill-picker__item-name" :style="{ color: getEquipRarityColor(item.item.rarity) }">{{ item.item.name }}</span>
                <span class="pet-skill-picker__item-type">×{{ item.quantity }}</span>
              </div>
              <div class="pet-skill-picker__item-desc">
                {{ formatEquipStats(item.item.stats as EquipmentStats) }}
              </div>
            </div>
            <div v-if="!availableEquipItems.length" class="pet-detail-empty">背包中无可用装备</div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 技能标签页 -->
    <div v-if="activeTab === 'skills'" class="pet-detail-content">
      <!-- 3 个技能槽位 -->
      <div class="pet-detail-slots">
        <div class="pet-detail-slots-title">技能槽位</div>
        <div v-for="(skill, idx) in skillSlots" :key="idx" class="pet-skill-slot">
          <div class="pet-skill-slot__index">{{ idx + 1 }}</div>
          <div v-if="skill" class="pet-skill-slot__info">
            <span class="pet-skill-slot__name">{{ skill.name }}</span>
            <span class="pet-skill-slot__type">{{ getSkillTypeLabel(skill.type) }}</span>
          </div>
          <div v-else class="pet-skill-slot__empty">空槽位</div>
          <div class="pet-skill-slot__actions">
            <button
              v-if="skill"
              class="pet-skill-slot__btn pet-skill-slot__btn--unequip"
              :disabled="loading"
              @click="handleUnequipSkill(idx)"
            >
              卸下
            </button>
            <button
              class="pet-skill-slot__btn pet-skill-slot__btn--equip"
              :disabled="loading"
              @click="openSkillPicker(idx)"
            >
              {{ skill ? '替换' : '装备' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 已学技能列表 -->
      <div v-if="pet.learnedSkills?.length" class="pet-detail-learned">
        <div class="pet-detail-learned-title">已学技能（{{ pet.learnedSkills.length }}）</div>
        <div class="pet-detail-learned-list">
          <div v-for="ls in pet.learnedSkills" :key="ls.id" class="pet-detail-learned-item">
            <span class="pet-detail-learned-name">{{ ls.name }}</span>
            <span class="pet-detail-learned-type">{{ getSkillTypeLabel(ls.type) }}</span>
            <span v-if="ls.power" class="pet-detail-learned-power">{{ ls.power }}%</span>
          </div>
        </div>
      </div>

      <!-- 技能选择弹窗 -->
      <Transition name="picker-fade">
        <div v-if="pickerOpen" class="pet-skill-picker">
          <div class="pet-skill-picker__header">
            <span>选择技能装备到槽位 {{ pickerSlot + 1 }}</span>
            <button class="pet-skill-picker__close" @click="pickerOpen = false">
              <X :size="14" />
            </button>
          </div>
          <div class="pet-skill-picker__list">
            <div
              v-for="s in availableSkills"
              :key="s.id"
              class="pet-skill-picker__item"
              :class="{ 'pet-skill-picker__item--equipped': isEquipped(s.id) }"
              @click="handlePickSkill(s)"
            >
              <div class="pet-skill-picker__item-header">
                <span class="pet-skill-picker__item-name">{{ s.name }}</span>
                <span class="pet-skill-picker__item-type">{{ getSkillTypeLabel(s.type) }}</span>
              </div>
              <div v-if="s.power" class="pet-skill-picker__item-power">威力 {{ s.power }}%</div>
              <div v-if="s.cooldown" class="pet-skill-picker__item-cooldown">冷却 {{ s.cooldown }} 回合</div>
              <div v-if="s.description" class="pet-skill-picker__item-desc">{{ s.description }}</div>
            </div>
            <div v-if="!availableSkills.length" class="pet-detail-empty">无可装备技能</div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 进化标签页 -->
    <div v-if="activeTab === 'evolve'" class="pet-detail-content">
      <div v-if="evolveConfig" class="pet-detail-evolve">
        <div class="pet-detail-evolve-target">
          <span>进化形态：</span>
          <span class="pet-detail-evolve-name" :style="{ color: evolveRarityColor }">{{ evolveConfig.name }}</span>
        </div>
        <div class="pet-detail-evolve-conditions">
          <div class="pet-detail-evolve-cond">
            <span>等级要求</span>
            <span :class="{ 'pet-detail-evolve-cond--met': pet.level >= (evolveConfig.evolveLevel ?? 999) }">
              Lv.{{ evolveConfig.evolveLevel ?? '?' }}（当前 Lv.{{ pet.level }}）
            </span>
          </div>
          <div v-for="mat in evolveMaterials" :key="mat.itemId" class="pet-detail-evolve-cond">
            <span>{{ mat.name }}</span>
            <span :class="{ 'pet-detail-evolve-cond--met': hasMaterial(mat) }">
              ×{{ mat.quantity }}（背包: {{ getMaterialCount(mat.itemId) }}）
            </span>
          </div>
        </div>
        <button
          class="pet-detail-evolve-btn"
          :disabled="!canEvolve || loading"
          @click="handleEvolve"
        >
          {{ canEvolve ? '进化' : '条件不足' }}
        </button>
      </div>
      <div v-else class="pet-detail-empty">该战宠无法进化</div>
    </div>

    <!-- 喂食标签页 -->
    <div v-if="activeTab === 'feed'" class="pet-detail-content">
      <div class="pet-detail-feed">
        <div class="pet-detail-feed-info">
          <span>经验道具</span>
          <select v-model="selectedExpItem" class="pet-detail-feed-select">
            <option value="">选择道具</option>
            <option v-for="item in expItems" :key="item.id" :value="item.id">
              {{ item.item.name }} ×{{ item.quantity }} (+{{ getExpValue(item) }} EXP/个)
            </option>
          </select>
        </div>
        <div class="pet-detail-feed-quantity">
          <span>使用数量</span>
          <div class="pet-detail-feed-controls">
            <button class="pet-detail-feed-qty-btn" @click="adjustFeedQty(-1)">
              <Minus :size="12" />
            </button>
            <input v-model.number="feedQuantity" class="pet-detail-feed-qty-input" type="number" :min="1" :max="getMaxFeedQty" />
            <button class="pet-detail-feed-qty-btn" @click="adjustFeedQty(1)">
              <Plus :size="12" />
            </button>
          </div>
        </div>
        <div class="pet-detail-feed-preview">
          预计获得 <span class="pet-detail-feed-preview-value">{{ feedPreview }} EXP</span>
        </div>
        <button
          class="pet-detail-feed-btn"
          :disabled="!selectedExpItem || feedQuantity < 1 || loading"
          @click="handleFeed"
        >
          喂食
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Activity, Sparkles, Zap, Heart, Swords, Shield, Minus, Plus, X } from 'lucide-vue-next'
import type { PetInfo, PetSkill, PetRarity } from '../../types/pet'
import type { InventoryItem } from '../../types/item'
import type { EquipmentRarity, EquipmentStats } from '../../types/equipment'
import { PET_RARITY_COLORS } from '../../types/pet'
import { PET_TYPE_CONFIGS, getEvolveMaterials, SKILL_TYPE_LABELS } from '../../config/pet_config'

interface Props {
  pet: PetInfo
  expItems?: InventoryItem[]
  equipItems?: InventoryItem[]
  loading?: boolean
}

interface Emits {
  (e: 'feed', inventoryId: string, quantity: number): void
  (e: 'evolve'): void
  (e: 'rename', nickname: string): void
  (e: 'equipSkill', skillId: number, slotIndex: number): void
  (e: 'unequipSkill', slotIndex: number): void
  (e: 'equipItem', inventoryId: string, slotType: 'armor' | 'accessory'): void
  (e: 'unequipItem', slotType: 'armor' | 'accessory'): void
}

const props = withDefaults(defineProps<Props>(), {
  expItems: () => [],
  equipItems: () => [],
  loading: false
})
const emit = defineEmits<Emits>()

const tabs = [
  { key: 'stats', label: '属性', icon: Activity },
  { key: 'skills', label: '技能', icon: Sparkles },
  { key: 'evolve', label: '进化', icon: Zap },
  { key: 'feed', label: '喂食', icon: Heart }
]

const activeTab = ref<'stats' | 'skills' | 'evolve' | 'feed'>('stats')
const newNickname = ref(props.pet.nickname)
const selectedExpItem = ref('')
const feedQuantity = ref(1)

/** 技能类型标签 */
function getSkillTypeLabel(type: string): string {
  return SKILL_TYPE_LABELS[type] || type
}

/** 进化配置 */
const evolveConfig = computed(() => {
  const typeConfig = PET_TYPE_CONFIGS[props.pet.petTypeId]
  if (!typeConfig?.evolveTo) return null
  return { ...typeConfig, evolveToConfig: PET_TYPE_CONFIGS[typeConfig.evolveTo] }
})

/** 进化目标稀有度颜色 */
const evolveRarityColor = computed(() => {
  if (!evolveConfig.value) return '#8e8e93'
  const newRarity = (props.pet.rarity + 1) as PetRarity
  return PET_RARITY_COLORS[newRarity]?.light || '#ff9500'
})

/** 进化材料 */
const evolveMaterials = computed(() => getEvolveMaterials(props.pet.petTypeId))

/** 是否满足进化等级 */
const canEvolve = computed(() => {
  if (!evolveConfig.value) return false
  const levelOk = props.pet.level >= (evolveConfig.value.evolveLevel || 999)
  const materialsOk = evolveMaterials.value.every(m => hasMaterial(m))
  return levelOk && materialsOk
})

/** 检查背包是否有材料 */
function hasMaterial(_mat: { itemId: number; quantity: number }): boolean {
  // Mock：假设有足够材料
  return true
}

/** 获取材料数量 */
function getMaterialCount(itemId: number): number {
  // Mock：返回模拟数量
  return itemId === 2005 ? 5 : itemId === 2003 ? 3 : itemId === 2004 ? 1 : 0
}

/** 获取经验道具经验值 */
function getExpValue(item: InventoryItem): number {
  const effect = item.item.effects?.find(e => e.type === 'add_exp')
  return effect?.value || 100
}

/** 最大喂食数量 */
const getMaxFeedQty = computed(() => {
  if (!selectedExpItem.value) return 1
  const item = props.expItems.find(i => i.id === selectedExpItem.value)
  return item?.quantity || 1
})

/** 喂食预览 */
const feedPreview = computed(() => {
  if (!selectedExpItem.value) return 0
  const item = props.expItems.find(i => i.id === selectedExpItem.value)
  if (!item) return 0
  return getExpValue(item) * feedQuantity.value
})

/** 调整喂食数量 */
function adjustFeedQty(delta: number) {
  const newVal = feedQuantity.value + delta
  feedQuantity.value = Math.max(1, Math.min(newVal, getMaxFeedQty.value))
}

/** 喂食 */
function handleFeed() {
  if (!selectedExpItem.value || feedQuantity.value < 1) return
  emit('feed', selectedExpItem.value, feedQuantity.value)
}

/** 进化 */
function handleEvolve() {
  emit('evolve')
}

/** 重命名 */
function handleRename() {
  if (newNickname.value === props.pet.nickname) return
  emit('rename', newNickname.value)
}

/** 3 个技能槽位（补齐到 3 个） */
const skillSlots = computed(() => {
  const skills = props.pet.skills || []
  return [skills[0] ?? null, skills[1] ?? null, skills[2] ?? null]
})

/** 技能选择弹窗状态 */
const pickerOpen = ref(false)
const pickerSlot = ref(0)

/** 可选技能（已学但未装备的） */
const availableSkills = computed(() => {
  const learned = props.pet.learnedSkills || []
  const equippedIds = new Set((props.pet.skills || []).map(s => s?.id).filter(Boolean))
  return learned.filter(s => !equippedIds.has(s.id))
})

/** 技能是否已装备 */
function isEquipped(skillId: number): boolean {
  return (props.pet.skills || []).some(s => s?.id === skillId)
}

/** 打开技能选择弹窗 */
function openSkillPicker(slotIndex: number) {
  pickerSlot.value = slotIndex
  pickerOpen.value = true
}

/** 选择技能装备 */
function handlePickSkill(skill: PetSkill) {
  emit('equipSkill', skill.id, pickerSlot.value)
  pickerOpen.value = false
}

/** 卸下技能 */
function handleUnequipSkill(slotIndex: number) {
  emit('unequipSkill', slotIndex)
}

/** 装备品质颜色映射 */
const EQUIP_RARITY_COLORS: Record<EquipmentRarity, string> = {
  Normal: '#6e6e73',
  Rare: '#0071e3',
  Epic: '#af52de',
  Legendary: '#ff9500'
}

/** 获取装备品质颜色 */
function getEquipRarityColor(rarity: EquipmentRarity): string {
  return EQUIP_RARITY_COLORS[rarity] || '#6e6e73'
}

/** 装备选择弹窗状态 */
const equipPickerOpen = ref(false)
const equipPickerSlot = ref<'armor' | 'accessory'>('armor')

/** 可用装备（从背包装备列表筛选） */
const availableEquipItems = computed(() => {
  return props.equipItems
})

/** 格式化装备属性 */
function formatEquipStats(stats: EquipmentStats): string {
  const parts: string[] = []
  if (stats.hp) parts.push(`HP +${stats.hp}`)
  if (stats.defense) parts.push(`防御 +${stats.defense}`)
  if (stats.physicalAttack) parts.push(`物攻 +${stats.physicalAttack}`)
  if (stats.criticalRate) parts.push(`暴击 +${(stats.criticalRate * 100).toFixed(1)}%`)
  if (stats.dodgeRate) parts.push(`闪避 +${(stats.dodgeRate * 100).toFixed(1)}%`)
  return parts.join(' · ') || '无属性'
}

/** 打开装备选择弹窗 */
function openEquipPicker(slotType: 'armor' | 'accessory') {
  equipPickerSlot.value = slotType
  equipPickerOpen.value = true
}

/** 选择装备 */
function handlePickEquipItem(item: InventoryItem) {
  emit('equipItem', item.id, equipPickerSlot.value)
  equipPickerOpen.value = false
}

/** 卸下装备 */
function handleUnequipItem(slotType: 'armor' | 'accessory') {
  emit('unequipItem', slotType)
}
</script>
