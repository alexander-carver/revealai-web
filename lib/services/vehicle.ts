import { sanitizeVin, isValidVin } from "@/lib/utils";
import type { VinDecodedVehicle, NHTSADecodeResponse } from "@/lib/types";

class VehicleServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VehicleServiceError";
  }
}

const VIN_API_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues";

export async function decodeVin(vin: string): Promise<VinDecodedVehicle> {
  try {
  const sanitized = sanitizeVin(vin);

  if (!isValidVin(sanitized)) {
    throw new VehicleServiceError(
      "Enter a valid 17-character VIN (letters and numbers only)."
    );
  }

  const url = `${VIN_API_BASE}/${sanitized}?format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new VehicleServiceError(
      `VIN service returned an unexpected status (${response.status}).`
    );
  }

  const data: NHTSADecodeResponse = await response.json();

  if (!data.Results || data.Results.length === 0) {
    throw new VehicleServiceError("No data returned for that VIN.");
  }

  const result = data.Results[0];

  // Check for API errors
  const errorCode = result.ErrorCode as string;
  if (errorCode && !errorCode.startsWith("0")) {
    const errorText =
      (result.ErrorText as string) || `VIN decode failed (code ${errorCode}).`;
    throw new VehicleServiceError(errorText);
  }

  // Build values map
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(result)) {
    if (value !== null && value !== undefined && value !== "") {
      values[key] = String(value).trim();
    }
  }

  // Ensure VIN is in values
  if (!values.VIN) {
    values.VIN = sanitized;
  }

  return buildVehicle(sanitized, values);
  } catch (error) {
    if (error instanceof VehicleServiceError) {
      throw error;
    }
    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new VehicleServiceError(
        "Network error: Unable to connect to NHTSA service. Please check your internet connection."
      );
    }
    throw new VehicleServiceError(
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
}

function buildVehicle(
  vin: string,
  values: Record<string, string>
): VinDecodedVehicle {
  return {
    vin,
    values,
    modelYear: values.ModelYear,
    make: values.Make,
    model: values.Model,
    trim: values.Trim || values.Trim2,
    series: values.Series,
    bodyClass: values.BodyClass,
    vehicleType: values.VehicleType,
    manufacturer: values.ManufacturerName,
    plantCountry: values.PlantCountry,
    plantState: values.PlantState,
    plantCity: values.PlantCity,
    fuelType: values.FuelTypePrimary,
    driveType: values.DriveType,
    transmission: values.TransmissionStyle,
    doors: values.Doors,
    engineConfiguration: values.EngineConfiguration,
    engineCylinders: values.EngineCylinders,
    engineHP: values.EngineHP,
    engineKW: values.EngineKW,
    engineDisplacementL: values.DisplacementL,
    errorText: values.ErrorText,
  };
}

export function getVehicleTitle(vehicle: VinDecodedVehicle): string {
  const parts = [vehicle.modelYear, vehicle.make, vehicle.model].filter(
    Boolean
  );
  return parts.length > 0 ? parts.join(" ") : vehicle.vin;
}

export function getEngineSummary(vehicle: VinDecodedVehicle): string | null {
  const pieces: string[] = [];

  if (vehicle.engineConfiguration) {
    pieces.push(vehicle.engineConfiguration);
  }
  if (vehicle.engineCylinders) {
    pieces.push(`${vehicle.engineCylinders} cyl`);
  }

  const power: string[] = [];
  if (vehicle.engineHP) power.push(`${vehicle.engineHP} hp`);
  if (vehicle.engineKW) power.push(`${vehicle.engineKW} kW`);
  if (power.length > 0) pieces.push(power.join(" / "));

  if (vehicle.engineDisplacementL) {
    pieces.push(`${vehicle.engineDisplacementL}L`);
  }

  return pieces.length > 0 ? pieces.join(" • ") : null;
}

