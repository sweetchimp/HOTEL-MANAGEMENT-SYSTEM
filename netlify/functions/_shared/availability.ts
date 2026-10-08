// ============================================================
// Availability Engine — shared by public availability + booking
// Half-open date overlap: [in, out) allows same-day turnover.
// Blocks: ACTIVE bookings on CONFIRMED/CHECKED_IN reservations,
// plus holds from non-rejected booking requests of the same type.
// ============================================================

import type { DBConnection } from './db'
import type { DbRoom, DbRoomType, DbBooking, DbReservation, DbBookingRequest, AvailableRoom } from './types'
import { mapRows } from './row-mapper'

export function isoDate(v: unknown): string {
  if (v instanceof Date) {
    const y = v.getFullYear()
    const m = String(v.getMonth() + 1).padStart(2, '0')
    const d = String(v.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return String(v ?? '').slice(0, 10)
}

function overlaps(aIn: string, aOut: string, bIn: string, bOut: string): boolean {
  return aIn < bOut && aOut > bIn
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000)
}

export async function computeAvailableRooms(
  conn: DBConnection,
  checkIn: string,
  checkOut: string,
  typeId?: number
): Promise<AvailableRoom[]> {
  let roomSql = 'SELECT * FROM ROOMS WHERE STATUS = :status'
  const roomBinds: Record<string, unknown> = { status: 'AVAILABLE' }
  if (typeId) {
    roomSql += ' AND TYPE_ID = :type_id'
    roomBinds.type_id = typeId
  }
  const roomsRes = await conn.execute(roomSql, roomBinds)
  const typesRes = await conn.execute('SELECT * FROM ROOM_TYPES')
  const bookingsRes = await conn.execute('SELECT * FROM BOOKINGS')
  const reservationsRes = await conn.execute('SELECT * FROM RESERVATIONS')
  const requestsRes = await conn.execute('SELECT * FROM BOOKING_REQUESTS')

  const rooms = mapRows<DbRoom>(roomsRes.rows, 'ROOMS')
  const types = mapRows<DbRoomType>(typesRes.rows, 'ROOM_TYPES')
  const bookings = mapRows<DbBooking>(bookingsRes.rows, 'BOOKINGS')
  const reservations = mapRows<DbReservation>(reservationsRes.rows, 'RESERVATIONS')
  const requests = mapRows<DbBookingRequest>(requestsRes.rows, 'BOOKING_REQUESTS')

  const typeById = new Map(types.map(t => [t.TYPE_ID, t]))
  const resById = new Map(reservations.map(r => [r.RESERVATION_ID, r]))

  const blockedRoomIds = new Set<number>()
  for (const b of bookings) {
    if (b.STATUS !== 'ACTIVE') continue
    const res = resById.get(b.RESERVATION_ID)
    if (!res || (res.STATUS !== 'CONFIRMED' && res.STATUS !== 'CHECKED_IN')) continue
    if (overlaps(isoDate(b.CHECK_IN_DATE), isoDate(b.CHECK_OUT_DATE), checkIn, checkOut)) {
      blockedRoomIds.add(b.ROOM_ID)
    }
  }

  const holdsByType = new Map<number, number>()
  for (const r of requests) {
    if (r.STATUS === 'rejected') continue
    if (overlaps(isoDate(r.CHECK_IN_DATE), isoDate(r.CHECK_OUT_DATE), checkIn, checkOut)) {
      holdsByType.set(r.ROOM_TYPE_ID, (holdsByType.get(r.ROOM_TYPE_ID) || 0) + 1)
    }
  }

  const nights = nightsBetween(checkIn, checkOut)
  const candidates = rooms.filter(r => !blockedRoomIds.has(r.ROOM_ID))

  const byType = new Map<number, DbRoom[]>()
  for (const room of candidates) {
    const list = byType.get(room.TYPE_ID) || []
    list.push(room)
    byType.set(room.TYPE_ID, list)
  }

  const result: AvailableRoom[] = []
  for (const [typeIdKey, group] of byType) {
    const type = typeById.get(typeIdKey)
    if (!type) continue
    const held = holdsByType.get(typeIdKey) || 0
    const offered = group.slice(0, Math.max(0, group.length - held))
    for (const room of offered) {
      result.push({
        room_id: room.ROOM_ID,
        room_number: room.ROOM_NUMBER,
        type_id: typeIdKey,
        type_name: type.TYPE_NAME,
        base_price: type.BASE_PRICE,
        max_occupancy: type.MAX_OCCUPANCY,
        nights,
        total: nights * type.BASE_PRICE,
      })
    }
  }

  result.sort((a, b) => a.type_id - b.type_id || a.room_number.localeCompare(b.room_number))
  return result
}
