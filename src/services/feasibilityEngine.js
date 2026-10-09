// Rural & Tribal Enterprise Feasibility Calculator Engine for UrjaMitra
export const ENTERPRISE_TEMPLATES = {
  homestay: {
    id: 'homestay',
    name: 'Tribal Homestay & Eco-Tourism',
    nameHi: 'आदिवासी होमस्टे एवं इको-टूरिज्म',
    nameTe: 'గిరిజన హోమ్‌స్టే మరియు ఎకో టూరిజం',
    nameBn: 'উপজাতি হোমস্টে ও ইকো-ট্যুরিজম',
    nameMr: 'आदिवासी होमस्टे आणि इको-टुरिझम',
    category: 'Hospitality & Culture',
    defaultCapitalCost: 350000,
    defaultSubsidy: 125000, // Tribal Development / Tourism subsidy
    defaultMonthlyOpEx: 16000, // Food, housekeeping, clean energy maintenance
    defaultMonthlyRevenue: 52000, // 2-3 rooms x 15 days @ ₹1,200/night + meals
    solarKWp: 2.5,
    description: 'Empowers indigenous families to host nature tourists with solar lights, fans, and clean water heating without polluting diesel generators.',
    assumptions: [
      '3 Traditional eco-cottages constructed with local bamboo/mud',
      'Average monthly occupancy of 14 nights at ₹1,400/night',
      'Solar lighting + solar hot water system included in setup'
    ]
  },
  millet: {
    id: 'millet',
    name: 'Millet Processing Unit (Ragi/Kodo/Kutki)',
    nameHi: 'श्री अन्न / मिलेट प्रसंस्करण केंद्र',
    nameTe: 'చిరుధాన్యాల ప్రాసెసింగ్ యూనిట్',
    nameBn: 'মিলেট প্রসেসিং ইউনিট',
    nameMr: 'मिलेट प्रक्रिया केंद्र',
    category: 'Agro-processing & SHG',
    defaultCapitalCost: 480000,
    defaultSubsidy: 170000, // PMEGP / National Millet Mission grant (35%)
    defaultMonthlyOpEx: 34000, // Raw grain procurement, SHG wages, solar electricity
    defaultMonthlyRevenue: 78000, // 1,200 kg value-added flour/dehusked grain sold
    solarKWp: 5.0,
    description: 'Dehulls, destones and pulverizes coarse millets locally so tribal farmers capture 3x value addition instead of selling raw grain to middlemen.',
    assumptions: [
      'SHG collective of 10 women operating in shifts',
      'Daily throughput of 80 kg grain at ₹65/kg value-added retail',
      'Solar-powered 3HP destoner and 2HP pulverizer'
    ]
  },
  coldStorage: {
    id: 'coldStorage',
    name: 'Solar Cold Storage & Milk Chilling (5 MT)',
    nameHi: 'सोलर कोल्ड स्टोरेज व दुग्ध प्रशीतन',
    nameTe: 'సోలార్ కోల్డ్ స్టోరేజ్ & మిల్క్ చిల్లింగ్',
    nameBn: 'সোলার কোল্ড স্টোরেজ ও মিল্ক কুলিং',
    nameMr: 'सोलर कोल्ड स्टोरेज आणि दुग्ध शीतकरण',
    category: 'Cold Chain Infrastructure',
    defaultCapitalCost: 750000,
    defaultSubsidy: 300000, // Mission for Integrated Development of Horticulture (MIDH)
    defaultMonthlyOpEx: 22000, // Refrigerant maintenance, crate handling, logistics
    defaultMonthlyRevenue: 85000, // Farmer rental fee + perishable loss reduction margins
    solarKWp: 7.5,
    description: 'Prevents vegetable rot and enables evening milk pooling for dairy co-ops using thermal energy storage & solar direct-drive cooling.',
    assumptions: [
      '5 Metric Ton micro-cold room with Phase Change Material (PCM) thermal backup',
      'Prevents 30% distress-sale price crashes during peak harvest',
      'Zero diesel fuel needed; 100% solar operational reliability'
    ]
  },
  sewing: {
    id: 'sewing',
    name: 'Solar Community Sewing & Apparel Hub',
    nameHi: 'सामुदायिक सौर सिलाई व वस्त्र केंद्र',
    nameTe: 'సోలార్ కుట్టు కేంద్రం',
    nameBn: 'সোলার সেলাই ও পোশাক কেন্দ্র',
    nameMr: 'सोलर शिलाई केंद्र',
    category: 'Micro-Manufacturing',
    defaultCapitalCost: 190000,
    defaultSubsidy: 65000, // NRLM / Tribal Sub-Plan assistance
    defaultMonthlyOpEx: 15000, // Cloth, needles, thread, technician upkeep
    defaultMonthlyRevenue: 42000, // School uniforms, cloth bags, tribal apparel orders
    solarKWp: 1.5,
    description: 'Connects 6 energy-efficient BLDC motorized sewing machines to a rooftop solar system, tripling seamstress output without muscular strain.',
    assumptions: [
      '6 Women SHG artisans earning steady local livelihood',
      'Production capacity of 250 school uniform sets / eco-bags monthly',
      'Direct solar drive eliminates erratic power interruptions'
    ]
  },
  oilExpeller: {
    id: 'oilExpeller',
    name: 'Village Mustard/Groundnut Oil Expeller',
    nameHi: 'ग्रामीण तेल घानी व आटा चक्की',
    nameTe: 'నూనె మిల్లు మరియు పిండి గిర్ని',
    nameBn: 'তেল ঘানি ও চালের কল',
    nameMr: 'तेल घाणी आणि धान्य गिरणी',
    category: 'Food Processing',
    defaultCapitalCost: 380000,
    defaultSubsidy: 130000,
    defaultMonthlyOpEx: 28000,
    defaultMonthlyRevenue: 64000,
    solarKWp: 4.0,
    description: 'Cold-presses pure edible mustard and groundnut oil for 4 surrounding hamlets, retaining healthy nutrients and cattle feed cake.',
    assumptions: [
      'Servicing 120 farmer families in a 5km radius',
      'Crushing 400 kg oilseeds per month @ ₹45/kg extraction fee',
      'Replaces noisy 8 HP diesel engine with 5 HP solar motor'
    ]
  }
};

