import { describe, it, expect } from "vitest";
import {
  percentageOf,
  whatPercentOf,
  percentageChange,
  addPercentage,
  subtractPercentage,
  convertUnit,
  calculateBMI,
  calculateLoan,
  calculateAge,
} from "../utils/math";

// ============================================
// Percentage calculations
// ============================================
describe("percentageOf", () => {
  it("calculates 20% of 100", () => {
    expect(percentageOf(20, 100)).toBe(20);
  });

  it("calculates 50% of 200", () => {
    expect(percentageOf(50, 200)).toBe(100);
  });

  it("calculates 0% of anything", () => {
    expect(percentageOf(0, 999)).toBe(0);
  });

  it("calculates 100% of anything", () => {
    expect(percentageOf(100, 42)).toBe(42);
  });
});

describe("whatPercentOf", () => {
  it("calculates what percent 25 is of 100", () => {
    expect(whatPercentOf(25, 100)).toBe(25);
  });

  it("calculates what percent 3 is of 12", () => {
    expect(whatPercentOf(3, 12)).toBe(25);
  });

  it("returns 0 when denominator is 0", () => {
    expect(whatPercentOf(5, 0)).toBe(0);
  });
});

describe("percentageChange", () => {
  it("calculates 50% increase", () => {
    expect(percentageChange(100, 150)).toBe(50);
  });

  it("calculates 50% decrease", () => {
    expect(percentageChange(100, 50)).toBe(-50);
  });

  it("returns 0 when from is 0", () => {
    expect(percentageChange(0, 100)).toBe(0);
  });

  it("calculates 0% change", () => {
    expect(percentageChange(100, 100)).toBe(0);
  });
});

describe("addPercentage", () => {
  it("adds 20% to 100", () => {
    expect(addPercentage(100, 20)).toBe(120);
  });

  it("adds 0%", () => {
    expect(addPercentage(100, 0)).toBe(100);
  });
});

describe("subtractPercentage", () => {
  it("subtracts 20% from 100", () => {
    expect(subtractPercentage(100, 20)).toBe(80);
  });

  it("subtracts 0%", () => {
    expect(subtractPercentage(100, 0)).toBe(100);
  });
});

// ============================================
// Unit conversion
// ============================================
describe("convertUnit - length", () => {
  it("converts 1 km to meters", () => {
    expect(convertUnit(1, "km", "m", "length")).toBe(1000);
  });

  it("converts 100 cm to meters", () => {
    expect(convertUnit(100, "cm", "m", "length")).toBe(1);
  });

  it("converts 1 mile to km", () => {
    const result = convertUnit(1, "mile", "km", "length");
    expect(result).toBeCloseTo(1.60934, 3);
  });

  it("converts 1 inch to cm", () => {
    const result = convertUnit(1, "inch", "cm", "length");
    expect(result).toBeCloseTo(2.54, 2);
  });
});

describe("convertUnit - weight", () => {
  it("converts 1 kg to grams", () => {
    expect(convertUnit(1, "kg", "g", "weight")).toBe(1000);
  });

  it("converts 1 lb to kg", () => {
    const result = convertUnit(1, "lb", "kg", "weight");
    expect(result).toBeCloseTo(0.4536, 2);
  });
});

describe("convertUnit - temperature", () => {
  it("converts 0°C to Fahrenheit", () => {
    expect(convertUnit(0, "Celsius", "Fahrenheit", "temperature")).toBe(32);
  });

  it("converts 100°C to Fahrenheit", () => {
    expect(convertUnit(100, "Celsius", "Fahrenheit", "temperature")).toBe(212);
  });

  it("converts 32°F to Celsius", () => {
    expect(convertUnit(32, "Fahrenheit", "Celsius", "temperature")).toBe(0);
  });

  it("converts 0°C to Kelvin", () => {
    expect(convertUnit(0, "Celsius", "Kelvin", "temperature")).toBeCloseTo(
      273.15,
      1
    );
  });

  it("converts 0K to Celsius", () => {
    expect(convertUnit(0, "Kelvin", "Celsius", "temperature")).toBeCloseTo(
      -273.15,
      1
    );
  });
});

describe("convertUnit - data", () => {
  it("converts 1 KB to bytes", () => {
    expect(convertUnit(1, "KB", "B", "data")).toBe(1024);
  });

  it("converts 1 MB to KB", () => {
    expect(convertUnit(1, "MB", "KB", "data")).toBe(1024);
  });

  it("converts 1 GB to MB", () => {
    expect(convertUnit(1, "GB", "MB", "data")).toBe(1024);
  });
});

// ============================================
// BMI calculation
// ============================================
describe("calculateBMI", () => {
  it("calculates normal BMI", () => {
    const result = calculateBMI(70, 175);
    expect(result.bmi).toBeCloseTo(22.86, 1);
    expect(result.category).toBe("Normal");
  });

  it("classifies underweight", () => {
    const result = calculateBMI(50, 175);
    expect(result.bmi).toBeLessThan(18.5);
    expect(result.category).toBe("Underweight");
  });

  it("classifies overweight", () => {
    const result = calculateBMI(85, 175);
    expect(result.bmi).toBeGreaterThanOrEqual(25);
    expect(result.category).toBe("Overweight");
  });

  it("classifies obese", () => {
    const result = calculateBMI(120, 175);
    expect(result.bmi).toBeGreaterThanOrEqual(30);
    expect(result.category).toBe("Obese");
  });

  it("handles zero weight", () => {
    const result = calculateBMI(0, 175);
    expect(result.bmi).toBe(0);
  });
});

// ============================================
// Loan calculation
// ============================================
describe("calculateLoan", () => {
  it("calculates standard mortgage", () => {
    const result = calculateLoan(200000, 5, 30);
    expect(result.monthlyPayment).toBeCloseTo(1073.64, 0);
    expect(result.totalPayment).toBeGreaterThan(200000);
    expect(result.totalInterest).toBeGreaterThan(0);
  });

  it("handles 0% interest", () => {
    const result = calculateLoan(120000, 0, 10);
    expect(result.monthlyPayment).toBe(1000);
    expect(result.totalInterest).toBe(0);
  });

  it("returns zeros for invalid input", () => {
    const result = calculateLoan(0, 5, 30);
    expect(result.monthlyPayment).toBe(0);
    expect(result.totalPayment).toBe(0);
    expect(result.totalInterest).toBe(0);
  });
});

// ============================================
// Age calculation
// ============================================
describe("calculateAge", () => {
  it("calculates exact age", () => {
    const birth = new Date(1990, 0, 15); // Jan 15, 1990
    const now = new Date(2025, 4, 2); // May 2, 2025
    const result = calculateAge(birth, now);
    expect(result.years).toBe(35);
    expect(result.months).toBe(3);
    expect(result.days).toBe(17);
  });

  it("handles birthday not yet passed this year", () => {
    const birth = new Date(1990, 5, 15); // Jun 15, 1990
    const now = new Date(2025, 4, 2); // May 2, 2025
    const result = calculateAge(birth, now);
    expect(result.years).toBe(34);
  });

  it("calculates total days", () => {
    const birth = new Date(2000, 0, 1);
    const now = new Date(2000, 0, 11);
    const result = calculateAge(birth, now);
    expect(result.totalDays).toBe(10);
  });

  it("returns positive values for past dates", () => {
    const birth = new Date(1990, 0, 1);
    const now = new Date(2025, 0, 1);
    const result = calculateAge(birth, now);
    expect(result.years).toBe(35);
    expect(result.totalDays).toBeGreaterThan(0);
  });
});
