import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  specialDeductionConfig, 
  calculateSpecialDeductions, 
  type SpecialDeductionsInput 
} from '@/lib/tax-calculator';
import { 
  Users, 
  Baby, 
  Heart, 
  Home, 
  
  GraduationCap, 
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Calculator
} from 'lucide-react';

interface SpecialDeductionFormProps {
  onChange: (total: number, breakdown: { name: string; amount: number }[]) => void;
  defaultExpanded?: boolean;
}

export function SpecialDeductionForm({ onChange, defaultExpanded = false }: SpecialDeductionFormProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  const [input, setInput] = useState<SpecialDeductionsInput>({
    childEducation: 0,
    infantCare: 0,
    elderlyCare: {
      isOnlyChild: true,
      personalShare: 0,
    },
    housingLoan: false,
    housingRent: {
      hasRent: false,
      tierIndex: 0,
    },
    continuingEducation: {
      degree: false,
      degreeMonths: 12,
      certificate: false,
    },
    seriousIllness: 0,
  });

  const [elderlyExpanded, setElderlyExpanded] = useState(false);
  const [educationExpanded, setEducationExpanded] = useState(false);

  // 计算并通知父组件
  useEffect(() => {
    const result = calculateSpecialDeductions(input);
    onChange(result.total, result.breakdown);
  }, [input, onChange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const result = calculateSpecialDeductions(input);

  return (
    <Card className="border-dashed border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            专项附加扣除
            {result.total > 0 && (
              <Badge variant="secondary" className="ml-2">
                合计 {formatCurrency(result.total)}/年
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* 子女教育 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <Label className="text-sm font-medium">
                子女教育
                <span className="text-xs text-slate-500 ml-2">
                  ({specialDeductionConfig.childEducation.description})
                </span>
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">子女数量:</span>
              <Input
                type="number"
                min={0}
                max={10}
                value={input.childEducation || ''}
                onChange={(e) => setInput(prev => ({ ...prev, childEducation: parseInt(e.target.value) || 0 }))}
                className="w-20 h-8"
                placeholder="0"
              />
              <span className="text-sm text-slate-500">
                {input.childEducation > 0 && `年扣除 ${formatCurrency(input.childEducation * 2000 * 12)}`}
              </span>
            </div>
          </div>

          <Separator />

          {/* 3岁以下婴幼儿照护 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Baby className="w-4 h-4 text-pink-500" />
              <Label className="text-sm font-medium">
                3岁以下婴幼儿照护
                <span className="text-xs text-slate-500 ml-2">
                  ({specialDeductionConfig.infantCare.description})
                </span>
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">婴幼儿数量:</span>
              <Input
                type="number"
                min={0}
                max={10}
                value={input.infantCare || ''}
                onChange={(e) => setInput(prev => ({ ...prev, infantCare: parseInt(e.target.value) || 0 }))}
                className="w-20 h-8"
                placeholder="0"
              />
              <span className="text-sm text-slate-500">
                {input.infantCare > 0 && `年扣除 ${formatCurrency(input.infantCare * 2000 * 12)}`}
              </span>
            </div>
          </div>

          <Separator />

          {/* 赡养老人 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <Label className="text-sm font-medium">赡养老人</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setElderlyExpanded(!elderlyExpanded)}
                className="h-6 px-2 text-xs"
              >
                {elderlyExpanded ? '收起' : '展开'}
              </Button>
            </div>
            
            {elderlyExpanded && (
              <div className="pl-6 space-y-3 bg-slate-50 p-3 rounded-lg">
                <RadioGroup
                  value={input.elderlyCare.isOnlyChild ? 'only' : 'share'}
                  onValueChange={(value) => setInput(prev => ({
                    ...prev,
                    elderlyCare: {
                      ...prev.elderlyCare,
                      isOnlyChild: value === 'only',
                      personalShare: value === 'only' ? 3000 : 1500,
                    }
                  }))}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="only" id="only" />
                    <Label htmlFor="only" className="text-sm cursor-pointer">
                      独生子女 (每月3000元)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="share" id="share" />
                    <Label htmlFor="share" className="text-sm cursor-pointer">
                      非独生子女 (分摊每月3000元)
                    </Label>
                  </div>
                </RadioGroup>
                
                {!input.elderlyCare.isOnlyChild && (
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">您的分摊金额 (元/月)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={3000}
                      value={input.elderlyCare.personalShare || ''}
                      onChange={(e) => setInput(prev => ({
                        ...prev,
                        elderlyCare: {
                          ...prev.elderlyCare,
                          personalShare: parseInt(e.target.value) || 0,
                        }
                      }))}
                      className="w-32 h-8"
                      placeholder="0"
                    />
                    <p className="text-xs text-slate-500">
                      每人分摊额度最高不超过1500元/月
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {input.elderlyCare.isOnlyChild ? (
              <span className="text-sm text-slate-500">年扣除 {formatCurrency(36000)}</span>
            ) : input.elderlyCare.personalShare ? (
              <span className="text-sm text-slate-500">
                年扣除 {formatCurrency(input.elderlyCare.personalShare * 12)}
              </span>
            ) : null}
          </div>

          <Separator />

          {/* 住房相关 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-green-500" />
              <Label className="text-sm font-medium">住房相关 (二选一)</Label>
            </div>
            
            <div className="pl-6 space-y-3">
              {/* 住房贷款利息 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={input.housingLoan}
                    onCheckedChange={(checked) => setInput(prev => ({
                      ...prev,
                      housingLoan: checked,
                      housingRent: { ...prev.housingRent, hasRent: checked ? false : prev.housingRent.hasRent }
                    }))}
                  />
                  <span className="text-sm">首套住房贷款利息</span>
                  <span className="text-xs text-slate-500">(1000元/月)</span>
                </div>
                {input.housingLoan && (
                  <span className="text-sm text-slate-500">年扣除 {formatCurrency(12000)}</span>
                )}
              </div>
              
              {/* 住房租金 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={input.housingRent.hasRent}
                    onCheckedChange={(checked) => setInput(prev => ({
                      ...prev,
                      housingRent: { ...prev.housingRent, hasRent: checked },
                      housingLoan: checked ? false : prev.housingLoan
                    }))}
                  />
                  <span className="text-sm">住房租金</span>
                </div>
                
                {input.housingRent.hasRent && (
                  <RadioGroup
                    value={input.housingRent.tierIndex.toString()}
                    onValueChange={(value) => setInput(prev => ({
                      ...prev,
                      housingRent: { ...prev.housingRent, tierIndex: parseInt(value) }
                    }))}
                    className="pl-6 space-y-1"
                  >
                    {specialDeductionConfig.housingRent.tiers.map((tier, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={index.toString()} id={`rent-${index}`} />
                        <Label htmlFor={`rent-${index}`} className="text-xs cursor-pointer">
                          {tier.label}: {tier.amount}元/月
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                
                {input.housingRent.hasRent && (
                  <span className="text-sm text-slate-500 pl-6">
                    年扣除 {formatCurrency(specialDeductionConfig.housingRent.tiers[input.housingRent.tierIndex].amount * 12)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* 继续教育 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              <Label className="text-sm font-medium">继续教育</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEducationExpanded(!educationExpanded)}
                className="h-6 px-2 text-xs"
              >
                {educationExpanded ? '收起' : '展开'}
              </Button>
            </div>
            
            {educationExpanded && (
              <div className="pl-6 space-y-3 bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={input.continuingEducation.degree}
                    onCheckedChange={(checked) => setInput(prev => ({
                      ...prev,
                      continuingEducation: { ...prev.continuingEducation, degree: checked }
                    }))}
                  />
                  <span className="text-sm">学历(学位)教育</span>
                  <span className="text-xs text-slate-500">(400元/月，最长48个月)</span>
                </div>
                
                {input.continuingEducation.degree && (
                  <div className="pl-6">
                    <Label className="text-xs text-slate-600">教育月数</Label>
                    <Input
                      type="number"
                      min={1}
                      max={48}
                      value={input.continuingEducation.degreeMonths || ''}
                      onChange={(e) => setInput(prev => ({
                        ...prev,
                        continuingEducation: {
                          ...prev.continuingEducation,
                          degreeMonths: parseInt(e.target.value) || 0
                        }
                      }))}
                      className="w-24 h-8 mt-1"
                    />
                    <span className="text-sm text-slate-500 ml-2">
                      扣除 {formatCurrency(400 * input.continuingEducation.degreeMonths)}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={input.continuingEducation.certificate}
                    onCheckedChange={(checked) => setInput(prev => ({
                      ...prev,
                      continuingEducation: { ...prev.continuingEducation, certificate: checked }
                    }))}
                  />
                  <span className="text-sm">职业资格继续教育</span>
                  <span className="text-xs text-slate-500">(取得证书当年3600元)</span>
                </div>
              </div>
            )}
            
            {(input.continuingEducation.degree || input.continuingEducation.certificate) && (
              <span className="text-sm text-slate-500">
                年扣除 {formatCurrency(
                  (input.continuingEducation.degree ? 400 * input.continuingEducation.degreeMonths : 0) +
                  (input.continuingEducation.certificate ? 3600 : 0)
                )}
              </span>
            )}
          </div>

          <Separator />

          {/* 大病医疗 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-red-600" />
              <Label className="text-sm font-medium">
                大病医疗
                <span className="text-xs text-slate-500 ml-2">
                  (据实扣除，限额80000元/年)
                </span>
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">医药费用自付部分:</span>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                <Input
                  type="number"
                  min={0}
                  value={input.seriousIllness || ''}
                  onChange={(e) => setInput(prev => ({ ...prev, seriousIllness: parseInt(e.target.value) || 0 }))}
                  className="w-32 h-8 pl-6"
                  placeholder="0"
                />
              </div>
              <span className="text-xs text-slate-500">
                扣除 {formatCurrency(Math.min(input.seriousIllness, 80000))}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              医保报销后个人负担累计超过15000元的部分可扣除
            </p>
          </div>

          {/* 汇总 */}
          {result.breakdown.length > 0 && (
            <>
              <Separator />
              <div className="bg-primary/5 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">扣除明细</h4>
                <ul className="space-y-1">
                  {result.breakdown.map((item, index) => (
                    <li key={index} className="flex justify-between text-sm">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between mt-2 pt-2 border-t border-primary/20">
                  <span className="font-medium">合计</span>
                  <span className="font-bold text-primary">{formatCurrency(result.total)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
