// 个人所得税计算器
// 参考：财政部 税务总局公告2023年第30号

// ========== 税率表 ==========

// 按月换算后的综合所得税率表（用于全年一次性奖金单独计税）
export const monthlyTaxRateTable = [
  { limit: 3000, rate: 0.03, deduction: 0 },
  { limit: 12000, rate: 0.10, deduction: 210 },
  { limit: 25000, rate: 0.20, deduction: 1410 },
  { limit: 35000, rate: 0.25, deduction: 2660 },
  { limit: 55000, rate: 0.30, deduction: 4410 },
  { limit: 80000, rate: 0.35, deduction: 7160 },
  { limit: Infinity, rate: 0.45, deduction: 15160 },
];

// 综合所得年度税率表（用于并入综合所得计税）
export const annualTaxRateTable = [
  { limit: 36000, rate: 0.03, deduction: 0 },
  { limit: 144000, rate: 0.10, deduction: 2520 },
  { limit: 300000, rate: 0.20, deduction: 16920 },
  { limit: 420000, rate: 0.25, deduction: 31920 },
  { limit: 660000, rate: 0.30, deduction: 52920 },
  { limit: 960000, rate: 0.35, deduction: 85920 },
  { limit: Infinity, rate: 0.45, deduction: 181920 },
];

// ========== 专项附加扣除配置 ==========

// 专项附加扣除项目配置
export const specialDeductionConfig = {
  // 子女教育：每个子女每月2000元
  childEducation: {
    name: '子女教育',
    monthlyAmount: 2000,
    description: '每个子女每月2000元',
    maxChildren: 10,
  },
  // 3岁以下婴幼儿照护：每个婴幼儿每月2000元
  infantCare: {
    name: '3岁以下婴幼儿照护',
    monthlyAmount: 2000,
    description: '每个婴幼儿每月2000元',
    maxChildren: 10,
  },
  // 赡养老人
  elderlyCare: {
    name: '赡养老人',
    description: '独生子女每月3000元；非独生子女分摊每月3000元',
    onlyChildAmount: 3000,
    nonOnlyChildTotal: 3000,
  },
  // 住房贷款利息：每月1000元
  housingLoan: {
    name: '住房贷款利息',
    monthlyAmount: 1000,
    description: '每月1000元',
  },
  // 住房租金：根据城市等级不同
  housingRent: {
    name: '住房租金',
    description: '根据城市规模不同',
    tiers: [
      { label: '直辖市/省会/计划单列市等', amount: 1500 },
      { label: '市辖区户籍人口>100万', amount: 1100 },
      { label: '市辖区户籍人口≤100万', amount: 800 },
    ],
  },
  // 继续教育
  continuingEducation: {
    name: '继续教育',
    description: '学历教育每月400元；职业资格当年3600元',
    degreeMonthly: 400,
    certificateYearly: 3600,
  },
  // 大病医疗：据实扣除，限额80000元
  seriousIllness: {
    name: '大病医疗',
    description: '据实扣除，每年限额80000元',
    maxAmount: 80000,
  },
};

// 基本减除费用（每月5000元 × 12个月）
export const BASIC_DEDUCTION = 60000;

// ========== 查找适用税率 ==========

function findTaxRate(amount: number, table: typeof monthlyTaxRateTable) {
  for (const bracket of table) {
    if (amount <= bracket.limit) {
      return bracket;
    }
  }
  return table[table.length - 1];
}

// ========== 专项附加扣除计算 ==========

export interface SpecialDeductionsInput {
  childEducation: number;      // 子女数量
  infantCare: number;          // 3岁以下婴幼儿数量
  elderlyCare: {
    isOnlyChild: boolean;      // 是否独生子女
    siblingsCount?: number;    // 兄弟姐妹人数（非独生子女时）
    personalShare?: number;    // 个人分摊金额
  };
  housingLoan: boolean;        // 是否有住房贷款利息
  housingRent: {
    hasRent: boolean;          // 是否有租房
    tierIndex: number;         // 城市等级 0=1500, 1=1100, 2=800
  };
  continuingEducation: {
    degree: boolean;           // 是否学历教育
    degreeMonths: number;      // 学历教育月数（最多48个月）
    certificate: boolean;      // 是否职业资格
  };
  seriousIllness: number;      // 大病医疗实际支出金额
}

