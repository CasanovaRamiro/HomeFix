'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { bookings, type Booking } from '@/lib/data/bookings'
import { conversations, type Conversation } from '@/lib/data/conversations'
import { Calendar, MessageSquare, CheckCircle, Clock, Send, ArrowRight, Search } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [message, setMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'bookings' | 'messages'>('bookings')

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    setChatMessages(conv.messages)
    setActiveTab('messages')
  }

  const handleSendMessage = () => {
    if (message.trim() && selectedConversation) {
      const newMessage = {
        id: `m${Date.now()}`,
        sender: 'user',
        text: message,
        timestamp: new Date().toISOString()
      }
      setChatMessages([...chatMessages, newMessage])
      setMessage('')

      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `m${Date.now()}`,
            sender: 'worker',
            text: 'Gracias por tu mensaje. Lo verificare y te respondere pronto.',
            timestamp: new Date().toISOString()
          }
        ])
      }, 800)
    }
  }

  const getStatusStyles = (status: Booking['status']) => {
    const styles: Record<Booking['status'], { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendiente' },
      confirmed: { bg: 'bg-accent/10', text: 'text-accent', label: 'Confirmado' },
      'in-progress': { bg: 'bg-primary/10', text: 'text-primary', label: 'En Progreso' },
      completed: { bg: 'bg-secondary', text: 'text-foreground', label: 'Completado' },
      cancelled: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Cancelado' }
    }
    return styles[status]
  }

  const stats = [
    { label: 'Turnos Activos', value: bookings.filter(b => b.status === 'confirmed').length, icon: Calendar, color: 'text-accent' },
    { label: 'Completados', value: bookings.filter(b => b.status === 'completed').length, icon: CheckCircle, color: 'text-primary' },
    { label: 'Mensajes', value: conversations.length, icon: MessageSquare, color: 'text-accent' },
    { label: 'Sin Leer', value: conversations.reduce((sum, c) => sum + c.unread, 0), icon: Clock, color: 'text-amber-500' }
  ]

  return (
    <main className="min-h-screen bg-secondary/30">
      <Navbar />

      {/* Header */}
      <div className="bg-primary py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Mi Dashboard</h1>
          <p className="text-white/70">Gestiona tus turnos y conversaciones</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="p-5 bg-background border-border shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex lg:hidden border border-border rounded-xl overflow-hidden mb-6 bg-background shadow-sm">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              activeTab === 'bookings' ? 'bg-primary text-white' : 'text-muted-foreground'
            }`}
          >
            Mis Turnos
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative ${
              activeTab === 'messages' ? 'bg-primary text-white' : 'text-muted-foreground'
            }`}
          >
            Mensajes
            {conversations.reduce((s, c) => s + c.unread, 0) > 0 && (
              <span className="absolute top-2 right-4 w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">
                {conversations.reduce((s, c) => s + c.unread, 0)}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bookings Column */}
          <div className={`lg:col-span-2 space-y-4 ${activeTab !== 'bookings' && 'hidden lg:block'}`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-foreground">Mis Turnos</h2>
              <Button variant="outline" size="sm" onClick={() => router.push('/search')} className="hidden sm:flex">
                <Search className="w-4 h-4 mr-2" />
                Buscar profesionales
              </Button>
            </div>

            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const status = getStatusStyles(booking.status)
                  return (
                    <Card key={booking.id} className="p-5 sm:p-6 bg-background border-border hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground truncate">{booking.workerName}</h3>
                          <p className="text-sm text-muted-foreground">{booking.service}</p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-secondary/50 rounded-xl">
                        {[
                          { label: 'Fecha', value: booking.date },
                          { label: 'Hora', value: booking.time },
                          { label: 'Precio', value: `$${booking.price}` },
                        ].map((item, idx) => (
                          <div key={idx}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                            <p className="font-bold text-foreground text-sm">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{booking.notes}</p>

                      <div className="flex gap-3 flex-wrap">
                        <Button variant="outline" size="sm">Reagendar</Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">Cancelar</Button>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 ml-auto"
                          onClick={() => {
                            const conv = conversations.find(c => c.workerId === booking.workerId)
                            if (conv) handleSelectConversation(conv)
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="p-12 text-center bg-background border-border">
                <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-foreground mb-2">No tienes turnos programados</h3>
                <p className="text-muted-foreground mb-6">Busca profesionales verificados para tu proximo trabajo</p>
                <Button className="bg-accent hover:bg-accent/90" onClick={() => router.push('/search')}>
                  Buscar profesionales
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            )}
          </div>

          {/* Messages Column */}
          <div className={`space-y-4 ${activeTab !== 'messages' && 'hidden lg:block'}`}>
            <h2 className="text-xl font-bold text-foreground mb-2 hidden lg:block">Mensajes</h2>

            {/* Conversation List */}
            <div className="space-y-2">
              {conversations.map((conv) => (
                <Card
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 cursor-pointer transition-all border-border ${
                    selectedConversation?.id === conv.id
                      ? 'bg-accent/5 border-accent shadow-sm'
                      : 'bg-background hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{conv.workerName.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate text-sm">{conv.workerName}</h3>
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unread > 0 && (
                      <div className="w-5 h-5 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {conv.unread}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Chat Window */}
            {selectedConversation && (
              <Card className="p-4 bg-background border-border">
                <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{selectedConversation.workerName.charAt(0)}</span>
                    </div>
                    <h3 className="font-bold text-foreground text-sm">{selectedConversation.workerName}</h3>
                  </div>
                  <button
                    className="lg:hidden text-xs text-accent font-medium"
                    onClick={() => setActiveTab('bookings')}
                  >
                    Ver Turnos
                  </button>
                </div>

                <div className="bg-secondary/30 rounded-xl h-64 overflow-y-auto p-4 space-y-3 mb-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-background border border-border text-foreground rounded-bl-md'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-3 border border-input rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                  <Button onClick={handleSendMessage} className="bg-accent hover:bg-accent/90 px-4">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
