import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Home,
  Mail,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import { api } from '../services/api'
import { formatCurrency } from '../utils/currency'
import Stepper from '../components/booking/Stepper'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AvailabilityResult, PublicBookingPayload } from '../types'

const STEPS = ['Dates', 'Room Type', 'Room', 'Guest Details', 'Review']

const ID_TYPES = [
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'DRIVERS_LICENSE', label: "Driver's License" },
  { value: 'OTHER', label: 'Other' },
]

const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Card' },
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
]

const initialForm = {
  check_in_date: '',
  check_out_date: '',
  num_guests: 2,
  room_type_id: 0,
  room_id: null as number | null,
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  id_type: 'PASSPORT',
  id_number: '',
  special_requests: '',
  payment_method: '',
  promo: '',
}

export default function PublicBookingPage() {
  const [searchParams] = useSearchParams()
  const today = new Date().toISOString().slice(0, 10)

  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [bookingId, setBookingId] = useState<number | null>(null)
  const [avail, setAvail] = useState<AvailabilityResult | null>(null)
  const [loadingAvail, setLoadingAvail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    setForm(f => ({
      ...f,
      check_in_date: searchParams.get('check_in') || f.check_in_date,
      check_out_date: searchParams.get('check_out') || f.check_out_date,
      num_guests: Number(searchParams.get('guests')) || f.num_guests,
      promo: searchParams.get('promo') || f.promo,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
    if (key === 'check_in_date' || key === 'check_out_date') {
      setAvail(null)
      setForm(f => ({ ...f, [key]: value, room_type_id: 0, room_id: null }))
    }
  }

  async function handleFindRooms() {
    if (!form.check_in_date || !form.check_out_date) {
      toast.error('Select check-in and check-out dates')
      return
    }
    if (form.check_out_date <= form.check_in_date) {
      toast.error('Check-out must be after check-in')
      return
    }
    if (form.check_in_date < today) {
      toast.error('Check-in cannot be in the past')
      return
    }
    if (form.num_guests < 1) {
      toast.error('At least one guest is required')
      return
    }

    setLoadingAvail(true)
    const res = await api.get<AvailabilityResult>(
      `/public/availability?check_in=${form.check_in_date}&check_out=${form.check_out_date}`,
    )
    setLoadingAvail(false)
    if (res.success && res.data) {
      if (res.data.available === 0) {
        toast.error('No rooms available', { description: 'Try different dates.' })
        return
      }
      setAvail(res.data)
      setForm(f => ({ ...f, room_type_id: 0, room_id: null }))
      setStep(1)
    } else {
      toast.error('Availability check failed', { description: res.error })
    }
  }

  function handlePickType(typeId: number) {
    setForm(f => ({ ...f, room_type_id: typeId, room_id: null }))
    setStep(2)
  }

  function validateGuestDetails(): boolean {
    if (form.guest_name.trim().length < 3) {
      toast.error('Enter your full name')
      return false
    }
    if (!/^\S+@\S+\.\S+$/.test(form.guest_email.trim())) {
      toast.error('Enter a valid email address')
      return false
    }
    if (form.guest_phone.replace(/\D/g, '').length < 7) {
      toast.error('Enter a valid phone number')
      return false
    }
    if (form.id_number.trim().length < 4) {
      toast.error('Enter your ID document number')
      return false
    }
    return true
  }

  async function handleSubmit() {
    if (!avail || form.room_type_id === 0 || form.room_id === null) return
    const payload: PublicBookingPayload = {
      guest_name: form.guest_name.trim(),
      guest_email: form.guest_email.trim(),
      guest_phone: form.guest_phone.trim(),
      id_type: form.id_type,
      id_number: form.id_number.trim(),
      room_type_id: form.room_type_id,
      room_id: form.room_id === 0 ? null : form.room_id,
      check_in_date: form.check_in_date,
      check_out_date: form.check_out_date,
      num_guests: form.num_guests,
      ...(form.special_requests.trim() && { special_requests: form.special_requests.trim() }),
      ...(form.payment_method && { payment_method: form.payment_method }),
      ...(form.promo.trim() && { promo: form.promo.trim() }),
    }

    setSubmitting(true)
    const res = await api.post<{ booking_id: number }>('/public/bookings', payload)
    setSubmitting(false)
    if (res.success && res.data) {
      setBookingId(res.data.booking_id)
      setDone(true)
      toast.success('Booking request submitted')
    } else {
      toast.error('Submission failed', { description: res.error })
    }
  }

  function handleReset() {
    setDone(false)
    setBookingId(null)
    setAvail(null)
    setStep(0)
    setForm({ ...initialForm, promo: form.promo })
  }

  const selectedRoom = avail?.rooms.find(r => r.room_id === form.room_id)
  const selectedType = avail?.room_types.find(t => t.type_id === form.room_type_id)
  const roomsForType = avail?.rooms.filter(r => r.type_id === form.room_type_id) ?? []
  const countForType = (typeId: number) => avail?.rooms.filter(r => r.type_id === typeId).length ?? 0

  return (
    <div className="min-h-screen bg-dust-50">
      <div className="h-1.5 bg-accent-500" />

      {/* Public header */}
      <header className="bg-primary-500 shadow-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/AH_Logo.png"
              alt="ALTONS Hotel logo"
              className="h-10 w-10 rounded-xl bg-white/95 object-contain p-1"
            />
            <span className="font-display text-lg font-bold text-white">
              ALTONS<span className="text-accent-400">HOTEL</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link to="/" className="flex items-center gap-1.5 text-primary-200 transition-colors hover:text-white">
              <Home className="h-4 w-4" /> Home
            </Link>
            <Link to="/login" className="text-primary-200 transition-colors hover:text-white">
              Staff sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {done ? (
          <Card className="animate-scale-in">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="mt-5 font-display text-2xl font-semibold text-[#1a1a1a]">
                Booking request received!
              </h1>
              <p className="mt-2 max-w-md text-sm text-steel-600">
                Your reference number is{' '}
                <span className="font-bold text-primary-700">#{bookingId}</span>. Our team will review
                your request and confirm it shortly.
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-steel-500">
                <Mail className="h-4 w-4" /> A confirmation email has been sent to{' '}
                <span className="font-medium text-steel-700">{form.guest_email}</span>
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button variant="accent" onClick={handleReset}>
                  Book another stay
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/">Back to home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="animate-slide-up">
              <h1 className="font-display text-2xl font-semibold text-[#1a1a1a]">Request a Booking</h1>
              <p className="mt-1 text-steel-600">
                Choose your dates and room — we will confirm your stay by email.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-dust-300/60 bg-white px-4 py-5 shadow-card sm:px-6">
              <Stepper steps={STEPS} current={step} />
            </div>

            <Card className="mt-6 animate-fade-in">
              <CardContent className="p-5 sm:p-6">
                {/* Step 1 — Dates */}
                {step === 0 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="check_in" className="flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4 text-primary-500" /> Check-in *
                        </Label>
                        <Input
                          id="check_in"
                          type="date"
                          min={today}
                          value={form.check_in_date}
                          onChange={e => update('check_in_date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="check_out" className="flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4 text-accent-600" /> Check-out *
                        </Label>
                        <Input
                          id="check_out"
                          type="date"
                          min={form.check_in_date || today}
                          value={form.check_out_date}
                          onChange={e => update('check_out_date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="num_guests" className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-primary-500" /> Guests *
                        </Label>
                        <Input
                          id="num_guests"
                          type="number"
                          min={1}
                          max={10}
                          value={form.num_guests}
                          onChange={e => update('num_guests', Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleFindRooms} disabled={loadingAvail}>
                        {loadingAvail ? (
                          'Checking availability…'
                        ) : (
                          <>
                            Find rooms <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2 — Room type */}
                {step === 1 && avail && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-lg font-semibold text-[#1a1a1a]">Choose a room type</h2>
                        <p className="text-sm text-steel-500">
                          {avail.check_in} → {avail.check_out} · {avail.nights}{' '}
                          {avail.nights === 1 ? 'night' : 'nights'} · {form.num_guests}{' '}
                          {form.num_guests === 1 ? 'guest' : 'guests'}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                        <ArrowLeft className="h-4 w-4" /> Dates
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {avail.room_types.map(type => {
                        const count = countForType(type.type_id)
                        const disabled = count === 0
                        const active = form.room_type_id === type.type_id
                        return (
                          <button
                            key={type.type_id}
                            type="button"
                            disabled={disabled}
                            onClick={() => handlePickType(type.type_id)}
                            className={`rounded-xl border-2 p-4 text-left transition-all ${
                              active
                                ? 'border-accent-500 bg-accent-50 shadow-md'
                                : disabled
                                  ? 'cursor-not-allowed border-dust-200 bg-dust-50 opacity-60'
                                  : 'border-dust-300 bg-white hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="flex items-center gap-2 font-display font-bold text-[#1a1a1a]">
                                <BedDouble className="h-4 w-4 text-primary-500" />
                                {type.type_name}
                              </span>
                              <Badge variant={disabled ? 'neutral' : count <= 2 ? 'warning' : 'success'}>
                                {disabled ? 'None left' : `${count} available`}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-steel-500">{type.description}</p>
                            <p className="mt-2 text-sm font-semibold text-primary-700">
                              {formatCurrency(type.base_price)}
                              <span className="font-normal text-steel-500"> / night</span>
                            </p>
                            <p className="text-xs text-steel-500">Sleeps up to {type.max_occupancy}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3 — Room selection */}
                {step === 2 && avail && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-lg font-semibold text-[#1a1a1a]">
                          {selectedType?.type_name} — pick your room
                        </h2>
                        <p className="text-sm text-steel-500">
                          {roomsForType.length} {roomsForType.length === 1 ? 'room' : 'rooms'} left for your
                          dates
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                        <ArrowLeft className="h-4 w-4" /> Room type
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {roomsForType.map(room => (
                        <button
                          key={room.room_id}
                          type="button"
                          onClick={() => update('room_id', room.room_id)}
                          className={`rounded-xl border-2 p-4 text-center transition-all ${
                            form.room_id === room.room_id
                              ? 'border-accent-500 bg-accent-50 shadow-md'
                              : 'border-dust-300 bg-white hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-md'
                          }`}
                        >
                          <p className="font-display text-xl font-bold text-primary-700">{room.room_number}</p>
                          <p className="mt-1 text-xs text-steel-500">{room.type_name}</p>
                          <p className="mt-2 text-sm font-semibold text-[#1a1a1a]">
                            {formatCurrency(room.total)}
                          </p>
                          <p className="text-[11px] text-steel-400">total stay</p>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => update('room_id', 0)}
                        className={`rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                          form.room_id === 0
                            ? 'border-accent-500 bg-accent-50 shadow-md'
                            : 'border-dust-300 bg-white hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-md'
                        }`}
                      >
                        <Sparkles className="mx-auto h-5 w-5 text-accent-600" />
                        <p className="mt-1 text-sm font-semibold text-[#1a1a1a]">No preference</p>
                        <p className="text-[11px] text-steel-400">We'll pick a great room for you</p>
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <Button variant="secondary" onClick={() => setStep(1)}>
                        <ArrowLeft className="h-4 w-4" /> Back
                      </Button>
                      <Button disabled={form.room_id === null} onClick={() => setStep(3)}>
                        Continue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4 — Guest details */}
                {step === 3 && avail && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-lg font-semibold text-[#1a1a1a]">Your details</h2>
                        <p className="text-sm text-steel-500">Who is staying with us?</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                        <ArrowLeft className="h-4 w-4" /> Room
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="guest_name">Full name *</Label>
                        <Input
                          id="guest_name"
                          placeholder="e.g. Jane Doe"
                          value={form.guest_name}
                          onChange={e => update('guest_name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="guest_email">Email *</Label>
                        <Input
                          id="guest_email"
                          type="email"
                          placeholder="you@example.com"
                          value={form.guest_email}
                          onChange={e => update('guest_email', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="guest_phone">Phone *</Label>
                        <Input
                          id="guest_phone"
                          placeholder="+1-555-0100"
                          value={form.guest_phone}
                          onChange={e => update('guest_phone', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="payment_method">Payment preference</Label>
                        <Select
                          value={form.payment_method || 'none'}
                          onValueChange={v => update('payment_method', v === 'none' ? '' : v)}
                        >
                          <SelectTrigger id="payment_method">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pay at the hotel</SelectItem>
                            {PAYMENT_METHODS.map(m => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="id_type">ID type *</Label>
                        <Select value={form.id_type} onValueChange={v => update('id_type', v)}>
                          <SelectTrigger id="id_type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ID_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="id_number">ID number *</Label>
                        <Input
                          id="id_number"
                          placeholder="Document number"
                          value={form.id_number}
                          onChange={e => update('id_number', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="special_requests">Special requests</Label>
                      <Textarea
                        id="special_requests"
                        rows={2}
                        placeholder="Late arrival, extra pillows, dietary needs…"
                        value={form.special_requests}
                        onChange={e => update('special_requests', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="promo">Promo code</Label>
                      <Input
                        id="promo"
                        placeholder="Optional"
                        value={form.promo}
                        onChange={e => update('promo', e.target.value)}
                      />
                      <p className="text-xs text-steel-400">Have a promo code? Enter it here.</p>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="secondary" onClick={() => setStep(2)}>
                        <ArrowLeft className="h-4 w-4" /> Back
                      </Button>
                      <Button
                        onClick={() => {
                          if (validateGuestDetails()) setStep(4)
                        }}
                      >
                        Review <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 5 — Review */}
                {step === 4 && avail && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-lg font-semibold text-[#1a1a1a]">Review your request</h2>
                        <p className="text-sm text-steel-500">Almost done — check everything looks right.</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                        <ArrowLeft className="h-4 w-4" /> Details
                      </Button>
                    </div>

                    <div className="rounded-xl border border-dust-300 bg-dust-50 p-4">
                      <div className="flex items-center gap-2 border-b border-dust-200 pb-3">
                        <ClipboardCheck className="h-5 w-5 text-primary-500" />
                        <span className="font-display font-bold text-[#1a1a1a]">
                          {selectedType?.type_name}
                          {(form.room_id ?? 0) > 0 && selectedRoom ? ` · Room ${selectedRoom.room_number}` : ' · Best available room'}
                        </span>
                      </div>
                      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                        <div className="flex justify-between gap-3">
                          <dt className="text-steel-500">Check-in</dt>
                          <dd className="font-medium text-[#1a1a1a]">{form.check_in_date} · from 14:00</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-steel-500">Check-out</dt>
                          <dd className="font-medium text-[#1a1a1a]">{form.check_out_date} · by 12:00</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-steel-500">Nights</dt>
                          <dd className="font-medium text-[#1a1a1a]">{avail.nights}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-steel-500">Guests</dt>
                          <dd className="font-medium text-[#1a1a1a]">{form.num_guests}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-steel-500">Guest</dt>
                          <dd className="font-medium text-[#1a1a1a]">{form.guest_name}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-steel-500">Contact</dt>
                          <dd className="truncate font-medium text-[#1a1a1a]">{form.guest_email}</dd>
                        </div>
                        {form.payment_method && (
                          <div className="flex justify-between gap-3">
                            <dt className="text-steel-500">Payment</dt>
                            <dd className="font-medium text-[#1a1a1a]">
                              {PAYMENT_METHODS.find(m => m.value === form.payment_method)?.label}
                            </dd>
                          </div>
                        )}
                        {form.promo.trim() && (
                          <div className="flex justify-between gap-3">
                            <dt className="text-steel-500">Promo</dt>
                            <dd className="font-medium text-[#1a1a1a]">{form.promo.trim()}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border-2 border-primary-500 bg-primary-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary-700">
                        <UserRound className="h-4 w-4" /> Estimated total
                      </div>
                      <p className="font-display text-xl font-bold text-primary-700">
                        {formatCurrency(
                          form.room_id === 0 && selectedType
                            ? avail.nights * selectedType.base_price
                            : (selectedRoom?.total ?? 0),
                        )}
                      </p>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="secondary" onClick={() => setStep(3)}>
                        <ArrowLeft className="h-4 w-4" /> Back
                      </Button>
                      <Button variant="accent" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Submitting…' : 'Confirm booking request'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loading state for availability */}
                {loadingAvail && step === 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <footer className="border-t border-dust-300 py-6 text-center text-xs text-steel-500">
        <p>Altons Hotel · 123 Main Street, City · +1-555-0100 · info@altonshotel.com</p>
      </footer>
    </div>
  )
}
