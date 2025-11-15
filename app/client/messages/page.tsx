"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export default function MessagesPage() {
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const { data: messagesData, mutate } = useSWR("/api/messages", apiClient.get)
  const messages = messagesData?.messages || []

  const selectedMsg = messages.find((m: any) => m.id === selectedMessage)

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

    const receiverId = selectedMsg.sender_id === user?.id ? selectedMsg.receiver_id : selectedMsg.sender_id

    if (!receiverId) {
      toast({
        title: "Destinatario desconocido",
        description: "No pudimos determinar quién debe recibir esta respuesta.",
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
        description: "Tu respuesta se envió correctamente",
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
        <p className="text-muted-foreground mt-2">Comunícate con tu abogado</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <Card className="lg:col-span-1 p-4">
          <h3 className="font-semibold text-foreground mb-4">Bandeja de entrada ({messages.length})</h3>
          <div className="space-y-2">
            {messages.map((msg: any) => {
              const isRead = msg.status === "read"
              return (
              <div
                key={msg.id}
                onClick={() => handleSelectMessage(msg.id)}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  selectedMessage === msg.id
                    ? "bg-primary text-primary-foreground"
                    : isRead
                      ? "hover:bg-muted"
                      : "bg-accent/10 hover:bg-accent/20"
                }`}
              >
                <div className="flex gap-2 items-start">
                  {!isRead && <div className="w-2 h-2 rounded-full bg-primary mt-2" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {msg.sender_id === user?.id ? "Tú" : msg.sender_name || "Tu abogado"}
                    </p>
                    <p className="text-xs truncate opacity-75">{msg.subject}</p>
                    <p className="text-xs opacity-60 mt-1">{new Date(msg.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              )
            })}
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aún no hay mensajes</p>
            )}
          </div>
        </Card>

        {/* Message Content */}
        <div className="lg:col-span-2">
          {selectedMsg ? (
            <Card className="p-6">
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-border">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{selectedMsg.subject}</h2>
                  <div className="mt-2">
                    <p className="font-medium text-foreground">
                      {selectedMsg.sender_id === user?.id ? "Tú" : selectedMsg.sender_name || "Tu abogado"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMsg.sender_id !== user?.id ? "Tu abogado" : "Cliente"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(selectedMsg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mb-6 text-foreground leading-relaxed whitespace-pre-wrap">{selectedMsg.content}</div>

              {/* Reply Section */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Textarea
                  placeholder="Escribe tu respuesta..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                />
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleReply}
                  disabled={sending || !reply.trim()}
                >
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
