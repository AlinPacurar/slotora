export const PLANS = {
  community: {
    name: "Community",
    price: 0,
    priceYearly: 0,
    color: "stone",
    description: "For groups getting started",
    tagline: "Schedule together, no fuss",
    audience: "Casual groups, one-off events, family plans",
    features: {
      fileUploads: 0,
      maxFileSizeMB: 0,
      customVoteOptions: false,
      maxVoteOptions: 0,
      customBranding: false,
      csvExport: false,
      noAds: false,
      voteReminders: false,
      collectParticipantData: false,
      prioritySupport: false,
      feeCollection: false,
    },
  },
  slot: {
    name: "Slot",
    price: 4,
    priceYearly: 38.40,
    color: "violet",
    description: "For regular organisers",
    tagline: "You run things. We make it easy.",
    audience: "Coaches, teachers, PTA leads, team captains",
    features: {
      fileUploads: 1,
      maxFileSizeMB: 2,
      customVoteOptions: false,
      maxVoteOptions: 0,
      customBranding: false,
      csvExport: true,
      noAds: true,
      voteReminders: true,
      collectParticipantData: false,
      prioritySupport: false,
      feeCollection: false,
    },
  },
  snap: {
    name: "Snap",
    price: 9,
    priceYearly: 86.40,
    color: "violet",
    description: "For teams & committees",
    tagline: "Everything snaps into place.",
    audience: "Committees, sports teams, schools, multiple organisers",
    features: {
      fileUploads: 3,
      maxFileSizeMB: 5,
      customVoteOptions: true,
      maxVoteOptions: 3,
      customBranding: false,
      csvExport: true,
      noAds: true,
      voteReminders: true,
      collectParticipantData: true,
      prioritySupport: false,
      feeCollection: false,
    },
  },
  ora: {
    name: "Ora",
    price: 19,
    priceYearly: 182.40,
    color: "violet",
    description: "For organisations & leagues",
    tagline: "The full power of Slotora.",
    audience: "Schools, charities, associations, leagues",
    features: {
      fileUploads: 5,
      maxFileSizeMB: 10,
      customVoteOptions: true,
      maxVoteOptions: 999,
      customBranding: true,
      csvExport: true,
      noAds: true,
      voteReminders: true,
      collectParticipantData: true,
      prioritySupport: true,
      feeCollection: true,
    },
  },
};

export function getPlan(planName) {
  return PLANS[planName] || PLANS.community;
}

export function canUseFeature(planName, feature) {
  const plan = getPlan(planName);
  return !!plan.features[feature];
}

export function getFileUploadLimit(planName) {
  const plan = getPlan(planName);
  return {
    maxFiles: plan.features.fileUploads,
    maxSizeMB: plan.features.maxFileSizeMB,
  };
}

export function getVoteOptionsLimit(planName) {
  const plan = getPlan(planName);
  return {
    canCustomise: plan.features.customVoteOptions,
    maxOptions: plan.features.maxVoteOptions,
  };
}

export function isFeatureLocked(planName, feature) {
  return !canUseFeature(planName, feature);
}

export const PLAN_ORDER = ["community", "slot", "snap", "ora"];

export function isAtLeastPlan(userPlan, requiredPlan) {
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(requiredPlan);
}