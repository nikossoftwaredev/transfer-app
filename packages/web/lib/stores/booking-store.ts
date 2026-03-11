import { create } from "zustand";

interface BookingStop {
  address: string;
  lat: number;
  lng: number;
}

interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
  polyline: string;
}

interface VehicleClassOption {
  id: string;
  name: string;
  capacity: number;
  description: string | null;
  tags: string[];
  imageUrl: string | null;
  fareRange: { min: number; max: number } | null;
}

type BookingStep = "location" | "vehicle" | "details" | "confirm" | "finding";

interface BookingState {
  step: BookingStep;
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffAddress: string;
  dropoffLat: number | null;
  dropoffLng: number | null;
  stops: BookingStop[];
  scheduledAt: Date;
  selectedClassId: string | null;
  passengerCount: number;
  luggageCount: number;
  specialInstructions: string;
  route: RouteInfo | null;
  vehicleClasses: VehicleClassOption[];
  bookingId: string | null;

  setStep: (step: BookingStep) => void;
  setPickup: (address: string, lat: number, lng: number) => void;
  setDropoff: (address: string, lat: number, lng: number) => void;
  addStop: (stop: BookingStop) => void;
  removeStop: (index: number) => void;
  setScheduledAt: (date: Date) => void;
  setSelectedClass: (id: string) => void;
  setPassengerCount: (count: number) => void;
  setLuggageCount: (count: number) => void;
  setSpecialInstructions: (text: string) => void;
  setRoute: (route: RouteInfo) => void;
  setVehicleClasses: (classes: VehicleClassOption[]) => void;
  setBookingId: (id: string) => void;
  reset: () => void;
}

const initialState = {
  step: "location" as BookingStep,
  pickupAddress: "",
  pickupLat: null as number | null,
  pickupLng: null as number | null,
  dropoffAddress: "",
  dropoffLat: null as number | null,
  dropoffLng: null as number | null,
  stops: [] as BookingStop[],
  scheduledAt: new Date(),
  selectedClassId: null as string | null,
  passengerCount: 1,
  luggageCount: 0,
  specialInstructions: "",
  route: null as RouteInfo | null,
  vehicleClasses: [] as VehicleClassOption[],
  bookingId: null as string | null,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setPickup: (address, lat, lng) =>
    set({ pickupAddress: address, pickupLat: lat, pickupLng: lng }),
  setDropoff: (address, lat, lng) =>
    set({ dropoffAddress: address, dropoffLat: lat, dropoffLng: lng }),
  addStop: (stop) =>
    set((state) => ({ stops: [...state.stops, stop] })),
  removeStop: (index) =>
    set((state) => ({
      stops: state.stops.filter((_, i) => i !== index),
    })),
  setScheduledAt: (date) => set({ scheduledAt: date }),
  setSelectedClass: (id) => set({ selectedClassId: id }),
  setPassengerCount: (count) => set({ passengerCount: count }),
  setLuggageCount: (count) => set({ luggageCount: count }),
  setSpecialInstructions: (text) => set({ specialInstructions: text }),
  setRoute: (route) => set({ route }),
  setVehicleClasses: (classes) => set({ vehicleClasses: classes }),
  setBookingId: (id) => set({ bookingId: id }),
  reset: () => set(initialState),
}));
