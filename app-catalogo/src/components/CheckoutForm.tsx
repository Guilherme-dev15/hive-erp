 
import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/format';

interface CheckoutFormProps {
  amount: number;      // Valor total da compra
  storeId: string;     // ID da loja (para saber quem recebe)
  onSuccess: () => void; // O que fazer quando der certo
  onCancel: () => void;  // O que fazer se cancelar
}

export function CheckoutForm({ amount, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    // Verifica se houve redirecionamento de pagamento (ex: 3D Secure)
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) return;

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Pagamento realizado com sucesso!");
          onSuccess();
          break;
        case "processing":
          setMessage("Seu pagamento está sendo processado.");
          break;
        case "requires_payment_method":
          setMessage("Pagamento não realizado, tente novamente.");
          break;
        default:
          setMessage("Algo deu errado.");
          break;
      }
    });
  }, [onSuccess, stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Redireciona para cá após pagamento (importante para mobile banking)
        return_url: window.location.href,
      },
      redirect: 'if_required' // Tenta não redirecionar se não precisar
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Erro no cartão");
      } else {
        setMessage("Ocorreu um erro inesperado.");
      }
      toast.error(error.message || "Erro no pagamento");
    } else {
      // Sucesso sem redirect!
      toast.success("Pagamento Aprovado!");
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm mt-4">
      <div className="flex items-center gap-2 mb-4 text-gray-700 font-bold border-b pb-2">
        <Lock size={18} className="text-green-600" />
        Pagamento Seguro ({formatCurrency(amount)})
      </div>
      
      {/* O Stripe injeta o formulário aqui */}
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      
      {/* Mensagens de erro */}
      {message && <div className="mt-2 text-sm text-red-500 font-medium">{message}</div>}

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading || !stripe || !elements}
          className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          disabled={isLoading || !stripe || !elements}
          className="flex-1 py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Pagar Agora"}
        </button>
      </div>
    </form>
  );
}