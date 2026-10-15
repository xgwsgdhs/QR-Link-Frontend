<template>
  <div class="dashboard-screen" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- 顶部科技感大屏标题栏 -->
    <header class="screen-header">
      <div class="header-left">
        <div class="pulse-indicator"></div>
        <span class="system-tag">MICROSTONE · IoT & AI LAB</span>
      </div>

      <div class="header-center">
        <h1 class="screen-title">QR-Link 共享物资全景数字大屏</h1>
        <div class="title-glow-line"></div>
      </div>

      <div class="header-right">
        <span class="digital-clock">{{ currentTime }}</span>
        <button class="tech-icon-btn" :title="autoRefresh ? '暂停自动刷新' : '开启自动刷新'" @click="toggleAutoRefresh">
          <el-icon :class="{ 'spin-icon': autoRefresh }"><Refresh /></el-icon>
        </button>
        <button class="tech-icon-btn" title="全屏显示" @click="toggleFullscreen">
          <el-icon><FullScreen /></el-icon>
        </button>
      </div>
    </header>

    <div class="screen-main-content">
      <!-- 核心指标 KPI 仪表卡片 -->
      <section class="kpi-grid">
        <div class="kpi-card tech-panel">
          <div class="kpi-icon-box total">
            <el-icon><Box /></el-icon>
          </div>
          <div class="kpi-meta">
            <span class="kpi-label">实验室资产总量</span>
            <div class="kpi-num">{{ summary.total_assets || 0 }} <span class="unit">件</span></div>
          </div>
        </div>

        <div class="kpi-card tech-panel">
          <div class="kpi-icon-box available">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="kpi-meta">
            <span class="kpi-label">当前空闲可借</span>
            <div class="kpi-num green">{{ summary.available_assets || 0 }} <span class="unit">件</span></div>
          </div>
        </div>

        <div class="kpi-card tech-panel">
          <div class="kpi-icon-box rented">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="kpi-meta">
            <span class="kpi-label">正在借用流转</span>
            <div class="kpi-num yellow">{{ summary.rented_assets || 0 }} <span class="unit">件</span></div>
          </div>
        </div>

        <div class="kpi-card tech-panel">
          <div class="kpi-icon-box maintenance">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="kpi-meta">
            <span class="kpi-label">检修维护中</span>
            <div class="kpi-num red">{{ summary.maintenance_assets || 0 }} <span class="unit">件</span></div>
          </div>
        </div>

        <div class="kpi-card tech-panel">
          <div class="kpi-icon-box total-logs">
            <el-icon><Tickets /></el-icon>
          </div>
          <div class="kpi-meta">
            <span class="kpi-label">历史借还总频次</span>
            <div class="kpi-num blue">{{ summary.total_rentals_count || 0 }} <span class="unit">次</span></div>
          </div>
        </div>

        <div class="kpi-card tech-panel">
          <div class="kpi-icon-box users">
            <el-icon><User /></el-icon>
          </div>
          <div class="kpi-meta">
            <span class="kpi-label">注册实名用户</span>
            <div class="kpi-num cyan">{{ summary.active_users_count || 0 }} <span class="unit">人</span></div>
          </div>
        </div>
      </section>

      <!-- 中间可视化图表区 -->
      <section class="charts-grid">
        <!-- 状态环形构成图 -->
        <div class="chart-box tech-panel">
          <div class="panel-header">
            <span class="panel-title">⚡ 资产健康与流转状态分布</span>
          </div>
          <div ref="statusChartRef" class="chart-container"></div>
        </div>

        <!-- 热门器材排行榜 TOP 5 -->
        <div class="chart-box tech-panel">
          <div class="panel-header">
            <span class="panel-title">🔥 热门借调器材 TOP 排行榜</span>
          </div>
          <div ref="hotAssetsChartRef" class="chart-container"></div>
        </div>
      </section>

      <!-- 底部流转动态与实时日志 -->
      <section class="logs-section tech-panel">
        <div class="panel-header logs-header">
          <span class="panel-title">📡 实验室借还流水实时审计播报 (不可篡改时间戳)</span>
          <span class="live-pulse">LIVE 实时</span>
        </div>
        <div class="logs-table-wrapper">
          <table class="tech-table">
            <thead>
              <tr>
                <th>流水号</th>
                <th>器材名称</th>
                <th>资产编号</th>
                <th>借调学生</th>
                <th>借出时间戳</th>
                <th>归还时间戳</th>
                <th>流转状态</th>
                <th>说明备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in latestLogs" :key="log.id">
                <td>#{{ log.id }}</td>
                <td class="strong-cell">{{ log.asset_name }}</td>
                <td class="code-cell">{{ log.asset_code }}</td>
                <td>{{ log.username }} ({{ log.student_id }})</td>
                <td>{{ formatTime(log.rental_time) }}</td>
                <td>{{ log.return_time ? formatTime(log.return_time) : '⏱️ 借用中未还' }}</td>
                <td>
                  <span class="status-pill" :class="log.return_time ? 'pill-return' : 'pill-rent'">
                    {{ log.return_time ? '已归还入库' : '在借流转' }}
                  </span>
                </td>
                <td class="remark-cell">{{ log.remark || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getStatsSummaryApi, getHotAssetsApi, getRentalLogsApi } from '@/api'
import { 
  Refresh, FullScreen, Box, CircleCheck, Timer, Warning, Tickets, User 
} from '@element-plus/icons-vue'

// 数据状态
const summary = ref({})
const latestLogs = ref([])
const currentTime = ref('')
const isFullscreen = ref(false)
const autoRefresh = ref(true)

// 图表 DOM 引用与实例
const statusChartRef = ref(null)
const hotAssetsChartRef = ref(null)
let statusChartInstance = null
let hotAssetsChartInstance = null

let clockTimer = null
let refreshTimer = null

// 更新时钟
function updateClock() {
  const now = new Date()
  currentTime.value = now.toLocaleDateString() + ' ' + now.toLocaleTimeString()
}

// 获取全部指标与日志
async function fetchDashboardData() {
  try {
    const [stats, hotAssets, logs] = await Promise.all([
      getStatsSummaryApi(),
      getHotAssetsApi(5),
      getRentalLogsApi({ skip: 0, limit: 6 })
    ])
    summary.value = stats
    latestLogs.value = logs

    renderStatusChart(stats)
    renderHotAssetsChart(hotAssets)
  } catch (e) {
    console.error('看板拉取异常:', e)
  }
}

// 渲染环形状态图
function renderStatusChart(stats) {
  if (!statusChartRef.value) return
  if (!statusChartInstance) {
    statusChartInstance = echarts.init(statusChartRef.value)
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: '#38bdf8',
      textStyle: { color: '#f8fafc' },
      formatter: '{b}: {c}件 ({d}%)'
    },
    legend: {
      bottom: '5%',
      left: 'center',
      textStyle: { color: '#94a3b8' }
    },
    series: [
      {
        name: '物资状态',
        type: 'pie',
        radius: ['45%', '72%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#0f172a',
          borderWidth: 3
        },
        label: {
          show: true,
          position: 'outside',
          color: '#cbd5e1',
          formatter: '{b}: {c}'
        },
        data: [
          { 
            value: stats.available_assets || 0, 
            name: '空闲可借', 
            itemStyle: { color: '#10b981' } 
          },
          { 
            value: stats.rented_assets || 0, 
            name: '在借流转', 
            itemStyle: { color: '#f59e0b' } 
          },
          { 
            value: stats.maintenance_assets || 0, 
            name: '检修维护', 
            itemStyle: { color: '#ef4444' } 
          }
        ]
      }
    ]
  }

  statusChartInstance.setOption(option)
}

