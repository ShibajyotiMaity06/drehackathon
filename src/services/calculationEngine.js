// Deterministic Energy Audit and Sizing Calculation Engine for UrjaMitra
// Standard Indian Rural Energy Benchmarks
export const ENERGY_CONSTANTS = {
  ELECTRICITY_TARIFF_PER_KWH: 5.5, // Standard rural commercial / community slab (₹/kWh)
  DIESEL_PRICE_PER_LITRE: 92.0, // Indian diesel average (₹/L)
  DIESEL_CONSUMPTION_L_PER_HR: 1.2, // Small 2.5-3.5 kVA rural portable diesel generator
  GRID_EMISSION_FACTOR_KG_CO2_PER_KWH: 0.82, // Central Electricity Authority (CEA) India baseline
  DIESEL_EMISSION_FACTOR_KG_CO2_PER_L: 2.68, // Bureau of Energy Efficiency (BEE) standard
  AVG_PEAK_SUN_HOURS: 4.5, // Average daily peak solar irradiance hours in central/rural India
  SOLAR_SYSTEM_PERFORMANCE_RATIO: 0.78, // De-rating factor for dust, temperature, wiring
  SOLAR_COST_PER_KWP: 52000, // Inclusive of rural mounting structure, BOS, installation (₹/kWp)
  LFP_BATTERY_COST_PER_KWH: 18000, // Lithium Iron Phosphate 48V battery cost (₹/kWh)
  BLDC_FAN_COST: 2800, // 28W BEE 5-Star BLDC Fan (₹)
  LED_BULB_COST: 120, // 9W High-lumen LED Retrofit (₹)
  EFFICIENT_FRIDGE_RETROFIT_COST: 26000 // 5-Star Inverter Refrigerator (₹)
};

export function calculateAuditSummary(appliances = [], hasGenerator = false, generatorHours = 0, tariff = ENERGY_CONSTANTS.ELECTRICITY_TARIFF_PER_KWH) {
  let totalDailyWattHours = 0;
  let peakLoadWatts = 0;

  const applianceBreakdown = appliances.map((app) => {
    const count = Number(app.count) || 1;
    const watts = Number(app.watts) || 40;
    const hours = Number(app.hoursPerDay) || 6;

    const totalWatts = count * watts;
    const dailyKWh = (totalWatts * hours) / 1000;
    const monthlyKWh = dailyKWh * 30;
    const monthlyCost = monthlyKWh * tariff;

    totalDailyWattHours += (totalWatts * hours);
    peakLoadWatts += totalWatts;

    return {
      ...app,
      totalWatts,
      dailyKWh: Number(dailyKWh.toFixed(2)),
      monthlyKWh: Number(monthlyKWh.toFixed(1)),
      monthlyCost: Math.round(monthlyCost)
    };
  });

  const totalDailyKWh = totalDailyWattHours / 1000;
  const totalMonthlyKWh = totalDailyKWh * 30;
  const monthlyElectricityBill = Math.round(totalMonthlyKWh * tariff);

  // Diesel calculations - dynamically scales with connected electrical load & generator running hours
  const genDailyHours = hasGenerator ? (Number(generatorHours) || 0) : 0;
  
  // Effective electrical power drawn from generator during outage (kW):
  // Baseline load considers operating appliances with 70% diversity factor (min 0.35 kW)
  const generatorLoadKW = Math.max(0.35, Number(((peakLoadWatts * 0.70) / 1000).toFixed(2)));
  
  // Specific fuel consumption:
  // Base idling fuel consumption (~0.35 L/hr) + ~0.34 L per kWh of electrical generation
  // E.g.: 0.8 kW load = ~0.62 L/hr; 2.5 kW load = ~1.20 L/hr; 5 kW load = ~2.05 L/hr
  const dieselConsumptionLPerHr = Number((0.35 + (generatorLoadKW * 0.34)).toFixed(2));
  
  const dailyDieselLitres = Number((genDailyHours * dieselConsumptionLPerHr).toFixed(2));
  const monthlyDieselLitres = Number((dailyDieselLitres * 30).toFixed(1));
  const monthlyDieselExpense = Math.round(monthlyDieselLitres * ENERGY_CONSTANTS.DIESEL_PRICE_PER_LITRE);

  // Carbon emissions (kg CO2 per month)
  const monthlyGridCO2 = totalMonthlyKWh * ENERGY_CONSTANTS.GRID_EMISSION_FACTOR_KG_CO2_PER_KWH;
  const monthlyDieselCO2 = monthlyDieselLitres * ENERGY_CONSTANTS.DIESEL_EMISSION_FACTOR_KG_CO2_PER_L;
  const totalMonthlyCO2 = Math.round(monthlyGridCO2 + monthlyDieselCO2);

  return {
    appliances: applianceBreakdown,
    peakLoadWatts: Math.round(peakLoadWatts),
    generatorLoadKW,
    dieselConsumptionLPerHr,
    totalDailyKWh: Number(totalDailyKWh.toFixed(2)),
    totalMonthlyKWh: Math.round(totalMonthlyKWh),
    monthlyElectricityBill,
    hasGenerator,
    generatorHours: genDailyHours,
    monthlyDieselLitres: Number(monthlyDieselLitres.toFixed(1)),
    monthlyDieselExpense,
    totalMonthlyEnergyExpense: monthlyElectricityBill + monthlyDieselExpense,
    totalMonthlyCO2
  };
}

