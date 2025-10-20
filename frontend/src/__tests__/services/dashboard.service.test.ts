import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '@/services/dashboard.service';
import axios from '@/lib/axios';
import {
  mockCar,
  mockReservation,
  mockDetailedReport,
  mockMaintenanceAlerts,
  mockMaintenanceAlert,
} from "../mocks/mockData";

vi.mock("@/lib/axios");

describe("dashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOwnerCars", () => {
    it("should fetch owner cars", async () => {
      const mockResponse = { data: { data: [mockCar] } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await dashboardService.getOwnerCars();

      expect(axios.get).toHaveBeenCalledWith("/dashboard/cars");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockCar);
    });

    it("should return empty array when no cars", async () => {
      const mockResponse = { data: { data: [] } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await dashboardService.getOwnerCars();

      expect(result).toHaveLength(0);
    });
  });

  describe("getAllReservations", () => {
    it("should fetch all reservations", async () => {
      const mockResponse = { data: { data: [mockReservation] } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await dashboardService.getAllReservations();

      expect(axios.get).toHaveBeenCalledWith("/dashboard/reservations");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockReservation);
    });
  });

  describe("createReservation", () => {
    it("should create reservation", async () => {
      const reservationData = {
        carId: "car123",
        startDate: "2024-02-01",
        endDate: "2024-02-05",
        customerEmail: "customer@example.com",
        customerPhone: "+2341234567890",
        driverLicense: {
          number: "DL123456",
          expiryDate: "2025-12-31",
        },
      };
      const mockResponse = { data: { data: mockReservation } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await dashboardService.createReservation(reservationData);

      expect(axios.post).toHaveBeenCalledWith(
        "/dashboard/reservations/create",
        reservationData
      );
      expect(result).toEqual(mockReservation);
    });

    it("should create reservation with time fields", async () => {
      const reservationData = {
        carId: "car123",
        startDate: "2024-02-01",
        endDate: "2024-02-05",
        startTime: "10:00",
        endTime: "10:00",
        customerEmail: "customer@example.com",
        customerPhone: "+2341234567890",
        driverLicense: {
          number: "DL123456",
          expiryDate: "2025-12-31",
        },
      };
      const mockResponse = { data: { data: mockReservation } };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      await dashboardService.createReservation(reservationData);

      expect(axios.post).toHaveBeenCalledWith(
        "/dashboard/reservations/create",
        reservationData
      );
    });
  });

  describe("cancelReservation", () => {
    it("should cancel reservation", async () => {
      const cancelledReservation = {
        ...mockReservation,
        status: "cancelled" as const,
      };
      const mockResponse = { data: { data: cancelledReservation } };

      vi.mocked(axios.put).mockResolvedValue(mockResponse);

      const result = await dashboardService.cancelReservation("reservation123");

      expect(axios.put).toHaveBeenCalledWith(
        "/dashboard/reservations/reservation123/cancel"
      );
      expect(result.status).toBe("cancelled");
    });
  });

  describe("reassignReservation", () => {
    it("should reassign reservation to new car", async () => {
      const newCarId = "car456";
      const reassignedReservation = { ...mockReservation, carId: newCarId };
      const mockResponse = { data: { data: reassignedReservation } };

      vi.mocked(axios.put).mockResolvedValue(mockResponse);

      const result = await dashboardService.reassignReservation(
        "reservation123",
        newCarId
      );

      expect(axios.put).toHaveBeenCalledWith(
        "/dashboard/reservations/reservation123/reassign",
        { newCarId }
      );
      expect(result.carId).toBe(newCarId);
    });
  });

  describe("getReports", () => {
    it("should fetch reports without date range", async () => {
      const mockResponse = { data: { data: mockDetailedReport } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await dashboardService.getReports();

      expect(axios.get).toHaveBeenCalledWith("/dashboard/reports", {
        params: { startDate: undefined, endDate: undefined },
      });
      expect(result).toEqual(mockDetailedReport);
      expect(result.overview.totalRevenue).toBe(500000);
    });

    it("should fetch reports with date range", async () => {
      const startDate = "2024-01-01";
      const endDate = "2024-01-31";
      const mockResponse = { data: { data: mockDetailedReport } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await dashboardService.getReports(startDate, endDate);

      expect(axios.get).toHaveBeenCalledWith("/dashboard/reports", {
        params: { startDate, endDate },
      });
      expect(result).toEqual(mockDetailedReport);
    });

    it("should return detailed report structure", async () => {
      const mockResponse = { data: { data: mockDetailedReport } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await dashboardService.getReports();

      expect(result.overview).toBeDefined();
      expect(result.topCars).toBeDefined();
      expect(result.reservationsByStatus).toBeDefined();
      expect(result.reservationsByType).toBeDefined();
      expect(result.topCars).toHaveLength(1);
    });
  });

  describe("getMaintenanceAlerts", () => {
    it("should fetch maintenance alerts", async () => {
      const mockResponse = { data: { data: mockMaintenanceAlerts } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await dashboardService.getMaintenanceAlerts();

      expect(axios.get).toHaveBeenCalledWith("/dashboard/maintenance/alerts");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockMaintenanceAlert);
    });

    it("should return empty array when no maintenance alerts", async () => {
      const mockResponse = { data: { data: [] } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await dashboardService.getMaintenanceAlerts();

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("should return maintenance alert with correct structure", async () => {
      const mockResponse = { data: { data: [mockMaintenanceAlert] } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await dashboardService.getMaintenanceAlerts();

      expect(result[0]).toHaveProperty("carId");
      expect(result[0]).toHaveProperty("make");
      expect(result[0]).toHaveProperty("model");
      expect(result[0]).toHaveProperty("currentMileage");
      expect(result[0]).toHaveProperty("serviceRequested");
      expect(result[0]).toHaveProperty("message");
      expect(result[0].make).toBe("Toyota");
      expect(result[0].model).toBe("Camry");
      expect(result[0].currentMileage).toBe(55000);
      expect(result[0].serviceRequested).toBe(50000);
    });

    it("should handle maintenance alerts for multiple cars", async () => {
      const mockResponse = { data: { data: mockMaintenanceAlerts } };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const result = await dashboardService.getMaintenanceAlerts();

      expect(result).toHaveLength(2);
      expect(result[0].make).toBe("Toyota");
      expect(result[1].make).toBe("Honda");
      expect(result[0].currentMileage).toBeGreaterThan(
        result[0].serviceRequested!
      );
      expect(result[1].currentMileage).toBeGreaterThan(
        result[1].serviceRequested!
      );
    });
  });
});

