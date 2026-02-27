import { apiService } from '../api';
import { Payment, Ticket } from '../../types';
import { PAYMENT_METHODS, CURRENCIES } from '../../constants';

export interface PaymentRequest {
  eventId: string;
  quantity: number;
  method: 'mtn_momo' | 'airtel_money' | 'stripe' | 'paypal';
  currency: 'CDF' | 'USD' | 'EUR';
  phoneNumber?: string; // Pour Mobile Money
  email?: string; // Pour Stripe/PayPal
}

export interface PaymentResponse {
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  method: string;
  transactionId?: string;
  paymentUrl?: string; // Pour les paiements en ligne
  qrCode?: string; // Pour Mobile Money
  instructions?: string; // Instructions pour l'utilisateur
  expiresAt: string;
}

export interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  currency: string;
  method: string;
  transactionId?: string;
  paidAt?: string;
  failureReason?: string;
  tickets?: Ticket[];
}

export interface MobileMoneyPayment {
  phoneNumber: string;
  operator: 'mtn' | 'airtel' | 'orange' | 'vodacom';
  amount: number;
  currency: string;
  qrCode: string;
  instructions: string;
  expiresAt: string;
}

class PaymentService {
  // Créer un paiement (correspond à POST /api/payments/create)
  async createPayment(paymentRequest: PaymentRequest): Promise<{
    payment: {
      id: string;
      paymentId: string;
      amount: number;
      currency: string;
      method: string;
      status: string;
      expiresAt: string;
    };
  }> {
    try {
      const { phoneNumber, email, ...rest } = paymentRequest;
      const paymentDetails: any = {};
      
      if (phoneNumber) {
        paymentDetails.phoneNumber = phoneNumber;
      }
      if (email) {
        paymentDetails.email = email;
      }

      const response = await apiService.post<{
        payment: {
          id: string;
          paymentId: string;
          amount: number;
          currency: string;
          method: string;
          status: string;
          expiresAt: string;
        };
      }>(
        '/payments/create',
        {
          ...rest,
          paymentDetails,
        }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la création du paiement');
      }
    } catch (error) {
      console.error('Erreur createPayment:', error);
      throw error;
    }
  }

  // Traiter un paiement (correspond à POST /api/payments/:paymentId/process)
  async processPayment(paymentId: string, paymentData: any): Promise<PaymentResponse> {
    try {
      const response = await apiService.post<PaymentResponse>(
        `/payments/${paymentId}/process`,
        { paymentData }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors du traitement du paiement');
      }
    } catch (error) {
      console.error('Erreur processPayment:', error);
      throw error;
    }
  }

  // Initier un paiement (wrapper qui combine create + process)
  async initiatePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 1. Créer le paiement
      const createResponse = await this.createPayment(paymentRequest);
      const paymentId = createResponse.payment.id;

      // 2. Préparer les données de paiement selon la méthode
      const paymentData: any = {};
      if (paymentRequest.phoneNumber) {
        paymentData.phoneNumber = paymentRequest.phoneNumber;
        paymentData.operator = paymentRequest.method === 'mtn_momo' ? 'mtn' : 
                              paymentRequest.method === 'airtel_money' ? 'airtel' : 'mtn';
      }
      if (paymentRequest.email) {
        paymentData.email = paymentRequest.email;
      }

      // 3. Traiter le paiement
      const processResponse = await this.processPayment(paymentId, paymentData);
      
