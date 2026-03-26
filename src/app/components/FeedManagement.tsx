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
import { Plus, Minus, ShoppingCart } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface FeedEntry {
  id: string;
  date: string;
  type: "achat" | "utilisation";
  quantity: number;
  feedType: string;
  notes: string;
}

export function FeedManagement() {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "achat" as "achat" | "utilisation",
    quantity: "",
    feedType: "",
    notes: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("feed");
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  const saveEntries = (newEntries: FeedEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem("feed", JSON.stringify(newEntries));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: FeedEntry = {
      id: Date.now().toString(),
      date: formData.date,
      type: formData.type,
      quantity: Number(formData.quantity),
      feedType: formData.feedType,
      notes: formData.notes,
    };
    saveEntries([newEntry, ...entries]);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      type: "achat",
      quantity: "",
      feedType: "",
      notes: "",
    });
    setIsAddOpen(false);
  };

  const totalFeed = entries.reduce((sum, entry) => {
    return sum + (entry.type === "achat" ? entry.quantity : -entry.quantity);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl text-orange-700">Gestion de l'alimentation</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une entrée
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une entrée</DialogTitle>
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
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "achat" | "utilisation",
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="achat">Achat</option>
                  <option value="utilisation">Utilisation</option>
                </select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantité (kg)</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                  min="0.1"
                />
              </div>
              <div>
                <Label htmlFor="feedType">Type de nourriture</Label>
                <Input
                  id="feedType"
                  value={formData.feedType}
                  onChange={(e) =>
                    setFormData({ ...formData, feedType: e.target.value })
                  }
                  required
                  placeholder="ex: Grains, Maïs, Aliment complet..."
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

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700">Stock actuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl text-green-700">{totalFeed.toFixed(1)} kg</div>
          {totalFeed < 10 && (
            <p className="text-sm text-red-600 mt-2">
              ⚠️ Stock faible ! Pensez à réapprovisionner.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-orange-700">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Type de nourriture</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {new Date(entry.date).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.type === "achat" ? (
                          <>
                            <ShoppingCart className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Achat</span>
                          </>
                        ) : (
                          <>
                            <Minus className="w-4 h-4 text-orange-600" />
                            <span className="text-orange-600">Utilisation</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          entry.type === "achat"
                            ? "text-green-600"
                            : "text-orange-600"
                        }
                      >
                        {entry.type === "achat" ? "+" : "-"}
                        {entry.quantity} kg
                      </span>
                    </TableCell>
                    <TableCell>{entry.feedType}</TableCell>
                    <TableCell>{entry.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Aucune entrée enregistrée. Cliquez sur "Ajouter une entrée" pour
              commencer.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
