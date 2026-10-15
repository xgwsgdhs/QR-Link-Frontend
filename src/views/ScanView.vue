<template>
  <div class="scan-view-container">
    <!-- 顶部状态栏 -->
    <div class="scan-header">
      <div class="title-row">
        <h2>📷 扫码借还中心</h2>
        <el-tag :type="scannerRunning ? 'success' : 'info'" effect="plain" round size="small">
          {{ scannerRunning ? '摄像头运行中' : '扫码未激活' }}
        </el-tag>
      </div>
      <p class="desc">对准设备上的物理二维码，或上传标签照片快速办理借出与归还</p>
    </div>

    <!-- 扫码主操作区 -->
    <div class="scanner-card glass-card">
      <!-- 摄像头取景框容器 -->
      <div class="viewport-box">
        <div id="qr-reader" class="qr-reader-window"></div>
        
        <!-- 取景辅助框与激光动效 (仅在摄像头运行且未扫到结果时显示) -->
        <div v-if="scannerRunning" class="scan-overlay">
          <div class="scan-crosshair">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
            <div class="laser-line"></div>
          </div>
          <span class="scan-tip">将二维码置于框内即可自动识别</span>
        </div>

        <!-- 摄像头停止时的遮罩与启动按钮 -->
        <div v-if="!scannerRunning" class="idle-overlay">
          <el-icon :size="54" color="#94a3b8"><Camera /></el-icon>
          <p class="idle-text">摄像头已休眠</p>
          <el-button type="primary" size="large" round @click="startScanner">
            开启后置相机扫码
          </el-button>
        </div>
      </div>

      <!-- 相机辅助控制按钮 -->
      <div v-if="scannerRunning" class="camera-controls">
        <el-button size="default" :icon="Switch" @click="switchCamera">
          切换镜头
        </el-button>
        <el-button size="default" :type="torchOn ? 'warning' : 'default'" :icon="Sunny" @click="toggleTorch">
          {{ torchOn ? '关闭闪光灯' : '补光灯' }}
        </el-button>
        <el-button size="default" type="danger" plain :icon="VideoPause" @click="stopScanner">
          暂停扫描
        </el-button>
      </div>

      <!-- 备用通道：相册上传识别 & 手动输入 -->
      <div class="alt-methods">
        <div class="alt-row">
          <label class="upload-btn">
            <el-icon><Picture /></el-icon>
            <span>相册照片识别</span>
            <input type="file" accept="image/*" class="hidden-file-input" @change="handleFileScan" />
          </label>

          <button class="manual-input-btn" @click="showManualModal = true">
            <el-icon><EditPen /></el-icon>
            <span>手动输码借还</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 弹窗：识别到的物资借还操作抽屉/弹窗 -->
    <el-dialog
      v-model="showActionDialog"
      title="📦 物资识别确认"
      width="90%"
      max-width="500px"
      :close-on-click-modal="false"
      destroy-on-close
      center
    >
      <div v-if="currentAsset" class="asset-detail-card">
        <div class="detail-header">
          <div class="title-and-status">
            <h3 class="name">{{ currentAsset.asset_name }}</h3>
            <span class="code">{{ currentAsset.asset_code }}</span>
          </div>
          <el-tag :type="statusTagType(currentAsset.status)" effect="dark" size="default">
            {{ formatStatus(currentAsset.status) }}
          </el-tag>
        </div>

        <div class="info-list">
          <div class="info-item">
            <span class="info-label">器材分类:</span>
            <span class="info-val">{{ currentAsset.category }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">存放位置:</span>
            <span class="info-val">{{ currentAsset.location }}</span>
          </div>
          <div v-if="currentAsset.description" class="info-item">
            <span class="info-label">器材规格:</span>
            <span class="info-val">{{ currentAsset.description }}</span>
          </div>
          <div v-if="currentAsset.status === 'RENTED'" class="info-item highlight">
            <span class="info-label">当前借用人:</span>
            <span class="info-val borrower">{{ currentAsset.current_user_name || '其他学生' }}</span>
          </div>
        </div>

        <!-- 借用/归还操作表单 -->
        <div class="action-form">
          <el-form label-position="top">
            <el-form-item :label="currentAsset.status === 'AVAILABLE' ? '借用备注说明 (可选)' : '归还确认说明 (可选)'">
              <el-input 
                v-model="actionRemark" 
                :placeholder="currentAsset.status === 'AVAILABLE' ? '如：课程大作业/活动拍摄' : '如：设备各部件完好归还'"
                clearable
              />
            </el-form-item>
          </el-form>

          <!-- 借出按钮：仅在 AVAILABLE 状态可用 -->
          <div v-if="currentAsset.status === 'AVAILABLE'" class="btn-group">
            <el-button 
              type="success" 
              size="large" 
              class="primary-action-btn"
              :loading="actionLoading"
              @click="submitCheckout"
            >
              <el-icon><Check /></el-icon>
              确认登记借出 (Checkout)
            </el-button>
          </div>

          <!-- 归还按钮：在 RENTED 状态下，本人借用或管理员可归还 -->
          <div v-else-if="currentAsset.status === 'RENTED'" class="btn-group">
            <el-button 
              v-if="canReturnCurrentAsset"
              type="primary" 
              size="large" 
              class="primary-action-btn"
              :loading="actionLoading"
              @click="submitCheckin"
            >
              <el-icon><RefreshRight /></el-icon>
              办理归还入库 (Checkin)
            </el-button>
            <div v-else class="not-allowed-box">
              <el-alert 
                title="该物资由其他同学借用中，普通用户仅支持归还自己名下的设备。" 
                type="warning" 
                :closable="false" 
                show-icon 
              />
            </div>
          </div>

          <!-- 维修中状态 -->
          <div v-else class="btn-group">
            <el-alert 
              title="该器材处于维修检修状态，暂不支持借还流转。" 
              type="info" 
              :closable="false" 
              show-icon 
            />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeActionDialog">返回继续扫码</el-button>
      </template>
    </el-dialog>

    <!-- 手动输码弹窗 -->
    <el-dialog v-model="showManualModal" title="手动输入资产编号" width="90%" max-width="400px">
      <el-input 
        v-model="manualCodeInput" 
        placeholder="例如 AST-2026-0001" 
        size="large"
        clearable
        @keyup.enter="handleManualSubmit"
      />
      <template #footer>
        <el-button @click="showManualModal = false">取消</el-button>
        <el-button type="primary" @click="handleManualSubmit">查询资产</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { getAssetByCodeApi, checkoutAssetApi, checkinAssetApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElNotification } from 'element-plus'
import { 
  Camera, Switch, Sunny, VideoPause, Picture, EditPen, Check, RefreshRight 
} from '@element-plus/icons-vue'

const authStore = useAuthStore()

// 扫码核心状态
let html5QrCode = null
const scannerRunning = ref(false)
const currentCameraId = ref(null)
const availableCameras = ref([])
const torchOn = ref(false)

// 资产操作弹窗状态
const showActionDialog = ref(false)
const currentAsset = ref(null)
const actionRemark = ref('')
const actionLoading = ref(false)

// 手动输入弹窗
const showManualModal = ref(false)
const manualCodeInput = ref('')

// 是否有权限归还当前资产 (借阅本人或者是管理员)
const canReturnCurrentAsset = computed(() => {
  if (!currentAsset.value) return false
  if (authStore.isAdmin) return true
  return currentAsset.value.current_user_id === authStore.user?.id
})

// 蜂鸣音效播放 (Web Audio API)
function playBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.setValueAtTime(880, audioCtx.currentTime)
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.18)
  } catch (e) {}

  if (navigator.vibrate) {
    try { navigator.vibrate(100) } catch (e) {}
  }
}

