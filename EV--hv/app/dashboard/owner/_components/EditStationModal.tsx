"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Station } from "../types"

interface EditStationModalProps {
  station: Station
  onClose: () => void
  onStationUpdated: () => void
}

export function EditStationModal({ station, onClose, onStationUpdated }: EditStationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: station.name,
    networkName: station.networkName,
    address: {
      street: station.address?.street || "",
      city: station.address?.city || "",
      state: station.address?.state || "",
      zipCode: station.address?.zipCode || "",
    },
    coordinates: { ...station.coordinates },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Prepare payload to match backend schema
      const payload = {
        stationName: formData.name,
        network: formData.networkName,
        address: {
          street: formData.address.street,
          city: formData.address.city,
          state: formData.address.state,
          zipCode: formData.address.zipCode,
        },
        // Add other fields as needed (e.g., location, connectors, etc.)
      }

      // Send PUT or PATCH request to backend
      const response = await fetch(`http://localhost:5000/stations/${station._id}`, {
        method: "PUT", // or "PATCH" if your backend supports partial updates
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to update station.")
      }

      onStationUpdated()
    } catch (error) {
      console.error("Failed to update station:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Station: {station.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Station Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="network">Network Name</Label>
              <Input
                id="network"
                value={formData.networkName}
                onChange={(e) => setFormData((prev) => ({ ...prev, networkName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={formData.address.street}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  address: { ...prev.address, street: e.target.value },
                }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value },
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State/Region</Label>
              <Input
                id="state"
                value={formData.address.state}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value },
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="zip">Zip Code</Label>
              <Input
                id="zip"
                value={formData.address.zipCode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: { ...prev.address, zipCode: e.target.value },
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Station"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
