import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { SpecialDeductionForm } from '@/components/SpecialDeductionForm';
import { 
  Calculator, 
  TrendingDown, 
  Info, 
  CheckCircle2, 
  DollarSign,
  Lightbulb,
  AlertCircle,
  Wallet,
  PiggyBank,
  Receipt,
  Building2,
  Sparkles,
  
} from 'lucide-react';
import { 
  calculateSeparateTax, 
  calculateCombinedTax, 
  calculateSalaryOnlyTax,
  findOptimalAllocation,
  monthlyTaxRateTable,
  annualTaxRateTable,
  BASIC_DEDUCTION,
  calculateNetIncome
} from '@/lib/tax-calculator';
import { cn } from '@/lib/utils';

function App() {
  // 输入状态
  const [annualSalary, setAnnualSalary] = useState<string>('');
  const [bonus, setBonus] = useState<string>('');
  const [socialInsurance, setSocialInsurance] = useState<string>('');
  const [otherDeductions, setOtherDeductions] = useState<string>('');
  const [specialDeductionTotal, setSpecialDeductionTotal] = useState<number>(0);
  const [specialDeductionBreakdown, setSpecialDeductionBreakdown] = useState<{name: string; amount: number}[]>([]);
  const [showResults, setShowResults] = useState(false);

  // 解析数值
  const parsedValues = useMemo(() => ({
    annualSalary: parseFloat(annualSalary) || 0,
    bonus: parseFloat(bonus) || 0,
    socialInsurance: parseFloat(socialInsurance) || 0,
    otherDeductions: parseFloat(otherDeductions) || 0,
    specialAdditional: specialDeductionTotal,
  }), [annualSalary, bonus, socialInsurance, otherDeductions, specialDeductionTotal]);

  // 计算结果
  const calculationResults = useMemo(() => {
    if (!showResults) return null;
    
    const { annualSalary, bonus, socialInsurance, specialAdditional, otherDeductions } = parsedValues;
    
    const deductions = {
      basicDeduction: BASIC_DEDUCTION,
      socialInsurance,
      specialAdditional,
      otherDeductions,
    };

    // 单独计税
    const separateResult = calculateSeparateTax(bonus);
    const salaryOnlyTax = calculateSalaryOnlyTax(annualSalary, deductions);
    const separateTotalTax = separateResult.tax + salaryOnlyTax.tax;

    // 并入综合所得
    const combinedResult = calculateCombinedTax(annualSalary, bonus, deductions);

    // 寻找最优方案
    const optimalResults = findOptimalAllocation(bonus, annualSalary, deductions);

    // 计算税后收入
    const netIncome = {
      separate: calculateNetIncome(annualSalary, bonus, separateTotalTax, socialInsurance),
      combined: calculateNetIncome(annualSalary, bonus, combinedResult.tax, socialInsurance),
    };

    return {
      separateResult,
      salaryOnlyTax,
      separateTotalTax,
      combinedResult,
      optimalResults,
      netIncome,
      deductions,
    };
  }, [parsedValues, showResults]);

  const handleCalculate = () => {
    if (parsedValues.annualSalary > 0 || parsedValues.bonus > 0) {
      setShowResults(true);
    }
  };

  const handleSpecialDeductionChange = useCallback((total: number, breakdown: {name: string; amount: number}[]) => {
    setSpecialDeductionTotal(total);
    setSpecialDeductionBreakdown(breakdown);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 头部 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            个人所得税优化计算器
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            针对全年一次性奖金，智能分析最优计税方案，帮您合法节税
          </p>
          <p className="text-sm text-slate-500">
            政策依据：财政部 税务总局公告2023年第30号（有效期至2027年12月31日）
          </p>
        </div>

        {/* 输入区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 收入信息 */}
          <Card className="shadow-lg border-0 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                收入信息录入
              </CardTitle>
              <CardDescription>
                请填写您的年度收入和扣除信息，系统将自动计算最优方案
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 收入和扣除 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="annualSalary" className="text-slate-700">
                    年度工资薪金收入 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                    <Input
                      id="annualSalary"
                      type="number"
                      placeholder="例如：200000"
                      value={annualSalary}
                      onChange={(e) => setAnnualSalary(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-slate-500">全年税前工资总额（不含奖金）</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bonus" className="text-slate-700">
                    全年一次性奖金 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                    <Input
                      id="bonus"
                      type="number"
                      placeholder="例如：50000"
                      value={bonus}
                      onChange={(e) => setBonus(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-slate-500">年终奖金额</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialInsurance" className="text-slate-700">
                    三险一金（年累计）
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                    <Input
                      id="socialInsurance"
                      type="number"
                      placeholder="例如：24000"
                      value={socialInsurance}
                      onChange={(e) => setSocialInsurance(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-slate-500">养老、医疗、失业保险和住房公积金</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherDeductions" className="text-slate-700">
                    其他扣除
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                    <Input
                      id="otherDeductions"
                      type="number"
                      placeholder="例如：0"
                      value={otherDeductions}
                      onChange={(e) => setOtherDeductions(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-slate-500">企业年金、商业健康保险、公益捐赠等</p>
                </div>
              </div>

              {/* 基本减除费用说明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Receipt className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">基本减除费用</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      按照税法规定，每位纳税人每年可享受 <strong>60,000元</strong> 的基本减除费用
                      （相当于每月 <strong>5,000元</strong> 的个税起征点）
                    </p>
                    <div className="mt-2 text-sm text-blue-600">
                      年扣除额 = 5,000元/月 × 12个月 = 60,000元
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-900">{formatCurrency(60000)}</div>
                    <div className="text-xs text-blue-600">/年</div>
                  </div>
                </div>
              </div>

              {/* 专项附加扣除 */}
              <SpecialDeductionForm 
                onChange={handleSpecialDeductionChange} 
                defaultExpanded={false}
              />

              {/* 计算按钮 */}
              <Button 
                onClick={handleCalculate}
                className="w-full h-12 text-lg"
                size="lg"
              >
                <Calculator className="w-5 h-5 mr-2" />
                计算最优方案
              </Button>
            </CardContent>
          </Card>

          {/* 扣除汇总卡片 */}
          <Card className="shadow-lg border-0 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5 text-primary" />
                扣除项目汇总
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 各项扣除 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-slate-700">基本减除费用</span>
                  </div>
                  <span className="font-medium">{formatCurrency(BASIC_DEDUCTION)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-slate-700">三险一金</span>
                  </div>
                  <span className="font-medium">{formatCurrency(parsedValues.socialInsurance)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-slate-700">专项附加扣除</span>
                    {specialDeductionBreakdown.length > 0 && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {specialDeductionBreakdown.length}项
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{formatCurrency(specialDeductionTotal)}</span>
                </div>

                {specialDeductionBreakdown.length > 0 && (
                  <div className="pl-4 space-y-1">
                    {specialDeductionBreakdown.map((item, index) => (
                      <div key={index} className="flex justify-between text-xs text-slate-500">
                        <span>• {item.name}</span>
                        <span>{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-slate-700">其他扣除</span>
                  </div>
                  <span className="font-medium">{formatCurrency(parsedValues.otherDeductions)}</span>
                </div>
              </div>

              <Separator />

              {/* 总扣除 */}
              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                <span className="font-semibold text-primary">年度总扣除额</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(
                    BASIC_DEDUCTION + 
                    parsedValues.socialInsurance + 
                    specialDeductionTotal + 
                    parsedValues.otherDeductions
                  )}
                </span>
              </div>

              {/* 速算参考 */}
              <div className="text-xs text-slate-500 space-y-1">
                <p>💡 专项附加扣除速算参考：</p>
                <ul className="list-disc list-inside pl-2 space-y-0.5">
                  <li>子女教育：2,000元/月/每个</li>
                  <li>3岁以下婴幼儿：2,000元/月/每个</li>
                  <li>赡养老人：3,000元/月（独生子女）</li>
                  <li>房贷利息：1,000元/月</li>
                  <li>住房租金：800-1,500元/月</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 计算结果 */}
        {calculationResults && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 推荐方案 */}
            <Card className="shadow-lg border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  最优方案推荐
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const best = calculationResults.optimalResults[0];
                  const isSplit = best.separateAmount > 0 && best.combinedAmount > 0;
                  return (
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <Badge className="w-fit text-lg px-4 py-2" variant="default">
                          {best.description}
                        </Badge>
                        {best.savings > 0 && (
                          <div className="flex items-center gap-2 text-green-600">
                            <TrendingDown className="w-5 h-5" />
                            <span className="font-semibold">
                              可节税 {formatCurrency(best.savings)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-slate-500">预计总税额</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency(best.totalTax)}</p>
                        </div>
                        
                        {isSplit ? (
                          <>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <p className="text-sm text-slate-500">单独计税部分</p>
                              <p className="text-xl font-semibold text-slate-900">{formatCurrency(best.separateAmount)}</p>
                              <p className="text-sm text-slate-500">税额: {formatCurrency(best.separateTax)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <p className="text-sm text-slate-500">并入综合所得部分</p>
                              <p className="text-xl font-semibold text-slate-900">{formatCurrency(best.combinedAmount)}</p>
                              <p className="text-sm text-slate-500">税额: {formatCurrency(best.combinedTax)}</p>
                            </div>
                          </>
                        ) : (
                          <div className="bg-white rounded-lg p-4 shadow-sm md:col-span-2">
                            <p className="text-sm text-slate-500">
                              {best.separateAmount > 0 ? '奖金单独计税' : '奖金并入综合所得'}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              工资应纳税额: {formatCurrency(best.salaryTax)}
                            </p>
                          </div>
                        )}
                        
                        <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
                          <p className="text-sm text-green-700">预计税后收入</p>
                          <p className="text-2xl font-bold text-green-700">
                            {formatCurrency(
                              calculateNetIncome(
                                parsedValues.annualSalary,
                                parsedValues.bonus,
                                best.totalTax,
                                parsedValues.socialInsurance
                              )
                            )}
                          </p>
                        </div>
                      </div>

                      {/* 操作提示 */}
                      {isSplit && (
                        <Alert className="bg-amber-50 border-amber-200">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <AlertDescription className="text-amber-800 text-sm">
                            <strong>操作建议：</strong>您可以与公司HR沟通，将奖金拆分为两部分发放，
                            {formatCurrency(best.separateAmount)} 元按全年一次性奖金单独计税，
                            {formatCurrency(best.combinedAmount)} 元并入当月工资按综合所得计税。
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* 详细对比 */}
            <Tabs defaultValue="comparison" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="comparison">方案对比</TabsTrigger>
                <TabsTrigger value="details">计算详情</TabsTrigger>
                <TabsTrigger value="analysis">税负分析</TabsTrigger>
                <TabsTrigger value="rates">税率表</TabsTrigger>
              </TabsList>

              <TabsContent value="comparison" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>计税方案对比</CardTitle>
                    <CardDescription>
                      不同计税方式下的税负对比，帮您做出最优选择
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {calculationResults.optimalResults.map((result, index) => (
                        <div 
                          key={index}
                          className={cn(
                            "p-4 rounded-lg border-2 transition-all",
                            index === 0 
                              ? "border-primary bg-primary/5" 
                              : "border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {index === 0 ? (
                                <CheckCircle2 className="w-6 h-6 text-primary" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                                  {index + 1}
                                </div>
                              )}
                              <div>
                                <p className={cn(
                                  "font-semibold",
                                  index === 0 ? "text-primary" : "text-slate-700"
                                )}>
                                  {result.description}
                                </p>
                                <p className="text-sm text-slate-500">
                                  总税额: {formatCurrency(result.totalTax)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-slate-500">税后收入</p>
                                <p className={cn(
                                  "font-semibold",
                                  index === 0 ? "text-primary" : "text-slate-700"
                                )}>
                                  {formatCurrency(
                                    calculateNetIncome(
                                      parsedValues.annualSalary,
                                      parsedValues.bonus,
                                      result.totalTax,
                                      parsedValues.socialInsurance
                                    )
                                  )}
                                </p>
                              </div>
                              {result.savings > 0 ? (
                                <Badge variant="secondary" className="text-green-600 bg-green-50">
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                  省 {formatCurrency(result.savings)}
                                </Badge>
                              ) : index > 0 ? (
                                <Badge variant="secondary" className="text-slate-500">
                                  基准
                                </Badge>
                              ) : (
                                <Badge variant="default">最优</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 单独计税详情 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        单独计税详情
                        {calculationResults.optimalResults[0].separateAmount === parsedValues.bonus && (
                          <Badge variant="default" className="text-xs">推荐</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">奖金金额</span>
                        <span className="font-medium">{formatCurrency(parsedValues.bonus)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">月均金额（÷12）</span>
                        <span className="font-medium">{formatCurrency(calculationResults.separateResult.monthlyAverage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">适用税率</span>
                        <span className="font-medium">{(calculationResults.separateResult.rate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">速算扣除数</span>
                        <span className="font-medium">{formatCurrency(calculationResults.separateResult.deduction)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-semibold">
                        <span>奖金应纳税额</span>
                        <span className="text-primary">{formatCurrency(calculationResults.separateResult.tax)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">工资应纳税额</span>
                        <span className="font-medium">{formatCurrency(calculationResults.salaryOnlyTax.tax)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold">
                        <span>合计应纳税额</span>
                        <span className="text-primary">{formatCurrency(calculationResults.separateTotalTax)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 并入综合所得详情 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        并入综合所得详情
                        {calculationResults.optimalResults[0].combinedAmount === parsedValues.bonus && (
                          <Badge variant="default" className="text-xs">推荐</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">年度总收入</span>
                        <span className="font-medium">{formatCurrency(parsedValues.annualSalary + parsedValues.bonus)}</span>
                      </div>
                      <Separator />
                      <p className="text-sm font-medium text-slate-700">扣除项目：</p>
                      <div className="pl-4 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">基本减除费用 (5000元/月)</span>
                          <span>{formatCurrency(BASIC_DEDUCTION)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">三险一金</span>
                          <span>{formatCurrency(parsedValues.socialInsurance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">专项附加扣除</span>
                          <span>{formatCurrency(parsedValues.specialAdditional)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">其他扣除</span>
                          <span>{formatCurrency(parsedValues.otherDeductions)}</span>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-slate-600">应纳税所得额</span>
                        <span className="font-medium">{formatCurrency(calculationResults.combinedResult.taxableIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">适用税率</span>
                        <span className="font-medium">{(calculationResults.combinedResult.rate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold">
                        <span>应纳税额</span>
                        <span className="text-primary">{formatCurrency(calculationResults.combinedResult.tax)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>税负分析</CardTitle>
                    <CardDescription>
                      直观对比不同计税方式下的税后收入差异
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* 收入构成 */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">您的收入构成</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-xs text-slate-500">工资薪金</p>
                            <p className="text-lg font-semibold text-blue-700">{formatCurrency(parsedValues.annualSalary)}</p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-xs text-slate-500">年终奖金</p>
                            <p className="text-lg font-semibold text-purple-700">{formatCurrency(parsedValues.bonus)}</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-xs text-slate-500">税前总收入</p>
                            <p className="text-lg font-semibold text-green-700">
                              {formatCurrency(parsedValues.annualSalary + parsedValues.bonus)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* 方案对比图表 */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">不同方案税后收入对比</h4>
                        <div className="space-y-3">
                          {calculationResults.optimalResults.map((result, index) => {
                            const netIncome = calculateNetIncome(
                              parsedValues.annualSalary,
                              parsedValues.bonus,
                              result.totalTax,
                              parsedValues.socialInsurance
                            );
                            const maxIncome = calculateNetIncome(
                              parsedValues.annualSalary,
                              parsedValues.bonus,
                              calculationResults.optimalResults[0].totalTax,
                              parsedValues.socialInsurance
                            );
                            const percentage = maxIncome > 0 ? (netIncome / maxIncome) * 100 : 0;
                            
                            return (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className={cn(
                                    "font-medium",
                                    index === 0 ? "text-primary" : "text-slate-600"
                                  )}>
                                    {result.description}
                                  </span>
                                  <span className="font-semibold">{formatCurrency(netIncome)}</span>
                                </div>
                                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all duration-500",
                                      index === 0 ? "bg-primary" : "bg-slate-300"
                                    )}
                                    style={{ width: `${Math.max(percentage, 5)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                  <span>税额: {formatCurrency(result.totalTax)}</span>
                                  {result.savings > 0 && (
                                    <span className="text-green-600">比基准方案省 {formatCurrency(result.savings)}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 建议说明 */}
                      <Alert className="bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800 text-sm">
                          <strong>计算说明：</strong>
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                            <li>税后收入 = 税前收入 - 个人所得税 - 三险一金</li>
                            <li>以上计算未考虑五险一金个人缴纳部分对税基的影响</li>
                            <li>实际纳税以税务机关核定为准</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rates" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">月度税率表（单独计税用）</CardTitle>
                      <CardDescription>全年一次性奖金÷12后查找税率</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-slate-50">
                              <th className="text-left py-2 px-2">级数</th>
                              <th className="text-left py-2 px-2">月均应纳税所得额</th>
                              <th className="text-left py-2 px-2">税率</th>
                              <th className="text-left py-2 px-2">速算扣除数</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyTaxRateTable.map((rate, index) => (
                              <tr key={index} className="border-b last:border-0 hover:bg-slate-50">
                                <td className="py-2 px-2">{index + 1}</td>
                                <td className="py-2 px-2">
                                  {index === 0 ? `不超过${formatNumber(rate.limit)}元` : 
                                   rate.limit === Infinity ? `超过${formatNumber(monthlyTaxRateTable[index-1].limit)}元` :
                                   `超过${formatNumber(monthlyTaxRateTable[index-1].limit)}元至${formatNumber(rate.limit)}元`}
                                </td>
                                <td className="py-2 px-2 font-medium">{(rate.rate * 100).toFixed(0)}%</td>
                                <td className="py-2 px-2">{formatNumber(rate.deduction)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">年度税率表（综合所得用）</CardTitle>
                      <CardDescription>工资薪金等综合所得适用</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-slate-50">
                              <th className="text-left py-2 px-2">级数</th>
                              <th className="text-left py-2 px-2">年度应纳税所得额</th>
                              <th className="text-left py-2 px-2">税率</th>
                              <th className="text-left py-2 px-2">速算扣除数</th>
                            </tr>
                          </thead>
                          <tbody>
                            {annualTaxRateTable.map((rate, index) => (
                              <tr key={index} className="border-b last:border-0 hover:bg-slate-50">
                                <td className="py-2 px-2">{index + 1}</td>
                                <td className="py-2 px-2">
                                  {index === 0 ? `不超过${formatNumber(rate.limit)}元` : 
                                   rate.limit === Infinity ? `超过${formatNumber(annualTaxRateTable[index-1].limit)}元` :
                                   `超过${formatNumber(annualTaxRateTable[index-1].limit)}元至${formatNumber(rate.limit)}元`}
                                </td>
                                <td className="py-2 px-2 font-medium">{(rate.rate * 100).toFixed(0)}%</td>
                                <td className="py-2 px-2">{formatNumber(rate.deduction)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* 重要提示 */}
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>重要提示：</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>全年一次性奖金单独计税政策每个纳税人每年只能享受一次</li>
                  <li>如果年内多次获得奖金，建议将单独计税机会留给金额最大的一笔</li>
                  <li>税款所属期以奖金实际发放时间为准，与奖金归属的考核年度无关</li>
                  <li>本计算器结果仅供参考，实际纳税以税务机关核定为准</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* 使用说明 */}
        {!showResults && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                使用说明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h3 className="font-semibold">填写收入信息</h3>
                  <p className="text-sm text-slate-600">
                    输入您的年度工资薪金、年终奖金以及各项扣除信息，包括三险一金和专项附加扣除
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h3 className="font-semibold">智能计算分析</h3>
                  <p className="text-sm text-slate-600">
                    系统自动计算单独计税、并入综合所得以及智能拆分等多种方案的税负
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h3 className="font-semibold">获取最优方案</h3>
                  <p className="text-sm text-slate-600">
                    查看推荐方案，了解如何合法节税，做出最优选择。支持奖金拆分建议
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 政策说明 */}
        <Card className="shadow-md bg-slate-50">
          <CardHeader>
            <CardTitle className="text-base">政策说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              <strong>全年一次性奖金</strong>是指行政机关、企事业单位等扣缴义务人根据其全年经济效益和对雇员全年工作业绩的综合考核情况，向雇员发放的一次性奖金，包括年终加薪、实行年薪制和绩效工资办法的单位根据考核情况兑现的年薪和绩效工资。
            </p>
            <p>
              根据《财政部 税务总局关于延续实施全年一次性奖金个人所得税政策的公告》（财政部 税务总局公告2023年第30号），
              <strong>全年一次性奖金个人所得税政策延续实施至2027年12月31日</strong>。
            </p>
            <p>
              居民个人取得全年一次性奖金，可以选择<strong>单独计税</strong>或<strong>并入当年综合所得</strong>计算纳税。
              单独计税是指将年终奖除以12个月，按月度税率表确定税率和速算扣除数，单独计算税款。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