// 计算专项附加扣除总额
export function calculateSpecialDeductions(input: SpecialDeductionsInput): {
  total: number;
  breakdown: { name: string; amount: number }[];
} {
  const breakdown: { name: string; amount: number }[] = [];
  let total = 0;

  // 子女教育
  if (input.childEducation > 0) {
    const amount = input.childEducation * specialDeductionConfig.childEducation.monthlyAmount * 12;
    total += amount;
    breakdown.push({
      name: `子女教育 (${input.childEducation}个子女)`,
      amount,
    });
  }

  // 3岁以下婴幼儿照护
  if (input.infantCare > 0) {
    const amount = input.infantCare * specialDeductionConfig.infantCare.monthlyAmount * 12;
    total += amount;
    breakdown.push({
      name: `3岁以下婴幼儿照护 (${input.infantCare}个)`,
      amount,
    });
  }

  // 赡养老人
  if (input.elderlyCare.isOnlyChild) {
    const amount = specialDeductionConfig.elderlyCare.onlyChildAmount * 12;
    total += amount;
    breakdown.push({
      name: '赡养老人 (独生子女)',
      amount,
    });
  } else if (input.elderlyCare.personalShare && input.elderlyCare.personalShare > 0) {
    const amount = input.elderlyCare.personalShare * 12;
    total += amount;
    breakdown.push({
      name: `赡养老人 (分摊${input.elderlyCare.personalShare}元/月)`,
      amount,
    });
  }

  // 住房贷款利息（与住房租金二选一）
  if (input.housingLoan && !input.housingRent.hasRent) {
    const amount = specialDeductionConfig.housingLoan.monthlyAmount * 12;
    total += amount;
    breakdown.push({
      name: '住房贷款利息',
      amount,
    });
  }

  // 住房租金（与住房贷款利息二选一）
  if (input.housingRent.hasRent && !input.housingLoan) {
    const tier = specialDeductionConfig.housingRent.tiers[input.housingRent.tierIndex] || specialDeductionConfig.housingRent.tiers[2];
    const amount = tier.amount * 12;
    total += amount;
    breakdown.push({
      name: `住房租金 (${tier.label})`,
      amount,
    });
  }

  // 继续教育
  if (input.continuingEducation.degree) {
    const months = Math.min(input.continuingEducation.degreeMonths, 48);
    const amount = specialDeductionConfig.continuingEducation.degreeMonthly * months;
    total += amount;
    breakdown.push({
      name: `继续教育-学历 (${months}个月)`,
      amount,
    });
  }
  if (input.continuingEducation.certificate) {
    total += specialDeductionConfig.continuingEducation.certificateYearly;
    breakdown.push({
      name: '继续教育-职业资格',
      amount: specialDeductionConfig.continuingEducation.certificateYearly,
    });
  }

  // 大病医疗
  if (input.seriousIllness > 0) {
    const amount = Math.min(
      input.seriousIllness,
      specialDeductionConfig.seriousIllness.maxAmount
    );
    total += amount;
    breakdown.push({
      name: '大病医疗',
      amount,
    });
  }

  return { total, breakdown };
}

// ========== 核心计税函数 ==========

// 计算全年一次性奖金单独计税
export function calculateSeparateTax(bonus: number): {
  tax: number;
  rate: number;
  deduction: number;
  monthlyAverage: number;
} {
  if (bonus <= 0) {
    return { tax: 0, rate: 0, deduction: 0, monthlyAverage: 0 };
  }

  const monthlyAverage = bonus / 12;
  const bracket = findTaxRate(monthlyAverage, monthlyTaxRateTable);
  const tax = bonus * bracket.rate - bracket.deduction;

  return {
    tax: Math.max(0, tax),
    rate: bracket.rate,
    deduction: bracket.deduction,
    monthlyAverage,
  };
}

// 计算综合所得计税
export function calculateCombinedTax(
  annualSalary: number,
  bonus: number,
  deductions: {
    basicDeduction: number;      // 基本减除费用（通常60000）
    socialInsurance: number;     // 三险一金
    specialAdditional: number;   // 专项附加扣除
    otherDeductions: number;     // 其他扣除
  }
): {
  tax: number;
  rate: number;
  deduction: number;
  taxableIncome: number;
} {
  const totalIncome = annualSalary + bonus;
  const totalDeductions =
    deductions.basicDeduction +
    deductions.socialInsurance +
    deductions.specialAdditional +
    deductions.otherDeductions;

  const taxableIncome = Math.max(0, totalIncome - totalDeductions);
  const bracket = findTaxRate(taxableIncome, annualTaxRateTable);
  const tax = taxableIncome * bracket.rate - bracket.deduction;

  return {
    tax: Math.max(0, tax),
    rate: bracket.rate,
    deduction: bracket.deduction,
    taxableIncome,
  };
}

