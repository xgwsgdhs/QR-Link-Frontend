<template>
  <div class="app-container">
    <div class="page-top-bar">
      <div>
        <h2>👥 团队成员与实名用户花名册</h2>
        <p class="subtitle">新韩大学 Microstone 产学联动团队组员与实验室登记人员名单</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateModal">
        录入/注册新成员
      </el-button>
    </div>

    <div class="table-card glass-card">
      <el-table :data="usersList" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="UID" width="70" align="center" />
        <el-table-column prop="student_id" label="学号 / 教工号" width="140">
          <template #default="{ row }">
            <span class="mono">{{ row.student_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="姓名" min-width="150">
          <template #default="{ row }">
            <strong>{{ row.username }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="权限角色" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.role === 'ADMIN' ? 'danger' : 'success'" effect="dark" size="small">
              {{ row.role === 'ADMIN' ? '管理员 (ADMIN)' : '普通学生 (USER)' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="所属院系 / 专业" min-width="180" />
        <el-table-column prop="contact" label="联系方式" width="140">
          <template #default="{ row }">
            {{ row.contact || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="录入时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              v-if="row.id !== currentUserId"
              size="small" 
              link 
              type="danger" 
              @click="handleDeleteUser(row)"
            >
              注销 / 删除
            </el-button>
            <el-tag v-else size="small" type="info" effect="plain">当前登录账号</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 录入新成员弹窗 -->
    <el-dialog v-model="showCreateDialog" title="录入/注册新成员" width="90%" max-width="480px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="姓名" required>
          <el-input v-model="form.username" placeholder="如：洪吉童 (홍길동)" />
        </el-form-item>
        <el-form-item label="学号/工号" required>
          <el-input v-model="form.student_id" placeholder="如：20261900" />
        </el-form-item>
        <el-form-item label="初始密码" required>
          <el-input v-model="form.password" placeholder="默认 123456" />
        </el-form-item>
        <el-form-item label="权限角色" required>
          <el-radio-group v-model="form.role">
            <el-radio value="USER">普通学生 (USER)</el-radio>
            <el-radio value="ADMIN">管理员 (ADMIN)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="所属院系">
          <el-input v-model="form.department" placeholder="软件工程 (소프트웨어공학과)" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contact" placeholder="如：010-1234-5678" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleCreateUser">
          确认录入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getAllUsersApi, registerUserApi, deleteUserApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

const usersList = ref([])
const loading = ref(false)

const showCreateDialog = ref(false)
const submitLoading = ref(false)
const form = reactive({
  username: '',
  student_id: '',
  password: '123456',
  role: 'USER',
  department: '软件工程专业 (소프트웨어공학과)',
  contact: ''
})

async function loadUsers() {
  loading.value = true
  try {
    const res = await getAllUsersApi()
    usersList.value = res
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  form.username = ''
  form.student_id = ''
  form.password = '123456'
  form.role = 'USER'
  form.department = '软件工程专业 (소프트웨어공학과)'
  form.contact = ''
  showCreateDialog.value = true
}

async function handleCreateUser() {
  if (!form.username.trim() || !form.student_id.trim()) {
    ElMessage.warning('请填写姓名与学号/工号')
    return
  }
  submitLoading.value = true
  try {
    await registerUserApi(form)
    ElMessage.success(`🎉 成员【${form.username}】录入成功！`)
    showCreateDialog.value = false
    loadUsers()
  } catch (e) {
  } finally {
    submitLoading.value = false
  }
}

const handleDeleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要注销并删除用户【${user.username}】（学号：${user.student_id}）吗？此操作不可逆。`,
      '注销警告',
      { 
        confirmButtonText: '确定删除', 
        cancelButtonText: '取消', 
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const res = await deleteUserApi(user.id)
    ElMessage.success(res.message || '用户已成功注销删除')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已由 axios 响应拦截器统一提取 detail 并展示，此处做异常兜底
      console.warn('注销用户异常:', error)
    }
  }
}

function formatTime(isoStr) {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

onMounted(() => {
  loadUsers()
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
  font-weight: 600;
  color: #0284c7;
}
</style>
