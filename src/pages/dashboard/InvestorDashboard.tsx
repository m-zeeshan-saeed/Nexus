import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  MessageCircle,
  Filter,
  Search,
  PlusCircle,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { EntrepreneurCard } from "../../components/entrepreneur/EntrepreneurCard";
import { WalletCard } from "../../components/dashboard/WalletCard";
import { TransactionHistory } from "../../components/dashboard/TransactionHistory";
import {
  DepositModal,
  WithdrawModal,
  TransferModal,
} from "../../components/dashboard/PaymentModals";
import { useAuth } from "../../context/AuthContext";
import { Entrepreneur, Meeting, Transaction } from "../../types";
import api from "../../services/api";
import dashboardService, {
  DashboardSummary,
} from "../../services/dashboardService";
import paymentService from "../../services/paymentService";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // Modal states
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          // Fetch summary stats
          const summaryData = await dashboardService.getSummary();
          setSummary(summaryData);

          // Fetch entrepreneurs for directory from API
          const entrepreneursRes = await api.get("/directory/entrepreneurs");
          setEntrepreneurs(entrepreneursRes.data);

          // Fetch wallet data
          const [balanceData, transactionsData] = await Promise.all([
            paymentService.getBalance(),
            paymentService.getTransactions(),
          ]);
          setBalance(balanceData);
          setTransactions(transactionsData);
        } catch (error) {
          console.error("Failed to fetch investor dashboard data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
    window.addEventListener("payment-updated", fetchData);
    return () => window.removeEventListener("payment-updated", fetchData);
  }, [user]);

  const handleDeposit = async (amount: number, method?: string) => {
    setIsPaymentLoading(true);
    try {
      const res = await paymentService.deposit(amount, method);
      setBalance(res.balance);
      setTransactions([res.transaction, ...transactions]);
      toast.success(res.message);
      setIsDepositOpen(false);
    } catch {
      toast.error("Deposit failed");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleWithdraw = async (amount: number, method?: string) => {
    setIsPaymentLoading(true);
    try {
      const res = await paymentService.withdraw(amount, method);
      setBalance(res.balance);
      setTransactions([res.transaction, ...transactions]);
      toast.success(res.message);
      setIsWithdrawOpen(false);
    } catch {
      toast.error("Withdrawal failed");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleTransfer = async (amount: number, data?: string) => {
    try {
      if (!data) return;
      setIsPaymentLoading(true);
      const { recipientId, description } = JSON.parse(data);
      const res = await paymentService.transfer(
        recipientId,
        amount,
        description,
      );
      setBalance(res.balance);
      setTransactions([res.transaction, ...transactions]);
      toast.success(res.message);
      setIsTransferOpen(false);
    } catch {
      toast.error("Transfer failed");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  if (!user) return null;

  // Filter entrepreneurs based on search and industry filters
  const filteredEntrepreneurs = entrepreneurs.filter((entrepreneur) => {
    const matchesSearch =
      searchQuery === "" ||
      entrepreneur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.startupName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      entrepreneur.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.pitchSummary
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesIndustry =
      selectedIndustries.length === 0 ||
      selectedIndustries.includes(entrepreneur.industry);

    return matchesSearch && matchesIndustry;
  });

  const industries = Array.from(new Set(entrepreneurs.map((e) => e.industry)));

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prevSelected) =>
      prevSelected.includes(industry)
        ? prevSelected.filter((i) => i !== industry)
        : [...prevSelected, industry],
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.name}
          </h1>
          <p className="text-gray-600">
            Discover and connect with innovative startups
          </p>
        </div>

        <Link to="/entrepreneurs">
          <Button leftIcon={<PlusCircle size={18} />}>View All Startups</Button>
        </Link>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Users size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">
                  Total Startups
                </p>
                <h3 className="text-xl font-semibold text-primary-900">
                  {summary?.totalStartups || 0}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <MessageCircle size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">
                  New Messages
                </p>
                <h3 className="text-xl font-semibold text-secondary-900">
                  {summary?.unreadMessages || 0}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Users size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">
                  Connections
                </p>
                <h3 className="text-xl font-semibold text-accent-900">
                  {summary?.totalConnections || 0}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-success-50 border border-success-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <Calendar size={20} className="text-success-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-success-700">Upcoming</p>
                <h3 className="text-xl font-semibold text-success-900">
                  {summary?.upcomingMeetings || 0}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WalletCard
            balance={balance}
            onDeposit={() => setIsDepositOpen(true)}
            onWithdraw={() => setIsWithdrawOpen(true)}
            onTransfer={() => setIsTransferOpen(true)}
          />
        </div>
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Transactions
            </h2>
            <Link
              to="/transactions"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View All
            </Link>
          </div>
          <TransactionHistory transactions={transactions} loading={isLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Filters and search */}
          <Card>
            <CardBody className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-2/3">
                  <Input
                    placeholder="Search startups, industries, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth
                    startAdornment={<Search size={18} />}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Filter size={18} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Filter by:
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {industries.slice(0, 3).map((industry) => (
                      <Badge
                        key={industry}
                        variant={
                          selectedIndustries.includes(industry)
                            ? "primary"
                            : "gray"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleIndustry(industry)}
                      >
                        {industry}
                      </Badge>
                    ))}
                    {industries.length > 3 && (
                      <Badge variant="gray">
                        +{industries.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Entrepreneurs grid */}
          <div>
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  Recommended Startups
                </h2>
              </CardHeader>

              <CardBody>
                {filteredEntrepreneurs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredEntrepreneurs.slice(0, 4).map((entrepreneur) => (
                      <EntrepreneurCard
                        key={entrepreneur.id}
                        entrepreneur={entrepreneur}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      No startups match your filters
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          {/* Upcoming Meetings List */}
          {summary?.meetings && summary.meetings.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Schedule</h2>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-200">
                  {summary.meetings.map((meeting: Meeting) => (
                    <div
                      key={meeting.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-primary-100 text-primary-700 rounded-md">
                          <span className="text-[10px] font-bold uppercase">
                            {format(parseISO(meeting.startTime), "MMM")}
                          </span>
                          <span className="text-sm font-bold leading-none">
                            {format(parseISO(meeting.startTime), "d")}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 truncate w-32">
                            {meeting.title}
                          </h4>
                          <p className="text-[10px] text-gray-500">
                            {format(parseISO(meeting.startTime), "h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Link to="/meetings">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-[10px]"
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">
                Quick Actions
              </h2>
            </CardHeader>
            <CardBody className="space-y-2">
              <Link to="/entrepreneurs" className="block w-full">
                <Button variant="outline" fullWidth className="justify-start">
                  <Search size={16} className="mr-2" />
                  Browse Startups
                </Button>
              </Link>
              <Link to="/messages" className="block w-full">
                <Button variant="outline" fullWidth className="justify-start">
                  <Clock size={16} className="mr-2" />
                  Recent Messages
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onConfirm={handleDeposit}
        isLoading={isPaymentLoading}
      />
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onConfirm={handleWithdraw}
        balance={balance}
        isLoading={isPaymentLoading}
      />
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onConfirm={handleTransfer}
        balance={balance}
        isLoading={isPaymentLoading}
      />
    </div>
  );
};
