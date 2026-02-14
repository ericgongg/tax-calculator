import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  TrendingDown, 
  Info, 
  CheckCircle2, 
  DollarSign,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { 
  calculateSeparateTax, 
  calculateCombinedTax, 
  calculateSalaryOnlyTax,
  findOptimalAllocation,
  monthlyTaxRateTable,
  annualTaxRateTable
} from '@/lib/tax-calculator';
import { cn } from '@/lib/utils';

function App() {
  // 输入状态
  const [annualSalary, setAnnualSalary] = useState<string>('');
  const [bonus, setBonus] = useState<string>('');
  const [socialInsurance, setSocialInsurance] = useState<string>('');
  const [specialAdditional, setSpecialAdditional] = useState<string>('');
  const [otherDeductions, setOtherDeductions] = useState<string>('');
  const [showResults, setShowResults] = useState(false);

  // 解析数值
  const parsedValues = useMemo(() => ({
    annualSalary: parseFloat(annualSalary) || 0,
    bonus: parseFloat(bonus) || 0,
    socialInsurance: parseFloat(socialInsurance) || 0,
    specialAdditional: parseFloat(specialAdditional) || 0,
    otherDeductions: parseFloat(otherDeductions) || 0,
  }), [annualSalary, bonus, socialInsurance, specialAdditional, otherDeductions]);

  // 计算结果
  const calculationResults = useMemo(() => {
    if (!showResults) return null;
    
    const { annualSalary, bonus, socialInsurance, specialAdditional, otherDeductions } = parsedValues;
    
    const deductions = {
      basicDeduction: 60000,
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

    return {
      separateResult,
      salaryOnlyTax,
      separateTotalTax,
      combinedResult,
      optimalResults,
    };
  }, [parsedValues, showResults]);

  const handleCalculate = () => {
    if (parsedValues.annualSalary > 0 || parsedValues.bonus > 0) {
      setShowResults(true);
    }
  };

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
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Calculator className="w-4 h-4" />
            2025年最新税率
          </div>
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
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              收入信息录入
            </CardTitle>
            <CardDescription>
              请填写您的年度收入和扣除信息，系统将自动计算最优方案
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <Label htmlFor="specialAdditional" className="text-slate-700">
                  专项附加扣除（年累计）
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                  <Input
                    id="specialAdditional"
                    type="number"
                    placeholder="例如：24000"
                    value={specialAdditional}
                    onChange={(e) => setSpecialAdditional(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-slate-500">子女教育、房贷利息、赡养老人等</p>
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
                <p className="text-xs text-slate-500">企业年金、商业健康保险等</p>
              </div>

              <div className="space-y-2 flex items-end">
                <Button 
                  onClick={handleCalculate}
                  className="w-full h-10"
                  size="lg"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  计算最优方案
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <p className="text-sm text-slate-500">预计总税额</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency(best.totalTax)}</p>
                        </div>
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
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* 详细对比 */}
            <Tabs defaultValue="comparison" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="comparison">方案对比</TabsTrigger>
                <TabsTrigger value="details">计算详情</TabsTrigger>
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
                            {result.savings > 0 && (
                              <Badge variant="secondary" className="text-green-600 bg-green-50">
                                <TrendingDown className="w-3 h-3 mr-1" />
                                省 {formatCurrency(result.savings)}
                              </Badge>
                            )}
                            {result.savings === 0 && index > 0 && (
                              <Badge variant="secondary" className="text-slate-500">
                                基准方案
                              </Badge>
                            )}
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
                      <CardTitle className="text-lg">单独计税详情</CardTitle>
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
                      <CardTitle className="text-lg">并入综合所得详情</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">年度总收入</span>
                        <span className="font-medium">{formatCurrency(parsedValues.annualSalary + parsedValues.bonus)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">基本减除费用</span>
                        <span className="font-medium">{formatCurrency(60000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">三险一金</span>
                        <span className="font-medium">{formatCurrency(parsedValues.socialInsurance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">专项附加扣除</span>
                        <span className="font-medium">{formatCurrency(parsedValues.specialAdditional)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">其他扣除</span>
                        <span className="font-medium">{formatCurrency(parsedValues.otherDeductions)}</span>
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
                            <tr className="border-b">
                              <th className="text-left py-2">级数</th>
                              <th className="text-left py-2">月均应纳税所得额</th>
                              <th className="text-left py-2">税率</th>
                              <th className="text-left py-2">速算扣除数</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyTaxRateTable.map((rate, index) => (
                              <tr key={index} className="border-b last:border-0">
                                <td className="py-2">{index + 1}</td>
                                <td className="py-2">
                                  {index === 0 ? `不超过${formatNumber(rate.limit)}元` : 
                                   rate.limit === Infinity ? `超过${formatNumber(monthlyTaxRateTable[index-1].limit)}元` :
                                   `超过${formatNumber(monthlyTaxRateTable[index-1].limit)}元至${formatNumber(rate.limit)}元`}
                                </td>
                                <td className="py-2">{(rate.rate * 100).toFixed(0)}%</td>
                                <td className="py-2">{formatNumber(rate.deduction)}</td>
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
                            <tr className="border-b">
                              <th className="text-left py-2">级数</th>
                              <th className="text-left py-2">年度应纳税所得额</th>
                              <th className="text-left py-2">税率</th>
                              <th className="text-left py-2">速算扣除数</th>
                            </tr>
                          </thead>
                          <tbody>
                            {annualTaxRateTable.map((rate, index) => (
                              <tr key={index} className="border-b last:border-0">
                                <td className="py-2">{index + 1}</td>
                                <td className="py-2">
                                  {index === 0 ? `不超过${formatNumber(rate.limit)}元` : 
                                   rate.limit === Infinity ? `超过${formatNumber(annualTaxRateTable[index-1].limit)}元` :
                                   `超过${formatNumber(annualTaxRateTable[index-1].limit)}元至${formatNumber(rate.limit)}元`}
                                </td>
                                <td className="py-2">{(rate.rate * 100).toFixed(0)}%</td>
                                <td className="py-2">{formatNumber(rate.deduction)}</td>
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
                    输入您的年度工资薪金、年终奖金以及各项扣除信息
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h3 className="font-semibold">智能计算分析</h3>
                  <p className="text-sm text-slate-600">
                    系统自动计算单独计税、并入综合所得等多种方案的税负
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h3 className="font-semibold">获取最优方案</h3>
                  <p className="text-sm text-slate-600">
                    查看推荐方案，了解如何合法节税，做出最优选择
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