// 计算仅工资（不含奖金）的综合所得税
export function calculateSalaryOnlyTax(
  annualSalary: number,
  deductions: {
    basicDeduction: number;
    socialInsurance: number;
    specialAdditional: number;
    otherDeductions: number;
  }
): {
  tax: number;
  rate: number;
  deduction: number;
  taxableIncome: number;
} {
  const totalDeductions =
    deductions.basicDeduction +
    deductions.socialInsurance +
    deductions.specialAdditional +
    deductions.otherDeductions;

  const taxableIncome = Math.max(0, annualSalary - totalDeductions);
  const bracket = findTaxRate(taxableIncome, annualTaxRateTable);
  const tax = taxableIncome * bracket.rate - bracket.deduction;

  return {
    tax: Math.max(0, tax),
    rate: bracket.rate,
    deduction: bracket.deduction,
    taxableIncome,
  };
}

// ========== 优化方案计算 ==========

// 优化方案类型
export interface OptimizationResult {
  separateAmount: number;      // 单独计税金额
  combinedAmount: number;      // 并入综合所得金额
  separateTax: number;         // 单独计税部分税额
  combinedTax: number;         // 并入部分税额
  totalTax: number;            // 总税额
  salaryTax: number;           // 仅工资税额
  savings: number;             // 节税金额
  description: string;         // 方案描述
}

// 寻找最优分配方案
export function findOptimalAllocation(
  totalBonus: number,
  annualSalary: number,
  deductions: {
    basicDeduction: number;
    socialInsurance: number;
    specialAdditional: number;
    otherDeductions: number;
  }
): OptimizationResult[] {
  const results: OptimizationResult[] = [];

  // 方案1：全部单独计税
  const allSeparate = calculateSeparateTax(totalBonus);
  const salaryOnlyTax1 = calculateSalaryOnlyTax(annualSalary, deductions);
  results.push({
    separateAmount: totalBonus,
    combinedAmount: 0,
    separateTax: allSeparate.tax,
    combinedTax: 0,
    totalTax: allSeparate.tax + salaryOnlyTax1.tax,
    salaryTax: salaryOnlyTax1.tax,
    savings: 0,
    description: "全部单独计税",
  });

  // 方案2：全部并入综合所得
  const allCombined = calculateCombinedTax(annualSalary, totalBonus, deductions);
  results.push({
    separateAmount: 0,
    combinedAmount: totalBonus,
    separateTax: 0,
    combinedTax: allCombined.tax,
    totalTax: allCombined.tax,
    salaryTax: salaryOnlyTax1.tax,
    savings: 0,
    description: "全部并入综合所得",
  });

  // 方案3：寻找最优分割点
  let optimalResult = results[0];
  let minTax = results[0].totalTax;

  // 以1000元为步长进行搜索（提高效率）
  for (let separateAmount = 0; separateAmount <= totalBonus; separateAmount += 1000) {
    const combinedAmount = totalBonus - separateAmount;

    const separateResult = calculateSeparateTax(separateAmount);
    const combinedResult = calculateCombinedTax(annualSalary, combinedAmount, deductions);

    const totalTax = separateResult.tax + combinedResult.tax;

    if (totalTax < minTax) {
      minTax = totalTax;
      optimalResult = {
        separateAmount,
        combinedAmount,
        separateTax: separateResult.tax,
        combinedTax: combinedResult.tax,
        totalTax,
        salaryTax: combinedResult.tax - (combinedResult.taxableIncome > 0 ?
          Math.max(0, (combinedResult.taxableIncome - combinedAmount) * combinedResult.rate - combinedResult.deduction) : 0),
        savings: 0,
        description: `智能拆分：${separateAmount.toFixed(0)}元单独计税，${combinedAmount.toFixed(0)}元并入综合所得`,
      };
    }
  }

  // 计算节税金额（相对于最差方案）
  const maxTax = Math.max(results[0].totalTax, results[1].totalTax);
  results.forEach(r => {
    r.savings = maxTax - r.totalTax;
  });
  optimalResult.savings = maxTax - optimalResult.totalTax;

  // 如果有更优的拆分方案，添加到结果中
  if (optimalResult.separateAmount > 0 && optimalResult.combinedAmount > 0) {
    results.push(optimalResult);
  }

  // 按总税额排序
  return results.sort((a, b) => a.totalTax - b.totalTax);
}

// ========== 工具函数 ==========

// 获取税率表信息
export function getTaxRateInfo(monthlyAmount: number) {
  return findTaxRate(monthlyAmount, monthlyTaxRateTable);
}

// 获取综合所得税率信息
export function getCombinedTaxRateInfo(annualAmount: number) {
  return findTaxRate(annualAmount, annualTaxRateTable);
}

// 计算税后收入
export function calculateNetIncome(
  annualSalary: number,
  bonus: number,
  totalTax: number,
  socialInsurance: number
): number {
  return annualSalary + bonus - totalTax - socialInsurance;
}
