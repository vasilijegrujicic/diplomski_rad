// Shared between the register form and the dashboard's filter form, so both collect
// the same set of Berlin areas the same way (toggle buttons, empty list = "All Berlin").
export const KIEZ_OPTIONS = [
  { value: "mitte", label: "Mitte" },
  { value: "kreuzberg", label: "Kreuzberg" },
  { value: "neukölln", label: "Neukölln" },
  { value: "prenzlauer-berg", label: "Prenzlauer Berg" },
  { value: "wedding", label: "Wedding" },
];

export function kiezLabel(value: string): string {
  return KIEZ_OPTIONS.find((k) => k.value === value)?.label ?? value;
}