// Generate Top Priority Energy Saving Recommendations
export function generateRecommendations(summary, appliances = []) {
  const recommendations = [];
  const tariff = ENERGY_CONSTANTS.ELECTRICITY_TARIFF_PER_KWH;

  // 1. Lighting LED Retrofit
  const lightingApp = appliances.find(a => a.type === 'light');
  if (lightingApp && lightingApp.watts > 15) {
    const count = Number(lightingApp.count) || 1;
    const currentWatts = Number(lightingApp.watts) || 40;
    const hours = Number(lightingApp.hoursPerDay) || 6;
    const deltaWatts = Math.max(0, currentWatts - 9);

    const dailyKWhSaved = (count * deltaWatts * hours) / 1000;
    const annualKWhSaved = dailyKWhSaved * 365;
    const annualSavingsINR = Math.round(annualKWhSaved * tariff);
    const retrofitCost = count * ENERGY_CONSTANTS.LED_BULB_COST;
    const paybackMonths = annualSavingsINR > 0 ? Number(((retrofitCost / annualSavingsINR) * 12).toFixed(1)) : 1;
    const co2SavedYearly = Math.round(annualKWhSaved * ENERGY_CONSTANTS.GRID_EMISSION_FACTOR_KG_CO2_PER_KWH);

    if (annualSavingsINR > 100) {
      recommendations.push({
        id: 'rec-led-lighting',
        priority: 1,
        title: `Upgrade ${count} inefficient lights to 9W high-lumen LEDs`,
        titleHi: `${count} पुरानी बत्तियों/ट्यूबलाइटों को 9W एलईडी में बदलें`,
        titleTe: `${count} పాత లైట్లను 9W LED లుగా మార్చండి`,
        category: 'Lighting Efficiency',
        currentBaseline: `${count}x ${currentWatts}W Incandescent / Tube`,
        proposedMeasure: `${count}x 9W BEE 5-Star LED`,
        annualSavings: annualSavingsINR,
        implementationCost: retrofitCost,
        paybackMonths: paybackMonths,
        co2ReductionKg: co2SavedYearly,
        includedInPlan: true,
        reasoning: `Saves ${deltaWatts}W per fixture (${(deltaWatts/currentWatts*100).toFixed(0)}% reduction). Running ${hours} hrs/day saves ${Math.round(annualKWhSaved)} units/year.`
      });
    }
  }

  // 2. Ceiling Fans BLDC Upgrade
  const fanApp = appliances.find(a => a.type === 'fan');
  if (fanApp && fanApp.watts > 35) {
    const count = Number(fanApp.count) || 1;
    const currentWatts = Number(fanApp.watts) || 75;
    const hours = Number(fanApp.hoursPerDay) || 8;
    const deltaWatts = Math.max(0, currentWatts - 28);

    const dailyKWhSaved = (count * deltaWatts * hours) / 1000;
    const annualKWhSaved = dailyKWhSaved * 365;
    const annualSavingsINR = Math.round(annualKWhSaved * tariff);
    const retrofitCost = count * ENERGY_CONSTANTS.BLDC_FAN_COST;
    const paybackMonths = annualSavingsINR > 0 ? Number(((retrofitCost / annualSavingsINR) * 12).toFixed(1)) : 12;
    const co2SavedYearly = Math.round(annualKWhSaved * ENERGY_CONSTANTS.GRID_EMISSION_FACTOR_KG_CO2_PER_KWH);

    recommendations.push({
      id: 'rec-bldc-fans',
      priority: 2,
      title: `Replace ${count} traditional ceiling fans with 28W Smart BLDC fans`,
      titleHi: `${count} पुराने छत के पंखों को 28W बीएलडीसी (BLDC) पंखों में बदलें`,
      titleTe: `${count} పాత ఫ్యాన్లను 28W BLDC ఫ్యాన్లుగా మార్చండి`,
      category: 'Motor & Ventilation',
      currentBaseline: `${count}x ${currentWatts}W Standard Induction Fans`,
      proposedMeasure: `${count}x 28W Brushless DC (BLDC) Fans`,
      annualSavings: annualSavingsINR,
      implementationCost: retrofitCost,
      paybackMonths: paybackMonths,
      co2ReductionKg: co2SavedYearly,
      includedInPlan: true,
      reasoning: `BLDC fans cut electricity draw by ~63% without losing airflow, run seamlessly on solar inverters without hum.`
    });
  }

  // 3. Diesel Generator Replacement with Decentralized Solar PV + Battery
  if (summary.hasGenerator && summary.generatorHours > 0) {
    const annualDieselSavings = summary.monthlyDieselExpense * 12;
    // Sizing solar array for backup based on actual connected generator load:
    const genLoad = summary.generatorLoadKW || Math.max(0.4, (summary.peakLoadWatts * 0.70) / 1000);
    const requiredKWh = summary.generatorHours * genLoad;
    const solarKWp = Math.max(1, Number((requiredKWh / (ENERGY_CONSTANTS.AVG_PEAK_SUN_HOURS * ENERGY_CONSTANTS.SOLAR_SYSTEM_PERFORMANCE_RATIO)).toFixed(1)));
    const batteryKWh = Math.max(2.4, Number((requiredKWh * 1.25).toFixed(1)));
    const systemCost = Math.round((solarKWp * ENERGY_CONSTANTS.SOLAR_COST_PER_KWP) + (batteryKWh * ENERGY_CONSTANTS.LFP_BATTERY_COST_PER_KWH));
    const paybackMonths = annualDieselSavings > 0 ? Number(((systemCost / annualDieselSavings) * 12).toFixed(1)) : 24;
    const annualDieselCO2 = Math.round(summary.monthlyDieselLitres * 12 * ENERGY_CONSTANTS.DIESEL_EMISSION_FACTOR_KG_CO2_PER_L);

    recommendations.push({
      id: 'rec-solar-dg-replacement',
      priority: 1,
      title: `Eliminate diesel generator with ${solarKWp} kWp Solar PV + ${batteryKWh} kWh LFP Battery`,
      titleHi: `डीजल जनरेटर हटाकर ${solarKWp} kWp सोलर एवं ${batteryKWh} kWh LFP बैटरी बैकअप लगाएं`,
      titleTe: `డీజిల్ తీసేసి ${solarKWp} kWp సోలార్ & ${batteryKWh} kWh బ్యాటరీ అమర్చండి`,
      category: 'Clean Energy Transition',
      currentBaseline: `DG Set running ${summary.generatorHours} hrs/day (${summary.monthlyDieselLitres} L diesel/mo)`,
      proposedMeasure: `${solarKWp} kWp Solar Rooftop + ${batteryKWh} kWh LFP Battery Bank`,
      annualSavings: annualDieselSavings,
      implementationCost: systemCost,
      paybackMonths: paybackMonths,
      co2ReductionKg: annualDieselCO2,
      includedInPlan: true,
      reasoning: `Replaces expensive recurring diesel expenses (₹${summary.monthlyDieselExpense}/mo) with zero-fuel solar power. Pays back in under ${paybackMonths} months with clean air.`
    });
  }

  // 4. Refrigerator / Cold Chain Optimization
  const fridgeApp = appliances.find(a => a.type === 'fridge');
  if (fridgeApp) {
    recommendations.push({
      id: 'rec-fridge-optimization',
      priority: 3,
      title: `Clean condenser coils, verify door gasket seal, and add solar surge protector`,
      titleHi: `रेफ्रिजरेटर कॉइल सफाई, डोर सील जांच एवं सोलर सर्ज प्रोटेक्टर लगाएं`,
      titleTe: `ఫ్రిజ్ కాయిల్స్ శుభ్రం చేయండి మరియు డోర్ సీల్ పరీక్షించండి`,
      category: 'Thermal Efficiency',
      currentBaseline: `Continuous 24-hr operation with dust accumulation`,
      proposedMeasure: `Gasket replacement + Monthly preventive thermal maintenance`,
      annualSavings: Math.round(300 * tariff), // ~300 kWh saved annually from tight seals
      implementationCost: 800,
      paybackMonths: 5.8,
      co2ReductionKg: Math.round(300 * ENERGY_CONSTANTS.GRID_EMISSION_FACTOR_KG_CO2_PER_KWH),
      includedInPlan: true,
      reasoning: `Dirty coils and leaky door seals increase compressor run cycles by up to 25%. Simple zero-tech maintenance provides instant savings.`
    });
  }

  return recommendations;
}

