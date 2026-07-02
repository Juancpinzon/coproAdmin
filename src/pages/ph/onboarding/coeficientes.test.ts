import { describe, it, expect } from "vitest";
import { sumCoef, newUnidad } from "@/pages/ph/onboarding/StepUnidades";

describe("sumCoef", () => {
  it("suma los coeficientes de copropiedad", () => {
    const us = [newUnidad({ coef: "50" }), newUnidad({ coef: "30" }), newUnidad({ coef: "20" })];
    expect(sumCoef(us)).toBe(100);
  });

  it("maneja coeficientes con decimales (deben acercarse a 100)", () => {
    const us = [
      newUnidad({ coef: "33.333" }),
      newUnidad({ coef: "33.333" }),
      newUnidad({ coef: "33.334" }),
    ];
    expect(sumCoef(us)).toBeCloseTo(100, 3);
  });

  it("trata coeficientes vacíos o inválidos como 0", () => {
    const us = [newUnidad({ coef: "" }), newUnidad({ coef: "abc" }), newUnidad({ coef: "10" })];
    expect(sumCoef(us)).toBe(10);
  });

  it("lista vacía suma 0", () => {
    expect(sumCoef([])).toBe(0);
  });
});
