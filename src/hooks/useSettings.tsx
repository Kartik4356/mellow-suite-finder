import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  hotel_name: string;
  tagline: string;
  theme_primary: string;
  theme_accent: string;
  subscription_plan: string;
  currency: string;
}

const DEFAULTS: AppSettings = {
  hotel_name: "Aurelia Hotel",
  tagline: "Timeless luxury, modern comfort",
  theme_primary: "#8b6f47",
  theme_accent: "#c9a86a",
  subscription_plan: "starter",
  currency: "USD",
};

export function useSettings() {
  const q = useQuery({
    queryKey: ["app_settings"],
    queryFn: async (): Promise<AppSettings> => {
      const { data } = await supabase.from("app_settings").select("*").eq("id", "global").maybeSingle();
      return (data as AppSettings) ?? DEFAULTS;
    },
    staleTime: 30_000,
  });
  return q.data ?? DEFAULTS;
}
