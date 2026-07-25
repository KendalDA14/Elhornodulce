import { Heart, Home, ShieldCheck } from "lucide-react";
import { updateSiteSettingsAction } from "@/actions/admin";
import { ActionStateForm } from "@/components/admin/action-state-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Ajustes de la web</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Elige qué parte quieres editar. Los cambios se reflejan en la página principal y en las políticas públicas.
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b p-4 sm:p-6">
          <CardTitle>Contenido público</CardTitle>
          <p className="text-sm text-muted-foreground">
            Selecciona una sección para ver solamente sus campos.
          </p>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <ActionStateForm action={updateSiteSettingsAction} className="grid gap-6">
            <Tabs defaultValue="inicio" className="gap-6">
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-muted/60 p-1 sm:gap-2 sm:bg-transparent sm:p-0">
                <TabsTrigger
                  value="inicio"
                  className="h-auto min-w-0 flex-col gap-1 border bg-background px-1 py-2 text-xs data-active:border-primary data-active:bg-primary/5 sm:flex-row sm:justify-start sm:px-4 sm:py-3 sm:text-sm"
                >
                  <Home className="h-4 w-4" />
                  Inicio
                </TabsTrigger>
                <TabsTrigger
                  value="historia"
                  className="h-auto min-w-0 flex-col gap-1 border bg-background px-1 py-2 text-xs data-active:border-primary data-active:bg-primary/5 sm:flex-row sm:justify-start sm:px-4 sm:py-3 sm:text-sm"
                >
                  <Heart className="h-4 w-4" />
                  <span className="sm:hidden">Nosotros</span>
                  <span className="hidden sm:inline">Sobre nosotros</span>
                </TabsTrigger>
                <TabsTrigger
                  value="politicas"
                  className="h-auto min-w-0 flex-col gap-1 border bg-background px-1 py-2 text-xs data-active:border-primary data-active:bg-primary/5 sm:flex-row sm:justify-start sm:px-4 sm:py-3 sm:text-sm"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Políticas
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="inicio"
                forceMount
                className="data-[state=inactive]:hidden"
              >
                <div className="mb-5">
                  <h3 className="text-lg font-semibold">Portada del inicio</h3>
                  <p className="text-sm text-muted-foreground">
                    Edita la primera imagen y los textos que recibe el cliente al entrar.
                  </p>
                </div>
                <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="space-y-3">
                    <div className="aspect-video overflow-hidden rounded-lg border bg-muted sm:aspect-[4/3]">
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
                      <Input id="heroImage" name="heroImage" type="file" accept="image/*" className="max-w-full text-xs sm:text-sm" />
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
                      <Label htmlFor="heroNotice">Disponibilidad y entrega</Label>
                      <Textarea id="heroNotice" name="heroNotice" defaultValue={settings.heroNotice} required />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="historia"
                forceMount
                className="data-[state=inactive]:hidden"
              >
                <div className="mb-5">
                  <h3 className="text-lg font-semibold">Sección “Sobre nosotros”</h3>
                  <p className="text-sm text-muted-foreground">
                    Este contenido aparece en el inicio y tiene acceso desde el menú público.
                  </p>
                </div>
                <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="space-y-3">
                    <div className="aspect-video overflow-hidden rounded-lg border bg-muted sm:aspect-[4/3]">
                      {settings.aboutImageUrl || settings.heroImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={settings.aboutImageUrl || settings.heroImageUrl || ""}
                          alt="Imagen de la historia del emprendimiento"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                          Mientras no elijas una imagen, se usará la imagen principal.
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="aboutImage">Cambiar imagen de la sección</Label>
                      <Input id="aboutImage" name="aboutImage" type="file" accept="image/*" className="max-w-full text-xs sm:text-sm" />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="aboutEyebrow">Texto pequeño</Label>
                      <Input id="aboutEyebrow" name="aboutEyebrow" defaultValue={settings.aboutEyebrow} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="aboutTitle">Título</Label>
                      <Input id="aboutTitle" name="aboutTitle" defaultValue={settings.aboutTitle} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="aboutDescription">Historia o descripción</Label>
                      <Textarea
                        id="aboutDescription"
                        name="aboutDescription"
                        defaultValue={settings.aboutDescription}
                        className="min-h-28 sm:min-h-36"
                        required
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="politicas"
                forceMount
                className="data-[state=inactive]:hidden"
              >
                <div className="mb-5">
                  <h3 className="text-lg font-semibold">Políticas de devoluciones</h3>
                  <p className="text-sm text-muted-foreground">
                    Cada texto aparece cuando el cliente abre su opción en la sección de políticas.
                  </p>
                </div>
                <div className="grid gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="refundReviewText">Revisión del pedido</Label>
                    <Textarea
                      id="refundReviewText"
                      name="refundReviewText"
                      defaultValue={settings.refundReviewText}
                      className="min-h-24 sm:min-h-28"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="refundReplacementText">Reposición o descuento</Label>
                    <Textarea
                      id="refundReplacementText"
                      name="refundReplacementText"
                      defaultValue={settings.refundReplacementText}
                      className="min-h-24 sm:min-h-28"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="refundPartialText">Devolución parcial</Label>
                    <Textarea
                      id="refundPartialText"
                      name="refundPartialText"
                      defaultValue={settings.refundPartialText}
                      className="min-h-24 sm:min-h-28"
                      required
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <input type="hidden" name="refundPolicy" value={settings.refundPolicy} />

            <div className="flex justify-end border-t pt-5">
              <Button className="w-full sm:w-auto">Guardar cambios</Button>
            </div>
          </ActionStateForm>
        </CardContent>
      </Card>
    </div>
  );
}
