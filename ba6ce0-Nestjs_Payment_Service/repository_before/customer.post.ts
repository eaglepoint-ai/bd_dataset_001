import type { SupabaseClient } from '@supabase/supabase-js';
import type { EventHandlerRequest, H3Event } from 'h3';
import { useServerStripe } from '#stripe/server';
import { serverSupabaseClient } from '#supabase/server';

const createCustomer = async (event: H3Event<EventHandlerRequest>) => {
  const stripe = await useServerStripe(event);
  const client: SupabaseClient = await serverSupabaseClient(event);

  const { data: parent, error } = await client
    .from('parents')
    .select('*')
    .eq('supabase_id', event.context.user.id)
    .single();

  if (!parent.stripe_customer_id) {
    const customer = await stripe.customers.create({
      email: parent.email,
      name: parent.name,
    });

    if (customer.id) {
      const { data, error } = await client
        .from('parents')
        .update({
          stripe_customer_id: customer.id,
        })
        .eq('uuid', parent.uuid)
        .select();

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Something went wrong',
          stack: '',
        });
      }

      return {
        success: 'true',
        data: data,
      };
    }

    return { success: false, message: 'Something went wrong' };
  }

  return { success: true };
};

export default defineEventHandler({
  onRequest: [auth],
  handler: createCustomer,
});
