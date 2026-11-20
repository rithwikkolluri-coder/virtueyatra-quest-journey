import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ExternalLink, Footprints, Car, TrainFront, Volume2, VolumeX, Navigation, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GpsFix, useTripNavigation } from "@/hooks/useTripNavigation";
import { googleMapsDirections, type LatLng, type TravelMode } from "@/lib/navigation";

const modes = [["DRIVE", Car], ["WALK", Footprints], ["TRANSIT", TrainFront]] as const;
const copy = {
  en: ["Driving", "Walking", "Transit", "Start navigation", "Exit navigation", "Open in Google Maps", "Finding your GPS location…", "Finding your route…", "Continue along the route", "You’ve arrived", "Distance left", "Estimated arrival", "Voice guidance", "Sign in to navigate", "Offline: new directions need internet", "Updating your route…", "Retry"],
  hi: ["कार", "पैदल", "सार्वजनिक परिवहन", "नेविगेशन शुरू करें", "नेविगेशन बंद करें", "Google Maps में खोलें", "आपका GPS स्थान ढूँढ रहे हैं…", "रास्ता ढूँढ रहे हैं…", "मार्ग पर आगे बढ़ें", "आप पहुँच गए हैं", "बाकी दूरी", "पहुँचने का अनुमानित समय", "आवाज़ में दिशा-निर्देश", "नेविगेशन के लिए साइन इन करें", "ऑफ़लाइन: नए रास्ते के लिए इंटरनेट चाहिए", "रास्ता अपडेट हो रहा है…", "फिर कोशिश करें"],
  te: ["కారు", "నడక", "ప్రజా రవాణా", "నావిగేషన్ ప్రారంభించండి", "నావిగేషన్ ఆపండి", "Google Mapsలో తెరవండి", "మీ GPS స్థానం కోసం చూస్తున్నాం…", "దారిని వెతుకుతున్నాం…", "ఈ దారిలో కొనసాగండి", "మీరు చేరుకున్నారు", "మిగిలిన దూరం", "చేరుకునే అంచనా సమయం", "వాయిస్ మార్గదర్శనం", "నావిగేషన్ కోసం సైన్ ఇన్ చేయండి", "ఆఫ్‌లైన్: కొత్త దారికి ఇంటర్నెట్ కావాలి", "దారిని అప్‌డేట్ చేస్తున్నాం…", "మళ్లీ ప్రయత్నించండి"],
} as const;

type Props = {
  nav: ReturnType<typeof useTripNavigation>; destination: LatLng; fix: GpsFix | null; online: boolean;
  signedIn: boolean; onStart: () => void; onExit: () => void; overlay?: boolean;
};

export function TripNavigationControls({ nav, destination, fix, online, signedIn, onStart, onExit, overlay }: Props) {
  const { language } = useLanguage();
  const [drive, walk, transit, start, exit, open, locating, routing, follow, arrived, remaining, eta, voice, signIn, offline, updating, retry] = copy[language] ?? copy.en;
  const labels: Record<TravelMode, string> = { DRIVE: drive, WALK: walk, TRANSIT: transit };
  const { guide } = nav;
  const instruction = guide?.step?.maneuver ?? "";
  const Maneuver = instruction.includes("U_TURN") ? RotateCcw : instruction.includes("LEFT") ? ArrowLeft : instruction.includes("RIGHT") ? ArrowRight : guide?.arrived ? ArrowDown : ArrowUp;
  const formatDistance = (n: number) => n < 1000 ? `${Math.round(n)} m` : `${(n / 1000).toFixed(1)} km`;
  if (overlay) return nav.active && guide ? (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center gap-3 rounded-md border border-border bg-card p-3 shadow-md sm:inset-x-5" aria-live="polite">
      <Maneuver className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        {guide.turnMeters !== undefined && !guide.arrived && <p className="text-xs text-muted-foreground">{formatDistance(guide.turnMeters)}</p>}
        <p className="break-words font-semibold">{guide.arrived ? arrived : guide.step?.text || follow}</p>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-3 border-y border-border bg-card px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center gap-2">
        {!nav.active && <div className="inline-flex flex-wrap gap-1 rounded-md border border-border bg-muted/40 p-1">
          {modes.map(([mode, Icon]) => (
            <Button key={mode} size="sm" variant={nav.mode === mode ? "default" : "ghost"} aria-pressed={nav.mode === mode} onClick={() => nav.setMode(mode)}>
              <Icon className="mr-1.5 h-4 w-4" />{labels[mode]}
            </Button>
          ))}
        </div>}
        {nav.active ? <>
          <Button size="icon" variant="outline" title={voice} aria-label={voice} aria-pressed={!nav.muted} onClick={() => nav.setMuted(!nav.muted)}>
            {nav.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="outline" onClick={onExit}>{exit}</Button>
        </> : signedIn ? <Button size="sm" onClick={onStart} disabled={!online}><Navigation className="mr-2 h-4 w-4" />{start}</Button>
          : <Button asChild size="sm"><Link to="/auth">{signIn}</Link></Button>}
        <Button asChild size="sm" variant="outline">
          <a href={googleMapsDirections(destination, nav.mode, fix)} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />{open}</a>
        </Button>
      </div>
      {!online && <p className="text-sm text-muted-foreground" role="status">{offline}</p>}
      {nav.active && nav.error && <div className="flex flex-wrap items-center gap-2 text-sm text-destructive" role="alert">{nav.error}{!nav.route && online && <Button size="sm" variant="outline" onClick={onStart}>{retry}</Button>}</div>}
      {nav.active && !nav.error && (!guide || nav.busy) && online && <p className="text-sm text-muted-foreground" role="status">{nav.busy ? guide ? updating : routing : locating}</p>}
      {nav.active && guide && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div><span className="block text-xs text-muted-foreground">{remaining}</span><strong>{formatDistance(guide.remaining)}</strong></div>
          <div><span className="block text-xs text-muted-foreground">{eta}</span><strong>{new Date(guide.eta).toLocaleTimeString(language, { hour: "numeric", minute: "2-digit" })}</strong></div>
        </div>
      )}
    </div>
  );
}