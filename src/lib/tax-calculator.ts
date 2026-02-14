// 个人所得税计算器
// 参考：财政部 税务总局公告2023年第30号

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

// 查找适用税率
function findTaxRate(amount: number, table: typeof monthlyTaxRateTable) {
  for (const bracket of table) {
    if (amount <= bracket.limit) {
      return bracket;
    }
  }
  return table[table.length - 1];
}

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
  // 策略：尝试不同的分配比例，找出最优解
  let optimalResult = results[0];
  let minTax = results[0].totalTax;
  
  // 以100元为步长进行搜索
  for (let separateAmount = 0; separateAmount <= totalBonus; separateAmount += 100) {
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
        description: `拆分计税：${separateAmount.toFixed(0)}元单独计税，${combinedAmount.toFixed(0)}元并入综合所得`,
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

// 获取税率表信息
export function getTaxRateInfo(monthlyAmount: number) {
  return findTaxRate(monthlyAmount, monthlyTaxRateTable);
}

// 获取综合所得税率信息
export function getCombinedTaxRateInfo(annualAmount: number) {
  return findTaxRate(annualAmount, annualTaxRateTable);
}
