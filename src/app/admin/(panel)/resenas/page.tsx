import { deleteReviewAction, moderateReviewAction } from "@/actions/admin";
import { getPrisma } from "@/lib/prisma";
import { InlineActionForm } from "@/components/admin/inline-action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

async function getReviews() {
  try {
    return await getPrisma().review.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  } catch {
    return [];
  }
}

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reseñas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Calificacion</TableHead>
              <TableHead>Comentario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>{review.isAnonymous ? "Anonimo" : review.customerName || "Anonimo"}</TableCell>
                <TableCell>{review.rating}/5</TableCell>
                <TableCell className="max-w-md">{review.comment}</TableCell>
                <TableCell>
                  <Badge variant={review.status === "APPROVED" ? "default" : review.status === "REJECTED" ? "destructive" : "secondary"}>
                    {review.status}
                  </Badge>
                </TableCell>
                <TableCell className="flex flex-wrap gap-2">
                  <InlineActionForm action={moderateReviewAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <Button size="sm" disabled={review.status === "APPROVED"}>
                      {review.status === "APPROVED" ? "Aprobada" : "Aprobar"}
                    </Button>
                  </InlineActionForm>
                  <InlineActionForm action={moderateReviewAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <Button size="sm" variant="outline" disabled={review.status === "REJECTED"}>
                      {review.status === "REJECTED" ? "Rechazada" : "Rechazar"}
                    </Button>
                  </InlineActionForm>
                  <InlineActionForm action={deleteReviewAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={review.id} />
                    <Button size="sm" variant="destructive">Eliminar</Button>
                  </InlineActionForm>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