// Calculate Decentralized Solar PV System Sizing
export function calculateSolarSizing(dailyKWh, peakWatts, hasGenerator, generatorHours) {
  const effectiveDailyKWh = Math.max(2, dailyKWh);
  
  // Array capacity: Daily kWh / (Peak Sun Hours * Performance Ratio)
  const solarKWpRaw = effectiveDailyKWh / (ENERGY_CONSTANTS.AVG_PEAK_SUN_HOURS * ENERGY_CONSTANTS.SOLAR_SYSTEM_PERFORMANCE_RATIO);
  const recommendedSolarKWp = Number((Math.ceil(solarKWpRaw * 2) / 2).toFixed(1)); // round to nearest 0.5 kWp

  // Battery storage: 1 full night cycle autonomy (approx 60% of daily load)
  const batteryKWhRaw = effectiveDailyKWh * 0.65;
  const recommendedBatteryKWh = Number(Math.max(2.4, Math.ceil(batteryKWhRaw * 10) / 10).toFixed(1));

  // Inverter rating: Peak load + 30% surge margin
  const inverterWatts = (peakWatts || 1000) * 1.35;
  const recommendedInverterKVA = Number((Math.ceil(inverterWatts / 500) * 0.5).toFixed(1));

  // Estimated daily clean solar generation
  const estDailySolarGen = Number((recommendedSolarKWp * ENERGY_CONSTANTS.AVG_PEAK_SUN_HOURS * ENERGY_CONSTANTS.SOLAR_SYSTEM_PERFORMANCE_RATIO).toFixed(1));

  // Cost estimate
  const estimatedCost = Math.round(
    (recommendedSolarKWp * ENERGY_CONSTANTS.SOLAR_COST_PER_KWP) +
    (recommendedBatteryKWh * ENERGY_CONSTANTS.LFP_BATTERY_COST_PER_KWH) +
    (recommendedInverterKVA * 12000)
  );

  return {
    recommendedSolarKWp,
    recommendedBatteryKWh,
    recommendedInverterKVA,
    estDailySolarGen,
    estimatedCost
  };
}
