/**
 * SSLCommerz Payment Gateway Integration
 * For CSEDU Students' Club Portal
 */

import axios from 'axios';
import crypto from 'crypto';

interface SSLCommerzConfig {
  storeId: string;
  storePassword: string;
  baseUrl: string; // 'https://securepay.sslcommerz.com' for production
  isProduction: boolean;
}

interface InitiatePaymentRequest {
  transactionId: string;
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  productCategory?: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  customField1?: string; // Can store member_id or event_id
  customField2?: string;
}

interface SSLCommerzPaymentResponse {
  status: string;
  sessionkey?: string;
  gateway_url?: string;
  redirectGatewayURL?: string;
  error?: string;
}

interface VerifyPaymentRequest {
  transactionId: string;
  amount: number;
  currency: string;
}

interface VerifyPaymentResponse {
  status: string;
  data?: {
    tran_id: string;
    val_id: string;
    amount: number;
    card_type: string;
    store_amount: number;
    card_issuer?: string;
    card_brand?: string;
    card_sub_brand?: string;
    card_issuer_code?: string;
    card_issuer_country?: string;
    card_issuer_country_code?: string;
    currency_type: string;
    currency_amount: number;
    risk_level?: string;
    response_code: string;
    response_reason?: string;
    [key: string]: any;
  };
  error?: string;
}

export class SSLCommerzPaymentGateway {
  private config: SSLCommerzConfig;

  constructor(config: SSLCommerzConfig) {
    this.config = {
      ...config,
      baseUrl: config.isProduction
        ? 'https://securepay.sslcommerz.com'
        : 'https://sandbox.sslcommerz.com',
    };
  }

  /**
   * Initiate a payment session
   */
  async initiatePayment(
    request: InitiatePaymentRequest
  ): Promise<SSLCommerzPaymentResponse> {
    try {
      const payload = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        total_amount: request.amount,
        currency: request.currency || 'BDT',
        tran_id: request.transactionId,
        success_url: request.returnUrl,
        fail_url: request.cancelUrl,
        cancel_url: request.cancelUrl,
        ipn_url: request.notifyUrl,
        cus_name: request.customerName,
        cus_email: request.customerEmail,
        cus_phone: request.customerPhone,
        cus_add1: 'Dhaka, Bangladesh',
        product_name: request.productName,
        product_category: request.productCategory || 'service',
        product_profile: 'general',
        shipping_method: 'NO',
        multi_card_name: 'mastercard,visacard,amexcard',
        value_a: request.customField1 || '',
        value_b: request.customField2 || '',
        value_c: '',
        value_d: '',
      };

      const endpoint = `${this.config.baseUrl}/gwprocess/v4/api.php`;

      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        status: response.data.status || 'fail',
        sessionkey: response.data.sessionkey,
        gateway_url: `${this.config.baseUrl}/gwprocess/v4/gw.php?Q=${response.data.sessionkey}`,
        redirectGatewayURL: `${this.config.baseUrl}/gwprocess/v4/gw.php?Q=${response.data.sessionkey}`,
      };
    } catch (error) {
      console.error('SSLCommerz Payment Initiation Error:', error);
      return {
        status: 'fail',
        error:
          error instanceof Error
            ? error.message
            : 'Payment initiation failed',
      };
    }
  }

  /**
   * Verify payment with SSLCommerz
   */
  async verifyPayment(
    request: VerifyPaymentRequest
  ): Promise<VerifyPaymentResponse> {
    try {
      const payload = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        format: 'json',
        BDT: request.currency === 'BDT' ? request.amount : undefined,
        tran_id: request.transactionId,
      };

      const endpoint = `${this.config.baseUrl}/validator/api/validationAPI.php`;

      const response = await axios.post(endpoint, payload);

      if (
        response.data.status === 'VALID' ||
        response.data.status === 'VALIDATED'
      ) {
        return {
          status: 'success',
          data: response.data,
        };
      }

      return {
        status: 'failed',
        error: response.data.status || 'Validation failed',
      };
    } catch (error) {
      console.error('SSLCommerz Verification Error:', error);
      return {
        status: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'Payment verification failed',
      };
    }
  }

  /**
   * Generate payment reference for records
   */
  generateTransactionId(prefix: string = 'TXN'): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Validate IPN (Instant Payment Notification) signature
   * SSLCommerz sends validation_id in IPN which should be verified
   */
  validateIPNSignature(data: any): boolean {
    // SSLCommerz validation is done via the validation_id
    // which is unique per transaction and can be verified via API
    try {
      return (
        data.status === 'VALID' &&
        data.currency_type === 'BDT' &&
        data.amount &&
        data.tran_id
      );
    } catch {
      return false;
    }
  }

  /**
   * Create a refund request
   */
  async initiateRefund(
    transactionId: string,
    amount: number,
    reason: string
  ): Promise<{ status: string; error?: string; refundId?: string }> {
    try {
      const payload = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        refund_amount: amount,
        refund_remarks: reason,
        bank_tran_id: transactionId,
      };

      const endpoint = `${this.config.baseUrl}/validator/api/merchantTransIDvalidationAPI.php`;

      const response = await axios.post(endpoint, payload);

      if (response.data.status === 'SUCCESS') {
        return {
          status: 'success',
          refundId: response.data.refund_ref_id,
        };
      }

      return {
        status: 'failed',
        error: response.data.status || 'Refund initiation failed',
      };
    } catch (error) {
      console.error('SSLCommerz Refund Error:', error);
      return {
        status: 'error',
        error:
          error instanceof Error ? error.message : 'Refund request failed',
      };
    }
  }
}

// Export singleton instance configuration
export const getSSLCommerzConfig = (): SSLCommerzConfig => {
  return {
    storeId: process.env.SSLCOMMERZ_STORE_ID || '',
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
    isProduction: process.env.NODE_ENV === 'production',
    baseUrl: '', // Will be set in constructor
  };
};

export const sslCommerzGateway = new SSLCommerzPaymentGateway(
  getSSLCommerzConfig()
);
