import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAdmin } from '../_shared/middleware'
import type { UpdateSettingRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'PUT') return errorResponse('Method not allowed', 405)

  try {
    const user = requireAdmin(req)
    const body: UpdateSettingRequest = await req.json()

    if (!body.settings || Object.keys(body.settings).length === 0) {
      return errorResponse('No settings provided', 400)
    }

    await withConnection(async (conn) => {
      for (const [key, value] of Object.entries(body.settings)) {
        await conn.execute(
          'UPDATE SYSTEM_SETTINGS SET SETTING_VALUE = :setting_value, UPDATED_AT = CURRENT_TIMESTAMP, UPDATED_BY = :updated_by WHERE SETTING_KEY = :setting_key',
          { setting_key: key, setting_value: value, updated_by: user.user_id }
        )
      }

      await conn.execute(
        `INSERT INTO AUDIT_LOG (ACTION, ENTITY_TYPE, ENTITY_ID, PERFORMED_BY, DETAILS)
         VALUES ('UPDATE', 'SETTINGS', NULL, :performed_by, :details)`,
        { performed_by: user.user_id, details: `Updated ${Object.keys(body.settings).length} setting(s)` }
      )
    })

    return successResponse({ message: 'Settings updated successfully' })
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