export function calculateFeasibility(inputs) {
  const capitalCost = Math.max(10000, Number(inputs.capitalCost) || 300000);
  const subsidyAmount = Math.max(0, Number(inputs.subsidyAmount) || 0);
  const netInvestment = Math.max(1000, capitalCost - subsidyAmount);

  const monthlyOpEx = Math.max(1000, Number(inputs.monthlyOpEx) || 20000);
  const monthlyRevenue = Math.max(1000, Number(inputs.monthlyRevenue) || 50000);

  const netMonthlyProfit = monthlyRevenue - monthlyOpEx;
  const annualNetProfit = netMonthlyProfit * 12;

  // Payback period
  let paybackYears = 0;
  let paybackMonths = 0;
  if (annualNetProfit > 0) {
    paybackYears = Number((netInvestment / annualNetProfit).toFixed(1));
    paybackMonths = Number(((netInvestment / netMonthlyProfit)).toFixed(1));
  } else {
    paybackYears = 99; // Negative profit
    paybackMonths = 999;
  }

  // Break-even period in months
  const breakEvenMonths = Math.max(1, paybackMonths);

  // Return on Investment (%)
  const roiPercent = netInvestment > 0 ? Math.round((annualNetProfit / netInvestment) * 100) : 0;

  // Operating Profit Margin (%)
  const profitMarginPercent = monthlyRevenue > 0 ? Math.round((netMonthlyProfit / monthlyRevenue) * 100) : 0;

  // Solar vs Diesel benchmark
  // If running on diesel generator: 5 hrs/day * 1.5 L/hr * ₹92 * 30 days = ₹20,700/mo diesel cost
  // Solar eliminates ~₹16,000 to ₹20,000 in monthly fuel burn
  const monthlyDieselSaved = Math.round(inputs.solarKWp ? inputs.solarKWp * 4200 : 12500);

  return {
    capitalCost,
    subsidyAmount,
    netInvestment,
    monthlyOpEx,
    monthlyRevenue,
    netMonthlyProfit,
    annualNetProfit,
    paybackYears,
    paybackMonths,
    breakEvenMonths,
    roiPercent,
    profitMarginPercent,
    monthlyDieselSaved,
    isViable: netMonthlyProfit > 5000 && paybackYears <= 4
  };
}
