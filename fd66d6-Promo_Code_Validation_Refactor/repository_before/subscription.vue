<script setup lang="ts">
import type { SubscriptionPlan } from '~/types/subscriptions';
import type { PlanName } from '~/utilities/constants/subscription';

import BBBottomSheet from '~/components/global/BBBottomSheet.vue';
import TopNavLayout from '~/components/layout/TopnavLayout.vue';
import BBChooseChildPopup from '~/components/parent/subscription/BBChooseChildPopup.vue';
import BBSubscriptionDetailPopUp from '~/components/parent/subscription/BBSubscriptionDetailPopUp.vue';
import BBSubscriptionFeatures from '~/components/parent/subscription/BBSubscriptionFeatures.vue';
import BBPlanCard from '~/components/paywall/BBPlanCard.vue';
import usePaymentsApi, { type PaymentsSubscribePayload } from '~/composables/usePaymentsApi';
import { useKidProfile } from '~/stores/kidProfile';
import { PLAN_FULL_NAMES, PLAN_NAMES, PLAN_SLUGS } from '~/utilities/constants/subscription';

const { fetchMyKids, fetchStudentSubscriptionData } = useSupabase();
const { fetchUserData } = useSession();
const { t: $t, tm: $tm } = useI18n();
const { width } = useWindowSize();
const studentSubscriptionData = ref<ISubscription | null>(null);

const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();
const paymentsApi = usePaymentsApi();

const handleClose = () => {
  if (route.query?.from && route.query.from === 'my-plan') {
    router.push(localePath('/parent/settings/my-plan'));
  } else {
    const kidProfile = useKidProfile();
    kidProfile.setIsSubjectSelectionOpen(true);
    router.back();
  }
};

const {
  data: plans,
  status,
  error,
  refresh,
} = await useAsyncData('subscription-plans', () => paymentsApi.getSubscriptionPlans());

onMounted(async () => {
  if (route.query.student_id) {
    const studentSubscription = await fetchStudentSubscriptionData(route.query.student_id as string);
    studentSubscriptionData.value = studentSubscription;
  }
});

useHead({
  title: $t('meta.parent.my_account_settings.title'),
  meta: [
    {
      name: 'description',
      content: $t('meta.parent.my_account_settings.description'),
    },
  ],
});
definePageMeta({
  layout: 'subscription-layout',
});

const subscriptionNameMapping = PLAN_SLUGS;

const currentPlan = ref<SubscriptionPlan | null>(null);

const premiumPlan = ref<IFullSubscriptionPlan>({});
const basicPlan = ref<IFullSubscriptionPlan>({});
const trialPlan = ref<IFullSubscriptionPlan>({});
const availablePlanTypes: PlanName[] = [PLAN_NAMES.PREMIUM, PLAN_NAMES.BASIC, PLAN_NAMES.TRIAL];
const selectablePlanSet = new Set(availablePlanTypes);
const basicPlanAliases = new Set([PLAN_NAMES.BASIC.toLowerCase(), PLAN_NAMES.BASIS.toLowerCase()]);
const premiumPlanAliases = new Set([PLAN_NAMES.PREMIUM.toLowerCase()]);
const freePlanAliases = new Set([PLAN_NAMES.TRIAL.toLowerCase(), PLAN_FULL_NAMES.TRIAL.toLowerCase(), 'free']);
const supportedPlanAliases = new Set([...basicPlanAliases, ...premiumPlanAliases, ...freePlanAliases]);
const selectedPlan = ref<IFullSubscriptionPlan>();
const yearlyBilling = ref(true);
const features = ref<{ plan: string; items: string[] }[]>([]);
const showSubscriptionDetailModal = ref(false);
const showChooseChildModal = ref(false);
const parentData = ref<IParent>();
const billingPeriod = ref<'monthly' | 'annual'>('annual');
const mySubscriptionDetailBottomSheet = ref();
const myChooseChildernBottomSheet = ref();

