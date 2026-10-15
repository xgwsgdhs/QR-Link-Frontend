<template>
  <div class="app-container">
    <div class="page-header">
      <div>
        <h2>📋 我的在借物资</h2>
        <p class="subtitle">当前经由您借调登记、尚在借用周期内的设备物资台账</p>
      </div>
      <el-button :icon="Refresh" circle @click="loadMyRentals" />
    </div>

    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="4" animated />
    </div>

    <!-- 空状态：当前无在借 -->
    <div v-else-if="rentals.length === 0" class="empty-state glass-card">
      <el-icon :size="64" color="#94a3b8"><Box /></el-icon>
      <h3>暂无在借物资</h3>
      <p>您手头当前没有借用任何实验室设备或套件器材。</p>
      <el-button type="primary" size="large" round @click="router.push('/scan')">
        立即前往扫码借用
      </el-button>
    </div>

    <!-- 在借列表 -->
    <div v-else class="rentals-grid">
      <div v-for="item in rentals" :key="item.id" class="rental-card glass-card">
        <div class="card-top">
          <div class="asset-info">
            <span class="category-badge">{{ item.category }}</span>
            <h3 class="name">{{ item.asset_name }}</h3>
            <span class="code">{{ item.asset_code }}</span>
          </div>
          <el-tag type="warning" effect="dark" size="small">借用中</el-tag>
        </div>

        <div class="card-body">
          <div class="detail-row">
            <span class="label"><el-icon><Location /></el-icon> 原存放地:</span>
            <span class="val">{{ item.location }}</span>
          </div>
          <div v-if="item.description" class="detail-row">
            <span class="label"><el-icon><InfoFilled /></el-icon> 规格说明:</span>
            <span class="val desc-clamp">{{ item.description }}</span>
          </div>
        </div>

        <div class="card-footer">
          <el-button 
            type="primary" 
            plain
            class="return-btn"
            @click="openReturnModal(item)"
          >
            <el-icon><RefreshRight /></el-icon>
            办理归还
          </el-button>
        </div>
      </div>
    </div>

    <!-- 归还确认弹窗 -->
    <el-dialog v-model="showReturnDialog" title="办理归还入库确认" width="90%" max-width="440px">
      <div v-if="selectedAsset">
        <p>确认将 <strong>{{ selectedAsset.asset_name }}</strong> ({{ selectedAsset.asset_code }}) 归还至 <strong>{{ selectedAsset.location }}</strong> 吗？</p>
        <div style="margin-top: 14px;">
          <el-input 
            v-model="returnRemark" 
            placeholder="填写归还验收备注 (如：外壳镜头无磨损，已归还柜中)" 
            clearable
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="showReturnDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleConfirmReturn">
          确认交还入库
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyActiveRentalsApi, checkinAssetApi } from '@/api'
import { ElMessage } from 'element-plus'
import { Refresh, Box, Location, InfoFilled, RefreshRight } from '@element-plus/icons-vue'

const router = useRouter()
const rentals = ref([])
const loading = ref(false)

const showReturnDialog = ref(false)
const selectedAsset = ref(null)
const returnRemark = ref('')
const submitting = ref(false)

async function loadMyRentals() {
  loading.value = true
  try {
    const list = await getMyActiveRentalsApi()
    rentals.value = list
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function openReturnModal(asset) {
  selectedAsset.value = asset
  returnRemark.value = '完好归还'
  showReturnDialog.value = true
}

async function handleConfirmReturn() {
  if (!selectedAsset.value) return
  submitting.value = true
  try {
    await checkinAssetApi(selectedAsset.value.asset_code, returnRemark.value)
    ElMessage.success(`✅ ${selectedAsset.value.asset_name} 归还成功！`)
    showReturnDialog.value = false
    selectedAsset.value = null
    loadMyRentals()
  } catch (e) {
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadMyRentals()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 1.35rem;
  color: #0f172a;
}

.subtitle {
  font-size: 0.82rem;
  color: #64748b;
  margin-top: 2px;
}

.empty-state {
  text-align: center;
  padding: 50px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-state h3 {
  color: #1e293b;
  font-size: 1.15rem;
}

.empty-state p {
  color: #64748b;
  font-size: 0.88rem;
  margin-bottom: 8px;
}

.rentals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.rental-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.category-badge {
  display: inline-block;
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: #f1f5f9;
  color: #475569;
  margin-bottom: 4px;
}

.name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.code {
  font-size: 0.78rem;
  color: #64748b;
  font-family: monospace;
}

.card-body {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-row {
  display: flex;
  font-size: 0.82rem;
  gap: 6px;
}

.detail-row .label {
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.detail-row .val {
  color: #1e293b;
  font-weight: 500;
}

.desc-clamp {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.return-btn {
  width: 100%;
}
</style>
