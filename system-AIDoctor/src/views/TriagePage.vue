<template>
  <div>
    <!-- ========== 步骤1：症状输入 ========== -->
    <el-card shadow="never" style="margin-bottom:16px">
      <template #header>
        <span style="font-weight:bold">🏥 挂号分诊指导</span>
        <span style="color:#909399;font-size:13px;margin-left:12px">
          请描述您的症状，系统将为您推荐合适的科室和医院
        </span>
      </template>

      <el-input
        v-model="symptomInput"
        type="textarea"
        :rows="3"
        placeholder="请详细描述您的症状，例如：「头痛三天，伴有恶心，无发烧」或「咳嗽、喉咙痛两天」..."
        @keyup.enter.exact="handleRecommend"
      />
      <div style="margin-top:12px;display:flex;align-items:center;gap:8px">
        <el-button type="primary" :loading="loading" @click="handleRecommend">
          🔍 开始分诊
        </el-button>
      </div>
      <div v-if="result?.analysis" style="margin-top:8px;color:#606266;font-size:13px;line-height:1.7">
        💡 {{ result.analysis }}
      </div>
    </el-card>

    <!-- ========== 步骤2：分诊推荐结果 ========== -->
    <div v-if="result && result.recommendations?.length">
      <el-row :gutter="16">
        <el-col
          v-for="(rec, i) in result.recommendations"
          :key="i"
          :span="Math.max(8, Math.floor(24 / result.recommendations.length))"
        >
          <el-card
            shadow="hover"
            class="result-card"
            :class="{ 'top-match': i === 0 }"
          >
            <template #header>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-weight:bold;font-size:15px">{{ rec.department }}</span>
                <el-tag
                  :type="priorityType(rec.priority)"
                  size="small"
                  effect="dark"
                >
                  {{ priorityLabel(rec.priority) }}
                </el-tag>
              </div>
            </template>

            <!-- 置信度 -->
            <div style="margin-bottom:8px;display:flex;align-items:center;gap:8px">
              <span style="font-size:12px;color:#909399">匹配度</span>
              <el-progress
                :percentage="Math.round((rec.confidence || 0) * 100)"
                :stroke-width="6"
                :color="confidenceColor(rec.confidence)"
                style="flex:1"
              />
            </div>

            <p style="color:#606266;font-size:13px;margin:0 0 8px;line-height:1.7">
              {{ rec.priorityReason }}
            </p>
            <p style="color:#909399;font-size:12px;margin:0;line-height:1.6">
              {{ rec.guide.slice(0, 80) }}{{ rec.guide.length > 80 ? '...' : '' }}
            </p>

            <!-- 备选科室 -->
            <div v-if="rec.alternativeDepartments?.length" style="margin-top:8px">
              <span style="font-size:12px;color:#909399;margin-right:4px">备选：</span>
              <el-tag
                v-for="alt in rec.alternativeDepartments"
                :key="alt"
                size="small"
                type="info"
                style="margin:1px 3px"
              >
                {{ alt }}
              </el-tag>
            </div>

            <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">
              <el-button size="small" type="primary" @click="queryHospitals(rec.department)">
                🏥 查附近医院
              </el-button>
              <el-button size="small" @click="openGuide(rec.department)">
                📋 就诊指南
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 追问建议 -->
    <div
      v-if="result?.suggestedQuestions?.length"
      style="margin-top:16px;padding:12px 16px;background:#f5f7fa;border-radius:8px"
    >
      <span style="font-size:13px;color:#606266;margin-right:8px">💬 您可以补充以下信息帮助更精准分诊：</span>
      <el-tag
        v-for="(q, i) in result.suggestedQuestions"
        :key="i"
        size="small"
        effect="plain"
        style="margin:2px 4px;cursor:pointer"
        @click="appendQuestion(q)"
      >
        {{ q }}
      </el-tag>
    </div>

    <!-- 无匹配提示 -->
    <el-result
      v-else-if="result && !result.recommendations?.length"
      icon="info"
      title="未匹配到合适的科室"
      sub-title="建议前往综合医院普通内科或急诊科，由分诊台护士为您现场指导"
    >
      <template #extra>
        <el-button type="primary" @click="queryHospitals('')">查看所有医院</el-button>
      </template>
    </el-result>

    <!-- ========== 步骤3：医院列表 + 筛选 ========== -->
    <el-card v-if="hospitals.list?.length" shadow="never" style="margin-top:16px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <span style="font-weight:bold">🏥 {{ hospitals.total }} 家相关医院</span>
          <el-space>
            <el-input
              v-model="hospitalFilters.keyword"
              size="small"
              placeholder="搜索医院名称"
              clearable
              style="width:180px"
              @input="loadHospitals"
            />
            <el-select
              v-model="hospitalFilters.level"
              size="small"
              placeholder="等级筛选"
              clearable
              style="width:110px"
              @change="loadHospitals"
            >
              <el-option label="三甲" value="三甲" />
              <el-option label="三乙" value="三乙" />
              <el-option label="二甲" value="二甲" />
              <el-option label="社区" value="社区" />
            </el-select>
          </el-space>
        </div>
      </template>

      <el-table :data="hospitals.list" stripe style="width:100%">
        <el-table-column prop="name" label="医院名称" min-width="180">
          <template #default="{ row }">
            <span style="font-weight:bold">{{ row.name }}</span>
            <el-tag size="small" style="margin-left:6px" :type="row.level === '三甲' ? 'danger' : row.level === '二甲' ? 'warning' : 'info'">
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column label="急诊" width="75">
          <template #default="{ row }">
            <el-tag :type="row.isEmergency ? 'success' : 'info'" size="small">
              {{ row.isEmergency ? '24h急诊' : '无急诊' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column label="电话" width="140">
          <template #default="{ row }">
            <el-link :href="'tel:' + row.phone" type="primary" :underline="false">
              {{ row.phone }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="科室" min-width="200">
          <template #default="{ row }">
            <el-tag
              v-for="dept in row.departments.slice(0, 5)"
              :key="dept"
              size="small"
              style="margin:1px 2px"
            >
              {{ dept }}
            </el-tag>
            <el-tag v-if="row.departments.length > 5" size="small" type="info" style="margin:1px 2px">
              +{{ row.departments.length - 5 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提示" min-width="200">
          <template #default="{ row }">
            <span style="font-size:12px;color:#606266">{{ row.tips }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ========== 就诊指南弹窗 ========== -->
    <el-dialog v-model="guideVisible" :title="'📋 ' + guideData.department + ' — 就诊指南'" width="560px">
      <template v-if="guideData.description">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="科室简介">
            {{ guideData.description }}
          </el-descriptions-item>
          <el-descriptions-item label="常见检查项目">
            {{ guideData.commonChecks }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <h4>📝 就诊前准备</h4>
        <div style="white-space:pre-line;color:#606266;line-height:1.8;font-size:13px">
          {{ guideData.prepTips }}
        </div>

        <el-divider />

        <h4>🩺 分诊建议</h4>
        <div style="white-space:pre-line;color:#606266;line-height:1.8;font-size:13px">
          {{ guideData.triageGuide }}
        </div>
      </template>

      <template #footer>
        <el-button @click="guideVisible = false">关闭</el-button>
        <el-button type="primary" @click="guideVisible = false; queryHospitals(guideData.department)">
          查该科室医院
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { triageRecommendAPI, getHospitalsAPI, getDeptGuideAPI } from '@/api/triage'

// ========== 步骤1：分诊推荐 ==========
const symptomInput = ref('')
const loading = ref(false)
const result = ref(null)

const handleRecommend = async () => {
  if (!symptomInput.value.trim()) {
    ElMessage.warning('请输入症状描述')
    return
  }
  loading.value = true
  try {
    result.value = await triageRecommendAPI(symptomInput.value.trim())
    hospitals.list = []  // 清空之前的医院结果
    if (!result.value.recommendations?.length) {
      ElMessage.info('未匹配到精确科室，已为您推荐综合就诊方案')
    } else {
      ElMessage.success(`已为您匹配 ${result.value.recommendations.length} 个科室`)
    }
  } catch { /* 拦截器处理 */ }
  finally { loading.value = false }
}

// ========== 步骤3：医院查询 ==========
const hospitalFilters = reactive({ keyword: '', level: '' })
const hospitals = ref({ list: [], total: 0 })

const queryHospitals = async (department) => {
  try {
    const data = await getHospitalsAPI({
      department: department || undefined,
      keyword: hospitalFilters.keyword || undefined,
      level: hospitalFilters.level || undefined
    })
    hospitals.value = data
    if (!data.list?.length) {
      ElMessage.info('未找到相关医院，请放宽筛选条件')
    }
  } catch { /* */ }
}

const loadHospitals = () => {
  // 从当前筛选条件重新加载
  queryHospitals('')
}

// ========== 就诊指南弹窗 ==========
const guideVisible = ref(false)
const guideData = reactive({
  department: '',
  description: '',
  commonChecks: '',
  prepTips: '',
  triageGuide: ''
})

const openGuide = async (dept) => {
  try {
    const data = await getDeptGuideAPI(dept)
    Object.assign(guideData, data)
    guideVisible.value = true
  } catch { /* */ }
}

// ========== 工具函数 ==========
const priorityType = (p) => ({ 1: 'danger', 2: 'warning', 3: 'success' }[p] || 'info')
const priorityLabel = (p) => ({ 1: '🔴 紧急就医', 2: '🟡 常规就诊', 3: '🟢 居家观察' }[p] || '未知')
const confidenceColor = (c) => {
  const v = (c || 0) * 100
  if (v >= 70) return '#67c23a'
  if (v >= 40) return '#e6a23c'
  return '#f56c6c'
}

const appendQuestion = (q) => {
  if (!symptomInput.value) {
    symptomInput.value = q
  } else if (!symptomInput.value.includes(q)) {
    symptomInput.value += '。' + q
  }
}
</script>

<style scoped>
.result-card {
  border: 2px solid #ebeef5;
  transition: all 0.2s;
}
.result-card:hover {
  border-color: #409eff;
}
.top-match {
  border-color: #409eff;
  background: #f0f9ff;
}
</style>
