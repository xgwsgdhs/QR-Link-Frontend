<template>
  <div class="app-container">
    <div class="header-section">
      <div>
        <h2>📦 共享物资台账大厅</h2>
        <p class="subtitle">新韩大学共享实验室 · 产学项目开发套件与器材设备总览</p>
      </div>

      <!-- 快捷搜索 -->
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索资产名 / 编号 / 存放地点..."
          :prefix-icon="Search"
          clearable
          @input="handleSearchDebounce"
        />
      </div>
    </div>

    <!-- 筛选标签区 -->
    <div class="filter-bar">
      <div class="category-pills">
        <span 
          v-for="cat in categories" 
          :key="cat"
          class="pill"
          :class="{ active: selectedCategory === cat }"
          @click="selectCategory(cat)"
        >
          {{ cat }}
        </span>
      </div>

      <div class="status-select">
        <el-select v-model="selectedStatus" placeholder="状态筛选" style="width: 130px" @change="loadAssets">
          <el-option label="全部状态" value="ALL" />
          <el-option label="空闲可借" value="AVAILABLE" />
          <el-option label="借调流转中" value="RENTED" />
          <el-option label="维修检修中" value="MAINTENANCE" />
        </el-select>
      </div>
    </div>

    <!-- 资产卡片网格 -->
    <div v-if="loading" class="loading-box">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="assetsList.length === 0" class="empty-box glass-card">
      <el-empty description="未检索到符合条件的物资" />
    </div>

    <div v-else class="assets-grid">
      <div v-for="item in assetsList" :key="item.id" class="asset-card glass-card">
        <div class="card-head">
          <span class="cat-tag">{{ item.category }}</span>
          <el-tag :type="statusTagType(item.status)" effect="dark" size="small">
            {{ formatStatus(item.status) }}
          </el-tag>
        </div>

        <h3 class="asset-title">{{ item.asset_name }}</h3>
        <p class="asset-code-text">{{ item.asset_code }}</p>

        <div class="desc-box">
          <p class="loc">
            <el-icon><Location /></el-icon> {{ item.location }}
          </p>
          <p v-if="item.description" class="desc-text">{{ item.description }}</p>
        </div>

        <!-- 借用人提示 -->
        <div v-if="item.status === 'RENTED'" class="borrower-bar">
          <el-icon><User /></el-icon>
          <span>借阅人：<strong>{{ item.current_user_name || '其他学生' }}</strong></span>
        </div>

        <div class="card-actions">
          <el-button size="small" plain @click="openQrModal(item)">
            <el-icon><Picture /></el-icon> 实体标签
          </el-button>
          <el-button 
            v-if="item.status === 'AVAILABLE'" 
            size="small" 
            type="success"
            @click="goToScan(item.asset_code)"
          >
            扫码借用
          </el-button>
          <el-button 
            v-else-if="item.status === 'RENTED'" 
            size="small" 
            type="primary"
            @click="goToScan(item.asset_code)"
          >
            扫码还回
          </el-button>
        </div>
      </div>
    </div>

    <!-- 实体二维码标签展示弹窗 -->
    <el-dialog v-model="showQrDialog" title="物理二维码标签 (PNG贴纸)" width="90%" max-width="400px" center>
      <div v-if="selectedAssetForQr" class="qr-modal-body">
        <p class="qr-asset-name">{{ selectedAssetForQr.asset_name }}</p>
        <p class="qr-asset-code">{{ selectedAssetForQr.asset_code }}</p>
        
        <div class="qr-img-wrapper">
          <img :src="getAssetQrUrl(selectedAssetForQr.asset_code)" alt="二维码标签" class="qr-img" />
        </div>
        <p class="print-tip">打印后贴在设备外壳或器材柜对应工位即可供手机扫码</p>
      </div>
      <template #footer>
        <el-button @click="showQrDialog = false">关闭</el-button>
        <a :href="getAssetQrUrl(selectedAssetForQr?.asset_code)" download="qr_tag.png" target="_blank" class="download-link">
          <el-button type="primary">下载高清图片</el-button>
        </a>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAssetsApi, getAssetQrUrl } from '@/api'
import { Search, Location, User, Picture } from '@element-plus/icons-vue'

const router = useRouter()
const assetsList = ref([])
const loading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('全部')
const selectedStatus = ref('ALL')

const categories = ['全部', '实验器材', '开发套件', '专业书籍', '工具设备']

const showQrDialog = ref(false)
const selectedAssetForQr = ref(null)

let debounceTimer = null
function handleSearchDebounce() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    loadAssets()
  }, 300)
}

function selectCategory(cat) {
  selectedCategory.value = cat
  loadAssets()
}

async function loadAssets() {
  loading.value = true
  try {
    const params = {
      search: searchQuery.value || undefined,
      category: selectedCategory.value === '全部' ? undefined : selectedCategory.value,
      status: selectedStatus.value === 'ALL' ? undefined : selectedStatus.value
    }
    const res = await getAssetsApi(params)
    assetsList.value = res
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function openQrModal(asset) {
  selectedAssetForQr.value = asset
  showQrDialog.value = true
}

function goToScan(code) {
  router.push({ path: '/scan', query: { code } })
}

function formatStatus(status) {
  const map = { AVAILABLE: '可借用', RENTED: '已借出', MAINTENANCE: '维修中' }
  return map[status] || status
}

function statusTagType(status) {
  const map = { AVAILABLE: 'success', RENTED: 'warning', MAINTENANCE: 'danger' }
  return map[status] || 'info'
}

onMounted(() => {
  loadAssets()
})
</script>

<style scoped>
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.header-section h2 {
  font-size: 1.35rem;
  color: #0f172a;
}

.subtitle {
  font-size: 0.82rem;
  color: #64748b;
  margin-top: 2px;
}

.search-bar {
  width: 100%;
  max-width: 320px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.category-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill {
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 0.82rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.pill:hover {
  background: #f1f5f9;
  color: #2563eb;
}

.pill.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
  font-weight: 500;
}

.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 16px;
}

.asset-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s, box-shadow 0.2s;
}

.asset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.cat-tag {
  font-size: 0.72rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.asset-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.asset-code-text {
  font-size: 0.76rem;
  color: #94a3b8;
  font-family: monospace;
  margin-bottom: 10px;
}

.desc-box {
  background: #f8fafc;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.82rem;
}

.loc {
  color: #334155;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.desc-text {
  color: #64748b;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.borrower-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #d97706;
  background: #fffbeb;
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.qr-modal-body {
  text-align: center;
}

.qr-asset-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.qr-asset-code {
  font-size: 0.85rem;
  color: #64748b;
  font-family: monospace;
  margin-bottom: 14px;
}

.qr-img-wrapper {
  background: #ffffff;
  padding: 12px;
  display: inline-block;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.qr-img {
  width: 200px;
  height: 200px;
  display: block;
}

.print-tip {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 12px;
}

.download-link {
  text-decoration: none;
}
</style>
