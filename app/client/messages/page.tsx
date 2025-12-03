"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { AlertTriangle } from "lucide-react"

export default function MessagesPage() {
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const { toast } = useToast()
  const { user, organization } = useAuth()

  const demoConfig = useMemo(() => {
    const meta = (organization?.metadata || {}) as any
    return {
      isDemo: Boolean(meta?.is_demo || meta?.isDemo),
      limits: meta?.demo_limits || meta?.demoLimits || {
        uploadsPerDay: 3,
        messagesPerDay: 10,
        maxSizeMb: 1,
        ttlMinutes: 30,
      },
    }
  }, [organization?.metadata])

  const { data: messagesData, mutate } = useSWR("/api/messages", apiClient.get)
  const messages = useMemo(() => messagesData?.messages || [], [messagesData?.messages])

  const selectedMsg = messages.find((m: any) => m.id === selectedMessage)

  const isToday = (value?: string | null) => {
    if (!value) return false
    const date = new Date(value)
    const now = new Date()
    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    )
  }

  const todayMessages = useMemo(() => {
    if (!demoConfig.isDemo || !user?.id) return 0
    return messages.filter((msg: any) => msg.sender_id === user.id && isToday(msg.created_at || msg.createdAt)).length
  }, [demoConfig.isDemo, messages, user?.id])

  const markAsRead = async (messageId: number) => {
    try {
      await apiClient.patch(`/api/messages/${messageId}`, {})
      mutate()
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const handleReply = async () => {
    if (!reply.trim() || !selectedMsg) return

    if (demoConfig.isDemo) {
      const limit = demoConfig.limits.messagesPerDay ?? 10
      if (todayMessages >= limit) {
        toast({
          title: "Limite diario alcanzado",
          description: `En modo demo puedes enviar hasta ${limit} mensajes por dia.`,
          variant: "destructive",
        })
        return
      }
    }

    const receiverId = selectedMsg.sender_id === user?.id ? selectedMsg.receiver_id : selectedMsg.sender_id

    if (!receiverId) {
      toast({
        title: "Destinatario desconocido",
        description: "No pudimos determinar quien debe recibir esta respuesta.",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      await apiClient.post("/api/messages", {
        case_id: selectedMsg.case_id,
        subject: `Re: ${selectedMsg.subject}`,
        content: reply,
        receiver_id: receiverId,
      })

      toast({
        title: "Mensaje enviado",
        description: "Tu respuesta se envio correctamente",
      })

      setReply("")
      mutate()
    } catch (error) {
      toast({
        title: "Error al enviar",
        description: "No se pudo enviar tu mensaje",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleSelectMessage = (id: number) => {
    setSelectedMessage(id)
    const msg = messages.find((m: any) => m.id === id)
    if (msg && msg.status !== "read") {
      markAsRead(id)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mensajes</h1>
        <p className="mt-2 text-muted-foreground">Comunicate con tu abogado</p>
      </div>

      {demoConfig.isDemo && (
        <Card className="flex flex-col gap-2 border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Modo demo
          </div>
          <p>Limite de mensajes: {todayMessages}/{demoConfig.limits.messagesPerDay} por dia.</p>
          <p>Recuerda: los archivos se eliminan automaticamente despues de {demoConfig.limits.ttlMinutes} minutos.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-1">
          <h3 className="mb-4 font-semibold text-foreground">Bandeja de entrada ({messages.length})</h3>
          <div className="space-y-2">
            {messages.map((msg: any) => {
              const isRead = msg.status === "read"
              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg.id)}
                  className={`cursor-pointer rounded-lg p-3 transition ${
                    selectedMessage === msg.id
                      ? "bg-primary text-primary-foreground"
                      : isRead
                        ? "hover:bg-muted"
                        : "bg-accent/10 hover:bg-accent/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!isRead && <div className="mt-2 h-2 w-2 rounded-full bg-primary" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{msg.sender_id === user?.id ? "Tu" : msg.sender_name || "Tu abogado"}</p>
                      <p className="truncate text-xs opacity-75">{msg.subject}</p>
                      <p className="mt-1 text-xs opacity-60">{new Date(msg.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )
            })}
            {messages.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Aun no hay mensajes</p>
            )}
          </div>
        </Card>

        <div className="lg:col-span-2">
          {selectedMsg ? (
            <Card className="p-6">
              <div className="mb-6 flex items-start justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{selectedMsg.subject}</h2>
                  <div className="mt-2">
                    <p className="font-medium text-foreground">
                      {selectedMsg.sender_id === user?.id ? "Tu" : selectedMsg.sender_name || "Tu abogado"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMsg.sender_id !== user?.id ? "Tu abogado" : "Cliente"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(selectedMsg.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="mb-6 whitespace-pre-wrap text-foreground leading-relaxed">{selectedMsg.content}</div>

              <div className="space-y-3 border-t border-border pt-4">
                <Textarea placeholder="Escribe tu respuesta..." value={reply} onChange={(e) => setReply(e.target.value)} rows={4} />
                <Button className="bg-primary hover:bg-primary/90" onClick={handleReply} disabled={sending || !reply.trim()}>
                  {sending ? "Enviando..." : "Enviar respuesta"}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Selecciona un mensaje para leer</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
