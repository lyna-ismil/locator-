"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Zap, Clock, Navigation, Battery, Filter, Star } from "lucide-react"

export default function DriverDashboard() {
  const [searchLocation, setSearchLocation] = useState("")
  const [batteryLevel, setBatteryLevel] = useState(45)

  const nearbyStations = [
    {
      id: 1,
      name: "GreenPower Station Downtown",
      distance: "0.8 miles",
      connectors: ["Type 2", "CCS"],
      speed: "150 kW",
      available: 3,
      total: 4,
      price: "$0.35/kWh",
      rating: 4.8,
      address: "123 Main St, Downtown",
    },
    {
      id: 2,
      name: "EcoCharge Mall Plaza",
      distance: "1.2 miles",
      connectors: ["Type 2", "CHAdeMO"],
      speed: "50 kW",
      available: 2,
      total: 6,
      price: "$0.28/kWh",
      rating: 4.6,
      address: "456 Shopping Blvd, Mall Plaza",
    },
    {
      id: 3,
      name: "FastCharge Highway Stop",
      distance: "2.1 miles",
      connectors: ["CCS", "Tesla"],
      speed: "250 kW",
      available: 1,
      total: 8,
      price: "$0.42/kWh",
      rating: 4.9,
      address: "789 Highway 101, Exit 15",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">ChargeConnect</span>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Battery className="h-4 w-4" />
              <span>{batteryLevel}%</span>
            </Badge>
            <Button variant="ghost" size="sm">
              Profile
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Charge</h1>
          <p className="text-gray-600">Discover compatible charging stations near you</p>
        </div>

        <Tabs defaultValue="map" className="space-y-6">
          <TabsList>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search location or address..."
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Connector" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="type2">Type 2</SelectItem>
                        <SelectItem value="ccs">CCS</SelectItem>
                        <SelectItem value="chademo">CHAdeMO</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card>
              <CardContent className="p-0">
                <div className="h-96 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Map</h3>
                    <p className="text-gray-600">Real-time charging station locations and availability</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <div className="grid gap-4">
              {nearbyStations.map((station) => (
                <Card key={station.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{station.name}</h3>
                        <p className="text-gray-600 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {station.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{station.rating}</span>
                        </div>
                        <Badge variant="outline">{station.distance}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Connectors</p>
                        <div className="flex flex-wrap gap-1">
                          {station.connectors.map((connector) => (
                            <Badge key={connector} variant="secondary" className="text-xs">
                              {connector}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Speed</p>
                        <p className="font-medium flex items-center">
                          <Zap className="h-4 w-4 mr-1 text-green-600" />
                          {station.speed}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Availability</p>
                        <p className="font-medium">
                          <span className="text-green-600">{station.available}</span>/{station.total} available
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="font-medium">{station.price}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700">
                        <Navigation className="h-4 w-4 mr-2" />
                        Navigate
                      </Button>
                      <Button variant="outline">
                        <Clock className="h-4 w-4 mr-2" />
                        Reserve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Information</CardTitle>
                  <CardDescription>Update your EV details for better matching</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Make</label>
                      <p className="text-lg">Tesla</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Model</label>
                      <p className="text-lg">Model 3</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Battery Capacity</label>
                      <p className="text-lg">75 kWh</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Connector Type</label>
                      <p className="text-lg">Type 2, CCS</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    Edit Vehicle Info
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Charging History</CardTitle>
                  <CardDescription>Your recent charging sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">GreenPower Downtown</p>
                        <p className="text-sm text-gray-600">Yesterday, 2:30 PM</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$12.50</p>
                        <p className="text-sm text-gray-600">45 kWh</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">EcoCharge Mall</p>
                        <p className="text-sm text-gray-600">3 days ago, 11:15 AM</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$8.75</p>
                        <p className="text-sm text-gray-600">32 kWh</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
