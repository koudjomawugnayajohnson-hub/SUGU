import { redirect } from "next/navigation";

export default function Home() {
  // Rediriger la racine vers le dashboard
  // Le layout du dashboard s'occupera de rediriger vers /login si non authentifié
  redirect("/dashboard");
}