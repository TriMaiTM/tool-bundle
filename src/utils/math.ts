/**
 * Math calculation utility functions
 * Extracted from tool components for testability
 */

export function percentageOf(x: number, y: number): number {
	return (x / 100) * y;
}

export function whatPercentOf(x: number, y: number): number {
	if (y === 0) return 0;
	return (x / y) * 100;
}

export function percentageChange(from: number, to: number): number {
	if (from === 0) return 0;
	return ((to - from) / Math.abs(from)) * 100;
}

export function addPercentage(value: number, percent: number): number {
	return value + (value * percent) / 100;
}

export function subtractPercentage(value: number, percent: number): number {
	return value - (value * percent) / 100;
}

// Unit conversion factors (base unit for each category)
const LENGTH_FACTORS: Record<string, number> = {
	mm: 0.001,
	cm: 0.01,
	m: 1,
	km: 1000,
	inch: 0.0254,
	foot: 0.3048,
	yard: 0.9144,
	mile: 1609.344,
};

const WEIGHT_FACTORS: Record<string, number> = {
	mg: 0.000001,
	g: 0.001,
	kg: 1,
	lb: 0.453592,
	oz: 0.0283495,
};

const SPEED_FACTORS: Record<string, number> = {
	"km/h": 1,
	mph: 1.60934,
	"m/s": 3.6,
};

const DATA_FACTORS: Record<string, number> = {
	B: 1,
	KB: 1024,
	MB: 1024 * 1024,
	GB: 1024 * 1024 * 1024,
	TB: 1024 * 1024 * 1024 * 1024,
};

export type UnitCategory = "length" | "weight" | "temperature" | "speed" | "data";

export function convertUnit(
	value: number,
	from: string,
	to: string,
	category: UnitCategory,
): number {
	if (category === "temperature") {
		return convertTemperature(value, from, to);
	}

	const factors =
		category === "length"
			? LENGTH_FACTORS
			: category === "weight"
				? WEIGHT_FACTORS
				: category === "speed"
					? SPEED_FACTORS
					: DATA_FACTORS;

	const baseValue = value * factors[from];
	return baseValue / factors[to];
}

function convertTemperature(value: number, from: string, to: string): number {
	// Convert to Celsius first
	let celsius: number;
	switch (from) {
		case "Celsius":
			celsius = value;
			break;
		case "Fahrenheit":
			celsius = (value - 32) * (5 / 9);
			break;
		case "Kelvin":
			celsius = value - 273.15;
			break;
		default:
			return value;
	}

	// Convert from Celsius to target
	switch (to) {
		case "Celsius":
			return celsius;
		case "Fahrenheit":
			return celsius * (9 / 5) + 32;
		case "Kelvin":
			return celsius + 273.15;
		default:
			return celsius;
	}
}

export type BmiCategory = "Underweight" | "Normal" | "Overweight" | "Obese";

export function calculateBMI(
	weightKg: number,
	heightCm: number,
): { bmi: number; category: BmiCategory } {
	if (weightKg <= 0 || heightCm <= 0) {
		return { bmi: 0, category: "Normal" };
	}
	const heightM = heightCm / 100;
	const bmi = weightKg / (heightM * heightM);
	let category: BmiCategory;
	if (bmi < 18.5) category = "Underweight";
	else if (bmi < 25) category = "Normal";
	else if (bmi < 30) category = "Overweight";
	else category = "Obese";

	return { bmi: Math.round(bmi * 100) / 100, category };
}

export interface LoanResult {
	monthlyPayment: number;
	totalPayment: number;
	totalInterest: number;
}

export function calculateLoan(
	principal: number,
	annualRate: number,
	termYears: number,
): LoanResult {
	if (principal <= 0 || termYears <= 0) {
		return { monthlyPayment: 0, totalPayment: 0, totalInterest: 0 };
	}

	const monthlyRate = annualRate / 100 / 12;
	const totalPayments = termYears * 12;

	let monthlyPayment: number;
	if (monthlyRate === 0) {
		monthlyPayment = principal / totalPayments;
	} else {
		monthlyPayment =
			(principal * monthlyRate * (1 + monthlyRate) ** totalPayments) /
			((1 + monthlyRate) ** totalPayments - 1);
	}

	const totalPayment = monthlyPayment * totalPayments;
	const totalInterest = totalPayment - principal;

	return {
		monthlyPayment: Math.round(monthlyPayment * 100) / 100,
		totalPayment: Math.round(totalPayment * 100) / 100,
		totalInterest: Math.round(totalInterest * 100) / 100,
	};
}

export interface AgeResult {
	years: number;
	months: number;
	days: number;
	totalDays: number;
	totalHours: number;
	totalMinutes: number;
}

export function calculateAge(birthDate: Date, now = new Date()): AgeResult {
	let years = now.getFullYear() - birthDate.getFullYear();
	let months = now.getMonth() - birthDate.getMonth();
	let days = now.getDate() - birthDate.getDate();

	if (days < 0) {
		months--;
		const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
		days += prevMonth.getDate();
	}
	if (months < 0) {
		years--;
		months += 12;
	}

	const totalMs = now.getTime() - birthDate.getTime();
	const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
	const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
	const totalMinutes = Math.floor(totalMs / (1000 * 60));

	return { years, months, days, totalDays, totalHours, totalMinutes };
}
