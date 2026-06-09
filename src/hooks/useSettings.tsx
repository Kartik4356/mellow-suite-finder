import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  hotel_name: string;
  tagline: string;
  theme_primary: string;
  theme_accent: string;
  subscription_plan: string;
  currency: string;
  hero_image_url: string | null;
  about_image_url: string | null;
  logo_url: string | null;
  extra_images: Array<{ id?: string; label?: string; url: string }>;
}

const DEFAULTS: AppSettings = {
  hotel_name: "Aurelia Hotel",
  tagline: "Timeless luxury, modern comfort",
  theme_primary: "#8b6f47",
  theme_accent: "#c9a86a",
  subscription_plan: "starter",
  currency: "INR",
  hero_image_url: null,
  about_image_url: null,
  logo_url: null,
  extra_images: [],
};

export function useSettings() {
  const q = useQuery({
    queryKey: ["app_settings"],
    queryFn: async (): Promise<AppSettings> => {
      const { data } = await supabase.from("app_settings").select("*").eq("id", "global").maybeSingle();
      if (!data) return DEFAULTS;
      return { ...DEFAULTS, ...(data as any), extra_images: ((data as any).extra_images ?? []) as any };
    },
    staleTime: 30_000,
  });
  return q.data ?? DEFAULTS;
}
