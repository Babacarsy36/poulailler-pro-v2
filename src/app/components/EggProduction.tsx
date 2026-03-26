import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface EggRecord {
  id: string;
  date: string;
  quantity: number;
  notes: string;
}

export function EggProduction() {
  const [records, setRecords] = useState<EggRecord[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    quantity: "",
    notes: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("eggs");
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, []);

  const saveRecords = (newRecords: EggRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem("eggs", JSON.stringify(newRecords));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: EggRecord = {
      id: Date.now().toString(),
      date: formData.date,
      quantity: Number(formData.quantity),
      notes: formData.notes,
    };
    saveRecords([newRecord, ...records]);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      quantity: "",
      notes: "",
    });
    setIsAddOpen(false);
  };

  const handleDelete = (id: string) => {
    saveRecords(records.filter((r) => r.id !== id));
  };

  const totalEggs = records.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl text-orange-700">Production d'œufs</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une récolte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une récolte d'œufs</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantity">Nombre d'œufs</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Ajouter
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-700">Total d'œufs collectés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl text-yellow-700">{totalEggs} œufs</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-orange-700">Historique des récoltes</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.date).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{record.quantity} œufs</TableCell>
                    <TableCell>{record.notes || "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Aucune récolte enregistrée. Cliquez sur "Ajouter une récolte" pour
              commencer.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
