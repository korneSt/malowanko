import type { Metadata } from "next";
import { GeneratorView } from "./GeneratorView";

export const metadata: Metadata = {
  title: "Generator - Malowanko",
  description: "Stwórz własną kolorowankę dla dzieci za pomocą AI",
};

export default function GeneratorPage() {
  return <GeneratorView />;
}