      return {
        ...processResponse,
        paymentId: createResponse.payment.paymentId,
      };
    } catch (error) {
      console.error('Erreur initiatePayment:', error);
      throw error;
    }
  }

  // Vérifier le statut d'un paiement (utilise GET /api/payments/:paymentId)
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await apiService.get<{ payment: Payment }>(`/payments/${paymentId}`);

      if (response.success && response.data) {
        const payment = response.data.payment;
        return {
          paymentId: payment.id,
          status: payment.status as any,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          transactionId: payment.transactionId,
          paidAt: payment.paidAt,
          failureReason: payment.failureReason,
          tickets: payment.tickets || [],
        };
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la vérification du statut');
      }
    } catch (error) {
      console.error('Erreur checkPaymentStatus:', error);
      throw error;
    }
  }

  // Confirmer un paiement Mobile Money
  async confirmMobileMoneyPayment(paymentId: string, transactionId: string): Promise<PaymentStatus> {
    try {
      const response = await apiService.post<PaymentStatus>(
        `/payments/${paymentId}/confirm`,
        { transactionId }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la confirmation du paiement');
      }
    } catch (error) {
      console.error('Erreur confirmMobileMoneyPayment:', error);
      throw error;
    }
  }

  // Annuler un paiement
  async cancelPayment(paymentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `/payments/${paymentId}/cancel`
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de l\'annulation du paiement');
      }
    } catch (error) {
      console.error('Erreur cancelPayment:', error);
      throw error;
    }
  }

  // Obtenir l'historique des paiements
  async getPaymentHistory(filters: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<{
    payments: Payment[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await apiService.get<{
        payments: Payment[];
        pagination: {
          current: number;
          pages: number;
          total: number;
        };
      }>(`/payments/history?${params.toString()}`);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération de l\'historique');
      }
    } catch (error) {
      console.error('Erreur getPaymentHistory:', error);
      throw error;
    }
  }

  // Obtenir les détails d'un paiement
  async getPaymentDetails(paymentId: string): Promise<Payment> {
    try {
      const response = await apiService.get<{ payment: Payment }>(`/payments/${paymentId}`);

      if (response.success && response.data) {
        return response.data.payment;
      } else {
        throw new Error(response.error?.message || 'Paiement non trouvé');
      }
    } catch (error) {
      console.error('Erreur getPaymentDetails:', error);
      throw error;
    }
  }

  // Demander un remboursement
  async requestRefund(paymentId: string, reason: string): Promise<{
    success: boolean;
    message: string;
    refundId?: string;
  }> {
    try {
      const response = await apiService.post<{
        success: boolean;
        message: string;
        refundId?: string;
      }>(`/payments/${paymentId}/refund`, { reason });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la demande de remboursement');
      }
    } catch (error) {
      console.error('Erreur requestRefund:', error);
      throw error;
    }
  }

  // Obtenir les méthodes de paiement disponibles
  getAvailablePaymentMethods(): Array<{
    value: string;
    label: string;
    icon: string;
    isAvailable: boolean;
  }> {
    return PAYMENT_METHODS.map(method => ({
      ...method,
      isAvailable: this.isPaymentMethodAvailable(method.value),
    }));
  }

  // Vérifier si une méthode de paiement est disponible
  private isPaymentMethodAvailable(method: string): boolean {
    // Logique pour vérifier la disponibilité selon la région, l'opérateur, etc.
    switch (method) {
      case 'mtn_momo':
        return true; // MTN est disponible au Congo
      case 'airtel_money':
        return true; // Airtel est disponible au Congo
      case 'stripe':
        return true; // Stripe est disponible internationalement
      case 'paypal':
        return true; // PayPal est disponible internationalement
      default:
        return false;
    }
  }

  // Calculer les frais de paiement
  async calculatePaymentFees(amount: number, method: string, currency: string): Promise<{
    amount: number;
    processingFee: number;
    platformFee: number;
    totalFees: number;
    netAmount: number;
  }> {
    try {
      const response = await apiService.post<{
        amount: number;
        processingFee: number;
        platformFee: number;
        totalFees: number;
        netAmount: number;
      }>('/payments/calculate-fees', {
        amount,
        method,
        currency,
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors du calcul des frais');
      }
    } catch (error) {
      console.error('Erreur calculatePaymentFees:', error);
      throw error;
    }
  }

  // Valider un numéro de téléphone pour Mobile Money
  validatePhoneNumber(phoneNumber: string, operator: 'mtn' | 'airtel'): boolean {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    switch (operator) {
      case 'mtn':
        // MTN Congo: +243 81, 82, 84, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99
        return /^(243|0)?(81|82|84|89|90|91|92|93|94|95|96|97|98|99)\d{7}$/.test(cleanNumber);
      case 'airtel':
        // Airtel Congo: +243 80, 85, 86, 87, 88
        return /^(243|0)?(80|85|86|87|88)\d{7}$/.test(cleanNumber);
      default:
        return false;
    }
  }

  // Formater un numéro de téléphone
  formatPhoneNumber(phoneNumber: string): string {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    if (cleanNumber.startsWith('243')) {
      return `+${cleanNumber}`;
    } else if (cleanNumber.startsWith('0')) {
      return `+243${cleanNumber.substring(1)}`;
    } else {
      return `+243${cleanNumber}`;
    }
  }

  // Obtenir le symbole de devise
  getCurrencySymbol(currency: string): string {
    return CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol || currency;
  }

  // Formater un montant
  formatAmount(amount: number, currency: string): string {
    const symbol = this.getCurrencySymbol(currency);
    return `${symbol} ${amount.toLocaleString()}`;
  }

  // Obtenir les instructions de paiement Mobile Money
  getMobileMoneyInstructions(operator: 'mtn' | 'airtel'): string[] {
    switch (operator) {
      case 'mtn':
        return [
          '1. Ouvrez l\'application MTN Mobile Money',
          '2. Sélectionnez "Payer"',
          '3. Scannez le QR code ou saisissez le numéro',
          '4. Confirmez le montant',
          '5. Entrez votre code PIN',
          '6. Confirmez la transaction',
        ];
      case 'airtel':
        return [
          '1. Ouvrez l\'application Airtel Money',
          '2. Sélectionnez "Payer"',
          '3. Scannez le QR code ou saisissez le numéro',
          '4. Confirmez le montant',
          '5. Entrez votre code PIN',
          '6. Confirmez la transaction',
        ];
      default:
        return [];
    }
  }

  // Vérifier le statut d'un paiement en temps réel
  async pollPaymentStatus(
    paymentId: string,
    onStatusUpdate: (status: PaymentStatus) => void,
    interval = 5000,
    maxAttempts = 60
  ): Promise<PaymentStatus> {
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const status = await this.checkPaymentStatus(paymentId);
          
          onStatusUpdate(status);
          
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
            resolve(status);
            return;
          }
          
          if (attempts >= maxAttempts) {
            reject(new Error('Timeout: Le paiement prend trop de temps'));
            return;
          }
          
          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }
}

// Instance singleton
export const paymentService = new PaymentService();
export default paymentService;

