"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-2">Administra tu cuenta y tus preferencias</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Configuración de la cuenta</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nombre completo</label>
            <Input type="text" placeholder="Tu nombre" defaultValue="Sarah Johnson" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Correo electrónico</label>
            <Input type="email" placeholder="tu@email.com" defaultValue="sarah@lexiscase.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Número de licencia profesional</label>
            <Input type="text" placeholder="Número de licencia" defaultValue="CA123456" />
          </div>
          <Button className="bg-primary hover:bg-primary/90 mt-4">Guardar cambios</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Preferencias</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Notificaciones por correo</label>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Recordatorios de casos</label>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Alertas de documentos</label>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
        </div>
      </Card>
    </div>
  )
}
