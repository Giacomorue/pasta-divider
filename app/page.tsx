"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect, useId } from 'react'
import { Plus, Trash2, HelpCircle, CheckCircle, Scale, User, UtensilsCrossed, RotateCcw, Minus, Save, Star, Bookmark } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

type Persona = {
  id: string;
  nome: string;
  quantitaCruda: number;
  quantitaCotta: number;
}

type Preset = {
  id: string;
  nome: string;
  persone: Omit<Persona, 'quantitaCotta'>[];
}

const PORZIONE_DEFAULT = 100;

export default function Home() {
  const idBase = useId();
  const [persone, setPersone] = useState<Persona[]>([
    { id: `${idBase}-0`, nome: '', quantitaCruda: PORZIONE_DEFAULT, quantitaCotta: 0 }
  ]);
  const [pesoTotale, setPesoTotale] = useState<number>(0);
  const [risultatiCalcolati, setRisultatiCalcolati] = useState<boolean>(false);
  const [risultatiCopiati, setRisultatiCopiati] = useState<boolean>(false);
  const [mostraInfo, setMostraInfo] = useState<boolean>(true);
  const [salvataggioConfermato, setSalvataggioConfermato] = useState<boolean>(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [nomePreset, setNomePreset] = useState<string>('');
  const [showPresetsPanel, setShowPresetsPanel] = useState<boolean>(false);
  const [presetSalvato, setPresetSalvato] = useState<boolean>(false);
  const [presetInModifica, setPresetInModifica] = useState<Preset | null>(null);

  // Carica dati salvati
  useEffect(() => {
    const datiSalvati = localStorage.getItem('pastadivider_dati');
    if (datiSalvati) {
      try {
        const dati = JSON.parse(datiSalvati);
        if (dati.persone && dati.persone.length > 0) {
          setPersone(dati.persone);
        }
        if (dati.pesoTotale) {
          setPesoTotale(dati.pesoTotale);
        }
      } catch (e) {
        console.error('Errore nel caricamento dei dati salvati', e);
      }
    }

    // Carica preset salvati
    const presetsSalvati = localStorage.getItem('pastadivider_presets');
    if (presetsSalvati) {
      try {
        const presets = JSON.parse(presetsSalvati);
        if (Array.isArray(presets)) {
          setPresets(presets);
        }
      } catch (e) {
        console.error('Errore nel caricamento dei preset salvati', e);
      }
    }
  }, []);

  useEffect(() => {
    if (mostraInfo) {
      const timer = setTimeout(() => {
        setMostraInfo(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mostraInfo]);

  const aggiungiPersona = () => {
    setPersone([...persone, { 
      id: `${idBase}-${persone.length}`, 
      nome: '', 
      quantitaCruda: PORZIONE_DEFAULT, 
      quantitaCotta: 0 
    }]);
    setRisultatiCalcolati(false);
  };

  const rimuoviPersona = (id: string) => {
    setPersone(persone.filter(persona => persona.id !== id));
    setRisultatiCalcolati(false);
  };

  const modificaPersona = (id: string, campo: 'nome' | 'quantitaCruda', valore: string | number) => {
    setPersone(persone.map(persona => {
      if (persona.id === id) {
        return { ...persona, [campo]: valore };
      }
      return persona;
    }));
    setRisultatiCalcolati(false);
  };

  const incrementaQuantita = (id: string, incremento: number) => {
    setPersone(persone.map(persona => {
      if (persona.id === id) {
        const nuovaQuantita = Math.max(10, (persona.quantitaCruda || 0) + incremento);
        return { 
          ...persona, 
          quantitaCruda: nuovaQuantita
        };
      }
      return persona;
    }));
    setRisultatiCalcolati(false);
  };

  const calcolaDivisione = () => {
    if (!pesoTotale || persone.some(p => !p.quantitaCruda)) {
      return;
    }

    const totaleCrudo = persone.reduce((sum, persona) => sum + (persona.quantitaCruda || 0), 0);
    const fattoreCrescita = pesoTotale / totaleCrudo;

    const personeAggiornate = persone.map(persona => ({
      ...persona,
      quantitaCotta: Math.round(persona.quantitaCruda * fattoreCrescita)
    }));

    setPersone(personeAggiornate);
    setRisultatiCalcolati(true);
    
    // Scroll to results
    setTimeout(() => {
      document.getElementById('risultati')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const copiaRisultati = () => {
    const risultatiTesto = persone.map(p => 
      `${p.nome || 'Persona'}: ${p.quantitaCotta}g (${p.quantitaCruda}g crudi)`
    ).join('\n');
    
    navigator.clipboard.writeText(risultatiTesto).then(() => {
      setRisultatiCopiati(true);
      setTimeout(() => setRisultatiCopiati(false), 2000);
    });
  };

  const resetTutto = () => {
    setPersone([{ 
      id: `${idBase}-reset`, 
      nome: '', 
      quantitaCruda: PORZIONE_DEFAULT, 
      quantitaCotta: 0 
    }]);
    setPesoTotale(0);
    setRisultatiCalcolati(false);
    localStorage.removeItem('pastadivider_dati');
  };

  const salvaDati = () => {
    const datiDaSalvare = {
      persone,
      pesoTotale
    };
    localStorage.setItem('pastadivider_dati', JSON.stringify(datiDaSalvare));
    setSalvataggioConfermato(true);
    setTimeout(() => setSalvataggioConfermato(false), 2000);
  };

  const salvaPreset = () => {
    if (!nomePreset) return;

    if (presetInModifica) {
      // Modifica preset esistente
      const nuoviPresets = presets.map(preset => {
        if (preset.id === presetInModifica.id) {
          return {
            ...preset,
            nome: nomePreset,
            persone: persone.map(({id, nome, quantitaCruda}) => ({
              id,
              nome,
              quantitaCruda
            }))
          };
        }
        return preset;
      });
      
      setPresets(nuoviPresets);
      localStorage.setItem('pastadivider_presets', JSON.stringify(nuoviPresets));
      setPresetInModifica(null);
    } else {
      // Crea nuovo preset
      const nuovoPreset: Preset = {
        id: crypto.randomUUID(),
        nome: nomePreset,
        persone: persone.map(({id, nome, quantitaCruda}) => ({
          id,
          nome,
          quantitaCruda
        }))
      };

      const nuoviPresets = [...presets, nuovoPreset];
      setPresets(nuoviPresets);
      localStorage.setItem('pastadivider_presets', JSON.stringify(nuoviPresets));
    }
    
    setNomePreset('');
    setPresetSalvato(true);
    setTimeout(() => setPresetSalvato(false), 2000);
  };

  const modificaPreset = (preset: Preset) => {
    setPresetInModifica(preset);
    setNomePreset(preset.nome);
    
    const nuovePersone = preset.persone.map(persona => ({
      ...persona,
      id: `${idBase}-${Math.random()}`,
      quantitaCotta: 0
    }));
    
    setPersone(nuovePersone);
    setRisultatiCalcolati(false);
  };

  const caricaPreset = (preset: Preset) => {
    const nuovePersone = preset.persone.map(persona => ({
      ...persona,
      id: `${idBase}-${Math.random()}`,
      quantitaCotta: 0
    }));
    
    setPersone(nuovePersone);
    setRisultatiCalcolati(false);
    setShowPresetsPanel(false);
  };

  const eliminaPreset = (id: string) => {
    const nuoviPresets = presets.filter(preset => preset.id !== id);
    setPresets(nuoviPresets);
    localStorage.setItem('pastadivider_presets', JSON.stringify(nuoviPresets));
  };

  const totaleCrudo = persone.reduce((sum, persona) => sum + (persona.quantitaCruda || 0), 0);
  const inputsValidi = pesoTotale > 0 && persone.every(p => p.quantitaCruda > 0);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true);
    }
  }, []);

  if (!isMounted) return null;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 spaghetti-pattern">
      <div className="max-w-md w-full mx-auto pb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            Pasta Divider
          </h1>
        </div>
        <p className="text-gray-600 text-center mb-6">Dividi equamente la pasta tra tutti i commensali</p>
        
        {mostraInfo && (
          <div className="mb-6 p-4 bg-secondary rounded-lg border border-secondary text-sm">
            <div className="flex items-start gap-2">
              <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-primary-900 mb-1 font-medium">Come funziona?</p>
                <p className="text-accent-foreground">
                  Inserisci le persone e quanta pasta cruda mangiano, poi pesa la pasta cotta e il sistema calcolerà 
                  quanto ciascuno dovrà mangiare.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between mb-3 gap-2">
          <div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPresetsPanel(!showPresetsPanel)}
              className="relative"
            >
              <Bookmark className="h-4 w-4 mr-1" /> 
              Preset
              {presets.length > 0 && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {presets.length}
                </Badge>
              )}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={salvaDati}
                    className={salvataggioConfermato ? "bg-green-50 text-green-600 border-green-200" : ""}
                  >
                    {salvataggioConfermato ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" /> Salvato
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" /> Salva
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Salva i dati inseriti per ritrovarli alla prossima visita</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-1" /> Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] w-full md:max-w-md bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Sei sicuro di voler resettare?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questa azione cancellerà tutte le persone e i dati inseriti, e non può essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="mt-0">Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={resetTutto}>Conferma Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        {showPresetsPanel && (
          <Card className="mb-5 shadow-md border-border">
            <CardHeader className="bg-secondary/50 rounded-t-lg border-b border-border py-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">I tuoi preset</CardTitle>
              </div>
              <CardDescription>Salva e carica configurazioni predefinite</CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              <div className="mb-3 p-2 bg-muted/30 rounded-md">
                <div className="flex gap-2 mb-2">
                  <Input 
                    placeholder="Nome preset" 
                    value={nomePreset}
                    onChange={(e) => setNomePreset(e.target.value)}
                    className="text-sm"
                  />
                  <Button 
                    size="sm" 
                    variant={presetSalvato ? "secondary" : "default"} 
                    onClick={salvaPreset}
                    disabled={!nomePreset || persone.length === 0}
                    className="whitespace-nowrap"
                  >
                    {presetSalvato ? <CheckCircle className="h-4 w-4 mr-1" /> : <Star className="h-4 w-4 mr-1" />}
                    {presetSalvato ? 'Salvato!' : presetInModifica ? 'Aggiorna' : 'Salva preset'}
                  </Button>
                </div>
                <div className="flex justify-between">
                  <p className="text-xs text-muted-foreground">
                    {presetInModifica ? 'Modifica il preset selezionato' : 'Salva la configurazione attuale come preset'}
                  </p>
                  {presetInModifica && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 text-xs py-0 px-2 text-muted-foreground" 
                      onClick={() => {
                        setPresetInModifica(null);
                        setNomePreset('');
                      }}
                    >
                      Annulla modifica
                    </Button>
                  )}
                </div>
              </div>

              {presets.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground text-sm">
                  Non hai ancora salvato preset
                </div>
              ) : (
                <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                  {presets.map((preset) => (
                    <div 
                      key={preset.id} 
                      className={`flex items-center justify-between p-2 rounded-md ${
                        presetInModifica?.id === preset.id 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-accent/50'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{preset.nome}</div>
                        <div className="text-xs text-muted-foreground flex gap-1">
                          <User className="h-3 w-3" /> {preset.persone.length} persone
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => caricaPreset(preset)}
                          disabled={presetInModifica?.id === preset.id}
                        >
                          Carica
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => modificaPreset(preset)}
                          disabled={presetInModifica?.id === preset.id}
                          className="text-primary"
                        >
                          Modifica
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-700" 
                          onClick={() => eliminaPreset(preset.id)}
                          disabled={presetInModifica?.id === preset.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        <Card className="mb-6 shadow-md border-border">
          <CardHeader className="bg-secondary/50 rounded-t-lg border-b border-border">
            <div className="flex justify-between items-center">
              <CardTitle>Persone</CardTitle>
              <Badge variant="outline" className="ml-2 bg-background">
                <User className="h-3.5 w-3.5 mr-1" />
                {persone.length}
              </Badge>
            </div>
            <CardDescription>Aggiungi le persone e la quantità di pasta cruda che mangiano</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div id="persone-container">
              <div className="space-y-4">
                {persone.map((persona) => (
                  <PersonaInput 
                    key={persona.id} 
                    persona={persona} 
                    onChange={modificaPersona} 
                    onDelete={rimuoviPersona} 
                    onIncremento={incrementaQuantita}
                    isLastSingle={persona.id === persone[0]?.id && persone.length === 1}
                  />
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4 border-dashed" 
                onClick={aggiungiPersona}
              >
                <Plus className="mr-2 h-4 w-4" /> Aggiungi persona
              </Button>
            </div>
          </CardContent>
          <CardFooter className="justify-end border-t px-6 py-3 bg-muted/30">
            <div className="text-sm">
              Totale pasta cruda: <span className="font-bold text-primary">{totaleCrudo}g</span>
            </div>
          </CardFooter>
        </Card>

        <Card className="mb-6 shadow-md border-border">
          <CardHeader className="bg-secondary/50 rounded-t-lg border-b border-border">
            <CardTitle>Pasta cotta</CardTitle>
            <CardDescription>Inserisci il peso totale della pasta dopo la cottura</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="peso-totale" className="flex items-center gap-1">
                  Peso totale (g)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Pesa tutta la pasta cotta con una bilancia
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="peso-totale" 
                      type="number" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="1"
                      className="pl-9 text-lg"
                      placeholder="Peso in grammi" 
                      value={pesoTotale || ''}
                      onChange={(e) => {
                        setPesoTotale(Number(e.target.value));
                        setRisultatiCalcolati(false);
                      }}
                    />
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => setPesoTotale(Math.max(0, (pesoTotale || 0) - 10))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => setPesoTotale((pesoTotale || 0) + 10)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Pulsanti di scelta rapida */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {[500, 600, 700, 800, 900].map((peso) => (
                    <Button 
                      key={peso}
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className={`text-xs flex-1 min-w-12 py-1 h-auto ${pesoTotale === peso ? 'bg-secondary border-primary' : ''}`}
                      onClick={() => {
                        setPesoTotale(peso);
                        setRisultatiCalcolati(false);
                      }}
                    >
                      {peso}g
                    </Button>
                  ))}
                </div>
              </div>
              <Button 
                className="w-full mt-2" 
                onClick={calcolaDivisione}
                disabled={!inputsValidi}
              >
                Calcola divisione
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="risultati" className="shadow-md border-border">
          <CardHeader className={`rounded-t-lg border-b border-border ${risultatiCalcolati ? 'bg-secondary/50' : 'bg-muted/30'}`}>
            <CardTitle>Risultati</CardTitle>
            <CardDescription>Ecco quanto deve mangiare ciascuna persona</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {!risultatiCalcolati ? (
                <div className="text-center p-8 text-gray-500">
                  Inserisci i dati e calcola per vedere i risultati
                </div>
              ) : (
                <div className="space-y-4">
                  {persone.map((persona) => (
                    <div 
                      key={persona.id} 
                      className="flex justify-between items-center p-3 bg-accent rounded-md hover:bg-accent/80 transition-colors"
                    >
                      <div className="font-medium">
                        {persona.nome || 'Persona senza nome'}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Cruda: {persona.quantitaCruda}g</div>
                        <div className="font-bold text-primary text-lg">{persona.quantitaCotta}g</div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center text-sm text-gray-500 mt-2">
                    Fattore di crescita: <span className="font-semibold">{(pesoTotale / totaleCrudo).toFixed(2)}x</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          {risultatiCalcolati && (
            <CardFooter className="justify-center pt-1 pb-4">
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2"
                onClick={copiaRisultati}
              >
                {risultatiCopiati ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Copiato!
                  </>
                ) : (
                  <>Copia risultati</>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </main>
  )
}

type PersonaInputProps = {
  persona: Persona;
  onChange: (id: string, campo: 'nome' | 'quantitaCruda', valore: string | number) => void;
  onDelete: (id: string) => void;
  onIncremento: (id: string, incremento: number) => void;
  isLastSingle: boolean;
}

function PersonaInput({ persona, onChange, onDelete, onIncremento, isLastSingle }: PersonaInputProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="grid gap-2 w-full sm:flex-1">
        <Label htmlFor={`nome-${persona.id}`}>Nome</Label>
        <Input 
          id={`nome-${persona.id}`} 
          placeholder="Nome persona" 
          value={persona.nome}
          onChange={(e) => onChange(persona.id, 'nome', e.target.value)}
        />
      </div>
      <div className="flex items-end gap-2 w-full sm:flex-1">
        <div className="grid gap-2 flex-grow">
          <Label htmlFor={`quantita-${persona.id}`}>Quantità</Label>
          <Input 
            id={`quantita-${persona.id}`} 
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="1"
            className="text-center"
            placeholder="80" 
            value={persona.quantitaCruda || ''}
            onChange={(e) => onChange(persona.id, 'quantitaCruda', Number(e.target.value))}
          />
        </div>
        
        <div className="flex gap-1 mb-0.5">
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => onIncremento(persona.id, -10)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => onIncremento(persona.id, 10)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500"
            onClick={() => onDelete(persona.id)}
            disabled={isLastSingle}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
