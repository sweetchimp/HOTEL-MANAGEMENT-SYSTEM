import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ArrowRight, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function BookingWidget() {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)

  function handleBook() {
    const params = new URLSearchParams()
    if (checkIn) params.set('check_in', checkIn)
    if (checkOut) params.set('check_out', checkOut)
    if (guests) params.set('guests', String(guests))
    navigate(`/booking${params.toString() ? `?${params}` : ''}`)
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-5 text-left backdrop-blur-sm sm:p-6">
      <p className="font-display text-lg font-semibold text-white">Book your stay</p>
      <p className="mt-1 text-sm text-primary-200">Check availability and request a reservation online.</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="widget_check_in" className="flex items-center gap-1.5 text-primary-100">
            <CalendarDays className="h-3.5 w-3.5" /> Check-in
          </Label>
          <Input
            id="widget_check_in"
            type="date"
            min={today}
            value={checkIn}
            onChange={e => setCheckIn(e.target.value)}
            className="bg-white text-[#1a1a1a]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="widget_check_out" className="flex items-center gap-1.5 text-primary-100">
            <CalendarDays className="h-3.5 w-3.5" /> Check-out
          </Label>
          <Input
            id="widget_check_out"
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={e => setCheckOut(e.target.value)}
            className="bg-white text-[#1a1a1a]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="widget_guests" className="flex items-center gap-1.5 text-primary-100">
            <UserRound className="h-3.5 w-3.5" /> Guests
          </Label>
          <Input
            id="widget_guests"
            type="number"
            min={1}
            max={4}
            value={guests}
            onChange={e => setGuests(Number(e.target.value))}
            className="bg-white text-[#1a1a1a]"
          />
        </div>
      </div>

      <Button variant="accent" size="lg" className="mt-4 w-full" onClick={handleBook}>
        Check availability <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