// 启动摄像头扫码
async function startScanner() {
  try {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode('qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false
      })
    }

    const cameras = await Html5Qrcode.getCameras()
    availableCameras.value = cameras

    // 默认选用后置摄像头 (environment)
    const config = {
      fps: 15,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    }

    const cameraMode = { facingMode: 'environment' }

    await html5QrCode.start(
      cameraMode,
      config,
      onScanSuccess,
      onScanFailure
    )
    scannerRunning.value = true
  } catch (err) {
    console.error('摄像头启动失败:', err)
    const isHttp = location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1'
    if (isHttp) {
      ElNotification({
        title: '需要使用 HTTPS 协议',
        message: '手机浏览器规定必须使用 HTTPS 才能允许调用后置摄像头。请在浏览器地址栏将开头的 http:// 改为 https:// 访问！',
        type: 'warning',
        duration: 9000
      })
    } else {
      ElNotification({
        title: '摄像头访问提示',
        message: '请检查手机浏览器的相机权限授权。您也可以通过“相册照片识别”或“手动输码”直接借还！',
        type: 'warning',
        duration: 7000
      })
    }
    scannerRunning.value = false
  }
}

// 停止扫码
async function stopScanner() {
  if (html5QrCode && scannerRunning.value) {
    try {
      await html5QrCode.stop()
      scannerRunning.value = false
      torchOn.value = false
    } catch (e) {
      console.warn('停止扫码异常:', e)
    }
  }
}