// 渲染热门借用设备条形图
function renderHotAssetsChart(hotItems) {
  if (!hotAssetsChartRef.value) return
  if (!hotAssetsChartInstance) {
    hotAssetsChartInstance = echarts.init(hotAssetsChartRef.value)
  }

  const names = (hotItems || []).map(item => item.asset_name).reverse()
  const counts = (hotItems || []).map(item => item.borrow_count).reverse()

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: '#38bdf8',
      textStyle: { color: '#f8fafc' },
      formatter: '{b}: 累计借调 {c} 次'
    },
    grid: {
      top: '10%',
      left: '3%',
      right: '8%',
      bottom: '6%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)' } },
      axisLabel: { color: '#94a3b8' }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { 
        color: '#cbd5e1',
        formatter: (val) => val.length > 9 ? val.slice(0, 9) + '...' : val
      }
    },
    series: [
      {
        name: '借调频次',
        type: 'bar',
        data: counts,
        barWidth: 16,
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#0284c7' },
            { offset: 1, color: '#38bdf8' }
          ])
        },
        label: {
          show: true,
          position: 'right',
          color: '#38bdf8',
          fontWeight: 'bold',
          formatter: '{c} 次'
        }
      }
    ]
  }

  hotAssetsChartInstance.setOption(option)
}

