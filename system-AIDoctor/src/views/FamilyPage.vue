<template>
  <div>
    <!-- 顶部操作栏 -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div>
        <h3 style="margin:0">👨‍👩‍👧‍👦 家庭健康管理</h3>
        <span style="color:#909399;font-size:13px">共 {{ familyList.length }} 位家庭成员</span>
      </div>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon> 添加家庭成员
      </el-button>
    </div>

    <!-- 加载状态 -->
    <el-skeleton v-if="loading" :rows="4" animated />

    <!-- 空状态 -->
    <el-empty v-else-if="familyList.length === 0" description="暂无家庭成员，点击上方按钮添加">
      <el-button type="primary" @click="openAddDialog">添加家人</el-button>
    </el-empty>

    <!-- 成员列表 -->
    <el-table v-else :data="familyList" stripe style="width:100%">
      <el-table-column prop="real_name" label="姓名" width="120">
        <template #default="{ row }">
          <div style="display:flex;align-items:center;gap:8px">
            <el-avatar :size="32" style="background:#409eff">
              {{ row.real_name?.charAt(0) }}
            </el-avatar>
            <span>{{ row.real_name }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="username" label="账号" width="150" />

      <el-table-column prop="relation" label="亲属关系" width="120">
        <template #default="{ row }">
          <el-tag :type="relationTag(row.relation)">
            {{ row.relation }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="permission" label="操作权限" width="120">
        <template #default="{ row }">
          <el-tag :type="row.permission === 2 ? 'success' : 'info'">
            {{ row.permission === 2 ? '可编辑' : '只读' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="family_user_status" label="账号状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.family_user_status === 1 ? 'success' : 'danger'" size="small">
            {{ row.family_user_status === 1 ? '正常' : '冻结' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="create_time" label="加入时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.create_time) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="openEditDialog(row)">
            修改
          </el-button>
          <el-button size="small" type="danger" link @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- ==================== 添加家庭成员弹窗 ==================== -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加家庭成员"
      width="460px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="90px"
        label-position="left"
      >
        <el-form-item label="家人账号" prop="familyUsername">
          <el-input
            v-model="addForm.familyUsername"
            placeholder="输入家人已注册的手机号（11位）"
            maxlength="11"
            clearable
          />
        </el-form-item>

        <el-form-item label="亲属关系" prop="relation">
          <el-select v-model="addForm.relation" placeholder="请选择亲属关系" style="width:100%">
            <el-option
              v-for="r in relations"
              :key="r.value"
              :label="r.label"
              :value="r.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="数据权限" prop="permission">
          <el-radio-group v-model="addForm.permission">
            <el-radio :value="1">只读（仅查看健康信息）</el-radio>
            <el-radio :value="2">可编辑（代录入+代问诊）</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <!-- 后端返回的错误提示 -->
      <el-alert v-if="addError" :title="addError" type="error" show-icon :closable="false"
                style="margin-top:8px" />

      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addLoading" @click="handleAdd">
          {{ addLoading ? '添加中...' : '确认添加' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 修改家庭成员弹窗 ==================== -->
    <el-dialog
      v-model="editDialogVisible"
      title="修改家庭成员"
      width="420px"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom:16px;color:#606266">
        正在修改 <strong>{{ editTarget?.real_name }}</strong> 的权限设置
      </div>

      <el-form label-width="90px" label-position="left">
        <el-form-item label="亲属关系">
          <el-select v-model="editForm.relation" style="width:100%">
            <el-option
              v-for="r in relations"
              :key="r.value"
              :label="r.label"
              :value="r.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="数据权限">
          <el-radio-group v-model="editForm.permission">
            <el-radio :value="1">只读</el-radio>
            <el-radio :value="2">可编辑</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="handleUpdate">
          {{ editLoading ? '保存中...' : '保存修改' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getFamilyListAPI,
  addFamilyAPI,
  updateFamilyAPI,
  deleteFamilyAPI
} from '@/api/family'

// ========== 状态 ==========
const familyList = ref([])
const loading = ref(true)

// ========== 常量 ==========
const relations = [
  { label: '👨 父亲', value: '父亲' },
  { label: '👩 母亲', value: '母亲' },
  { label: '👦 儿子', value: '儿子' },
  { label: '👧 女儿', value: '女儿' },
  { label: '💑 配偶', value: '配偶' },
  { label: '📋 其他', value: '其他' }
]

  const relationTag = (relation) => {
    const map = { '父亲': 'info', '母亲': 'danger', '儿子': 'success', '女儿': 'success', '配偶': 'warning', '其他': 'info' }
    return map[relation] || 'info'
  }

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

// ========== 加载列表 ==========
const loadList = async () => {
  loading.value = true
  try {
    const data = await getFamilyListAPI()
    familyList.value = data.list || []
  } catch {
    familyList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadList)

// ========== 添加成员 ==========
const addDialogVisible = ref(false)
const addLoading = ref(false)
const addError = ref('')
const addFormRef = ref(null)
const addForm = ref({
  familyUsername: '',
  relation: '',
  permission: 1
})

const addRules = {
  familyUsername: [
    { required: true, message: '请输入家人登录账号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入11位手机号', trigger: 'blur' }
  ],
  relation: [{ required: true, message: '请选择亲属关系', trigger: 'change' }],
  permission: [{ required: true, message: '请选择权限', trigger: 'change' }]
}

const openAddDialog = () => {
  addForm.value = { familyUsername: '', relation: '', permission: 1 }
  addError.value = ''
  addDialogVisible.value = true
}

const handleAdd = async () => {
  // 手动校验
  const valid = await addFormRef.value?.validate().catch(() => false)
  if (!valid) return

  addLoading.value = true
  addError.value = ''
  try {
    await addFamilyAPI(addForm.value.familyUsername, addForm.value.relation, addForm.value.permission)
    ElMessage.success('添加家庭成员成功')
    addDialogVisible.value = false
    loadList() // 刷新列表
  } catch (err) {
    addError.value = err.message || '添加失败，请检查账号是否正确'
  } finally {
    addLoading.value = false
  }
}

// ========== 修改成员 ==========
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editTarget = ref(null)
const editForm = ref({ relation: '', permission: 1 })

const openEditDialog = (row) => {
  editTarget.value = row
  editForm.value = {
    relation: row.relation,
    permission: row.permission
  }
  editDialogVisible.value = true
}

const handleUpdate = async () => {
  editLoading.value = true
  try {
    await updateFamilyAPI(editTarget.value.relation_id, {
      relation: editForm.value.relation,
      permission: editForm.value.permission
    })
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    loadList()
  } catch {
    // 拦截器处理
  } finally {
    editLoading.value = false
  }
}

// ========== 删除成员 ==========
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除家庭成员「${row.real_name}」吗？删除后将失去对 ta 的健康数据访问权限。`,
    '删除确认',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteFamilyAPI(row.relation_id)
      ElMessage.success('已删除')
      loadList()
    } catch { /* 拦截器处理 */ }
  }).catch(() => { /* 用户取消 */ })
}
</script>
