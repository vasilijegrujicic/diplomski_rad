// Shared between the register form and the dashboard's filter form, so both collect
// the same set of Berlin areas the same way (search + chips, empty list = "All Berlin").
// Mixes the 12 official Bezirke with the informal Kiez names (e.g. Kreuzberg, Prenzlauer
// Berg) that Kleinanzeigen/WG-Gesucht/InBerlinWohnen actually offer as search filters —
// KiezMatcher compares plain strings, so both levels match real listings equally well.
export const KIEZ_OPTIONS = [
  { value: "mitte", label: "Mitte" },
  { value: "kreuzberg", label: "Kreuzberg" },
  { value: "friedrichshain", label: "Friedrichshain" },
  { value: "prenzlauer-berg", label: "Prenzlauer Berg" },
  { value: "wedding", label: "Wedding" },
  { value: "pankow", label: "Pankow" },
  { value: "neukölln", label: "Neukölln" },
  { value: "charlottenburg", label: "Charlottenburg" },
  { value: "wilmersdorf", label: "Wilmersdorf" },
  { value: "spandau", label: "Spandau" },
  { value: "steglitz", label: "Steglitz" },
  { value: "zehlendorf", label: "Zehlendorf" },
  { value: "tempelhof", label: "Tempelhof" },
  { value: "schöneberg", label: "Schöneberg" },
  { value: "reinickendorf", label: "Reinickendorf" },
  { value: "lichtenberg", label: "Lichtenberg" },
  { value: "marzahn", label: "Marzahn" },
  { value: "hellersdorf", label: "Hellersdorf" },
  { value: "treptow", label: "Treptow" },
  { value: "köpenick", label: "Köpenick" },
];

export function kiezLabel(value: string): string {
  return KIEZ_OPTIONS.find((k) => k.value === value)?.label ?? value;
}