function handleResize() {
  statusChartInstance?.resize()
  hotAssetsChartInstance?.resize()
}

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    clearInterval(refreshTimer)
  }
}

function startAutoRefresh() {
  clearInterval(refreshTimer)
  refreshTimer = setInterval(() => {
    fetchDashboardData()
  }, 10000)
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      isFullscreen.value = true
    }).catch(() => {})
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
    }).catch(() => {})
  }
}

function formatTime(isoStr) {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
  
  nextTick(() => {
    fetchDashboardData()
    startAutoRefresh()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  clearInterval(clockTimer)
  clearInterval(refreshTimer)
  window.removeEventListener('resize', handleResize)
  statusChartInstance?.dispose()
  hotAssetsChartInstance?.dispose()
})
</script>

<style scoped>
.dashboard-screen {
  padding: 16px 24px 32px;
  min-height: 100vh;
}

/* 顶部标题栏 */
.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pulse-indicator {
  width: 10px;
  height: 10px;
  background-color: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 12px #10b981;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.9); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.6; }
  100% { transform: scale(0.9); opacity: 1; }
}

.system-tag {
  font-size: 0.76rem;
  letter-spacing: 1.5px;
  color: #38bdf8;
  font-weight: 600;
}

.header-center {
  text-align: center;
  position: relative;
}

.screen-title {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 2px;
  background: linear-gradient(180deg, #ffffff 0%, #bae6fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title-glow-line {
  width: 220px;
  height: 3px;
  margin: 4px auto 0;
  background: linear-gradient(90deg, transparent, #38bdf8, transparent);
  box-shadow: 0 0 10px #38bdf8;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.digital-clock {
  font-family: monospace;
  font-size: 0.95rem;
  color: #94a3b8;
  letter-spacing: 1px;
}

.tech-icon-btn {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.tech-icon-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
}

.spin-icon {
  animation: spin 6s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* KPI 仪表卡片 */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.kpi-card {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.kpi-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.kpi-icon-box.total { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.kpi-icon-box.available { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.kpi-icon-box.rented { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.kpi-icon-box.maintenance { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.kpi-icon-box.total-logs { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
.kpi-icon-box.users { background: rgba(6, 182, 212, 0.2); color: #22d3ee; }

.kpi-meta {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.78rem;
  color: #94a3b8;
}

.kpi-num {
  font-size: 1.45rem;
  font-weight: 800;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.kpi-num.green { color: #34d399; }
.kpi-num.yellow { color: #fbbf24; }
.kpi-num.red { color: #f87171; }
.kpi-num.blue { color: #c084fc; }
.kpi-num.cyan { color: #22d3ee; }

.kpi-num .unit {
  font-size: 0.78rem;
  font-weight: normal;
  color: #64748b;
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 900px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-box {
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
}

.panel-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: #e2e8f0;
  letter-spacing: 0.5px;
}

.chart-container {
  width: 100%;
  height: 280px;
}

/* 底部实时日志 */
.logs-section {
  padding: 16px;
}

.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.live-pulse {
  font-size: 0.72rem;
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.logs-table-wrapper {
  overflow-x: auto;
}

.tech-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  color: #cbd5e1;
}

.tech-table th {
  text-align: left;
  padding: 10px 12px;
  background: rgba(30, 41, 59, 0.5);
  color: #94a3b8;
  font-weight: 600;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
}

.tech-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(51, 65, 85, 0.3);
}

.tech-table tbody tr:hover {
  background: rgba(56, 189, 248, 0.05);
}

.strong-cell {
  font-weight: 600;
  color: #f1f5f9;
}

.code-cell {
  font-family: monospace;
  color: #38bdf8;
}

.status-pill {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 4px;
}

.pill-rent {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.pill-return {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.remark-cell {
  color: #94a3b8;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
