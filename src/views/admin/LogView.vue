<template>
  <div class="app-container">
    <div class="page-top-bar">
      <div>
        <h2>📜 实验室借还全生命周期审计流水</h2>
        <p class="subtitle">记录借出人、不可篡改时间戳、归还记录与验收备注流水台账</p>
      </div>
      <el-button :icon="Refresh" @click="loadLogs">刷新流水</el-button>
    </div>

    <div class="table-card glass-card">
      <el-table :data="logsList" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="流水号" width="90" align="center">
          <template #default="{ row }">
            <span class="mono">#{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="asset_name" label="物资品名" min-width="160">
          <template #default="{ row }">
            <strong>{{ row.asset_name }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="asset_code" label="资产编码" width="150">
          <template #default="{ row }">
            <span class="code-font">{{ row.asset_code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="借调学生" width="140">
          <template #default="{ row }">
            <span>{{ row.username }}</span>
            <span class="sub-id">({{ row.student_id }})</span>
          </template>
        </el-table-column>
        <el-table-column prop="rental_time" label="借出时间戳" width="160">
          <template #default="{ row }">
            {{ formatTime(row.rental_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="return_time" label="归还时间戳" width="160">
          <template #default="{ row }">
            <span v-if="row.return_time" class="text-green">{{ formatTime(row.return_time) }}</span>
            <span v-else class="text-yellow">⏱️ 借用中未还</span>
          </template>
        </el-table-column>
        <el-table-column label="流转状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.return_time ? 'success' : 'warning'" effect="dark" size="small">
              {{ row.return_time ? '已归还' : '借出中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="说明备注" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控制 -->
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[15, 30, 50]"
          layout="total, sizes, prev, pager, next"
          :total="totalCount"
          @size-change="loadLogs"
          @current-change="loadLogs"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRentalLogsApi } from '@/api'
import { Refresh } from '@element-plus/icons-vue'

const logsList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15)
const totalCount = ref(0)

async function loadLogs() {
  loading.value = true
  try {
    const skip = (currentPage.value - 1) * pageSize.value
    const res = await getRentalLogsApi({ skip, limit: pageSize.value })
    logsList.value = res
    totalCount.value = res.length >= pageSize.value ? (currentPage.value * pageSize.value + 1) : (skip + res.length)
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function formatTime(isoStr) {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  const Y = d.getFullYear()
  const M = (d.getMonth() + 1).toString().padStart(2, '0')
  const D = d.getDate().toString().padStart(2, '0')
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${Y}-${M}-${D} ${h}:${m}`
}

onMounted(() => {
  loadLogs()
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

.table-card {
  padding: 16px;
}

.mono {
  font-family: monospace;
  color: #64748b;
}

.code-font {
  font-family: monospace;
  font-size: 0.85rem;
  color: #0284c7;
  font-weight: 600;
}

.sub-id {
  font-size: 0.76rem;
  color: #94a3b8;
  display: block;
}

.text-green {
  color: #10b981;
}

.text-yellow {
  color: #d97706;
  font-weight: 500;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