const planDefinitions = computed(() => [
  {
    type: PLAN_NAMES.PREMIUM,
    data: premiumPlan.value,
    bg_color: 'bg-primary',
    text_color: '#ffffff',
    Badge_text_color: 'text-primary',
    course_desc_color: 'text-white',
    price_caption_lines: [$t('pages.subscription.basic_price_caption')],
    price_amount_suffix: ' /',
  },
  {
    type: PLAN_NAMES.BASIC,
    data: basicPlan.value,
    bg_color: '!bg-[#FEF9FB]',
    text_color: '#F17EB1',
    Badge_text_color: 'text-white',
    course_desc_color: '',
    price_caption_lines: [$t('pages.subscription.basic_price_caption')],
    price_amount_suffix: ' /',
  },
  {
    type: PLAN_NAMES.TRIAL,
    data: trialPlan.value,
    bg_color: 'bg-[#F6FCFC]',
    text_color: '#47BAC0',
    Badge_text_color: 'text-white',
    course_desc_color: '',
    price_amount_override: $t('pages.subscription.trial_price_amount'),
    price_caption_lines: [$t('pages.subscription.trial_price_caption')],
    show_course_count: false,
  },
]);

const openSubscriptionDetailBottomSheet = async () => {
  mySubscriptionDetailBottomSheet.value?.open();
};

const openChooseChildernBottomSheet = async () => {
  myChooseChildernBottomSheet.value?.open();
};

const loading = ref(false);
const handleActivation = async (selectedKids: { student_id: string; promo_code_api_id?: string }) => {
  if (!selectedPlan.value) return;
  const user = useSupabaseUser();
  loading.value = true; // Start loading
  try {
    const selectedPrice =
      billingPeriod.value === 'monthly' ? selectedPlan.value?.monthly?.price : selectedPlan.value?.yearly?.price;
    if (!selectedPrice?.id || !selectedPrice?.currency || !parentData.value) {
      console.error('Missing subscription details for activation');
      return;
    }

    if (!user.value?.id) {
      console.error('No authenticated user available for subscription activation');
      return;
    }

    if (!parentData.value?.stripe_customer_id) {
      await paymentsApi.createCustomer();
      parentData.value = await fetchUserData();

      if (!parentData.value?.stripe_customer_id) {
        loading.value = false; // End loading if no customer ID
        return;
      }
    }
    const subscribePayload: PaymentsSubscribePayload = {
      customer_id: parentData.value.stripe_customer_id,
      price: selectedPrice.id,
      students: [selectedKids.student_id],
      plan_name: subscriptionNameMapping[selectedPlan.value?.monthly?.name as keyof typeof subscriptionNameMapping],
      returnUrl: '/parent/settings/my-plan',
      plan_type: billingPeriod.value,
      user_id: user.value.id,
      promo_code_api_id: selectedKids.promo_code_api_id,
      currency: selectedPrice.currency,
    };

    const data = await paymentsApi.subscribe(subscribePayload);
    if (data?.link) {
      window.location.href = data.link;
    }
  } catch (error) {
    console.error('Error during activation:', error);
  } finally {
    loading.value = false; // End loading
  }
};

watchEffect(() => {
  if (!plans.value?.subscriptions) return;

  const { monthly, yearly } = plans.value.subscriptions;

  availablePlanTypes.forEach((type) => {
    const monthlyPlan = monthly.find((p) => p.name === type);
    const yearlyPlan = yearly.find((p) => p.name === type);
    if (!monthlyPlan && !yearlyPlan) {
      return;
    }

    const fullPlan: IFullSubscriptionPlan = {};

    if (monthlyPlan) {
      fullPlan.monthly = monthlyPlan;
    }

    if (yearlyPlan) {
      fullPlan.yearly = yearlyPlan;
    }

    switch (type) {
      case PLAN_NAMES.BASIC:
        basicPlan.value = fullPlan;
        break;
      case PLAN_NAMES.PREMIUM:
        premiumPlan.value = fullPlan;
        break;
      case PLAN_NAMES.TRIAL:
        trialPlan.value = fullPlan;
        break;
    }
  });
});

