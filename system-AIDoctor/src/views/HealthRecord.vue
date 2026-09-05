<template>
  <div class="health-record">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 1. 基础信息 -->
      <el-tab-pane label="📋 基础信息" name="basic">
        <div class="tab-pane">
          <el-form :model="basicForm" label-width="120px" size="default">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="出生日期">
                  <el-date-picker v-model="basicForm.birthDate" type="date" placeholder="选择日期" style="width:100%" value-format="YYYY-MM-DD" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="性别">
                  <el-select v-model="basicForm.gender" placeholder="请选择" style="width:100%">
                    <el-option label="男" value="男" />
                    <el-option label="女" value="女" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="血型">
                  <el-select v-model="basicForm.bloodType" placeholder="请选择" style="width:100%">
                    <el-option label="A型" value="A" />
                    <el-option label="B型" value="B" />
                    <el-option label="AB型" value="AB" />
                    <el-option label="O型" value="O" />
                    <el-option label="不详" value="未知" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="身高(cm)">
                  <el-input-number v-model="basicForm.height" :min="50" :max="250" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="体重(kg)">
                  <el-input-number v-model="basicForm.weight" :min="10" :max="300" :precision="1" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="腰围(cm)">
                  <el-input-number v-model="basicForm.waistCircumference" :min="40" :max="200" :precision="1" style="width:100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="家族病史">
              <el-input v-model="basicForm.familyIllness" type="textarea" :rows="3" placeholder="如有家族遗传病史，请在此说明" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasicInfo" :loading="saving">保存基础信息</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 2. 手术史 -->
      <el-tab-pane label="🔪 手术史" name="surgery">
        <div class="tab-pane">
          <div class="section-header">
            <span>共 {{ surgeries.length }} 条手术记录</span>
            <el-button type="primary" size="small" @click="showSurgeryDialog()">＋ 新增手术</el-button>
          </div>
          <el-table :data="surgeries" stripe style="width:100%" v-loading="loading.surgery">
            <el-table-column prop="surgery_name" label="手术名称" min-width="160" />
            <el-table-column prop="surgery_time" label="手术日期" width="120" />
            <el-table-column prop="hospital" label="医院" min-width="160" />
            <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="showSurgeryDialog(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="confirmDelete('surgery', row.surgery_id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 3. 疾病史 -->
      <el-tab-pane label="🩺 疾病史" name="disease">
        <div class="tab-pane">
          <div class="section-header">
            <span>共 {{ diseases.length }} 条疾病记录</span>
            <el-button type="primary" size="small" @click="showDiseaseDialog()">＋ 新增疾病</el-button>
          </div>
          <el-table :data="diseases" stripe style="width:100%" v-loading="loading.disease">
            <el-table-column prop="disease_name" label="疾病名称" min-width="160" />
            <el-table-column prop="diagnosis_time" label="确诊日期" width="120" />
            <el-table-column prop="hospital" label="就诊医院" min-width="160" />
            <el-table-column label="是否治愈" width="90">
              <template #default="{ row }">
                <el-tag :type="row.is_cured ? 'success' : 'warning'">{{ row.is_cured ? '已治愈' : '未治愈' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="showDiseaseDialog(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="confirmDelete('disease', row.disease_id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 4. 过敏史 -->
      <el-tab-pane label="⚠️ 过敏史" name="allergy">
        <div class="tab-pane">
          <div class="section-header">
            <span>共 {{ allergies.length }} 条过敏记录</span>
            <el-button type="primary" size="small" @click="showAllergyDialog()">＋ 新增过敏</el-button>
          </div>
          <el-table :data="allergies" stripe style="width:100%" v-loading="loading.allergy">
            <el-table-column prop="allergen" label="过敏原" min-width="160" />
            <el-table-column prop="reaction" label="反应" min-width="160" />
            <el-table-column label="严重程度" width="90">
              <template #default="{ row }">
                <el-tag :type="row.severity === '重' ? 'danger' : row.severity === '中' ? 'warning' : 'info'">{{ row.severity }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="showAllergyDialog(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="confirmDelete('allergy', row.allergy_id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 5. 用药史 -->
      <el-tab-pane label="💊 用药史" name="medication">
        <div class="tab-pane">
          <div class="section-header">
            <span>共 {{ medications.length }} 条用药记录</span>
            <el-button type="primary" size="small" @click="showMedicationDialog()">＋ 新增用药</el-button>
          </div>
          <el-table :data="medications" stripe style="width:100%" v-loading="loading.medication">
            <el-table-column prop="medicine_name" label="药物名称" min-width="140" />
            <el-table-column prop="dosage" label="剂量" width="80" />
            <el-table-column prop="frequency" label="频次" width="100" />
            <el-table-column prop="start_time" label="开始时间" width="110" />
            <el-table-column prop="end_time" label="结束时间" width="110" />
            <el-table-column label="持续中" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.is_ongoing" type="warning">进行中</el-tag>
                <span v-else>已结束</span>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="showMedicationDialog(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="confirmDelete('medication', row.medication_id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 6. 体征数据 -->
      <el-tab-pane label="📊 体征数据" name="sign">
        <div class="tab-pane">
          <el-card shadow="never" style="margin-bottom:16px">
            <template #header>📝 记录体征</template>
            <el-form :model="signForm" label-width="100px" size="small" inline>
              <el-form-item label="收缩压(mmHg)">
                <el-input-number v-model="signForm.bloodPressureHigh" :min="60" :max="260" style="width:130px" />
              </el-form-item>
              <el-form-item label="舒张压(mmHg)">
                <el-input-number v-model="signForm.bloodPressureLow" :min="30" :max="160" style="width:130px" />
              </el-form-item>
              <el-form-item label="血糖(mmol/L)">
                <el-input-number v-model="signForm.bloodSugar" :min="1" :max="30" :precision="1" :step="0.1" style="width:130px" />
              </el-form-item>
              <el-form-item label="心率(次/分)">
                <el-input-number v-model="signForm.heartRate" :min="20" :max="250" style="width:130px" />
              </el-form-item>
              <el-form-item label="体重(kg)">
                <el-input-number v-model="signForm.weight" :min="10" :max="300" :precision="1" style="width:130px" />
              </el-form-item>
              <el-form-item label="测量时间">
                <el-date-picker v-model="signForm.measureTime" type="datetime" placeholder="选择时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:190px" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="signForm.measureRemark" placeholder="备注" style="width:190px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="addSign" :loading="loading.sign">记录</el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <div class="section-header">
            <span>历史体征记录</span>
          </div>
          <el-table :data="signList" stripe style="width:100%" v-loading="loading.signList">
            <el-table-column prop="measure_time" label="测量时间" width="160" />
            <el-table-column label="血压(mmHg)" width="130">
              <template #default="{ row }">
                {{ row.blood_pressure_high || '-' }}/{{ row.blood_pressure_low || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="blood_sugar" label="血糖" width="80" />
            <el-table-column prop="heart_rate" label="心率" width="80" />
            <el-table-column prop="weight" label="体重(kg)" width="90" />
            <el-table-column prop="measure_remark" label="备注" min-width="140" show-overflow-tooltip />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.is_abnormal" type="danger" size="small">异常</el-tag>
                <el-tag v-else type="success" size="small">正常</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="showSignDialog(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="confirmDelete('sign', row.sign_id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 7. 就诊记录 -->
      <el-tab-pane label="🏥 就诊记录" name="visit">
        <div class="tab-pane">
          <el-card shadow="never" style="margin-bottom:16px">
            <template #header>📝 新增就诊记录</template>
            <el-form :model="visitForm" label-width="100px" size="small">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="医院名称">
                    <el-input v-model="visitForm.hospitalName" placeholder="请输入医院名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="科室">
                    <el-input v-model="visitForm.department" placeholder="如：内科、外科" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="就诊时间">
                    <el-date-picker v-model="visitForm.visitTime" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="诊断结果">
                <el-input v-model="visitForm.diagnosisResult" type="textarea" :rows="2" placeholder="请输入诊断结果" />
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="visitForm.remark" placeholder="备注" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="addVisit" :loading="loading.visit">保存就诊记录</el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <div class="section-header">
            <span>历史就诊记录</span>
          </div>
          <el-table :data="visitList" stripe style="width:100%" v-loading="loading.visitList">
            <el-table-column prop="hospital_name" label="医院" min-width="160" />
            <el-table-column prop="department" label="科室" width="100" />
            <el-table-column prop="diagnosis_result" label="诊断结果" min-width="200" show-overflow-tooltip />
            <el-table-column prop="visit_time" label="就诊日期" width="110" />
            <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="showVisitDialog(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="confirmDelete('visit', row.visit_id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 体征编辑 Dialog -->
    <el-dialog v-model="signDialog.visible" :title="signDialog.isEdit ? '编辑体征数据' : '新增体征数据'" width="600px">
      <el-form :model="signDialog.form" label-width="100px" size="small">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收缩压(mmHg)">
              <el-input-number v-model="signDialog.form.bloodPressureHigh" :min="60" :max="260" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="舒张压(mmHg)">
              <el-input-number v-model="signDialog.form.bloodPressureLow" :min="30" :max="160" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="血糖(mmol/L)">
              <el-input-number v-model="signDialog.form.bloodSugar" :min="1" :max="30" :precision="1" :step="0.1" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="心率(次/分)">
              <el-input-number v-model="signDialog.form.heartRate" :min="20" :max="250" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="体重(kg)">
              <el-input-number v-model="signDialog.form.weight" :min="10" :max="300" :precision="1" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="测量时间" required>
              <el-date-picker v-model="signDialog.form.measureTime" type="datetime" placeholder="选择时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="signDialog.form.measureRemark" placeholder="备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="signDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveSign" :loading="loading.signSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 就诊编辑 Dialog -->
    <el-dialog v-model="visitDialog.visible" :title="visitDialog.isEdit ? '编辑就诊记录' : '新增就诊记录'" width="600px">
      <el-form :model="visitDialog.form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="医院名称" required>
              <el-input v-model="visitDialog.form.hospitalName" placeholder="请输入医院名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="科室" required>
              <el-input v-model="visitDialog.form.department" placeholder="如：内科、外科" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="就诊时间" required>
          <el-date-picker v-model="visitDialog.form.visitTime" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="诊断结果" required>
          <el-input v-model="visitDialog.form.diagnosisResult" type="textarea" :rows="2" placeholder="请输入诊断结果" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="visitDialog.form.remark" placeholder="备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visitDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveVisit" :loading="loading.visitSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 手术史 Dialog -->
    <el-dialog v-model="surgeryDialog.visible" :title="surgeryDialog.isEdit ? '编辑手术记录' : '新增手术记录'" width="500px">
      <el-form :model="surgeryDialog.form" label-width="100px">
        <el-form-item label="手术名称" required>
          <el-input v-model="surgeryDialog.form.surgeryName" placeholder="请输入手术名称" />
        </el-form-item>
        <el-form-item label="手术日期" required>
          <el-date-picker v-model="surgeryDialog.form.surgeryTime" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="医院">
          <el-input v-model="surgeryDialog.form.hospital" placeholder="医院名称" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="surgeryDialog.form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="surgeryDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveSurgery" :loading="loading.surgerySave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 疾病史 Dialog -->
    <el-dialog v-model="diseaseDialog.visible" :title="diseaseDialog.isEdit ? '编辑疾病记录' : '新增疾病记录'" width="500px">
      <el-form :model="diseaseDialog.form" label-width="100px">
        <el-form-item label="疾病名称" required>
          <el-input v-model="diseaseDialog.form.diseaseName" placeholder="请输入疾病名称" />
        </el-form-item>
        <el-form-item label="确诊日期" required>
          <el-date-picker v-model="diseaseDialog.form.diagnosisTime" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="就诊医院">
          <el-input v-model="diseaseDialog.form.hospital" placeholder="医院名称" />
        </el-form-item>
        <el-form-item label="是否治愈">
          <el-switch v-model="diseaseDialog.form.isCured" active-text="已治愈" inactive-text="未治愈" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="diseaseDialog.form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="diseaseDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveDisease" :loading="loading.diseaseSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 过敏史 Dialog -->
    <el-dialog v-model="allergyDialog.visible" :title="allergyDialog.isEdit ? '编辑过敏记录' : '新增过敏记录'" width="500px">
      <el-form :model="allergyDialog.form" label-width="100px">
        <el-form-item label="过敏原" required>
          <el-input v-model="allergyDialog.form.allergen" placeholder="如：青霉素、花粉" />
        </el-form-item>
        <el-form-item label="反应">
          <el-input v-model="allergyDialog.form.reaction" placeholder="如：皮疹、呼吸困难" />
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select v-model="allergyDialog.form.severity" style="width:100%">
            <el-option label="轻" value="轻" />
            <el-option label="中" value="中" />
            <el-option label="重" value="重" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="allergyDialog.form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="allergyDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveAllergy" :loading="loading.allergySave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 用药史 Dialog -->
    <el-dialog v-model="medicationDialog.visible" :title="medicationDialog.isEdit ? '编辑用药记录' : '新增用药记录'" width="500px">
      <el-form :model="medicationDialog.form" label-width="100px">
        <el-form-item label="药物名称" required>
          <el-input v-model="medicationDialog.form.medicineName" placeholder="请输入药物名称" />
        </el-form-item>
        <el-form-item label="剂量">
          <el-input v-model="medicationDialog.form.dosage" placeholder="如：25mg" />
        </el-form-item>
        <el-form-item label="频次">
          <el-input v-model="medicationDialog.form.frequency" placeholder="如：每日一次" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="medicationDialog.form.startTime" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="medicationDialog.form.endTime" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="持续用药">
          <el-switch v-model="medicationDialog.form.isOngoing" active-text="是" inactive-text="否" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="medicationDialog.form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="medicationDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveMedication" :loading="loading.medicationSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getBasicProfileAPI, saveBasicInfoAPI,
  getSurgeriesAPI, addSurgeryAPI, updateSurgeryAPI, deleteSurgeryAPI,
  getDiseasesAPI, addDiseaseAPI, updateDiseaseAPI, deleteDiseaseAPI,
  getAllergiesAPI, addAllergyAPI, updateAllergyAPI, deleteAllergyAPI,
  getMedicationsAPI, addMedicationAPI, updateMedicationAPI, deleteMedicationAPI,
  addSignAPI, getSignListAPI, updateSignAPI, deleteSignAPI,
  addVisitAPI, getVisitListAPI, updateVisitAPI, deleteVisitAPI
} from '@/api/health'

const activeTab = ref('basic')

// 加载状态
const loading = reactive({
  surgery: false, surgerySave: false,
  disease: false, diseaseSave: false,
  allergy: false, allergySave: false,
  medication: false, medicationSave: false,
  sign: false, signList: false, signSave: false,
  visit: false, visitList: false, visitSave: false
})

const saving = ref(false)

// ==================== 基础信息 ====================
const basicForm = reactive({
  birthDate: '',
  gender: '',
  bloodType: '',
  height: null,
  weight: null,
  waistCircumference: null,
  familyIllness: ''
})

async function loadBasicProfile() {
  try {
    const data = await getBasicProfileAPI()
    if (data) {
      basicForm.birthDate = data.birth_date || ''
      basicForm.gender = data.gender || ''
      basicForm.bloodType = data.blood_type || ''
      basicForm.height = data.height != null ? Number(data.height) : null
      basicForm.weight = data.weight != null ? Number(data.weight) : null
      basicForm.waistCircumference = data.waist_circumference != null ? Number(data.waist_circumference) : null
      basicForm.familyIllness = data.family_illness || ''
    }
  } catch { /* ignore */ }
}

async function saveBasicInfo() {
  saving.value = true
  try {
    await saveBasicInfoAPI({ ...basicForm })
    ElMessage.success('基础信息保存成功')
  } catch { /* ignore */ }
  finally { saving.value = false }
}

// ==================== 手术史 ====================
const surgeries = ref([])
const surgeryDialog = reactive({
  visible: false, isEdit: false, editId: null,
  form: { surgeryName: '', surgeryTime: '', hospital: '', remark: '' }
})

async function loadSurgeries() {
  loading.surgery = true
  try {
    const data = await getSurgeriesAPI()
    surgeries.value = data.list || []
  } catch { /* ignore */ }
  finally { loading.surgery = false }
}

function showSurgeryDialog(row) {
  if (row) {
    surgeryDialog.isEdit = true
    surgeryDialog.editId = row.surgery_id
    surgeryDialog.form = {
      surgeryName: row.surgery_name,
      surgeryTime: row.surgery_time,
      hospital: row.hospital || '',
      remark: row.remark || ''
    }
  } else {
    surgeryDialog.isEdit = false
    surgeryDialog.editId = null
    surgeryDialog.form = { surgeryName: '', surgeryTime: '', hospital: '', remark: '' }
  }
  surgeryDialog.visible = true
}

async function saveSurgery() {
  const f = surgeryDialog.form
  if (!f.surgeryName || !f.surgeryTime) {
    ElMessage.warning('请填写手术名称和手术日期')
    return
  }
  loading.surgerySave = true
  try {
    if (surgeryDialog.isEdit) {
      await updateSurgeryAPI(surgeryDialog.editId, f)
    } else {
      await addSurgeryAPI(f)
    }
    ElMessage.success(surgeryDialog.isEdit ? '修改成功' : '添加成功')
    surgeryDialog.visible = false
    await loadSurgeries()
  } catch { /* ignore */ }
  finally { loading.surgerySave = false }
}

// ==================== 疾病史 ====================
const diseases = ref([])
const diseaseDialog = reactive({
  visible: false, isEdit: false, editId: null,
  form: { diseaseName: '', diagnosisTime: '', hospital: '', isCured: false, remark: '' }
})

async function loadDiseases() {
  loading.disease = true
  try {
    const data = await getDiseasesAPI()
    diseases.value = data.list || []
  } catch { /* ignore */ }
  finally { loading.disease = false }
}

function showDiseaseDialog(row) {
  if (row) {
    diseaseDialog.isEdit = true
    diseaseDialog.editId = row.disease_id
    diseaseDialog.form = {
      diseaseName: row.disease_name,
      diagnosisTime: row.diagnosis_time,
      hospital: row.hospital || '',
      isCured: !!row.is_cured,
      remark: row.remark || ''
    }
  } else {
    diseaseDialog.isEdit = false
    diseaseDialog.editId = null
    diseaseDialog.form = { diseaseName: '', diagnosisTime: '', hospital: '', isCured: false, remark: '' }
  }
  diseaseDialog.visible = true
}

async function saveDisease() {
  const f = diseaseDialog.form
  if (!f.diseaseName || !f.diagnosisTime) {
    ElMessage.warning('请填写疾病名称和确诊日期')
    return
  }
  loading.diseaseSave = true
  try {
    if (diseaseDialog.isEdit) {
      await updateDiseaseAPI(diseaseDialog.editId, f)
    } else {
      await addDiseaseAPI(f)
    }
    ElMessage.success(diseaseDialog.isEdit ? '修改成功' : '添加成功')
    diseaseDialog.visible = false
    await loadDiseases()
  } catch { /* ignore */ }
  finally { loading.diseaseSave = false }
}

// ==================== 过敏史 ====================
const allergies = ref([])
const allergyDialog = reactive({
  visible: false, isEdit: false, editId: null,
  form: { allergen: '', reaction: '', severity: '轻', remark: '' }
})

async function loadAllergies() {
  loading.allergy = true
  try {
    const data = await getAllergiesAPI()
    allergies.value = data.list || []
  } catch { /* ignore */ }
  finally { loading.allergy = false }
}

function showAllergyDialog(row) {
  if (row) {
    allergyDialog.isEdit = true
    allergyDialog.editId = row.allergy_id
    allergyDialog.form = {
      allergen: row.allergen,
      reaction: row.reaction || '',
      severity: row.severity || '轻',
      remark: row.remark || ''
    }
  } else {
    allergyDialog.isEdit = false
    allergyDialog.editId = null
    allergyDialog.form = { allergen: '', reaction: '', severity: '轻', remark: '' }
  }
  allergyDialog.visible = true
}

async function saveAllergy() {
  const f = allergyDialog.form
  if (!f.allergen) {
    ElMessage.warning('请填写过敏原')
    return
  }
  loading.allergySave = true
  try {
    if (allergyDialog.isEdit) {
      await updateAllergyAPI(allergyDialog.editId, f)
    } else {
      await addAllergyAPI(f)
    }
    ElMessage.success(allergyDialog.isEdit ? '修改成功' : '添加成功')
    allergyDialog.visible = false
    await loadAllergies()
  } catch { /* ignore */ }
  finally { loading.allergySave = false }
}

// ==================== 用药史 ====================
const medications = ref([])
const medicationDialog = reactive({
  visible: false, isEdit: false, editId: null,
  form: { medicineName: '', dosage: '', frequency: '', startTime: '', endTime: '', isOngoing: false, remark: '' }
})

async function loadMedications() {
  loading.medication = true
  try {
    const data = await getMedicationsAPI()
    medications.value = data.list || []
  } catch { /* ignore */ }
  finally { loading.medication = false }
}

function showMedicationDialog(row) {
  if (row) {
    medicationDialog.isEdit = true
    medicationDialog.editId = row.medication_id
    medicationDialog.form = {
      medicineName: row.medicine_name,
      dosage: row.dosage || '',
      frequency: row.frequency || '',
      startTime: row.start_time || '',
      endTime: row.end_time || '',
      isOngoing: !!row.is_ongoing,
      remark: row.remark || ''
    }
  } else {
    medicationDialog.isEdit = false
    medicationDialog.editId = null
    medicationDialog.form = { medicineName: '', dosage: '', frequency: '', startTime: '', endTime: '', isOngoing: false, remark: '' }
  }
  medicationDialog.visible = true
}

async function saveMedication() {
  const f = medicationDialog.form
  if (!f.medicineName) {
    ElMessage.warning('请填写药物名称')
    return
  }
  loading.medicationSave = true
  try {
    if (medicationDialog.isEdit) {
      await updateMedicationAPI(medicationDialog.editId, f)
    } else {
      await addMedicationAPI(f)
    }
    ElMessage.success(medicationDialog.isEdit ? '修改成功' : '添加成功')
    medicationDialog.visible = false
    await loadMedications()
  } catch { /* ignore */ }
  finally { loading.medicationSave = false }
}

// ==================== 体征数据 ====================
const signForm = reactive({
  bloodPressureHigh: null, bloodPressureLow: null, bloodSugar: null,
  heartRate: null, weight: null, measureTime: '', measureRemark: ''
})
const signList = ref([])

async function addSign() {
  if (!signForm.measureTime) {
    ElMessage.warning('请选择测量时间')
    return
  }
  loading.sign = true
  try {
    await addSignAPI({ ...signForm })
    ElMessage.success('体征数据记录成功')
    signForm.bloodPressureHigh = null
    signForm.bloodPressureLow = null
    signForm.bloodSugar = null
    signForm.heartRate = null
    signForm.weight = null
    signForm.measureTime = ''
    signForm.measureRemark = ''
    await loadSignList()
  } catch { /* ignore */ }
  finally { loading.sign = false }
}

async function loadSignList() {
  loading.signList = true
  try {
    const data = await getSignListAPI({ page: 1, pageSize: 50 })
    signList.value = data.list || []
  } catch { /* ignore */ }
  finally { loading.signList = false }
}

// ==================== 就诊记录 ====================
const visitForm = reactive({
  hospitalName: '', department: '', diagnosisResult: '', visitTime: '', remark: ''
})
const visitList = ref([])

async function addVisit() {
  const f = visitForm
  if (!f.hospitalName || !f.department || !f.diagnosisResult || !f.visitTime) {
    ElMessage.warning('请填写完整就诊信息')
    return
  }
  loading.visit = true
  try {
    await addVisitAPI({ ...f })
    ElMessage.success('就诊记录添加成功')
    visitForm.hospitalName = ''
    visitForm.department = ''
    visitForm.diagnosisResult = ''
    visitForm.visitTime = ''
    visitForm.remark = ''
    await loadVisitList()
  } catch { /* ignore */ }
  finally { loading.visit = false }
}

async function loadVisitList() {
  loading.visitList = true
  try {
    const data = await getVisitListAPI({ page: 1, pageSize: 50 })
    visitList.value = data.list || []
  } catch { /* ignore */ }
  finally { loading.visitList = false }
}

// ==================== 体征编辑 Dialog ====================
const signDialog = reactive({
  visible: false, isEdit: false, editId: null,
  form: { bloodPressureHigh: null, bloodPressureLow: null, bloodSugar: null, heartRate: null, weight: null, measureTime: '', measureRemark: '' }
})

function showSignDialog(row) {
  if (row) {
    signDialog.isEdit = true
    signDialog.editId = row.sign_id
    signDialog.form = {
      bloodPressureHigh: row.blood_pressure_high ?? null,
      bloodPressureLow: row.blood_pressure_low ?? null,
      bloodSugar: row.blood_sugar ?? null,
      heartRate: row.heart_rate ?? null,
      weight: row.weight ?? null,
      measureTime: row.measure_time || '',
      measureRemark: row.measure_remark || ''
    }
  } else {
    signDialog.isEdit = false
    signDialog.editId = null
    signDialog.form = { bloodPressureHigh: null, bloodPressureLow: null, bloodSugar: null, heartRate: null, weight: null, measureTime: '', measureRemark: '' }
  }
  signDialog.visible = true
}

async function saveSign() {
  const f = signDialog.form
  if (!f.measureTime) {
    ElMessage.warning('请选择测量时间')
    return
  }
  loading.signSave = true
  try {
    if (signDialog.isEdit) {
      await updateSignAPI(signDialog.editId, f)
    } else {
      await addSignAPI(f)
    }
    ElMessage.success(signDialog.isEdit ? '修改成功' : '添加成功')
    signDialog.visible = false
    await loadSignList()
  } catch { /* ignore */ }
  finally { loading.signSave = false }
}

// ==================== 就诊编辑 Dialog ====================
const visitDialog = reactive({
  visible: false, isEdit: false, editId: null,
  form: { hospitalName: '', department: '', diagnosisResult: '', visitTime: '', remark: '' }
})

function showVisitDialog(row) {
  if (row) {
    visitDialog.isEdit = true
    visitDialog.editId = row.visit_id
    visitDialog.form = {
      hospitalName: row.hospital_name,
      department: row.department,
      diagnosisResult: row.diagnosis_result,
      visitTime: row.visit_time,
      remark: row.remark || ''
    }
  } else {
    visitDialog.isEdit = false
    visitDialog.editId = null
    visitDialog.form = { hospitalName: '', department: '', diagnosisResult: '', visitTime: '', remark: '' }
  }
  visitDialog.visible = true
}

async function saveVisit() {
  const f = visitDialog.form
  if (!f.hospitalName || !f.department || !f.diagnosisResult || !f.visitTime) {
    ElMessage.warning('请填写完整的就诊信息')
    return
  }
  loading.visitSave = true
  try {
    if (visitDialog.isEdit) {
      await updateVisitAPI(visitDialog.editId, f)
    } else {
      await addVisitAPI(f)
    }
    ElMessage.success(visitDialog.isEdit ? '修改成功' : '添加成功')
    visitDialog.visible = false
    await loadVisitList()
  } catch { /* ignore */ }
  finally { loading.visitSave = false }
}

// ==================== 通用删除 ====================
async function confirmDelete(type, id) {
  const nameMap = { surgery: '手术', disease: '疾病', allergy: '过敏', medication: '用药', sign: '体征', visit: '就诊' }
  try {
    await ElMessageBox.confirm(`确定要删除这条${nameMap[type]}记录吗？`, '确认删除', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
    })
    switch (type) {
      case 'surgery':
        await deleteSurgeryAPI(id)
        await loadSurgeries()
        break
      case 'disease':
        await deleteDiseaseAPI(id)
        await loadDiseases()
        break
      case 'allergy':
        await deleteAllergyAPI(id)
        await loadAllergies()
        break
      case 'medication':
        await deleteMedicationAPI(id)
        await loadMedications()
        break
      case 'sign':
        await deleteSignAPI(id)
        await loadSignList()
        break
      case 'visit':
        await deleteVisitAPI(id)
        await loadVisitList()
        break
    }
    ElMessage.success('删除成功')
  } catch { /* ignore */ }
}

// ==================== 初始化 ====================
onMounted(() => {
  loadBasicProfile()
  loadSurgeries()
  loadDiseases()
  loadAllergies()
  loadMedications()
  loadSignList()
  loadVisitList()
})
</script>

<style scoped>
.health-record {
  min-height: 400px;
}
.tab-pane {
  padding: 16px 0;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #606266;
  font-size: 14px;
}
</style>