import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
  Logger,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { SupabaseService } from '../supabase/supabase.service';
import { euroCountries, dollarCountries } from './constants/country.constants';
import { countryLocaleMap } from './constants/locale.constants';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { SubscribeDto } from './dto/subscribe.dto';

import type { SupabaseClient } from '@supabase/supabase-js';

type SubscriptionPrice = Pick<Stripe.Price, 'id' | 'product' | 'unit_amount_decimal' | 'currency' | 'tax_behavior'> & {
  unit_amount: number;
};

type SubscriptionPlan = Pick<Stripe.Product, 'id' | 'name' | 'description' | 'metadata' | 'marketing_features'> & {
  price: SubscriptionPrice;
};

type Subscriptions = {
  monthly: SubscriptionPlan[];
  yearly: SubscriptionPlan[];
};

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

type CancellationResponse = {
  message: string;
  subscriptionId: string;
  refund?: string;
  current_period_end?: number | null;
};

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SERVER_KEY')!, {
      apiVersion: '2024-04-10',
    });
  }

  async createCustomer(userId: string) {
    const client = this.getSupabaseClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client not available');
    }

    const { data: parent, error } = await client.from('parents').select(`*`).eq('supabase_id', userId).single();

    if (error || !parent) {
      throw new InternalServerErrorException('Failed to fetch parent data');
    }

    if (parent.stripe_customer_id) {
      this.logger.log('Customer already exists');
      return { success: true };
    }

    try {
      const customer = await this.stripe.customers.create({
        email: parent.email,
        name: parent.name,
      });

      if (!customer.id) {
        throw new BadRequestException('Failed to create Stripe customer');
      }

      const { data, error: updateError } = await client
        .from('parents')
        .update({ stripe_customer_id: customer.id })
        .eq('uuid', parent.uuid)
        .select();

      if (updateError || !data) {
        throw new InternalServerErrorException('Failed to update parent with customer ID');
      }
      this.logger.log('New customer created');
      return { success: true, data };
    } catch (error) {
      this.logger.error('Stripe customer creation error:', error);
      throw new InternalServerErrorException('Something went wrong creating customer');
    }
  }

  async createPortalSession(customerId: string, userId: string) {
    if (!customerId) {
      throw new BadRequestException('Customer ID is required');
    }
    const client = this.getSupabaseClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client not available');
    }

    const { data: parent, error: fetchError } = await client
      .from('parents')
      .select('stripe_customer_id')
      .eq('supabase_id', userId)
      .single();

    if (fetchError || !parent) {
      throw new InternalServerErrorException('Failed to fetch user customer ID');
    }

    if (!parent.stripe_customer_id) {
      throw new ForbiddenException('No Stripe customer found. Create one first via /payments/customer.');
    }

    if (parent.stripe_customer_id !== customerId) {
      throw new ForbiddenException('Unauthorized access to customer');
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${this.configService.get('BASE_URL')}/parent/settings/my-plan`,
      });
      this.logger.log('Created billing portal session');
      return { url: session.url };
    } catch (error) {
      this.logger.error('Error creating customer portal session:', error);
      throw new InternalServerErrorException('Could not create customer portal session');
    }
  }

  async subscribe(dto: SubscribeDto) {
    const client = this.getSupabaseClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client not available');
    }

    const baseReturnUrl = dto.returnUrl
      ? `${this.configService.get('BASE_URL')}${dto.returnUrl}`
      : `${this.configService.get('BASE_URL')}/parent/settings/subscription`;
    const cancelBaseUrl = dto.returnUrl
      ? `${this.configService.get('BASE_URL')}${dto.returnUrl}`
      : `${this.configService.get('BASE_URL')}`;
    const successUrl = new URL(baseReturnUrl);
    const cancelUrl = new URL(cancelBaseUrl);

    successUrl.searchParams.append('payment_status', 'success');
    successUrl.searchParams.append('plan', dto.plan_name);
    cancelUrl.searchParams.append('payment_status', 'cancel');

    const { data, error } = await client
      .from('parents')
      .select('countries (*)')
      .eq('stripe_customer_id', dto.customer_id)
      .single<{ countries: { country_code: string } }>();

    if (error) {
      this.logger.error('Failed to fetch country information for Stripe customer ID', { error });
    }

    const countryCode = data?.countries?.country_code;
    const locale = countryCode ? countryLocaleMap[countryCode] || countryLocaleMap.DEFAULT : countryLocaleMap.DEFAULT;

    // Build Stripe checkout session with promotion codes enabled
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: dto.customer_id,
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      line_items: [
        {
          price: dto.price,
          quantity: dto.students.length,
        },
        ...(dto.donation_amount && dto.donation_amount > 0
          ? [
              {
                price_data: {
                  currency: dto.currency,
                  product_data: {
                    name: 'Donation',
                    description: dto.is_recurring_donation ? 'Recurring Donation' : 'One-Time Donation',
                  },
                  unit_amount: dto.donation_amount * 100,
                  ...(dto.is_recurring_donation && {
                    recurring: {
                      interval: 'week',
                      interval_count: 4,
                    },
                  }),
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      mode: 'subscription',
      allow_promotion_codes: true, // Let Stripe handle promo codes
      metadata: {
        students: JSON.stringify(dto.students),
        user_id: dto.user_id,
        plan_type: dto.plan_type,
        ...(dto.donation_amount &&
          dto.donation_amount > 0 && {
            donation_amount: dto.donation_amount,
            donation_type: dto.is_recurring_donation ? 'recurring' : 'one-time',
            donate_to: dto.donate_to,
          }),
      },
      subscription_data: {
        metadata: {
          donation_amount: dto.donation_amount || 0,
          donation_type: dto.is_recurring_donation || false,
          donate_to: dto.donate_to,
          currency: dto.currency,
        },
      },
      automatic_tax: { enabled: true },
      customer_update: {
        address: 'auto',
      },
      locale,
    };

    try {
      const session = await this.stripe.checkout.sessions.create(sessionConfig);
      return { link: session.url };
    } catch (error) {
      this.logger.error('Error creating checkout session:', error);
      throw new InternalServerErrorException('Could not create checkout session. Please try again later.');
    }
  }

  async getSubscriptionPlans(user: { id: string; email?: string | null }) {
    try {
      const client = this.getSupabaseClient();
      let defaultCurrency: 'USD' | 'EUR' = 'USD';
      let countryCode = 'US';

      if (client && user?.id) {
        const { data: parentData, error: parentError } = await client
          .from('parents')
          .select('countries ( country_code )')
          .eq('supabase_id', user.id)
          .maybeSingle<{ countries: { country_code: string } | null }>();

        if (!parentError && parentData?.countries?.country_code) {
          countryCode = parentData.countries.country_code.toUpperCase();
          defaultCurrency = this.getDefaultCurrency(countryCode);
        } else if (parentError) {
          this.logger.warn('Failed to resolve country for subscription plans', parentError);
        }
      }

      const [{ data: products }, { data: prices }] = await Promise.all([
        this.stripe.products.list({ active: true }),
        this.stripe.prices.list({ active: true, limit: 100 }),
      ]);

      const priceMap = new Map<string, Stripe.Price>();
      prices.forEach((price) => {
        const productId = typeof price.product === 'string' ? price.product : price.product?.id || '';
        const key = `${productId}:${price.nickname || ''}`;
        priceMap.set(key, price);
      });

      const findPrice = (productId: string, type: 'monthly' | 'yearly') => {
        const nickname =
          type === 'monthly'
            ? `monthly_subscription${defaultCurrency === 'USD' ? '_usd' : ''}`
            : `annual_subscription${defaultCurrency === 'USD' ? '_usd' : ''}`;
        return priceMap.get(`${productId}:${nickname}`);
      };

      const processSubscriptions = async (type: 'monthly' | 'yearly') => {
        const productList = type === 'monthly' ? products.slice().reverse() : products;

        const mapped = await Promise.all(
          productList.map(async (product) => {
            const price = findPrice(product.id, type);
            if (!price) return undefined;

            return {
              id: product.id,
              name: product.name,
              description: product.description,
              metadata: product.metadata,
              marketing_features: product.marketing_features,
              price: {
                id: price.id,
                product: price.product,
                unit_amount: price.unit_amount ? price.unit_amount / 100 : 0,
                unit_amount_decimal: price.unit_amount_decimal,
                tax_behavior: price.tax_behavior,
                currency: price.currency,
              },
            } satisfies SubscriptionPlan;
          }),
        );

        return mapped.filter((plan): plan is SubscriptionPlan => Boolean(plan));
      };

      const [monthly, yearly] = await Promise.all([processSubscriptions('monthly'), processSubscriptions('yearly')]);

      return {
        subscriptions: { monthly, yearly } as Subscriptions,
        success: true,
        defaultCurrency,
        countryCode,
      };
    } catch (error) {
      this.logger.error('[getSubscriptionPlans] Error processing subscriptions', error);
      return {
        subscriptions: { monthly: [], yearly: [] } as Subscriptions,
        success: false,
        error: 'Failed to retrieve subscription plans',
      };
    }
  }

  async cancelSubscription({ subscriptionId, studentId }: CancelSubscriptionDto): Promise<CancellationResponse> {
    if (!subscriptionId || !studentId) {
      throw new BadRequestException('Subscription ID and Student ID are required.');
    }

    const client = this.getSupabaseClient();

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      if (!subscription) {
        throw new NotFoundException('Subscription not found.');
      }

      if (subscription.status === 'canceled') {
        throw new BadRequestException('Subscription is already canceled.');
      }

      const { data: studentData, error: studentError } = await client
        .from('students')
        .select('started_premium_trial')
        .eq('uuid', studentId)
        .maybeSingle<{ started_premium_trial: string | null }>();

      if (studentError || !studentData?.started_premium_trial) {
        throw new NotFoundException('Student not found or started_premium_trial is missing.');
      }

      const startedPremiumTrial = new Date(studentData.started_premium_trial).getTime();
      const currentTime = Date.now();
      const timeSincePremiumTrial = currentTime - startedPremiumTrial;

      let refundMessage = 'No refund applicable or refund period expired.';

      if (timeSincePremiumTrial <= FOURTEEN_DAYS_MS) {
        await this.stripe.subscriptions.cancel(subscriptionId);

        if (subscription.latest_invoice) {
          const invoiceId =
            typeof subscription.latest_invoice === 'string'
              ? subscription.latest_invoice
              : subscription.latest_invoice.id;
          const invoice = await this.stripe.invoices.retrieve(invoiceId);

          if (invoice.payment_intent) {
            const paymentIntentId =
              typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent.id;
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

            if (paymentIntent && paymentIntent.status === 'succeeded' && paymentIntent.amount_received > 0) {
              await this.stripe.refunds.create(
                { payment_intent: paymentIntentId },
                { idempotencyKey: `refund_${paymentIntentId}` },
              );
              refundMessage = 'Refund issued successfully.';
            }
          }
        }

        return {
          message: 'Subscription canceled successfully during the 14-day trial period.',
          subscriptionId: subscription.id,
          refund: refundMessage,
        } satisfies CancellationResponse;
      }

      const canceledSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      return {
        message: 'Subscription will be canceled at the end of the current billing period.',
        subscriptionId: canceledSubscription.id,
        current_period_end: canceledSubscription.current_period_end,
        refund: refundMessage,
      } satisfies CancellationResponse;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Stripe.errors.StripeError) {
        if (error.type === 'StripeCardError') {
          throw new BadRequestException(error.message);
        }

        if (error.type === 'StripeInvalidRequestError') {
          throw new BadRequestException('Invalid request to Stripe API.');
        }

        this.logger.error('Stripe error during cancelSubscription', error);
        throw new InternalServerErrorException('Stripe API Error.');
      }

      this.logger.error('Error canceling subscription', error);
      throw new InternalServerErrorException('Internal Server Error.');
    }
  }

  private getSupabaseClient(): SupabaseClient {
    try {
      const client = this.supabaseService.getServiceRoleClient();
      this.logger.log('Using service role key for Supabase client');
      return client;
    } catch (error) {
      this.logger.log('Falling back to client key');
      const fallbackClient = this.supabaseService.getClient();

      if (!fallbackClient) {
        throw new InternalServerErrorException('Supabase client not available');
      }
      this.logger.log('Using fallback client key for Supabase client');
      return fallbackClient;
    }
  }

  private getDefaultCurrency(countryCode: string): 'EUR' | 'USD' {
    if (euroCountries.includes(countryCode as (typeof euroCountries)[number])) {
      return 'EUR';
    }

    if (dollarCountries.includes(countryCode as (typeof dollarCountries)[number])) {
      return 'USD';
    }
    return 'USD';
  }
}