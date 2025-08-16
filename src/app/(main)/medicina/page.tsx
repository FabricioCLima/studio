import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MedicinaPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h1 className="text-3xl font-bold tracking-tight">Medicina</h1>
      <Card>
        <CardHeader>
          <CardTitle>Em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Esta página está em construção.</p>
        </CardContent>
      </Card>
    </div>
  );
}
