import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";

interface BasketExistsCheckProps {
  flupsyId: number | null;
  basketNumber: number | null;
  basketId?: number | null;
  onValidationChange: (isValid: boolean) => void;
}

export default function BasketExistsCheck({ 
  flupsyId, 
  basketNumber,
  basketId = null,
  onValidationChange 
}: BasketExistsCheckProps) {
  const [error, setError] = useState<string | null>(null);
  const [warningOnly, setWarningOnly] = useState<boolean>(false);
  
  const basketExistsQuery = useQuery<any>({
    queryKey: ['/api/baskets/check-exists', flupsyId, basketNumber],
    queryFn: async () => {
      if (!flupsyId || !basketNumber) return { exists: false };
      const response = await fetch(`/api/baskets/check-exists?flupsyId=${flupsyId}&physicalNumber=${basketNumber}`);
      if (!response.ok) throw new Error("Errore nella verifica dell'esistenza della cesta");
      return response.json();
    },
    enabled: !!flupsyId && !!basketNumber,
  });
  
  useEffect(() => {
    if (!flupsyId || !basketNumber) {
      setError(null);
      setWarningOnly(false);
      onValidationChange(true);
      return;
    }
    
    if (basketExistsQuery.isLoading) return;
    
    if (basketExistsQuery.isError) {
      setError("Errore durante la verifica dell'esistenza della cesta. Controllare manualmente.");
      setWarningOnly(true);
      onValidationChange(true);
      return;
    }
    
    if (basketExistsQuery.data) {
      if (basketExistsQuery.data.exists) {
        const foundBasket = basketExistsQuery.data.basket;

        // In modalità modifica: se il cestello trovato è lo stesso che stiamo modificando, nessun conflitto
        if (basketId && foundBasket && foundBasket.id === basketId) {
          setError(null);
          setWarningOnly(false);
          onValidationChange(true);
          return;
        }

        const basketState = foundBasket?.state;
        const message = foundBasket
          ? `Esiste già una cesta #${foundBasket.physicalNumber} in questo FLUPSY (stato: ${basketState === 'active' ? 'attiva' : 'disponibile'})`
          : "Esiste già una cesta con questo numero in questo FLUPSY";

        setError(message);

        if (basketState === "available") {
          setWarningOnly(true);
          onValidationChange(true);
        } else {
          setWarningOnly(false);
          onValidationChange(false);
        }
      } else {
        setError(null);
        setWarningOnly(false);
        onValidationChange(true);
      }
    }
  }, [flupsyId, basketNumber, basketId, basketExistsQuery.data, basketExistsQuery.isLoading, basketExistsQuery.isError, onValidationChange]);
  
  if (!error) return null;
  
  return (
    <Alert 
      variant={warningOnly ? "default" : "destructive"} 
      className={`mt-2 mb-4 ${warningOnly ? "border-amber-400" : ""}`} 
    >
      {warningOnly ? <AlertTriangle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      <AlertTitle>{warningOnly ? "Attenzione" : "Errore"}</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
