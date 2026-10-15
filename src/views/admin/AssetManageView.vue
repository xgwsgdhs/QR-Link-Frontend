<template>
  <div class="app-container">
    <div class="page-top-bar">
      <div>
        <h2>⚙️ 实验室资产调度与台账管理</h2>
        <p class="subtitle">录入新设备、生成物理防伪二维码、调度资产维护状态与归属</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateModal">
        登记新资产入库
      </el-button>
    </div>

    <!-- 检索与筛选栏 -->
    <div class="filter-card glass-card">
      <el-input 
        v-model="searchKey" 
        placeholder="搜索名称 / 编号 / 存放地点" 
        style="max-width: 280px"
        :prefix-icon="Search"
        clearable
        @input="loadAssets"
      />
      <el-select v-model="filterCategory" placeholder="分类筛选" style="width: 140px" @change="loadAssets">
        <el-option label="全部分类" value="" />
        <el-option label="实验器材" value="实验器材" />
        <el-option label="开发套件" value="开发套件" />
        <el-option label="专业书籍" value="专业书籍" />
        <el-option label="工具设备" value="工具设备" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态筛选" style="width: 130px" @change="loadAssets">
        <el-option label="全部状态" value="ALL" />
        <el-option label="空闲可借" value="AVAILABLE" />
        <el-option label="借调流转中" value="RENTED" />
        <el-option label="维修检修中" value="MAINTENANCE" />
      </el-select>
      <el-button :icon="Refresh" @click="loadAssets">刷新</el-button>
    </div>

    <!-- 资产表格 -->
    <div class="table-card glass-card">
      <el-table :data="assetList" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="asset_code" label="资产编码" width="160">
          <template #default="{ row }">
            <span class="code-font">{{ row.asset_code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="asset_name" label="器材名称" min-width="180">
          <template #default="{ row }">
            <strong>{{ row.asset_name }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="location" label="存放位置" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="当前状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="dark" size="small">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_user_name" label="在借人" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.current_user_name" class="borrower-name">{{ row.current_user_name }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="openQrModal(row)">
              二维码
            </el-button>
            <el-button size="small" link type="primary" @click="openEditModal(row)">
              编辑
            </el-button>
            <el-button size="small" link type="warning" @click="openStatusModal(row)">
              调度
            </el-button>
            <el-button size="small" link type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增 / 编辑资产弹窗 -->
    <el-dialog 
      v-model="showEditDialog" 
      :title="isEditing ? '编辑资产信息' : '登记新资产入库'" 
      width="90%" 
      max-width="500px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="器材名称" required>
          <el-input v-model="form.asset_name" placeholder="如：索尼 A7M4 专业单反相机套件" />
        </el-form-item>
        <el-form-item label="资产编号" :help="isEditing ? '' : '留空将按年份自增自动生成，如 AST-2026-0007'">
          <el-input v-model="form.asset_code" placeholder="留空自动生成，也可自定义编号" :disabled="isEditing" />
        </el-form-item>
        <el-form-item label="器材分类" required>
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="实验器材" value="实验器材" />
            <el-option label="开发套件" value="开发套件" />
            <el-option label="专业书籍" value="专业书籍" />
            <el-option label="工具设备" value="工具设备" />
          </el-select>
        </el-form-item>
        <el-form-item label="存放位置" required>
          <el-input v-model="form.location" placeholder="如：艺林馆 1120室 (器材柜 A-1)" />
        </el-form-item>
        <el-form-item label="规格/说明">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="详细规格参数与使用注意事项" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitAsset">
          保存提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 状态强制调度弹窗 -->
    <el-dialog v-model="showStatusDialog" title="手动调度资产状态" width="90%" max-width="400px">
      <el-form label-position="top">
        <el-form-item label="新状态设定">
          <el-radio-group v-model="targetStatus">
            <el-radio-button value="AVAILABLE">空闲可用 (AVAILABLE)</el-radio-button>
            <el-radio-button value="MAINTENANCE">维修检修 (MAINTENANCE)</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调度说明备注">
          <el-input v-model="statusRemark" placeholder="如：送修镜头调焦齿轮，预计3日后归位" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStatusDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleUpdateStatus">
          确认变更
        </el-button>
      </template>
    </el-dialog>

    <!-- 二维码贴纸弹窗 -->
    <el-dialog v-model="showQrDialog" title="物理二维码标签 (PNG贴纸)" width="90%" max-width="400px" center>
      <div v-if="selectedAssetForQr" class="qr-preview-box">
        <h4 class="qr-name">{{ selectedAssetForQr.asset_name }}</h4>
        <span class="qr-code">{{ selectedAssetForQr.asset_code }}</span>
        <div class="qr-img-frame">
          <img :src="getAssetQrUrl(selectedAssetForQr.asset_code)" alt="二维码贴纸" />
        </div>
        <p class="qr-hint">点击下方按钮可直接保存 PNG 高清贴纸并打印粘贴于器材外壳</p>
      </div>
      <template #footer>
        <el-button @click="showQrDialog = false">关闭</el-button>
        <a :href="getAssetQrUrl(selectedAssetForQr?.asset_code)" download="asset_qr.png" target="_blank" class="download-link">
          <el-button type="primary">下载贴纸图片</el-button>
        </a>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { 
  getAssetsApi, createAssetApi, updateAssetApi, updateAssetStatusApi, deleteAssetApi, getAssetQrUrl 
} from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'

const assetList = ref([])
const loading = ref(false)
const searchKey = ref('')
const filterCategory = ref('')
const filterStatus = ref('ALL')

// 新增/编辑
const showEditDialog = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const submitLoading = ref(false)
const form = reactive({
  asset_name: '',
  asset_code: '',
  category: '实验器材',
  location: '艺林馆 1120室 (예림관 1120호)',
  description: ''
})

// 状态变更
const showStatusDialog = ref(false)
const targetStatus = ref('AVAILABLE')
const statusRemark = ref('')
const statusTargetAsset = ref(null)

// 二维码
const showQrDialog = ref(false)
const selectedAssetForQr = ref(null)

async function loadAssets() {
  loading.value = true
  try {
    const res = await getAssetsApi({
      search: searchKey.value || undefined,
      category: filterCategory.value || undefined,
      status: filterStatus.value === 'ALL' ? undefined : filterStatus.value
    })
    assetList.value = res
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  isEditing.value = false
  editingId.value = null
  form.asset_name = ''
  form.asset_code = ''
  form.category = '实验器材'
  form.location = '艺林馆 1120室 (예림관 1120호)'
  form.description = ''
  showEditDialog.value = true
}

function openEditModal(asset) {
  isEditing.value = true
  editingId.value = asset.id
  form.asset_name = asset.asset_name
  form.asset_code = asset.asset_code
  form.category = asset.category
  form.location = asset.location
  form.description = asset.description || ''
  showEditDialog.value = true
}

async function handleSubmitAsset() {
  if (!form.asset_name.trim()) {
    ElMessage.warning('请输入器材名称')
    return
  }
  submitLoading.value = true
  try {
    if (isEditing.value) {
      await updateAssetApi(editingId.value, {
        asset_name: form.asset_name,
        category: form.category,
        location: form.location,
        description: form.description
      })
      ElMessage.success('资产信息更新成功')
    } else {
      await createAssetApi({
        asset_name: form.asset_name,
        asset_code: form.asset_code.trim() || undefined,
        category: form.category,
        location: form.location,
        description: form.description
      })
      ElMessage.success('新器材入库登记成功')
    }
    showEditDialog.value = false
    loadAssets()
  } catch (e) {
  } finally {
    submitLoading.value = false
  }
}

function openStatusModal(asset) {
  statusTargetAsset.value = asset
  targetStatus.value = asset.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE'
  statusRemark.value = ''
  showStatusDialog.value = true
}

async function handleUpdateStatus() {
  if (!statusTargetAsset.value) return
  submitLoading.value = true
  try {
    await updateAssetStatusApi(statusTargetAsset.value.id, targetStatus.value, statusRemark.value)
    ElMessage.success('状态调度成功')
    showStatusDialog.value = false
    loadAssets()
  } catch (e) {
  } finally {
    submitLoading.value = false
  }
}

function openQrModal(asset) {
  selectedAssetForQr.value = asset
  showQrDialog.value = true
}

function handleDelete(asset) {
  if (asset.status === 'RENTED') {
    ElMessage.warning('该器材处于借用中，不可删除！')
    return
  }
  ElMessageBox.confirm(`确定要删除并注销资产【${asset.asset_name}】(${asset.asset_code}) 吗？此操作不可撤销。`, '危险操作确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'error'
  }).then(async () => {
    try {
      await deleteAssetApi(asset.id)
      ElMessage.success('已注销该资产')
      loadAssets()
    } catch (e) {}
  }).catch(() => {})
}

function formatStatus(status) {
  const map = { AVAILABLE: '空闲可借', RENTED: '借调流转中', MAINTENANCE: '维修检修中' }
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
.page-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-top-bar h2 {
  font-size: 1.35rem;
  color: #0f172a;
}

.subtitle {
  font-size: 0.82rem;
  color: #64748b;
  margin-top: 2px;
}

.filter-card {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.table-card {
  padding: 16px;
}

.code-font {
  font-family: monospace;
  font-size: 0.85rem;
  color: #0284c7;
  font-weight: 600;
}

.borrower-name {
  color: #d97706;
  font-weight: 600;
}

.text-muted {
  color: #94a3b8;
}

.qr-preview-box {
  text-align: center;
}

.qr-name {
  font-size: 1.1rem;
  color: #0f172a;
}

.qr-code {
  font-size: 0.85rem;
  color: #64748b;
  font-family: monospace;
}

.qr-img-frame {
  margin: 14px auto;
  padding: 12px;
  background: white;
  display: inline-block;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.qr-img-frame img {
  width: 220px;
  height: 220px;
  display: block;
}

.qr-hint {
  font-size: 0.78rem;
  color: #94a3b8;
}

.download-link {
  text-decoration: none;
}
</style>