const handleClick = (selectedPlanValue: string) => {
  switch (selectedPlanValue) {
    case PLAN_NAMES.BASIC:
      selectedPlan.value = basicPlan.value;
      break;
    case PLAN_NAMES.PREMIUM:
      selectedPlan.value = premiumPlan.value;
      break;
    case PLAN_NAMES.TRIAL:
      selectedPlan.value = trialPlan.value;
      break;
  }
  if (width.value < 768) {
    openSubscriptionDetailBottomSheet();
  } else showSubscriptionDetailModal.value = true;
};

const myKids = ref<IStudent[]>([]);

parentData.value = await fetchUserData();

onMounted(async () => {
  if (parentData.value?.uuid) {
    // @ts-ignore
    myKids.value = await fetchMyKids(parentData.value.uuid);
  }
});

watch(
  () => yearlyBilling.value,
  () => {
    selectedPlan.value = undefined;
    if (yearlyBilling.value === false) {
      billingPeriod.value = 'monthly';
    } else {
      billingPeriod.value = 'annual';
    }
  },
);

onMounted(() => {
  features.value = [];

  availablePlanTypes.forEach((planType) => {
    // Your original switch logic
    switch (planType) {
      case PLAN_NAMES.BASIC:
        selectedPlan.value = basicPlan.value;
        break;
      case PLAN_NAMES.PREMIUM:
        selectedPlan.value = premiumPlan.value;
        break;
      case PLAN_NAMES.TRIAL:
        selectedPlan.value = trialPlan.value;
        break;
    }

    const slug = subscriptionNameMapping[planType as keyof typeof subscriptionNameMapping];
    if (!slug) {
      return;
    }

    const translatedFeatures = $tm(`subscriptions.${slug}.marketing_features` as string);

    if (Array.isArray(translatedFeatures)) {
      features.value.push({
        plan: planType,
        items: translatedFeatures,
      });
    }
  });
});

const closeSubscriptionDetailModal = () => {
  if (width.value < 768) {
    if (mySubscriptionDetailBottomSheet.value) mySubscriptionDetailBottomSheet.value.close();
  } else showSubscriptionDetailModal.value = false;
};

const handleOpenChooseChildModal = () => {
  if (width.value < 768) {
    if (mySubscriptionDetailBottomSheet.value) mySubscriptionDetailBottomSheet.value.close();
  } else showSubscriptionDetailModal.value = false;

  if (width.value < 768) {
    if (myChooseChildernBottomSheet.value) myChooseChildernBottomSheet.value.open();
  } else showChooseChildModal.value = true;
};
const closeChooseChildModal = () => {
  if (width.value < 768) {
    if (myChooseChildernBottomSheet.value) myChooseChildernBottomSheet.value.close();
  } else showChooseChildModal.value = false;
};

const isSubscriptionDisabled = (
  subscriptionName: string | undefined,
  planName: PlanName,
  isMonthly: boolean,
  planType: 'monthly' | 'annual' | undefined,
): boolean => {
  if (!subscriptionName || !planName) {
    return false;
  }

  const normalizedPlan = planName.toLowerCase();
  if (!supportedPlanAliases.has(normalizedPlan)) {
    console.warn('[subscription] Unsupported plan selection attempted', planName);
    return false;
  }

  const planTypeMatch = (planType === 'monthly' && isMonthly) || (planType === 'annual' && !isMonthly);
  if (!planTypeMatch) {
    return false;
  }

  const normalizedSubscription = subscriptionName.toLowerCase();
  if (!supportedPlanAliases.has(normalizedSubscription)) {
    return false;
  }

  if (freePlanAliases.has(normalizedSubscription)) {
    return freePlanAliases.has(normalizedPlan);
  }

  if (normalizedSubscription === normalizedPlan) {
    return true;
  }

  const isBasicPlan = basicPlanAliases.has(normalizedPlan);
  const isBasicSubscription = basicPlanAliases.has(normalizedSubscription);
  const isPremiumSubscription = premiumPlanAliases.has(normalizedSubscription);

  if (isBasicPlan && isBasicSubscription) {
    return true;
  }

  if (isPremiumSubscription && isBasicPlan) {
    return true;
  }
  return false;
};
const goToPortal = async () => {
  if (!parentData.value?.stripe_customer_id) {
    console.error('Stripe customer ID is missing for portal access');
    return;
  }

  try {
    const session = await paymentsApi.createPortalSession(parentData.value.stripe_customer_id);
    if (session?.url) {
      window.location.href = session.url; // Redirect to the Stripe portal
    }
  } catch (error) {
    console.error('Error creating portal session:', error);
  }
};
const canSelectPlan = (planType: string) => {
  if (!selectablePlanSet.has(planType as PlanName)) {
    console.warn('[subscription] Ignoring unsupported plan type', planType);
    return false;
  }

  return !isSubscriptionDisabled(
    studentSubscriptionData?.value?.subscription_plan?.subscription_name,
    planType as PlanName,
    yearlyBilling.value === false,
    studentSubscriptionData?.value?.plan_type,
  );
};
const getPlanName = (planType: string) => {
  const mappedName = subscriptionNameMapping[planType as keyof typeof subscriptionNameMapping];
  return $t(`subscriptions.${mappedName}.name`);
};
const handlePlanSelection = (planType: string) => {
  canSelectPlan(planType) && handleClick(planType);
};
</script>

