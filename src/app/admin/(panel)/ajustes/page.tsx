import { updateSiteSettingsAction } from "@/actions/admin";
import { getSiteSettings } from "@/lib/data";
import { ActionStateForm } from "@/components/admin/action-state-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Ajustes de la web</h2>
        <p className="text-sm text-muted-foreground">
          Cambia el hero principal y la política pública de devoluciones.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contenido principal</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionStateForm action={updateSiteSettingsAction} className="grid gap-5">
            <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <div className="space-y-3">
                <div className="aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                  {settings.heroImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.heroImageUrl} alt="Imagen principal" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Sin imagen personalizada
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="heroImage">Cambiar imagen de fondo</Label>
                  <Input id="heroImage" name="heroImage" type="file" accept="image/*" />
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="heroEyebrow">Texto pequeño</Label>
                  <Input id="heroEyebrow" name="heroEyebrow" defaultValue={settings.heroEyebrow} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="heroTitle">Título principal</Label>
                  <Input id="heroTitle" name="heroTitle" defaultValue={settings.heroTitle} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="heroDescription">Descripción</Label>
                  <Textarea
                    id="heroDescription"
                    name="heroDescription"
                    defaultValue={settings.heroDescription}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="heroNotice">Mensaje de disponibilidad</Label>
                  <Textarea id="heroNotice" name="heroNotice" defaultValue={settings.heroNotice} required />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="refundPolicy">Política de devoluciones</Label>
              <Textarea
                id="refundPolicy"
                name="refundPolicy"
                defaultValue={settings.refundPolicy}
                className="min-h-40"
                required
              />
            </div>

            <div className="flex justify-end">
              <Button>Guardar ajustes</Button>
            </div>
          </ActionStateForm>
        </CardContent>
      </Card>
    </div>
  );
}
