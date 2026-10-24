import { withTransaction } from '../db/pool.js'
import * as cooperatives from '../repositories/cooperatives.js'
import * as services from '../repositories/services.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { audit } from '../utils/audit.js'
import { canManage, workingCooperativeId } from '../utils/scope.js'

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data })

// What a customer is allowed to see of a service
const publicService = (s) => ({ id: s.id, name: s.name, category: s.category, description: s.description, areas: s.areas, requires: s.requires })

// GET /services: the catalogue. Only ACTIVE services, for the pilot cooperative.
export const listCatalogue = asyncHandler(async (_req, res) => {
  const coop = await cooperatives.findDefault()
  const list = coop ? await services.list({ cooperativeId: coop.id, activeOnly: true }) : []
  ok(res, { services: list.map(publicService) })
})

// ── Admin ────────────────────────────────────────────────────────
// Loads a service and hides it from admins of other cooperatives (404, not 403)
async function loadManaged(req) {
  const service = await services.findById(req.params.id)
  if (!service || !canManage(req.user, service.cooperativeId)) throw ApiError.notFound('Service not found')
  return service
}

export const listAdmin = asyncHandler(async (req, res) => {
  const cooperativeId = await workingCooperativeId(req.user)
  ok(res, { services: await services.list({ cooperativeId }) })
})

export const getAdmin = asyncHandler(async (req, res) => {
  const service = await loadManaged(req)
  ok(res, { service: { ...service, activity: await services.listActivity(service.id) } })
})

const duplicateName = (err) => {
  if (err.code === '23505') throw ApiError.conflict('A service with this name already exists')
  throw err
}

export const createService = asyncHandler(async (req, res) => {
  const cooperativeId = await workingCooperativeId(req.user)
  const service = await withTransaction(async (client) => {
    const s = await services.create({ ...req.body, cooperativeId, createdBy: req.user.id }, client)
    await services.addActivity(s.id, `Service added as Inactive by ${req.user.name}`, req.user.id, client)
    return s
  }).catch(duplicateName)
  await audit(req, 'SERVICE_CREATED', { targetType: 'Service', targetId: service.id })
  ok(res, { service }, 201)
})

export const updateService = asyncHandler(async (req, res) => {
  const current = await loadManaged(req)
  if (current.active && req.body.areas.length === 0) {
    throw ApiError.badRequest('An active service needs at least one area. Deactivate it first.')
  }
  const service = await withTransaction(async (client) => {
    const s = await services.update(current.id, req.body, client)
    await services.addActivity(s.id, `Details updated by ${req.user.name}`, req.user.id, client)
    return s
  }).catch(duplicateName)
  await audit(req, 'SERVICE_UPDATED', { targetType: 'Service', targetId: service.id })
  ok(res, { service })
})

const setActive = (active) =>
  asyncHandler(async (req, res) => {
    const current = await loadManaged(req)
    if (current.active === active) throw ApiError.conflict(`Service is already ${active ? 'active' : 'inactive'}`)
    if (active && current.areas.length === 0) throw ApiError.badRequest('Choose at least one area and save before activating')
    const service = await withTransaction(async (client) => {
      const s = await services.setActive(current.id, active, client)
      await services.addActivity(s.id, `${active ? 'Activated' : 'Deactivated'} by ${req.user.name}`, req.user.id, client)
      return s
    })
    await audit(req, active ? 'SERVICE_ACTIVATED' : 'SERVICE_DEACTIVATED', { targetType: 'Service', targetId: service.id })
    ok(res, { service })
  })

export const activateService = setActive(true)
export const deactivateService = setActive(false)
