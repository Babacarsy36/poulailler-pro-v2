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
import { Plus, Trash2, Edit } from "lucide-react";
import { Badge } from "./ui/badge";

interface Chicken {
  id: string;
  name: string;
  breed: string;
  age: number;
  color: string;
  status: "active" | "malade" | "retraite";
}

export function ChickenInventory() {
  const [chickens, setChickens] = useState<Chicken[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingChicken, setEditingChicken] = useState<Chicken | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    age: "",
    color: "",
    status: "active" as const,
  });

  useEffect(() => {
    const saved = localStorage.getItem("chickens");
    if (saved) {
      setChickens(JSON.parse(saved));
    }
  }, []);

  const saveChickens = (newChickens: Chicken[]) => {
    setChickens(newChickens);
    localStorage.setItem("chickens", JSON.stringify(newChickens));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingChicken) {
      const updated = chickens.map((c) =>
        c.id === editingChicken.id
          ? { ...c, ...formData, age: Number(formData.age) }
          : c
      );
      saveChickens(updated);
      setEditingChicken(null);
    } else {
      const newChicken: Chicken = {
        id: Date.now().toString(),
        name: formData.name,
        breed: formData.breed,
        age: Number(formData.age),
        color: formData.color,
        status: formData.status,
      };
      saveChickens([...chickens, newChicken]);
    }

    setFormData({ name: "", breed: "", age: "", color: "", status: "active" });
    setIsAddOpen(false);
  };

  const handleDelete = (id: string) => {
    saveChickens(chickens.filter((c) => c.id !== id));
  };

  const handleEdit = (chicken: Chicken) => {
    setEditingChicken(chicken);
    setFormData({
      name: chicken.name,
      breed: chicken.breed,
      age: chicken.age.toString(),
      color: chicken.color,
      status: chicken.status,
    });
    setIsAddOpen(true);
  };

  const statusColors = {
    active: "bg-green-100 text-green-800",
    malade: "bg-red-100 text-red-800",
    retraite: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl text-orange-700">Inventaire des poules</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une poule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingChicken ? "Modifier la poule" : "Ajouter une poule"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="breed">Race</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) =>
                    setFormData({ ...formData, breed: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="age">Âge (mois)</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="color">Couleur</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "active" | "malade" | "retraite",
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="malade">Malade</option>
                  <option value="retraite">Retraite</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingChicken(null);
                    setFormData({
                      name: "",
                      breed: "",
                      age: "",
                      color: "",
                      status: "active",
                    });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  {editingChicken ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chickens.map((chicken) => (
          <Card key={chicken.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-orange-700">{chicken.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{chicken.breed}</p>
                </div>
                <Badge className={statusColors[chicken.status]}>
                  {chicken.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Âge:</span>
                  <span>{chicken.age} mois</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Couleur:</span>
                  <span>{chicken.color}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(chicken)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(chicken.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {chickens.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Aucune poule dans l'inventaire. Cliquez sur "Ajouter une poule" pour
            commencer.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
