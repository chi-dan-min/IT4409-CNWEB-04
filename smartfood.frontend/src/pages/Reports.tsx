
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const Reports = () => {
  const monthlySpending = [
    { month: "T1", amount: 2500000 },
    { month: "T2", amount: 2800000 },
    { month: "T3", amount: 2300000 },
    { month: "T4", amount: 2900000 },
    { month: "T5", amount: 3200000 },
    { month: "T6", amount: 2750000 },
  ];

  const categorySpending = [
    { name: "Rau củ", value: 800000, color: "#22c55e" },
    { name: "Thịt cá", value: 1200000, color: "#ef4444" },
    { name: "Đồ khô", value: 600000, color: "#f59e0b" },
    { name: "Sữa & trứng", value: 400000, color: "#3b82f6" },
    { name: "Gia vị", value: 200000, color: "#8b5cf6" },
    { name: "Khác", value: 300000, color: "#6b7280" },
  ];

  const wasteData = [
    { week: "Tuần 1", wasted: 50000 },
    { week: "Tuần 2", wasted: 30000 },
    { week: "Tuần 3", wasted: 70000 },
    { week: "Tuần 4", wasted: 40000 },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          Báo cáo & Thống kê
        </h1>
        <p className="text-lg text-gray-600">
          Phân tích chi tiêu và xu hướng tiêu dùng thực phẩm của gia đình
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chi tiêu tháng này</p>
                <p className="text-2xl font-bold text-gray-900">2.750.000đ</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3" />
                  -5% so với tháng trước
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lãng phí tháng này</p>
                <p className="text-2xl font-bold text-gray-900">190.000đ</p>
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% so với tháng trước
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600">⚠️</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Món ăn đã nấu</p>
                <p className="text-2xl font-bold text-gray-900">28</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +3 món so với tháng trước
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">🍽️</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tiết kiệm dự kiến</p>
                <p className="text-2xl font-bold text-gray-900">350.000đ</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  Nhờ kế hoạch bữa ăn
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiêu theo tháng</CardTitle>
            <CardDescription>
              Xu hướng chi tiêu thực phẩm 6 tháng gần đây
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${(value as number).toLocaleString('vi-VN')}đ`, 'Chi tiêu']}
                />
                <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiêu theo danh mục</CardTitle>
            <CardDescription>
              Phân bổ chi tiêu tháng này theo loại thực phẩm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categorySpending}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categorySpending.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${(value as number).toLocaleString('vi-VN')}đ`, 'Chi tiêu']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Waste Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Phân tích lãng phí thực phẩm</CardTitle>
          <CardDescription>
            Theo dõi thực phẩm bị lãng phí theo tuần
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={wasteData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${(value as number).toLocaleString('vi-VN')}đ`, 'Lãng phí']}
              />
              <Line 
                type="monotone" 
                dataKey="wasted" 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết chi tiêu theo danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categorySpending.map((category, index) => {
              const percentage = ((category.value / categorySpending.reduce((total, cat) => total + cat.value, 0)) * 100).toFixed(1);
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{category.value.toLocaleString('vi-VN')}đ</div>
                    <div className="text-sm text-gray-600">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