// 切换前后摄像头
async function switchCamera() {
  await stopScanner()
  // 简易切换逻辑
  try {
    await startScanner()
  } catch (e) {}
}

// 补光灯切换
async function toggleTorch() {
  try {
    if (html5QrCode && scannerRunning.value) {
      const capabilities = html5QrCode.getRunningTrackCapabilities()
      if (capabilities && capabilities.torch) {
        torchOn.value = !torchOn.value
        await html5QrCode.applyVideoConstraints({
          advanced: [{ torch: torchOn.value }]
        })
      } else {
        ElMessage.info('当前设备或浏览器不支持开启闪光灯')
      }
    }
  } catch (e) {
    ElMessage.info('补光灯控制不可用')
  }
}

// 扫码成功回调
function onScanSuccess(decodedText) {
  playBeep()
  // 停止继续扫，防止连续重复弹窗
  stopScanner()
  
  // 提取 asset_code
  let code = decodedText.trim()
  if (code.includes('/')) {
    const parts = code.split('/')
    code = parts[parts.length - 1]
  }

  queryAssetAndOpen(code)
}

function onScanFailure(error) {
  // 每一帧未识别到二维码时会触发，静默跳过
}

// 相册选图识别二维码
async function handleFileScan(e) {
  const file = e.target.files?.[0]
  if (!file) return

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode('qr-reader')
  }

  try {
    const decodedText = await html5QrCode.scanFile(file, true)
    onScanSuccess(decodedText)
  } catch (err) {
    ElMessage.error('照片中未检测到有效的二维码，请尝试清晰重拍')
  } finally {
    e.target.value = ''
  }
}

// 手动输入确认
function handleManualSubmit() {
  const code = manualCodeInput.value.trim()
  if (!code) {
    ElMessage.warning('请输入资产编号')
    return
  }
  showManualModal.value = false
  queryAssetAndOpen(code)
}

// 查询资产详情并拉起弹窗
async function queryAssetAndOpen(code) {
  try {
    const asset = await getAssetByCodeApi(code)
    currentAsset.value = asset
    actionRemark.value = ''
    showActionDialog.value = true
  } catch (e) {
    // 错误在 request.js 已处理
  }
}

function closeActionDialog() {
  showActionDialog.value = false
  currentAsset.value = null
  // 重新开启扫码
  startScanner()
}

