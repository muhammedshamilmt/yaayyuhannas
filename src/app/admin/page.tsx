"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, PlusCircle, Calendar } from "lucide-react";

interface Fest {
  _id: string;
  name: string;
  year: number;
  status: string;
  createdAt: string;
}

export default function FestsPage() {
  const [fests, setFests] = useState<Fest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newFestName, setNewFestName] = useState("");
  const [newFestYear, setNewFestYear] = useState(new Date().getFullYear());
  const [sourceFestId, setSourceFestId] = useState("");
  const [copyProgrammes, setCopyProgrammes] = useState(true);
  const [copyTeams, setCopyTeams] = useState(true);
  const [copyCandidates, setCopyCandidates] = useState(false);
  const [copyResults, setCopyResults] = useState(false);
  
  const [editingFest, setEditingFest] = useState<Fest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    fetchFests();
  }, []);

  const fetchFests = async () => {
    try {
      const res = await fetch("/api/fests");
      const data = await res.json();
      setFests(data);
    } catch (error) {
      console.error("Failed to fetch fests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFestName || !newFestYear) return;
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/fests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFestName,
          year: newFestYear,
          status: "active",
          sourceFestId: sourceFestId || undefined,
          copyProgrammes,
          copyTeams,
          copyCandidates,
          copyResults
        })
      });
      
      if (res.ok) {
        setNewFestName("");
        setIsCreating(false);
        fetchFests();
      }
    } catch (error) {
      console.error("Failed to create fest:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFest) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/fests/${editingFest._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingFest.name,
          year: editingFest.year,
          status: editingFest.status
        })
      });
      
      if (res.ok) {
        setEditingFest(null);
        fetchFests();
      }
    } catch (error) {
      console.error("Failed to update fest:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const selectFest = (festId: string) => {
    // For now, redirecting to the old dashboard.
    // In a fully migrated nested routing setup, it would be router.push(`/admin/${festId}/dashboard`);
    // We will set a cookie or just rely on passing it in the URL when the refactor is done.
    
    // To preserve backwards compatibility before the full refactor is done:
    document.cookie = `activeFestId=${festId}; path=/`;
    router.push("/admin/dashboard");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fest Management</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Fest
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Create a New Fest</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Fest Name</label>
                <Input 
                  placeholder="e.g. Wattaqa Arts Fest 2k26"
                  value={newFestName}
                  onChange={(e) => setNewFestName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Year</label>
                <Input 
                  type="number"
                  value={newFestYear}
                  onChange={(e) => setNewFestYear(parseInt(e.target.value))}
                  required
                />
              </div>
              <div className="flex flex-col space-y-2 mt-4">
                <label className="text-sm font-medium text-gray-700">Data to Copy</label>
                
                <div className="mb-2">
                  <select 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={sourceFestId}
                    onChange={(e) => setSourceFestId(e.target.value)}
                  >
                    <option value="">-- Do not copy any data --</option>
                    {fests.map(f => (
                      <option key={f._id} value={f._id}>Copy from: {f.name} ({f.year})</option>
                    ))}
                  </select>
                </div>

                {sourceFestId && (
                  <>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="copyProgrammes"
                        checked={copyProgrammes}
                        onChange={(e) => setCopyProgrammes(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="copyProgrammes" className="text-sm text-gray-600">Copy Programmes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="copyTeams"
                        checked={copyTeams}
                        onChange={(e) => setCopyTeams(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="copyTeams" className="text-sm text-gray-600">Copy Teams</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="copyCandidates"
                        checked={copyCandidates}
                        onChange={(e) => setCopyCandidates(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="copyCandidates" className="text-sm text-gray-600">Copy Candidates</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="copyResults"
                        checked={copyResults}
                        onChange={(e) => setCopyResults(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="copyResults" className="text-sm text-gray-600">Copy Results</label>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editingFest && (
        <Card className="mb-6 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Edit Fest</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Fest Name</label>
                <Input 
                  value={editingFest.name}
                  onChange={(e) => setEditingFest({...editingFest, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Year</label>
                <Input 
                  type="number"
                  value={editingFest.year}
                  onChange={(e) => setEditingFest({...editingFest, year: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={editingFest.status}
                  onChange={(e) => setEditingFest({...editingFest, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingFest(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {fests.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
          <p className="text-gray-500">No fests found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fests.map((fest) => (
            <Card 
              key={fest._id} 
              className="cursor-pointer transition-all hover:shadow-md hover:border-blue-300"
              onClick={() => selectFest(fest._id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{fest.name}</span>
                  <div className="flex items-center space-x-2">
                    {fest.status === "active" ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        Archived
                      </span>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFest(fest);
                        setIsCreating(false);
                      }}
                      className="ml-2 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Edit
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
                  Year {fest.year}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}