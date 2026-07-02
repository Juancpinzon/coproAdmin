import { describe, it, expect } from "vitest";
import { formatCOP, calcularMontoCuota, calcularDiasHabilesRestantes } from "@/lib/utils";

describe("formatCOP", () => {
  it("formatea pesos colombianos sin decimales y con separador de miles", () => {
    const out = formatCOP(1250000);
    expect(out).toContain("$");
    expect(out).toContain("1.250.000"); // agrupación es-CO usa punto
    expect(out).not.toContain(","); // COP no muestra centavos en el producto
  });

  it("formatea cero", () => {
    expect(formatCOP(0)).toContain("0");
    expect(formatCOP(0)).not.toContain(",");
  });

  it("nunca muestra centavos: redondea al peso (COP)", () => {
    const out = formatCOP(999.99);
    expect(out).not.toContain(","); // sin separador decimal
    expect(out).toContain("1.000"); // 999.99 redondea a 1.000
  });
});

describe("calcularMontoCuota", () => {
  it("modo fija: toda unidad paga la cuota base", () => {
    expect(calcularMontoCuota(280000, 5, "fija")).toBe(280000);
    expect(calcularMontoCuota(280000, 99, "fija")).toBe(280000); // ignora el coeficiente
  });

  it("modo coeficiente: proporcional al porcentaje", () => {
    expect(calcularMontoCuota(1000000, 5, "coeficiente")).toBe(50000);
    expect(calcularMontoCuota(280000, 5, "coeficiente")).toBe(14000);
  });

  it("modo coeficiente: redondea al peso (COP sin centavos)", () => {
    // 100000 * 3.333% = 3333.0 ; 100000 * 1.2345% = 1234.5 -> 1235 (round half up)
    expect(calcularMontoCuota(100000, 3.333, "coeficiente")).toBe(3333);
    expect(calcularMontoCuota(100000, 1.2345, "coeficiente")).toBe(1235);
  });

  it("bordes: coeficiente 0 o base 0 dan 0", () => {
    expect(calcularMontoCuota(280000, 0, "coeficiente")).toBe(0);
    expect(calcularMontoCuota(0, 50, "coeficiente")).toBe(0);
    expect(calcularMontoCuota(0, 0, "fija")).toBe(0);
  });

  it("propiedad clave: coeficientes que suman 100 recaudan la cuota base completa", () => {
    const base = 1000000;
    const coefs = [50, 30, 20];
    const total = coefs.reduce((a, c) => a + calcularMontoCuota(base, c, "coeficiente"), 0);
    expect(total).toBe(base);
  });
});

describe("calcularDiasHabilesRestantes", () => {
  // 2026-06-01 es lunes; 06-05 viernes; 06-06 sábado; 06-07 domingo; 06-08 lunes
  const lun1 = new Date(2026, 5, 1);
  const vie5 = new Date(2026, 5, 5);
  const lun8 = new Date(2026, 5, 8);

  it("cuenta solo días hábiles (lun–vie) dentro de la semana", () => {
    expect(calcularDiasHabilesRestantes(vie5, lun1)).toBe(4); // mar,mié,jue,vie
  });

  it("excluye el fin de semana", () => {
    expect(calcularDiasHabilesRestantes(lun8, vie5)).toBe(1); // solo el lunes
  });

  it("mismo día = 0", () => {
    expect(calcularDiasHabilesRestantes(lun1, lun1)).toBe(0);
  });

  it("fecha límite en el pasado = negativo (solicitud ARCO vencida)", () => {
    expect(calcularDiasHabilesRestantes(lun1, vie5)).toBe(-4);
  });
});