// 执行借出
async function submitCheckout() {
  if (!currentAsset.value) return
  actionLoading.value = true
  try {
    await checkoutAssetApi(currentAsset.value.asset_code, actionRemark.value)
    ElMessage.success(`🎉 借出成功！已绑定至您的名下`)
    showActionDialog.value = false
    currentAsset.value = null
    startScanner()
  } catch (e) {
  } finally {
    actionLoading.value = false
  }
}

// 执行归还
async function submitCheckin() {
  if (!currentAsset.value) return
  actionLoading.value = true
  try {
    await checkinAssetApi(currentAsset.value.asset_code, actionRemark.value)
    ElMessage.success(`✅ 归还成功！物资状态已恢复为可用`)
    showActionDialog.value = false
    currentAsset.value = null
    startScanner()
  } catch (e) {
  } finally {
    actionLoading.value = false
  }
}

function formatStatus(status) {
  const map = {
    AVAILABLE: '空闲可借',
    RENTED: '借出流转中',
    MAINTENANCE: '检修维护中'
  }
  return map[status] || status
}

function statusTagType(status) {
  const map = {
    AVAILABLE: 'success',
    RENTED: 'warning',
    MAINTENANCE: 'danger'
  }
  return map[status] || 'info'
}

onMounted(() => {
  // 自动尝试开启摄像头
  startScanner()
})

onUnmounted(() => {
  stopScanner()
})
</script>

<style scoped>
.scan-view-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scan-header {
  text-align: center;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 4px;
}

.title-row h2 {
  font-size: 1.3rem;
  color: #0f172a;
  font-weight: 700;
}

.desc {
  font-size: 0.82rem;
  color: #64748b;
}

.scanner-card {
  padding: 16px;
  border-radius: 16px;
}

/* 摄像头取景窗口 */
.viewport-box {
  width: 100%;
  aspect-ratio: 1 / 1;
  max-width: 380px;
  margin: 0 auto;
  background-color: #0f172a;
  border-radius: 14px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.6);
}

.qr-reader-window {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}

/* 取景框遮罩层 */
.scan-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.scan-crosshair {
  width: 220px;
  height: 220px;
  position: relative;
}

.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: #38bdf8;
  border-style: solid;
}

.top-left {
  top: 0;
  left: 0;
  border-width: 3px 0 0 3px;
  border-top-left-radius: 8px;
}
.top-right {
  top: 0;
  right: 0;
  border-width: 3px 3px 0 0;
  border-top-right-radius: 8px;
}
.bottom-left {
  bottom: 0;
  left: 0;
  border-width: 0 0 3px 3px;
  border-bottom-left-radius: 8px;
}
.bottom-right {
  bottom: 0;
  right: 0;
  border-width: 0 3px 3px 0;
  border-bottom-right-radius: 8px;
}

.scan-tip {
  margin-top: 18px;
  font-size: 0.78rem;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.7);
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 0.5px;
}

/* 休眠遮罩 */
.idle-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #1e293b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.idle-text {
  color: #94a3b8;
  font-size: 0.88rem;
}

.camera-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 14px;
}

/* 备用通道 */
.alt-methods {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
}

.alt-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.upload-btn, .manual-input-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover, .manual-input-btn:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #2563eb;
}

.hidden-file-input {
  display: none;
}

/* 物资操作详情卡片 */
.asset-detail-card {
  padding: 4px;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.title-and-status .name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.title-and-status .code {
  font-size: 0.82rem;
  color: #64748b;
  font-family: monospace;
}

.info-list {
  margin: 14px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
}

.info-item {
  display: flex;
  font-size: 0.86rem;
}

.info-label {
  width: 80px;
  color: #64748b;
}

.info-val {
  flex: 1;
  color: #1e293b;
  font-weight: 500;
}

.info-item.highlight .borrower {
  color: #d97706;
  font-weight: 700;
}

.action-form {
  margin-top: 16px;
}

.primary-action-btn {
  width: 100%;
  height: 46px;
  font-size: 1rem;
  font-weight: 600;
}

.not-allowed-box {
  margin-top: 8px;
}
</style>
