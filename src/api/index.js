import request from './request'

// ================= 认证模块 =================
export function loginApi(student_id, password) {
  return request({
    url: '/auth/login',
    method: 'post',
    data: { student_id, password }
  })
}

export function getProfileApi() {
  return request({
    url: '/auth/me',
    method: 'get'
  })
}

export function registerUserApi(data) {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

export function getAllUsersApi() {
  return request({
    url: '/auth/users',
    method: 'get'
  })
}

export function deleteUserApi(userId) {
  return request({
    url: `/auth/users/${userId}`,
    method: 'delete'
  })
}

// ================= 资产模块 =================
export function getAssetsApi(params) {
  return request({
    url: '/assets',
    method: 'get',
    params
  })
}

export function getAssetByCodeApi(assetCode) {
  return request({
    url: `/assets/by-code/${encodeURIComponent(assetCode)}`,
    method: 'get'
  })
}

export function getAssetDetailApi(assetId) {
  return request({
    url: `/assets/${assetId}`,
    method: 'get'
  })
}

export function createAssetApi(data) {
  return request({
    url: '/assets',
    method: 'post',
    data
  })
}

export function updateAssetApi(assetId, data) {
  return request({
    url: `/assets/${assetId}`,
    method: 'put',
    data
  })
}

export function updateAssetStatusApi(assetId, status, remark) {
  return request({
    url: `/assets/${assetId}/status`,
    method: 'put',
    data: { status, remark }
  })
}

export function deleteAssetApi(assetId) {
  return request({
    url: `/assets/${assetId}`,
    method: 'delete'
  })
}

export function getAssetQrUrl(assetCode) {
  return `/api/assets/by-code/${encodeURIComponent(assetCode)}/qr-image`
}

// ================= 借还模块 =================
export function checkoutAssetApi(asset_code, remark = '', user_id = null) {
  return request({
    url: '/rentals/checkout',
    method: 'post',
    data: { asset_code, remark, user_id }
  })
}

export function checkinAssetApi(asset_code, remark = '') {
  return request({
    url: '/rentals/checkin',
    method: 'post',
    data: { asset_code, remark }
  })
}

export function getMyActiveRentalsApi() {
  return request({
    url: '/rentals/my-active',
    method: 'get'
  })
}

export function getRentalLogsApi(params) {
  return request({
    url: '/rentals/logs',
    method: 'get',
    params
  })
}

// ================= 统计分析与大屏 =================
export function getStatsSummaryApi() {
  return request({
    url: '/stats/summary',
    method: 'get'
  })
}

export function getHotAssetsApi(limit = 6) {
  return request({
    url: '/stats/hot-assets',
    method: 'get',
    params: { limit }
  })
}
