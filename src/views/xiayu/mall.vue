<template>
  <div class="page">
    <el-tabs v-model="tab" @tab-change="loadAll">
      <el-tab-pane label="商品" name="products">
        <div class="toolbar"><el-button type="primary" @click="openCreate">新增商品</el-button></div>
        <el-table :data="products">
          <el-table-column prop="productName" label="商品" min-width="150" />
          <el-table-column prop="categoryName" label="分类" width="120" />
          <el-table-column prop="salePrice" label="售价" width="100" />
          <el-table-column label="会员优惠" width="120"><template #default="scope"><el-tag :type="scope.row.memberDiscountEnabled ? 'success' : 'info'">{{ scope.row.memberDiscountEnabled ? '参与' : '不参与' }}</el-tag></template></el-table-column>
          <el-table-column prop="stock" label="库存" width="90" />
          <el-table-column prop="status" label="状态" width="90" />
          <el-table-column label="操作" width="100"><template #default="scope"><el-button link @click="openEdit(scope.row)">编辑</el-button></template></el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="会员优惠设置" name="discount">
        <div class="discount-card">
          <div><h3>商城会员折扣</h3><p>默认所有上架商品参与；可在商品编辑中单独关闭。</p></div>
          <el-form label-width="130px" class="discount-form">
            <el-form-item label="会员折扣率"><el-input-number v-model="discountSettings.discountRate" :min="0.01" :max="1" :step="0.01" :precision="2" /></el-form-item>
            <el-form-item label="折扣说明"><span>{{ discountLabel }}</span><span class="hint"> 例如 0.95 表示会员 95 折</span></el-form-item>
            <el-form-item><el-button type="primary" @click="saveDiscount">保存会员优惠</el-button></el-form-item>
          </el-form>
          <el-alert title="关闭某个商品的“参与会员优惠”后，该商品仍按正常售价出售。订单会保存折扣金额和折扣率快照。" type="info" :closable="false" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="订单" name="orders">
        <el-table :data="orders">
          <el-table-column prop="orderNo" label="订单号" min-width="190" /><el-table-column prop="nickname" label="会员" min-width="110" />
          <el-table-column prop="totalAmount" label="商品金额" width="110" /><el-table-column prop="discountAmount" label="会员优惠" width="110" /><el-table-column prop="payableAmount" label="应付金额" width="110" />
          <el-table-column prop="deliveryType" label="配送" width="90" /><el-table-column prop="status" label="状态" width="120" />
          <el-table-column label="操作" width="100"><template #default="scope"><el-button v-if="scope.row.status === 'PAID'" type="primary" link @click="ship(scope.row)">发货</el-button></template></el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="售后" name="after">
        <el-table :data="afterSales">
          <el-table-column prop="afterSaleNo" label="售后单" min-width="190" /><el-table-column prop="orderNo" label="订单" min-width="180" /><el-table-column prop="nickname" label="会员" />
          <el-table-column prop="reason" label="原因" min-width="140" /><el-table-column prop="paidAmount" label="退款金额" width="110" /><el-table-column prop="status" label="状态" width="120" />
          <el-table-column label="操作" width="170"><template #default="scope"><template v-if="['PENDING', 'REFUND_FAILED'].includes(scope.row.status)"><el-button type="success" link @click="approve(scope.row)">{{ scope.row.status === 'REFUND_FAILED' ? '重试退款' : '退款' }}</el-button><el-button v-if="scope.row.status === 'PENDING'" type="danger" link @click="reject(scope.row)">拒绝</el-button></template></template></el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="visible" :title="form.productId ? '编辑商品' : '新增商品'" width="560px">
      <el-form label-width="110px">
        <el-form-item label="名称"><el-input v-model="form.productName" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="form.categoryName" /></el-form-item>
        <el-form-item label="售价"><el-input-number v-model="form.salePrice" :min="0.01" :precision="2" /></el-form-item>
        <el-form-item label="库存"><el-input-number v-model="form.stock" :min="0" /></el-form-item>
        <el-form-item label="参与会员优惠"><el-switch v-model="form.memberDiscountEnabled" active-text="参与" inactive-text="不参与" /></el-form-item>
        <el-form-item label="主图"><image-upload v-model="form.coverUrl" :limit="1" /></el-form-item>
        <el-form-item label="详情"><el-input v-model="form.detailText" type="textarea" maxlength="2000" show-word-limit /></el-form-item>
        <el-form-item label="上架"><el-switch v-model="onSale" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="visible = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { approveXyAfterSale, getXyAfterSales, getXyMemberDiscountSettings, getXyOrders, getXyProducts, rejectXyAfterSale, saveXyMemberDiscountSettings, saveXyProduct, shipXyOrder } from '@/api/xy'

const tab = ref('products')
const products = ref([])
const orders = ref([])
const afterSales = ref([])
const discountSettings = ref({ discountRate: 0.95 })
const visible = ref(false)
const onSale = ref(true)
const blank = () => ({ productId: null, productName: '', categoryName: '', salePrice: 0, memberDiscountEnabled: true, stock: 0, coverUrl: '', detailText: '', status: '0', sortOrder: 0 })
const form = ref(blank())
const discountLabel = computed(() => `${(Number(discountSettings.value.discountRate || 1) * 10).toFixed(2).replace(/\.00$/, '')}折`)

async function loadAll() {
  const [productRows, orderRows, afterRows, settings] = await Promise.all([getXyProducts(), getXyOrders(), getXyAfterSales(), getXyMemberDiscountSettings()])
  products.value = productRows.map(row => ({ ...row, memberDiscountEnabled: Number(row.memberDiscountEnabled) === 1 || row.memberDiscountEnabled === true }))
  orders.value = orderRows
  afterSales.value = afterRows
  discountSettings.value = settings
}
function openCreate() { form.value = blank(); onSale.value = true; visible.value = true }
function openEdit(row) { form.value = { ...row }; onSale.value = row.status === '0'; visible.value = true }
async function save() {
  await saveXyProduct({ ...form.value, status: onSale.value ? '0' : '1' })
  visible.value = false
  ElMessage.success('已保存')
  loadAll()
}
async function saveDiscount() {
  await saveXyMemberDiscountSettings({ discountRate: discountSettings.value.discountRate })
  ElMessage.success('会员优惠已更新')
  loadAll()
}
async function ship(row) { await shipXyOrder(row.orderNo); ElMessage.success('已发货'); loadAll() }
async function approve(row) { await ElMessageBox.confirm('确认按订单实付金额原路退款？', '退款确认', { type: 'warning' }); await approveXyAfterSale(row.afterSaleNo); ElMessage.success('退款已提交微信处理'); loadAll() }
async function reject(row) { await rejectXyAfterSale(row.afterSaleNo); ElMessage.success('已拒绝'); loadAll() }
onMounted(loadAll)
</script>

<style scoped>
.page { padding: 20px; background: #fff; border-radius: 16px; }
.toolbar { margin-bottom: 16px; }
.discount-card { max-width: 680px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fbfdfd; }
.discount-card h3 { margin: 0; font-size: 18px; }.discount-card p, .hint { color: #64748b; font-size: 13px; }.discount-form { margin-top: 24px; }
</style>