<template>
  <div v-if="width > 640">
    <TopNavLayout v-if="width > 640" class="fixed inset-0 w-full overflow-auto !p-0">
      <div class="fixed inset-x-0 mx-auto flex h-screen flex-col px-1 pb-24 lg:px-3">
        <div
          class="absolute bottom-[-10vh] left-[-5%] h-[80vh] w-[110%] rounded-t-[100%] bg-[#E8DDED] opacity-[20%]"
        ></div>
        <div
          class="z-10 mx-auto flex max-h-[85vh] w-full flex-col space-y-3 overflow-y-auto overflow-x-hidden lg:w-[1010px]"
        >
          <div class="my-4 py-5 pb-3 lg:h-[147px] lg:space-y-10">
            <div class="mx-auto mb-6 flex w-full items-center justify-between pl-3 pr-7">
              <span class="text-info text-primary font-primary font-heading text-4xl font-bold">
                {{ $t('pages.subscription.transform_journey') }}
              </span>
              <span class="text-primary cursor-pointer" @click="handleClose">
                <Icon name="material-symbols:close-rounded" class="text-4xl" />
              </span>
            </div>
            <div class="mx-auto my-6 flex w-full items-center justify-between px-4 sm:space-x-24">
              <span class="flex flex-col items-start">
                <div class="flex items-center">
                  <div class="flex flex-col items-start">
                    <span class="mr-2 hidden font-medium text-teal-500 sm:flex">{{
                      $t('pages.subscription.annual_billing')
                    }}</span>
                  </div>
                  <label class="relative inline-flex cursor-pointer items-center">
                    <input v-model="yearlyBilling" type="checkbox" class="peer sr-only" checked />
                    <div
                      class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:right-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-500 peer-checked:after:-translate-x-full peer-focus:outline-none"
                    ></div>
                  </label>
                  <div class="flex flex-col">
                    <span class="ml-3 hidden font-medium text-teal-500 sm:flex">{{
                      $t('pages.subscription.monthly_billing')
                    }}</span>
                  </div>
                </div>
                <span class="text-sm text-teal-500">{{ $t('pages.subscription.save_50%') }}</span>
              </span>
              <span> </span>
            </div>
          </div>
          <div class="flex w-full flex-col items-center justify-between space-x-1 px-3 py-1 sm:flex-row lg:mx-auto">
            <div
              class="gap-5xl flex w-full flex-col items-center justify-between overflow-x-auto px-2 sm:flex-row lg:mx-auto"
            >
              <div
                v-for="(plan, index) in planDefinitions"
                :key="index"
                class="flex h-[530px] w-[276px] flex-col rounded-lg border-2 pt-0 lg:mx-4 lg:w-[286px]"
                :class="[plan.type === PLAN_NAMES.PREMIUM && 'sm:relative  sm:shadow-lg', plan.bg_color]"
              >
                <BBPlanCard
                  :data-testid="plan.type"
                  :plan-color="plan.text_color"
                  :badge-text-color="plan.Badge_text_color"
                  :course-desc-color="plan.course_desc_color"
                  :plan-name="getPlanName(plan.type)"
                  :montly-price="
                    typeof plan.data.monthly?.price?.unit_amount === 'number' ? plan.data.monthly?.price.unit_amount : 0
                  "
                  :yearly-price="
                    typeof plan.data.yearly?.price?.unit_amount === 'number' ? plan.data.yearly?.price.unit_amount : 0
                  "
                  :no-of-courses="
                    plan.data.monthly?.metadata?.no_of_courses ?? plan.data.yearly?.metadata?.no_of_courses ?? '—'
                  "
                  :subscription-page="true"
                  :is-monthly="yearlyBilling === false"
                  :is-active="selectedPlan?.monthly?.name === plan.type"
                  :is-disabled="!canSelectPlan(plan.type)"
                  :price-amount-override="plan.price_amount_override"
                  :price-caption-lines="plan.price_caption_lines"
                  :price-amount-suffix="plan.price_amount_suffix"
                  :show-course-count="plan.show_course_count"
                />

                <div class="grow overflow-auto px-2 pb-3 sm:px-2">
                  <div class="my-4 space-y-1 sm:my-6">
                    <BaseButton
                      class="mb-2 mt-auto !h-10 w-full !border-0 !text-sm !font-medium"
                      shape="full"
                      size="lg"
                      flavor="solid"
                      :disabled="!canSelectPlan(plan.type)"
                      :style="{
                        backgroundColor: studentSubscriptionData?.plan_type === plan.type ? '#F1F1F1' : plan.text_color,
                      }"
                      :class="[
                        studentSubscriptionData?.plan_type === plan.type
                          ? '!text-[#6D6D6D]'
                          : plan.type === PLAN_NAMES.PREMIUM
                          ? '!text-[#704682]'
                          : '!text-white',
                      ]"
                      @click="handlePlanSelection(plan.type)"
                    >
                      {{ `${$t('global.select')} ${$t(getPlanName(plan.type))} Plan` }}
                    </BaseButton>

                    <BBSubscriptionFeatures :plan="plan" :features="features" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="ml-12 mt-auto w-full">
            <button class="text-primary-100 text-sm font-light underline underline-offset-4" @click="goToPortal">
              {{ $t('pages.subscription.manage_subscription') }}
            </button>
          </div>
        </div>
        <div v-if="width < 768">
          <client-only>
            <BBBottomSheet
              ref="mySubscriptionDetailBottomSheet"
              :classes="{
                wrapper: 'w-full h-screen max-w-none !p-0 fixed inset-0',
                dialog: 'w-full h-full max-w-none max-h-none m-0 !p-0 rounded-none flex flex-col',
              }"
            >
              <template #header>
                <div>
                  <h2 class="text-primary px-2 text-2xl font-bold">{{ $t('pages.subscription.transform_journey') }}</h2>
                </div>
              </template>
              <BBSubscriptionDetailPopUp
                :selected-plan="selectedPlan"
                :is-monthly="yearlyBilling === false"
                :features="features"
                :is-loading="loading"
                @close-modal="closeSubscriptionDetailModal"
                @open-choose-child-popup="handleOpenChooseChildModal"
                @activate-subscription="handleActivation"
              />
            </BBBottomSheet>
          </client-only>
        </div>
        <div v-else>
          <TairoModal
            :open="showSubscriptionDetailModal"
            :classes="{
              wrapper: 'w-full h-screen max-w-none !p-0 fixed inset-0',
              dialog: 'w-full h-full max-w-none max-h-none m-0 !p-0 rounded-none flex flex-col',
            }"
            @close="closeSubscriptionDetailModal"
            ><BBSubscriptionDetailPopUp
              :selected-plan="selectedPlan"
              :is-monthly="yearlyBilling === false"
              :features="features"
              :is-loading="loading"
              @close-modal="closeSubscriptionDetailModal"
              @open-choose-child-popup="handleOpenChooseChildModal"
              @activate-subscription="handleActivation"
          /></TairoModal>
        </div>
        <div v-if="width < 768">
          <client-only>
            <BBBottomSheet ref="myChooseChildernBottomSheet" height="!h-fit">
              <template #header>
                <div>
                  <h2 class="text-lg font-medium">{{ $t('pages.subscription.select_a_child') }}</h2>
                </div>
              </template>
              <BBChooseChildPopup @close-modal="closeChooseChildModal" @activate-subscription="handleActivation" />
            </BBBottomSheet>
          </client-only>
        </div>
        <div v-else>
          <TairoModal
            :open="showChooseChildModal"
            size="md"
            :classes="{ wrapper: '', dialog: '!rounded-3xl !max-w-[420px] ' }"
            @close="closeChooseChildModal"
          >
            <BBChooseChildPopup @close-modal="closeChooseChildModal" @activate-subscription="handleActivation" />
          </TairoModal>
        </div>
      </div>
    </TopNavLayout>
  </div>
  <div v-else class="relative">
    <div class="mb-6 flex w-full items-start justify-between px-1">
      <span class="text-info text-primary font-heading w-[266px] text-xl font-bold">
        {{ $t('pages.subscription.transform_journey') }}
      </span>
      <span class="text-primary cursor-pointer text-2xl" @click="handleClose">
        <Icon name="material-symbols:close-rounded" class="text-2xl" />
      </span>
    </div>
    <span class="my-8 flex px-1">
      <div class="flex items-center space-x-2">
        <div class="flex flex-col items-start">
          <span class="mr-2 hidden font-medium text-teal-500 sm:flex">{{
            $t('pages.subscription.annual_billing')
          }}</span>
        </div>
        <span class="mr-2 font-medium text-teal-500 sm:hidden">{{ $t('pages.subscription.yearly') }}</span>
        <label class="relative inline-flex cursor-pointer items-center">
          <input v-model="yearlyBilling" type="checkbox" class="peer sr-only" checked />
          <div
            class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:right-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-500 peer-checked:after:-translate-x-full peer-focus:outline-none"
          ></div>
        </label>
        <span class="text-sm text-teal-500">{{ $t('pages.subscription.save_50%') }}</span>
      </div>
    </span>
    <div class="mx-auto flex h-full flex-col px-10 sm:px-3">
      <div
        class="rounded-bl-0 rounded-br-0 absolute left-[-5%] top-[55vh] z-0 h-[calc(100%-330px)] w-[110%] overflow-y-auto rounded-tl-[55%_10vh] rounded-tr-[60%_10vh] bg-[#e8dded]"
      ></div>

      <div class="z-10 mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div class="mx-auto mt-6 flex max-w-[296px] flex-col items-center justify-center gap-4 sm:flex-row lg:gap-6">
          <div
            v-for="(plan, index) in planDefinitions"
            :key="index"
            class="flex h-[530px] w-full flex-col rounded-xl border-2 pt-0 lg:w-[286px]"
            :class="[
              plan.type === PLAN_NAMES.PREMIUM && 'sm:relative sm:-top-8 sm:min-h-[560px] sm:shadow-lg',
              plan.bg_color,
            ]"
          >
            <BBPlanCard
              :data-testid="plan.type"
              :plan-color="plan.text_color"
              :badge-text-color="plan.Badge_text_color"
              :course-desc-color="plan.course_desc_color"
              :plan-name="plan.type"
              :montly-price="
                typeof plan.data.monthly?.price?.unit_amount === 'number' ? plan.data.monthly?.price.unit_amount : 0
              "
              :yearly-price="
                typeof plan.data.yearly?.price?.unit_amount === 'number' ? plan.data.yearly?.price.unit_amount : 0
              "
              :no-of-courses="plan.data.monthly?.metadata.no_of_courses!"
              :subscription-page="true"
              :is-monthly="yearlyBilling === false"
              :is-active="selectedPlan?.monthly?.name === plan.type"
              :is-disabled="!canSelectPlan(plan.type)"
              :price-amount-override="plan.price_amount_override"
              :price-caption-lines="plan.price_caption_lines"
              :price-amount-suffix="plan.price_amount_suffix"
              :show-course-count="plan.show_course_count"
              @open-plan-detail="handleClick(plan.type)"
            />
            <div class="grow overflow-auto px-2 pb-3 sm:px-5">
              <div class="my-4 sm:my-6 md:space-y-1">
                <BaseButton
                  class="mb-2 mt-auto !h-10 w-full !border-0 !text-sm !font-medium"
                  :class="[plan.type === PLAN_NAMES.PREMIUM ? '!text-[#704682]' : '!text-white']"
                  shape="full"
                  size="lg"
                  flavor="solid"
                  :disabled="!canSelectPlan(plan.type)"
                  :style="{ backgroundColor: plan.text_color }"
                  @click="handlePlanSelection(plan.type)"
                >
                  {{ `${$t('global.select')} ${$t(getPlanName(plan.type))} Plan` }}
                </BaseButton>
                <BBSubscriptionFeatures :plan="plan" :features="features" />
              </div>
            </div>
          </div>
        </div>
        <div class="mt-auto w-full">
          <button class="text-primary-100 text-sm font-light underline underline-offset-4" @click="goToPortal">
            {{ $t('pages.subscription.manage_subscription') }}
          </button>
        </div>
      </div>

      <div v-if="width < 768">
        <client-only>
          <BBBottomSheet
            ref="mySubscriptionDetailBottomSheet"
            :classes="{
              wrapper: 'w-full h-screen max-w-none !p-0 fixed inset-0',
              dialog: 'w-full h-full max-w-none max-h-none m-0 !p-0 rounded-none flex flex-col',
            }"
          >
            <template #header>
              <div>
                <h2 class="text-primary font-heading w-[266px] px-1 text-xl font-bold">
                  {{ $t('pages.subscription.transform_journey') }}
                </h2>
              </div>
            </template>
            <BBSubscriptionDetailPopUp
              :selected-plan="selectedPlan"
              :is-monthly="yearlyBilling === false"
              :features="features"
              :is-loading="loading"
              @close-modal="closeSubscriptionDetailModal"
              @open-choose-child-popup="handleOpenChooseChildModal"
              @activate-subscription="handleActivation"
            />
          </BBBottomSheet>
        </client-only>
      </div>
      <div v-else>
        <TairoModal
          :open="showSubscriptionDetailModal"
          :classes="{
            wrapper: 'w-full h-screen max-w-none !p-0 fixed inset-0',
            dialog: 'w-full h-full max-w-none max-h-none m-0 !p-0 rounded-none flex flex-col',
          }"
          @close="closeSubscriptionDetailModal"
          ><BBSubscriptionDetailPopUp
            :selected-plan="selectedPlan"
            :is-monthly="yearlyBilling === false"
            :features="features"
            :is-loading="loading"
            @close-modal="closeSubscriptionDetailModal"
            @open-choose-child-popup="handleOpenChooseChildModal"
            @activate-subscription="handleActivation"
        /></TairoModal>
      </div>
      <div v-if="width < 768">
        <client-only>
          <BBBottomSheet ref="myChooseChildernBottomSheet" height="!h-fit">
            <template #header>
              <div>
                <h2 class="text-lg font-medium">{{ $t('pages.subscription.select_a_child') }}</h2>
              </div>
            </template>
            <BBChooseChildPopup @close-modal="closeChooseChildModal" @activate-subscription="handleActivation" />
          </BBBottomSheet>
        </client-only>
      </div>
      <div v-else>
        <TairoModal
          :open="showChooseChildModal"
          size="md"
          :classes="{ wrapper: '', dialog: '!rounded-3xl !max-w-[420px] ' }"
          @close="closeChooseChildModal"
        >
          <BBChooseChildPopup @close-modal="closeChooseChildModal" @activate-subscription="handleActivation" />
        </TairoModal>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.badge {
  position: absolute;
  top: -15px;
}
</style>
