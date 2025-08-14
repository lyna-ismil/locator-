"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Zap, Power, Settings, Check, X } from "lucide-react"

export function ConnectorEditor({ connector, stationId, fetchStations }) {
  const [editData, setEditData] = useState({
    type: connector.type,
    chargerLevel: connector.chargerLevel,
    powerKW: connector.powerKW,
    isFast: connector.isFast ?? (connector.chargerLevel?.toLowerCase().includes("fast") || connector.powerKW >= 50),
    currentlyAvailable: connector.status === "Available",
  })
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white via-emerald-50/30 to-white border border-emerald-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="connector-type" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-600" />
                    Connector Type
                  </Label>
                  <Input
                    id="connector-type"
                    className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                    value={editData.type}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                    placeholder="e.g., Type 2, CCS, CHAdeMO"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="charger-level" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-emerald-600" />
                    Charger Level
                  </Label>
                  <Input
                    id="charger-level"
                    className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                    value={editData.chargerLevel}
                    onChange={(e) => setEditData({ ...editData, chargerLevel: e.target.value })}
                    placeholder="e.g., Level 2, DC Fast"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="power-kw" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Power className="h-4 w-4 text-emerald-600" />
                    Power Output
                  </Label>
                  <div className="relative">
                    <Input
                      id="power-kw"
                      className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 pr-12"
                      type="number"
                      value={editData.powerKW}
                      onChange={(e) => setEditData({ ...editData, powerKW: e.target.value })}
                      placeholder="50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                      kW
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <Checkbox
                      id="fast-charger"
                      checked={editData.isFast}
                      onCheckedChange={(checked) => setEditData({ ...editData, isFast: checked })}
                      className="border-emerald-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <Label htmlFor="fast-charger" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Fast Charger (≥50kW)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <Checkbox
                      id="available-status"
                      checked={editData.currentlyAvailable}
                      onCheckedChange={(checked) =>
                        setEditData({ ...editData, currentlyAvailable: checked })
                      }
                      className="border-emerald-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <Label htmlFor="available-status" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Currently Available
                    </Label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <Zap className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{connector.type}</h3>
                    <p className="text-sm text-gray-600 font-medium">
                      {connector.chargerLevel} • {connector.powerKW} kW
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`${
                      editData.isFast
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : "bg-blue-100 text-blue-800 border-blue-200"
                    } font-medium`}
                  >
                    {editData.isFast ? "⚡ Fast Charger" : "🔌 Standard Charger"}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <div className="ml-4">
            <Badge
              className={`${
                editData.currentlyAvailable
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm"
                  : "bg-red-100 text-red-800 border-red-200 shadow-sm"
              } font-semibold px-3 py-1.5 text-xs uppercase tracking-wide`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  editData.currentlyAvailable ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              {editData.currentlyAvailable ? "Available" : "In Use"}
            </Badge>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-emerald-100/50">
          {isEditing ? (
            <>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2"
                onClick={async () => {
                  const payload = {
                    ...editData,
                    status: editData.currentlyAvailable ? "Available" : "In Use",
                  };
                  delete payload.currentlyAvailable; // Remove helper property before sending
                  await fetch(`http://localhost:5000/stations/${stationId}/connectors/${connector._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  setIsEditing(false);
                  fetchStations();
                }}
              >
                <Check className="h-4 w-4" />
                Save Changes
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 flex items-center gap-2 bg-transparent"
                onClick={() => setIsEditing(false)}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 flex items-center gap-2 font-medium bg-transparent"
              onClick={() => setIsEditing(true)}
            >
              <Settings className="h-4 w-4" />
              Edit Connector
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
