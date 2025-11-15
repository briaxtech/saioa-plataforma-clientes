"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground mt-2">Gestiona tu información personal</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Información personal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nombre</label>
            <Input type="text" defaultValue="John" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Apellido</label>
            <Input type="text" defaultValue="Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Correo electrónico</label>
            <Input type="email" defaultValue="john@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Teléfono</label>
            <Input type="tel" defaultValue="+1 (555) 123-4567" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1.5">Dirección</label>
            <Input type="text" defaultValue="123 Main St, City, State 12345" />
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90">Guardar cambios</Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Seguridad</h2>
        <div className="space-y-4">
          <Button variant="outline" className="w-full bg-transparent">
            Cambiar contraseña
          </Button>
          <Button variant="outline" className="w-full bg-transparent">
            Autenticación en dos pasos
          </Button>
        </div>
      </Card>
    </div>
  )
}
